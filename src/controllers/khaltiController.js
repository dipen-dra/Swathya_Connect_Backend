const Consultation = require('../models/Consultation');
const User = require('../models/User');
const Inventory = require('../models/Inventory');
const { sendConsultationConfirmation } = require('../utils/emailService');

const KHALTI_SECRET_KEY = 'test_secret_key_3f78fb6364ef4bd1b5fc670ce33a06f5';

// @desc    Verify Khalti payment
// @route   POST /api/payment/khalti/verify
// @access  Private
exports.verifyKhaltiPayment = async (req, res) => {
    try {
        const { token, amount, bookingData } = req.body;

        if (!token || !amount || !bookingData) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: token, amount, or bookingData'
            });
        }

        // Verify payment with Khalti
        const verificationUrl = 'https://khalti.com/api/v2/payment/verify/';

        const response = await fetch(verificationUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Key ${KHALTI_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token, amount })
        });

        const verificationData = await response.json();

        if (verificationData.idx) {
            // Payment verified successfully
            // Get doctor information
            const doctorUser = await User.findById(bookingData.doctorId);
            if (!doctorUser) {
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
                patientId: req.user.id,
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
                paymentMethod: 'Khalti'
            });

            // Send confirmation email
            try {
                const user = await User.findById(req.user.id);
                if (user && user.email) {
                    await sendConsultationConfirmation(user.email, user.name, {
                        doctorName: consultation.doctorName,
                        specialty: consultation.specialty,
                        date: consultation.date,
                        time: consultation.time,
                        type: consultation.type,
                        fee: consultation.fee,
                        paymentMethod: 'Khalti',
                        consultationId: consultation._id
                    });
                }
            } catch (emailError) {
                console.error('Failed to send confirmation email:', emailError);
                // Don't fail the request if email fails
            }

            res.status(200).json({
                success: true,
                message: 'Payment verified successfully! Your consultation has been booked.',
                data: consultation
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Payment verification failed',
                error: verificationData
            });
        }
    } catch (error) {
        console.error('Error in verifyKhaltiPayment:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during payment verification',
            error: error.message
        });
    }
};

// Medicine Order Payment Function
const MedicineOrder = require('../models/MedicineOrder');

// @desc    Verify Khalti payment for medicine order
// @route   POST /api/payment/khalti/verify-medicine
// @access  Private
exports.verifyKhaltiMedicine = async (req, res) => {
    try {
        const { token, amount, orderData } = req.body;

        if (!token || !amount || !orderData) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: token, amount, or orderData'
            });
        }

        // Verify payment with Khalti
        const verificationUrl = 'https://khalti.com/api/v2/payment/verify/';

        const response = await fetch(verificationUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Key ${KHALTI_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token, amount })
        });

        const verificationData = await response.json();

        if (verificationData.idx) {
            // Payment verified successfully - update existing order
            const order = await MedicineOrder.findByIdAndUpdate(
                orderData.orderId,
                {
                    paymentStatus: 'paid',
                    paymentMethod: 'khalti',
                    paymentTransactionId: token,
                    paidAt: new Date(),
                    paidAmount: amount,
                    status: 'paid'
                },
                { new: true }
            );

            if (!order) {
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

            console.log('✅ Medicine order payment updated via Khalti:', order._id);

            res.status(200).json({
                success: true,
                message: 'Payment verified successfully! Your order has been placed.',
                data: order
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Payment verification failed',
                error: verificationData
            });
        }
    } catch (error) {
        console.error('Error in verifyKhaltiMedicine:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during payment verification',
            error: error.message
        });
    }
};

module.exports = {
    verifyKhaltiPayment: exports.verifyKhaltiPayment,
    verifyKhaltiMedicine: exports.verifyKhaltiMedicine
};
