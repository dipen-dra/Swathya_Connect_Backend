const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory for medicines
const medicineDir = path.join(__dirname, '../../uploads/medicines');
if (!fs.existsSync(medicineDir)) {
    fs.mkdirSync(medicineDir, { recursive: true });
}

// Configure storage for medicines
const medicineStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, medicineDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename: medicine-timestamp-randomstring.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'medicine-' + uniqueSuffix + ext);
    }
});

// File filter for medicines (images only)
const medicineFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only image files (PNG, JPG, WEBP, GIF) are allowed for medicines.'), false);
    }
};

// Create multer instance for medicines
const uploadMedicine = multer({
    storage: medicineStorage,
    fileFilter: medicineFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

module.exports = uploadMedicine;
