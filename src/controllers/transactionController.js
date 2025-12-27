const Consultation = require('../models/Consultation');
const MedicineOrder = require('../models/MedicineOrder');

// @desc    Get all transactions for a patient (Consultations & Medicine Orders)
// @route   GET /api/transactions/patient
// @access  Private (Patient only)
exports.getPatientTransactions = async (req, res) => {
    try {
        const patientId = req.user.id;

        // 1. Fetch Consultations (Paid or Completed)
        // We consider 'upcoming' as well if they are paid.
        const consultations = await Consultation.find({
            patientId,
            paymentStatus: { $in: ['paid', 'refunded'] }
        })
            .populate('doctorId', 'name email') // Fallback if doctorName is missing
            .lean();

        // 2. Fetch Medicine Orders (Paid or Delivered)
        const medicineOrders = await MedicineOrder.find({
            patientId,
            paymentStatus: { $in: ['paid', 'refunded'] }
        })
            .populate('pharmacyId', 'fullName email profileImage')
            .lean();

        // 3. Normalize Data
        const normalizedConsultations = consultations.map(c => ({
            id: c._id,
            date: c.date || c.createdAt, // Consultation date or creation date
            type: 'consultation',
            subType: c.type, // video, audio, chat
            amount: c.fee,
            status: c.paymentStatus,
            paymentMethod: c.paymentMethod,
            referenceName: c.doctorName || (c.doctorId ? `Dr. ${c.doctorId.name}` : 'Doctor'),
            referenceImage: c.doctorImage,
            details: {
                specialty: c.specialty,
                time: c.time,
                status: c.status // consultation status (upcoming, completed, etc)
            },
            invoiceReady: true // Can generate invoice
        }));

        const normalizedOrders = medicineOrders.map(o => ({
            id: o._id,
            date: o.paidAt || o.createdAt,
            type: 'medicine_order',
            subType: 'ecommerce',
            amount: o.totalAmount,
            status: o.paymentStatus,
            paymentMethod: o.paymentMethod, // esewa, khalti
            referenceName: o.pharmacyId?.fullName || 'Pharmacy',
            referenceImage: o.pharmacyId?.profileImage,
            details: {
                itemCount: o.medicines.length,
                deliveryStatus: o.status // order status (preparing, delivered, etc)
            },
            invoiceData: {
                subtotal: o.subtotal,
                deliveryCharges: o.deliveryCharges,
                discountAmount: o.discountAmount,
                promoCode: o.promoCode,
                items: o.medicines,
                deliveryAddress: o.deliveryAddress
            },
            invoiceReady: true
        }));

        // 4. Merge and Sort (Newest first)
        const allTransactions = [...normalizedConsultations, ...normalizedOrders].sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });

        res.json({
            success: true,
            count: allTransactions.length,
            data: allTransactions
        });

    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error fetching transactions'
        });
    }
};
