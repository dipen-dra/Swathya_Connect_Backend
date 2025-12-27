const mongoose = require('mongoose');

const consultationChatSchema = new mongoose.Schema({
    consultationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Consultation',
        required: true,
        unique: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['waiting', 'active', 'ended'],
        default: 'waiting'
    },
    startedAt: {
        type: Date,
        default: null
    },
    endedAt: {
        type: Date,
        default: null
    },
    startedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    lastMessageAt: {
        type: Date,
        default: null
    },
    // Audio/Video call fields
    agoraChannelName: {
        type: String,
        default: null
    },
    callStartedAt: {
        type: Date,
        default: null
    },
    callEndedAt: {
        type: Date,
        default: null
    },
    callDuration: {
        type: Number, // in seconds
        default: 0
    },
    unreadCount: {
        patient: {
            type: Number,
            default: 0
        },
        doctor: {
            type: Number,
            default: 0
        }
    },
    clearedHistoryAt: {
        patient: {
            type: Date,
            default: null
        },
        doctor: {
            type: Date,
            default: null
        }
    }
}, {
    timestamps: true
});

// Indexes for performance
consultationChatSchema.index({ consultationId: 1 });
consultationChatSchema.index({ patientId: 1, status: 1 });
consultationChatSchema.index({ doctorId: 1, status: 1 });
consultationChatSchema.index({ status: 1, startedAt: -1 });

module.exports = mongoose.model('ConsultationChat', consultationChatSchema);
