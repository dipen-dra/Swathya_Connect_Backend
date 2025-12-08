const express = require('express');
const router = express.Router();
const {
    getPendingProfiles,
    getAllProfiles,
    approveProfile,
    rejectProfile,
    getVerificationStats
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All routes require admin authorization
router.use(protect);
router.use(authorize('admin'));

// Profile verification routes
router.get('/profiles/pending', getPendingProfiles);
router.get('/profiles/all', getAllProfiles);
router.put('/profiles/:id/approve', approveProfile);
router.put('/profiles/:id/reject', rejectProfile);

// Statistics
router.get('/stats/verification', getVerificationStats);

module.exports = router;
