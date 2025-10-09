// Service Worker for PWA functionality
const CACHE_NAME = 'ogastock-v1.0.0';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/styles.css',
    '/css/dashboard.css',
    '/css/products.css',
    '/css/orders.css',
    '/css/reports.css',
    '/js/app.js',
    '/js/storage.js',
    '/js/dashboard.js',
    '/js/products.js',
    '/js/orders.js',
    '/js/reports.js',
    '/js/notifications.js',
    '/js/sw-register.js',
    // Font Awesome CDN (will be cached when loaded)
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch((error) => {
                console.error('Failed to cache static assets:', error);
            })
    );
    
    // Force activation of new service worker
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Take control of all clients
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version if available
                if (response) {
                    return response;
                }
                
                // Otherwise fetch from network
                return fetch(event.request).then((response) => {
                    // Don't cache non-successful responses
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Clone the response
                    const responseToCache = response.clone();
                    
                    // Add to cache for future use
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                }).catch(() => {
                    // Return offline page for navigation requests
                    if (event.request.destination === 'document') {
                        return caches.match('/index.html');
                    }
                });
            })
    );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
    if (event.tag === 'ogastock-sync') {
        console.log('Background sync triggered');
        event.waitUntil(syncOfflineData());
    }
});

// Sync offline data when connection is restored
async function syncOfflineData() {
    try {
        // Get sync queue from IndexedDB or localStorage
        const syncQueue = await getSyncQueue();
        
        for (const item of syncQueue) {
            try {
                // Process each sync item
                await processSyncItem(item);
            } catch (error) {
                console.error('Failed to sync item:', item, error);
            }
        }
        
        // Clear sync queue after successful sync
        await clearSyncQueue();
        
        // Notify clients about successful sync
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'SYNC_COMPLETE',
                    data: { success: true }
                });
            });
        });
        
    } catch (error) {
        console.error('Background sync failed:', error);
        
        // Notify clients about failed sync
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'SYNC_FAILED',
                    data: { error: error.message }
                });
            });
        });
    }
}

// Get sync queue (placeholder - would integrate with actual storage)
async function getSyncQueue() {
    // In a real implementation, this would read from IndexedDB
    return [];
}

// Process individual sync item
async function processSyncItem(item) {
    // In a real implementation, this would send data to a server
    console.log('Processing sync item:', item);
    
    // Simulate API call
    return new Promise((resolve) => {
        setTimeout(resolve, 100);
    });
}

// Clear sync queue after successful sync
async function clearSyncQueue() {
    // In a real implementation, this would clear IndexedDB sync queue
    console.log('Sync queue cleared');
}

// Push notification handling
self.addEventListener('push', (event) => {
    console.log('Push event received');
    
    let data = {};
    if (event.data) {
        data = event.data.json();
    }
    
    const options = {
        body: data.body || 'You have a new notification from OgaStock',
        icon: '/assets/icon-192x192.png',
        badge: '/assets/icon-72x72.png',
        tag: data.tag || 'ogastock-notification',
        data: data.url || '/',
        actions: [
            {
                action: 'open',
                title: 'Open App'
            },
            {
                action: 'close',
                title: 'Close'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'OgaStock', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked');
    
    event.notification.close();
    
    if (event.action === 'open' || !event.action) {
        // Open the app
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then((clientList) => {
                // If app is already open, focus it
                for (const client of clientList) {
                    if (client.url === event.notification.data && 'focus' in client) {
                        return client.focus();
                    }
                }
                
                // Otherwise open new window
                if (clients.openWindow) {
                    return clients.openWindow(event.notification.data);
                }
            })
        );
    }
});

// Message handling from main app
self.addEventListener('message', (event) => {
    console.log('Service Worker received message:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'REQUEST_SYNC') {
        // Register background sync
        self.registration.sync.register('ogastock-sync');
    }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'ogastock-background-sync') {
        console.log('Periodic background sync triggered');
        event.waitUntil(syncOfflineData());
    }
});

// Error handling
self.addEventListener('error', (event) => {
    console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker unhandled rejection:', event.reason);
});

console.log('Service Worker loaded');