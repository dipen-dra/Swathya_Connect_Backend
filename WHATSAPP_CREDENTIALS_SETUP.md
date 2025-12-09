# WhatsApp Cloud API Configuration Instructions

## Your Credentials

**Phone Number ID**: `857843234087867`

**Access Token**: `EAAZALFkZBWSIkBQPMPUiLmZAX68HSkM0EC7OxOgwEAK4Cxk3yYUDWUhZCvlYQmdShFP2xVeBVLd78koWWqNuHe0nvgjJ236UE22gABM9lnWEXASpZCZAZATZBzhFGHJwRFNQM1zyAbAWi3FrZAGxI9SZB65i7WKMFfP7dH3zZCYJXFi8eQ5ZAMq8tajOtmxwqWoEjGBn9DKHMeIAfdYABCYfkdg1IZBcq22fRSqnpWWxn8bQTFCf3T8G56Mh19m105lEUsCl8XoRCX4LDhuntJfANdowbWtNg`

## Setup Instructions

### Option 1: Manual Setup (Recommended)

1. Open `backend/.env` file in your editor
2. Add or update these lines:

```env
WHATSAPP_PHONE_NUMBER_ID=857843234087867
WHATSAPP_ACCESS_TOKEN=EAAZALFkZBWSIkBQPMPUiLmZAX68HSkM0EC7OxOgwEAK4Cxk3yYUDWUhZCvlYQmdShFP2xVeBVLd78koWWqNuHe0nvgjJ236UE22gABM9lnWEXASpZCZAZATZBzhFGHJwRFNQM1zyAbAWi3FrZAGxI9SZB65i7WKMFfP7dH3zZCYJXFi8eQ5ZAMq8tajOtmxwqWoEjGBn9DKHMeIAfdYABCYfkdg1IZBcq22fRSqnpWWxn8bQTFCf3T8G56Mh19m105lEUsCl8XoRCX4LDhuntJfANdowbWtNg
```

3. Save the file
4. Restart your backend server (Ctrl+C and `npm run dev`)

### Option 2: Using PowerShell

Run this command in PowerShell from the `backend` directory:

```powershell
# Add WhatsApp credentials to .env file
Add-Content -Path .env -Value "`nWHATSAPP_PHONE_NUMBER_ID=857843234087867"
Add-Content -Path .env -Value "WHATSAPP_ACCESS_TOKEN=EAAZALFkZBWSIkBQPMPUiLmZAX68HSkM0EC7OxOgwEAK4Cxk3yYUDWUhZCvlYQmdShFP2xVeBVLd78koWWqNuHe0nvgjJ236UE22gABM9lnWEXASpZCZAZATZBzhFGHJwRFNQM1zyAbAWi3FrZAGxI9SZB65i7WKMFfP7dH3zZCYJXFi8eQ5ZAMq8tajOtmxwqWoEjGBn9DKHMeIAfdYABCYfkdg1IZBcq22fRSqnpWWxn8bQTFCf3T8G56Mh19m105lEUsCl8XoRCX4LDhuntJfANdowbWtNg"
```

## Verification

After adding the credentials and restarting the server, you should see:

```
✅ WhatsApp Cloud API initialized
📋 Available templates: medicine_reminder
```

## Test the Integration

Run the test script with your WhatsApp number:

```bash
node src/utils/testWhatsApp.js +9779812345678
```

Replace `+9779812345678` with your actual WhatsApp number in international format.

---

**⚠️ IMPORTANT SECURITY NOTES:**

1. **Never commit `.env` to git** - It's already in `.gitignore`
2. **This is a temporary token** - For production, generate a permanent token
3. **Keep credentials secure** - Don't share in public repositories
4. **Rotate tokens regularly** - Best practice for security

---

**Need Help?**

If you encounter any issues:
1. Check the console for error messages
2. Verify credentials are correct in `.env`
3. Ensure backend server is restarted
4. Review the troubleshooting section in `WHATSAPP_SETUP.md`
