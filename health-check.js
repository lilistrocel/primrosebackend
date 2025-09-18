#!/usr/bin/env node

/**
 * Coffee Machine Health Check Utility
 * Comprehensive system health monitoring and diagnostics
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Configuration
const config = {
  backend: {
    url: process.env.BACKEND_URL || 'http://localhost:3000',
    timeout: 5000
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3001',
    timeout: 5000
  },
  database: {
    path: process.env.DB_PATH || './coffee_machine.db'
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[37m'
};

function colorText(text, color) {
  return `${colors[color] || colors.reset}${text}${colors.reset}`;
}

function printHeader(title) {
  console.log('');
  console.log(colorText('═'.repeat(60), 'cyan'));
  console.log(colorText(`  ${title}`, 'yellow'));
  console.log(colorText('═'.repeat(60), 'cyan'));
  console.log('');
}

class HealthChecker {
  constructor() {
    this.results = {
      backend: { status: 'unknown', details: {} },
      frontend: { status: 'unknown', details: {} },
      database: { status: 'unknown', details: {} },
      apis: { status: 'unknown', details: {} },
      overall: { status: 'unknown', score: 0 }
    };
  }

  // Helper function to make HTTP requests without axios
  makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const httpModule = isHttps ? https : http;
      
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        timeout: options.timeout || 5000,
        headers: options.headers || {}
      };

      const req = httpModule.request(requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = {
              status: res.statusCode,
              headers: res.headers,
              data: res.headers['content-type']?.includes('application/json') ? JSON.parse(data) : data
            };
            resolve(response);
          } catch (err) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: data
            });
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.data) {
        const postData = typeof options.data === 'string' ? options.data : JSON.stringify(options.data);
        req.write(postData);
      }

      req.end();
    });
  }

  async checkBackend() {
    console.log(colorText('🔍 Checking Backend Service...', 'blue'));
    
    try {
      // Health endpoint check
      const healthResponse = await this.makeRequest(`${config.backend.url}/health`, {
        timeout: config.backend.timeout
      });
      
      if (healthResponse.status === 200 && healthResponse.data.status === 'OK') {
        this.results.backend.status = 'healthy';
        this.results.backend.details = {
          url: config.backend.url,
          response_time: healthResponse.headers['x-response-time'] || 'N/A',
          service: healthResponse.data.service,
          database: healthResponse.data.database,
          timestamp: healthResponse.data.timestamp
        };
        
        console.log(colorText('✅ Backend health check: OK', 'green'));
        console.log(colorText(`   Service: ${healthResponse.data.service}`, 'gray'));
        console.log(colorText(`   Database: ${healthResponse.data.database}`, 'gray'));
        
      } else {
        throw new Error('Invalid health response');
      }
      
    } catch (error) {
      this.results.backend.status = 'unhealthy';
      this.results.backend.details = {
        error: error.message,
        url: config.backend.url
      };
      
      console.log(colorText('❌ Backend health check failed', 'red'));
      console.log(colorText(`   Error: ${error.message}`, 'red'));
    }
  }

  async checkFrontend() {
    console.log(colorText('🔍 Checking Frontend Application...', 'blue'));
    
    try {
      const response = await this.makeRequest(config.frontend.url, {
        timeout: config.frontend.timeout
      });
      
      if (response.status === 200) {
        this.results.frontend.status = 'healthy';
        this.results.frontend.details = {
          url: config.frontend.url,
          status_code: response.status,
          content_type: response.headers['content-type']
        };
        
        console.log(colorText('✅ Frontend is serving correctly', 'green'));
        console.log(colorText(`   Status: ${response.status}`, 'gray'));
        
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
      
    } catch (error) {
      this.results.frontend.status = 'unhealthy';
      this.results.frontend.details = {
        error: error.message,
        url: config.frontend.url
      };
      
      console.log(colorText('❌ Frontend check failed', 'red'));
      console.log(colorText(`   Error: ${error.message}`, 'red'));
    }
  }

  async checkDatabase() {
    console.log(colorText('🔍 Checking Database...', 'blue'));
    
    try {
      // Check if database file exists
      if (fs.existsSync(config.database.path)) {
        const stats = fs.statSync(config.database.path);
        
        this.results.database.status = 'healthy';
        this.results.database.details = {
          path: config.database.path,
          size: `${(stats.size / 1024).toFixed(2)} KB`,
          created: stats.birthtime.toISOString(),
          modified: stats.mtime.toISOString()
        };
        
        console.log(colorText('✅ Database file exists', 'green'));
        console.log(colorText(`   Path: ${config.database.path}`, 'gray'));
        console.log(colorText(`   Size: ${this.results.database.details.size}`, 'gray'));
        
      } else {
        this.results.database.status = 'missing';
        this.results.database.details = {
          path: config.database.path,
          error: 'Database file not found'
        };
        
        console.log(colorText('⚠️  Database file not found', 'yellow'));
        console.log(colorText(`   Expected: ${config.database.path}`, 'yellow'));
      }
      
    } catch (error) {
      this.results.database.status = 'unhealthy';
      this.results.database.details = {
        error: error.message,
        path: config.database.path
      };
      
      console.log(colorText('❌ Database check failed', 'red'));
      console.log(colorText(`   Error: ${error.message}`, 'red'));
    }
  }

  async checkAPIs() {
    console.log(colorText('🔍 Checking Coffee Machine APIs...', 'blue'));
    
    if (this.results.backend.status !== 'healthy') {
      this.results.apis.status = 'unavailable';
      this.results.apis.details = { error: 'Backend not healthy' };
      console.log(colorText('❌ APIs unavailable - backend not running', 'red'));
      return;
    }
    
    const apiTests = [
      {
        name: 'Device Order Queue List',
        endpoint: '/api/motong/deviceOrderQueueList',
        method: 'POST',
        data: { deviceId: '1' },
        critical: true
      },
      {
        name: 'Health Check',
        endpoint: '/health',
        method: 'GET',
        critical: false
      }
    ];
    
    const results = [];
    
    for (const test of apiTests) {
      try {
        const startTime = Date.now();
        
        let response;
        if (test.method === 'POST') {
          response = await this.makeRequest(`${config.backend.url}${test.endpoint}`, {
            method: 'POST',
            data: test.data,
            timeout: config.backend.timeout,
            headers: { 'Content-Type': 'application/json' }
          });
        } else {
          response = await this.makeRequest(`${config.backend.url}${test.endpoint}`, {
            timeout: config.backend.timeout
          });
        }
        
        const responseTime = Date.now() - startTime;
        
        results.push({
          name: test.name,
          status: 'success',
          response_time: `${responseTime}ms`,
          status_code: response.status,
          critical: test.critical
        });
        
        console.log(colorText(`✅ ${test.name}: OK (${responseTime}ms)`, 'green'));
        
        // Special handling for order queue list
        if (test.endpoint.includes('deviceOrderQueueList') && response.data) {
          const orderCount = response.data.data ? response.data.data.length : 0;
          console.log(colorText(`   Active orders: ${orderCount}`, 'gray'));
        }
        
      } catch (error) {
        results.push({
          name: test.name,
          status: 'failed',
          error: error.message,
          critical: test.critical
        });
        
        console.log(colorText(`❌ ${test.name}: FAILED`, 'red'));
        console.log(colorText(`   Error: ${error.message}`, 'red'));
      }
    }
    
    const criticalFailures = results.filter(r => r.status === 'failed' && r.critical);
    
    if (criticalFailures.length === 0) {
      this.results.apis.status = 'healthy';
    } else {
      this.results.apis.status = 'unhealthy';
    }
    
    this.results.apis.details = { tests: results };
  }

  calculateOverallHealth() {
    const weights = {
      backend: 30,
      frontend: 20,
      database: 25,
      apis: 25
    };
    
    let score = 0;
    let maxScore = 0;
    
    Object.keys(weights).forEach(component => {
      const weight = weights[component];
      maxScore += weight;
      
      const status = this.results[component].status;
      if (status === 'healthy') {
        score += weight;
      } else if (status === 'missing' && component === 'database') {
        score += weight * 0.5; // Database missing is not critical if it will be created
      }
    });
    
    const percentage = Math.round((score / maxScore) * 100);
    
    let overallStatus;
    if (percentage >= 90) {
      overallStatus = 'excellent';
    } else if (percentage >= 70) {
      overallStatus = 'good';
    } else if (percentage >= 50) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'critical';
    }
    
    this.results.overall = {
      status: overallStatus,
      score: percentage
    };
  }

  printSummary() {
    printHeader('HEALTH CHECK SUMMARY');
    
    const components = [
      { name: 'Backend Service', key: 'backend' },
      { name: 'Frontend Application', key: 'frontend' },
      { name: 'Database', key: 'database' },
      { name: 'API Endpoints', key: 'apis' }
    ];
    
    components.forEach(component => {
      const result = this.results[component.key];
      let status, color;
      
      switch (result.status) {
        case 'healthy':
          status = '✅ HEALTHY';
          color = 'green';
          break;
        case 'missing':
          status = '⚠️  MISSING';
          color = 'yellow';
          break;
        case 'unhealthy':
        case 'unavailable':
        case 'failed':
          status = '❌ UNHEALTHY';
          color = 'red';
          break;
        default:
          status = '❓ UNKNOWN';
          color = 'gray';
      }
      
      console.log(`${component.name.padEnd(20)} ${colorText(status, color)}`);
    });
    
    console.log('');
    console.log('Overall System Health:');
    
    const { status, score } = this.results.overall;
    let healthColor;
    
    switch (status) {
      case 'excellent':
        healthColor = 'green';
        break;
      case 'good':
        healthColor = 'green';
        break;
      case 'degraded':
        healthColor = 'yellow';
        break;
      default:
        healthColor = 'red';
    }
    
    console.log(colorText(`${status.toUpperCase()} (${score}%)`, healthColor));
    
    // Recommendations
    console.log('');
    console.log(colorText('Recommendations:', 'cyan'));
    
    if (this.results.backend.status !== 'healthy') {
      console.log(colorText('• Start the backend server: npm start', 'yellow'));
    }
    
    if (this.results.frontend.status !== 'healthy') {
      console.log(colorText('• Start the frontend: cd frontend && npm start', 'yellow'));
    }
    
    if (this.results.database.status === 'missing') {
      console.log(colorText('• Initialize database: npm run init-db', 'yellow'));
    }
    
    if (score === 100) {
      console.log(colorText('• System is fully operational! ☕', 'green'));
    }
  }

  async run() {
    printHeader('☕ COFFEE MACHINE HEALTH CHECK');
    
    console.log(colorText('Configuration:', 'cyan'));
    console.log(`Backend URL: ${config.backend.url}`);
    console.log(`Frontend URL: ${config.frontend.url}`);
    console.log(`Database: ${config.database.path}`);
    console.log('');
    
    await this.checkBackend();
    console.log('');
    
    await this.checkFrontend();
    console.log('');
    
    await this.checkDatabase();
    console.log('');
    
    await this.checkAPIs();
    console.log('');
    
    this.calculateOverallHealth();
    this.printSummary();
    
    // Exit with appropriate code
    if (this.results.overall.score >= 70) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const checker = new HealthChecker();
  checker.run().catch(error => {
    console.error(colorText('❌ Health check failed:', 'red'), error.message);
    process.exit(1);
  });
}

module.exports = HealthChecker;
