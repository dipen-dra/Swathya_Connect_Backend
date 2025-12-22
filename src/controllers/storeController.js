const Inventory = require('../models/Inventory');
const Pharmacy = require('../models/User'); // Assuming Pharmacy is a User role

/**
 * @desc    Get all public products with filtering and pagination
 * @route   GET /api/store/products
 * @access  Public
 */
exports.getPublicProducts = async (req, res) => {
    try {
        const { search, category, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;

        // Base query - only public items and available stock
        const query = {
            isPublic: true,
            quantity: { $gt: 0 } // Only show in-stock items
        };

        // Search filter
        if (search) {
            query.$or = [
                { medicineName: { $regex: search, $options: 'i' } },
                { genericName: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Category filter
        if (category && category !== 'all') {
            query.category = category;
        }

        // Price filter
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        // Sorting
        let sortOption = { createdAt: -1 }; // Default: Newest first
        if (sort === 'price_asc') sortOption = { price: 1 };
        if (sort === 'price_desc') sortOption = { price: -1 };
        if (sort === 'name_asc') sortOption = { medicineName: 1 };

        // Pagination
        const skip = (page - 1) * limit;

        const products = await Inventory.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(Number(limit))
            .populate('pharmacyId', 'firstName lastName pharmacyName location'); // Get pharmacy details

        const total = await Inventory.countDocuments(query);

        res.status(200).json({
            success: true,
            count: products.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: Number(page),
            data: products
        });

    } catch (error) {
        console.error('Error fetching store products:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products'
        });
    }
};

/**
 * @desc    Get single product details
 * @route   GET /api/store/products/:id
 * @access  Public
 */
exports.getProductDetails = async (req, res) => {
    try {
        const product = await Inventory.findById(req.params.id)
            .populate('pharmacyId', 'firstName lastName pharmacyName location');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if public (optional: you might want to allow viewing direct links even if hidden, but sticking to logic)
        if (!product.isPublic) {
            return res.status(404).json({
                success: false,
                message: 'Product is not available'
            });
        }

        res.status(200).json({
            success: true,
            data: product
        });

    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product details'
        });
    }
};
