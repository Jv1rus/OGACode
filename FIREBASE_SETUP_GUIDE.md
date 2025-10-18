# Firebase Web App Setup Guide

## ⚠️ IMPORTANT: Admin SDK vs Web SDK

The JSON file you have (`ogastock-firebase-adminsdk-fbsvc-5d883c8df2.json`) is a **server-side Admin SDK** credential and should **NEVER** be used in client-side code.

### Why This Matters:

- **Admin SDK** = Server-side only (Node.js, Cloud Functions) - Full admin access
- **Web SDK** = Client-side (Browser, PWA) - Limited, secure access

---

## ✅ How to Get Your Web App Configuration

### Step 1: Go to Firebase Console

1. Visit: https://console.firebase.google.com/
2. Select your project: **ogastock**

### Step 2: Navigate to Project Settings

1. Click the **⚙️ gear icon** (top left, next to "Project Overview")
2. Select **Project settings**

### Step 3: Find Your Web App Configuration

1. Scroll down to **"Your apps"** section
2. Look for your web app (🌐 icon)
3. If you don't see a web app, click **"Add app"** → **Web** (</> icon)

### Step 4: Copy the Configuration

You should see something like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "ogastock.firebaseapp.com",
  projectId: "ogastock",
  storageBucket: "ogastock.firebasestorage.app",
  messagingSenderId: "471046818751",
  appId: "1:471046818751:web:..."
};
```

### Step 5: Update Your Configuration

Copy those values into `js/firebase-config.js`

---

## 🔒 Security Best Practices

### ✅ Safe for Client-Side (Web SDK):
- `apiKey` - Safe to expose (it's a public identifier)
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`

### ❌ NEVER Expose (Admin SDK):
- `private_key` ⛔
- `private_key_id` ⛔
- `client_email` ⛔
- Service account JSON files ⛔

---

## 🔐 Secure Your Admin SDK Credentials

If you need server-side functionality:

1. **Store in Server Environment**:
   - Use Cloud Functions
   - Store in environment variables
   - Never commit to Git

2. **Add to .gitignore**:
   ```
   *-firebase-adminsdk-*.json
   ```

3. **Delete from Downloads**:
   - Remove the file from your Downloads folder
   - Regenerate if compromised

---

## 🚀 Current Configuration Status

Your current web configuration in `js/firebase-config.js` is:

```javascript
Project ID: ogastock
Auth Domain: ogastock.firebaseapp.com
Storage Bucket: ogastock.firebasestorage.app
```

This configuration is **CORRECT** and **SECURE** for your web application!

---

## ✅ Verification Steps

### 1. Test Your Current Configuration:

Open browser console (F12) and run:

```javascript
window.diagnoseFirebaseCredentials()
```

### 2. Test Connection:

```javascript
window.testFirebaseConnection()
```

### 3. Try Demo Login:

Click the "Try Demo Account" button in your login page.

---

## 🆘 If You Need to Update Configuration

### Only update if you see errors or want to verify credentials:

1. Go to Firebase Console
2. Get web app config (NOT admin SDK)
3. Replace values in `js/firebase-config.js`:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "ogastock.firebaseapp.com",
    projectId: "ogastock",
    storageBucket: "ogastock.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

---

## 📞 Common Issues

### Issue: "API key not valid"
**Solution**: Get fresh web config from Firebase Console

### Issue: "Authentication failed"
**Solution**: Enable Email/Password auth in Firebase Console > Authentication

### Issue: "Firestore permission denied"
**Solution**: Update Firestore rules to allow authenticated users

---

## 🎯 Next Steps

1. ✅ Your current config is working
2. ✅ Delete the admin SDK JSON file from Downloads
3. ✅ Add `*-firebase-adminsdk-*.json` to .gitignore
4. ✅ Test demo login functionality
5. ✅ Enable authentication methods you need in Firebase Console

---

## 🔗 Useful Links

- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Web SDK Docs](https://firebase.google.com/docs/web/setup)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Authentication Methods](https://firebase.google.com/docs/auth)

---

**Remember**: Your web app configuration is already correct. The admin SDK file is for server-side use only!
