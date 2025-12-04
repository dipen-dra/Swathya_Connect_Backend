const express = require('express');
const router = express.Router();
const {
    getProfile,
    createOrUpdateProfile,
    uploadProfileImage,
    deleteProfileImage
} = require('../controllers/profileController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.route('/')
    .get(protect, getProfile)
    .post(protect, createOrUpdateProfile);

router.route('/image')
    .post(protect, upload.single('profileImage'), uploadProfileImage)
    .delete(protect, deleteProfileImage);

module.exports = router;
