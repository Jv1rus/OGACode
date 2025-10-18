# Firebase Setup Script for OgaStock
# Run this script to configure Firebase for email verification and user profiles

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Firebase Setup for OgaStock PWA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
Write-Host "Checking Firebase CLI..." -ForegroundColor Yellow
$firebaseCLI = Get-Command firebase -ErrorAction SilentlyContinue

if (-not $firebaseCLI) {
    Write-Host "❌ Firebase CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installing Firebase CLI..." -ForegroundColor Yellow
    npm install -g firebase-tools
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Firebase CLI" -ForegroundColor Red
        Write-Host "Please run: npm install -g firebase-tools" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "✅ Firebase CLI is ready" -ForegroundColor Green
Write-Host ""

# Login to Firebase
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Step 1: Login to Firebase" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opening browser for Firebase login..." -ForegroundColor Yellow
firebase login

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Firebase login failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Logged in to Firebase" -ForegroundColor Green
Write-Host ""

# Initialize Firebase (if not already done)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Step 2: Initialize Firebase Project" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$firebaseJson = Test-Path "firebase.json"
if ($firebaseJson) {
    Write-Host "✅ Firebase already initialized" -ForegroundColor Green
} else {
    Write-Host "Initializing Firebase..." -ForegroundColor Yellow
    Write-Host "Select: Firestore, Hosting" -ForegroundColor Yellow
    Write-Host "Choose existing project: ogastock" -ForegroundColor Yellow
    firebase init
}

Write-Host ""

# Deploy Firestore Rules
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Step 3: Deploy Firestore Rules" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Deploying Firestore security rules..." -ForegroundColor Yellow
firebase deploy --only firestore:rules

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Firestore rules deployed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to deploy Firestore rules" -ForegroundColor Red
    Write-Host "You can deploy manually from Firebase Console" -ForegroundColor Yellow
}

Write-Host ""

# Deploy Firestore Indexes
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Step 4: Deploy Firestore Indexes" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Deploying Firestore indexes..." -ForegroundColor Yellow
firebase deploy --only firestore:indexes

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Firestore indexes deployed successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️ Failed to deploy Firestore indexes (non-critical)" -ForegroundColor Yellow
}

Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Firebase CLI installed" -ForegroundColor Green
Write-Host "✅ Logged in to Firebase" -ForegroundColor Green
Write-Host "✅ Firestore rules deployed" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open Firebase Console: https://console.firebase.google.com/" -ForegroundColor White
Write-Host "2. Select your project: ogastock" -ForegroundColor White
Write-Host "3. Go to Authentication > Sign-in method" -ForegroundColor White
Write-Host "4. Enable 'Email/Password' provider" -ForegroundColor White
Write-Host "5. Go to Authentication > Templates" -ForegroundColor White
Write-Host "6. Configure email verification template" -ForegroundColor White
Write-Host "7. Test your setup: http://localhost:8080/test-firebase.html" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to open Firebase Console..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Start-Process "https://console.firebase.google.com/project/ogastock/authentication/users"

Write-Host ""
Write-Host "Setup script completed!" -ForegroundColor Green
