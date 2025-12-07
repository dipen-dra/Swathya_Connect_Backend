const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    firstName: {
        type: String,
        required: [true, 'Please add a first name']
    },
    lastName: {
        type: String,
        default: ''
    },
    profileImage: {
        type: String,
        default: null
    },
    dateOfBirth: {
        type: Date,
        default: null
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', ''],
        default: ''
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', ''],
        default: ''
    },
    allergies: {
        type: String,
        default: ''
    },
    medicalHistory: {
        type: String,
        default: ''
    },
    emergencyContact: {
        type: String,
        default: ''
    },
    phoneNumber: {
        type: String,
        default: ''
    },
    whatsappNumber: {
        type: String,
        default: '',
        validate: {
            validator: function (v) {
                // If provided, must be in international format (+countrycode...)
                if (!v || v === '') return true;
                return /^\+\d{10,15}$/.test(v.replace(/\s/g, ''));
            },
            message: 'WhatsApp number must be in international format (e.g., +9779812345678)'
        }
    },
    address: {
        type: String,
        default: ''
    },
    city: {
        type: String,
        default: ''
    },
    country: {
        type: String,
        default: 'Nepal'
    }
}, {
    timestamps: true
});

// Create index on userId for faster lookups
profileSchema.index({ userId: 1 });

module.exports = mongoose.model('Profile', profileSchema);
