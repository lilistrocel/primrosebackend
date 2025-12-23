// ================================================================================
// ROBUST API URL CONFIGURATION SYSTEM
// ================================================================================
// This system automatically detects the best API URL based on the current context
// and provides failover capabilities for maximum reliability.

// Global cache for API URL to avoid repeated detection
let cachedApiUrl = null;
let lastDetectionTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

// ================================================================================
// PRIMARY API URL DETECTION
// ================================================================================
export const getApiBaseUrl = () => {
  // Use cached URL if recent (within 30 seconds)
  if (cachedApiUrl && (Date.now() - lastDetectionTime) < CACHE_DURATION) {
    console.log('🔄 Using cached API URL:', cachedApiUrl);
    return cachedApiUrl;
  }

  console.log('🔍 DEBUG: Starting API URL detection...');
  console.log('🔍 Environment var REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
  console.log('🔍 Current location:', window.location.href);
  console.log('🔍 TUNNEL DEBUG: Checking for hydromods.org...');
  
  const currentHost = window.location.hostname;
  const currentProtocol = window.location.protocol;
  const currentPort = window.location.port;
  
  console.log(`🌐 Host: ${currentHost}, Protocol: ${currentProtocol}, Port: ${currentPort}`);

  let detectedUrl;

  // ============================================================================
  // PRIORITY 1: TUNNEL DOMAIN DETECTION (hydromods.org) - HIGHEST PRIORITY
  // When accessed via tunnel, ALWAYS use tunnel API regardless of env var
  // ============================================================================
  if (currentHost.includes('hydromods.org')) {
    console.log('🎯 TUNNEL MATCH! currentHost:', currentHost);
    detectedUrl = 'https://coffee-api.hydromods.org';
    console.log('☁️ Tunnel domain detected, using tunnel API:', detectedUrl);
  }

  // ============================================================================
  // PRIORITY 2: EXPLICIT ENVIRONMENT VARIABLE (for local/dev use)
  // ============================================================================
  else if (process.env.REACT_APP_API_BASE_URL &&
      process.env.REACT_APP_API_BASE_URL.trim() !== '' &&
      process.env.REACT_APP_API_BASE_URL !== 'auto') {
    detectedUrl = process.env.REACT_APP_API_BASE_URL;
    console.log('🔧 Using explicit environment URL:', detectedUrl);
  }

  // ============================================================================
  // PRIORITY 3: LOCAL NETWORK IP DETECTION (192.168.x.x, 10.x.x.x, etc.)
  // ============================================================================
  else if (isLocalNetworkIP(currentHost)) {
    detectedUrl = `http://${currentHost}:3000`;
    console.log('🏠 Local network IP detected, using local API:', detectedUrl);
  }
  
  // ============================================================================
  // PRIORITY 4: LOCALHOST DETECTION
  // ============================================================================
  else if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    detectedUrl = 'http://localhost:3000';
    console.log('🏠 Localhost detected, using localhost API:', detectedUrl);
  }
  
  // ============================================================================
  // PRIORITY 5: HTTPS FALLBACK (likely tunnel or production)
  // ============================================================================
  else if (currentProtocol === 'https:') {
    detectedUrl = 'https://coffee-api.hydromods.org';
    console.log('🔒 HTTPS detected, falling back to tunnel API:', detectedUrl);
  }
  
  // ============================================================================
  // PRIORITY 6: ULTIMATE FALLBACK
  // ============================================================================
  else {
    detectedUrl = 'http://localhost:3000';
    console.log('🔄 Using ultimate fallback (localhost):', detectedUrl);
  }
  
  // Cache the result
  cachedApiUrl = detectedUrl;
  lastDetectionTime = Date.now();
  
  console.log(`✅ Final API URL selected: ${detectedUrl}`);
  return detectedUrl;
};

// ================================================================================
// HELPER FUNCTIONS
// ================================================================================

// Check if hostname is a local network IP
const isLocalNetworkIP = (hostname) => {
  return (
    hostname.startsWith('192.168.') ||     // Private Class C
    hostname.startsWith('10.') ||          // Private Class A
    hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) || // Private Class B
    hostname.startsWith('169.254.')        // Link-local
  );
};

// ================================================================================
// API URL WITH AUTOMATIC FALLBACK
// ================================================================================
export const getApiBaseUrlWithFallback = async () => {
  const primaryUrl = getApiBaseUrl();
  
  // Test primary URL first
  if (await testApiUrl(primaryUrl)) {
    console.log('✅ Primary API URL is working:', primaryUrl);
    return primaryUrl;
  }
  
  console.warn('⚠️ Primary API URL failed, trying fallbacks...');
  
  // Define fallback URLs in order of preference
  const fallbackUrls = [
    'https://coffee-api.hydromods.org',  // Tunnel first
    'http://192.168.10.6:3000',         // Known local IP
    'http://localhost:3000',             // Localhost last
  ];
  
  // Test each fallback
  for (const fallbackUrl of fallbackUrls) {
    if (fallbackUrl === primaryUrl) continue; // Skip if same as primary
    
    console.log('🔄 Testing fallback URL:', fallbackUrl);
    if (await testApiUrl(fallbackUrl)) {
      console.log('✅ Fallback API URL working:', fallbackUrl);
      
      // Update cache with working fallback
      cachedApiUrl = fallbackUrl;
      lastDetectionTime = Date.now();
      
      return fallbackUrl;
    }
  }
  
  // If all fail, return primary URL anyway (let the app handle the error)
  console.error('❌ All API URLs failed, using primary anyway:', primaryUrl);
  return primaryUrl;
};

// Test if an API URL is working
const testApiUrl = async (url) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn(`⚠️ API test failed for ${url}:`, error.message);
    return false;
  }
};

// ================================================================================
// CONVENIENCE FUNCTIONS
// ================================================================================

// Get full API endpoint URL
export const getApiUrl = (endpoint) => {
  if (!endpoint) {
    console.error('❌ getApiUrl called with undefined endpoint');
    throw new Error('Endpoint is required for getApiUrl');
  }
  
  if (typeof endpoint !== 'string') {
    console.error('❌ getApiUrl called with non-string endpoint:', endpoint);
    throw new Error('Endpoint must be a string');
  }
  
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
};

// Function to get a full image URL from relative path
export const getImageUrl = (relativePath) => {
  if (!relativePath) return '';
  
  // If already a full URL, return as-is
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  
  const baseUrl = getApiBaseUrl();
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `${baseUrl}/${cleanPath}`;
};

// Force refresh the API URL detection (clears cache)
export const refreshApiUrl = () => {
  console.log('🔄 Forcing API URL refresh...');
  cachedApiUrl = null;
  lastDetectionTime = 0;
  return getApiBaseUrl();
};

// Get current cached API URL without detection
export const getCurrentApiUrl = () => {
  return cachedApiUrl || getApiBaseUrl();
};

// ================================================================================
// COMMON API ENDPOINTS
// ================================================================================
export const API_ENDPOINTS = {
  HEALTH: 'health',
  PRODUCTS: 'api/motong/products',
  CATEGORIES: 'api/motong/categories',
  ORDERS: 'api/motong/orders',
  CREATE_ORDER: 'api/motong/createOrder',
  UPLOAD_IMAGE: 'api/motong/upload/image',
  DEVICE_STATUS: 'api/motong/device-status',
  ORDER_QUEUE: 'api/motong/deviceOrderQueueList',
  EDIT_ORDER_STATUS: 'api/motong/editDeviceOrderStatus',
  SAVE_DEVICE_MATTER: 'api/motong/saveDeviceMatter',
  LATEST_DEVICE_STATUS: 'api/motong/getLatestDeviceStatus'
};

// ================================================================================
// DEBUG UTILITIES
// ================================================================================
export const debugApiConfig = () => {
  console.group('🔍 API Configuration Debug');
  console.log('Environment variable:', process.env.REACT_APP_API_BASE_URL);
  console.log('Current location:', window.location.href);
  console.log('Cached API URL:', cachedApiUrl);
  console.log('Cache age:', cachedApiUrl ? (Date.now() - lastDetectionTime) + 'ms' : 'N/A');
  console.log('Detected API URL:', getApiBaseUrl());
  console.groupEnd();
};

// Auto-run debug on load in development
if (process.env.NODE_ENV === 'development') {
  console.log('🚀 API Configuration System Loaded');
  debugApiConfig();
}
