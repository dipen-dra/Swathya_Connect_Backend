# WhatsApp Cloud API Integration Guide

## Overview
This guide explains how to set up and use WhatsApp Cloud API with the approved `medicine_reminder` template for Swasthya Connect.

## Template Information

### Approved Template: `medicine_reminder`
- **Status**: Active - Quality pending
- **Language**: English (en)
- **Category**: Utility

### Template Structure

**Header**: 
```
Swasthya Connect - Medicine Reminder
```

**Body**:
```
Hello {{1}} 👋

It's time to take your medicine.

💊 {{2}}
📋 Dosage: {{3}}
🕐 Time: {{4}}

Take with water

Please take your medicine as prescribed by your doctor.
```

**Footer**:
```
This is an automated reminder from Swasthya Connect
```

### Template Parameters
1. `{{1}}` - Patient Name (e.g., "Dipanshu")
2. `{{2}}` - Medicine Name (e.g., "Paracetamol")
3. `{{3}}` - Dosage (e.g., "500mg")
4. `{{4}}` - Time (e.g., "18:00")

## Environment Setup

### Required Environment Variables

Add these to your `backend/.env` file:

```env
# WhatsApp Cloud API Configuration
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_ACCESS_TOKEN=your_access_token_here
```

### How to Get Credentials

1. **Phone Number ID**:
   - Go to [Meta for Developers](https://developers.facebook.com/)
   - Navigate to your WhatsApp Business App
   - Go to WhatsApp > API Setup
   - Copy the "Phone number ID"

2. **Access Token**:
   - In the same API Setup page
   - Copy the temporary access token (for testing)
   - For production, generate a permanent token from System Users

## Usage

### 1. Medicine Reminder (Template-based)

The service automatically uses the approved template when sending medicine reminders:

```javascript
const { sendWhatsAppReminder } = require('./utils/whatsappService');

await sendWhatsAppReminder(
    '+9779812345678',  // WhatsApp number in international format
    'Dipanshu',         // Patient name
    {
        medicineName: 'Paracetamol',
        dosage: '500mg',
        times: ['18:00', '22:00'],  // Array of times
        instructions: 'Take with water'  // Optional
    }
);
```

### 2. Custom Template Messages

For other use cases (future templates):

```javascript
const { sendTemplateMessage } = require('./utils/whatsappService');

await sendTemplateMessage(
    '+9779812345678',           // Phone number
    'appointment_confirmation',  // Template name
    'en',                        // Language code
    ['John Doe', 'Dec 10, 2025', '10:00 AM']  // Parameters
);
```

## Features

### ✅ Template-First Approach
- Uses approved Meta templates for better deliverability
- Professional, consistent messaging
- Higher engagement rates

### ✅ Automatic Fallback
- If template fails (not approved, quota exceeded, etc.)
- Automatically falls back to regular text messages
- Ensures messages are always delivered

### ✅ Error Handling
- Comprehensive error logging
- Detailed error messages for debugging
- Graceful degradation

## Testing

### Test the Integration

1. **Start the backend server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Check initialization**:
   Look for this in the console:
   ```
   ✅ WhatsApp Cloud API initialized
   📋 Available templates: medicine_reminder
   ```

3. **Test a reminder**:
   - Create a medicine reminder in the app
   - Enable WhatsApp notifications
   - Add your WhatsApp number in profile settings
   - Wait for the scheduled time (or trigger manually)

### Expected Console Output

**Success**:
```
📤 Sending WhatsApp template message to: +9779812345678
📋 Template: medicine_reminder
📤 Using Phone Number ID: 123456789
✅ WhatsApp template message sent: wamid.XXX==
```

**Fallback**:
```
⚠️ Template not available, falling back to regular message
✅ WhatsApp fallback message sent: wamid.XXX==
```

## Troubleshooting

### Common Issues

1. **"WhatsApp Cloud API not configured"**
   - Check if environment variables are set correctly
   - Restart the server after adding credentials

2. **Template Error (Code 132000)**
   - Template not approved yet
   - Service will automatically use fallback message

3. **Template Error (Code 133016)**
   - Template name mismatch
   - Check template name in Meta dashboard

4. **Invalid Phone Number**
   - Ensure number is in international format: `+[country_code][number]`
   - Example: `+9779812345678` (Nepal)

5. **Message Not Delivered**
   - Check if the recipient has WhatsApp
   - Verify phone number is correct
   - Check Meta Business Manager for message status

## Rate Limits

### Free Tier (Test Mode)
- 1,000 conversations per month
- 250 messages per day

### Production
- Upgrade to Business Account
- Higher limits based on quality rating
- Pay-per-conversation pricing

## Next Steps

### Additional Templates to Create

1. **Appointment Confirmation**
   ```
   Hello {{1}},
   Your appointment with Dr. {{2}} is confirmed for {{3}} at {{4}}.
   ```

2. **Consultation Reminder**
   ```
   Hello {{1}},
   Your online consultation with Dr. {{2}} starts in 30 minutes.
   Join at: {{3}}
   ```

3. **Payment Confirmation**
   ```
   Hello {{1}},
   Your payment of Rs. {{2}} has been received.
   Transaction ID: {{3}}
   ```

## Security Best Practices

1. **Never commit `.env` file** to version control
2. **Use permanent tokens** for production (not temporary)
3. **Rotate tokens** regularly
4. **Monitor usage** in Meta Business Manager
5. **Implement rate limiting** in your application

## Support

- **Meta Documentation**: https://developers.facebook.com/docs/whatsapp/cloud-api
- **Template Guidelines**: https://developers.facebook.com/docs/whatsapp/message-templates/guidelines
- **API Reference**: https://developers.facebook.com/docs/whatsapp/cloud-api/reference

---

**Last Updated**: December 9, 2025
**Template Status**: Active - Quality Pending
**Integration Version**: 1.0
