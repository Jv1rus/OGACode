// Notification Manager
class NotificationManager {
    static toastContainer = null;
    static toastCount = 0;

    static init() {
        this.toastContainer = document.getElementById('toastContainer');
        if (!this.toastContainer) {
            // Create toast container if it doesn't exist
            this.toastContainer = document.createElement('div');
            this.toastContainer.id = 'toastContainer';
            this.toastContainer.className = 'toast-container';
            document.body.appendChild(this.toastContainer);
        }
    }

    static show(message, type = 'info', duration = 5000) {
        if (!this.toastContainer) {
            this.init();
        }

        const toast = this.createToast(message, type);
        this.toastContainer.appendChild(toast);

        // Trigger animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Auto remove
        setTimeout(() => {
            this.removeToast(toast);
        }, duration);

        // Manual close on click
        toast.addEventListener('click', () => {
            this.removeToast(toast);
        });

        return toast;
    }

    static createToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.id = `toast-${++this.toastCount}`;

        const icon = this.getIcon(type);
        
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas ${icon}" style="color: ${this.getIconColor(type)};"></i>
                <span style="flex: 1;">${message}</span>
                <i class="fas fa-times" style="cursor: pointer; opacity: 0.7;" onclick="NotificationManager.removeToast(this.closest('.toast'))"></i>
            </div>
        `;

        return toast;
    }

    static getIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    static getIconColor(type) {
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        return colors[type] || colors.info;
    }

    static removeToast(toast) {
        if (toast && toast.parentNode) {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }

    static success(message, duration = 5000) {
        return this.show(message, 'success', duration);
    }

    static error(message, duration = 7000) {
        return this.show(message, 'error', duration);
    }

    static warning(message, duration = 6000) {
        return this.show(message, 'warning', duration);
    }

    static info(message, duration = 5000) {
        return this.show(message, 'info', duration);
    }

    // Stock level notifications
    static checkStockLevels() {
        const lowStockItems = StorageManager.getLowStockItems();
        
        if (lowStockItems.length > 0) {
            const outOfStock = lowStockItems.filter(item => item.quantity === 0);
            const lowStock = lowStockItems.filter(item => item.quantity > 0);

            if (outOfStock.length > 0) {
                this.error(`${outOfStock.length} item(s) are out of stock!`, 10000);
            }

            if (lowStock.length > 0) {
                this.warning(`${lowStock.length} item(s) are running low on stock!`, 8000);
            }
        }
    }

    // Order status notifications
    static notifyOrderStatus(orderId, oldStatus, newStatus) {
        const messages = {
            pending: 'Order is pending processing',
            processing: 'Order is being processed',
            completed: 'Order has been completed successfully',
            cancelled: 'Order has been cancelled',
            returned: 'Order has been returned'
        };

        const message = `Order ${orderId}: ${messages[newStatus] || 'Status updated'}`;
        
        if (newStatus === 'completed') {
            this.success(message);
        } else if (newStatus === 'cancelled') {
            this.warning(message);
        } else {
            this.info(message);
        }
    }

    // Backup and sync notifications
    static notifyBackupStatus(success, message) {
        if (success) {
            this.success(message || 'Backup completed successfully');
        } else {
            this.error(message || 'Backup failed');
        }
    }

    static notifySyncStatus(success, message) {
        if (success) {
            this.success(message || 'Data synchronized successfully');
        } else {
            this.error(message || 'Synchronization failed');
        }
    }

    // Offline/Online notifications
    static notifyConnectionStatus(isOnline) {
        if (isOnline) {
            this.success('Connection restored - You are back online');
        } else {
            this.warning('You are offline - Changes will be saved locally');
        }
    }

    // Clear all notifications
    static clearAll() {
        if (this.toastContainer) {
            this.toastContainer.innerHTML = '';
        }
    }

    // Permission-based notifications (for future browser notifications)
    static async requestPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return false;
    }

    static showBrowserNotification(title, options = {}) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                icon: '/assets/icon-192x192.png',
                badge: '/assets/icon-72x72.png',
                ...options
            });

            // Auto close after 5 seconds
            setTimeout(() => {
                notification.close();
            }, 5000);

            return notification;
        }
    }

    // Scheduled notifications
    static scheduleStockCheck() {
        // Check stock levels every 30 minutes
        setInterval(() => {
            this.checkStockLevels();
        }, 30 * 60 * 1000);

        // Initial check
        setTimeout(() => {
            this.checkStockLevels();
        }, 5000);
    }
}

// Initialize notifications when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    NotificationManager.init();
    
    // Start scheduled notifications
    NotificationManager.scheduleStockCheck();
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
        NotificationManager.notifyConnectionStatus(true);
    });

    window.addEventListener('offline', () => {
        NotificationManager.notifyConnectionStatus(false);
    });
});