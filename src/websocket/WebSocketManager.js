const WebSocket = require('ws');
const db = require('../database/db');

class WebSocketManager {
  constructor() {
    this.wss = null;
    this.clients = new Set();
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws/updates'
    });

    this.wss.on('connection', (ws, req) => {
      console.log('🔌 WebSocket client connected from:', req.connection.remoteAddress);
      
      this.clients.add(ws);
      
      // Send initial status on connection
      this.sendInitialStatus(ws);

      // Store interval reference on the WebSocket instance
      let pingInterval = null;

      const cleanup = () => {
        if (pingInterval) {
          clearInterval(pingInterval);
          pingInterval = null;
        }
        this.clients.delete(ws);
      };

      ws.on('close', () => {
        console.log('🔌 WebSocket client disconnected');
        cleanup();
      });

      ws.on('error', (error) => {
        console.error('🔌 WebSocket error:', error);
        cleanup();
      });

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          console.log('🔌 WebSocket message received:', data);
          
          // Handle ping/pong for keepalive
          if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          }
        } catch (error) {
          console.error('🔌 WebSocket message parse error:', error);
        }
      });

      // Send keepalive ping every 30 seconds
      pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        } else {
          cleanup();
        }
      }, 30000);
    });

    console.log('🔌 WebSocket server initialized at /ws/updates');
  }

  sendInitialStatus(ws) {
    try {
      const frontendEnabled = db.isFrontendEnabled();
      const testMode = db.isTestMode();
      const outOfOrderMessage = db.getOutOfOrderMessage();

      const initialStatus = {
        type: 'initial_status',
        data: {
          frontendEnabled,
          testMode,
          outOfOrderMessage,
          timestamp: Date.now()
        }
      };

      ws.send(JSON.stringify(initialStatus));
      console.log('🔌 Sent initial status to client');
    } catch (error) {
      console.error('🔌 Error sending initial status:', error);
    }
  }

  broadcast(message) {
    if (!this.wss) {
      console.warn('🔌 WebSocket server not initialized');
      return;
    }

    const messageString = JSON.stringify(message);
    let sentCount = 0;

    this.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageString);
          sentCount++;
        } catch (error) {
          console.error('🔌 Error sending to client:', error);
          this.clients.delete(ws);
        }
      } else {
        this.clients.delete(ws);
      }
    });

    console.log(`🔌 Broadcast sent to ${sentCount} clients:`, message.type);
  }

  // System Control Updates
  notifyFrontendStatusChange(enabled, message) {
    this.broadcast({
      type: 'frontend_status_changed',
      data: {
        enabled,
        message,
        timestamp: Date.now()
      }
    });
  }

  notifyTestModeChange(enabled) {
    this.broadcast({
      type: 'test_mode_changed',
      data: {
        enabled,
        timestamp: Date.now()
      }
    });
  }

  // Ingredient Updates
  notifyMatterCodesUpdate(deviceId, matterStatusJson) {
    this.broadcast({
      type: 'matter_codes_updated',
      data: {
        deviceId,
        matterStatusJson,
        timestamp: Date.now()
      }
    });
  }

  // Product Availability Updates
  notifyProductAvailabilityChange(productId, available, missingIngredients) {
    this.broadcast({
      type: 'product_availability_changed',
      data: {
        productId,
        available,
        missingIngredients,
        timestamp: Date.now()
      }
    });
  }

  // Bulk Product Updates
  notifyProductsUpdate() {
    this.broadcast({
      type: 'products_updated',
      data: {
        message: 'Product data has been updated, please refresh',
        timestamp: Date.now()
      }
    });
  }

  // System Settings Updates
  notifySystemSettingChange(key, value) {
    this.broadcast({
      type: 'system_setting_changed',
      data: {
        key,
        value,
        timestamp: Date.now()
      }
    });
  }

  // Get connection stats
  getStats() {
    return {
      connectedClients: this.clients.size,
      serverRunning: !!this.wss
    };
  }

  // Graceful shutdown
  shutdown() {
    if (this.wss) {
      console.log('🔌 Shutting down WebSocket server...');
      
      // Close all client connections
      this.clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close(1001, 'Server shutting down');
        }
      });

      // Close the server
      this.wss.close(() => {
        console.log('🔌 WebSocket server closed');
      });
    }
  }
}

// Create singleton instance
const webSocketManager = new WebSocketManager();

module.exports = webSocketManager;
