const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add doctor name']
    },
    specialty: {
        type: String,
        required: [true, 'Please add specialty']
    },
    experience: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviewCount: {
        type: Number,
        default: 0
    },
    consultationFee: {
        type: Number,
        required: [true, 'Please add consultation fee']
    },
    availability: {
        type: String,
        default: 'Available'
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    consultationTypes: {
        type: [String],
        enum: ['video', 'audio', 'chat'],
        default: ['video', 'audio', 'chat']
    },
    image: {
        type: String,
        default: null
    },
    description: {
        type: String,
        default: ''
    },
    location: {
        type: String,
        default: ''
    },
    hours: {
        type: String,
        default: ''
    },
    patients: {
        type: Number,
        default: 0
    },
    qualifications: {
        type: [String],
        default: []
    },
    languages: {
        type: [String],
        default: ['English', 'Nepali']
    }
}, {
    timestamps: true
});

// Create indexes for search
doctorSchema.index({ specialty: 1 });
doctorSchema.index({ name: 'text', specialty: 'text' });
doctorSchema.index({ rating: -1 });

module.exports = mongoose.model('Doctor', doctorSchema);
