# Coffee Machine Backend

A Node.js backend replacement for coffee machine API communication. This server mimics the exact API structure of the original backend to ensure 100% compatibility with existing coffee machine software.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database with Mock Data
```bash
npm run init-db
```

### 3. Start the Server
```bash
npm start
```

The server will be available at: `http://localhost:3000`

## 📡 API Endpoints

All endpoints match the original backend exactly:

### POST /api/motong/deviceOrderQueueList
**Most Critical** - Coffee machine polls this continuously
- **Input**: `{"deviceId":"1"}`
- **Purpose**: Get active orders and production instructions
- **Key Fields**: `jsonCodeVal`, `status`, `matterCodes`

### POST /api/motong/editDeviceOrderStatus  
**Critical** - Machine reports order progress
- **Input**: `{"orderId":933,"orderGoodsId":1048,"status":5}`
- **Purpose**: Update order status (3→4→5)

### POST /api/motong/orderQueue
Queue management functionality
- **Input**: `{"orderNum":"...","deviceId":"1","type":0}`

### POST /api/motong/saveDeviceMatter
**Important** - Device health and ingredient reporting
- **Input**: `{"matterStatusJson":"...","deviceStatusJson":"...","deviceId":1}`

## 🗄️ Database

Uses SQLite for local storage with these main tables:

- **orders** - Order information
- **order_goods** - Individual items with production instructions  
- **device_status** - Machine health and ingredient levels

## 📊 Mock Data

The system comes with realistic mock data:

- **2 sample orders** (1 queuing, 1 processing)
- **Coffee items** with exact `jsonCodeVal` structure
- **Device status** with ingredient levels
- **Multi-language support** (English, Chinese, Arabic)

## 🔧 Development Commands

```bash
npm run dev        # Start with nodemon (auto-restart)
npm run init-db    # Reset database with fresh mock data
npm test           # Run tests
npm start          # Production start
```

## 🛠️ Configuration

### Environment Variables
```bash
PORT=3000          # Server port (default: 3000)
NODE_ENV=production # Environment mode
```

### Database Location
SQLite file: `./coffee_machine.db`

## 📋 Critical Field Documentation

### jsonCodeVal Structure
```json
"[{\"classCode\":\"5001\"},{\"CupCode\":\"2\"},{\"BeanCode\":\"1\"}]"
```

- **classCode**: Product identifier (e.g., "5001" = Espresso)
- **CupCode**: Cup size (e.g., "2" = 8oz)  
- **BeanCode**: Bean type (e.g., "1" = CoffeeBean1)

### Status Workflow
- **3**: Queuing (ready for machine)
- **4**: Processing (machine working)
- **5**: Completed (finished)

### Matter Codes
```
"CoffeeMatter12,CoffeeMatter11,CoffeeMatter1,CoffeeMatter2,CoffeeMatter5"
```
Comma-separated ingredient codes required for production.

## 🔍 Monitoring

### Health Check
```bash
GET http://localhost:3000/health
```

### Logs
The server provides detailed logging:
- ☕ Coffee machine requests
- 📥 Request payloads  
- 🔄 Status changes
- ⚠️ Ingredient alerts
- 🚨 Critical issues

## 🎯 Machine Compatibility

This backend is designed for **100% compatibility** with existing coffee machine software:

- ✅ Exact JSON response structure
- ✅ Identical field names (camelCase)
- ✅ Proper status workflows
- ✅ Multi-language support
- ✅ Production instruction parsing

## 📝 Testing

### Manual Testing
Use the provided mock data to test machine behavior:

```bash
# Get order queue
curl -X POST http://localhost:3000/api/motong/deviceOrderQueueList \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"1"}'

# Update order status  
curl -X POST http://localhost:3000/api/motong/editDeviceOrderStatus \
  -H "Content-Type: application/json" \
  -d '{"orderId":1,"orderGoodsId":1,"status":4}'
```

### API Compatibility Testing
Run compatibility tests against the original backend:

```bash
npm run test:compatibility
```

## 🚨 Critical Notes

1. **Never modify `jsonCodeVal` structure** - Machine depends on exact format
2. **Preserve all field names** - camelCase sensitivity is critical  
3. **Maintain status workflow** - 3→4→5 progression required
4. **Keep typeList arrays** - Product categorization is essential

## 📁 Project Structure

```
coffee-machine-backend/
├── src/
│   ├── routes/           # API endpoints
│   ├── database/         # Database management
│   └── app.js           # Main application
├── public/              # Static files (images)
├── coffee_machine.db    # SQLite database
└── package.json
```

## 🔄 Migration from Original Backend

1. **Test compatibility** with validation tools
2. **Run in parallel** with original system
3. **Gradual switchover** with monitoring
4. **Immediate rollback** capability if needed

---

**🎯 Goal**: Seamless replacement that the coffee machine will never know is different!
