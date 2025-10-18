# 🔥 Firebase Email Verification & User Profile Fix

## Problem Summary
Your OgaStock system cannot:
1. ❌ Send email verification emails
2. ❌ Create user profiles in Firestore

## Root Causes
1. **Email/Password authentication not enabled** in Firebase Console
2. **Firestore security rules not deployed** - prevents profile creation
3. **Email templates not configured** - emails won't send
4. **Firestore database may not be created** yet

## Quick Fix - 3 Steps

### Step 1: Run Firebase Setup Script

Open PowerShell in your project folder and run:

```powershell
.\setup-firebase.ps1
```

This will:
- Install Firebase CLI
- Login to your Firebase account
- Deploy Firestore security rules
- Deploy Firestore indexes

**OR** Deploy manually:

```powershell
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### Step 2: Enable Email Authentication

1. Go to: https://console.firebase.google.com/project/ogastock/authentication/providers
2. Click on **"Email/Password"**
3. Toggle **Enable** ON
4. Click **Save**

### Step 3: Configure Email Templates

1. Go to: https://console.firebase.google.com/project/ogastock/authentication/emails
2. Click **"Email verification"**
3. Customize the template:
   - From name: **OgaStock Team**
   - Subject: **Verify your email for OgaStock**
   - Body: Customize as needed
4. Click **Save**

## Verify Everything Works

### Option 1: Use Test Page (Recommended)

1. Open: http://localhost:8080/test-firebase.html
2. Click **"Run All Tests"** button
3. Check each test result:
   - ✅ Firebase Initialization
   - ✅ Authentication Configuration
   - ✅ Firestore Configuration
4. Create a test account in Test #4
5. Check your email for verification link
6. Verify profile creation in Test #5

### Option 2: Use Main App

1. Open: http://localhost:8080
2. Click **"Sign Up"** tab
3. Fill in the form:
   - Full Name: Test User
   - Email: your-email@example.com
   - Password: test123456
   - Confirm Password: test123456
   - ☑ Agree to terms
4. Click **"Create Account"**
5. Check your email inbox
6. Click verification link
7. Sign in with your account

## Files Created

✅ **firestore.rules** - Security rules for Firestore
✅ **firestore.indexes.json** - Database indexes for performance
✅ **test-firebase.html** - Diagnostic and testing tool
✅ **setup-firebase.ps1** - Automated setup script
✅ **FIREBASE_CONFIGURATION_GUIDE.md** - Complete documentation

## Troubleshooting

### Issue: "Permission denied" when creating profile

**Fix:**
```powershell
firebase deploy --only firestore:rules
```

Wait 1-2 minutes for rules to propagate.

### Issue: "Email not sending"

**Checklist:**
- ✅ Email/Password enabled in Firebase Console
- ✅ Email template configured
- ✅ Check spam/junk folder
- ✅ Wait 2-3 minutes (emails can be delayed)
- ✅ Verify Firebase project has email quota

**Still not working?**
1. Go to Firebase Console > Authentication > Users
2. Find your test user
3. Check if "Email verified" column shows status
4. Manually verify user if needed (for testing)

### Issue: "Operation not allowed"

**Fix:**
Email/Password authentication is not enabled.
1. Go to Firebase Console > Authentication > Sign-in method
2. Enable Email/Password
3. Click Save

### Issue: "Firestore not created"

**Fix:**
1. Go to: https://console.firebase.google.com/project/ogastock/firestore
2. Click **"Create database"**
3. Choose **"Start in production mode"** (we have custom rules)
4. Select location (closest to your users)
5. Click **Enable**

## Current Configuration

Your Firebase project:
- **Project ID**: ogastock
- **Auth Domain**: ogastock.firebaseapp.com
- **API Key**: AIzaSyC5aJiXN6iWwrJU9XIdEBUvPwJAH4KpP7Y

## Security Features Implemented

✅ **Role-based access control** (Admin, Manager, Cashier)
✅ **User can only edit their own profile**
✅ **Admins can manage all profiles**
✅ **Email verification required**
✅ **Firestore security rules** prevent unauthorized access
✅ **Proper permission checks** on all operations

## Default User Roles

When a new user signs up:
- **Role**: Cashier (default)
- **Permissions**: sales, products:view
- **Can be upgraded**: Admin/Manager can change role in Firestore

To create an admin user:
1. Sign up normally
2. Go to Firestore Console
3. Find user document in `users` collection
4. Edit `role` field to "admin"
5. Edit `permissions` array to ["all"]

## Support Resources

- 📖 **Complete Guide**: FIREBASE_CONFIGURATION_GUIDE.md
- 🧪 **Test Tool**: http://localhost:8080/test-firebase.html
- 🔒 **Security Guide**: SECURITY.md
- 🚀 **Setup Guide**: FIREBASE_SETUP_GUIDE.md

## Quick Commands Reference

```powershell
# Deploy all Firebase config
firebase deploy

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only Firestore indexes
firebase deploy --only firestore:indexes

# Check Firebase login status
firebase login:list

# View current project
firebase use
```

## Still Having Issues?

1. Run the diagnostic: http://localhost:8080/test-firebase.html
2. Check browser console (F12) for errors
3. Review: FIREBASE_CONFIGURATION_GUIDE.md
4. Verify all checklist items in Firebase Console

---

**After completing these 3 steps, your email verification and user profile creation will work perfectly!** ✅
