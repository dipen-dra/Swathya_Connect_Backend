# WhatsApp Credentials Setup Script
# This script adds WhatsApp Cloud API credentials to the .env file

Write-Host "`n🔧 WhatsApp Cloud API Setup Script" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

$envFile = ".env"
$phoneNumberId = "857843234087867"
$accessToken = "EAAZALFkZBWSIkBQPMPUiLmZAX68HSkM0EC7OxOgwEAK4Cxk3yYUDWUhZCvlYQmdShFP2xVeBVLd78koWWqNuHe0nvgjJ236UE22gABM9lnWEXASpZCZAZATZBzhFGHJwRFNQM1zyAbAWi3FrZAGxI9SZB65i7WKMFfP7dH3zZCYJXFi8eQ5ZAMq8tajOtmxwqWoEjGBn9DKHMeIAfdYABCYfkdg1IZBcq22fRSqnpWWxn8bQTFCf3T8G56Mh19m105lEUsCl8XoRCX4LDhuntJfANdowbWtNg"

# Check if .env file exists
if (-not (Test-Path $envFile)) {
    Write-Host "`n❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host "Creating .env file from .env.example..." -ForegroundColor Yellow
    
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" $envFile
        Write-Host "✅ Created .env file" -ForegroundColor Green
    } else {
        Write-Host "❌ .env.example not found. Creating new .env file..." -ForegroundColor Red
        New-Item -Path $envFile -ItemType File | Out-Null
    }
}

# Read current .env content
$envContent = Get-Content $envFile -Raw

# Check if WhatsApp credentials already exist
if ($envContent -match "WHATSAPP_PHONE_NUMBER_ID") {
    Write-Host "`n⚠️  WhatsApp credentials already exist in .env" -ForegroundColor Yellow
    $response = Read-Host "Do you want to update them? (y/n)"
    
    if ($response -ne "y") {
        Write-Host "`n❌ Setup cancelled" -ForegroundColor Red
        exit
    }
    
    # Update existing credentials
    $envContent = $envContent -replace "WHATSAPP_PHONE_NUMBER_ID=.*", "WHATSAPP_PHONE_NUMBER_ID=$phoneNumberId"
    $envContent = $envContent -replace "WHATSAPP_ACCESS_TOKEN=.*", "WHATSAPP_ACCESS_TOKEN=$accessToken"
    
    Set-Content -Path $envFile -Value $envContent
    Write-Host "`n✅ Updated WhatsApp credentials in .env" -ForegroundColor Green
} else {
    # Add new credentials
    Write-Host "`n📝 Adding WhatsApp credentials to .env..." -ForegroundColor Cyan
    
    $whatsappConfig = @"

# WhatsApp Cloud API Configuration
WHATSAPP_PHONE_NUMBER_ID=$phoneNumberId
WHATSAPP_ACCESS_TOKEN=$accessToken
"@
    
    Add-Content -Path $envFile -Value $whatsappConfig
    Write-Host "✅ Added WhatsApp credentials to .env" -ForegroundColor Green
}

Write-Host "`n" + "=" * 50 -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "`n📋 Credentials Added:" -ForegroundColor Cyan
Write-Host "   Phone Number ID: $phoneNumberId" -ForegroundColor White
Write-Host "   Access Token: $($accessToken.Substring(0, 20))..." -ForegroundColor White

Write-Host "`n⚠️  Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Restart your backend server (Ctrl+C and npm run dev)" -ForegroundColor White
Write-Host "   2. Look for: ✅ WhatsApp Cloud API initialized" -ForegroundColor White
Write-Host "   3. Test with: node src/utils/testWhatsApp.js +9779812345678" -ForegroundColor White

Write-Host "`n" + "=" * 50 -ForegroundColor Cyan
Write-Host ""
