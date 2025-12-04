const mongoose = require('mongoose');

const medicineReminderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    medicineName: {
        type: String,
        required: [true, 'Please add medicine name']
    },
    dosage: {
        type: String,
        required: [true, 'Please add dosage']
    },
    frequency: {
        type: String,
        enum: ['daily', 'twice-daily', 'thrice-daily', 'weekly'],
        required: [true, 'Please add frequency']
    },
    times: {
        type: [String],
        required: [true, 'Please add reminder times'],
        validate: {
            validator: function (v) {
                return v && v.length > 0;
            },
            message: 'At least one reminder time is required'
        }
    },
    instructions: {
        type: String,
        default: ''
    },
    startDate: {
        type: Date,
        required: [true, 'Please add start date']
    },
    endDate: {
        type: Date,
        default: null
    },
    emailReminder: {
        type: Boolean,
        default: true
    },
    beforeMealMinutes: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    nextReminder: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Create index on userId for faster lookups
medicineReminderSchema.index({ userId: 1 });
medicineReminderSchema.index({ nextReminder: 1, isActive: 1 });

// Method to calculate next reminder time
medicineReminderSchema.methods.calculateNextReminder = function () {
    if (!this.isActive || !this.times || this.times.length === 0) {
        return null;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Find the next reminder time today or tomorrow
    for (const time of this.times.sort()) {
        const [hours, minutes] = time.split(':').map(Number);
        const reminderTime = new Date(today);
        reminderTime.setHours(hours, minutes, 0, 0);

        if (reminderTime > now) {
            return reminderTime;
        }
    }

    // If no time today, use first time tomorrow
    const [hours, minutes] = this.times.sort()[0].split(':').map(Number);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(hours, minutes, 0, 0);

    return tomorrow;
};

// Update nextReminder before saving
medicineReminderSchema.pre('save', function (next) {
    this.nextReminder = this.calculateNextReminder();
    next();
});

module.exports = mongoose.model('MedicineReminder', medicineReminderSchema);
