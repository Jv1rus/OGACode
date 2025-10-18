# Firebase Configuration Guide for OgaStock

## Current Issue: Email Verification & User Profile Creation

Your system cannot verify emails and create user profiles because Firebase needs proper configuration in the Firebase Console.

## Step-by-Step Fix

### 1. Enable Email/Password Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **ogastock**
3. Click on **Authentication** in the left sidebar
4. Click on **Sign-in method** tab
5. Find **Email/Password** provider
6. Click on it and **Enable** both options:
   - ☑ Email/Password
   - ☑ Email link (passwordless sign-in) - Optional
7. Click **Save**

### 2. Configure Email Verification Settings

1. Still in **Authentication** > **Settings** tab
2. Scroll to **Authorized domains**
3. Make sure these domains are listed:
   - `localhost` (for development)
   - `ogastock.firebaseapp.com` (for production)
   - Add your custom domain if you have one
4. Scroll to **Email enumeration protection**
5. Consider enabling it for better security (recommended)

### 3. Customize Email Templates (Optional but Recommended)

1. In **Authentication** > **Templates** tab
2. Click on **Email verification**
3. Customize the email template:
   - Update the sender name (e.g., "OgaStock Team")
   - Customize the message
   - Update the action URL if needed
4. Click **Save**

### 4. Enable Google Sign-In (Already Configured)

1. In **Authentication** > **Sign-in method**
2. Find **Google** provider
3. If not enabled:
   - Click on it
   - Toggle **Enable**
   - Set the **Public-facing name**: OgaStock
   - Set **Project support email**: your email
   - Click **Save**

### 5. Deploy Firestore Security Rules

Open PowerShell and run these commands:

```powershell
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not done)
firebase init

# When prompted, select:
# - Firestore: Deploy rules and indexes
# - Choose existing project: ogastock
# - Use default file paths

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

### 6. Create Firestore Database (If Not Created)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **ogastock**
3. Click on **Firestore Database** in the left sidebar
4. If not created, click **Create database**
5. Choose **Start in production mode** (we have custom rules)
6. Select a location (choose closest to your users)
7. Click **Enable**

### 7. Verify Firestore Rules Are Active

1. In **Firestore Database** > **Rules** tab
2. You should see the rules from `firestore.rules`
3. If not, copy the content from `firestore.rules` and paste it there
4. Click **Publish**

### 8. Test Email Sending

Firebase needs proper SMTP configuration for email verification:

1. Go to **Authentication** > **Templates**
2. Click **Email verification**
3. Send a test email to yourself
4. Check if you receive it
5. If not, check your spam folder

### 9. Update Firebase Configuration in Code (If Needed)

Your current config in `js/firebase-config.js`:
```javascript
apiKey: "AIzaSyC5aJiXN6iWwrJU9XIdEBUvPwJAH4KpP7Y",
authDomain: "ogastock.firebaseapp.com",
projectId: "ogastock",
storageBucket: "ogastock.firebasestorage.app",
messagingSenderId: "471046818751",
appId: "1:471046818751:web:f473f012d71a081b0e2f0a"
```

To verify these are correct:
1. Go to Firebase Console > Project Settings
2. Scroll to "Your apps" section
3. Find your web app
4. Compare the config values

### 10. Test the System

1. Open your app: http://localhost:8080
2. Click on **Sign Up** tab
3. Fill in the registration form:
   - Full Name: Test User
   - Email: your-email@example.com
   - Password: test123456
   - Confirm Password: test123456
   - ☑ Agree to terms
4. Click **Create Account**
5. Check your email for verification link
6. Click the verification link
7. Go back to app and sign in

## Troubleshooting

### Issue: "Email verification not sending"

**Solution:**
- Check Firebase Console > Authentication > Templates
- Verify email template is configured
- Check spam/junk folder
- Wait a few minutes (emails can be delayed)
- Check Firebase Console > Authentication > Users to see if user was created

### Issue: "Permission denied" when creating user profile

**Solution:**
- Deploy Firestore rules: `firebase deploy --only firestore:rules`
- Check Firestore Console > Rules tab
- Verify rules are published
- Wait 1-2 minutes for rules to propagate

### Issue: "User created but no profile in Firestore"

**Solution:**
1. Check browser console for errors
2. Verify Firestore rules allow user creation
3. Check if Firestore database is created
4. Run this in browser console to test:
```javascript
window.diagnoseFirebaseCredentials()
window.testFirebaseConnection()
```

### Issue: "auth/operation-not-allowed"

**Solution:**
- Go to Firebase Console > Authentication > Sign-in method
- Enable Email/Password provider
- Click Save

### Issue: "CORS error" or "auth/network-request-failed"

**Solution:**
- Check internet connection
- Verify authorized domains in Firebase Console
- Check browser console for specific error
- Clear browser cache and reload

## Quick Deployment Commands

```powershell
# Deploy everything
firebase deploy

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only Firestore indexes
firebase deploy --only firestore:indexes

# Deploy only hosting
firebase deploy --only hosting
```

## Verify Everything is Working

Run these commands in your browser console (F12):

```javascript
// 1. Check Firebase initialization
window.diagnoseFirebaseCredentials()

// 2. Test Firebase connection
window.testFirebaseConnection()

// 3. Check current auth state
firebase.auth().currentUser

// 4. Check Firestore connection
firebase.firestore().enableNetwork()
```

## Security Best Practices

1. ✅ **Never commit** `firebase-adminsdk-*.json` files (already in .gitignore)
2. ✅ **Always use** Firestore security rules (deployed)
3. ✅ **Enable email verification** before allowing access
4. ✅ **Use role-based access control** (implemented in rules)
5. ✅ **Monitor authentication** in Firebase Console
6. ✅ **Set up billing alerts** to avoid unexpected charges
7. ✅ **Regular backups** of Firestore data

## Need Help?

- Firebase Documentation: https://firebase.google.com/docs
- Firebase Console: https://console.firebase.google.com/
- Firebase Support: https://firebase.google.com/support

---

**After completing these steps, your email verification and user profile creation should work perfectly!**
