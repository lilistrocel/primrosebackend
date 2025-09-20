import { getApiBaseUrl } from './config';

class WebSocketClient {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000; // 3 seconds
    this.listeners = new Map();
    this.isConnected = false;
    this.isReconnecting = false;
  }

  connect() {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const wsProtocol = apiBaseUrl.startsWith('https://') ? 'wss://' : 'ws://';
      const wsBaseUrl = apiBaseUrl.replace(/^https?:\/\//, '');
      const wsUrl = `${wsProtocol}${wsBaseUrl}/ws/updates`;
      
      console.log('🔌 Connecting to WebSocket:', wsUrl);
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('🔌 WebSocket connected successfully');
        this.isConnected = true;
        this.isReconnecting = false;
        this.reconnectAttempts = 0;
        this.emit('connected');
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('🔌 WebSocket message received:', data);
          
          // Handle different message types
          this.handleMessage(data);
        } catch (error) {
          console.error('🔌 Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket connection closed:', event.code, event.reason);
        this.isConnected = false;
        this.emit('disconnected');
        
        // Attempt to reconnect if not intentionally closed
        if (event.code !== 1000 && !this.isReconnecting) {
          this.attemptReconnect();
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('🔌 WebSocket error:', error);
        this.emit('error', error);
      };
      
    } catch (error) {
      console.error('🔌 Failed to create WebSocket connection:', error);
      this.attemptReconnect();
    }
  }

  handleMessage(data) {
    const { type, data: messageData } = data;
    
    switch (type) {
      case 'initial_status':
        console.log('🔌 Received initial status:', messageData);
        this.emit('initial_status', messageData);
        break;
        
      case 'frontend_status_changed':
        console.log('🔌 Frontend status changed:', messageData);
        this.emit('frontend_status_changed', messageData);
        break;
        
      case 'test_mode_changed':
        console.log('🔌 Test mode changed:', messageData);
        this.emit('test_mode_changed', messageData);
        break;
        
      case 'matter_codes_updated':
        console.log('🔌 Matter codes updated:', messageData);
        this.emit('matter_codes_updated', messageData);
        break;
        
      case 'product_availability_changed':
        console.log('🔌 Product availability changed:', messageData);
        this.emit('product_availability_changed', messageData);
        break;
        
      case 'products_updated':
        console.log('🔌 Products updated:', messageData);
        this.emit('products_updated', messageData);
        break;
        
      case 'system_setting_changed':
        console.log('🔌 System setting changed:', messageData);
        this.emit('system_setting_changed', messageData);
        break;
        
      case 'ping':
        // Respond to server ping
        this.send({ type: 'pong', timestamp: Date.now() });
        break;
        
      case 'pong':
        // Server responded to our ping
        console.log('🔌 Received pong from server');
        break;
        
      default:
        console.log('🔌 Unknown message type:', type, messageData);
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('🔌 Max reconnection attempts reached. Giving up.');
      this.emit('reconnect_failed');
      return;
    }
    
    if (this.isReconnecting) {
      return;
    }
    
    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    console.log(`🔌 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectDelay}ms...`);
    
    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
    
    // Exponential backoff
    this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000);
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('🔌 WebSocket not connected. Cannot send message:', data);
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`🔌 Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
    }
    this.isConnected = false;
    this.isReconnecting = false;
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      isReconnecting: this.isReconnecting,
      reconnectAttempts: this.reconnectAttempts,
      readyState: this.ws ? this.ws.readyState : -1
    };
  }
}

// Create singleton instance
const webSocketClient = new WebSocketClient();

export default webSocketClient;
