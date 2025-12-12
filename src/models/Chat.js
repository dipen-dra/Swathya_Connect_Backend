const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    pharmacyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastMessage: {
        type: String,
        default: ''
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    unreadCount: {
        patient: {
            type: Number,
            default: 0
        },
        pharmacy: {
            type: Number,
            default: 0
        }
    },
    status: {
        type: String,
        enum: ['active', 'archived'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Indexes for performance
chatSchema.index({ patientId: 1, pharmacyId: 1 }, { unique: true });
chatSchema.index({ lastMessageAt: -1 });
chatSchema.index({ status: 1 });

// Virtual populate for messages
chatSchema.virtual('messages', {
    ref: 'Message',
    localField: '_id',
    foreignField: 'chatId'
});

module.exports = mongoose.model('Chat', chatSchema);
