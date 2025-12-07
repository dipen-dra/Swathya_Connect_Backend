const twilio = require('twilio');

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;

let client = null;

// Only initialize if credentials are available
if (accountSid && authToken && whatsappFrom) {
    client = twilio(accountSid, authToken);
    console.log('✅ WhatsApp service initialized');
} else {
    console.log('⚠️ WhatsApp service not configured (missing Twilio credentials)');
}

// Send WhatsApp medicine reminder
exports.sendWhatsAppReminder = async (phoneNumber, userName, reminderData) => {
    if (!client) {
        console.log('⚠️ WhatsApp service not available - skipping WhatsApp reminder');
        return { success: false, error: 'WhatsApp service not configured' };
    }

    const { medicineName, dosage, times, instructions } = reminderData;

    // Format the message
    const message = `🏥 *Swasthya Connect - Medicine Reminder*

Hello ${userName}! ⏰

It's time to take your medicine in *10 minutes*.

💊 *${medicineName}*
📋 Dosage: ${dosage}
🕐 Scheduled Time: ${times.join(', ')}
${instructions ? `\n⚠️ Instructions: ${instructions}` : ''}

Please take your medicine as prescribed by your doctor.

_This is an automated reminder from Swasthya Connect_`;

    try {
        // Remove any spaces from the phone number
        const cleanPhoneNumber = phoneNumber.replace(/\s/g, '');

        const response = await client.messages.create({
            from: whatsappFrom,
            to: `whatsapp:${cleanPhoneNumber}`,
            body: message
        });

        console.log('✅ WhatsApp reminder sent:', response.sid);
        return { success: true, messageId: response.sid };
    } catch (error) {
        console.error('❌ Failed to send WhatsApp reminder:', error.message);
        return { success: false, error: error.message };
    }
};

module.exports = exports;
