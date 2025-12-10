const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    phone: {
        type: String,
        required: [true, 'Please add a phone number']
    },
    whatsappNumber: {
        type: String,
        default: null,
        validate: {
            validator: function (v) {
                // If provided, must be in international format (+countrycode...)
                if (!v) return true;
                return /^\+\d{10,15}$/.test(v);
            },
            message: 'WhatsApp number must be in international format (e.g., +9779812345678)'
        }
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ['patient', 'doctor', 'pharmacy', 'admin'],
        default: 'patient'
    },
    verificationDocument: {
        type: String, // Path to the uploaded file
        default: null
    },
    isVerified: {
        type: Boolean,
        default: function () {
            // Patients are auto-verified, others need manual verification (logic can be adjusted)
            // For now, let's say everyone is verified except maybe doctors/pharmacies if we had an admin panel to approve them.
            // Based on prompt, we just need to register them. Let's default to false for doc/pharmacy if we want to be strict,
            // but for this MVP, let's default to true or handle it in controller.
            // Actually, let's default to false for professional roles to show we support the concept.
            return this.role === 'patient';
        }
    },
    resetPasswordOTP: {
        type: String,
        default: null
    },
    resetPasswordOTPExpire: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password reset OTP
userSchema.methods.generateResetOTP = function () {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP and set to resetPasswordOTP field
    this.resetPasswordOTP = crypto
        .createHash('sha256')
        .update(otp)
        .digest('hex');

    // Set expire to 10 minutes from now
    this.resetPasswordOTPExpire = Date.now() + 10 * 60 * 1000;

    return otp;
};

module.exports = mongoose.model('User', userSchema);
