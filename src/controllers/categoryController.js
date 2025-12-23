const Category = require('../models/Category');


// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
    try {
        const categories = await Category.find();
        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Admin/Pharmacy)
exports.createCategory = async (req, res, next) => {
    try {
        // Add image path to body if file uploaded
        if (req.file) {
            req.body.image = `/uploads/categories/${req.file.filename}`;
        }

        const category = await Category.create(req.body);

        res.status(201).json({
            success: true,
            data: category
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, error: 'Category already exists' });
        }
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin/Pharmacy)
exports.updateCategory = async (req, res, next) => {
    try {
        let category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }

        if (req.file) {
            req.body.image = `/uploads/categories/${req.file.filename}`;
        }

        category = await Category.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
