const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory for prescriptions
const prescriptionDir = path.join(__dirname, '../../uploads/prescriptions');
if (!fs.existsSync(prescriptionDir)) {
    fs.mkdirSync(prescriptionDir, { recursive: true });
}

// Configure storage for prescriptions
const prescriptionStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, prescriptionDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename: prescription-timestamp-randomstring.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'prescription-' + uniqueSuffix + ext);
    }
});

// File filter for prescriptions (images only)
const prescriptionFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only image files (PNG, JPG, WEBP) and PDF files are allowed for prescriptions.'), false);
    }
};

// Create multer instance for prescriptions
const uploadPrescription = multer({
    storage: prescriptionStorage,
    fileFilter: prescriptionFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit for prescriptions
    }
});

module.exports = uploadPrescription;
