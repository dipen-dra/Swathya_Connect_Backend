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

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getUserProfile,
};
