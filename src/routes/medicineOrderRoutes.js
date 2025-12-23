const express = require('express');
const router = express.Router();
const {
    createMedicineOrder,
    getPatientOrders,
    getPharmacyOrders,
    getOrderById,
    verifyPrescription,
    rejectPrescription,
    updateOrderStatus,
    cancelOrder,
    confirmPayment
} = require('../controllers/medicineOrderController');
const { protect, authorize } = require('../middleware/auth');
const uploadPrescription = require('../config/prescriptionUpload');

// Patient routes
// Patient routes (Ecommerce accessible to all roles)
router.post('/', protect, authorize('patient', 'doctor', 'pharmacy', 'admin'), uploadPrescription.single('prescription'), createMedicineOrder);
router.get('/', protect, authorize('patient'), getPatientOrders);
router.put('/:id/cancel', protect, authorize('patient'), cancelOrder);
router.put('/:id/confirm-payment', protect, authorize('patient'), confirmPayment);

// Pharmacy routes
router.get('/pharmacy', protect, authorize('pharmacy'), getPharmacyOrders);
router.put('/:id/verify', protect, authorize('pharmacy'), verifyPrescription);
router.put('/:id/reject', protect, authorize('pharmacy'), rejectPrescription);
router.put('/:id/status', protect, authorize('pharmacy'), updateOrderStatus);

// Shared routes (both patient and pharmacy)
router.get('/:id', protect, getOrderById);

module.exports = router;
