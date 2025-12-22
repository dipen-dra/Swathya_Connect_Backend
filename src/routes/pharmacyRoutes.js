const express = require('express');
const router = express.Router();
const {
    getPharmacies,
    getPharmacy,
    createPharmacy,
    updatePharmacy,
    getOrders,
    getStats,
    updateOrderStatus,
    createOrder,
    getInventory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem
} = require('../controllers/pharmacyController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.route('/')
    .get(getPharmacies)
    .post(createPharmacy);

router.route('/:id')
    .get(getPharmacy)
    .put(updatePharmacy);

// Order management routes
router.get('/dashboard/orders', protect, authorize('pharmacy'), getOrders);
router.get('/dashboard/stats', protect, authorize('pharmacy'), getStats);
router.put('/dashboard/orders/:id/status', protect, authorize('pharmacy'), updateOrderStatus);
router.post('/dashboard/orders/create', protect, authorize('patient'), createOrder);

const uploadMedicine = require('../config/medicineUpload');

// Inventory management routes
router.get('/dashboard/inventory', protect, authorize('pharmacy'), getInventory);
router.post('/dashboard/inventory', protect, authorize('pharmacy'), uploadMedicine.single('image'), addInventoryItem);
router.put('/dashboard/inventory/:id', protect, authorize('pharmacy'), uploadMedicine.single('image'), updateInventoryItem);
router.delete('/dashboard/inventory/:id', protect, authorize('pharmacy'), deleteInventoryItem);

module.exports = router;
