const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const Profile = require('../models/Profile');

// @desc    Get all chats for a user
// @route   GET /api/chats
// @access  Private
exports.getChats = async (req, res) => {
    try {
        const userId = req.user._id;
        const userRole = req.user.role;

        let query = {};
        if (userRole === 'patient') {
            query.patientId = userId;
        } else if (userRole === 'pharmacy') {
            query.pharmacyId = userId;
        } else {
            return res.status(403).json({
                success: false,
                message: 'Only patients and pharmacies can access chats'
            });
        }

        const chats = await Chat.find({ ...query, status: 'active' })
            .populate('patientId', 'email')
            .populate('pharmacyId', 'email')
            .sort({ lastMessageAt: -1 });

        // Populate profile information
        const chatsWithProfiles = await Promise.all(chats.map(async (chat) => {
            const patientProfile = await Profile.findOne({ userId: chat.patientId._id });
            const pharmacyProfile = await Profile.findOne({ userId: chat.pharmacyId._id });

            return {
                _id: chat._id,
                patient: {
                    _id: chat.patientId._id,
                    email: chat.patientId.email,
                    name: patientProfile ? `${patientProfile.firstName} ${patientProfile.lastName}` : 'Patient',
                    image: patientProfile?.profileImage || null
                },
                pharmacy: {
                    _id: chat.pharmacyId._id,
                    email: chat.pharmacyId.email,
                    name: pharmacyProfile?.pharmacyName || 'Pharmacy',
                    image: pharmacyProfile?.profileImage || null
                },
                lastMessage: chat.lastMessage,
                lastMessageAt: chat.lastMessageAt,
                unreadCount: userRole === 'patient' ? chat.unreadCount.patient : chat.unreadCount.pharmacy,
                createdAt: chat.createdAt
            };
        }));

        res.status(200).json({
            success: true,
            chats: chatsWithProfiles
        });
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get messages for a specific chat
// @route   GET /api/chats/:chatId/messages
// @access  Private
exports.getChatMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user._id;
        const userRole = req.user.role;

        // Verify user has access to this chat
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        if (
            (userRole === 'patient' && chat.patientId.toString() !== userId.toString()) ||
            (userRole === 'pharmacy' && chat.pharmacyId.toString() !== userId.toString())
        ) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const messagesQuery = { chatId };

        // Check if user cleared history
        if (userRole === 'patient' && chat.clearedHistoryAt?.patient) {
            messagesQuery.createdAt = { $gt: chat.clearedHistoryAt.patient };
        } else if (userRole === 'pharmacy' && chat.clearedHistoryAt?.pharmacy) {
            messagesQuery.createdAt = { $gt: chat.clearedHistoryAt.pharmacy };
        }

        const messages = await Message.find(messagesQuery)
            .populate('sender', 'email role')
            .sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            messages
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Create or get existing chat
// @route   POST /api/chats
// @access  Private
exports.createChat = async (req, res) => {
    try {
        const { pharmacyId } = req.body;
        const patientId = req.user._id;

        if (req.user.role !== 'patient') {
            return res.status(403).json({
                success: false,
                message: 'Only patients can initiate chats'
            });
        }

        // Check if pharmacy exists
        const pharmacy = await User.findOne({ _id: pharmacyId, role: 'pharmacy' });
        if (!pharmacy) {
            return res.status(404).json({
                success: false,
                message: 'Pharmacy not found'
            });
        }

        // Check if chat already exists
        let chat = await Chat.findOne({ patientId, pharmacyId });

        if (!chat) {
            // Create new chat
            chat = await Chat.create({
                patientId,
                pharmacyId,
                lastMessage: 'Chat started',
                lastMessageAt: new Date()
            });
        }

        // Populate chat details
        chat = await Chat.findById(chat._id)
            .populate('patientId', 'email')
            .populate('pharmacyId', 'email');

        const patientProfile = await Profile.findOne({ userId: chat.patientId._id });
        const pharmacyProfile = await Profile.findOne({ userId: chat.pharmacyId._id });

        const chatData = {
            _id: chat._id,
            patient: {
                _id: chat.patientId._id,
                email: chat.patientId.email,
                name: patientProfile ? `${patientProfile.firstName} ${patientProfile.lastName}` : 'Patient',
                image: patientProfile?.profileImage || null
            },
            pharmacy: {
                _id: chat.pharmacyId._id,
                email: chat.pharmacyId.email,
                name: pharmacyProfile?.pharmacyName || 'Pharmacy',
                image: pharmacyProfile?.profileImage || null
            },
            lastMessage: chat.lastMessage,
            lastMessageAt: chat.lastMessageAt,
            unreadCount: chat.unreadCount.patient,
            createdAt: chat.createdAt
        };

        res.status(201).json({
            success: true,
            chat: chatData
        });
    } catch (error) {
        console.error('Error creating chat:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Mark messages as read
// @route   PUT /api/chats/:chatId/read
// @access  Private
exports.markAsRead = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user._id;
        const userRole = req.user.role;

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        // Mark all unread messages from the other party as read
        const updateResult = await Message.updateMany(
            {
                chatId,
                sender: { $ne: userId },
                read: false
            },
            {
                $set: {
                    read: true,
                    readAt: new Date()
                }
            }
        );

        // Reset unread count for this user
        if (userRole === 'patient') {
            chat.unreadCount.patient = 0;
        } else if (userRole === 'pharmacy') {
            chat.unreadCount.pharmacy = 0;
        }

        await chat.save();

        res.status(200).json({
            success: true,
            message: 'Messages marked as read',
            updatedCount: updateResult.modifiedCount
        });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Upload file for chat
// @route   POST /api/chats/upload
// @access  Private (Patient, Pharmacy)
exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Generate file URL
        const fileUrl = `/uploads/chat-attachments/${req.file.filename}`;

        res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            file: {
                url: fileUrl,
                filename: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size
            }
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Clear chat history for user
// @route   PUT /api/chats/:chatId/clear
// @access  Private
exports.clearChatHistory = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user._id;
        const userRole = req.user.role;

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ success: false, message: 'Chat not found' });
        }

        // Verify access
        if (
            (userRole === 'patient' && chat.patientId.toString() !== userId.toString()) ||
            (userRole === 'pharmacy' && chat.pharmacyId.toString() !== userId.toString())
        ) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Update clearedHistoryAt
        if (userRole === 'patient') {
            chat.clearedHistoryAt.patient = new Date();
        } else if (userRole === 'pharmacy') {
            chat.clearedHistoryAt.pharmacy = new Date();
        }

        await chat.save();

        res.status(200).json({ success: true, message: 'Chat history cleared' });
    } catch (error) {
        console.error('Error clearing chat history:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
