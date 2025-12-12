const mongoose = require('mongoose');

const medicineOrderSchema = new mongoose.Schema({
    // Patient and Pharmacy
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

    // Prescription
    prescriptionImage: {
        type: String,
        required: true
    },
    prescriptionVerified: {
        type: Boolean,
        default: false
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verifiedAt: {
        type: Date
    },
    rejectionReason: {
        type: String
    },

    // Medicines (Bill)
    medicines: [{
        name: {
            type: String,
            required: true
        },
        dosage: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        pricePerUnit: {
            type: Number,
            required: true,
            min: 0
        },
        totalPrice: {
            type: Number,
            required: true,
            min: 0
        },
        inventoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Inventory'
        }
    }],

    // Pricing
    subtotal: {
        type: Number,
        default: 0,
        min: 0
    },
    deliveryCharges: {
        type: Number,
        default: 0,
        min: 0
    },
    totalAmount: {
        type: Number,
        default: 0,
        min: 0
    },

    // Payment
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['khalti', 'esewa', null],
        default: null
    },
    paymentTransactionId: {
        type: String
    },
    paidAt: {
        type: Date
    },
    paidAmount: {
        type: Number,
        min: 0
    },

    // Delivery
    deliveryAddress: {
        type: String,
        required: true
    },
    deliveryNotes: {
        type: String
    },

    // Status
    status: {
        type: String,
        enum: [
            'pending_verification',
            'rejected',
            'awaiting_payment',
            'paid',
            'preparing',
            'ready_for_delivery',
            'out_for_delivery',
            'delivered',
            'cancelled'
        ],
        default: 'pending_verification'
    },

    // Status History
    statusHistory: [{
        status: {
            type: String,
            required: true
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        updatedAt: {
            type: Date,
            default: Date.now
        },
        notes: {
            type: String
        }
    }]
}, {
    timestamps: true
});

// Add initial status to history on creation
medicineOrderSchema.pre('save', function (next) {
    if (this.isNew) {
        this.statusHistory.push({
            status: this.status,
            updatedAt: new Date(),
            notes: 'Order created'
        });
    }
    next();
});

// Method to update status
medicineOrderSchema.methods.updateStatus = function (newStatus, updatedBy, notes) {
    this.status = newStatus;
    this.statusHistory.push({
        status: newStatus,
        updatedBy,
        updatedAt: new Date(),
        notes
    });
};

// Method to calculate totals
medicineOrderSchema.methods.calculateTotals = function () {
    this.subtotal = this.medicines.reduce((sum, med) => sum + med.totalPrice, 0);
    this.totalAmount = this.subtotal + (this.deliveryCharges || 0);
};

module.exports = mongoose.model('MedicineOrder', medicineOrderSchema);
