const crypto = require('crypto');
const Consultation = require('../models/Consultation');

const ESEWA_URL = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
const ESEWA_SCD = 'EPAYTEST';
const ESEWA_SECRET = '8gBm/:&EnhH.1/q';

// @desc    Initiate eSewa payment
// @route   POST /api/payment/esewa/initiate
// @access  Private
exports.initiateEsewaPayment = async (req, res) => {
    try {
        const { consultationId } = req.body;
        const consultation = await Consultation.findById(consultationId);

        if (!consultation) {
            return res.status(404).json({ success: false, message: 'Consultation not found' });
        }

        if (consultation.patientId.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        const amountToPay = consultation.fee.toString();
        const signedFieldNames = 'total_amount,transaction_uuid,product_code';
        const signatureBaseString = `total_amount=${amountToPay},transaction_uuid=${consultationId},product_code=${ESEWA_SCD}`;

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
            transaction_uuid: consultationId,
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
            const consultation = await Consultation.findById(decodedData.transaction_uuid);

            if (!consultation) {
                return res.status(404).json({ success: false, message: 'Consultation not found after payment.' });
            }

            // Update consultation payment status
            consultation.paymentStatus = 'paid';
            consultation.paymentMethod = 'eSewa';
            await consultation.save();

            res.status(200).json({
                success: true,
                message: 'Payment successful!',
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

module.exports = {
    initiateEsewaPayment: exports.initiateEsewaPayment,
    verifyEsewaPayment: exports.verifyEsewaPayment
};
