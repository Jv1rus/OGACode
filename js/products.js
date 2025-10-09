// Product Manager
class ProductManager {
    constructor() {
        this.currentFilter = '';
        this.currentCategory = '';
        this.selectedProducts = new Set();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCategories();
    }

    setupEventListeners() {
        // Add product button
        document.getElementById('addProductBtn')?.addEventListener('click', () => {
            this.showProductModal();
        });

        // Product form submission
        document.getElementById('productForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });

        // Cancel button
        document.getElementById('cancelBtn')?.addEventListener('click', () => {
            this.closeProductModal();
        });

        // Search functionality
        const searchInput = document.getElementById('productSearch');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.currentFilter = e.target.value.toLowerCase();
                this.renderProducts();
            }, 300));
        }

        // Category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentCategory = e.target.value;
                this.renderProducts();
            });
        }
    }

    loadProducts() {
        this.renderProducts();
    }

    loadCategories() {
        const categoryFilter = document.getElementById('categoryFilter');
        const productCategory = document.getElementById('productCategory');
        
        const categories = [
            'Electronics', 'Clothing', 'Food & Beverages', 'Home & Garden',
            'Beauty & Health', 'Books & Media', 'Sports & Outdoors', 'Other'
        ];

        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="">All Categories</option>' +
                categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        }

        if (productCategory) {
            productCategory.innerHTML = '<option value="">Select Category</option>' +
                categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        }
    }

    renderProducts() {
        const container = document.getElementById('productsGrid');
        const products = this.getFilteredProducts();

        if (products.length === 0) {
            container.innerHTML = `
                <div class="products-empty">
                    <i class="fas fa-box-open"></i>
                    <h3>No Products Found</h3>
                    <p>Start by adding your first product to the inventory.</p>
                    <button class="btn btn-primary" onclick="window.productManager.showProductModal()">
                        <i class="fas fa-plus"></i> Add Product
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = products.map(product => this.createProductCard(product)).join('');
    }

    getFilteredProducts() {
        let products = StorageManager.getProducts();

        // Apply text filter
        if (this.currentFilter) {
            products = products.filter(product =>
                product.name.toLowerCase().includes(this.currentFilter) ||
                product.sku.toLowerCase().includes(this.currentFilter) ||
                product.category.toLowerCase().includes(this.currentFilter)
            );
        }

        // Apply category filter
        if (this.currentCategory) {
            products = products.filter(product => product.category === this.currentCategory);
        }

        return products.sort((a, b) => a.name.localeCompare(b.name));
    }

    createProductCard(product) {
        const stockStatus = Utils.getStockStatus(product.quantity, product.minStockLevel);
        const stockColor = Utils.getStockStatusColor(stockStatus);
        
        let alertBanner = '';
        if (product.quantity === 0) {
            alertBanner = '<div class="stock-alert out">Out of Stock</div>';
        } else if (product.quantity <= product.minStockLevel) {
            alertBanner = `<div class="stock-alert ${stockStatus}">Low Stock Alert</div>`;
        }

        return `
            <div class="product-card" data-product-id="${product.id}">
                ${alertBanner}
                <div class="product-header">
                    <div>
                        <div class="product-name">${product.name}</div>
                        <div class="product-sku">${product.sku}</div>
                    </div>
                    <div class="product-category">${product.category}</div>
                </div>
                
                <div class="product-details">
                    <div class="product-detail-row">
                        <span class="detail-label">Price:</span>
                        <span class="detail-value price-value">${Utils.formatCurrency(product.price)}</span>
                    </div>
                    <div class="product-detail-row">
                        <span class="detail-label">Cost:</span>
                        <span class="detail-value">${Utils.formatCurrency(product.cost)}</span>
                    </div>
                    <div class="product-detail-row">
                        <span class="detail-label">Stock:</span>
                        <span class="detail-value quantity-value">
                            <span class="stock-indicator ${stockStatus}" style="background-color: ${stockColor}"></span>
                            ${product.quantity} units
                        </span>
                    </div>
                    <div class="product-detail-row">
                        <span class="detail-label">Min Level:</span>
                        <span class="detail-value">${product.minStockLevel}</span>
                    </div>
                </div>
                
                <div class="product-actions">
                    <button class="action-btn edit" onclick="window.productManager.editProduct('${product.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn restock" onclick="window.productManager.restockProduct('${product.id}')">
                        <i class="fas fa-plus"></i> Restock
                    </button>
                    <button class="action-btn delete" onclick="window.productManager.deleteProduct('${product.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }

    showProductModal(productId = null) {
        const modal = document.getElementById('productModal');
        const form = document.getElementById('productForm');
        const title = document.getElementById('modalTitle');

        if (productId) {
            const product = StorageManager.getProduct(productId);
            if (product) {
                title.textContent = 'Edit Product';
                this.populateForm(product);
            }
        } else {
            title.textContent = 'Add Product';
            form.reset();
        }

        modal.style.display = 'block';
    }

    closeProductModal() {
        document.getElementById('productModal').style.display = 'none';
        document.getElementById('productForm').reset();
    }

    populateForm(product) {
        document.getElementById('productName').value = product.name;
        document.getElementById('productSKU').value = product.sku;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productQuantity').value = product.quantity;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productCost').value = product.cost;
        document.getElementById('minStockLevel').value = product.minStockLevel;
    }

    saveProduct() {
        const form = document.getElementById('productForm');
        const formData = new FormData(form);
        
        const product = {
            name: document.getElementById('productName').value,
            sku: document.getElementById('productSKU').value,
            category: document.getElementById('productCategory').value,
            quantity: parseInt(document.getElementById('productQuantity').value),
            price: parseFloat(document.getElementById('productPrice').value),
            cost: parseFloat(document.getElementById('productCost').value),
            minStockLevel: parseInt(document.getElementById('minStockLevel').value)
        };

        // Validation
        if (!this.validateProduct(product)) {
            return;
        }

        // Check if editing existing product
        const existingProduct = StorageManager.getProducts().find(p => p.sku === product.sku);
        if (existingProduct && document.getElementById('modalTitle').textContent === 'Add Product') {
            NotificationManager.show('Product with this SKU already exists!', 'error');
            return;
        }

        if (existingProduct && document.getElementById('modalTitle').textContent === 'Edit Product') {
            product.id = existingProduct.id;
            product.dateAdded = existingProduct.dateAdded;
        }

        StorageManager.saveProduct(product);
        this.closeProductModal();
        this.renderProducts();
        
        const action = product.id ? 'updated' : 'added';
        NotificationManager.show(`Product ${action} successfully!`, 'success');
    }

    validateProduct(product) {
        if (!product.name.trim()) {
            NotificationManager.show('Product name is required!', 'error');
            return false;
        }

        if (!product.sku.trim()) {
            NotificationManager.show('SKU is required!', 'error');
            return false;
        }

        if (!product.category) {
            NotificationManager.show('Category is required!', 'error');
            return false;
        }

        if (product.quantity < 0) {
            NotificationManager.show('Quantity cannot be negative!', 'error');
            return false;
        }

        if (product.price <= 0) {
            NotificationManager.show('Price must be greater than 0!', 'error');
            return false;
        }

        if (product.cost < 0) {
            NotificationManager.show('Cost cannot be negative!', 'error');
            return false;
        }

        if (product.minStockLevel < 0) {
            NotificationManager.show('Minimum stock level cannot be negative!', 'error');
            return false;
        }

        return true;
    }

    editProduct(productId) {
        this.showProductModal(productId);
    }

    restockProduct(productId) {
        const product = StorageManager.getProduct(productId);
        if (!product) return;

        const quantity = prompt(`How many units of "${product.name}" do you want to add to stock?`, '10');
        if (quantity && !isNaN(quantity) && parseInt(quantity) > 0) {
            StorageManager.updateProductStock(productId, parseInt(quantity), 'add');
            this.renderProducts();
            NotificationManager.show(`Added ${quantity} units to ${product.name}`, 'success');
        }
    }

    deleteProduct(productId) {
        const product = StorageManager.getProduct(productId);
        if (!product) return;

        if (confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
            StorageManager.deleteProduct(productId);
            this.renderProducts();
            NotificationManager.show('Product deleted successfully!', 'success');
        }
    }

    exportProducts() {
        const products = StorageManager.getProducts();
        const exportData = products.map(product => ({
            Name: product.name,
            SKU: product.sku,
            Category: product.category,
            Quantity: product.quantity,
            Price: product.price,
            Cost: product.cost,
            'Min Stock Level': product.minStockLevel,
            'Stock Status': Utils.getStockStatus(product.quantity, product.minStockLevel),
            'Date Added': Utils.formatDate(product.dateAdded)
        }));

        Utils.exportToCSV(exportData, 'products');
    }

    // Bulk operations
    toggleProductSelection(productId) {
        if (this.selectedProducts.has(productId)) {
            this.selectedProducts.delete(productId);
        } else {
            this.selectedProducts.add(productId);
        }
        this.updateBulkActions();
    }

    updateBulkActions() {
        const bulkActions = document.querySelector('.bulk-actions');
        const selectedCount = document.querySelector('.selected-count');
        
        if (this.selectedProducts.size > 0) {
            bulkActions?.classList.add('show');
            if (selectedCount) {
                selectedCount.textContent = `${this.selectedProducts.size} products selected`;
            }
        } else {
            bulkActions?.classList.remove('show');
        }
    }

    bulkDelete() {
        if (this.selectedProducts.size === 0) return;

        if (confirm(`Are you sure you want to delete ${this.selectedProducts.size} products?`)) {
            this.selectedProducts.forEach(productId => {
                StorageManager.deleteProduct(productId);
            });
            this.selectedProducts.clear();
            this.renderProducts();
            this.updateBulkActions();
            NotificationManager.show('Selected products deleted successfully!', 'success');
        }
    }
}

// Initialize Product Manager
document.addEventListener('DOMContentLoaded', () => {
    window.productManager = new ProductManager();
});