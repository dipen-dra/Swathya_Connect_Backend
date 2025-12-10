const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
    registerUser,
    loginUser,
    logoutUser,
    getUserProfile,
    forgotPassword,
    verifyResetOTP,
    resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/'); // Ensure this directory exists
    },
    filename(req, file, cb) {
        cb(
            null,
            `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
        );
    },
});

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

// Check file type
function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png|pdf|doc|docx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb('Error: Images and Documents Only!');
    }
}

router.post('/register', upload.single('verificationDocument'), registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', protect, getUserProfile);

// Password Reset Routes
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyResetOTP);
router.put('/reset-password', resetPassword);

// Dashboard Routes (Protected & Role Based)
router.get('/admin/dashboard', protect, authorize('admin'), (req, res) => {
    res.json({ success: true, message: 'Admin Dashboard Access Granted' });
});

router.get('/patient/dashboard', protect, authorize('patient'), (req, res) => {
    res.json({ success: true, message: 'Patient Dashboard Access Granted' });
});

router.get('/doctor/dashboard', protect, authorize('doctor'), (req, res) => {
    res.json({ success: true, message: 'Doctor Dashboard Access Granted' });
});

router.get('/pharmacy/dashboard', protect, authorize('pharmacy'), (req, res) => {
    res.json({ success: true, message: 'Pharmacy Dashboard Access Granted' });
});

module.exports = router;
