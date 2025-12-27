const mongoose = require('mongoose');

const consultationMessageSchema = new mongoose.Schema({
    consultationChatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ConsultationChat',
        required: true
    },
    consultationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Consultation',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderRole: {
        type: String,
        enum: ['patient', 'doctor'],
        required: true
    },
    messageType: {
        type: String,
        enum: ['text', 'file', 'system', 'audio'],
        default: 'text'
    },
    content: {
        type: String,
        required: function () {
            return this.messageType === 'text' || this.messageType === 'system';
        }
    },
    fileUrl: {
        type: String,
        default: null
    },
    fileName: {
        type: String,
        default: null
    },
    fileType: {
        type: String,
        default: null
    },
    fileSize: {
        type: Number,
        default: null
    },
    readBy: {
        patient: {
            type: Boolean,
            default: false
        },
        doctor: {
            type: Boolean,
            default: false
        }
    },
    readAt: {
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
consultationMessageSchema.index({ consultationChatId: 1, createdAt: 1 });
consultationMessageSchema.index({ consultationId: 1, createdAt: 1 });
consultationMessageSchema.index({ senderId: 1 });

// Automatically mark message as read by sender
consultationMessageSchema.pre('save', function (next) {
    if (this.isNew) {
        if (this.senderRole === 'patient') {
            this.readBy.patient = true;
            this.readAt.patient = new Date();
        } else if (this.senderRole === 'doctor') {
            this.readBy.doctor = true;
            this.readAt.doctor = new Date();
        }
    }
    next();
});

module.exports = mongoose.model('ConsultationMessage', consultationMessageSchema);
