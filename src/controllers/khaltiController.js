const Consultation = require('../models/Consultation');

const KHALTI_SECRET_KEY = 'test_secret_key_3f78fb6364ef4bd1b5fc670ce33a06f5';

// @desc    Verify Khalti payment
// @route   POST /api/payment/khalti/verify
// @access  Private
exports.verifyKhaltiPayment = async (req, res) => {
    try {
        const { token, amount, consultationId } = req.body;

        if (!token || !amount || !consultationId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: token, amount, or consultationId'
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
            const consultation = await Consultation.findById(consultationId);

            if (!consultation) {
                return res.status(404).json({
                    success: false,
                    message: 'Consultation not found'
                });
            }

            if (consultation.patientId.toString() !== req.user.id) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authorized'
                });
            }

            // Update consultation payment status
            consultation.paymentStatus = 'paid';
            consultation.paymentMethod = 'Khalti';
            await consultation.save();

            res.status(200).json({
                success: true,
                message: 'Payment verified successfully!',
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

module.exports = {
    verifyKhaltiPayment: exports.verifyKhaltiPayment
};
