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
    },
    panNumber: {
        type: String,
        default: ''
    },
    // Doctor-specific fields (optional, only for doctor users)
    specialty: {
        type: String,
        default: ''
    },
    licenseNumber: {
        type: String,
        default: ''
    },
    yearsOfExperience: {
        type: Number,
        default: null
    },
    education: {
        type: String,
        default: ''
    },
    professionalBio: {
        type: String,
        default: ''
    },
    // Doctor Availability & Workplace
    workplace: {
        type: String,
        default: ''
    },
    availabilityDays: {
        type: [String], // Array of days: ['Monday', 'Tuesday', etc.]
        default: []
    },
    availabilityTime: {
        type: String,
        default: '' // e.g., "9:00 AM - 5:00 PM"
    },
    // Consultation Fees by Type
    chatFee: {
        type: Number,
        default: null
    },
    audioFee: {
        type: Number,
        default: null
    },
    videoFee: {
        type: Number,
        default: null
    },
    // Doctor Verification Fields
    verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    verifiedAt: {
        type: Date,
        default: null
    },
    rejectionReason: {
        type: String,
        default: ''
    },
    submittedForReview: {
        type: Boolean,
        default: false
    },
    submittedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Pre-save middleware to normalize gender to lowercase
profileSchema.pre('save', function (next) {
    if (this.gender && this.gender !== '') {
        this.gender = this.gender.toLowerCase();
    }
    next();
});

// Pre-update middleware to normalize gender to lowercase
profileSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate();
    if (update.$set && update.$set.gender && update.$set.gender !== '') {
        update.$set.gender = update.$set.gender.toLowerCase();
    }
    next();
});

// Create index on userId for faster lookups
profileSchema.index({ userId: 1 });

module.exports = mongoose.model('Profile', profileSchema);
