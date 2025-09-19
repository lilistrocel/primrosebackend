import axios from 'axios';
import { getApiBaseUrl } from '../utils/config';

// Create axios instance with dynamic base configuration
const createAPI = () => {
  return axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

// Create initial instance
let api = createAPI();

// Function to recreate API instance with new baseURL
export const refreshAPIInstance = () => {
  api = createAPI();
  console.log('🔄 API instance refreshed with URL:', getApiBaseUrl());
};

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status}`, response.data);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    
    // Handle common error cases
    if (error.response?.status === 404) {
      console.warn('🔍 API endpoint not found');
    } else if (error.response?.status >= 500) {
      console.error('🚨 Server error occurred');
    } else if (error.code === 'ECONNABORTED') {
      console.error('⏱️ Request timeout');
    }
    
    return Promise.reject(error);
  }
);

// Coffee Machine API endpoints
export const coffeeAPI = {
  // Get order queue for device
  getOrderQueue: (deviceId = '1') => {
    return api.post('/api/motong/deviceOrderQueueList', { deviceId });
  },
  
  // Update order status
  updateOrderStatus: (orderId, orderGoodsId, status) => {
    return api.post('/api/motong/editDeviceOrderStatus', {
      orderId,
      orderGoodsId,
      status
    });
  },
  
  // Queue an order
  queueOrder: (orderNum, deviceId = '1', type = 0) => {
    return api.post('/api/motong/orderQueue', {
      orderNum,
      deviceId,
      type
    });
  },
  
  // Save device status
  saveDeviceStatus: (deviceId, matterStatusJson, deviceStatusJson) => {
    return api.post('/api/motong/saveDeviceMatter', {
      deviceId,
      matterStatusJson,
      deviceStatusJson
    });
  }
};

// Item Management API
export const itemAPI = {
  // Get all items
  getItems: () => {
    return api.get('/api/items');
  },
  
  // Get item by ID
  getItem: (id) => {
    return api.get(`/api/items/${id}`);
  },
  
  // Create new item
  createItem: (itemData) => {
    return api.post('/api/items', itemData);
  },
  
  // Update item
  updateItem: (id, itemData) => {
    return api.put(`/api/items/${id}`, itemData);
  },
  
  // Delete item
  deleteItem: (id) => {
    return api.delete(`/api/items/${id}`);
  },
  
  // Update item variables (jsonCodeVal and matterCodes)
  updateItemVariables: (id, variables) => {
    return api.patch(`/api/items/${id}/variables`, variables);
  }
};

// System API
export const systemAPI = {
  // Health check
  getHealth: () => {
    return api.get('/health');
  },
  
  // Get system status
  getStatus: () => {
    return api.get('/api/status');
  },
  
  // Get device status
  getDeviceStatus: (deviceId = 1) => {
    return api.get(`/api/device/${deviceId}/status`);
  },
  
  // Get analytics/stats
  getStats: () => {
    return api.get('/api/stats');
  }
};

// Utility functions
export const apiUtils = {
  // Test connection to backend
  testConnection: async () => {
    try {
      const response = await systemAPI.getHealth();
      return {
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.response?.status
      };
    }
  },
  
  // Validate jsonCodeVal structure
  validateJsonCodeVal: (jsonCodeVal) => {
    try {
      const parsed = JSON.parse(jsonCodeVal);
      
      if (!Array.isArray(parsed)) {
        return { valid: false, error: 'Must be an array' };
      }
      
      const hasClassCode = parsed.some(item => item.classCode);
      if (!hasClassCode) {
        return { valid: false, error: 'Must contain classCode' };
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid JSON format' };
    }
  },
  
  // Parse jsonCodeVal into readable format
  parseJsonCodeVal: (jsonCodeVal) => {
    try {
      const parsed = JSON.parse(jsonCodeVal);
      const result = {};
      parsed.forEach(item => {
        Object.keys(item).forEach(key => {
          result[key] = item[key];
        });
      });
      return result;
    } catch (error) {
      console.error('Error parsing jsonCodeVal:', error);
      return {};
    }
  },
  
  // Format matter codes
  formatMatterCodes: (matterCodes) => {
    if (!matterCodes) return [];
    return matterCodes.split(',').map(code => code.trim()).filter(code => code);
  },
  
  // Get status name from code
  getStatusName: (status) => {
    const statusNames = {
      1: "Unpaid",
      2: "Paid",
      3: "Queuing",
      4: "Processing", 
      5: "Completed",
      '-1': "Cancelled",
      '-3': "Refunded"
    };
    return statusNames[status] || "Unknown";
  },
  
  // Get product type name
  getProductTypeName: (type) => {
    const typeNames = {
      1: "Tea (奶茶)",
      2: "Coffee (咖啡)",
      3: "Ice Cream (冰淇淋)",
      4: "Other (其他)"
    };
    return typeNames[type] || "Unknown";
  }
};

// React Query hooks helpers
export const queryKeys = {
  items: ['items'],
  item: (id) => ['items', id],
  orderQueue: (deviceId) => ['orderQueue', deviceId],
  deviceStatus: (deviceId) => ['deviceStatus', deviceId],
  systemStatus: ['systemStatus'],
  stats: ['stats']
};

// Export the main axios instance for custom requests
export default api;
