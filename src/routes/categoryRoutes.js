const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getCategories, createCategory, updateCategory } = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth'); // Assuming you have these

// Configure Multer for Category Images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../../uploads/categories');
        // Ensure directory exists
        const fs = require('fs');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, 'category-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|webp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Images Only!');
        }
    }
});

// Routes
router.route('/')
    .get(getCategories)
    .post(protect, authorize('admin', 'pharmacy'), upload.single('image'), createCategory); // Allow Admin & Pharmacy to create

router.route('/:id')
    .put(protect, authorize('admin', 'pharmacy'), upload.single('image'), updateCategory);

module.exports = router;
