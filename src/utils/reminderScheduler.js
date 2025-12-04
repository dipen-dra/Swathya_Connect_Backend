const cron = require('node-cron');
const MedicineReminder = require('../models/MedicineReminder');
const User = require('../models/User');
const { sendMedicineReminder } = require('./emailService');

// Check for upcoming reminders every minute
const startReminderScheduler = () => {
    // Run every minute
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            const tenMinutesLater = new Date(now.getTime() + 10 * 60000);

            // Find active reminders that are due in 10 minutes
            const upcomingReminders = await MedicineReminder.find({
                isActive: true,
                emailReminder: true,
                nextReminder: {
                    $gte: now,
                    $lte: tenMinutesLater
                }
            }).populate('userId', 'email fullName');

            if (upcomingReminders.length > 0) {
                console.log(`📧 Found ${upcomingReminders.length} upcoming reminders`);
            }

            // Send email for each reminder
            for (const reminder of upcomingReminders) {
                if (reminder.userId && reminder.userId.email) {
                    await sendMedicineReminder(
                        reminder.userId.email,
                        reminder.userId.fullName,
                        {
                            medicineName: reminder.medicineName,
                            dosage: reminder.dosage,
                            times: reminder.times,
                            instructions: reminder.instructions
                        }
                    );

                    // Update nextReminder to tomorrow at the same time to prevent duplicate emails
                    const nextReminderTime = new Date(reminder.nextReminder);
                    nextReminderTime.setDate(nextReminderTime.getDate() + 1);

                    await MedicineReminder.findByIdAndUpdate(reminder._id, {
                        nextReminder: nextReminderTime
                    });

                    console.log(`✅ Updated next reminder for ${reminder.medicineName} to ${nextReminderTime}`);
                }
            }
        } catch (error) {
            console.error('❌ Reminder scheduler error:', error);
        }
    });

    console.log('✅ Medicine reminder scheduler started (checking every minute)');
};

// Manual check for testing
const checkRemindersNow = async () => {
    try {
        const now = new Date();
        const tenMinutesLater = new Date(now.getTime() + 10 * 60000);

        const upcomingReminders = await MedicineReminder.find({
            isActive: true,
            emailReminder: true,
            nextReminder: {
                $gte: now,
                $lte: tenMinutesLater
            }
        }).populate('userId', 'email fullName');

        console.log(`Found ${upcomingReminders.length} upcoming reminders`);

        for (const reminder of upcomingReminders) {
            console.log(`- ${reminder.medicineName} for ${reminder.userId.fullName} at ${reminder.nextReminder}`);
        }

        return upcomingReminders;
    } catch (error) {
        console.error('Error checking reminders:', error);
        return [];
    }
};

module.exports = {
    startReminderScheduler,
    checkRemindersNow
};
