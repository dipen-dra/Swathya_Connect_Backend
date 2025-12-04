const MedicineReminder = require('../models/MedicineReminder');

// @desc    Get all reminders for user
// @route   GET /api/reminders
// @access  Private
exports.getReminders = async (req, res) => {
    try {
        const reminders = await MedicineReminder.find({ userId: req.user.id }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: reminders.length,
            data: reminders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get single reminder
// @route   GET /api/reminders/:id
// @access  Private
exports.getReminder = async (req, res) => {
    try {
        const reminder = await MedicineReminder.findById(req.params.id);

        if (!reminder) {
            return res.status(404).json({
                success: false,
                message: 'Reminder not found'
            });
        }

        // Make sure user owns reminder
        if (reminder.userId.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this reminder'
            });
        }

        res.status(200).json({
            success: true,
            data: reminder
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Create reminder
// @route   POST /api/reminders
// @access  Private
exports.createReminder = async (req, res) => {
    try {
        // Add user to req.body
        req.body.userId = req.user.id;

        const reminder = await MedicineReminder.create(req.body);

        res.status(201).json({
            success: true,
            data: reminder
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Failed to create reminder',
            error: error.message
        });
    }
};

// @desc    Update reminder
// @route   PUT /api/reminders/:id
// @access  Private
exports.updateReminder = async (req, res) => {
    try {
        let reminder = await MedicineReminder.findById(req.params.id);

        if (!reminder) {
            return res.status(404).json({
                success: false,
                message: 'Reminder not found'
            });
        }

        // Make sure user owns reminder
        if (reminder.userId.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to update this reminder'
            });
        }

        reminder = await MedicineReminder.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            data: reminder
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Failed to update reminder',
            error: error.message
        });
    }
};

// @desc    Delete reminder
// @route   DELETE /api/reminders/:id
// @access  Private
exports.deleteReminder = async (req, res) => {
    try {
        const reminder = await MedicineReminder.findById(req.params.id);

        if (!reminder) {
            return res.status(404).json({
                success: false,
                message: 'Reminder not found'
            });
        }

        // Make sure user owns reminder
        if (reminder.userId.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to delete this reminder'
            });
        }

        await reminder.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Reminder deleted successfully',
            data: {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Toggle reminder status (active/paused)
// @route   PATCH /api/reminders/:id/toggle
// @access  Private
exports.toggleReminderStatus = async (req, res) => {
    try {
        let reminder = await MedicineReminder.findById(req.params.id);

        if (!reminder) {
            return res.status(404).json({
                success: false,
                message: 'Reminder not found'
            });
        }

        // Make sure user owns reminder
        if (reminder.userId.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to update this reminder'
            });
        }

        reminder.isActive = !reminder.isActive;
        await reminder.save();

        res.status(200).json({
            success: true,
            data: reminder
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
