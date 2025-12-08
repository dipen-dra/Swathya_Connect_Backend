const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
    consultationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Consultation',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    medicines: [{
        name: {
            type: String,
            required: true
        },
        dosage: {
            type: String,
            required: true
        },
        frequency: {
            type: String,
            required: true
        },
        duration: {
            type: String,
            required: true
        },
        instructions: {
            type: String,
            default: ''
        }
    }],
    diagnosis: {
        type: String,
        default: ''
    },
    additionalNotes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Create indexes
prescriptionSchema.index({ consultationId: 1 });
prescriptionSchema.index({ doctorId: 1 });
prescriptionSchema.index({ patientId: 1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
