const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    patientName: {
        type: String,
        required: true
    },
    pharmacyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    medicines: [{
        name: {
            type: String,
            required: true
        },
        dosage: String,
        quantity: {
            type: Number,
            required: true,
            default: 1
        }
    }],
    prescriptionRequired: {
        type: Boolean,
        default: false
    },
    prescriptionImage: {
        type: String,
        default: null
    },
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'cancelled'],
        default: 'pending'
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    completedDate: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Generate order ID before saving
orderSchema.pre('save', async function (next) {
    if (!this.orderId) {
        const count = await mongoose.model('Order').countDocuments();
        this.orderId = `ORD-${String(count + 1).padStart(3, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);
