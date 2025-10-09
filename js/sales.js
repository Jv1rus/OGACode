// Sales Manager
class SalesManager {
    constructor() {
        this.currentSale = {
            items: [],
            customer: null,
            subtotal: 0,
            discount: 0,
            total: 0
        };
        this.currentFilter = {
            dateRange: 'month',
            status: '',
            customer: '',
            search: ''
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Main action buttons
        document.getElementById('quickSaleBtn')?.addEventListener('click', () => {
            this.toggleQuickSalePanel();
        });

        document.getElementById('newSaleBtn')?.addEventListener('click', () => {
            this.showSaleModal();
        });

        // Sale form handling
        document.getElementById('saleForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processSale();
        });

        document.getElementById('cancelSaleBtn')?.addEventListener('click', () => {
            this.closeSaleModal();
        });

        // Customer management
        document.getElementById('addCustomerBtn')?.addEventListener('click', () => {
            this.showCustomerModal();
        });

        document.getElementById('customerForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCustomer();
        });

        document.getElementById('cancelCustomerBtn')?.addEventListener('click', () => {
            this.closeCustomerModal();
        });

        // Add item to sale
        document.getElementById('addItemBtn')?.addEventListener('click', () => {
            this.addItemToSale();
        });

        // Discount and calculation updates
        document.getElementById('saleDiscount')?.addEventListener('input', () => {
            this.updateSaleCalculations();
        });

        // Filter handling
        document.getElementById('salesDateFilter')?.addEventListener('change', (e) => {
            this.currentFilter.dateRange = e.target.value;
            this.loadSales();
        });

        document.getElementById('salesStatusFilter')?.addEventListener('change', (e) => {
            this.currentFilter.status = e.target.value;
            this.loadSales();
        });

        document.getElementById('salesCustomerFilter')?.addEventListener('change', (e) => {
            this.currentFilter.customer = e.target.value;
            this.loadSales();
        });

        document.getElementById('salesSearch')?.addEventListener('input', Utils.debounce((e) => {
            this.currentFilter.search = e.target.value.toLowerCase();
            this.loadSales();
        }, 300));

        // Quick sale panel
        document.getElementById('processQuickSale')?.addEventListener('click', () => {
            this.processQuickSale();
        });

        document.getElementById('cancelQuickSale')?.addEventListener('click', () => {
            this.hideQuickSalePanel();
        });

        // Modal close buttons
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }

    loadSales() {
        this.updateSalesStats();
        this.renderSalesTable();
        this.loadCustomers();
        this.loadProductsForSale();
    }

    updateSalesStats() {
        const sales = this.getFilteredSales();
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // Calculate today's sales
        const todaysSales = sales.filter(sale => {
            const saleDate = new Date(sale.saleDate);
            return saleDate >= startOfToday && sale.status === 'completed';
        });

        const todaysTotal = todaysSales.reduce((sum, sale) => sum + sale.totalAmount, 0);

        // Calculate month's sales
        const monthSales = sales.filter(sale => {
            const saleDate = new Date(sale.saleDate);
            return saleDate >= startOfMonth && sale.status === 'completed';
        });

        const monthTotal = monthSales.reduce((sum, sale) => sum + sale.totalAmount, 0);

        // Calculate total customers
        const customers = StorageManager.getCustomers() || [];
        const totalCustomers = customers.length;

        // Calculate average sale value
        const completedSales = sales.filter(sale => sale.status === 'completed');
        const avgSaleValue = completedSales.length > 0 
            ? completedSales.reduce((sum, sale) => sum + sale.totalAmount, 0) / completedSales.length 
            : 0;

        // Update DOM
        document.getElementById('salesToday').textContent = Utils.formatCurrency(todaysTotal);
        document.getElementById('salesMonth').textContent = Utils.formatCurrency(monthTotal);
        document.getElementById('totalCustomers').textContent = totalCustomers;
        document.getElementById('avgSaleValue').textContent = Utils.formatCurrency(avgSaleValue);
    }

    renderSalesTable() {
        const tbody = document.getElementById('salesTableBody');
        if (!tbody) return;

        const sales = this.getFilteredSales();

        if (sales.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px;">
                        <div class="sales-empty">
                            <i class="fas fa-receipt" style="font-size: 3rem; color: #ccc; margin-bottom: 15px;"></i>
                            <h3>No Sales Found</h3>
                            <p>Start by creating your first sale.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = sales.map(sale => this.createSaleRow(sale)).join('');
    }

    createSaleRow(sale) {
        const statusBadge = this.createSaleStatusBadge(sale.status);
        const paymentBadge = this.createPaymentMethodBadge(sale.paymentMethod);
        const actions = this.createSaleActions(sale);

        return `
            <tr>
                <td>${sale.invoiceNumber}</td>
                <td>${Utils.formatDate(sale.saleDate)}</td>
                <td>${sale.customerName || 'Walk-in Customer'}</td>
                <td>${sale.items.length} item(s)</td>
                <td>${Utils.formatCurrency(sale.totalAmount)}</td>
                <td>${paymentBadge}</td>
                <td>${statusBadge}</td>
                <td>${actions}</td>
            </tr>
        `;
    }

    createSaleStatusBadge(status) {
        const statusConfig = {
            completed: { class: 'completed', icon: 'fa-check', text: 'Completed' },
            pending: { class: 'pending', icon: 'fa-clock', text: 'Pending' },
            refunded: { class: 'refunded', icon: 'fa-undo', text: 'Refunded' }
        };

        const config = statusConfig[status] || statusConfig.completed;
        
        return `
            <span class="sale-status ${config.class}">
                <i class="fas ${config.icon}"></i>
                ${config.text}
            </span>
        `;
    }

    createPaymentMethodBadge(method) {
        return `<span class="payment-method ${method}">${method.toUpperCase()}</span>`;
    }

    createSaleActions(sale) {
        return `
            <div class="sale-actions">
                <button class="sale-action-btn view" onclick="window.salesManager.viewSale('${sale.id}')" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="sale-action-btn print" onclick="window.salesManager.printSale('${sale.id}')" title="Print Receipt">
                    <i class="fas fa-print"></i>
                </button>
                ${sale.status === 'completed' ? `
                    <button class="sale-action-btn refund" onclick="window.salesManager.refundSale('${sale.id}')" title="Refund">
                        <i class="fas fa-undo"></i>
                    </button>
                ` : ''}
            </div>
        `;
    }

    getFilteredSales() {
        let sales = StorageManager.getSales() || [];

        // Apply date filter
        if (this.currentFilter.dateRange !== '') {
            const now = new Date();
            let startDate;

            switch (this.currentFilter.dateRange) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'quarter':
                    startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
            }

            if (startDate) {
                sales = sales.filter(sale => new Date(sale.saleDate) >= startDate);
            }
        }

        // Apply status filter
        if (this.currentFilter.status) {
            sales = sales.filter(sale => sale.status === this.currentFilter.status);
        }

        // Apply customer filter
        if (this.currentFilter.customer) {
            sales = sales.filter(sale => sale.customerId === this.currentFilter.customer);
        }

        // Apply search filter
        if (this.currentFilter.search) {
            sales = sales.filter(sale => 
                sale.invoiceNumber.toLowerCase().includes(this.currentFilter.search) ||
                (sale.customerName && sale.customerName.toLowerCase().includes(this.currentFilter.search)) ||
                sale.items.some(item => item.productName.toLowerCase().includes(this.currentFilter.search))
            );
        }

        return sales.sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate));
    }

    showSaleModal() {
        this.resetCurrentSale();
        document.getElementById('saleModal').style.display = 'block';
        document.getElementById('saleModalTitle').textContent = 'New Sale';
        this.loadCustomersForSale();
        this.loadProductsForSale();
        this.updateSaleCalculations();
    }

    closeSaleModal() {
        document.getElementById('saleModal').style.display = 'none';
        this.resetCurrentSale();
    }

    showCustomerModal() {
        document.getElementById('customerModal').style.display = 'block';
        document.getElementById('customerForm').reset();
    }

    closeCustomerModal() {
        document.getElementById('customerModal').style.display = 'none';
    }

    loadCustomersForSale() {
        const customerSelect = document.getElementById('saleCustomer');
        const filterSelect = document.getElementById('salesCustomerFilter');
        
        if (!customerSelect) return;

        const customers = StorageManager.getCustomers() || [];
        
        customerSelect.innerHTML = '<option value="walk-in">Walk-in Customer</option>' +
            customers.map(customer => 
                `<option value="${customer.id}">${customer.name} - ${customer.phone || 'No phone'}</option>`
            ).join('');

        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">All Customers</option>' +
                customers.map(customer => 
                    `<option value="${customer.id}">${customer.name}</option>`
                ).join('');
        }
    }

    loadProductsForSale() {
        const productSelect = document.getElementById('saleProduct');
        if (!productSelect) return;

        const products = StorageManager.getProducts().filter(p => p.quantity > 0);
        
        productSelect.innerHTML = '<option value="">Select Product</option>' +
            products.map(product => 
                `<option value="${product.id}" data-price="${product.price}" data-stock="${product.quantity}">
                    ${product.name} - ${Utils.formatCurrency(product.price)} (Stock: ${product.quantity})
                </option>`
            ).join('');
    }

    addItemToSale() {
        const productId = document.getElementById('saleProduct').value;
        const quantity = parseInt(document.getElementById('saleQuantity').value) || 1;

        if (!productId) {
            NotificationManager.show('Please select a product', 'warning');
            return;
        }

        const product = StorageManager.getProduct(productId);
        if (!product) {
            NotificationManager.show('Product not found', 'error');
            return;
        }

        if (quantity > product.quantity) {
            NotificationManager.show('Insufficient stock available', 'error');
            return;
        }

        // Check if item already exists in current sale
        const existingIndex = this.currentSale.items.findIndex(item => item.productId === productId);
        
        if (existingIndex >= 0) {
            // Update quantity
            const newQuantity = this.currentSale.items[existingIndex].quantity + quantity;
            if (newQuantity > product.quantity) {
                NotificationManager.show('Total quantity exceeds available stock', 'error');
                return;
            }
            this.currentSale.items[existingIndex].quantity = newQuantity;
            this.currentSale.items[existingIndex].total = newQuantity * product.price;
        } else {
            // Add new item
            this.currentSale.items.push({
                productId: product.id,
                productName: product.name,
                quantity: quantity,
                unitPrice: product.price,
                total: quantity * product.price
            });
        }

        this.renderSaleItems();
        this.updateSaleCalculations();

        // Reset form
        document.getElementById('saleProduct').value = '';
        document.getElementById('saleQuantity').value = '1';
    }

    renderSaleItems() {
        const container = document.getElementById('saleItemsList');
        if (!container) return;

        if (this.currentSale.items.length === 0) {
            container.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">No items added yet</div>';
            return;
        }

        container.innerHTML = this.currentSale.items.map((item, index) => `
            <div class="sale-item">
                <div class="sale-item-info">
                    <div class="sale-item-name">${item.productName}</div>
                    <div class="sale-item-details">
                        ${item.quantity} × ${Utils.formatCurrency(item.unitPrice)}
                    </div>
                </div>
                <div class="sale-item-total">${Utils.formatCurrency(item.total)}</div>
                <button type="button" class="remove-item-btn" onclick="window.salesManager.removeItemFromSale(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    removeItemFromSale(index) {
        this.currentSale.items.splice(index, 1);
        this.renderSaleItems();
        this.updateSaleCalculations();
    }

    updateSaleCalculations() {
        const subtotal = this.currentSale.items.reduce((sum, item) => sum + item.total, 0);
        const discountPercent = parseFloat(document.getElementById('saleDiscount')?.value || 0);
        const discountAmount = (subtotal * discountPercent) / 100;
        const total = subtotal - discountAmount;

        this.currentSale.subtotal = subtotal;
        this.currentSale.discount = discountAmount;
        this.currentSale.total = total;

        // Update display
        document.getElementById('saleSubtotal').textContent = Utils.formatCurrency(subtotal);
        document.getElementById('saleDiscountAmount').textContent = Utils.formatCurrency(discountAmount);
        document.getElementById('saleTotal').textContent = Utils.formatCurrency(total);
    }

    processSale() {
        if (this.currentSale.items.length === 0) {
            NotificationManager.show('Please add items to the sale', 'warning');
            return;
        }

        const customerId = document.getElementById('saleCustomer').value;
        const paymentMethod = document.getElementById('paymentMethod').value;

        // Get customer info
        let customerName = 'Walk-in Customer';
        if (customerId !== 'walk-in') {
            const customer = StorageManager.getCustomer(customerId);
            customerName = customer ? customer.name : 'Walk-in Customer';
        }

        // Create sale object
        const sale = {
            id: Utils.generateId('SALE'),
            invoiceNumber: this.generateInvoiceNumber(),
            customerId: customerId === 'walk-in' ? null : customerId,
            customerName: customerName,
            items: [...this.currentSale.items],
            subtotal: this.currentSale.subtotal,
            discountPercent: parseFloat(document.getElementById('saleDiscount').value || 0),
            discountAmount: this.currentSale.discount,
            totalAmount: this.currentSale.total,
            paymentMethod: paymentMethod,
            status: 'completed',
            saleDate: new Date().toISOString(),
            salesPerson: 'Admin' // Could be enhanced with user management
        };

        // Save sale
        StorageManager.saveSale(sale);

        // Update product stock
        this.currentSale.items.forEach(item => {
            StorageManager.updateProductStock(item.productId, item.quantity, 'subtract');
        });

        // Close modal and refresh
        this.closeSaleModal();
        this.loadSales();
        
        NotificationManager.show(`Sale ${sale.invoiceNumber} completed successfully!`, 'success');

        // Optionally print receipt
        if (confirm('Would you like to print the receipt?')) {
            this.printSale(sale.id);
        }
    }

    saveCustomer() {
        const customer = {
            id: Utils.generateId('CUST'),
            name: document.getElementById('customerName').value,
            phone: document.getElementById('customerPhone').value,
            email: document.getElementById('customerEmail').value,
            address: document.getElementById('customerAddress').value,
            type: document.getElementById('customerType').value,
            dateAdded: new Date().toISOString(),
            totalPurchases: 0,
            lastPurchase: null
        };

        StorageManager.saveCustomer(customer);
        this.closeCustomerModal();
        this.loadCustomersForSale();
        
        NotificationManager.show('Customer added successfully!', 'success');
        
        // Select the new customer
        document.getElementById('saleCustomer').value = customer.id;
    }

    generateInvoiceNumber() {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const salesToday = (StorageManager.getSales() || [])
            .filter(sale => sale.saleDate.startsWith(dateStr));
        const sequence = (salesToday.length + 1).toString().padStart(3, '0');
        return `INV-${dateStr}-${sequence}`;
    }

    resetCurrentSale() {
        this.currentSale = {
            items: [],
            customer: null,
            subtotal: 0,
            discount: 0,
            total: 0
        };
        this.renderSaleItems();
        this.updateSaleCalculations();
    }

    toggleQuickSalePanel() {
        const panel = document.getElementById('quickSalesPanel');
        if (panel.classList.contains('hidden')) {
            this.showQuickSalePanel();
        } else {
            this.hideQuickSalePanel();
        }
    }

    showQuickSalePanel() {
        const panel = document.getElementById('quickSalesPanel');
        panel.classList.remove('hidden');
        this.loadQuickSaleItems();
    }

    hideQuickSalePanel() {
        const panel = document.getElementById('quickSalesPanel');
        panel.classList.add('hidden');
    }

    loadQuickSaleItems() {
        const container = document.getElementById('quickSaleItems');
        const products = StorageManager.getProducts()
            .filter(p => p.quantity > 0)
            .slice(0, 10); // Show top 10 products

        if (!container) return;

        container.innerHTML = products.map(product => `
            <div class="quick-sale-item" data-product-id="${product.id}" onclick="window.salesManager.selectQuickSaleItem('${product.id}')">
                <div>
                    <div style="font-weight: 600;">${product.name}</div>
                    <div style="font-size: 0.85rem; color: #666;">${Utils.formatCurrency(product.price)}</div>
                </div>
                <div style="color: #2196F3; font-weight: 600;">Stock: ${product.quantity}</div>
            </div>
        `).join('');
    }

    selectQuickSaleItem(productId) {
        // Toggle selection
        const item = document.querySelector(`.quick-sale-item[data-product-id="${productId}"]`);
        item.classList.toggle('selected');
        
        this.updateQuickSaleTotal();
    }

    updateQuickSaleTotal() {
        const selectedItems = document.querySelectorAll('.quick-sale-item.selected');
        let total = 0;
        
        selectedItems.forEach(item => {
            const productId = item.dataset.productId;
            const product = StorageManager.getProduct(productId);
            if (product) {
                total += product.price;
            }
        });
        
        document.getElementById('quickSaleTotal').textContent = Utils.formatCurrency(total);
    }

    processQuickSale() {
        const selectedItems = document.querySelectorAll('.quick-sale-item.selected');
        
        if (selectedItems.length === 0) {
            NotificationManager.show('Please select items for quick sale', 'warning');
            return;
        }

        const items = [];
        let total = 0;

        selectedItems.forEach(item => {
            const productId = item.dataset.productId;
            const product = StorageManager.getProduct(productId);
            if (product && product.quantity > 0) {
                items.push({
                    productId: product.id,
                    productName: product.name,
                    quantity: 1,
                    unitPrice: product.price,
                    total: product.price
                });
                total += product.price;
            }
        });

        if (items.length === 0) {
            NotificationManager.show('No valid items selected', 'error');
            return;
        }

        // Create quick sale
        const sale = {
            id: Utils.generateId('SALE'),
            invoiceNumber: this.generateInvoiceNumber(),
            customerId: null,
            customerName: 'Walk-in Customer',
            items: items,
            subtotal: total,
            discountPercent: 0,
            discountAmount: 0,
            totalAmount: total,
            paymentMethod: 'cash',
            status: 'completed',
            saleDate: new Date().toISOString(),
            salesPerson: 'Admin'
        };

        // Save and update stock
        StorageManager.saveSale(sale);
        items.forEach(item => {
            StorageManager.updateProductStock(item.productId, item.quantity, 'subtract');
        });

        this.hideQuickSalePanel();
        this.loadSales();
        
        NotificationManager.show(`Quick sale ${sale.invoiceNumber} completed!`, 'success');
    }

    viewSale(saleId) {
        const sale = StorageManager.getSale(saleId);
        if (!sale) return;

        const details = `
Sale Details:
--------------
Invoice: ${sale.invoiceNumber}
Date: ${Utils.formatDateTime(sale.saleDate)}
Customer: ${sale.customerName}
Payment: ${sale.paymentMethod.toUpperCase()}
Status: ${sale.status.toUpperCase()}

Items:
${sale.items.map(item => 
    `- ${item.productName} (${item.quantity}x) = ${Utils.formatCurrency(item.total)}`
).join('\n')}

Subtotal: ${Utils.formatCurrency(sale.subtotal)}
Discount: ${Utils.formatCurrency(sale.discountAmount)}
Total: ${Utils.formatCurrency(sale.totalAmount)}
        `;
        
        alert(details);
    }

    printSale(saleId) {
        const sale = StorageManager.getSale(saleId);
        if (!sale) return;

        const receiptWindow = window.open('', '_blank');
        receiptWindow.document.write(`
            <html>
                <head>
                    <title>Receipt - ${sale.invoiceNumber}</title>
                    <style>
                        body { font-family: monospace; width: 300px; margin: 0 auto; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .line { border-bottom: 1px dashed #000; margin: 10px 0; }
                        .row { display: flex; justify-content: space-between; margin: 5px 0; }
                        .total { font-weight: bold; font-size: 1.2em; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>OgaStock</h2>
                        <p>Sales Receipt</p>
                    </div>
                    
                    <div class="row">
                        <span>Invoice:</span>
                        <span>${sale.invoiceNumber}</span>
                    </div>
                    <div class="row">
                        <span>Date:</span>
                        <span>${Utils.formatDateTime(sale.saleDate)}</span>
                    </div>
                    <div class="row">
                        <span>Customer:</span>
                        <span>${sale.customerName}</span>
                    </div>
                    
                    <div class="line"></div>
                    
                    ${sale.items.map(item => `
                        <div class="row">
                            <span>${item.productName}</span>
                            <span>${Utils.formatCurrency(item.total)}</span>
                        </div>
                        <div class="row" style="font-size: 0.9em; color: #666;">
                            <span>${item.quantity} x ${Utils.formatCurrency(item.unitPrice)}</span>
                            <span></span>
                        </div>
                    `).join('')}
                    
                    <div class="line"></div>
                    
                    <div class="row">
                        <span>Subtotal:</span>
                        <span>${Utils.formatCurrency(sale.subtotal)}</span>
                    </div>
                    ${sale.discountAmount > 0 ? `
                        <div class="row">
                            <span>Discount:</span>
                            <span>-${Utils.formatCurrency(sale.discountAmount)}</span>
                        </div>
                    ` : ''}
                    <div class="row total">
                        <span>Total:</span>
                        <span>${Utils.formatCurrency(sale.totalAmount)}</span>
                    </div>
                    
                    <div class="line"></div>
                    
                    <div class="row">
                        <span>Payment:</span>
                        <span>${sale.paymentMethod.toUpperCase()}</span>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px;">
                        <p>Thank you for your business!</p>
                    </div>
                </body>
            </html>
        `);
        receiptWindow.document.close();
        receiptWindow.print();
        receiptWindow.close();
    }

    refundSale(saleId) {
        const sale = StorageManager.getSale(saleId);
        if (!sale) return;

        if (confirm(`Are you sure you want to refund sale ${sale.invoiceNumber}?`)) {
            // Update sale status
            sale.status = 'refunded';
            StorageManager.saveSale(sale);

            // Restore stock
            sale.items.forEach(item => {
                StorageManager.updateProductStock(item.productId, item.quantity, 'add');
            });

            this.loadSales();
            NotificationManager.show('Sale refunded successfully!', 'success');
        }
    }

    exportSales() {
        const sales = StorageManager.getSales() || [];
        const exportData = sales.map(sale => ({
            'Invoice Number': sale.invoiceNumber,
            'Date': Utils.formatDate(sale.saleDate),
            'Customer': sale.customerName,
            'Items Count': sale.items.length,
            'Subtotal': sale.subtotal,
            'Discount': sale.discountAmount,
            'Total Amount': sale.totalAmount,
            'Payment Method': sale.paymentMethod,
            'Status': sale.status,
            'Sales Person': sale.salesPerson
        }));

        Utils.exportToCSV(exportData, 'sales_data');
    }
}

// Initialize Sales Manager
document.addEventListener('DOMContentLoaded', () => {
    window.salesManager = new SalesManager();
});