const Consultation = require('../models/Consultation');
const MedicineReminder = require('../models/MedicineReminder');

// @desc    Get dashboard statistics
// @route   GET /api/stats/dashboard
// @access  Private
exports.getDashboardStats = async (req, res) => {
    try {
        // Get total consultations count
        const totalConsultations = await Consultation.countDocuments({
            patientId: req.user.id
        });

        // Get active reminders count
        const activeReminders = await MedicineReminder.countDocuments({
            userId: req.user.id,
            isActive: true
        });

        // Get completed consultations with prescriptions
        const totalPrescriptions = await Consultation.countDocuments({
            patientId: req.user.id,
            status: 'completed',
            prescription: { $exists: true, $ne: '' }
        });

        // Calculate average rating given by user
        const consultationsWithRatings = await Consultation.find({
            patientId: req.user.id,
            rating: { $exists: true, $ne: null }
        });

        let avgRating = 0;
        if (consultationsWithRatings.length > 0) {
            const totalRating = consultationsWithRatings.reduce((sum, c) => sum + c.rating, 0);
            avgRating = (totalRating / consultationsWithRatings.length).toFixed(1);
        }

        // Get this month's consultations for comparison
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const firstDayOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);

        const thisMonthConsultations = await Consultation.countDocuments({
            patientId: req.user.id,
            createdAt: { $gte: firstDayOfMonth }
        });

        const lastMonthConsultations = await Consultation.countDocuments({
            patientId: req.user.id,
            createdAt: { $gte: firstDayOfLastMonth, $lt: firstDayOfMonth }
        });

        const consultationChange = lastMonthConsultations > 0
            ? Math.round(((thisMonthConsultations - lastMonthConsultations) / lastMonthConsultations) * 100)
            : thisMonthConsultations > 0 ? 100 : 0;

        // Get yesterday's active reminders for comparison
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const yesterdayReminders = await MedicineReminder.countDocuments({
            userId: req.user.id,
            isActive: true,
            createdAt: { $lt: yesterday }
        });

        const reminderChange = yesterdayReminders > 0
            ? Math.round(((activeReminders - yesterdayReminders) / yesterdayReminders) * 100)
            : activeReminders > 0 ? 100 : 0;

        res.status(200).json({
            success: true,
            data: {
                totalConsultations: {
                    value: totalConsultations,
                    change: consultationChange,
                    changeText: 'than last month'
                },
                activeReminders: {
                    value: activeReminders,
                    change: reminderChange,
                    changeText: 'than yesterday'
                },
                totalPrescriptions: {
                    value: totalPrescriptions,
                    change: 0,
                    changeText: 'this week'
                },
                avgRating: {
                    value: avgRating,
                    change: 0,
                    changeText: 'from last rating'
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
