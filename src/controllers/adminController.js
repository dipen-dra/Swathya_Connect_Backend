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
            .populate('userId', 'name email role')
            .select('+verificationDocument')
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
            .select('+verificationDocument')
            .sort({ verifiedAt: -1 });

        // Fetch doctor documents for each profile (doctors store docs separately)
        const profilesWithDocuments = await Promise.all(
            approvedProfiles.map(async (profile) => {
                const profileObj = profile.toObject();

                // If it's a doctor and doesn't have verificationDocument in Profile
                if (profile.userId?.role === 'doctor' && !profile.verificationDocument) {
                    const documents = await DoctorDocument.find({
                        doctorId: profile.userId._id
                        // Removed status filter - fetch all documents
                    }).sort({ uploadedAt: -1 });

                    // Add the first document URL as verificationDocument
                    if (documents.length > 0) {
                        profileObj.verificationDocument = documents[0].documentUrl;
                    }
                }

                return profileObj;
            })
        );

        res.status(200).json({
            success: true,
            count: profilesWithDocuments.length,
            data: profilesWithDocuments
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
            .select('+verificationDocument')
            .sort({ updatedAt: -1 });

        // Fetch doctor documents for each profile
        const profilesWithDocuments = await Promise.all(
            rejectedProfiles.map(async (profile) => {
                const profileObj = profile.toObject();

                // If it's a doctor and doesn't have verificationDocument in Profile
                if (profile.userId?.role === 'doctor' && !profile.verificationDocument) {
                    const documents = await DoctorDocument.find({
                        doctorId: profile.userId._id
                    }).sort({ uploadedAt: -1 });

                    // Add the first document URL as verificationDocument
                    if (documents.length > 0) {
                        profileObj.verificationDocument = documents[0].documentUrl;
                    }
                }

                return profileObj;
            })
        );

        res.status(200).json({
            success: true,
            count: profilesWithDocuments.length,
            data: profilesWithDocuments
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


// @desc    Get all users with pagination
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            role = 'all',
            status = 'all',
            search = ''
        } = req.query;

        // Build query
        let query = {};

        // First, get user IDs based on role filter
        let userIds = [];
        if (role !== 'all') {
            const users = await User.find({ role }).select('_id');
            userIds = users.map(u => u._id);
            query.userId = { $in: userIds };
        }

        // Status filter
        if (status === 'suspended') {
            query.accountSuspended = true;
        } else if (status === 'active') {
            query.accountSuspended = false;
        }

        // Search filter
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { firstName: searchRegex },
                { lastName: searchRegex }
            ];

            // Also search by email in User collection
            const usersByEmail = await User.find({ email: searchRegex }).select('_id');
            const emailUserIds = usersByEmail.map(u => u._id);

            if (emailUserIds.length > 0) {
                if (query.$or) {
                    query.$or.push({ userId: { $in: emailUserIds } });
                } else {
                    query.userId = { $in: emailUserIds };
                }
            }
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const profiles = await Profile.find(query)
            .populate('userId', 'email role createdAt')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Profile.countDocuments(query);

        res.status(200).json({
            success: true,
            users: profiles,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

