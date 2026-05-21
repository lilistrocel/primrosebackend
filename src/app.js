const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Import network configuration
const networkConfig = require('./config/network');
const currencyConfig = require('./config/currency');

// Import database
const db = require('./database/db');

// Import routes
const deviceOrderQueueListRoute = require('./routes/deviceOrderQueueList');
const editDeviceOrderStatusRoute = require('./routes/editDeviceOrderStatus');
const orderQueueRoute = require('./routes/orderQueue');
const saveDeviceMatterRoute = require('./routes/saveDeviceMatter');
const createOrderRoute = require('./routes/createOrder');
const getLatestDeviceStatusRoute = require('./routes/getLatestDeviceStatus');
const productsRoute = require('./routes/products');
const uploadRoute = require('./routes/upload');
const categoriesRoute = require('./routes/categories');
const latteArtRoute = require('./routes/latteArt');
const systemSettingsRoute = require('./routes/systemSettings');
const optionNamesRoute = require('./routes/optionNames');
const currencyConfigRoute = require('./routes/currencyConfig');
const inventoryRoute = require('./routes/inventory');
const orderHistoryRoute = require('./routes/orderHistory');
const alertDashboardRoute = require('./routes/alertDashboard');
const customersRoute = require('./routes/customers');
const webSocketManager = require('./websocket/WebSocketManager');

class CoffeeMachineBackend {
  constructor() {
    this.app = express();
    this.port = networkConfig.BACKEND_PORT;
    this.host = networkConfig.HOST;

    // Disable Express's default weak ETag on JSON responses. Without an explicit
    // Cache-Control, browsers (especially Firefox/Brave) apply heuristic freshness
    // and can serve stale 304-revalidated bodies across schema changes — which shows
    // up as "empty kiosk in Firefox, works in Chrome".
    this.app.set('etag', false);

    // Display network and currency configuration on startup
    networkConfig.display();
    currencyConfig.display();

    this.setupMiddleware();
    this.setupRoutes();
    this.setupStaticFiles();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }
    }));
    
    // CORS - Allow coffee machine and frontend to connect (dynamic configuration)
    this.app.use(cors({
      origin: networkConfig.getCorsOrigins(),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers',
        'Cache-Control',
        'Pragma',
        'Expires',
        'If-None-Match',
        'If-Modified-Since'
      ],
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 200
    }));
    
    // Force API responses to be uncached by browsers. The static frontend bundle
    // (served elsewhere by nginx) can still be cached; this only affects JSON APIs.
    this.app.use((req, res, next) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/swoft/api/') || req.path === '/health') {
        res.set('Cache-Control', 'no-store');
      }
      next();
    });

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Logging
    this.app.use(morgan('combined'));
    
    // Note: CORS preflight is handled fully by the cors() middleware above (it supports
    // both string and regex entries in the origin list). A previous manual app.options
    // handler used Array#includes() against that list and silently failed to match the
    // *.hydromods.org regex — we've removed it to avoid confusion.

    // COMPREHENSIVE TRAFFIC MONITORING - ALL REQUESTS
    this.app.use((req, res, next) => {
      const userAgent = req.headers['user-agent'] || 'Unknown';
      const remoteIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
      const isRealMachine = !userAgent.includes('Mozilla') && !userAgent.includes('Chrome') && !userAgent.includes('Safari');
      const isMachineIP = remoteIP && (remoteIP.includes('192.168.10.') || remoteIP.includes('192.168.'));
      
      // Log ALL requests from potential machine IPs or non-browser user agents
      if (isRealMachine || isMachineIP || req.path.includes('motong')) {
        const clientType = isRealMachine ? '🤖 REAL COFFEE MACHINE' : '🌐 WEB BROWSER/FRONTEND';
        
        console.log('🔍 NETWORK REQUEST DETECTED:');
        console.log(`   🎯 Client Type: ${clientType}`);
        console.log(`   🌐 Remote IP: ${remoteIP}`);
        console.log(`   📍 Method: ${req.method}`);
        console.log(`   🌐 Full Path: ${req.path}`);
        console.log(`   🌐 Original URL: ${req.originalUrl}`);
        console.log(`   🎯 Full URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`);
        console.log(`   📡 User-Agent: ${userAgent}`);
        console.log(`   🌐 Origin: ${req.headers.origin || 'None'}`);
        console.log(`   📋 All Headers:`, JSON.stringify(req.headers, null, 2));
        console.log(`   📦 Body:`, JSON.stringify(req.body, null, 2));
        console.log(`   ⏰ Time: ${new Date().toISOString()}`);
        
        if (isRealMachine) {
          console.log('   🚨 THIS IS LIKELY THE REAL COFFEE MACHINE! 🚨');
        }
        
        if (isMachineIP && !req.path.includes('motong')) {
          console.log('   ⚠️  MACHINE IP BUT WRONG PATH - Check machine configuration!');
        }
        
        console.log('   ═══════════════════════════════════════');
      }
      
      next();
    });

    // Catch 404 errors for machine debugging
    this.app.use('*', (req, res, next) => {
      const userAgent = req.headers['user-agent'] || 'Unknown';
      const remoteIP = req.ip || req.connection.remoteAddress;
      const isRealMachine = !userAgent.includes('Mozilla') && !userAgent.includes('Chrome') && !userAgent.includes('Safari');
      const isMachineIP = remoteIP && remoteIP.includes('192.168.10.');
      
      if (isRealMachine || isMachineIP) {
        console.log('🚨 404 ERROR FROM POTENTIAL MACHINE:');
        console.log(`   🌐 IP: ${remoteIP}`);
        console.log(`   📍 Requested: ${req.method} ${req.originalUrl}`);
        console.log(`   📡 User-Agent: ${userAgent}`);
        console.log(`   ⚠️  This might be your coffee machine calling the wrong endpoint!`);
        console.log('   ═══════════════════════════════════════');
      }
      
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Coffee Machine Backend',
        database: 'Connected'
      });
    });

    // Coffee machine API routes (exact path matching)
    this.app.use('/api/motong', deviceOrderQueueListRoute);
    this.app.use('/api/motong', editDeviceOrderStatusRoute);
    this.app.use('/api/motong', orderQueueRoute);
    this.app.use('/api/motong', saveDeviceMatterRoute);
    this.app.use('/api/motong', createOrderRoute); // New order creation endpoint
    this.app.use('/api/motong', getLatestDeviceStatusRoute); // Frontend device status endpoint
    this.app.use('/api/motong', productsRoute); // Products management endpoints
    this.app.use('/api/motong', uploadRoute); // File upload endpoints
    this.app.use('/api/motong/categories', categoriesRoute); // Categories management endpoints
    this.app.use('/api/motong/latte-art', latteArtRoute); // Latte art designs management endpoints
    this.app.use('/api/motong/system-settings', systemSettingsRoute); // System settings management endpoints
    this.app.use('/api/motong/option-names', optionNamesRoute); // Option names management endpoints
    this.app.use('/api/motong/currency-config', currencyConfigRoute); // Currency configuration endpoints
    this.app.use('/api/motong/inventory', inventoryRoute); // Inventory management endpoints
    this.app.use('/api/motong/order-history', orderHistoryRoute); // Order history and debugging endpoints
    this.app.use('/api/motong/alert-dashboard', alertDashboardRoute); // Alert dashboard endpoints
    this.app.use('/api/motong/customers', customersRoute); // RFID-linked customer accounts

    // Alternative route paths (in case machine uses different paths)
    this.app.use('/swoft/api/motong', deviceOrderQueueListRoute);
    this.app.use('/swoft/api/motong', editDeviceOrderStatusRoute);
    this.app.use('/swoft/api/motong', orderQueueRoute);
    this.app.use('/swoft/api/motong', saveDeviceMatterRoute);
    this.app.use('/swoft/api/motong', createOrderRoute); // New order creation endpoint
    this.app.use('/swoft/api/motong', getLatestDeviceStatusRoute); // Frontend device status endpoint
    this.app.use('/swoft/api/motong', productsRoute); // Products management endpoints
    this.app.use('/swoft/api/motong', uploadRoute); // File upload endpoints
    this.app.use('/swoft/api/motong/categories', categoriesRoute); // Categories management endpoints
    this.app.use('/swoft/api/motong/latte-art', latteArtRoute); // Latte art designs management endpoints
    this.app.use('/swoft/api/motong/system-settings', systemSettingsRoute); // System settings management endpoints
    this.app.use('/swoft/api/motong/option-names', optionNamesRoute); // Option names management endpoints
    this.app.use('/swoft/api/motong/currency-config', currencyConfigRoute); // Currency configuration endpoints
    this.app.use('/swoft/api/motong/inventory', inventoryRoute); // Inventory management endpoints
    this.app.use('/swoft/api/motong/order-history', orderHistoryRoute); // Order history and debugging endpoints
    this.app.use('/swoft/api/motong/alert-dashboard', alertDashboardRoute); // Alert dashboard endpoints
    this.app.use('/swoft/api/motong/customers', customersRoute); // RFID-linked customer accounts

    // Root redirect
    this.app.get('/', (req, res) => {
      res.json({
        message: 'Coffee Machine Backend Server',
        version: '1.0.0',
        endpoints: [
          'POST /api/motong/deviceOrderQueueList',
          'POST /api/motong/editDeviceOrderStatus', 
          'POST /api/motong/orderQueue',
          'POST /api/motong/saveDeviceMatter',
          'POST /api/motong/createOrder',
          'POST /api/motong/getLatestDeviceStatus',
          'GET /api/motong/products',
          'POST /api/motong/products',
          'PUT /api/motong/products/:id',
          'DELETE /api/motong/products/:id',
          'POST /api/motong/upload/image'
        ],
        status: 'Running'
      });
    });
  }

  setupStaticFiles() {
    // Serve uploaded images (for product images and print images)
    this.app.use('/public', express.static(path.join(__dirname, '../public')));
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use('*', (req, res) => {
      console.log(`❌ 404 - Path not found: ${req.method} ${req.originalUrl}`);
      res.status(404).json({
        code: 404,
        msg: 'Endpoint not found',
        data: []
      });
    });

    // Global error handler
    this.app.use((error, req, res, next) => {
      console.error('❌ Server Error:', error);
      
      res.status(500).json({
        code: 500,
        msg: 'Internal server error',
        data: [],
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    });
  }

  start() {
    const server = this.app.listen(this.port, this.host, () => {
      // Get network interfaces to show actual IP addresses
      const os = require('os');
      const networkInterfaces = os.networkInterfaces();
      const localIPs = [];
      
      Object.keys(networkInterfaces).forEach((ifname) => {
        networkInterfaces[ifname].forEach((iface) => {
          if ('IPv4' !== iface.family || iface.internal !== false) return;
          localIPs.push(iface.address);
        });
      });

      console.log('');
      console.log('☕ ================================');
      console.log('   Coffee Machine Backend Server');
      console.log('================================ ☕');
      console.log('');
      console.log(`🚀 Server running on: http://localhost:${this.port}`);
      console.log(`🌐 Network accessible at: http://0.0.0.0:${this.port}`);
      
      if (localIPs.length > 0) {
        console.log(`📡 Available on network:`);
        localIPs.forEach(ip => {
          console.log(`   http://${ip}:${this.port}/api/motong/`);
        });
      }
      
      console.log(`🔗 Machine API Base: http://localhost:${this.port}/api/motong/`);
      console.log(`📊 Health Check: http://localhost:${this.port}/health`);
      console.log('');
      console.log('📡 Available Endpoints:');
      console.log('   POST /api/motong/deviceOrderQueueList');
      console.log('   POST /api/motong/editDeviceOrderStatus');
      console.log('   POST /api/motong/orderQueue');
      console.log('   POST /api/motong/saveDeviceMatter');
      console.log('');
      console.log('☕ Ready to serve your coffee machine! ☕');
      console.log('');
    });

    // Initialize WebSocket server for real-time updates
    webSocketManager.initialize(server);
    console.log('🔌 WebSocket server initialized for real-time updates');

    return server;
  }

  // Graceful shutdown
  shutdown() {
    console.log('🛑 Shutting down server...');
    if (db) {
      db.close();
      console.log('✅ Database connection closed');
    }
    process.exit(0);
  }
}

// Handle shutdown signals
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});

// Create and start server
let server;

try {
  console.log('🚀 Initializing Coffee Machine Backend...');
  server = new CoffeeMachineBackend();
  console.log('✅ Backend initialized, starting server...');
  server.start();
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}

module.exports = server;
