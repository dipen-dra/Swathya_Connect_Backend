const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify connection
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email service error:', error);
    } else {
        console.log('✅ Email service ready');
    }
});

// Send medicine reminder email
exports.sendMedicineReminder = async (userEmail, userName, reminderData) => {
    const { medicineName, dosage, times, instructions } = reminderData;

    const mailOptions = {
        from: `"Swasthya Connect" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: `⏰ Medicine Reminder: ${medicineName}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .medicine-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
                    .medicine-name { font-size: 24px; font-weight: bold; color: #667eea; margin-bottom: 10px; }
                    .dosage { font-size: 18px; color: #666; margin-bottom: 15px; }
                    .instructions { background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 3px solid #ffc107; margin-top: 15px; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                    .btn { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏥 Medicine Reminder</h1>
                        <p>Time to take your medicine!</p>
                    </div>
                    <div class="content">
                        <p>Hello <strong>${userName}</strong>,</p>
                        <p>This is a friendly reminder to take your medicine in <strong>10 minutes</strong>.</p>
                        
                        <div class="medicine-card">
                            <div class="medicine-name">💊 ${medicineName}</div>
                            <div class="dosage">Dosage: ${dosage}</div>
                            <div style="color: #666;">
                                <strong>Scheduled Time:</strong> ${times.join(', ')}
                            </div>
                            ${instructions ? `
                            <div class="instructions">
                                <strong>⚠️ Instructions:</strong><br>
                                ${instructions}
                            </div>
                            ` : ''}
                        </div>
                        
                        <p style="margin-top: 20px;">
                            <strong>Important:</strong> Please take your medicine as prescribed by your doctor.
                        </p>
                        
                        <div style="text-align: center;">
                            <a href="http://localhost:5173/dashboard" class="btn">View Dashboard</a>
                        </div>
                    </div>
                    <div class="footer">
                        <p>This is an automated reminder from Swasthya Connect</p>
                        <p>If you wish to modify your reminders, please visit your dashboard</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Reminder email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Failed to send reminder email:', error);
        return { success: false, error: error.message };
    }
};

// Send welcome email
exports.sendWelcomeEmail = async (userEmail, userName) => {
    const mailOptions = {
        from: `"Swasthya Connect" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: 'Welcome to Swasthya Connect! 🏥',
        html: `
            <h1>Welcome to Swasthya Connect, ${userName}!</h1>
            <p>Thank you for joining our healthcare platform.</p>
            <p>You can now:</p>
            <ul>
                <li>Book consultations with doctors</li>
                <li>Set medicine reminders</li>
                <li>Order from pharmacies</li>
                <li>Manage your health records</li>
            </ul>
            <p>Get started by visiting your dashboard!</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Welcome email sent to:', userEmail);
    } catch (error) {
        console.error('❌ Failed to send welcome email:', error);
    }
};

// Send consultation booking confirmation email
exports.sendConsultationConfirmation = async (userEmail, userName, consultationData) => {
    const { doctorName, specialty, date, time, type, fee, paymentMethod, consultationId } = consultationData;

    const consultationTypeLabels = {
        video: '📹 Video Consultation',
        audio: '📞 Audio Consultation',
        chat: '💬 Text Chat Consultation'
    };

    const formattedDate = new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const mailOptions = {
        from: `"Swasthya Connect" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: `✅ Consultation Booked Successfully - ${doctorName}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .success-badge { background: #10b981; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 20px 0; }
                    .consultation-card { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    .doctor-name { font-size: 24px; font-weight: bold; color: #667eea; margin-bottom: 5px; }
                    .specialty { font-size: 16px; color: #666; margin-bottom: 20px; }
                    .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
                    .detail-label { font-weight: bold; color: #666; }
                    .detail-value { color: #333; }
                    .payment-badge { background: #10b981; color: white; padding: 5px 15px; border-radius: 15px; font-size: 14px; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                    .btn { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                    .important-note { background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 3px solid #ffc107; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏥 Consultation Confirmed!</h1>
                        <div class="success-badge">✓ Payment Successful</div>
                    </div>
                    <div class="content">
                        <p>Dear <strong>${userName}</strong>,</p>
                        <p>Your consultation has been successfully booked and payment has been confirmed!</p>
                        
                        <div class="consultation-card">
                            <div class="doctor-name">${doctorName}</div>
                            <div class="specialty">${specialty}</div>
                            
                            <div class="detail-row">
                                <span class="detail-label">Consultation Type:</span>
                                <span class="detail-value">${consultationTypeLabels[type] || type}</span>
                            </div>
                            
                            <div class="detail-row">
                                <span class="detail-label">Date:</span>
                                <span class="detail-value">${formattedDate}</span>
                            </div>
                            
                            <div class="detail-row">
                                <span class="detail-label">Time:</span>
                                <span class="detail-value">${time}</span>
                            </div>
                            
                            <div class="detail-row">
                                <span class="detail-label">Consultation Fee:</span>
                                <span class="detail-value">NPR ${fee}</span>
                            </div>
                            
                            <div class="detail-row" style="border-bottom: none;">
                                <span class="detail-label">Payment Method:</span>
                                <span class="payment-badge">${paymentMethod}</span>
                            </div>
                            
                            <div class="detail-row" style="border-bottom: none;">
                                <span class="detail-label">Booking ID:</span>
                                <span class="detail-value" style="font-family: monospace; font-size: 12px;">${consultationId}</span>
                            </div>
                        </div>
                        
                        <div class="important-note">
                            <strong>⚠️ Important Reminders:</strong><br>
                            • Please be available at the scheduled time<br>
                            • Keep your device charged and internet connection stable<br>
                            • You can view your consultation details in your dashboard<br>
                            • If you need to reschedule, please contact us at least 24 hours in advance
                        </div>
                        
                        <div style="text-align: center;">
                            <a href="http://localhost:5173/dashboard/consultations" class="btn">View My Consultations</a>
                        </div>
                    </div>
                    <div class="footer">
                        <p>Thank you for choosing Swasthya Connect</p>
                        <p>For any queries, contact us at support@swasthyaconnect.com</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Consultation confirmation email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Failed to send consultation confirmation email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = exports;
