// Configuration utility for API endpoints
export const getApiBaseUrl = () => {
  // If environment variable is set and not empty, use it
  if (process.env.REACT_APP_API_BASE_URL && process.env.REACT_APP_API_BASE_URL.trim() !== '') {
    console.log('🔧 Using environment API URL:', process.env.REACT_APP_API_BASE_URL);
    return process.env.REACT_APP_API_BASE_URL;
  }
  
  // Smart detection based on current URL
  const currentHost = window.location.hostname;
  const currentUrl = window.location.href;
  const currentProtocol = window.location.protocol;
  
  console.log('🌐 Current host:', currentHost);
  console.log('🌐 Current URL:', currentUrl);
  console.log('🌐 Current protocol:', currentProtocol);
  
  let apiUrl;
  
  // If accessing via hydromods.org domain, ALWAYS use tunnel API
  if (currentHost.includes('hydromods.org')) {
    apiUrl = 'https://coffee-api.hydromods.org';
    console.log('☁️ Using tunnel API (hydromods.org detected):', apiUrl);
    return apiUrl;
  }
  
  // If accessing via HTTPS anywhere, force tunnel API to avoid mixed content
  if (currentProtocol === 'https:') {
    apiUrl = 'https://coffee-api.hydromods.org';
    console.log('🔒 Using tunnel API (HTTPS detected):', apiUrl);
    return apiUrl;
  }
  
  // If accessing via local network (192.168.x.x), use local backend
  if (currentHost.startsWith('192.168.')) {
    apiUrl = `http://${currentHost.replace(':3001', ':3000')}`;
    console.log('🏠 Using local network API:', apiUrl);
    return apiUrl;
  }
  
  // Default fallback
  apiUrl = 'http://localhost:3000';
  console.log('🔄 Using default localhost API:', apiUrl);
  return apiUrl;
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
