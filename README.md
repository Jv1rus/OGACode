# OgaStock - Inventory Management PWA

A modern Progressive Web App (PWA) designed for small retail businesses to manage inventory, track stock levels, process orders, and generate comprehensive reports.

## 🚀 Features

### Dashboard Overview
- Real-time inventory metrics (Total Loss, Profit, Inventory Value, Stock Alerts)
- Recent transactions display
- Low stock item alerts
- Quick action buttons

### Product Management
- Add, edit, and delete products
- Track stock levels with automatic alerts
- Product categorization
- SKU management
- Cost and pricing tracking
- Minimum stock level configuration

### Order Management
- Create sales, purchase, and return orders
- Order status tracking (Pending, Processing, Completed, Cancelled, Returned)
- Automatic stock updates based on order completion
- Order history and details

### Sales Management
- **Quick Sales Panel**: Fast checkout for frequently sold items
- **Customer Management**: Add and track customer information
- **Invoice Generation**: Automatic invoice numbering with receipt printing
- **Payment Methods**: Support for Cash, Transfer, Card, and Credit payments
- **Discount System**: Percentage-based discounts with real-time calculations
- **Sales Analytics**: Daily and monthly sales tracking, customer metrics
- **Transaction History**: Complete sales record with advanced filtering
- **Receipt Printing**: Professional receipt generation and printing
- **Refund Processing**: Easy refund handling with automatic stock restoration

### Comprehensive Reports
- **Sales Report**: Revenue, profit analysis, and sales trends
- **Inventory Report**: Stock levels, alerts, and inventory valuation
- **Purchase Order Report**: Purchase tracking and status overview
- Export reports to CSV format
- Print functionality

### PWA Features
- **Offline Functionality**: Works without internet connection
- **Installable**: Can be installed on desktop and mobile devices
- **Responsive Design**: Optimized for all screen sizes
- **Push Notifications**: Stock alerts and order updates
- **Background Sync**: Sync data when connection is restored
- **Dark/Light Mode**: Toggle between light and dark themes for comfortable viewing

## 📱 Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Storage**: Local Storage with IndexedDB for offline functionality
- **PWA**: Service Worker, Web App Manifest
- **Icons**: Font Awesome 6.4.0
- **Design**: Modern responsive design with CSS Grid and Flexbox

## 🛠️ Installation

### Option 1: Direct Installation (PWA)
1. Open the application in a modern web browser
2. Look for the "Install" prompt or click the install button
3. Follow the browser's installation instructions
4. Launch the app from your device's home screen or applications menu

### Option 2: Manual Setup
1. Clone or download the project files
2. Open `index.html` in a web browser
3. For full PWA functionality, serve files from a web server (HTTP/HTTPS)

## 📋 Quick Start Guide

### Adding Your First Product
1. Navigate to the **Products** section
2. Click **"Add Product"**
3. Fill in product details:
   - Product Name
   - SKU (Stock Keeping Unit)
   - Category
   - Quantity
   - Price and Cost
   - Minimum Stock Level
4. Save the product

### Creating an Order
1. Go to the **Orders** section
2. Click **"New Order"**
3. Select a product from the dropdown
4. Enter quantity and order type (Sale/Purchase/Return)
5. Submit the order

### Viewing Reports
1. Access the **Reports** section
2. Select report type (Sales, Inventory, or Purchase Orders)
3. Choose date range if applicable
4. Click **"Generate Report"**
5. Export or print as needed

## 🎯 Sample Product Categories

The system comes with pre-configured categories:
- Electronics
- Clothing
- Food & Beverages
- Home & Garden
- Beauty & Health
- Books & Media
- Sports & Outdoors
- Other

## 📊 Dashboard Metrics

### Key Performance Indicators
- **Total Loss**: Cost of returned/damaged items
- **Total Profit**: Revenue minus cost of goods sold
- **Inventory Value**: Total value of current stock
- **Stock Alerts**: Number of items below minimum stock level

### Real-time Updates
- Recent transactions (last 5)
- Low stock alerts
- Out-of-stock notifications

## 🔧 Configuration

### Stock Alert Settings
- Configure minimum stock levels per product
- Automatic notifications when stock runs low
- Visual indicators for stock status (Good, Low, Critical, Out of Stock)

### Currency Settings
- Default currency: Nigerian Naira (₦)
- All financial calculations and displays use NGN formatting

## 💾 Data Management

### Local Storage
- All data is stored locally in the browser
- No internet connection required for basic operations
- Data persists between sessions

### Backup & Restore
- Export data to JSON format
- Import previously exported data
- Automatic backup suggestions

### Offline Functionality
- Full functionality available offline
- Changes sync automatically when connection is restored
- Service Worker ensures app availability

## 🔄 System Requirements

### Browser Compatibility
- Chrome 60+ (recommended)
- Firefox 55+
- Safari 11+
- Edge 79+

### Device Requirements
- Modern smartphone, tablet, or computer
- Minimum 50MB available storage
- JavaScript enabled

## 📈 Future Enhancements

### Planned Features
- Barcode scanning for products
- Multi-user support with role-based access
- Advanced analytics and forecasting
- Integration with payment systems
- Supplier management
- Advanced reporting with charts

### Scalability
- Database integration for larger inventories
- Cloud synchronization
- API integration capabilities
- Multi-location support

## 🛡️ Security & Privacy

- All data stored locally on your device
- No personal information transmitted to external servers
- HTTPS recommended for production deployment
- Regular browser security updates ensure data protection

## 🆘 Support & Troubleshooting

### Common Issues
1. **App not installing**: Ensure HTTPS is enabled
2. **Data not saving**: Check browser storage permissions
3. **Offline mode not working**: Verify Service Worker registration

### Performance Tips
- Regularly export data backups
- Clear old transaction history if performance degrades
- Update browser for latest PWA features

## 📄 License

This project is open source and available for modification and distribution for small business use.

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- Additional report types
- Enhanced UI/UX
- Mobile optimization
- Integration capabilities
- Accessibility improvements

---

**OgaStock** - Empowering small businesses with modern inventory management tools.

For questions or support, please refer to the in-app help or contact your system administrator.