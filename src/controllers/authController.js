const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { fullName, email, phone, password, role } = req.body;
        const verificationDocument = req.file ? req.file.path : null;

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const user = await User.create({
            fullName,
            email,
            phone,
            password,
            role,
            verificationDocument
        });

        if (user) {
            const token = generateToken(res, user._id); // Generate token and login user immediately
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                token, // Include token in response body
                user: {
                    _id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                    isVerified: user.isVerified
                },
            });
        } else {
            res.status(400).json({ success: false, message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password, role: selectedRole } = req.body;

        // Hardcoded Admin Check
        if (email === 'admin@gmail.com' && password === 'admin123') {
            // Create a dummy admin user object for token generation if not in DB, 
            // or just return success. But to use the middleware, we need a token.
            // Let's check if admin exists in DB, if not create one or handle virtually.
            // For simplicity and robustness, let's treat admin as a special case.
            // Ideally admin should be in DB. Let's see if we can find one.
            let adminUser = await User.findOne({ email: 'admin@gmail.com' });

            if (!adminUser) {
                // Create admin on the fly if not exists (optional, or just mock it)
                // For this specific requirement "Always allow login (even if not in DB)",
                // we need to issue a token that the middleware accepts.
                // Middleware looks up User by ID. So we MUST have a user in DB or change middleware.
                // Best approach: Upsert admin user or create if missing.
                const salt = await require('bcryptjs').genSalt(10);
                const hashedPassword = await require('bcryptjs').hash('admin123', salt);

                adminUser = await User.create({
                    fullName: 'System Admin',
                    email: 'admin@gmail.com',
                    phone: '0000000000',
                    password: hashedPassword, // Store hashed even if we bypass check
                    role: 'admin',
                    isVerified: true
                });
            }

            const token = generateToken(res, adminUser._id);
            return res.json({
                success: true,
                token, // Include token in response body
                user: {
                    _id: adminUser._id,
                    fullName: adminUser.fullName,
                    email: adminUser.email,
                    role: adminUser.role,
                    isVerified: adminUser.isVerified
                }
            });
        }

        const user = await User.findOne({ email }).select('+password');

        if (user && (await user.matchPassword(password))) {
            // Validate that the selected role matches the user's actual role
            if (selectedRole && user.role !== selectedRole) {
                return res.status(403).json({
                    success: false,
                    message: `Invalid credentials. This account is registered as a ${user.role}, not a ${selectedRole}.`
                });
            }

            const token = generateToken(res, user._id);
            res.json({
                success: true,
                token, // Include token in response body
                user: {
                    _id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                    isVerified: user.isVerified
                },
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
    });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getUserProfile = async (req, res) => {
    const user = {
        _id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone,
        isVerified: req.user.isVerified
    };
    res.status(200).json({ success: true, user });
};

// @desc    Send password reset OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        // For security, don't reveal if email exists or not
        if (!user) {
            return res.status(200).json({
                success: true,
                message: 'If an account with that email exists, an OTP has been sent.'
            });
        }

        // Generate OTP
        const otp = user.generateResetOTP();
        await user.save({ validateBeforeSave: false });

        // Send OTP email
        const emailService = require('../utils/emailService');
        await emailService.sendPasswordResetOTP(user.email, user.fullName, otp);

        res.status(200).json({
            success: true,
            message: 'Password reset OTP sent to email'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending password reset email'
        });
    }
};

// @desc    Verify reset OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyResetOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Hash the provided OTP to compare with stored hash
        const crypto = require('crypto');
        const hashedOTP = crypto
            .createHash('sha256')
            .update(otp)
            .digest('hex');

        const user = await User.findOne({
            email,
            resetPasswordOTP: hashedOTP,
            resetPasswordOTPExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        // Generate a temporary verification token (valid for 5 minutes)
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex');

        // Store the verification token temporarily
        user.resetPasswordOTP = hashedToken; // Reuse the OTP field
        user.resetPasswordOTPExpire = Date.now() + 5 * 60 * 1000; // 5 minutes
        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            message: 'OTP verified successfully',
            verificationToken
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying OTP'
        });
    }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    try {
        const { verificationToken, newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Hash the verification token
        const crypto = require('crypto');
        const hashedToken = crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordOTP: hashedToken,
            resetPasswordOTPExpire: { $gt: Date.now() }
        }).select('+password');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }

        // Update password (will be hashed by pre-save hook)
        user.password = newPassword;
        user.resetPasswordOTP = null;
        user.resetPasswordOTPExpire = null;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting password'
        });
    }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new password'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }

        // Get user with password
        const user = await User.findById(req.user.id).select('+password');

        // Verify current password
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Check if new password is same as current password
        const isSamePassword = await user.matchPassword(newPassword);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: 'New password must be different from your current password'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing password'
        });
    }
};

// @desc    Get user settings
// @route   GET /api/auth/settings
// @access  Private
const getSettings = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: {
                notificationPreferences: user.notificationPreferences,
                isActive: user.isActive,
                email: user.email,
                fullName: user.fullName
            }
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching settings'
        });
    }
};

// @desc    Update notification preferences
// @route   PUT /api/auth/settings/notifications
// @access  Private
const updateNotificationPreferences = async (req, res) => {
    try {
        const { email, sms, push, consultationReminders } = req.body;

        const user = await User.findById(req.user.id);

        // Update notification preferences
        if (email !== undefined) user.notificationPreferences.email = email;
        if (sms !== undefined) user.notificationPreferences.sms = sms;
        if (push !== undefined) user.notificationPreferences.push = push;
        if (consultationReminders !== undefined) user.notificationPreferences.consultationReminders = consultationReminders;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Notification preferences updated',
            data: user.notificationPreferences
        });
    } catch (error) {
        console.error('Update notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating notification preferences'
        });
    }
};

// @desc    Deactivate account
// @route   PUT /api/auth/account/deactivate
// @access  Private
const deactivateAccount = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        user.isActive = false;
        user.deactivatedAt = Date.now();
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Account deactivated successfully'
        });
    } catch (error) {
        console.error('Deactivate account error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deactivating account'
        });
    }
};

// @desc    Delete account
// @route   DELETE /api/auth/account
// @access  Private
const deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide your password to confirm deletion'
            });
        }

        // Get user with password
        const user = await User.findById(req.user.id).select('+password');

        // Verify password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Incorrect password'
            });
        }

        // Delete user
        await User.findByIdAndDelete(req.user.id);

        // Clear cookie
        res.cookie('jwt', '', {
            httpOnly: true,
            expires: new Date(0),
        });

        res.status(200).json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting account'
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getUserProfile,
    forgotPassword,
    verifyResetOTP,
    resetPassword,
    changePassword,
    getSettings,
    updateNotificationPreferences,
    deactivateAccount,
    deleteAccount,
};
