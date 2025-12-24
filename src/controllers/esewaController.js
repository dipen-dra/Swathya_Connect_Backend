const crypto = require('crypto');
const Consultation = require('../models/Consultation');
const User = require('../models/User');
const Inventory = require('../models/Inventory');
const { sendConsultationConfirmation } = require('../utils/emailService');
const { generateBookingId, storePendingBooking, getPendingBooking, deletePendingBooking } = require('../utils/pendingBookings');

const ESEWA_URL = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
const ESEWA_SCD = 'EPAYTEST';
const ESEWA_SECRET = '8gBm/:&EnhH.1/q';

// @desc    Initiate eSewa payment
// @route   POST /api/payment/esewa/initiate
// @access  Private
exports.initiateEsewaPayment = async (req, res) => {
    try {
        const { bookingData } = req.body;

        if (!bookingData) {
            return res.status(400).json({ success: false, message: 'Booking data is required' });
        }

        // Validate booking data
        const { doctorId, date, time, type, reason, fee } = bookingData;
        if (!doctorId || !date || !time || !type || !fee) {
            return res.status(400).json({ success: false, message: 'Missing required booking information' });
        }

        // Generate unique booking ID
        const bookingId = generateBookingId();

        // Store booking data temporarily
        storePendingBooking(bookingId, {
            ...bookingData,
            patientId: req.user.id
        });

        const amountToPay = fee.toString();
        const signedFieldNames = 'total_amount,transaction_uuid,product_code';
        const signatureBaseString = `total_amount=${amountToPay},transaction_uuid=${bookingId},product_code=${ESEWA_SCD}`;

        const hmac = crypto.createHmac('sha256', ESEWA_SECRET);
        hmac.update(signatureBaseString);
        const signature = hmac.digest('base64');

        const esewaData = {
            amount: amountToPay,
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/esewa/success`,
            failure_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/esewa/failure`,
            product_delivery_charge: '0',
            product_service_charge: '0',
            product_code: ESEWA_SCD,
            signature,
            signed_field_names: signedFieldNames,
            tax_amount: '0',
            total_amount: amountToPay,
            transaction_uuid: bookingId,
        };

        res.json({ success: true, data: { ...esewaData, ESEWA_URL } });
    } catch (error) {
        console.error('Error in initiateEsewaPayment:', error);
        res.status(500).json({ success: false, message: 'Server Error while initiating payment' });
    }
};

// @desc    Verify eSewa payment
// @route   POST /api/payment/esewa/verify
// @access  Private
exports.verifyEsewaPayment = async (req, res) => {
    try {
        const { data } = req.query;

        if (!data) {
            return res.status(400).json({ success: false, message: 'No data provided for verification' });
        }

        const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));

        if (decodedData.status !== 'COMPLETE') {
            return res.status(400).json({
                success: false,
                message: `Payment not complete. Status: ${decodedData.status}`
            });
        }

        // Verify with eSewa server
        const verificationUrl = `https://rc-epay.esewa.com.np/api/epay/transaction/status/?product_code=${decodedData.product_code}&total_amount=${decodedData.total_amount}&transaction_uuid=${decodedData.transaction_uuid}`;

        const response = await fetch(verificationUrl);
        const verificationResponse = await response.json();

        if (verificationResponse.status === 'COMPLETE') {
            const bookingId = decodedData.transaction_uuid;

            // Retrieve pending booking data
            const bookingData = getPendingBooking(bookingId);

            if (!bookingData) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking data not found or expired. Please try booking again.'
                });
            }

            // Get doctor information
            const doctorUser = await User.findById(bookingData.doctorId);
            if (!doctorUser) {
                deletePendingBooking(bookingId);
                return res.status(404).json({
                    success: false,
                    message: 'Doctor not found'
                });
            }

            // Get doctor profile for additional details
            const Profile = require('../models/Profile');
            const doctorProfile = await Profile.findOne({ userId: bookingData.doctorId });

            // Create consultation with paid status
            const consultation = await Consultation.create({
                patientId: bookingData.patientId,
                doctorId: bookingData.doctorId,
                doctorName: doctorUser.fullName || doctorUser.name ||
                    (doctorProfile ? `${doctorProfile.firstName} ${doctorProfile.lastName}`.trim() : doctorUser.email),
                specialty: doctorProfile?.specialty || 'General Physician',
                doctorImage: doctorProfile?.profileImage || '',
                date: bookingData.date,
                time: bookingData.time,
                type: bookingData.type,
                fee: bookingData.fee,
                reason: bookingData.reason || '',
                status: 'upcoming',
                paymentStatus: 'paid',
                paymentMethod: 'eSewa'
            });

            // Delete pending booking data
            deletePendingBooking(bookingId);

            // Send confirmation email
            try {
                const user = await User.findById(bookingData.patientId);
                if (user && user.email) {
                    await sendConsultationConfirmation(user.email, user.name, {
                        doctorName: consultation.doctorName,
                        specialty: consultation.specialty,
                        date: consultation.date,
                        time: consultation.time,
                        type: consultation.type,
                        fee: consultation.fee,
                        paymentMethod: 'eSewa',
                        consultationId: consultation._id
                    });
                }
            } catch (emailError) {
                console.error('Failed to send confirmation email:', emailError);
                // Don't fail the request if email fails
            }

            res.status(200).json({
                success: true,
                message: 'Payment successful! Your consultation has been booked.',
                data: consultation
            });
        } else {
            res.status(400).json({ success: false, message: 'eSewa payment verification failed' });
        }
    } catch (error) {
        console.error('Error in verifyEsewaPayment:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Server error during verification.' });
        }
    }
};


// Medicine Order Payment Functions
const MedicineOrder = require('../models/MedicineOrder');
const { generateOrderId, storePendingOrder, getPendingOrder, deletePendingOrder } = require('../utils/pendingOrders');

// @desc    Initiate eSewa payment for medicine order
// @route   POST /api/payment/esewa/initiate-medicine
// @access  Private
exports.initiateEsewaMedicine = async (req, res) => {
    try {
        const { orderData } = req.body;
        if (!orderData) {
            return res.status(400).json({ success: false, message: 'Order data is required' });
        }

        // Extract the actual order from the nested structure
        const actualOrder = orderData.orderDetails || orderData;
        const orderId = generateOrderId();

        // Store the actual order ID for later update
        storePendingOrder(orderId, {
            orderId: actualOrder._id || orderData.orderId,
            patientId: req.user.id
        });

        const amount = (actualOrder.totalAmount || orderData.amount).toString();
        const tax_amount = '0';
        const total_amount = amount;
        const transaction_uuid = orderId;
        const product_code = ESEWA_SCD;
        const product_service_charge = '0';
        const product_delivery_charge = '0';
        const success_url = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/esewa-medicine-success`;
        const failure_url = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/esewa-medicine-failure`;
        const signed_field_names = 'total_amount,transaction_uuid,product_code';
        const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
        const signature = crypto.createHmac('sha256', ESEWA_SECRET).update(message).digest('base64');

        res.status(200).json({
            success: true,
            data: {
                ESEWA_URL,
                amount,
                tax_amount,
                total_amount,
                transaction_uuid,
                product_code,
                product_service_charge,
                product_delivery_charge,
                success_url,
                failure_url,
                signed_field_names,
                signature
            }
        });
    } catch (error) {
        console.error('Error initiating eSewa medicine payment:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Verify eSewa payment for medicine order
// @route   GET /api/payment/esewa/verify-medicine
// @access  Public
exports.verifyEsewaMedicine = async (req, res) => {
    try {
        const { data } = req.query;
        if (!data) {
            return res.status(400).json({ success: false, message: 'Payment data is required' });
        }
        const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
        const { transaction_uuid, total_amount, status } = decodedData;
        if (status !== 'COMPLETE') {
            return res.status(400).json({ success: false, message: 'Payment not completed' });
        }
        // Retrieve order data from pending storage
        const orderData = getPendingOrder(transaction_uuid);

        if (!orderData) {
            return res.status(404).json({ success: false, message: 'Order data not found or expired' });
        }

        // Find and update the existing medicine order
        const order = await MedicineOrder.findByIdAndUpdate(
            orderData.orderId,
            {
                paymentStatus: 'paid',
                paymentMethod: 'esewa',
                paymentTransactionId: transaction_uuid,
                paidAt: new Date(),
                paidAmount: total_amount,
                status: 'paid'
            },
            { new: true }
        );

        if (!order) {
            deletePendingOrder(transaction_uuid);
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Reduce inventory stock and release reserved stock
        try {
            for (const med of order.medicines) {
                if (med.inventoryId) {
                    const inventoryItem = await Inventory.findById(med.inventoryId);
                    if (inventoryItem) {
                        // Reduce actual stock
                        inventoryItem.quantity = Math.max(0, inventoryItem.quantity - med.quantity);
                        // Release reserved stock
                        inventoryItem.reservedStock = Math.max(0, inventoryItem.reservedStock - med.quantity);
                        await inventoryItem.save();
                    }
                }
            }
        } catch (inventoryError) {
            console.error('⚠️ Error updating inventory (non-critical):', inventoryError);
        }

        // Delete from pending storage
        deletePendingOrder(transaction_uuid);

        console.log('✅ Medicine order payment updated via eSewa:', order._id);
        res.status(200).json({
            success: true,
            message: 'Payment verified successfully! Your order has been placed.',
            data: order
        });
    } catch (error) {
        console.error('Error verifying eSewa medicine payment:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = {
    initiateEsewaPayment: exports.initiateEsewaPayment,
    verifyEsewaPayment: exports.verifyEsewaPayment,
    initiateEsewaMedicine: exports.initiateEsewaMedicine,
    verifyEsewaMedicine: exports.verifyEsewaMedicine
};
