const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Start reminder scheduler
const { startReminderScheduler } = require('./utils/reminderScheduler');
startReminderScheduler();

// Initialize WhatsApp service (will log if credentials are missing)
require('./utils/whatsappService');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS Configuration
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'], // Frontend URLs
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/reminders', require('./routes/reminderRoutes'));
app.use('/api/consultations', require('./routes/consultationRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/pharmacies', require('./routes/pharmacyRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/chats', require('./routes/chatRoutes'));

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Server Error',
    });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Socket.IO Setup
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Chat = require('./models/Chat');
const Message = require('./models/Message');

const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:5174'],
        credentials: true
    }
});

// Socket authentication middleware
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.userRole = user.role;
        next();
    } catch (error) {
        next(new Error('Authentication error'));
    }
});

// Socket connection handler
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.userRole})`);

    // Join user's personal room
    socket.join(socket.userId);

    // Join chat room
    socket.on('chat:join', (chatId) => {
        socket.join(`chat:${chatId}`);
        console.log(`User ${socket.userId} joined chat ${chatId}`);
    });

    // Leave chat room
    socket.on('chat:leave', (chatId) => {
        socket.leave(`chat:${chatId}`);
        console.log(`User ${socket.userId} left chat ${chatId}`);
    });

    // Send message
    socket.on('message:send', async (data) => {
        try {
            const { chatId, content } = data;

            // Verify user has access to this chat
            const chat = await Chat.findById(chatId);
            if (!chat) {
                socket.emit('error', { message: 'Chat not found' });
                return;
            }

            if (
                (socket.userRole === 'patient' && chat.patientId.toString() !== socket.userId) ||
                (socket.userRole === 'pharmacy' && chat.pharmacyId.toString() !== socket.userId)
            ) {
                socket.emit('error', { message: 'Access denied' });
                return;
            }

            // Create message
            const message = await Message.create({
                chatId,
                sender: socket.userId,
                senderRole: socket.userRole,
                content,
                type: 'text'
            });

            // Update chat
            chat.lastMessage = content;
            chat.lastMessageAt = new Date();

            // Increment unread count for receiver
            if (socket.userRole === 'patient') {
                chat.unreadCount.pharmacy += 1;
            } else {
                chat.unreadCount.patient += 1;
            }

            await chat.save();

            // Populate sender info
            await message.populate('sender', 'email role');

            // Emit to chat room
            io.to(`chat:${chatId}`).emit('message:received', message);

            // Notify the other user
            const receiverId = socket.userRole === 'patient' ? chat.pharmacyId.toString() : chat.patientId.toString();
            io.to(receiverId).emit('chat:updated', {
                chatId,
                lastMessage: content,
                lastMessageAt: chat.lastMessageAt,
                unreadCount: socket.userRole === 'patient' ? chat.unreadCount.pharmacy : chat.unreadCount.patient
            });

        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    // Mark messages as read
    socket.on('message:markRead', async (data) => {
        try {
            const { chatId } = data;

            const chat = await Chat.findById(chatId);
            if (!chat) return;

            // Mark messages as read
            await Message.updateMany(
                {
                    chatId,
                    sender: { $ne: socket.userId },
                    read: false
                },
                {
                    $set: {
                        read: true,
                        readAt: new Date()
                    }
                }
            );

            // Reset unread count
            if (socket.userRole === 'patient') {
                chat.unreadCount.patient = 0;
            } else {
                chat.unreadCount.pharmacy = 0;
            }
            await chat.save();

            // Notify sender that messages were read
            const senderId = socket.userRole === 'patient' ? chat.pharmacyId.toString() : chat.patientId.toString();
            io.to(senderId).emit('messages:read', { chatId });

        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    });

    // Typing indicators
    socket.on('typing:start', (data) => {
        const { chatId } = data;
        socket.to(`chat:${chatId}`).emit('user:typing', { userId: socket.userId });
    });

    socket.on('typing:stop', (data) => {
        const { chatId } = data;
        socket.to(`chat:${chatId}`).emit('user:stoppedTyping', { userId: socket.userId });
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.userId}`);
    });
});

module.exports = { app, io };
