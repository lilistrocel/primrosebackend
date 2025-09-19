// Network Configuration Module
// Centralizes all IP and port configuration for easy updates

require('dotenv').config();

const config = {
  // Network settings from environment variables or defaults
  LOCAL_IP: process.env.LOCAL_IP || '192.168.10.2',
  FRONTEND_PORT: parseInt(process.env.FRONTEND_PORT) || 3001,
  BACKEND_PORT: parseInt(process.env.BACKEND_PORT) || 3000,
  MOCK_PORT: parseInt(process.env.MOCK_PORT) || 3002,
  HOST: process.env.HOST || '0.0.0.0',
  
  // Generate CORS origins dynamically
  getCorsOrigins() {
    const origins = [
      // Localhost variants
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:3002',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      
      // Local IP variants (dynamic based on LOCAL_IP)
      `http://${this.LOCAL_IP}:${this.BACKEND_PORT}`,
      `http://${this.LOCAL_IP}:${this.FRONTEND_PORT}`,
      `http://${this.LOCAL_IP}:${this.MOCK_PORT}`,
      
      // Tunnel domains for hydromods.org
      'https://coffee-api.hydromods.org',
      'https://coffee.hydromods.org',
      'https://k2.hydromods.org',
      'https://api.hydromods.org',
      
      // Allow any hydromods.org subdomain
      /https:\/\/.*\.hydromods\.org$/,
      
      // Development/testing origins
      'https://localhost:3001',
      'https://127.0.0.1:3001'
    ];
    
    console.log('🌐 CORS Origins configured for:', origins);
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
    console.log('');
    console.log('📝 To change IP address:');
    console.log('   1. Edit .env file in project root');
    console.log('   2. Update LOCAL_IP=your.new.ip.address');
    console.log('   3. Update frontend/.env REACT_APP_API_BASE_URL');
    console.log('   4. Restart both backend and frontend');
  }
};

module.exports = config;
