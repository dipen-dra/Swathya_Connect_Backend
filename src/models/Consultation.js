const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    doctorName: {
        type: String,
        required: true
    },
    specialty: {
        type: String,
        required: true
    },
    doctorImage: {
        type: String,
        default: ''
    },
    date: {
        type: Date,
        required: [true, 'Please add consultation date']
    },
    time: {
        type: String,
        required: [true, 'Please add consultation time']
    },
    type: {
        type: String,
        enum: ['video', 'audio', 'chat'],
        required: [true, 'Please add consultation type']
    },
    status: {
        type: String,
        enum: ['upcoming', 'approved', 'completed', 'cancelled', 'rejected'],
        default: 'upcoming'
    },
    fee: {
        type: Number,
        required: [true, 'Please add consultation fee']
    },
    reason: {
        type: String,
        required: [true, 'Please add reason for consultation']
    },
    notes: {
        type: String,
        default: ''
    },
    prescription: {
        type: String,
        default: ''
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null
    },
    review: {
        type: String,
        maxlength: 500,
        default: ''
    },
    ratedAt: {
        type: Date,
        default: null
    },
    rejectionReason: {
        type: String,
        default: ''
    },
    rejectedAt: {
        type: Date,
        default: null
    },
    refundStatus: {
        type: String,
        enum: ['none', 'pending', 'processing', 'completed'],
        default: 'none'
    },
    refundInitiatedAt: {
        type: Date,
        default: null
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['Khalti', 'eSewa', 'Cash'],
        default: null
    },
    // Expiry tracking fields
    expiryStage: {
        type: String,
        enum: [null, 'expired', 'permanently_expired'],
        default: null
    },
    expiredAt: {
        type: Date,
        default: null
    },
    isReRequest: {
        type: Boolean,
        default: false
    },
    originalConsultationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Consultation',
        default: null
    },
    prescriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescription',
        default: null
    }
}, {
    timestamps: true
});

// Create indexes
consultationSchema.index({ patientId: 1, status: 1 });
consultationSchema.index({ doctorId: 1 });
consultationSchema.index({ date: -1 });

module.exports = mongoose.model('Consultation', consultationSchema);
