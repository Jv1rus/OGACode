# 🚀 Complete Deployment Guide for OgaStock PWA

## Prerequisites Setup

### 1. Install Git
Download and install Git from: https://git-scm.com/download/windows
- During installation, select "Git from the command line and also from 3rd-party software"
- Restart VS Code after installation

### 2. Create GitHub Account
If you don't have one: https://github.com/join

## Deploy Steps

### Step 1: Setup Git in VS Code Terminal
```powershell
# Check if git is installed
git --version

# Configure git (replace with your info)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Step 2: Initialize Repository
```powershell
# Navigate to project folder
cd "c:\Users\JD oliseh\OGACode"

# Initialize git repository
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: OgaStock PWA v1.0"
```

### Step 3: Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `OGACode` (or your choice)
3. Description: "Progressive Web App for Inventory Management"
4. Make it **Public** (required for free GitHub Pages)
5. **Don't** check "Add a README file"
6. Click "Create repository"

### Step 4: Connect Local to GitHub
```powershell
# Add remote origin (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/OGACode.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

### Step 5: Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll down to **Pages** section
4. Under "Source", select **Deploy from a branch**
5. Branch: **main**
6. Folder: **/ (root)**
7. Click **Save**

### Step 6: Access Your Live PWA
- Wait 2-5 minutes for deployment
- Your app will be available at:
  `https://YOUR_USERNAME.github.io/OGACode/`

## Quick Deploy Script

Save this as `deploy.ps1` in your project folder:

```powershell
# Quick deploy script for OgaStock PWA
Write-Host "🚀 Deploying OgaStock PWA..." -ForegroundColor Green

# Add all changes
git add .

# Commit with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
git commit -m "Update: $timestamp"

# Push to GitHub
git push origin main

Write-Host "✅ Deployed successfully!" -ForegroundColor Green
Write-Host "🌐 Your PWA will be live at: https://YOUR_USERNAME.github.io/OGACode/" -ForegroundColor Cyan
```

## Troubleshooting

### Git Not Found
- Download Git: https://git-scm.com/download/windows
- Restart VS Code after installation

### Authentication Issues
Use GitHub CLI or Personal Access Token:
```powershell
# Option 1: GitHub CLI (recommended)
winget install GitHub.cli
gh auth login

# Option 2: Use Personal Access Token
# Go to GitHub → Settings → Developer settings → Personal access tokens
# Create token with repo permissions
# Use token as password when pushing
```

### PWA Not Installing
- Ensure you're using HTTPS (GitHub Pages provides this)
- Check browser console for service worker errors
- Verify manifest.json is accessible

## Post-Deployment Checklist

- [ ] PWA loads correctly
- [ ] Service Worker registers
- [ ] Can install PWA on desktop/mobile
- [ ] Theme toggle works
- [ ] All features functional offline
- [ ] Data persists in Local Storage

## Updating Your PWA

```powershell
# Make your changes, then:
git add .
git commit -m "Description of changes"
git push origin main
```

Changes will automatically deploy to GitHub Pages!

## Support Links

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [PWA Installation Guide](https://web.dev/install-criteria/)
- [Git Tutorial](https://git-scm.com/docs/gittutorial)