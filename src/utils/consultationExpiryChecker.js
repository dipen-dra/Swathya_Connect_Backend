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
        // We need to combine date and time fields to get the actual scheduled datetime
        const consultationsToCheck = await Consultation.find({
            status: 'approved',
            expiryStage: null
        }).populate('patientId doctorId');

        for (const consultation of consultationsToCheck) {
            // Combine date and time to get actual scheduled datetime
            const scheduledDate = new Date(consultation.date);
            const timeParts = consultation.time.match(/(\d+):(\d+)\s*(AM|PM)/i);

            if (timeParts) {
                let hours = parseInt(timeParts[1]);
                const minutes = parseInt(timeParts[2]);
                const period = timeParts[3].toUpperCase();

                // Convert to 24-hour format
                if (period === 'PM' && hours !== 12) hours += 12;
                if (period === 'AM' && hours === 12) hours = 0;

                scheduledDate.setHours(hours, minutes, 0, 0);

                // LOGIC 1: Both parties joined -> Mark as COMPLETED after duration
                if (consultation.enteredConsultationAt) {
                    const durationMinutes = consultation.type === 'chat' ? 45 : 30;
                    const completionTime = new Date(consultation.enteredConsultationAt.getTime() + durationMinutes * 60 * 1000);

                    if (now >= completionTime) {
                        consultation.status = 'completed';
                        consultation.save();
                        console.log(`✅ Consultation ${consultation._id} marked as COMPLETED (Duration: ${durationMinutes}m)`);
                        continue; // Skip expiry check
                    }
                }

                // LOGIC 2: No-show or partial join -> Mark as EXPIRED after 30 mins from SCHEDULED time
                // Only if NOT actively joined/completed
                if (!consultation.enteredConsultationAt) {
                    const thirtyMinutesAfterScheduled = new Date(scheduledDate.getTime() + 30 * 60 * 1000);

                    if (now >= thirtyMinutesAfterScheduled) {
                        consultation.expiryStage = 'expired';
                        consultation.expiredAt = now;
                        await consultation.save();
                        console.log(`✅ Consultation ${consultation._id} marked as EXPIRED (No-show/Partial)`);
                    }
                }
            }
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


        if (consultationsToCheck.length > 0 || consultationsToPermanentlyExpire.length > 0) {
            console.log(`📊 Expiry check completed: checked ${consultationsToCheck.length} consultations, ${consultationsToPermanentlyExpire.length} permanently expired`);
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
