#!/usr/bin/env node

/**
 * Coffee Machine Backend - Performance Check
 * 
 * Measures:
 * - API response times
 * - Database query performance
 * - Memory usage
 * - CPU usage
 * - Request throughput
 */

const http = require('http');
const { performance } = require('perf_hooks');
const os = require('os');

const BACKEND_URL = 'http://localhost:3000';
const TESTS = {
  basic: true,
  load: true,
  memory: true
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatBytes(bytes) {
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function formatMs(ms) {
  if (ms < 1) return (ms * 1000).toFixed(0) + ' µs';
  if (ms < 1000) return ms.toFixed(2) + ' ms';
  return (ms / 1000).toFixed(2) + ' s';
}

// Make HTTP request
function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BACKEND_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

// Measure endpoint performance
async function measureEndpoint(name, path, method = 'GET', body = null) {
  const start = performance.now();
  
  try {
    const response = await makeRequest(path, method, body);
    const duration = performance.now() - start;
    
    return {
      name,
      success: response.status === 200,
      duration,
      status: response.status,
      size: JSON.stringify(response.data).length
    };
  } catch (error) {
    const duration = performance.now() - start;
    return {
      name,
      success: false,
      duration,
      error: error.message
    };
  }
}

// Get system metrics
function getSystemMetrics() {
  const usage = process.memoryUsage();
  const cpus = os.cpus();
  const cpuUsage = process.cpuUsage();
  
  return {
    memory: {
      rss: usage.rss,
      heapTotal: usage.heapTotal,
      heapUsed: usage.heapUsed,
      external: usage.external
    },
    cpu: {
      cores: cpus.length,
      model: cpus[0].model,
      usage: cpuUsage
    },
    uptime: process.uptime(),
    platform: process.platform,
    nodeVersion: process.version
  };
}

// Basic performance tests
async function runBasicTests() {
  log('\n📊 BASIC PERFORMANCE TESTS', 'bright');
  log('═══════════════════════════════════════════════════════════\n', 'cyan');

  const tests = [
    { name: 'Health Check', path: '/health', method: 'GET' },
    { name: 'Order Queue List', path: '/api/motong/deviceOrderQueueList', method: 'POST', body: { deviceId: '1' } },
    { name: 'Products List', path: '/api/motong/products', method: 'GET' },
    { name: 'Categories List', path: '/api/motong/categories', method: 'GET' },
    { name: 'Device Status', path: '/api/motong/getLatestDeviceStatus', method: 'POST', body: { deviceId: '1' } },
    { name: 'Latte Art List', path: '/api/motong/latte-art', method: 'GET' }
  ];

  const results = [];
  
  for (const test of tests) {
    const result = await measureEndpoint(test.name, test.path, test.method, test.body);
    results.push(result);
    
    const icon = result.success ? '✅' : '❌';
    const color = result.success ? 'green' : 'red';
    const duration = formatMs(result.duration);
    
    log(`${icon} ${result.name.padEnd(20)} ${duration.padStart(10)} ${result.success ? `(${(result.size / 1024).toFixed(1)} KB)` : result.error}`, color);
  }

  // Calculate statistics
  const successfulTests = results.filter(r => r.success);
  const avgDuration = successfulTests.reduce((sum, r) => sum + r.duration, 0) / successfulTests.length;
  const maxDuration = Math.max(...successfulTests.map(r => r.duration));
  const minDuration = Math.min(...successfulTests.map(r => r.duration));

  log('\n📈 Statistics:', 'cyan');
  log(`   Success Rate:  ${successfulTests.length}/${results.length} (${(successfulTests.length / results.length * 100).toFixed(0)}%)`, 'gray');
  log(`   Average Time:  ${formatMs(avgDuration)}`, 'gray');
  log(`   Fastest:       ${formatMs(minDuration)}`, 'green');
  log(`   Slowest:       ${formatMs(maxDuration)}`, 'yellow');

  return results;
}

// Load testing
async function runLoadTests() {
  log('\n⚡ LOAD TESTING', 'bright');
  log('═══════════════════════════════════════════════════════════\n', 'cyan');

  const concurrentRequests = [1, 5, 10, 20];
  
  for (const concurrent of concurrentRequests) {
    log(`\nTesting with ${concurrent} concurrent requests...`, 'yellow');
    
    const start = performance.now();
    const promises = [];
    
    for (let i = 0; i < concurrent; i++) {
      promises.push(measureEndpoint('Load Test', '/api/motong/products', 'GET'));
    }
    
    const results = await Promise.all(promises);
    const duration = performance.now() - start;
    const successful = results.filter(r => r.success).length;
    const avgResponseTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    
    log(`   ✅ Completed: ${successful}/${concurrent}`, 'green');
    log(`   ⏱️  Total Time: ${formatMs(duration)}`, 'gray');
    log(`   📊 Avg Response: ${formatMs(avgResponseTime)}`, 'gray');
    log(`   🚀 Throughput: ${(concurrent / (duration / 1000)).toFixed(2)} req/s`, 'cyan');
  }
}

// Memory profiling
async function runMemoryTests() {
  log('\n💾 MEMORY PROFILING', 'bright');
  log('═══════════════════════════════════════════════════════════\n', 'cyan');

  const before = getSystemMetrics();
  
  log('Memory Before Tests:', 'yellow');
  log(`   RSS:         ${formatBytes(before.memory.rss)}`, 'gray');
  log(`   Heap Total:  ${formatBytes(before.memory.heapTotal)}`, 'gray');
  log(`   Heap Used:   ${formatBytes(before.memory.heapUsed)}`, 'gray');
  log(`   External:    ${formatBytes(before.memory.external)}`, 'gray');

  // Perform 100 requests to test memory growth
  log('\nRunning 100 requests to test memory stability...', 'yellow');
  
  for (let i = 0; i < 100; i++) {
    await makeRequest('/api/motong/products', 'GET');
  }

  const after = getSystemMetrics();
  
  log('\nMemory After Tests:', 'yellow');
  log(`   RSS:         ${formatBytes(after.memory.rss)} (${after.memory.rss > before.memory.rss ? '+' : ''}${formatBytes(after.memory.rss - before.memory.rss)})`, 'gray');
  log(`   Heap Total:  ${formatBytes(after.memory.heapTotal)} (${after.memory.heapTotal > before.memory.heapTotal ? '+' : ''}${formatBytes(after.memory.heapTotal - before.memory.heapTotal)})`, 'gray');
  log(`   Heap Used:   ${formatBytes(after.memory.heapUsed)} (${after.memory.heapUsed > before.memory.heapUsed ? '+' : ''}${formatBytes(after.memory.heapUsed - before.memory.heapUsed)})`, 'gray');

  const memoryGrowth = after.memory.heapUsed - before.memory.heapUsed;
  const growthPerRequest = memoryGrowth / 100;

  if (growthPerRequest > 100000) { // > 100KB per request
    log(`\n⚠️  WARNING: High memory growth detected!`, 'red');
    log(`   ${formatBytes(growthPerRequest)} per request`, 'red');
    log(`   Possible memory leak - investigate!`, 'red');
  } else {
    log(`\n✅ Memory growth is acceptable`, 'green');
    log(`   ${formatBytes(growthPerRequest)} per request`, 'green');
  }
}

// System information
function displaySystemInfo() {
  const metrics = getSystemMetrics();
  
  log('\n🖥️  SYSTEM INFORMATION', 'bright');
  log('═══════════════════════════════════════════════════════════\n', 'cyan');
  
  log(`Platform:       ${metrics.platform}`, 'gray');
  log(`Node Version:   ${metrics.nodeVersion}`, 'gray');
  log(`CPU Cores:      ${metrics.cpu.cores}`, 'gray');
  log(`CPU Model:      ${metrics.cpu.model}`, 'gray');
  log(`Process Uptime: ${metrics.uptime.toFixed(2)}s`, 'gray');
}

// Performance recommendations
function displayRecommendations(results) {
  log('\n💡 PERFORMANCE RECOMMENDATIONS', 'bright');
  log('═══════════════════════════════════════════════════════════\n', 'cyan');

  const slowEndpoints = results.filter(r => r.success && r.duration > 100);
  
  if (slowEndpoints.length > 0) {
    log('⚠️  Slow endpoints detected (>100ms):', 'yellow');
    slowEndpoints.forEach(endpoint => {
      log(`   - ${endpoint.name}: ${formatMs(endpoint.duration)}`, 'yellow');
    });
    log('\n   Consider:', 'gray');
    log('   • Adding database indexes', 'gray');
    log('   • Implementing caching', 'gray');
    log('   • Optimizing database queries', 'gray');
  } else {
    log('✅ All endpoints performing well (<100ms)', 'green');
  }

  const metrics = getSystemMetrics();
  const heapUsagePercent = (metrics.memory.heapUsed / metrics.memory.heapTotal) * 100;

  if (heapUsagePercent > 80) {
    log('\n⚠️  High memory usage detected:', 'yellow');
    log(`   Heap usage: ${heapUsagePercent.toFixed(1)}%`, 'yellow');
    log('\n   Consider:', 'gray');
    log('   • Increasing Node.js heap size', 'gray');
    log('   • Reviewing memory-intensive operations', 'gray');
    log('   • Implementing pagination for large datasets', 'gray');
  }
}

// Main execution
async function main() {
  log('\n☕ COFFEE MACHINE BACKEND - PERFORMANCE CHECK', 'bright');
  log('═══════════════════════════════════════════════════════════', 'cyan');

  displaySystemInfo();

  try {
    // Check if backend is running
    log('\nChecking backend availability...', 'yellow');
    const healthCheck = await makeRequest('/health', 'GET');
    
    if (healthCheck.status !== 200) {
      log('❌ Backend is not responding!', 'red');
      log('   Please start the backend server first:', 'gray');
      log('   npm start', 'gray');
      process.exit(1);
    }
    
    log('✅ Backend is running', 'green');

    // Run tests
    const basicResults = await runBasicTests();
    
    if (TESTS.load) {
      await runLoadTests();
    }
    
    if (TESTS.memory) {
      await runMemoryTests();
    }

    displayRecommendations(basicResults);

    log('\n═══════════════════════════════════════════════════════════', 'cyan');
    log('✅ Performance check complete!', 'green');
    log('═══════════════════════════════════════════════════════════\n', 'cyan');

  } catch (error) {
    log(`\n❌ Error during performance check: ${error.message}`, 'red');
    log('   Make sure the backend is running on port 3000', 'gray');
    process.exit(1);
  }
}

// Run the performance check
main();

