const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
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
const webSocketManager = require('./websocket/WebSocketManager');

class CoffeeMachineBackend {
  constructor() {
    this.app = express();
    this.port = networkConfig.BACKEND_PORT;
    this.host = networkConfig.HOST;
    
    // Minimal startup info
    console.log('🚀 Coffee Machine Backend - Production Mode');
    console.log(`📡 Network: ${this.host}:${this.port}`);
    
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
    
    // CORS - Allow coffee machine and frontend to connect
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
    
    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Minimal logging - only errors and critical events
    this.app.use((req, res, next) => {
      // Only log coffee machine traffic (non-browser requests)
      const userAgent = req.headers['user-agent'] || '';
      const isMachine = !userAgent.includes('Mozilla') && !userAgent.includes('Chrome');
      
      if (isMachine && req.path.includes('motong')) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] 🤖 Machine: ${req.method} ${req.path}`);
      }
      next();
    });

    // Handle preflight requests
    this.app.options('*', (req, res) => {
      const allowedOrigins = networkConfig.getCorsOrigins();
      const origin = req.headers.origin;
      if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
      }
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.sendStatus(200);
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

    // Coffee machine API routes
    this.app.use('/api/motong', deviceOrderQueueListRoute);
    this.app.use('/api/motong', editDeviceOrderStatusRoute);
    this.app.use('/api/motong', orderQueueRoute);
    this.app.use('/api/motong', saveDeviceMatterRoute);
    this.app.use('/api/motong', createOrderRoute);
    this.app.use('/api/motong', getLatestDeviceStatusRoute);
    this.app.use('/api/motong', productsRoute);
    this.app.use('/api/motong', uploadRoute);
    this.app.use('/api/motong/categories', categoriesRoute);
    this.app.use('/api/motong/latte-art', latteArtRoute);
    this.app.use('/api/motong/system-settings', systemSettingsRoute);
    this.app.use('/api/motong/option-names', optionNamesRoute);
    this.app.use('/api/motong/currency-config', currencyConfigRoute);
    this.app.use('/api/motong/inventory', inventoryRoute);
    this.app.use('/api/motong/order-history', orderHistoryRoute);
    this.app.use('/api/motong/alert-dashboard', alertDashboardRoute);

    // Alternative route paths
    this.app.use('/swoft/api/motong', deviceOrderQueueListRoute);
    this.app.use('/swoft/api/motong', editDeviceOrderStatusRoute);
    this.app.use('/swoft/api/motong', orderQueueRoute);
    this.app.use('/swoft/api/motong', saveDeviceMatterRoute);
    this.app.use('/swoft/api/motong', createOrderRoute);
    this.app.use('/swoft/api/motong', getLatestDeviceStatusRoute);
    this.app.use('/swoft/api/motong', productsRoute);
    this.app.use('/swoft/api/motong', uploadRoute);
    this.app.use('/swoft/api/motong/categories', categoriesRoute);
    this.app.use('/swoft/api/motong/latte-art', latteArtRoute);
    this.app.use('/swoft/api/motong/system-settings', systemSettingsRoute);
    this.app.use('/swoft/api/motong/option-names', optionNamesRoute);
    this.app.use('/swoft/api/motong/currency-config', currencyConfigRoute);
    this.app.use('/swoft/api/motong/inventory', inventoryRoute);
    this.app.use('/swoft/api/motong/order-history', orderHistoryRoute);
    this.app.use('/swoft/api/motong/alert-dashboard', alertDashboardRoute);

    // Root redirect
    this.app.get('/', (req, res) => {
      res.json({
        message: 'Coffee Machine Backend Server',
        version: '1.0.0',
        status: 'Running'
      });
    });
  }

  setupStaticFiles() {
    // Serve uploaded images
    this.app.use('/public', express.static(path.join(__dirname, '../public')));
  }

  setupErrorHandling() {
    // 404 handler - minimal logging
    this.app.use('*', (req, res) => {
      res.status(404).json({
        code: 404,
        msg: 'Endpoint not found',
        data: []
      });
    });

    // Global error handler
    this.app.use((error, req, res, next) => {
      console.error('❌ Error:', error.message);
      
      res.status(500).json({
        code: 500,
        msg: 'Internal server error',
        data: []
      });
    });
  }

  start() {
    const server = this.app.listen(this.port, this.host, () => {
      console.log(`✅ Server ready: http://localhost:${this.port}`);
      console.log(`🔗 API: http://localhost:${this.port}/api/motong/`);
    });

    // Initialize WebSocket server
    webSocketManager.initialize(server);

    return server;
  }

  // Graceful shutdown
  shutdown() {
    console.log('🛑 Shutting down...');
    if (db) {
      db.close();
    }
    process.exit(0);
  }
}

// Handle shutdown signals
let shuttingDown = false;

const gracefulShutdown = () => {
  if (shuttingDown) return;
  shuttingDown = true;
  
  console.log('\n🛑 Shutting down gracefully...');
  
  if (server && server.shutdown) {
    server.shutdown();
  }
  
  if (webSocketManager) {
    webSocketManager.shutdown();
  }
  
  if (db) {
    db.close();
  }
  
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('exit', () => {
  if (db) db.close();
});

// Create and start server
let server;

try {
  server = new CoffeeMachineBackend();
  server.start();
} catch (error) {
  console.error('❌ Failed to start:', error.message);
  process.exit(1);
}

module.exports = server;

