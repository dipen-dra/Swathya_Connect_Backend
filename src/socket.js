const jwt = require('jsonwebtoken');
const ConsultationMessage = require('./models/ConsultationMessage');
const ConsultationChat = require('./models/ConsultationChat');
const User = require('./models/User');

const initializeSocket = (io) => {
    // Middleware to authenticate socket connections
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return next(new Error('User not found'));
            }

            socket.userId = user._id.toString();
            socket.userRole = user.role;
            socket.userName = user.fullName;

            next();
        } catch (error) {
            console.error('Socket authentication error:', error);
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`✅ User connected: ${socket.userName} (${socket.userId})`);

        // Join consultation room
        socket.on('join-consultation', async (consultationId) => {
            try {
                const roomName = `consultation-${consultationId}`;
                socket.join(roomName);
                socket.currentConsultation = consultationId;

                console.log(`👤 ${socket.userName} joined consultation: ${consultationId}`);

                // Notify other user that someone joined
                socket.to(roomName).emit('user-joined', {
                    userId: socket.userId,
                    userName: socket.userName,
                    userRole: socket.userRole
                });
            } catch (error) {
                console.error('Error joining consultation:', error);
                socket.emit('error', { message: 'Failed to join consultation' });
            }
        });

        // Send message
        socket.on('send-message', async (data) => {
            try {
                const { consultationId, content, messageType = 'text', fileUrl, fileName, fileType, fileSize } = data;

                // Get consultation chat
                const consultationChat = await ConsultationChat.findOne({ consultationId });

                if (!consultationChat) {
                    socket.emit('error', { message: 'Consultation chat not found' });
                    return;
                }

                // Determine sender role
                const senderRole = socket.userRole === 'doctor' ? 'doctor' : 'patient';

                // Create message
                const message = await ConsultationMessage.create({
                    consultationChatId: consultationChat._id,
                    consultationId,
                    senderId: socket.userId,
                    senderRole,
                    messageType,
                    content: messageType === 'text' ? content : null,
                    fileUrl,
                    fileName,
                    fileType,
                    fileSize
                });

                // Populate sender info
                await message.populate('senderId', 'fullName profilePicture');

                // Update consultation chat
                consultationChat.lastMessageAt = new Date();

                // Increment unread count for the other user
                if (senderRole === 'patient') {
                    consultationChat.unreadCount.doctor += 1;
                } else {
                    consultationChat.unreadCount.patient += 1;
                }

                await consultationChat.save();

                // Emit message to room
                const roomName = `consultation-${consultationId}`;
                io.to(roomName).emit('new-message', message);

                console.log(`💬 Message sent in consultation ${consultationId} by ${socket.userName}`);
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Typing indicator
        socket.on('typing', (consultationId) => {
            const roomName = `consultation-${consultationId}`;
            socket.to(roomName).emit('user-typing', {
                userId: socket.userId,
                userName: socket.userName
            });
        });

        // Stop typing indicator
        socket.on('stop-typing', (consultationId) => {
            const roomName = `consultation-${consultationId}`;
            socket.to(roomName).emit('user-stopped-typing', {
                userId: socket.userId
            });
        });

        // Mark messages as read
        socket.on('mark-as-read', async ({ consultationId }) => {
            try {
                const userRole = socket.userRole === 'doctor' ? 'doctor' : 'patient';
                const updateField = userRole === 'patient' ? 'readBy.patient' : 'readBy.doctor';
                const readAtField = userRole === 'patient' ? 'readAt.patient' : 'readAt.doctor';

                // Update messages
                await ConsultationMessage.updateMany(
                    {
                        consultationId,
                        [updateField]: false,
                        senderRole: { $ne: userRole }
                    },
                    {
                        $set: {
                            [updateField]: true,
                            [readAtField]: new Date()
                        }
                    }
                );

                // Update consultation chat unread count
                const consultationChat = await ConsultationChat.findOne({ consultationId });
                if (consultationChat) {
                    if (userRole === 'patient') {
                        consultationChat.unreadCount.patient = 0;
                    } else {
                        consultationChat.unreadCount.doctor = 0;
                    }
                    await consultationChat.save();
                }

                // Notify other user
                const roomName = `consultation-${consultationId}`;
                socket.to(roomName).emit('messages-read', {
                    userId: socket.userId,
                    readBy: userRole
                });
            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        });

        // Leave consultation
        socket.on('leave-consultation', (consultationId) => {
            const roomName = `consultation-${consultationId}`;
            socket.leave(roomName);
            socket.currentConsultation = null;

            console.log(`👋 ${socket.userName} left consultation: ${consultationId}`);

            // Notify other user
            socket.to(roomName).emit('user-left', {
                userId: socket.userId,
                userName: socket.userName
            });
        });

        // Disconnect
        socket.on('disconnect', () => {
            console.log(`❌ User disconnected: ${socket.userName} (${socket.userId})`);

            // If user was in a consultation, notify others
            if (socket.currentConsultation) {
                const roomName = `consultation-${socket.currentConsultation}`;
                socket.to(roomName).emit('user-left', {
                    userId: socket.userId,
                    userName: socket.userName
                });
            }
        });
    });

    console.log('✅ Socket.IO initialized');
};

module.exports = initializeSocket;
