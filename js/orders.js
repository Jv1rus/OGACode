// Order Manager
class OrderManager {
    constructor() {
        this.currentFilter = '';
        this.currentStatus = '';
        this.currentType = '';
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add order button
        document.getElementById('addOrderBtn')?.addEventListener('click', () => {
            this.showOrderModal();
        });

        // Order form submission
        document.getElementById('orderForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveOrder();
        });

        // Cancel button
        document.getElementById('cancelOrderBtn')?.addEventListener('click', () => {
            this.closeOrderModal();
        });

        // Filter event listeners would be added here for status, type, date filters
    }

    loadOrders() {
        this.loadOrderStats();
        this.renderOrders();
        this.populateProductDropdown();
    }

    loadOrderStats() {
        const orders = StorageManager.getOrders();
        
        const stats = {
            pending: orders.filter(o => o.status === 'pending').length,
            processing: orders.filter(o => o.status === 'processing').length,
            completed: orders.filter(o => o.status === 'completed').length,
            cancelled: orders.filter(o => o.status === 'cancelled').length,
            totalRevenue: orders
                .filter(o => o.type === 'sale' && o.status === 'completed')
                .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
        };

        // Update stats display if elements exist
        this.updateStatsDisplay(stats);
    }

    updateStatsDisplay(stats) {
        // This would update stat cards if they exist in the orders section
        const statsContainer = document.querySelector('#orders .order-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="order-stat-card pending">
                    <div class="stat-number">${stats.pending}</div>
                    <div class="stat-label">Pending</div>
                </div>
                <div class="order-stat-card processing">
                    <div class="stat-number">${stats.processing}</div>
                    <div class="stat-label">Processing</div>
                </div>
                <div class="order-stat-card completed">
                    <div class="stat-number">${stats.completed}</div>
                    <div class="stat-label">Completed</div>
                </div>
                <div class="order-stat-card revenue">
                    <div class="stat-number">${Utils.formatCurrency(stats.totalRevenue)}</div>
                    <div class="stat-label">Revenue</div>
                </div>
            `;
        }
    }

    renderOrders() {
        const tbody = document.querySelector('#ordersTable tbody');
        if (!tbody) return;

        const orders = this.getFilteredOrders();

        if (orders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <div class="empty-state">
                            <i class="fas fa-shopping-cart" style="font-size: 3rem; color: #ccc; margin-bottom: 15px;"></i>
                            <h3>No Orders Found</h3>
                            <p>Start by creating your first order.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = orders.map(order => this.createOrderRow(order)).join('');
    }

    getFilteredOrders() {
        let orders = StorageManager.getOrders();

        // Apply filters (implement as needed)
        if (this.currentStatus) {
            orders = orders.filter(order => order.status === this.currentStatus);
        }

        if (this.currentType) {
            orders = orders.filter(order => order.type === this.currentType);
        }

        // Sort by date (newest first)
        return orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    }

    createOrderRow(order) {
        const statusBadge = this.createStatusBadge(order.status);
        const actions = this.createOrderActions(order);

        return `
            <tr>
                <td>${order.id}</td>
                <td>${order.productName}</td>
                <td>${order.quantity}</td>
                <td>${Utils.formatDate(order.orderDate)}</td>
                <td>${statusBadge}</td>
                <td>${actions}</td>
            </tr>
        `;
    }

    createStatusBadge(status) {
        const statusConfig = {
            pending: { class: 'pending', icon: 'fa-clock', text: 'Pending' },
            processing: { class: 'processing', icon: 'fa-spinner', text: 'Processing' },
            completed: { class: 'completed', icon: 'fa-check', text: 'Completed' },
            cancelled: { class: 'cancelled', icon: 'fa-times', text: 'Cancelled' },
            returned: { class: 'returned', icon: 'fa-undo', text: 'Returned' }
        };

        const config = statusConfig[status] || statusConfig.pending;
        
        return `
            <span class="status-badge ${config.class}">
                <i class="fas ${config.icon}"></i>
                ${config.text}
            </span>
        `;
    }

    createOrderActions(order) {
        return `
            <div class="order-actions">
                <button class="order-action-btn view" onclick="window.orderManager.viewOrder('${order.id}')" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="order-action-btn edit" onclick="window.orderManager.editOrderStatus('${order.id}')" title="Edit Status">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="order-action-btn delete" onclick="window.orderManager.deleteOrder('${order.id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }

    showOrderModal(orderId = null) {
        const modal = document.getElementById('orderModal');
        const form = document.getElementById('orderForm');
        const title = document.getElementById('orderModalTitle');

        if (orderId) {
            const order = StorageManager.getOrder(orderId);
            if (order) {
                title.textContent = 'Edit Order';
                this.populateOrderForm(order);
            }
        } else {
            title.textContent = 'New Order';
            form.reset();
        }

        modal.style.display = 'block';
    }

    closeOrderModal() {
        document.getElementById('orderModal').style.display = 'none';
        document.getElementById('orderForm').reset();
    }

    populateProductDropdown() {
        const productSelect = document.getElementById('orderProduct');
        if (!productSelect) return;

        const products = StorageManager.getProducts();
        
        productSelect.innerHTML = '<option value="">Select Product</option>' +
            products.map(product => 
                `<option value="${product.id}" data-price="${product.price}">
                    ${product.name} (${product.sku}) - Stock: ${product.quantity}
                </option>`
            ).join('');
    }

    populateOrderForm(order) {
        document.getElementById('orderProduct').value = order.productId;
        document.getElementById('orderQuantity').value = order.quantity;
        document.getElementById('orderType').value = order.type;
    }

    saveOrder() {
        const productId = document.getElementById('orderProduct').value;
        const quantity = parseInt(document.getElementById('orderQuantity').value);
        const type = document.getElementById('orderType').value;

        if (!this.validateOrder(productId, quantity, type)) {
            return;
        }

        const product = StorageManager.getProduct(productId);
        const totalAmount = product.price * quantity;

        const order = {
            productId,
            productName: product.name,
            quantity,
            type,
            status: 'pending',
            totalAmount,
            orderDate: new Date().toISOString()
        };

        // Additional validation for sales
        if (type === 'sale' && product.quantity < quantity) {
            NotificationManager.show('Insufficient stock for this sale!', 'error');
            return;
        }

        StorageManager.saveOrder(order);
        this.closeOrderModal();
        this.renderOrders();
        this.loadOrderStats();
        
        NotificationManager.show('Order created successfully!', 'success');
    }

    validateOrder(productId, quantity, type) {
        if (!productId) {
            NotificationManager.show('Please select a product!', 'error');
            return false;
        }

        if (!quantity || quantity <= 0) {
            NotificationManager.show('Quantity must be greater than 0!', 'error');
            return false;
        }

        if (!type) {
            NotificationManager.show('Please select order type!', 'error');
            return false;
        }

        return true;
    }

    viewOrder(orderId) {
        const order = StorageManager.getOrder(orderId);
        if (!order) return;

        const product = StorageManager.getProduct(order.productId);
        
        // Create a simple modal or alert with order details
        // For now, using alert - could be enhanced with a proper modal
        const details = `
Order Details:
--------------
Order ID: ${order.id}
Product: ${order.productName}
Quantity: ${order.quantity}
Type: ${order.type.toUpperCase()}
Status: ${order.status.toUpperCase()}
Order Date: ${Utils.formatDateTime(order.orderDate)}
Total Amount: ${Utils.formatCurrency(order.totalAmount || 0)}
        `;
        
        alert(details);
    }

    editOrderStatus(orderId) {
        const order = StorageManager.getOrder(orderId);
        if (!order) return;

        const statuses = ['pending', 'processing', 'completed', 'cancelled', 'returned'];
        const currentIndex = statuses.indexOf(order.status);
        
        let options = statuses.map((status, index) => 
            `${index + 1}. ${status.charAt(0).toUpperCase() + status.slice(1)}${index === currentIndex ? ' (current)' : ''}`
        ).join('\n');

        const choice = prompt(`Select new status for order ${order.id}:\n\n${options}\n\nEnter number (1-5):`);
        
        if (choice && !isNaN(choice)) {
            const newStatusIndex = parseInt(choice) - 1;
            if (newStatusIndex >= 0 && newStatusIndex < statuses.length) {
                const newStatus = statuses[newStatusIndex];
                StorageManager.updateOrderStatus(orderId, newStatus);
                this.renderOrders();
                this.loadOrderStats();
                NotificationManager.show(`Order status updated to ${newStatus}!`, 'success');
                
                // Refresh dashboard if it's loaded
                if (window.dashboardManager) {
                    window.dashboardManager.loadDashboard();
                }
            }
        }
    }

    deleteOrder(orderId) {
        const order = StorageManager.getOrder(orderId);
        if (!order) return;

        if (confirm(`Are you sure you want to delete order ${order.id}? This action cannot be undone.`)) {
            StorageManager.deleteOrder(orderId);
            this.renderOrders();
            this.loadOrderStats();
            NotificationManager.show('Order deleted successfully!', 'success');
        }
    }

    exportOrders() {
        const orders = StorageManager.getOrders();
        const exportData = orders.map(order => ({
            'Order ID': order.id,
            'Product Name': order.productName,
            'Quantity': order.quantity,
            'Type': order.type,
            'Status': order.status,
            'Order Date': Utils.formatDate(order.orderDate),
            'Total Amount': order.totalAmount || 0
        }));

        Utils.exportToCSV(exportData, 'orders');
    }

    // Quick order creation for common actions
    createQuickSale(productId, quantity = 1) {
        const product = StorageManager.getProduct(productId);
        if (!product) return;

        if (product.quantity < quantity) {
            NotificationManager.show('Insufficient stock!', 'error');
            return;
        }

        const order = {
            productId,
            productName: product.name,
            quantity,
            type: 'sale',
            status: 'completed',
            totalAmount: product.price * quantity,
            orderDate: new Date().toISOString()
        };

        StorageManager.saveOrder(order);
        NotificationManager.show('Quick sale completed!', 'success');
        
        // Refresh displays
        this.renderOrders();
        this.loadOrderStats();
        if (window.dashboardManager) {
            window.dashboardManager.loadDashboard();
        }
    }
}

// Initialize Order Manager
document.addEventListener('DOMContentLoaded', () => {
    window.orderManager = new OrderManager();
});