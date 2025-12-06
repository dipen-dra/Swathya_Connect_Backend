const Consultation = require('../models/Consultation');
const User = require('../models/User');
const { sendConsultationConfirmation } = require('../utils/emailService');

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

            // Check if already paid to prevent duplicate emails
            const wasAlreadyPaid = consultation.paymentStatus === 'paid';

            // Update consultation payment status
            consultation.paymentStatus = 'paid';
            consultation.paymentMethod = 'Khalti';
            await consultation.save();

            // Send confirmation email only if this is a new payment
            if (!wasAlreadyPaid) {
                try {
                    const user = await User.findById(consultation.patientId);
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
            }

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
