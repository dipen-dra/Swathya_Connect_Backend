const cron = require('node-cron');
const Consultation = require('../models/Consultation');
const { sendConsultationExpiredEmail } = require('./emailService');

/**
 * Check for expired consultations and update their status
 * Runs every 5 minutes
 */
const checkExpiredConsultations = async () => {
    try {
        const now = new Date();

        // Check 1: Find approved consultations that are 30+ minutes past scheduled time
        const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

        const consultationsToExpire = await Consultation.find({
            status: 'approved',
            expiryStage: null,
            date: { $lte: thirtyMinutesAgo }
        }).populate('patientId doctorId');

        for (const consultation of consultationsToExpire) {
            consultation.expiryStage = 'expired';
            consultation.expiredAt = now;
            await consultation.save();

            console.log(`✅ Consultation ${consultation._id} marked as expired`);
        }

        // Check 2: Find expired consultations that are 6+ hours old
        const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

        const consultationsToPermanentlyExpire = await Consultation.find({
            expiryStage: 'expired',
            expiredAt: { $lte: sixHoursAgo }
        }).populate('patientId doctorId');

        for (const consultation of consultationsToPermanentlyExpire) {
            consultation.expiryStage = 'permanently_expired';
            await consultation.save();

            // Send refund email (only if patient and doctor data exists)
            if (consultation.patientId && consultation.doctorId) {
                try {
                    await sendConsultationExpiredEmail(
                        consultation.patientId,
                        consultation.doctorId,
                        consultation
                    );
                    console.log(`✅ Refund email sent for consultation ${consultation._id}`);
                } catch (emailError) {
                    console.error(`❌ Error sending refund email for ${consultation._id}:`, emailError);
                }
            } else {
                console.log(`⚠️ Skipping email for ${consultation._id} - missing patient or doctor data`);
            }

            console.log(`✅ Consultation ${consultation._id} permanently expired`);
        }

        if (consultationsToExpire.length > 0 || consultationsToPermanentlyExpire.length > 0) {
            console.log(`📊 Expiry check: ${consultationsToExpire.length} expired, ${consultationsToPermanentlyExpire.length} permanently expired`);
        }
    } catch (error) {
        console.error('❌ Error checking expired consultations:', error);
    }
};

/**
 * Start the consultation expiry checker
 * Runs every 5 minutes
 */
const startConsultationExpiryChecker = () => {
    // Run every 5 minutes
    cron.schedule('*/5 * * * *', () => {
        console.log('🔍 Running consultation expiry check...');
        checkExpiredConsultations();
    });

    console.log('✅ Consultation expiry checker started (runs every 5 minutes)');

    // Run immediately on startup
    checkExpiredConsultations();
};

module.exports = {
    startConsultationExpiryChecker,
    checkExpiredConsultations
};
