// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('ServiceWorker registration successful:', registration.scope);
            
            // Check for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New content is available, refresh the page
                        if (confirm('New version available! Refresh to update?')) {
                            window.location.reload();
                        }
                    }
                });
            });
            
        } catch (error) {
            console.log('ServiceWorker registration failed:', error);
        }
    });
}

// Install prompt handling
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Show install button or notification
    showInstallPrompt();
});

function showInstallPrompt() {
    // Create install notification
    if (NotificationManager) {
        const installToast = NotificationManager.show(
            'Install OgaStock app for better experience! <button onclick="installApp()" style="margin-left: 10px; padding: 5px 10px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">Install</button>',
            'info',
            10000
        );
        installToast.style.maxWidth = '400px';
    }
}

window.installApp = async function() {
    if (deferredPrompt) {
        // Show the install prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
            if (NotificationManager) {
                NotificationManager.success('App installed successfully!');
            }
        } else {
            console.log('User dismissed the install prompt');
        }
        
        // Clear the deferredPrompt
        deferredPrompt = null;
    }
};

// Handle app installation
window.addEventListener('appinstalled', (evt) => {
    console.log('OgaStock app was installed');
    if (NotificationManager) {
        NotificationManager.success('OgaStock app installed successfully!');
    }
});

// Check if app is running in standalone mode (PWA)
function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
}

// Update UI based on standalone mode
if (isStandalone()) {
    document.body.classList.add('standalone');
    console.log('Running as PWA');
}

// Handle app updates
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        // The service worker has been updated, reload the page
        window.location.reload();
    });
}