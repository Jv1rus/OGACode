// Local Storage Manager for PWA offline functionality
class StorageManager {
    static STORAGE_KEYS = {
        PRODUCTS: 'ogastock_products',
        ORDERS: 'ogastock_orders',
        CUSTOMERS: 'ogastock_customers',
        SALES: 'ogastock_sales',
        SETTINGS: 'ogastock_settings',
        SYNC_QUEUE: 'ogastock_sync_queue'
    };

    // Products Management
    static saveProduct(product) {
        const products = this.getProducts();
        const existingIndex = products.findIndex(p => p.id === product.id);
        
        if (existingIndex >= 0) {
            products[existingIndex] = { ...products[existingIndex], ...product };
        } else {
            product.id = product.id || Utils.generateId('PROD');
            product.dateAdded = product.dateAdded || new Date().toISOString();
            products.push(product);
        }
        
        localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
        this.addToSyncQueue('product', product.id, 'save');
        return product;
    }

    static getProducts() {
        const data = localStorage.getItem(this.STORAGE_KEYS.PRODUCTS);
        return data ? JSON.parse(data) : [];
    }

    static getProduct(id) {
        const products = this.getProducts();
        return products.find(p => p.id === id);
    }

    static deleteProduct(id) {
        const products = this.getProducts();
        const filteredProducts = products.filter(p => p.id !== id);
        localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(filteredProducts));
        this.addToSyncQueue('product', id, 'delete');
        return true;
    }

    static updateProductStock(productId, quantity, operation = 'set') {
        const product = this.getProduct(productId);
        if (!product) return false;

        switch (operation) {
            case 'add':
                product.quantity += quantity;
                break;
            case 'subtract':
                product.quantity = Math.max(0, product.quantity - quantity);
                break;
            case 'set':
            default:
                product.quantity = quantity;
                break;
        }

        return this.saveProduct(product);
    }

    // Customer Management
    static saveCustomer(customer) {
        const customers = this.getCustomers();
        const existingIndex = customers.findIndex(c => c.id === customer.id);
        
        if (existingIndex >= 0) {
            customers[existingIndex] = { ...customers[existingIndex], ...customer };
        } else {
            customer.id = customer.id || Utils.generateId('CUST');
            customer.dateAdded = customer.dateAdded || new Date().toISOString();
            customers.push(customer);
        }
        
        localStorage.setItem(this.STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
        this.addToSyncQueue('customer', customer.id, 'save');
        return customer;
    }

    static getCustomers() {
        const data = localStorage.getItem(this.STORAGE_KEYS.CUSTOMERS);
        return data ? JSON.parse(data) : [];
    }

    static getCustomer(id) {
        const customers = this.getCustomers();
        return customers.find(c => c.id === id);
    }

    static deleteCustomer(id) {
        const customers = this.getCustomers();
        const filteredCustomers = customers.filter(c => c.id !== id);
        localStorage.setItem(this.STORAGE_KEYS.CUSTOMERS, JSON.stringify(filteredCustomers));
        this.addToSyncQueue('customer', id, 'delete');
        return true;
    }

    static updateCustomerPurchaseHistory(customerId, saleAmount) {
        const customer = this.getCustomer(customerId);
        if (customer) {
            customer.totalPurchases = (customer.totalPurchases || 0) + saleAmount;
            customer.lastPurchase = new Date().toISOString();
            this.saveCustomer(customer);
        }
    }

    // Sales Management
    static saveSale(sale) {
        const sales = this.getSales();
        const existingIndex = sales.findIndex(s => s.id === sale.id);
        
        if (existingIndex >= 0) {
            sales[existingIndex] = { ...sales[existingIndex], ...sale };
        } else {
            sale.id = sale.id || Utils.generateId('SALE');
            sale.saleDate = sale.saleDate || new Date().toISOString();
            sales.push(sale);
        }
        
        localStorage.setItem(this.STORAGE_KEYS.SALES, JSON.stringify(sales));
        this.addToSyncQueue('sale', sale.id, 'save');
        
        // Update customer purchase history if applicable
        if (sale.customerId && sale.status === 'completed') {
            this.updateCustomerPurchaseHistory(sale.customerId, sale.totalAmount);
        }
        
        return sale;
    }

    static getSales() {
        const data = localStorage.getItem(this.STORAGE_KEYS.SALES);
        return data ? JSON.parse(data) : [];
    }

    static getSale(id) {
        const sales = this.getSales();
        return sales.find(s => s.id === id);
    }

    static deleteSale(id) {
        const sales = this.getSales();
        const filteredSales = sales.filter(s => s.id !== id);
        localStorage.setItem(this.STORAGE_KEYS.SALES, JSON.stringify(filteredSales));
        this.addToSyncQueue('sale', id, 'delete');
        return true;
    }

    // Orders Management
    static saveOrder(order) {
        const orders = this.getOrders();
        const existingIndex = orders.findIndex(o => o.id === order.id);
        
        if (existingIndex >= 0) {
            orders[existingIndex] = { ...orders[existingIndex], ...order };
        } else {
            order.id = order.id || Utils.generateId('ORD');
            order.orderDate = order.orderDate || new Date().toISOString();
            orders.push(order);
        }
        
        localStorage.setItem(this.STORAGE_KEYS.ORDERS, JSON.stringify(orders));
        this.addToSyncQueue('order', order.id, 'save');
        
        // Update product stock for sales
        if (order.type === 'sale' && order.status === 'completed') {
            this.updateProductStock(order.productId, order.quantity, 'subtract');
        } else if (order.type === 'purchase' && order.status === 'completed') {
            this.updateProductStock(order.productId, order.quantity, 'add');
        }
        
        return order;
    }

    static getOrders() {
        const data = localStorage.getItem(this.STORAGE_KEYS.ORDERS);
        return data ? JSON.parse(data) : [];
    }

    static getOrder(id) {
        const orders = this.getOrders();
        return orders.find(o => o.id === id);
    }

    static deleteOrder(id) {
        const orders = this.getOrders();
        const filteredOrders = orders.filter(o => o.id !== id);
        localStorage.setItem(this.STORAGE_KEYS.ORDERS, JSON.stringify(filteredOrders));
        this.addToSyncQueue('order', id, 'delete');
        return true;
    }

    static updateOrderStatus(orderId, status) {
        const order = this.getOrder(orderId);
        if (!order) return false;

        const oldStatus = order.status;
        order.status = status;
        
        // Handle stock updates based on status changes
        if (oldStatus !== 'completed' && status === 'completed') {
            if (order.type === 'sale') {
                this.updateProductStock(order.productId, order.quantity, 'subtract');
            } else if (order.type === 'purchase') {
                this.updateProductStock(order.productId, order.quantity, 'add');
            }
        } else if (oldStatus === 'completed' && status !== 'completed') {
            // Reverse the stock change
            if (order.type === 'sale') {
                this.updateProductStock(order.productId, order.quantity, 'add');
            } else if (order.type === 'purchase') {
                this.updateProductStock(order.productId, order.quantity, 'subtract');
            }
        }
        
        return this.saveOrder(order);
    }

    // Settings Management
    static saveSettings(settings) {
        const currentSettings = this.getSettings();
        const newSettings = { ...currentSettings, ...settings };
        localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
        return newSettings;
    }

    static getSettings() {
        const data = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
        return data ? JSON.parse(data) : {
            currency: 'NGN',
            lowStockThreshold: 5,
            autoBackup: true,
            notifications: true,
            darkMode: false
        };
    }

    // Analytics and Reports
    static getInventoryValue() {
        const products = this.getProducts();
        return products.reduce((total, product) => {
            return total + (product.quantity * product.cost);
        }, 0);
    }

    static getTotalProfit() {
        const orders = this.getOrders();
        return orders
            .filter(order => order.type === 'sale' && order.status === 'completed')
            .reduce((total, order) => {
                const product = this.getProduct(order.productId);
                if (product) {
                    const profit = (product.price - product.cost) * order.quantity;
                    return total + profit;
                }
                return total;
            }, 0);
    }

    static getTotalRevenue() {
        const orders = this.getOrders();
        return orders
            .filter(order => order.type === 'sale' && order.status === 'completed')
            .reduce((total, order) => total + (order.totalAmount || 0), 0);
    }

    static getLowStockItems() {
        const products = this.getProducts();
        return products.filter(product => product.quantity <= product.minStockLevel);
    }

    static getTopSellingProducts(limit = 5) {
        const orders = this.getOrders();
        const salesMap = {};
        
        orders
            .filter(order => order.type === 'sale' && order.status === 'completed')
            .forEach(order => {
                if (salesMap[order.productId]) {
                    salesMap[order.productId].quantity += order.quantity;
                    salesMap[order.productId].revenue += order.totalAmount || 0;
                } else {
                    salesMap[order.productId] = {
                        productId: order.productId,
                        productName: order.productName,
                        quantity: order.quantity,
                        revenue: order.totalAmount || 0
                    };
                }
            });
            
        return Object.values(salesMap)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, limit);
    }

    static getRecentTransactions(limit = 10) {
        const orders = this.getOrders();
        return orders
            .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
            .slice(0, limit);
    }

    static getSalesData(startDate, endDate) {
        const orders = this.getOrders();
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return orders.filter(order => {
            const orderDate = new Date(order.orderDate);
            return orderDate >= start && orderDate <= end && 
                   order.type === 'sale' && order.status === 'completed';
        });
    }

    // Sync Queue Management (for offline functionality)
    static addToSyncQueue(type, id, action) {
        const queue = this.getSyncQueue();
        queue.push({
            type,
            id,
            action,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem(this.STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    }

    static getSyncQueue() {
        const data = localStorage.getItem(this.STORAGE_KEYS.SYNC_QUEUE);
        return data ? JSON.parse(data) : [];
    }

    static clearSyncQueue() {
        localStorage.setItem(this.STORAGE_KEYS.SYNC_QUEUE, JSON.stringify([]));
    }

    // Data Management
    static exportData() {
        return {
            products: this.getProducts(),
            orders: this.getOrders(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString()
        };
    }

    static importData(data) {
        try {
            if (data.products) {
                localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products));
            }
            if (data.orders) {
                localStorage.setItem(this.STORAGE_KEYS.ORDERS, JSON.stringify(data.orders));
            }
            if (data.settings) {
                localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
            }
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    static clearAllData() {
        Object.values(this.STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }

    static hasData() {
        const products = this.getProducts();
        const orders = this.getOrders();
        return products.length > 0 || orders.length > 0;
    }

    // Backup and Restore
    static createBackup() {
        const data = this.exportData();
        const backup = {
            ...data,
            version: '1.0',
            backupDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ogastock_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        return backup;
    }

    static restoreFromBackup(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const backup = JSON.parse(e.target.result);
                    if (this.importData(backup)) {
                        resolve(backup);
                    } else {
                        reject(new Error('Failed to import backup data'));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read backup file'));
            reader.readAsText(file);
        });
    }
}