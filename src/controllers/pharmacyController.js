const Pharmacy = require('../models/Pharmacy');
const Profile = require('../models/Profile');
const User = require('../models/User');

// Helper function to calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance; // Returns distance in kilometers
}

// @desc    Get all pharmacies
// @route   GET /api/pharmacies
// @access  Public
exports.getPharmacies = async (req, res) => {
    try {
        const { search, sort, userLat, userLon } = req.query;

        // Build query - ONLY show approved pharmacies (matching doctor pattern)
        let query = {
            verificationStatus: 'approved'
        };

        // Search by name
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } }
            ];
        }

        // Execute query and populate user details
        let pharmacies = await Profile.find(query).populate('userId', 'fullName email role');

        // Filter to ensure only pharmacy role profiles
        pharmacies = pharmacies.filter(p => p.userId && p.userId.role === 'pharmacy');

        // Parse user coordinates
        const userLatitude = parseFloat(userLat) || 27.7172; // Kathmandu default
        const userLongitude = parseFloat(userLon) || 85.3240;

        // Transform pharmacies data with distance calculation
        const transformedPharmacies = pharmacies.map(pharmacy => {
            // Extract pharmacy coordinates from profile or use default
            const pharmacyLat = pharmacy.latitude || 27.7172;
            const pharmacyLon = pharmacy.longitude || 85.3240;

            // Calculate actual distance
            const distance = calculateDistance(userLatitude, userLongitude, pharmacyLat, pharmacyLon);

            // Calculate delivery time based on distance (more granular)
            let deliveryTime;
            if (distance < 1) {
                deliveryTime = '5-10 min';
            } else if (distance < 2) {
                deliveryTime = '10-20 min';
            } else if (distance < 3) {
                deliveryTime = '15-25 min';
            } else if (distance < 4) {
                deliveryTime = '20-30 min';
            } else if (distance < 5) {
                deliveryTime = '25-35 min';
            } else if (distance < 7) {
                deliveryTime = '30-40 min';
            } else if (distance < 10) {
                deliveryTime = '35-50 min';
            } else {
                deliveryTime = '45-60 min';
            }

            return {
                id: pharmacy._id,
                userId: pharmacy.userId._id,
                name: `${pharmacy.firstName} ${pharmacy.lastName}`.trim() || pharmacy.userId.fullName,
                address: pharmacy.address || 'Not specified',
                city: pharmacy.city || 'Kathmandu',
                phone: pharmacy.phoneNumber || 'Not specified',
                rating: 4.5, // Can be enhanced with real ratings later
                distance: distance.toFixed(1), // Distance in km with 1 decimal
                distanceValue: distance, // For sorting
                deliveryTime: deliveryTime,
                isOpen: true,
                specialties: ['Prescription Medicines', 'OTC Drugs', 'Health Products'],
                panNumber: pharmacy.panNumber || '',
                licenseNumber: pharmacy.pharmacyLicenseNumber || ''
            };
        });

        // Sort by distance (nearest first) by default, or by rating if specified
        let sortedPharmacies = transformedPharmacies;
        if (sort === 'rating') {
            sortedPharmacies = transformedPharmacies.sort((a, b) => b.rating - a.rating);
        } else {
            sortedPharmacies = transformedPharmacies.sort((a, b) => a.distanceValue - b.distanceValue);
        }

        res.status(200).json({
            success: true,
            count: sortedPharmacies.length,
            data: sortedPharmacies
        });
    } catch (error) {
        console.error('Error in getPharmacies:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get single pharmacy
// @route   GET /api/pharmacies/:id
// @access  Public
exports.getPharmacy = async (req, res) => {
    try {
        const pharmacy = await Pharmacy.findById(req.params.id);

        if (!pharmacy) {
            return res.status(404).json({
                success: false,
                message: 'Pharmacy not found'
            });
        }

        res.status(200).json({
            success: true,
            data: pharmacy
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Create pharmacy
// @route   POST /api/pharmacies
// @access  Private/Admin
exports.createPharmacy = async (req, res) => {
    try {
        const pharmacy = await Pharmacy.create(req.body);

        res.status(201).json({
            success: true,
            data: pharmacy
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Failed to create pharmacy',
            error: error.message
        });
    }
};

// @desc    Update pharmacy
// @route   PUT /api/pharmacies/:id
// @access  Private/Admin
exports.updatePharmacy = async (req, res) => {
    try {
        const pharmacy = await Pharmacy.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!pharmacy) {
            return res.status(404).json({
                success: false,
                message: 'Pharmacy not found'
            });
        }

        res.status(200).json({
            success: true,
            data: pharmacy
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Failed to update pharmacy',
            error: error.message
        });
    }
};

// ============ ORDER MANAGEMENT ============

const Order = require('../models/Order');

// @desc    Get all orders for pharmacy
// @route   GET /api/pharmacy/orders
// @access  Private/Pharmacy
exports.getOrders = async (req, res) => {
    try {
        const orders = await Order.find({ pharmacyId: req.user.id })
            .populate('patientId', 'fullName email phone')
            .sort({ orderDate: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching orders'
        });
    }
};

// @desc    Get order statistics
// @route   GET /api/pharmacy/stats
// @access  Private/Pharmacy
exports.getStats = async (req, res) => {
    try {
        const pharmacyId = req.user.id;

        // Total orders
        const totalOrders = await Order.countDocuments({ pharmacyId });

        // Pending orders
        const pendingOrders = await Order.countDocuments({
            pharmacyId,
            status: 'pending'
        });

        // This month revenue
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const thisMonthOrders = await Order.find({
            pharmacyId,
            status: 'completed',
            completedDate: { $gte: startOfMonth }
        });

        const thisMonthRevenue = thisMonthOrders.reduce((sum, order) => sum + order.totalAmount, 0);

        // Active customers (unique patients who ordered this month)
        const activeCustomers = await Order.distinct('patientId', {
            pharmacyId,
            orderDate: { $gte: startOfMonth }
        });

        res.status(200).json({
            success: true,
            data: {
                totalOrders,
                pendingOrders,
                thisMonthRevenue,
                activeCustomers: activeCustomers.length
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics'
        });
    }
};

// @desc    Update order status
// @route   PUT /api/pharmacy/orders/:id/status
// @access  Private/Pharmacy
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Verify pharmacy owns this order
        if (order.pharmacyId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this order'
            });
        }

        order.status = status;
        if (status === 'completed') {
            order.completedDate = Date.now();
        }

        await order.save();

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating order status'
        });
    }
};

// @desc    Create new order (for patients)
// @route   POST /api/pharmacy/orders
// @access  Private/Patient
exports.createOrder = async (req, res) => {
    try {
        const { pharmacyId, medicines, prescriptionRequired, prescriptionImage, totalAmount } = req.body;

        // Verify pharmacy exists
        const pharmacy = await User.findById(pharmacyId);
        if (!pharmacy || pharmacy.role !== 'pharmacy') {
            return res.status(404).json({
                success: false,
                message: 'Pharmacy not found'
            });
        }

        const order = await Order.create({
            patientId: req.user.id,
            patientName: req.user.fullName,
            pharmacyId,
            medicines,
            prescriptionRequired,
            prescriptionImage,
            totalAmount
        });

        res.status(201).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating order'
        });
    }
};

// ============ INVENTORY MANAGEMENT ============

const Inventory = require('../models/Inventory');

// @desc    Get all inventory items for pharmacy
// @route   GET /api/pharmacy/inventory
// @access  Private/Pharmacy
exports.getInventory = async (req, res) => {
    try {
        const inventory = await Inventory.find({ pharmacyId: req.user.id })
            .sort({ medicineName: 1 });

        res.status(200).json({
            success: true,
            count: inventory.length,
            data: inventory
        });
    } catch (error) {
        console.error('Get inventory error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching inventory'
        });
    }
};

// @desc    Add medicine to inventory
// @route   POST /api/pharmacy/inventory
// @access  Private/Pharmacy
exports.addInventoryItem = async (req, res) => {
    try {
        const { medicineName, genericName, manufacturer, dosage, quantity, price, expiryDate, category, lowStockThreshold } = req.body;

        const inventoryItem = await Inventory.create({
            pharmacyId: req.user.id,
            medicineName,
            genericName,
            manufacturer,
            dosage,
            quantity,
            price,
            expiryDate,
            category,
            lowStockThreshold
        });

        res.status(201).json({
            success: true,
            data: inventoryItem
        });
    } catch (error) {
        console.error('Add inventory item error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding inventory item'
        });
    }
};

// @desc    Update inventory item
// @route   PUT /api/pharmacy/inventory/:id
// @access  Private/Pharmacy
exports.updateInventoryItem = async (req, res) => {
    try {
        const item = await Inventory.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }

        // Verify pharmacy owns this item
        if (item.pharmacyId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this item'
            });
        }

        const updatedItem = await Inventory.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: updatedItem
        });
    } catch (error) {
        console.error('Update inventory item error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating inventory item'
        });
    }
};

// @desc    Delete inventory item
// @route   DELETE /api/pharmacy/inventory/:id
// @access  Private/Pharmacy
exports.deleteInventoryItem = async (req, res) => {
    try {
        const item = await Inventory.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }

        // Verify pharmacy owns this item
        if (item.pharmacyId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this item'
            });
        }

        await Inventory.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Inventory item deleted successfully'
        });
    } catch (error) {
        console.error('Delete inventory item error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting inventory item'
        });
    }
};
