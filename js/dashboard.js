// Dashboard Manager
class DashboardManager {
    constructor() {
        this.refreshInterval = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startAutoRefresh();
    }

    setupEventListeners() {
        // Quick actions could be added here
    }

    loadDashboard() {
        this.updateStats();
        this.loadRecentTransactions();
        this.loadLowStockItems();
    }

    updateStats() {
        // Calculate and display key metrics
        const inventoryValue = StorageManager.getInventoryValue();
        const totalProfit = StorageManager.getTotalProfit();
        const totalRevenue = StorageManager.getTotalRevenue();
        const lowStockCount = StorageManager.getLowStockItems().length;

        // Update DOM elements
        document.getElementById('inventoryValue').textContent = Utils.formatCurrency(inventoryValue);
        document.getElementById('totalProfit').textContent = Utils.formatCurrency(totalProfit);
        document.getElementById('salesAlerts').textContent = lowStockCount;

        // Calculate total loss (simplified as cost of expired/damaged items)
        const totalLoss = this.calculateTotalLoss();
        document.getElementById('totalLoss').textContent = Utils.formatCurrency(totalLoss);
    }

    calculateTotalLoss() {
        // For now, we'll simulate loss calculation
        // In a real app, this would track damaged, expired, or stolen inventory
        const orders = StorageManager.getOrders();
        const returnedOrders = orders.filter(order => order.type === 'return' && order.status === 'completed');
        
        return returnedOrders.reduce((total, order) => {
            const product = StorageManager.getProduct(order.productId);
            if (product) {
                return total + (product.cost * order.quantity);
            }
            return total;
        }, 0);
    }

    loadRecentTransactions() {
        const container = document.getElementById('recentTransactions');
        const transactions = StorageManager.getRecentTransactions(5);

        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <h3>No Recent Transactions</h3>
                    <p>Transactions will appear here once you start processing orders.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = transactions.map(transaction => {
            const isPositive = transaction.type === 'sale';
            const amountClass = isPositive ? 'positive' : 'negative';
            const icon = isPositive ? 'fa-arrow-up' : 'fa-arrow-down';
            
            return `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <div class="product-name">${transaction.productName}</div>
                        <div class="transaction-date">${Utils.formatDateTime(transaction.orderDate)}</div>
                    </div>
                    <div class="transaction-amount ${amountClass}">
                        <i class="fas ${icon}"></i>
                        ${Utils.formatCurrency(transaction.totalAmount || 0)}
                    </div>
                </div>
            `;
        }).join('');
    }

    loadLowStockItems() {
        const container = document.getElementById('lowStockItems');
        const lowStockItems = StorageManager.getLowStockItems();

        if (lowStockItems.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <h3>All Stock Levels Good</h3>
                    <p>No items are currently running low on stock.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = lowStockItems.map(item => {
            const status = Utils.getStockStatus(item.quantity, item.minStockLevel);
            const statusClass = item.quantity === 0 ? 'critical' : 'low';
            const statusText = item.quantity === 0 ? 'Out of Stock' : 'Low Stock';
            
            return `
                <div class="low-stock-item">
                    <div class="stock-info">
                        <div class="product-name">${item.name}</div>
                        <div class="stock-level">Current: ${item.quantity} | Min: ${item.minStockLevel}</div>
                    </div>
                    <div class="stock-status ${statusClass}">${statusText}</div>
                </div>
            `;
        }).join('');
    }

    startAutoRefresh() {
        // Refresh dashboard every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.loadDashboard();
        }, 30000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    // Quick Stats for other sections
    getQuickStats() {
        const products = StorageManager.getProducts();
        const orders = StorageManager.getOrders();
        
        return {
            totalProducts: products.length,
            totalOrders: orders.length,
            pendingOrders: orders.filter(o => o.status === 'pending').length,
            completedOrders: orders.filter(o => o.status === 'completed').length,
            lowStockItems: StorageManager.getLowStockItems().length,
            outOfStockItems: products.filter(p => p.quantity === 0).length,
            totalRevenue: StorageManager.getTotalRevenue(),
            totalProfit: StorageManager.getTotalProfit(),
            inventoryValue: StorageManager.getInventoryValue()
        };
    }

    // Export dashboard data
    exportDashboardData() {
        const stats = this.getQuickStats();
        const recentTransactions = StorageManager.getRecentTransactions(10);
        const lowStockItems = StorageManager.getLowStockItems();
        
        const data = {
            exportDate: new Date().toISOString(),
            stats,
            recentTransactions,
            lowStockItems
        };
        
        Utils.exportToCSV([stats], 'dashboard_stats');
        return data;
    }
}

// Initialize Dashboard Manager
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
});