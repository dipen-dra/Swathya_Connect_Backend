const Profile = require('../models/Profile');
const User = require('../models/User');
const fs = require('fs').promises;
const path = require('path');

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
exports.getProfile = async (req, res) => {
    try {
        console.log('🔄 Backend: GET /api/profile - User ID:', req.user.id);
        let profile = await Profile.findOne({ userId: req.user.id });

        if (!profile) {
            console.log('⚠️  Backend: No profile found, creating default profile');
            // Create default profile if doesn't exist
            profile = await Profile.create({
                userId: req.user.id,
                firstName: req.user.fullName.split(' ')[0] || '',
                lastName: req.user.fullName.split(' ').slice(1).join(' ') || ''
            });
            console.log('✅ Backend: Default profile created:', profile);
        } else {
            console.log('✅ Backend: Profile found:', profile);
        }

        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error('❌ Backend: Error getting profile:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get user profile by userId
// @route   GET /api/profile/:userId
// @access  Private
exports.getUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log('🔄 Backend: GET /api/profile/:userId - Requested User ID:', userId);

        const profile = await Profile.findOne({ userId }).populate('userId', 'email');

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        console.log('✅ Backend: Profile found for user:', userId);

        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error('❌ Backend: Error getting user profile:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Create or update profile
// @route   POST /api/profile
// @access  Private
exports.createOrUpdateProfile = async (req, res) => {
    try {
        console.log('🔄 Backend: POST /api/profile - User ID:', req.user.id);
        console.log('📝 Backend: Request body:', req.body);

        const {
            firstName,
            lastName,
            dateOfBirth,
            gender,
            bloodGroup,
            allergies,
            medicalHistory,
            emergencyContact,
            phoneNumber,
            whatsappNumber,
            address,
            city,
            country,
            panNumber,
            // Doctor-specific fields
            specialty,
            licenseNumber,
            yearsOfExperience,
            education,
            professionalBio,
            workplace,
            availabilityDays,
            availabilityTime,
            chatFee,
            audioFee,
            videoFee,
            // Pharmacy-specific fields
            pharmacyLicenseNumber
        } = req.body;

        // Build profile object
        const profileFields = {
            userId: req.user.id,
            firstName: firstName || req.user.fullName.split(' ')[0],
            lastName: lastName || req.user.fullName.split(' ').slice(1).join(' '),
            dateOfBirth: dateOfBirth === '' ? null : dateOfBirth, // Convert empty string to null for Date field
            gender,
            bloodGroup,
            allergies,
            medicalHistory,
            emergencyContact,
            phoneNumber,
            whatsappNumber,
            address,
            city,
            country,
            panNumber,
            // Doctor-specific fields
            specialty,
            licenseNumber,
            yearsOfExperience: yearsOfExperience === '' ? null : yearsOfExperience,
            education,
            professionalBio,
            workplace,
            availabilityDays,
            availabilityTime,
            chatFee: chatFee === '' ? null : chatFee,
            audioFee: audioFee === '' ? null : audioFee,
            videoFee: videoFee === '' ? null : videoFee,
            // Pharmacy-specific fields
            pharmacyLicenseNumber
        };

        // Remove undefined fields
        Object.keys(profileFields).forEach(key =>
            profileFields[key] === undefined && delete profileFields[key]
        );

        console.log('📝 Backend: Profile fields to save:', profileFields);

        let profile = await Profile.findOne({ userId: req.user.id });

        if (profile) {
            console.log('🔄 Backend: Updating existing profile');
            // Update
            profile = await Profile.findOneAndUpdate(
                { userId: req.user.id },
                { $set: profileFields },
                { new: true, runValidators: true }
            );
            console.log('✅ Backend: Profile updated:', profile);
        } else {
            console.log('🔄 Backend: Creating new profile');
            // Create
            profile = await Profile.create(profileFields);
            console.log('✅ Backend: Profile created:', profile);
        }

        // Also update the User model to keep data in sync
        const userUpdates = {};

        // Sync whatsappNumber so scheduler can access it
        if (whatsappNumber !== undefined) {
            userUpdates.whatsappNumber = whatsappNumber;
            console.log('✅ Backend: User whatsappNumber synced:', whatsappNumber);
        }

        // Sync fullName from firstName + lastName
        if (firstName !== undefined || lastName !== undefined) {
            const fullName = `${firstName || profile.firstName} ${lastName || profile.lastName}`.trim();
            userUpdates.fullName = fullName;
            console.log('✅ Backend: User fullName synced:', fullName);
        }

        // Update User model if there are any changes
        if (Object.keys(userUpdates).length > 0) {
            await User.findByIdAndUpdate(req.user.id, userUpdates);
        }

        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error('❌ Backend: Error saving profile:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Upload profile image
// @route   POST /api/profile/image
// @access  Private
exports.uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file'
            });
        }

        let profile = await Profile.findOne({ userId: req.user.id });

        if (!profile) {
            // Create profile if doesn't exist
            profile = await Profile.create({
                userId: req.user.id,
                firstName: req.user.fullName.split(' ')[0] || '',
                lastName: req.user.fullName.split(' ').slice(1).join(' ') || ''
            });
        }

        // Delete old image if exists
        if (profile.profileImage) {
            const oldImagePath = path.join(__dirname, '../../', profile.profileImage);
            try {
                await fs.unlink(oldImagePath);
            } catch (err) {
                console.log('Old image not found or already deleted');
            }
        }

        // Update profile with new image path
        profile.profileImage = `/uploads/profiles/${req.file.filename}`;
        await profile.save();

        res.status(200).json({
            success: true,
            data: profile,
            imageUrl: profile.profileImage
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete profile image
// @route   DELETE /api/profile/image
// @access  Private
exports.deleteProfileImage = async (req, res) => {
    try {
        const profile = await Profile.findOne({ userId: req.user.id });

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        if (!profile.profileImage) {
            return res.status(400).json({
                success: false,
                message: 'No profile image to delete'
            });
        }

        // Delete image file
        const imagePath = path.join(__dirname, '../../', profile.profileImage);
        try {
            await fs.unlink(imagePath);
        } catch (err) {
            console.log('Image file not found or already deleted');
        }

        // Remove image path from profile
        profile.profileImage = null;
        await profile.save();

        res.status(200).json({
            success: true,
            message: 'Profile image deleted successfully',
            data: profile
        });
    } catch (error) {
        console.error('Error deleting profile image:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Upload verification document
// @route   POST /api/profile/verification-document
// @access  Private
exports.uploadVerificationDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file'
            });
        }

        const { documentType } = req.body;
        let profile = await Profile.findOne({ userId: req.user.id });

        if (!profile) {
            profile = await Profile.create({
                userId: req.user.id,
                firstName: req.user.fullName.split(' ')[0] || '',
                lastName: req.user.fullName.split(' ').slice(1).join(' ') || ''
            });
        }

        // Delete old verification document if exists
        if (profile.verificationDocument) {
            const oldDocPath = path.join(__dirname, '../../', profile.verificationDocument);
            try {
                await fs.unlink(oldDocPath);
            } catch (err) {
                console.log('Old verification document not found');
            }
        }

        // Update profile with new verification document
        profile.verificationDocument = `/uploads/profiles/${req.file.filename}`;
        if (documentType) {
            profile.verificationDocumentType = documentType;
        }
        await profile.save();

        res.status(200).json({
            success: true,
            data: profile,
            message: 'Verification document uploaded successfully'
        });
    } catch (error) {
        console.error('Error uploading verification document:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};


// @desc    Submit profile for admin review
// @route   POST /api/profile/submit-review
// @access  Private/Doctor/Pharmacy
exports.submitForReview = async (req, res) => {
    try {
        const profile = await Profile.findOne({ userId: req.user.id });

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        // Validate profile completeness based on user role
        let requiredFields = ['firstName', 'lastName'];

        if (req.user.role === 'doctor') {
            requiredFields = [...requiredFields, 'specialty', 'licenseNumber', 'yearsOfExperience', 'chatFee', 'audioFee', 'videoFee'];
        } else if (req.user.role === 'pharmacy') {
            requiredFields = [...requiredFields, 'pharmacyLicenseNumber', 'panNumber'];
        }

        const missingFields = requiredFields.filter(field => !profile[field] || profile[field] === '');

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Please complete all required fields before submitting',
                missingFields
            });
        }

        // Check if verification document is uploaded (required for both doctors and pharmacies)
        // Check both Profile and User models (registration might have saved it to User model)
        if (!profile.verificationDocument || profile.verificationDocument === '') {
            // Check if it exists in User model
            const user = await User.findById(req.user.id);
            if (user && user.verificationDocument) {
                // Copy from User to Profile
                profile.verificationDocument = user.verificationDocument;
                await profile.save();
                console.log('✅ Copied verification document from User to Profile');
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Please upload a verification document before submitting'
                });
            }
        }

        // Check if already submitted or approved
        if (profile.verificationStatus === 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Your profile is already approved'
            });
        }

        if (profile.submittedForReview && profile.verificationStatus === 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Your profile is already under review'
            });
        }

        // Submit for review
        profile.submittedForReview = true;
        profile.submittedAt = Date.now();
        profile.verificationStatus = 'pending';
        profile.rejectionReason = ''; // Clear any previous rejection

        await profile.save();

        res.status(200).json({
            success: true,
            message: 'Profile submitted for review successfully',
            data: profile
        });
    } catch (error) {
        console.error('Error submitting profile for review:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
