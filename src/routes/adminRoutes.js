const express = require('express');
const router = express.Router();
const {
    getPendingProfiles,
    getAllProfiles,
    approveProfile,
    rejectProfile,
    getVerificationStats,
    getApprovedProfiles,
    getRejectedProfiles
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All routes require admin authorization
router.use(protect);
router.use(authorize('admin'));

// Profile verification routes
router.get('/profiles/pending', getPendingProfiles);
router.get('/profiles/all', getAllProfiles);
router.get('/pending-profiles', getPendingProfiles);
router.get('/approved-profiles', getApprovedProfiles);
router.get('/rejected-profiles', getRejectedProfiles);
router.put('/profiles/:id/approve', approveProfile);
router.put('/profiles/:id/reject', rejectProfile);
router.put('/approve/:id', approveProfile);
router.put('/reject/:id', rejectProfile);

// Statistics
router.get('/stats/verification', getVerificationStats);
router.get('/stats', getVerificationStats);

module.exports = router;
