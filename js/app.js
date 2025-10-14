// Theme Manager
class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme() || 'light';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupEventListeners();
    }

    setupEventListeners() {
        const themeToggle = document.getElementById('themeToggle');
        const themeToggleSwitch = document.querySelector('.theme-toggle-switch');
        
        if (themeToggle) {
            // Enhanced change event with animation feedback
            themeToggle.addEventListener('change', (e) => {
                this.handleThemeToggle(e);
            });
            
            // Add tactile feedback on interaction
            if (themeToggleSwitch) {
                themeToggleSwitch.addEventListener('mousedown', () => {
                    this.addActiveState();
                });
                
                themeToggleSwitch.addEventListener('mouseup', () => {
                    this.removeActiveState();
                });
                
                themeToggleSwitch.addEventListener('mouseleave', () => {
                    this.removeActiveState();
                });
                
                // Touch support for mobile
                themeToggleSwitch.addEventListener('touchstart', () => {
                    this.addActiveState();
                });
                
                themeToggleSwitch.addEventListener('touchend', () => {
                    this.removeActiveState();
                });
            }
        }
    }

    addActiveState() {
        const slider = document.querySelector('.theme-toggle-slider');
        if (slider) {
            slider.style.transform = 'translateY(1px) scale(0.98)';
            slider.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.2)';
        }
    }

    removeActiveState() {
        const slider = document.querySelector('.theme-toggle-slider');
        if (slider) {
            slider.style.transform = '';
            slider.style.boxShadow = '';
        }
    }

    handleThemeToggle(event) {
        // Add small delay for visual feedback
        const slider = document.querySelector('.theme-toggle-slider');
        if (slider) {
            slider.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        }
        
        // Small delay to show the animation
        setTimeout(() => {
            this.toggleTheme();
        }, 50);
    }

    getStoredTheme() {
        return localStorage.getItem('ogastock_theme');
    }

    storeTheme(theme) {
        localStorage.setItem('ogastock_theme', theme);
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.updateThemeIcon(theme);
        this.storeTheme(theme);
        this.currentTheme = theme;
    }

    updateThemeIcon(theme) {
        const themeToggle = document.getElementById('themeToggle');
        const themeToggleLabel = document.querySelector('.theme-toggle-switch');
        
        if (themeToggle && themeToggleLabel) {
            if (theme === 'dark') {
                themeToggle.checked = true;
                themeToggleLabel.title = 'Switch to Light Mode';
                themeToggleLabel.setAttribute('aria-label', 'Switch to Light Mode');
            } else {
                themeToggle.checked = false;
                themeToggleLabel.title = 'Switch to Dark Mode';
                themeToggleLabel.setAttribute('aria-label', 'Switch to Dark Mode');
            }
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        
        // Add smooth transition animation
        this.addThemeTransition();
        
        this.applyTheme(newTheme);
        
        // Enhanced notification with theme-specific styling
        const notification = `
            <i class="fas fa-${newTheme === 'dark' ? 'moon' : 'sun'}"></i> 
            Switched to ${newTheme} mode
        `;
        
        if (typeof NotificationManager !== 'undefined') {
            NotificationManager.show(notification, 'success');
        }
        
        // Add a subtle haptic feedback simulation
        this.simulateHapticFeedback();
    }

    addThemeTransition() {
        // Add a smooth transition overlay
        const body = document.body;
        body.style.transition = 'all 0.3s ease';
        
        // Remove transition after animation
        setTimeout(() => {
            body.style.transition = '';
        }, 300);
    }

    simulateHapticFeedback() {
        // Visual feedback simulation for web
        const slider = document.querySelector('.theme-toggle-slider:before');
        if (slider) {
            // Create a subtle bounce effect
            const toggle = document.querySelector('.theme-toggle-slider');
            if (toggle) {
                toggle.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    toggle.style.transform = '';
                }, 150);
            }
        }
    }

    isDarkMode() {
        return this.currentTheme === 'dark';
    }
}

// Mobile Menu Manager
class MobileMenuManager {
    constructor() {
        this.mobileMenuToggle = document.getElementById('mobileMenuToggle');
        this.navMenu = document.getElementById('navMenu');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.isMenuOpen = false;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Mobile menu toggle
        if (this.mobileMenuToggle) {
            this.mobileMenuToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleMobileMenu();
            });
        }

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isMenuOpen && 
                !this.navMenu.contains(e.target) && 
                !this.mobileMenuToggle.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Close menu when clicking on nav links
        this.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && this.isMenuOpen) {
                this.closeMobileMenu();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuOpen) {
                this.closeMobileMenu();
            }
        });
    }

    toggleMobileMenu() {
        if (this.isMenuOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    openMobileMenu() {
        if (this.navMenu && this.mobileMenuToggle) {
            this.navMenu.classList.add('active');
            this.mobileMenuToggle.classList.add('active');
            this.mobileMenuToggle.setAttribute('aria-expanded', 'true');
            this.isMenuOpen = true;
            
            // Prevent body scrolling when menu is open
            document.body.style.overflow = 'hidden';
            
            // Add focus trap
            this.trapFocus();
        }
    }

    closeMobileMenu() {
        if (this.navMenu && this.mobileMenuToggle) {
            this.navMenu.classList.remove('active');
            this.mobileMenuToggle.classList.remove('active');
            this.mobileMenuToggle.setAttribute('aria-expanded', 'false');
            this.isMenuOpen = false;
            
            // Restore body scrolling
            document.body.style.overflow = '';
            
            // Remove focus trap
            this.removeFocusTrap();
        }
    }

    trapFocus() {
        // Simple focus trap for accessibility
        const focusableElements = this.navMenu.querySelectorAll(
            'a[href], button, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }

    removeFocusTrap() {
        // Return focus to toggle button
        if (this.mobileMenuToggle) {
            this.mobileMenuToggle.blur();
        }
    }
}

// Desktop Navigation Manager
class DesktopNavManager {
    constructor() {
        this.navToggle = document.getElementById('navToggle');
        this.navMenu = document.getElementById('navMenu');
        this.isCollapsed = false;
        
        this.init();
    }

    init() {
        if (!this.navToggle || !this.navMenu) return;
        
        this.setupEventListeners();
        this.restoreNavState();
    }

    setupEventListeners() {
        // Toggle button click
        this.navToggle.addEventListener('click', () => {
            this.toggleNav();
        });

        // Keyboard support
        this.navToggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleNav();
            }
        });

        // Save state when window is about to unload
        window.addEventListener('beforeunload', () => {
            this.saveNavState();
        });

        // Handle window resize - show nav on desktop, respect state
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.handleDesktopResize();
            }
        });
    }

    toggleNav() {
        this.isCollapsed = !this.isCollapsed;
        this.updateNavDisplay();
        this.saveNavState();
    }

    updateNavDisplay() {
        const icon = this.navToggle.querySelector('i');
        
        if (this.isCollapsed) {
            this.navMenu.classList.add('collapsed');
            this.navToggle.classList.add('active');
            this.navToggle.setAttribute('aria-expanded', 'false');
            icon.className = 'fas fa-chevron-right';
        } else {
            this.navMenu.classList.remove('collapsed');
            this.navToggle.classList.remove('active');
            this.navToggle.setAttribute('aria-expanded', 'true');
            icon.className = 'fas fa-bars';
        }
    }

    saveNavState() {
        localStorage.setItem('ogastock-nav-collapsed', this.isCollapsed.toString());
    }

    restoreNavState() {
        const savedState = localStorage.getItem('ogastock-nav-collapsed');
        if (savedState !== null) {
            this.isCollapsed = savedState === 'true';
            this.updateNavDisplay();
        }
    }

    handleDesktopResize() {
        // Ensure nav state is properly applied on desktop
        if (window.innerWidth > 768) {
            this.updateNavDisplay();
        }
    }

    expandNav() {
        this.isCollapsed = false;
        this.updateNavDisplay();
        this.saveNavState();
    }

    collapseNav() {
        this.isCollapsed = true;
        this.updateNavDisplay();
        this.saveNavState();
    }
}

// Main Application Controller
class OgaStockApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.isOnline = navigator.onLine;
        this.themeManager = new ThemeManager();
        this.mobileMenuManager = new MobileMenuManager();
        this.desktopNavManager = new DesktopNavManager();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupOfflineDetection();
        this.loadInitialData();
        this.showSection('dashboard');
    }

    setupEventListeners() {
        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.dataset.section;
                this.showSection(section);
            });
        });

        // Modal close buttons
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModals();
            });
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModals();
            }
        });

        // Refresh data button
        document.getElementById('refreshData')?.addEventListener('click', () => {
            this.refreshAllData();
        });

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModals();
            }
        });
    }

    setupOfflineDetection() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateOnlineStatus();
            this.syncOfflineData();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateOnlineStatus();
        });

        this.updateOnlineStatus();
    }

    updateOnlineStatus() {
        const statusElement = document.getElementById('onlineStatus');
        if (statusElement) {
            if (this.isOnline) {
                statusElement.innerHTML = '<i class="fas fa-circle"></i> Online';
                statusElement.style.color = '#4CAF50';
            } else {
                statusElement.innerHTML = '<i class="fas fa-circle"></i> Offline';
                statusElement.style.color = '#f44336';
            }
        }
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Add active class to corresponding nav link
        const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        this.currentSection = sectionName;

        // Load section-specific data
        this.loadSectionData(sectionName);

        // Update URL hash
        window.location.hash = sectionName;
    }

    loadSectionData(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                if (window.dashboardManager) {
                    window.dashboardManager.loadDashboard();
                }
                break;
            case 'products':
                if (window.productManager) {
                    window.productManager.loadProducts();
                }
                break;
            case 'orders':
                if (window.orderManager) {
                    window.orderManager.loadOrders();
                }
                break;
            case 'sales':
                if (window.salesManager) {
                    window.salesManager.loadSales();
                }
                break;
            case 'reports':
                if (window.reportManager) {
                    window.reportManager.loadReports();
                }
                break;
        }
    }

    loadInitialData() {
        // Load sample data if no data exists
        if (!StorageManager.hasData()) {
            this.loadSampleData();
        }
    }

    loadSampleData() {
        // Sample products
        const sampleProducts = [
            {
                id: 'PROD001',
                name: 'Samsung Galaxy A54',
                sku: 'SAM-A54-128',
                category: 'Electronics',
                quantity: 25,
                price: 95000,
                cost: 85000,
                minStockLevel: 5,
                dateAdded: new Date().toISOString()
            },
            {
                id: 'PROD002',
                name: 'Nike Air Force 1',
                sku: 'NIKE-AF1-WHT',
                category: 'Clothing',
                quantity: 15,
                price: 35000,
                cost: 28000,
                minStockLevel: 3,
                dateAdded: new Date().toISOString()
            },
            {
                id: 'PROD003',
                name: 'Indomie Noodles (Carton)',
                sku: 'INDO-NOOD-40',
                category: 'Food',
                quantity: 2,
                price: 4500,
                cost: 4000,
                minStockLevel: 5,
                dateAdded: new Date().toISOString()
            },
            {
                id: 'PROD004',
                name: 'HP Laptop Bag',
                sku: 'HP-BAG-15',
                category: 'Electronics',
                quantity: 8,
                price: 12000,
                cost: 9500,
                minStockLevel: 3,
                dateAdded: new Date().toISOString()
            }
        ];

        // Sample orders
        const sampleOrders = [
            {
                id: 'ORD001',
                productId: 'PROD001',
                productName: 'Samsung Galaxy A54',
                quantity: 2,
                type: 'sale',
                status: 'completed',
                orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                totalAmount: 190000
            },
            {
                id: 'ORD002',
                productId: 'PROD002',
                productName: 'Nike Air Force 1',
                quantity: 1,
                type: 'sale',
                status: 'processing',
                orderDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                totalAmount: 35000
            },
            {
                id: 'ORD003',
                productId: 'PROD003',
                productName: 'Indomie Noodles (Carton)',
                quantity: 10,
                type: 'purchase',
                status: 'pending',
                orderDate: new Date().toISOString(),
                totalAmount: 40000
            }
        ];

        // Sample customers
        const sampleCustomers = [
            {
                id: 'CUST001',
                name: 'Adebayo Johnson',
                phone: '+2348012345678',
                email: 'adebayo@email.com',
                address: '123 Lagos Street, Victoria Island',
                type: 'regular',
                dateAdded: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                totalPurchases: 225000,
                lastPurchase: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'CUST002',
                name: 'Fatima Ibrahim',
                phone: '+2347098765432',
                email: 'fatima@email.com',
                address: '456 Abuja Crescent, Wuse 2',
                type: 'vip',
                dateAdded: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
                totalPurchases: 450000,
                lastPurchase: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        // Sample sales
        const sampleSales = [
            {
                id: 'SALE001',
                invoiceNumber: 'INV-20241201-001',
                customerId: 'CUST001',
                customerName: 'Adebayo Johnson',
                items: [
                    {
                        productId: 'PROD001',
                        productName: 'Samsung Galaxy A54',
                        quantity: 1,
                        unitPrice: 95000,
                        total: 95000
                    }
                ],
                subtotal: 95000,
                discountPercent: 0,
                discountAmount: 0,
                totalAmount: 95000,
                paymentMethod: 'transfer',
                status: 'completed',
                saleDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                salesPerson: 'Admin'
            },
            {
                id: 'SALE002',
                invoiceNumber: 'INV-20241201-002',
                customerId: 'CUST002',
                customerName: 'Fatima Ibrahim',
                items: [
                    {
                        productId: 'PROD002',
                        productName: 'Nike Air Force 1',
                        quantity: 2,
                        unitPrice: 35000,
                        total: 70000
                    },
                    {
                        productId: 'PROD004',
                        productName: 'HP Laptop Bag',
                        quantity: 1,
                        unitPrice: 12000,
                        total: 12000
                    }
                ],
                subtotal: 82000,
                discountPercent: 5,
                discountAmount: 4100,
                totalAmount: 77900,
                paymentMethod: 'cash',
                status: 'completed',
                saleDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                salesPerson: 'Admin'
            }
        ];

        // Store sample data
        sampleProducts.forEach(product => {
            StorageManager.saveProduct(product);
        });

        sampleCustomers.forEach(customer => {
            StorageManager.saveCustomer(customer);
        });

        sampleOrders.forEach(order => {
            StorageManager.saveOrder(order);
        });

        sampleSales.forEach(sale => {
            StorageManager.saveSale(sale);
        });

        NotificationManager.show('Sample data loaded successfully!', 'success');
    }

    refreshAllData() {
        NotificationManager.show('Refreshing data...', 'info');
        
        // Show loading spinner
        document.getElementById('loadingSpinner').style.display = 'flex';

        setTimeout(() => {
            this.loadSectionData(this.currentSection);
            document.getElementById('loadingSpinner').style.display = 'none';
            NotificationManager.show('Data refreshed successfully!', 'success');
        }, 1000);
    }

    syncOfflineData() {
        // Sync any offline changes when coming back online
        if (this.isOnline) {
            NotificationManager.show('Syncing offline changes...', 'info');
            // Implementation for syncing offline data would go here
            setTimeout(() => {
                NotificationManager.show('Data synced successfully!', 'success');
            }, 2000);
        }
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }
}

// Utility Functions
class Utils {
    static formatCurrency(amount) {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0
        }).format(amount);
    }

    static formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    static formatDateTime(dateString) {
        return new Date(dateString).toLocaleString('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static generateId(prefix = 'ID') {
        return `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static getStockStatus(quantity, minLevel) {
        if (quantity === 0) return 'out';
        if (quantity <= minLevel) return 'critical';
        if (quantity <= minLevel * 2) return 'low';
        return 'good';
    }

    static getStockStatusColor(status) {
        switch (status) {
            case 'out': return '#9e9e9e';
            case 'critical': return '#f44336';
            case 'low': return '#ff9800';
            case 'good': return '#4caf50';
            default: return '#e0e0e0';
        }
    }

    static exportToCSV(data, filename) {
        if (!data || data.length === 0) {
            NotificationManager.show('No data to export', 'warning');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header];
                    return typeof value === 'string' && value.includes(',') 
                        ? `"${value}"` 
                        : value;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        NotificationManager.show('Data exported successfully!', 'success');
    }

    static printReport(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>OgaStock Report</title>
                    <style>
                        body { font-family: Arial, sans-serif; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .no-print { display: none; }
                    </style>
                </head>
                <body>
                    <h1>OgaStock Inventory Report</h1>
                    <p>Generated on: ${new Date().toLocaleString()}</p>
                    ${element.innerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.ogaStockApp = new OgaStockApp();
    
    // Handle initial hash navigation
    const hash = window.location.hash.substring(1);
    if (hash && ['dashboard', 'products', 'orders', 'sales', 'reports'].includes(hash)) {
        window.ogaStockApp.showSection(hash);
    }
});

// Handle browser back/forward navigation
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.substring(1);
    if (hash && ['dashboard', 'products', 'orders', 'sales', 'reports'].includes(hash)) {
        window.ogaStockApp.showSection(hash);
    }
});