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
    cancelOrder
} = require('../controllers/medicineOrderController');
const { protect, authorize } = require('../middleware/auth');
const uploadPrescription = require('../config/prescriptionUpload');

// Patient routes
router.post('/', protect, authorize('patient'), uploadPrescription.single('prescription'), createMedicineOrder);
router.get('/', protect, authorize('patient'), getPatientOrders);
router.put('/:id/cancel', protect, authorize('patient'), cancelOrder);

// Pharmacy routes
router.get('/pharmacy', protect, authorize('pharmacy'), getPharmacyOrders);
router.put('/:id/verify', protect, authorize('pharmacy'), verifyPrescription);
router.put('/:id/reject', protect, authorize('pharmacy'), rejectPrescription);
router.put('/:id/status', protect, authorize('pharmacy'), updateOrderStatus);

// Shared routes (both patient and pharmacy)
router.get('/:id', protect, getOrderById);

module.exports = router;
