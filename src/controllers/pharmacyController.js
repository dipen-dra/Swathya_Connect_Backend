const Pharmacy = require('../models/Pharmacy');

// @desc    Get all pharmacies
// @route   GET /api/pharmacies
// @access  Public
exports.getPharmacies = async (req, res) => {
    try {
        const { search, sort } = req.query;

        let query = {};

        // Search by name
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        // Execute query
        let pharmacies = Pharmacy.find(query);

        // Sort
        if (sort === 'rating') {
            pharmacies = pharmacies.sort({ rating: -1 });
        } else {
            pharmacies = pharmacies.sort({ createdAt: -1 });
        }

        pharmacies = await pharmacies;

        res.status(200).json({
            success: true,
            count: pharmacies.length,
            data: pharmacies
        });
    } catch (error) {
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
