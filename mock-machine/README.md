# Coffee Machine Simulator

A comprehensive mock coffee machine that simulates the exact behavior of a real coffee machine for testing and development purposes.

## 🎯 Overview

This simulator replicates the complete communication pattern between a coffee machine and the backend API:

- **Continuous Polling**: Polls `deviceOrderQueueList` for new orders
- **Production Simulation**: Processes orders based on `jsonCodeVal` instructions  
- **Status Updates**: Reports order progress through `editDeviceOrderStatus`
- **Device Health**: Monitors and reports ingredient levels and machine status
- **Real-time Dashboard**: Web interface for monitoring and control

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd mock-machine
npm install
```

### 2. Start the Mock Machine
```bash
# Basic machine simulation
npm start

# With custom backend
npm start -- --backend-url http://localhost:3000/api/motong

# Development mode (auto-restart)
npm run dev

# With web dashboard
npm run full
```

### 3. Access the Dashboard
Open your browser to: **http://localhost:3002**

## 🎮 Components

### 1. Machine Simulator (`machine.js`)
The core simulator that behaves like a real coffee machine:

```bash
# Start basic simulation
node src/machine.js

# Custom configuration
node src/machine.js --backend-url http://localhost:3000/api/motong --device-id 1 --poll-interval 5000

# Manual mode (no auto-production)
node src/machine.js --no-auto

# Quiet mode
node src/machine.js --quiet
```

#### Features:
- ✅ **Continuous Order Polling** - Checks for new orders every 5 seconds
- ✅ **Production Simulation** - Realistic production times based on product type
- ✅ **Status Workflow** - Handles 3→4→5 status transitions
- ✅ **Ingredient Management** - Tracks and depletes ingredient levels
- ✅ **Device Health Reporting** - Monitors temperature, pressure, water levels
- ✅ **Error Handling** - Graceful handling of network and API errors
- ✅ **Multi-language Support** - Handles product names in multiple languages

### 2. Web Dashboard (`ui-server.js`)
Real-time monitoring and control interface:

```bash
# Start dashboard only
npm run ui

# Custom port
node src/ui-server.js --port 8080
```

#### Dashboard Features:
- 📊 **Real-time Statistics** - Orders processed, polls, errors, uptime
- 📋 **Current Orders** - Live order queue with status updates
- ⚙️ **Production Queue** - Items currently in production with timers
- 🥤 **Ingredient Levels** - Visual bars showing ingredient availability
- 🎮 **Machine Controls** - Start/stop/reset/refill controls
- 🔧 **Device Status** - Machine health indicators
- 📝 **Live Logs** - Real-time machine activity logs
- 📈 **Performance Charts** - Historical performance data

### 3. Test Suite (`test-scenarios.js`)
Comprehensive testing framework:

```bash
# Run all tests
npm test

# Performance tests
node src/test-scenarios.js --performance

# Custom backend testing
node src/test-scenarios.js --backend-url http://localhost:8080/api/motong
```

#### Test Coverage:
- ✅ Backend connectivity
- ✅ API endpoint validation
- ✅ Order status workflows
- ✅ Error handling
- ✅ Concurrent request handling
- ✅ Production simulation
- ✅ Performance benchmarks

## 🔧 Configuration

### Environment Variables
```bash
export BACKEND_URL=http://localhost:3000/api/motong
export DEVICE_ID=1
export POLL_INTERVAL=5000
export AUTO_MODE=true
export VERBOSE=true
```

### Machine Settings
```javascript
const machine = new CoffeeMachineSimulator({
  backendUrl: 'http://localhost:3000/api/motong',
  deviceId: '1',
  pollInterval: 5000,  // 5 seconds
  autoMode: true,      // Automatic production
  verbose: true,       // Detailed logging
  machineId: 'MOCK-001'
});
```

## 🎭 Simulation Behavior

### Order Processing Flow
1. **Polling**: Machine polls `deviceOrderQueueList` every 5 seconds
2. **Detection**: Finds orders with status 3 (Queuing)
3. **Production**: 
   - Updates status to 4 (Processing)
   - Parses `jsonCodeVal` for production instructions
   - Simulates production time based on product type
   - Consumes ingredients based on `matterCodes`
4. **Completion**: Updates status to 5 (Completed)

### Production Times
```javascript
const productionTimes = {
  '5001': 45000, // Espresso - 45 seconds
  '5002': 60000, // Cappuccino - 60 seconds  
  '5003': 35000, // Short Black - 35 seconds
  '3001': 30000, // Ice cream - 30 seconds
  'default': 30000
};
```

### Ingredient Simulation
- **Dynamic Depletion**: Ingredients decrease with each order
- **Low Stock Alerts**: Warnings when levels drop below 20%
- **Environmental Changes**: Random fluctuations in temperature/pressure
- **Maintenance Simulation**: Occasional maintenance needs

## 📡 API Communication

### Request Patterns
```javascript
// Continuous polling
POST /deviceOrderQueueList
{
  "deviceId": "1"
}

// Status updates during production
POST /editDeviceOrderStatus  
{
  "orderId": 933,
  "orderGoodsId": 1048,
  "status": 4
}

// Device health reporting (every 30s)
POST /saveDeviceMatter
{
  "matterStatusJson": "{...}",
  "deviceStatusJson": "{...}",
  "deviceId": 1
}
```

## 🎯 Use Cases

### 1. Backend Development Testing
```bash
# Test with local backend
npm start -- --backend-url http://localhost:3000/api/motong

# Monitor real-time communication
npm run full
```

### 2. Load Testing
```bash
# Performance testing
npm test -- --performance

# Stress testing with multiple machines
for i in {1..5}; do
  node src/machine.js --device-id $i --quiet &
done
```

### 3. Demo and Training
```bash
# Full demo environment
npm run full

# Access dashboard at http://localhost:3002
# Show real-time order processing
# Demonstrate ingredient management
```

### 4. API Compatibility Validation
```bash
# Test against different backends
node src/test-scenarios.js --backend-url http://original-backend.com/api/motong
node src/test-scenarios.js --backend-url http://localhost:3000/api/motong

# Compare results for compatibility
```

## 🛠️ Development

### Adding New Product Types
1. Update `productionTimes` in `machine.js`
2. Add ingredient requirements
3. Update dashboard UI for new categories

### Custom Machine Behaviors
```javascript
class CustomMachine extends CoffeeMachineSimulator {
  async processOrderItem(order, item) {
    // Custom processing logic
    await super.processOrderItem(order, item);
    
    // Additional custom behavior
    this.customBehavior(item);
  }
}
```

### Integration with Real Hardware
```javascript
// Connect to real sensors
const machine = new CoffeeMachineSimulator({
  temperatureSensor: '/dev/temp1',
  pressureSensor: '/dev/pressure1',
  ingredientSensors: {
    CoffeeMatter1: '/dev/water_level',
    CoffeeMatter2: '/dev/bean_level'
  }
});
```

## 📊 Monitoring

### Dashboard Metrics
- **Orders/minute**: Production rate
- **Error Rate**: API communication failures  
- **Ingredient Levels**: Supply monitoring
- **Response Times**: API performance
- **Machine Health**: Overall system status

### Logging
```bash
# View machine logs
tail -f machine.log

# Dashboard logs  
tail -f ui-server.log

# Test results
cat test-results.json
```

## 🚨 Troubleshooting

### Common Issues

**Machine not connecting to backend:**
```bash
# Check backend status
curl -X POST http://localhost:3000/api/motong/deviceOrderQueueList \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"1"}'

# Test with verbose logging
node src/machine.js --verbose
```

**Dashboard not loading:**
```bash
# Check port availability
netstat -an | grep 3002

# Start with different port
node src/ui-server.js --port 8080
```

**Tests failing:**
```bash
# Run individual test
node src/test-scenarios.js --backend-url http://localhost:3000/api/motong --verbose

# Check backend health
npm run health
```

## 🎯 Next Steps

1. **Hardware Integration**: Connect to real sensors and actuators
2. **Advanced Analytics**: Machine learning for predictive maintenance
3. **Multi-Machine Networks**: Simulate coffee shop with multiple machines
4. **Cloud Integration**: Remote monitoring and control
5. **Mobile App**: Smartphone control interface

---

The Coffee Machine Simulator provides a complete testing and development environment that exactly mimics real coffee machine behavior, enabling safe and comprehensive backend testing without requiring physical hardware.
