# 📱 WhatsApp Test Number Setup Guide

## Why You Didn't Receive the Message

Your WhatsApp Cloud API is in **test mode**. In test mode, messages can only be sent to **phone numbers that are registered as test recipients** in Meta Business Manager.

## ✅ Template is Working!

Good news: The template is now working correctly! The test shows:
```
✅ SUCCESS! WhatsApp message sent
Fallback Used: No
```

This means the template parameters are correct. You just need to add your number as a test recipient.

## 🔧 How to Add Your Number as Test Recipient

### Step 1: Go to Meta Business Manager

1. Open [Meta for Developers](https://developers.facebook.com/)
2. Log in with your account
3. Go to **My Apps** and select your WhatsApp app

### Step 2: Navigate to WhatsApp Settings

1. In the left sidebar, click **WhatsApp**
2. Click **API Setup**
3. Scroll down to the **"To"** field section

### Step 3: Add Your Phone Number

1. Look for **"Add phone number"** or **"Phone number recipients"**
2. Click **"Manage phone number list"** or **"Add recipient"**
3. Enter your phone number: `+9779849423853`
4. Click **"Add"** or **"Send code"**

### Step 4: Verify Your Number

1. You'll receive a **verification code** on WhatsApp
2. Enter the code in Meta Business Manager
3. Click **"Verify"**

### Step 5: Test Again

Once verified, run the test script again:

```bash
node src/utils/testWhatsApp.js +9779849423853
```

You should now receive the message! 🎉

## 📸 Visual Guide

Here's what to look for in Meta Business Manager:

### API Setup Page

```
┌─────────────────────────────────────────┐
│ WhatsApp > API Setup                    │
├─────────────────────────────────────────┤
│                                         │
│ Step 1: Select phone number             │
│ [Phone Number ID: 857843234087867]      │
│                                         │
│ Step 2: Send messages                   │
│ To: [+9779849423853]                    │
│                                         │
│ 📝 Manage phone number list             │ ← Click here
│                                         │
└─────────────────────────────────────────┘
```

### Add Recipient Dialog

```
┌─────────────────────────────────────────┐
│ Add phone number recipient              │
├─────────────────────────────────────────┤
│                                         │
│ Phone number:                           │
│ [+9779849423853]                        │
│                                         │
│ [Send code]                             │
│                                         │
└─────────────────────────────────────────┘
```

## 🚀 Moving to Production

Once you're ready to send messages to any number (not just test numbers):

### Option 1: Request Production Access

1. Go to **WhatsApp > Getting Started**
2. Click **"Request production access"**
3. Fill out the business verification form
4. Wait for Meta approval (usually 1-3 days)

### Option 2: Continue in Test Mode

- You can add up to **5 test phone numbers**
- Perfect for development and testing
- No business verification needed
- Free to use

## 📊 Current Status

✅ **WhatsApp Cloud API**: Configured  
✅ **Template**: Approved and working  
✅ **Credentials**: Added to .env  
✅ **Parameters**: Fixed (5 parameters)  
⚠️ **Test Number**: Needs to be added  

## 🔍 Troubleshooting

### "Message sent but not received"

**Cause**: Your number is not registered as a test recipient  
**Solution**: Follow the steps above to add your number

### "Cannot add phone number"

**Cause**: You might have reached the 5 test number limit  
**Solution**: Remove an old test number or request production access

### "Verification code not received"

**Cause**: Number might be incorrect or WhatsApp not installed  
**Solution**: 
- Verify number format: `+9779849423853`
- Ensure WhatsApp is installed and active
- Try with a different number

## 📝 Quick Checklist

- [ ] Go to Meta for Developers
- [ ] Navigate to WhatsApp > API Setup
- [ ] Click "Manage phone number list"
- [ ] Add your number: `+9779849423853`
- [ ] Verify with the code received on WhatsApp
- [ ] Run test script again
- [ ] Receive the message! 🎉

## 🎯 Next Steps After Verification

Once your number is verified and you receive the test message:

1. ✅ **Test in the app**
   - Add WhatsApp number in profile settings
   - Create a medicine reminder
   - Enable WhatsApp notifications
   - Wait for the scheduled time

2. ✅ **Add more test numbers** (optional)
   - Family members
   - Team members
   - Up to 5 total numbers

3. ✅ **Request production access** (when ready)
   - Send to any number
   - No test number limit
   - Business verification required

---

**Need Help?**

- [Meta WhatsApp Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [Phone Number Management](https://developers.facebook.com/docs/whatsapp/cloud-api/phone-numbers)
- [Production Access Guide](https://developers.facebook.com/docs/whatsapp/business-management-api/get-started)

**Last Updated**: December 9, 2025  
**Status**: Template Working - Awaiting Test Number Registration
