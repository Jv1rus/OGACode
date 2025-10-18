# Security Policy - OgaStock PWA

## 🔒 Security Best Practices

This document outlines security practices for the OgaStock Inventory Management System.

---

## ⚠️ CRITICAL: Firebase Admin SDK vs Web SDK

### 🚫 NEVER Use Admin SDK in Client-Side Code

**Admin SDK JSON files** (like `*-firebase-adminsdk-*.json`) contain:
- Private keys with full administrative access
- Service account credentials
- Unrestricted access to your entire Firebase project

### ✅ Use Web SDK Configuration Only

For client-side web applications, use only the **Web SDK configuration**:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",              // ✅ Safe for client-side
  authDomain: "project.firebaseapp.com",
  projectId: "project-id",
  storageBucket: "project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:..."
};
```

**These values are safe to expose** because:
- They identify your Firebase project (public identifiers)
- Security is enforced by Firebase Security Rules
- API key restrictions control access

---

## 🛡️ Security Rules

### Firebase Authentication Rules

1. **Enable only necessary authentication methods**
   - Email/Password ✅
   - Google Sign-In ✅
   - Disable unused providers

2. **Email Verification**
   - Require email verification for new accounts
   - Check `emailVerified` before granting access

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Products - authenticated users can read, only admins can write
    match /products/{productId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Orders, Sales, etc. - similar patterns
  }
}
```

---

## 🔐 Protected Information

### NEVER Commit to Git:

- ❌ `*-firebase-adminsdk-*.json` (Admin SDK service accounts)
- ❌ `.env` files with secrets
- ❌ Private keys of any kind
- ❌ Database credentials
- ❌ API secrets

### Safe to Commit:

- ✅ Web SDK configuration (`js/firebase-config.js`)
- ✅ Public API keys (Firebase Web SDK)
- ✅ Client-side code
- ✅ Firebase Security Rules

---

## 📋 Security Checklist

### Firebase Configuration

- [ ] Using Web SDK configuration (NOT Admin SDK)
- [ ] Admin SDK files added to `.gitignore`
- [ ] Firebase Security Rules configured
- [ ] Email verification enabled
- [ ] Password requirements enforced (min 6 characters)

### Authentication

- [ ] Strong password requirements
- [ ] Email verification required
- [ ] Rate limiting enabled (Firebase handles this)
- [ ] Session management secure
- [ ] Logout functionality working

### Data Protection

- [ ] User data encrypted in transit (HTTPS)
- [ ] Firestore rules restrict access
- [ ] Personal data properly scoped
- [ ] No sensitive data in client-side code

### Code Security

- [ ] No hardcoded secrets
- [ ] Input validation on all forms
- [ ] XSS protection (Firebase SDK handles this)
- [ ] CSRF protection (Firebase handles this)

---

## 🆘 If Admin SDK Credentials Are Exposed

If you accidentally committed or exposed Admin SDK credentials:

1. **Immediately Revoke**:
   - Go to Firebase Console
   - Project Settings → Service Accounts
   - Delete the compromised service account
   - Generate a new one (for server use only)

2. **Remove from Git History**:
   ```bash
   # Use git filter-branch or BFG Repo-Cleaner
   git filter-branch --force --index-filter \
   "git rm --cached --ignore-unmatch *-firebase-adminsdk-*.json" \
   --prune-empty --tag-name-filter cat -- --all
   ```

3. **Force Push** (if already pushed):
   ```bash
   git push origin --force --all
   ```

4. **Notify Team**:
   - Alert all team members
   - Update credentials everywhere

---

## 📞 Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT** create a public issue
2. Email: security@ogastock.com (or project maintainer)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

**Response Time**: Within 48 hours

---

## 🔄 Regular Security Maintenance

### Weekly:
- Review Firebase Authentication logs
- Check for unusual access patterns
- Monitor failed login attempts

### Monthly:
- Review and update Firestore rules
- Audit user permissions
- Update dependencies
- Review security logs

### Quarterly:
- Full security audit
- Penetration testing
- Update security policies
- Review access controls

---

## 📚 Resources

- [Firebase Security Checklist](https://firebase.google.com/docs/rules/security-checklist)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Firebase Authentication Best Practices](https://firebase.google.com/docs/auth/best-practices)
- [Firestore Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)

---

## 📄 License

This security policy applies to OgaStock Inventory Management System.

**Last Updated**: October 2025
