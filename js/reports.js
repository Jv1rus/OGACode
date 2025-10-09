// Report Manager
class ReportManager {
    constructor() {
        this.currentReport = 'sales';
        this.startDate = null;
        this.endDate = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setDefaultDateRange();
    }

    setupEventListeners() {
        // Report tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchReport(e.target.dataset.report);
            });
        });

        // Generate report button
        document.getElementById('generateReport')?.addEventListener('click', () => {
            this.generateReport();
        });

        // Export report button
        document.getElementById('exportReport')?.addEventListener('click', () => {
            this.exportCurrentReport();
        });

        // Date inputs
        document.getElementById('reportStartDate')?.addEventListener('change', (e) => {
            this.startDate = e.target.value;
        });

        document.getElementById('reportEndDate')?.addEventListener('change', (e) => {
            this.endDate = e.target.value;
        });
    }

    setDefaultDateRange() {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1); // Last 30 days

        const startInput = document.getElementById('reportStartDate');
        const endInput = document.getElementById('reportEndDate');

        if (startInput) {
            startInput.value = startDate.toISOString().split('T')[0];
            this.startDate = startInput.value;
        }

        if (endInput) {
            endInput.value = endDate.toISOString().split('T')[0];
            this.endDate = endInput.value;
        }
    }

    loadReports() {
        this.generateReport();
    }

    switchReport(reportType) {
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-report="${reportType}"]`)?.classList.add('active');

        this.currentReport = reportType;
        this.generateReport();
    }

    generateReport() {
        const container = document.getElementById('reportContent');
        if (!container) return;

        // Show loading state
        container.innerHTML = `
            <div class="report-loading">
                <div class="spinner"></div>
                <p>Generating report...</p>
            </div>
        `;

        // Simulate loading delay
        setTimeout(() => {
            switch (this.currentReport) {
                case 'sales':
                    this.generateSalesReport();
                    break;
                case 'inventory':
                    this.generateInventoryReport();
                    break;
                case 'purchase':
                    this.generatePurchaseReport();
                    break;
                default:
                    this.generateSalesReport();
            }
        }, 500);
    }

    generateSalesReport() {
        const container = document.getElementById('reportContent');
        const salesData = this.getSalesData();

        if (salesData.orders.length === 0) {
            container.innerHTML = this.getEmptyReportHTML('sales');
            return;
        }

        const summary = this.calculateSalesSummary(salesData.orders);
        
        container.innerHTML = `
            <div class="report-summary">
                <div class="summary-card revenue">
                    <h3>${Utils.formatCurrency(summary.totalRevenue)}</h3>
                    <p>Total Revenue</p>
                </div>
                <div class="summary-card profit">
                    <h3>${Utils.formatCurrency(summary.totalProfit)}</h3>
                    <p>Total Profit</p>
                </div>
                <div class="summary-card transactions">
                    <h3>${summary.totalTransactions}</h3>
                    <p>Total Sales</p>
                </div>
                <div class="summary-card">
                    <h3>${summary.avgOrderValue}</h3>
                    <p>Avg Order Value</p>
                </div>
            </div>

            <div class="charts-container">
                <div class="chart-wrapper">
                    <h4>Sales Trend</h4>
                    <div class="chart-placeholder">Chart visualization would go here</div>
                </div>
                <div class="chart-wrapper">
                    <h4>Top Products</h4>
                    <div class="chart-placeholder">Top selling products chart</div>
                </div>
            </div>

            <h4>Sales Details</h4>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Order ID</th>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                        <th>Profit</th>
                    </tr>
                </thead>
                <tbody>
                    ${salesData.orders.map(order => this.createSalesRowHTML(order)).join('')}
                </tbody>
            </table>

            <div class="export-options">
                <button class="export-btn" onclick="window.reportManager.exportSalesReport()">
                    <i class="fas fa-file-csv"></i> Export CSV
                </button>
                <button class="export-btn" onclick="window.reportManager.printReport()">
                    <i class="fas fa-print"></i> Print Report
                </button>
            </div>
        `;
    }

    generateInventoryReport() {
        const container = document.getElementById('reportContent');
        const products = StorageManager.getProducts();
        const lowStockItems = StorageManager.getLowStockItems();
        const outOfStockItems = products.filter(p => p.quantity === 0);

        const inventoryValue = StorageManager.getInventoryValue();
        const totalProducts = products.length;

        container.innerHTML = `
            <div class="report-summary">
                <div class="summary-card">
                    <h3>${Utils.formatCurrency(inventoryValue)}</h3>
                    <p>Total Inventory Value</p>
                </div>
                <div class="summary-card">
                    <h3>${totalProducts}</h3>
                    <p>Total Products</p>
                </div>
                <div class="summary-card">
                    <h3>${lowStockItems.length}</h3>
                    <p>Low Stock Items</p>
                </div>
                <div class="summary-card">
                    <h3>${outOfStockItems.length}</h3>
                    <p>Out of Stock</p>
                </div>
            </div>

            ${lowStockItems.length > 0 ? `
                <div class="inventory-alerts">
                    <h4><i class="fas fa-exclamation-triangle"></i> Stock Alerts</h4>
                    ${lowStockItems.map(item => `
                        <div class="alert-item">
                            <span>${item.name} (${item.sku})</span>
                            <span class="alert-severity ${item.quantity === 0 ? 'critical' : 'low'}">
                                ${item.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                            </span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            <h4>Inventory Details</h4>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>SKU</th>
                        <th>Category</th>
                        <th>Current Stock</th>
                        <th>Min Level</th>
                        <th>Unit Cost</th>
                        <th>Unit Price</th>
                        <th>Total Value</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(product => this.createInventoryRowHTML(product)).join('')}
                </tbody>
            </table>

            <div class="export-options">
                <button class="export-btn" onclick="window.reportManager.exportInventoryReport()">
                    <i class="fas fa-file-csv"></i> Export CSV
                </button>
                <button class="export-btn" onclick="window.reportManager.printReport()">
                    <i class="fas fa-print"></i> Print Report
                </button>
            </div>
        `;
    }

    generatePurchaseReport() {
        const container = document.getElementById('reportContent');
        const purchaseOrders = StorageManager.getOrders().filter(order => order.type === 'purchase');
        const filteredOrders = this.filterOrdersByDate(purchaseOrders);

        const summary = {
            totalOrders: filteredOrders.length,
            pendingOrders: filteredOrders.filter(o => o.status === 'pending').length,
            completedOrders: filteredOrders.filter(o => o.status === 'completed').length,
            totalAmount: filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
        };

        container.innerHTML = `
            <div class="po-summary">
                <div class="po-stat total">
                    <div class="stat-number">${summary.totalOrders}</div>
                    <div class="stat-label">Total Orders</div>
                </div>
                <div class="po-stat pending">
                    <div class="stat-number">${summary.pendingOrders}</div>
                    <div class="stat-label">Pending</div>
                </div>
                <div class="po-stat completed">
                    <div class="stat-number">${summary.completedOrders}</div>
                    <div class="stat-label">Completed</div>
                </div>
                <div class="po-stat total">
                    <div class="stat-number">${Utils.formatCurrency(summary.totalAmount)}</div>
                    <div class="stat-label">Total Value</div>
                </div>
            </div>

            ${filteredOrders.length > 0 ? `
                <h4>Purchase Order Details</h4>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Total Amount</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredOrders.map(order => this.createPurchaseRowHTML(order)).join('')}
                    </tbody>
                </table>
            ` : '<div class="report-empty"><h3>No purchase orders found for the selected period</h3></div>'}

            <div class="export-options">
                <button class="export-btn" onclick="window.reportManager.exportPurchaseReport()">
                    <i class="fas fa-file-csv"></i> Export CSV
                </button>
                <button class="export-btn" onclick="window.reportManager.printReport()">
                    <i class="fas fa-print"></i> Print Report
                </button>
            </div>
        `;
    }

    getSalesData() {
        const orders = StorageManager.getOrders()
            .filter(order => order.type === 'sale' && order.status === 'completed');
        
        return {
            orders: this.filterOrdersByDate(orders),
            period: `${this.startDate} to ${this.endDate}`
        };
    }

    filterOrdersByDate(orders) {
        if (!this.startDate || !this.endDate) return orders;

        const start = new Date(this.startDate);
        const end = new Date(this.endDate);
        end.setHours(23, 59, 59, 999); // Include full end date

        return orders.filter(order => {
            const orderDate = new Date(order.orderDate);
            return orderDate >= start && orderDate <= end;
        });
    }

    calculateSalesSummary(orders) {
        const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        
        let totalProfit = 0;
        orders.forEach(order => {
            const product = StorageManager.getProduct(order.productId);
            if (product) {
                totalProfit += (product.price - product.cost) * order.quantity;
            }
        });

        const totalTransactions = orders.length;
        const avgOrderValue = totalTransactions > 0 ? Utils.formatCurrency(totalRevenue / totalTransactions) : Utils.formatCurrency(0);

        return {
            totalRevenue,
            totalProfit,
            totalTransactions,
            avgOrderValue
        };
    }

    createSalesRowHTML(order) {
        const product = StorageManager.getProduct(order.productId);
        const unitPrice = product ? product.price : 0;
        const profit = product ? (product.price - product.cost) * order.quantity : 0;

        return `
            <tr>
                <td>${Utils.formatDate(order.orderDate)}</td>
                <td>${order.id}</td>
                <td>${order.productName}</td>
                <td>${order.quantity}</td>
                <td>${Utils.formatCurrency(unitPrice)}</td>
                <td class="amount positive">${Utils.formatCurrency(order.totalAmount || 0)}</td>
                <td class="amount ${profit >= 0 ? 'positive' : 'negative'}">${Utils.formatCurrency(profit)}</td>
            </tr>
        `;
    }

    createInventoryRowHTML(product) {
        const totalValue = product.quantity * product.cost;
        const status = Utils.getStockStatus(product.quantity, product.minStockLevel);
        const statusText = {
            'good': 'Good',
            'low': 'Low Stock',
            'critical': 'Critical',
            'out': 'Out of Stock'
        }[status];

        return `
            <tr>
                <td>${product.name}</td>
                <td>${product.sku}</td>
                <td>${product.category}</td>
                <td>${product.quantity}</td>
                <td>${product.minStockLevel}</td>
                <td>${Utils.formatCurrency(product.cost)}</td>
                <td>${Utils.formatCurrency(product.price)}</td>
                <td>${Utils.formatCurrency(totalValue)}</td>
                <td><span class="status-badge ${status}">${statusText}</span></td>
            </tr>
        `;
    }

    createPurchaseRowHTML(order) {
        return `
            <tr>
                <td>${order.id}</td>
                <td>${Utils.formatDate(order.orderDate)}</td>
                <td>${order.productName}</td>
                <td>${order.quantity}</td>
                <td>${Utils.formatCurrency(order.totalAmount || 0)}</td>
                <td><span class="status-badge ${order.status}">${order.status}</span></td>
            </tr>
        `;
    }

    getEmptyReportHTML(reportType) {
        const messages = {
            sales: 'No sales data found for the selected period.',
            inventory: 'No inventory data available.',
            purchase: 'No purchase orders found for the selected period.'
        };

        return `
            <div class="report-empty">
                <i class="fas fa-chart-line"></i>
                <h3>No Data Available</h3>
                <p>${messages[reportType]}</p>
            </div>
        `;
    }

    exportCurrentReport() {
        switch (this.currentReport) {
            case 'sales':
                this.exportSalesReport();
                break;
            case 'inventory':
                this.exportInventoryReport();
                break;
            case 'purchase':
                this.exportPurchaseReport();
                break;
        }
    }

    exportSalesReport() {
        const salesData = this.getSalesData();
        const exportData = salesData.orders.map(order => {
            const product = StorageManager.getProduct(order.productId);
            const profit = product ? (product.price - product.cost) * order.quantity : 0;
            
            return {
                'Date': Utils.formatDate(order.orderDate),
                'Order ID': order.id,
                'Product': order.productName,
                'Quantity': order.quantity,
                'Unit Price': product ? product.price : 0,
                'Total': order.totalAmount || 0,
                'Profit': profit
            };
        });

        Utils.exportToCSV(exportData, `sales_report_${this.startDate}_${this.endDate}`);
    }

    exportInventoryReport() {
        const products = StorageManager.getProducts();
        const exportData = products.map(product => ({
            'Product': product.name,
            'SKU': product.sku,
            'Category': product.category,
            'Current Stock': product.quantity,
            'Min Level': product.minStockLevel,
            'Unit Cost': product.cost,
            'Unit Price': product.price,
            'Total Value': product.quantity * product.cost,
            'Status': Utils.getStockStatus(product.quantity, product.minStockLevel)
        }));

        Utils.exportToCSV(exportData, 'inventory_report');
    }

    exportPurchaseReport() {
        const purchaseOrders = StorageManager.getOrders().filter(order => order.type === 'purchase');
        const filteredOrders = this.filterOrdersByDate(purchaseOrders);
        
        const exportData = filteredOrders.map(order => ({
            'Order ID': order.id,
            'Date': Utils.formatDate(order.orderDate),
            'Product': order.productName,
            'Quantity': order.quantity,
            'Total Amount': order.totalAmount || 0,
            'Status': order.status
        }));

        Utils.exportToCSV(exportData, `purchase_report_${this.startDate}_${this.endDate}`);
    }

    printReport() {
        Utils.printReport('reportContent');
    }
}

// Initialize Report Manager
document.addEventListener('DOMContentLoaded', () => {
    window.reportManager = new ReportManager();
});