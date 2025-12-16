const Consultation = require('../models/Consultation');
const MedicineReminder = require('../models/MedicineReminder');

// @desc    Get dashboard statistics
// @route   GET /api/stats/dashboard
// @access  Private
exports.getDashboardStats = async (req, res) => {
    try {
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const firstDayOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);

        // 1. Total Consultations (all time)
        const totalConsultations = await Consultation.countDocuments({
            patientId: req.user.id
        });

        const thisMonthConsultations = await Consultation.countDocuments({
            patientId: req.user.id,
            createdAt: { $gte: firstDayOfMonth }
        });

        const lastMonthConsultations = await Consultation.countDocuments({
            patientId: req.user.id,
            createdAt: { $gte: firstDayOfLastMonth, $lt: firstDayOfMonth }
        });

        const totalConsultationsChange = lastMonthConsultations > 0
            ? Math.round(((thisMonthConsultations - lastMonthConsultations) / lastMonthConsultations) * 100)
            : thisMonthConsultations > 0 ? 100 : 0;

        // 2. Upcoming Appointments (status: upcoming, scheduled, pending, or approved)
        // Count consultations that are not completed, cancelled, or rejected
        const upcomingAppointments = await Consultation.countDocuments({
            patientId: req.user.id,
            status: { $in: ['upcoming', 'scheduled', 'pending', 'approved'] }
        });

        const lastMonthUpcoming = await Consultation.countDocuments({
            patientId: req.user.id,
            status: { $in: ['upcoming', 'scheduled', 'pending', 'approved'] },
            createdAt: { $gte: firstDayOfLastMonth, $lt: firstDayOfMonth }
        });

        const upcomingChange = lastMonthUpcoming > 0
            ? Math.round(((upcomingAppointments - lastMonthUpcoming) / lastMonthUpcoming) * 100)
            : upcomingAppointments > 0 ? 100 : 0;

        // 3. Completed Consultations (status: completed)
        const completedConsultations = await Consultation.countDocuments({
            patientId: req.user.id,
            status: 'completed'
        });

        const thisMonthCompleted = await Consultation.countDocuments({
            patientId: req.user.id,
            status: 'completed',
            createdAt: { $gte: firstDayOfMonth }
        });

        const lastMonthCompleted = await Consultation.countDocuments({
            patientId: req.user.id,
            status: 'completed',
            createdAt: { $gte: firstDayOfLastMonth, $lt: firstDayOfMonth }
        });

        const completedChange = lastMonthCompleted > 0
            ? Math.round(((thisMonthCompleted - lastMonthCompleted) / lastMonthCompleted) * 100)
            : thisMonthCompleted > 0 ? 100 : 0;

        // 4. Total Spent (sum of all consultation fees + medicine orders)
        const consultationsWithFees = await Consultation.find({
            patientId: req.user.id,
            fee: { $exists: true, $ne: null }
        });

        const consultationSpent = consultationsWithFees.reduce((sum, c) => sum + (c.fee || 0), 0);

        // Get medicine orders
        const MedicineOrder = require('../models/MedicineOrder');
        const paidMedicineOrders = await MedicineOrder.find({
            patientId: req.user.id,
            paymentStatus: 'paid'
        });

        const medicineOrderSpent = paidMedicineOrders.reduce((sum, order) => sum + (order.paidAmount || order.totalAmount || 0), 0);

        const totalSpent = consultationSpent + medicineOrderSpent;

        const thisMonthConsultationsWithFees = await Consultation.find({
            patientId: req.user.id,
            fee: { $exists: true, $ne: null },
            createdAt: { $gte: firstDayOfMonth }
        });

        const lastMonthConsultationsWithFees = await Consultation.find({
            patientId: req.user.id,
            fee: { $exists: true, $ne: null },
            createdAt: { $gte: firstDayOfLastMonth, $lt: firstDayOfMonth }
        });

        const thisMonthMedicineOrders = await MedicineOrder.find({
            patientId: req.user.id,
            paymentStatus: 'paid',
            paidAt: { $gte: firstDayOfMonth }
        });

        const lastMonthMedicineOrders = await MedicineOrder.find({
            patientId: req.user.id,
            paymentStatus: 'paid',
            paidAt: { $gte: firstDayOfLastMonth, $lt: firstDayOfMonth }
        });

        const thisMonthSpent = thisMonthConsultationsWithFees.reduce((sum, c) => sum + (c.fee || 0), 0) +
            thisMonthMedicineOrders.reduce((sum, order) => sum + (order.paidAmount || order.totalAmount || 0), 0);

        const lastMonthSpent = lastMonthConsultationsWithFees.reduce((sum, c) => sum + (c.fee || 0), 0) +
            lastMonthMedicineOrders.reduce((sum, order) => sum + (order.paidAmount || order.totalAmount || 0), 0);

        const spentChange = lastMonthSpent > 0
            ? Math.round(((thisMonthSpent - lastMonthSpent) / lastMonthSpent) * 100)
            : thisMonthSpent > 0 ? 100 : 0;

        // Also include active reminders for backward compatibility
        const activeReminders = await MedicineReminder.countDocuments({
            userId: req.user.id,
            isActive: true
        });

        res.status(200).json({
            success: true,
            data: {
                totalConsultations: {
                    value: totalConsultations,
                    change: totalConsultationsChange,
                    changeText: 'from last month'
                },
                upcomingAppointments: {
                    value: upcomingAppointments,
                    change: upcomingChange,
                    changeText: 'from last month'
                },
                completedConsultations: {
                    value: completedConsultations,
                    change: completedChange,
                    changeText: 'from last month'
                },
                totalSpent: {
                    value: totalSpent,
                    change: spentChange,
                    changeText: 'from last month'
                },
                // Legacy fields for backward compatibility
                activeReminders: {
                    value: activeReminders,
                    change: 0,
                    changeText: 'active now'
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
