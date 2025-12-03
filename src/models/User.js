const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

module.exports = mongoose.model('User', userSchema);
