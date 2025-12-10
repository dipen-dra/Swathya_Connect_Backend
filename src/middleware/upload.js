const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = ['uploads/profiles/', 'uploads/documents/'];
uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Set storage engine
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Determine destination based on field name
        if (file.fieldname === 'document') {
            cb(null, 'uploads/documents/');
        } else {
            cb(null, 'uploads/profiles/');
        }
    },
    filename: function (req, file, cb) {
        // Create unique filename: userId-timestamp.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Check file type
function checkFileType(file, cb) {
    console.log('📁 Upload middleware - File info:', {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
    });

    // For documents, allow PDF and images
    if (file.fieldname === 'document') {
        const filetypes = /jpeg|jpg|png|gif|pdf/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype) || file.mimetype === 'application/pdf';

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Documents only! (jpeg, jpg, png, gif, pdf)'));
        }
    } else {
        // For profile images, only allow images
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        // More lenient mimetype check - accept image/* mimetypes
        const mimetype = file.mimetype.startsWith('image/');

        console.log('🔍 Image validation:', { extname, mimetype, fileExt: path.extname(file.originalname) });

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Images only! (jpeg, jpg, png, gif)'));
        }
    }
}

// Initialize upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 10000000 }, // 10MB limit for documents
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

module.exports = upload;
