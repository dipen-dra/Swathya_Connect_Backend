const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    pharmacyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    medicineName: {
        type: String,
        required: true
    },
    genericName: {
        type: String,
        default: ''
    },
    manufacturer: {
        type: String,
        default: ''
    },
    dosage: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 0
    },
    reservedStock: {
        type: Number,
        default: 0,
        min: 0
    },
    price: {
        type: Number,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    category: {
        type: String,
        required: true,
        default: 'otc'
    },
    image: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    lowStockThreshold: {
        type: Number,
        default: 10
    }
}, {
    timestamps: true
});

// Index for faster queries
inventorySchema.index({ pharmacyId: 1, medicineName: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);
