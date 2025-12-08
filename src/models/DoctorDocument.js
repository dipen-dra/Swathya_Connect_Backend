const mongoose = require('mongoose');

const doctorDocumentSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    documentType: {
        type: String,
        enum: ['license', 'degree', 'certificate', 'other'],
        required: true
    },
    documentName: {
        type: String,
        required: true
    },
    documentUrl: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },
    uploadedAt: {
        type: Date,
        default: Date.now
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
    notes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Create indexes
doctorDocumentSchema.index({ doctorId: 1 });
doctorDocumentSchema.index({ status: 1 });

module.exports = mongoose.model('DoctorDocument', doctorDocumentSchema);
