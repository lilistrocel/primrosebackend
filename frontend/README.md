# ☕ Coffee Machine Frontend

A modern React-based management interface for coffee machine items and production variables.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- Coffee machine backend running on `http://localhost:3000`

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The frontend will be available at `http://localhost:3001`

## 📱 Features

### 🏠 Dashboard
- Real-time order statistics
- System status overview
- Recent orders monitoring
- Revenue tracking

### 📦 Item Management
- **Product Catalog**: Manage coffee products, teas, ice cream, and other items
- **Multi-language Support**: Chinese, English, and Arabic names
- **Production Variables**: Configure critical `jsonCodeVal` parameters
- **Ingredient Management**: Set required `matterCodes` for each product
- **Real-time Validation**: Ensure machine compatibility

### 🔧 Variable Configuration
- **Production Instructions**: Define `classCode`, `CupCode`, `BeanCode`, etc.
- **Visual Editor**: User-friendly interface for complex JSON structures
- **Parameter Descriptions**: Built-in help for each variable type
- **Validation**: Prevent invalid configurations that would break machine operation

### 📊 Order Monitor
- **Real-time Tracking**: Live order status updates
- **Production Details**: View exact machine instructions
- **Status Workflow**: 3 (Queuing) → 4 (Processing) → 5 (Completed)
- **Ingredient Tracking**: See required materials for each order

### 🛠️ Device Status
- **Ingredient Levels**: Monitor all `CoffeeMatter` codes
- **System Health**: Track device components
- **Active Alerts**: Immediate notifications for issues
- **Status History**: Track changes over time

### ⚙️ Settings
- **Backend Configuration**: Switch between local and remote backends
- **Database Settings**: Configure local SQLite options
- **Machine Communication**: Adjust polling intervals
- **Notifications**: Set up alerts and monitoring

## 🔧 Critical Variable Management

### jsonCodeVal Structure
The most critical feature - managing production instructions:

```json
[
  {"classCode": "5001"},    // Product identifier (Espresso)
  {"CupCode": "2"},         // Cup size (8oz)
  {"BeanCode": "1"}         // Bean type (CoffeeBean1)
]
```

### Parameter Types
- **classCode**: Primary product identifier (required)
- **CupCode**: Cup size (1=Small, 2=Medium, 3=Large)
- **BeanCode**: Coffee bean type (1=Espresso, 2=Arabica, 3=Robusta)
- **headCode**: Temperature (1=Cold, 2=Warm, 3=Hot)
- **sweetCode**: Sweetness level (0=None, 1=Low, 2=Medium, 3=High)

### Ingredient Codes (matterCodes)
```
CoffeeMatter12,CoffeeMatter11,CoffeeMatter1,CoffeeMatter2,CoffeeMatter5
```

Common ingredient mappings:
- `CoffeeMatter1-2`: Coffee beans
- `CoffeeMatter5`: Milk powder
- `CoffeeMatter11-12`: Water and heating
- `CoffeeMatter13-15`: Cups, stirrers, lids

## 🎨 UI Components

### ItemCard
Displays product information with:
- Product images and names (multi-language)
- Production variables preview
- Pricing information
- Quick action buttons

### VariableEditor
Advanced editor for:
- JSON structure validation
- Parameter descriptions
- Real-time preview
- Error prevention

### FormControls
Consistent UI elements:
- Multi-language input fields
- Product type selection
- Price configuration
- Image upload

## 🔗 Backend Integration

### API Endpoints
- `POST /api/motong/deviceOrderQueueList` - Get orders
- `POST /api/motong/editDeviceOrderStatus` - Update status
- `POST /api/motong/saveDeviceMatter` - Device health
- `GET /health` - System health check

### Data Flow
1. Frontend manages product catalog
2. Backend stores in SQLite database
3. Coffee machine polls for orders
4. Machine uses `jsonCodeVal` for production
5. Status updates flow back to frontend

## 🚨 Critical Safety Features

### Validation
- **Required Fields**: Ensures `classCode` is always present
- **JSON Structure**: Validates array format
- **Type Checking**: Prevents invalid parameter types
- **Machine Compatibility**: Warns about breaking changes

### Warnings
- **Production Impact**: Alerts when changes affect machine operation
- **Ingredient Availability**: Checks ingredient stock
- **Status Workflow**: Validates order state transitions

## 🛠️ Development

### Project Structure
```
src/
├── components/
│   ├── Layout/           # Sidebar, Header
│   └── Items/            # ItemCard, ItemForm, VariableEditor
├── pages/                # Main application pages
├── services/             # API integration
└── App.js               # Main application
```

### Key Technologies
- **React 18**: Modern React with hooks
- **Styled Components**: CSS-in-JS styling
- **React Query**: Server state management
- **React Hook Form**: Form handling
- **React Router**: Navigation
- **Axios**: HTTP client

### Environment Variables
```bash
REACT_APP_API_URL=http://localhost:3000  # Backend URL
```

### Development Scripts
```bash
npm start        # Development server
npm build        # Production build
npm test         # Run tests
```

## 🔄 Integration with Coffee Machine

### How It Works
1. **Create/Edit Products**: Use Item Management to define products
2. **Configure Variables**: Set production parameters via Variable Editor
3. **Monitor Orders**: Watch real-time order processing
4. **Track Status**: Monitor ingredient levels and machine health

### Machine Communication
- Machine polls backend every 5 seconds
- Reads `jsonCodeVal` for production instructions
- Uses `matterCodes` to check ingredient availability
- Reports status back through API calls

## 🎯 Use Cases

### Adding New Product
1. Go to Item Management
2. Click "Add New Item"
3. Fill in product details (names, price, type)
4. Click "Settings" icon to configure variables
5. Set `classCode` and production parameters
6. Define required ingredients in `matterCodes`
7. Save changes

### Monitoring Production
1. Go to Order Monitor
2. See real-time order status
3. Click orders to see production details
4. Monitor ingredient usage

### System Maintenance
1. Go to Device Status
2. Check ingredient levels
3. Review system health
4. Address any alerts

## 🚀 Future Enhancements

- **Real-time WebSocket Updates**: Live order status changes
- **Advanced Analytics**: Sales reporting and trends
- **Recipe Builder**: Visual recipe creation tool
- **Mobile App**: Native mobile interface
- **Multi-machine Support**: Manage multiple coffee machines
- **Inventory Management**: Automatic ingredient ordering

---

**🎯 Goal**: Provide a powerful, user-friendly interface for managing coffee machine operations while maintaining 100% compatibility with existing machine software!
