const mongoose = require('mongoose');

const pharmacySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add pharmacy name']
    },
    address: {
        type: String,
        required: [true, 'Please add address']
    },
    city: {
        type: String,
        default: 'Kathmandu'
    },
    phone: {
        type: String,
        required: [true, 'Please add phone number']
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    distance: {
        type: String,
        default: '0 km'
    },
    deliveryTime: {
        type: String,
        default: '30-45 min'
    },
    isOpen: {
        type: Boolean,
        default: true
    },
    specialties: {
        type: [String],
        default: []
    }
}, {
    timestamps: true
});

// Create indexes
pharmacySchema.index({ city: 1 });
pharmacySchema.index({ rating: -1 });
pharmacySchema.index({ name: 'text' });

module.exports = mongoose.model('Pharmacy', pharmacySchema);
