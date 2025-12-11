const Profile = require('../models/Profile');
const User = require('../models/User');
const DoctorDocument = require('../models/DoctorDocument');

// @desc    Get all pending doctor profiles for review
// @route   GET /api/admin/profiles/pending
// @access  Private/Admin
exports.getPendingProfiles = async (req, res) => {
    try {
        const pendingProfiles = await Profile.find({
            verificationStatus: 'pending',
            submittedForReview: true
        })
            .populate('userId', 'name email')
            .sort({ submittedAt: -1 });

        // Get documents for each profile
        const profilesWithDocuments = await Promise.all(
            pendingProfiles.map(async (profile) => {
                const documents = await DoctorDocument.find({
                    doctorId: profile.userId
                });
                return {
                    ...profile.toObject(),
                    documents
                };
            })
        );

        res.status(200).json({
            success: true,
            count: profilesWithDocuments.length,
            data: profilesWithDocuments
        });
    } catch (error) {
        console.error('Error fetching pending profiles:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get all doctor profiles (all statuses)
// @route   GET /api/admin/profiles/all
// @access  Private/Admin
exports.getAllProfiles = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = {};

        if (status && status !== 'all') {
            filter.verificationStatus = status;
        }

        const profiles = await Profile.find(filter)
            .populate('userId', 'name email role')
            .populate('verifiedBy', 'name email')
            .sort({ createdAt: -1 });

        // Filter only doctor profiles
        const doctorProfiles = profiles.filter(p => p.userId && p.userId.role === 'doctor');

        res.status(200).json({
            success: true,
            count: doctorProfiles.length,
            data: doctorProfiles
        });
    } catch (error) {
        console.error('Error fetching all profiles:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Approve doctor profile
// @route   PUT /api/admin/profiles/:id/approve
// @access  Private/Admin
exports.approveProfile = async (req, res) => {
    try {
        const profile = await Profile.findById(req.params.id);

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        // Update verification status
        profile.verificationStatus = 'approved';
        profile.verifiedBy = req.user.id;
        profile.verifiedAt = Date.now();
        profile.rejectionReason = ''; // Clear any previous rejection reason

        await profile.save();

        // Populate user details for email
        await profile.populate('userId', 'name email');

        // TODO: Send approval email to doctor
        // await sendApprovalEmail(profile.userId.email, profile.userId.name);

        res.status(200).json({
            success: true,
            message: 'Doctor profile approved successfully',
            data: profile
        });
    } catch (error) {
        console.error('Error approving profile:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Reject doctor profile
// @route   PUT /api/admin/profiles/:id/reject
// @access  Private/Admin
exports.rejectProfile = async (req, res) => {
    try {
        const { rejectionReason } = req.body;

        if (!rejectionReason || rejectionReason.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
        }

        const profile = await Profile.findById(req.params.id);

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        // Increment rejection count
        profile.rejectionCount = (profile.rejectionCount || 0) + 1;

        // Update verification status
        profile.verificationStatus = 'rejected';
        profile.rejectionReason = rejectionReason;
        profile.verifiedBy = req.user.id;
        profile.verifiedAt = Date.now();
        profile.submittedForReview = false; // Allow resubmission

        // Auto-suspend if rejected 5 or more times
        if (profile.rejectionCount >= 5) {
            profile.accountSuspended = true;
            // Suspend for 7 days
            const suspensionDate = new Date();
            suspensionDate.setDate(suspensionDate.getDate() + 7);
            profile.suspensionExpiresAt = suspensionDate;
        }

        await profile.save();

        // Populate user details for email
        await profile.populate('userId', 'name email');

        // TODO: Send rejection email to doctor
        // await sendRejectionEmail(profile.userId.email, profile.userId.name, rejectionReason);

        res.status(200).json({
            success: true,
            message: 'Doctor profile rejected',
            data: profile
        });
    } catch (error) {
        console.error('Error rejecting profile:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get verification statistics
// @route   GET /api/admin/stats/verification
// @access  Private/Admin
exports.getVerificationStats = async (req, res) => {
    try {
        const pending = await Profile.countDocuments({ verificationStatus: 'pending', submittedForReview: true });
        const approved = await Profile.countDocuments({ verificationStatus: 'approved' });
        const rejected = await Profile.countDocuments({ verificationStatus: 'rejected' });
        const total = pending + approved + rejected;

        res.status(200).json({
            success: true,
            data: {
                pending,
                approved,
                rejected,
                total
            }
        });
    } catch (error) {
        console.error('Error fetching verification stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get approved profiles
// @route   GET /api/admin/approved-profiles
// @access  Private/Admin
exports.getApprovedProfiles = async (req, res) => {
    try {
        const approvedProfiles = await Profile.find({
            verificationStatus: 'approved'
        })
            .populate('userId', 'name email role')
            .sort({ verifiedAt: -1 });

        res.status(200).json({
            success: true,
            count: approvedProfiles.length,
            data: approvedProfiles
        });
    } catch (error) {
        console.error('Error fetching approved profiles:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get rejected profiles
// @route   GET /api/admin/rejected-profiles
// @access  Private/Admin
exports.getRejectedProfiles = async (req, res) => {
    try {
        const rejectedProfiles = await Profile.find({
            verificationStatus: 'rejected'
        })
            .populate('userId', 'name email role')
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            count: rejectedProfiles.length,
            data: rejectedProfiles
        });
    } catch (error) {
        console.error('Error fetching rejected profiles:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
