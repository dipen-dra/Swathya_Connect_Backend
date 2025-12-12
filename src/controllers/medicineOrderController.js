const MedicineOrder = require('../models/MedicineOrder');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const fs = require('fs').promises;
const path = require('path');

// @desc    Create medicine order (patient uploads prescription)
// @route   POST /api/medicine-orders
// @access  Private (Patient)
exports.createMedicineOrder = async (req, res) => {
    try {
        const { pharmacyId, deliveryAddress, deliveryNotes } = req.body;

        console.log('📦 Creating medicine order:', {
            patientId: req.user.id,
            pharmacyId,
            file: req.file
        });

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Prescription image is required'
            });
        }

        const prescriptionImage = `/uploads/prescriptions/${req.file.filename}`;

        const order = await MedicineOrder.create({
            patientId: req.user.id,
            pharmacyId,
            prescriptionImage,
            deliveryAddress,
            deliveryNotes,
            status: 'pending_verification'
        });

        await order.populate('pharmacyId', 'fullName email');

        console.log('✅ Medicine order created:', order._id);

        res.status(201).json({
            success: true,
            message: 'Prescription uploaded successfully',
            order
        });
    } catch (error) {
        console.error('❌ Error creating medicine order:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get patient's medicine orders
// @route   GET /api/medicine-orders
// @access  Private (Patient)
exports.getPatientOrders = async (req, res) => {
    try {
        const orders = await MedicineOrder.find({ patientId: req.user.id })
            .populate('pharmacyId', 'fullName email')
            .sort({ createdAt: -1 });

        console.log(`✅ Found ${orders.length} orders for patient ${req.user.id}`);

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        console.error('❌ Error fetching patient orders:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get pharmacy's medicine orders
// @route   GET /api/medicine-orders/pharmacy
// @access  Private (Pharmacy)
exports.getPharmacyOrders = async (req, res) => {
    try {
        const { status } = req.query;

        const query = { pharmacyId: req.user.id };
        if (status) {
            query.status = status;
        }

        const orders = await MedicineOrder.find(query)
            .populate('patientId', 'fullName email')
            .sort({ createdAt: -1 });

        console.log(`✅ Found ${orders.length} orders for pharmacy ${req.user.id}`);

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        console.error('❌ Error fetching pharmacy orders:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get single medicine order
// @route   GET /api/medicine-orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
    try {
        const order = await MedicineOrder.findById(req.params.id)
            .populate('patientId', 'fullName email')
            .populate('pharmacyId', 'fullName email')
            .populate('medicines.inventoryId');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check authorization
        if (order.patientId._id.toString() !== req.user.id &&
            order.pharmacyId._id.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this order'
            });
        }

        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        console.error('❌ Error fetching order:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Verify prescription and create bill
// @route   PUT /api/medicine-orders/:id/verify
// @access  Private (Pharmacy)
exports.verifyPrescription = async (req, res) => {
    try {
        const { medicines, deliveryCharges } = req.body;

        const order = await MedicineOrder.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.pharmacyId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        if (order.status !== 'pending_verification') {
            return res.status(400).json({
                success: false,
                message: 'Order already processed'
            });
        }

        // Process medicines and reserve stock
        const processedMedicines = [];
        for (const med of medicines) {
            const totalPrice = med.quantity * med.pricePerUnit;

            const medicineData = {
                name: med.name,
                dosage: med.dosage,
                quantity: med.quantity,
                pricePerUnit: med.pricePerUnit,
                totalPrice
            };

            // If medicine from inventory, reserve stock
            if (med.inventoryId) {
                const inventoryItem = await Inventory.findById(med.inventoryId);
                if (inventoryItem) {
                    inventoryItem.reservedStock += med.quantity;
                    await inventoryItem.save();
                    medicineData.inventoryId = med.inventoryId;
                }
            }

            processedMedicines.push(medicineData);
        }

        order.medicines = processedMedicines;
        order.deliveryCharges = deliveryCharges || 0;
        order.calculateTotals();
        order.prescriptionVerified = true;
        order.verifiedBy = req.user.id;
        order.verifiedAt = new Date();
        order.updateStatus('awaiting_payment', req.user.id, 'Prescription verified, bill created');

        await order.save();
        await order.populate('patientId', 'fullName email');

        console.log('✅ Prescription verified, bill created for order:', order._id);

        res.status(200).json({
            success: true,
            message: 'Prescription verified and bill sent to patient',
            order
        });
    } catch (error) {
        console.error('❌ Error verifying prescription:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Reject prescription
// @route   PUT /api/medicine-orders/:id/reject
// @access  Private (Pharmacy)
exports.rejectPrescription = async (req, res) => {
    try {
        const { reason } = req.body;

        const order = await MedicineOrder.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.pharmacyId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        order.rejectionReason = reason;
        order.updateStatus('rejected', req.user.id, reason);

        await order.save();

        console.log('❌ Prescription rejected for order:', order._id);

        res.status(200).json({
            success: true,
            message: 'Prescription rejected',
            order
        });
    } catch (error) {
        console.error('❌ Error rejecting prescription:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update order status
// @route   PUT /api/medicine-orders/:id/status
// @access  Private (Pharmacy)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status, notes } = req.body;

        const order = await MedicineOrder.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.pharmacyId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        order.updateStatus(status, req.user.id, notes);
        await order.save();

        console.log(`✅ Order ${order._id} status updated to: ${status}`);

        res.status(200).json({
            success: true,
            message: 'Order status updated',
            order
        });
    } catch (error) {
        console.error('❌ Error updating order status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Cancel order
// @route   PUT /api/medicine-orders/:id/cancel
// @access  Private (Patient)
exports.cancelOrder = async (req, res) => {
    try {
        const order = await MedicineOrder.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.patientId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        // Can only cancel if not paid
        if (order.paymentStatus === 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel paid order'
            });
        }

        // Release reserved stock
        for (const med of order.medicines) {
            if (med.inventoryId) {
                const inventoryItem = await Inventory.findById(med.inventoryId);
                if (inventoryItem) {
                    inventoryItem.reservedStock = Math.max(0, inventoryItem.reservedStock - med.quantity);
                    await inventoryItem.save();
                }
            }
        }

        order.updateStatus('cancelled', req.user.id, 'Cancelled by patient');
        await order.save();

        console.log('🚫 Order cancelled:', order._id);

        res.status(200).json({
            success: true,
            message: 'Order cancelled',
            order
        });
    } catch (error) {
        console.error('❌ Error cancelling order:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    createMedicineOrder,
    getPatientOrders,
    getPharmacyOrders,
    getOrderById,
    verifyPrescription,
    rejectPrescription,
    updateOrderStatus,
    cancelOrder
};
