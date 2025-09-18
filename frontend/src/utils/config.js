// Configuration utility for API endpoints
export const getApiBaseUrl = () => {
  return process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
};

export const getApiUrl = (endpoint) => {
  const baseUrl = getApiBaseUrl();
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
};

// Common API endpoints
export const API_ENDPOINTS = {
  PRODUCTS: 'api/motong/products',
  ORDERS: 'api/motong/orders',
  CREATE_ORDER: 'api/motong/createOrder',
  UPLOAD_IMAGE: 'api/motong/upload/image',
  DEVICE_STATUS: 'api/motong/device-status',
  ORDER_QUEUE: 'api/motong/deviceOrderQueueList',
  CANCEL_ORDER: 'api/motong/editDeviceOrderStatus'
};
