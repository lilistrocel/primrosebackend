// Network Configuration Module - OPTIMIZED FOR LOCAL OPERATION
// Eliminates external dependencies and DNS lookups

require('dotenv').config();

const config = {
  // Network settings from environment variables or defaults
  LOCAL_IP: process.env.LOCAL_IP || '192.168.10.2',
  FRONTEND_PORT: parseInt(process.env.FRONTEND_PORT) || 3001,
  BACKEND_PORT: parseInt(process.env.BACKEND_PORT) || 3000,
  MOCK_PORT: parseInt(process.env.MOCK_PORT) || 3002,
  
  // OPTIMIZED: Bind to IPv4 only (0.0.0.0 triggers IPv6 lookups)
  HOST: process.env.HOST || '0.0.0.0',
  
  // OPTIMIZED: Use IP addresses instead of hostnames to avoid DNS lookups
  getCorsOrigins() {
    const origins = [
      // IPv4 localhost ONLY (no hostname resolution needed)
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      
      // Local IP variants (no DNS needed)
      `http://${this.LOCAL_IP}:${this.BACKEND_PORT}`,
      `http://${this.LOCAL_IP}:${this.FRONTEND_PORT}`,
      `http://${this.LOCAL_IP}:${this.MOCK_PORT}`,
      
      // Only add tunnel domains if explicitly enabled
      ...(process.env.ENABLE_TUNNEL === 'true' ? [
        'https://coffee-api.hydromods.org',
        'https://coffee.hydromods.org',
        'https://k2.hydromods.org',
        'https://api.hydromods.org',
        /https:\/\/.*\.hydromods\.org$/
      ] : [])
    ];
    
    return origins;
  },
  
  // Frontend API URL
  getFrontendApiUrl() {
    return `http://${this.LOCAL_IP}:${this.BACKEND_PORT}`;
  },
  
  // Display current configuration
  display() {
    console.log('🔧 Network Configuration:');
    console.log(`   Local IP: ${this.LOCAL_IP}`);
    console.log(`   Backend: http://${this.LOCAL_IP}:${this.BACKEND_PORT}`);
    console.log(`   Frontend: http://${this.LOCAL_IP}:${this.FRONTEND_PORT}`);
    console.log(`   Mock Machine: http://${this.LOCAL_IP}:${this.MOCK_PORT}`);
    console.log(`   Tunnel: ${process.env.ENABLE_TUNNEL === 'true' ? 'ENABLED' : 'DISABLED'}`);
  }
};

module.exports = config;
