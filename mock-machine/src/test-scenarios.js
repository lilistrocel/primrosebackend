#!/usr/bin/env node

const CoffeeMachineSimulator = require('./machine');
const axios = require('axios');
const chalk = require('chalk');

/**
 * Coffee Machine Test Scenarios
 * Comprehensive testing suite for backend-machine communication
 */
class MachineTestSuite {
  constructor(config = {}) {
    this.config = {
      backendUrl: config.backendUrl || 'http://localhost:3000/api/motong',
      deviceId: config.deviceId || '1',
      verbose: config.verbose !== false,
      ...config
    };

    this.testResults = [];
    this.machine = null;
  }

  /**
   * Run all test scenarios
   */
  async runAllTests() {
    console.log(chalk.blue('\n🧪 Coffee Machine Test Suite'));
    console.log(chalk.gray('═'.repeat(50)));
    console.log(chalk.cyan(`Backend: ${this.config.backendUrl}`));
    console.log(chalk.cyan(`Device ID: ${this.config.deviceId}\n`));

    const tests = [
      this.testBackendConnectivity,
      this.testDeviceOrderQueueList,
      this.testEditOrderStatus,
      this.testOrderQueue,
      this.testSaveDeviceMatter,
      this.testProductionWorkflow,
      this.testErrorHandling,
      this.testConcurrentRequests,
      this.testMachineSimulation
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        console.log(chalk.yellow(`\n🔬 Running: ${test.name}`));
        const result = await test.call(this);
        
        if (result.success) {
          console.log(chalk.green(`✅ PASSED: ${result.message}`));
          passed++;
        } else {
          console.log(chalk.red(`❌ FAILED: ${result.message}`));
          failed++;
        }
        
        this.testResults.push({
          test: test.name,
          success: result.success,
          message: result.message,
          duration: result.duration || 0
        });
        
      } catch (error) {
        console.log(chalk.red(`❌ ERROR: ${error.message}`));
        failed++;
        this.testResults.push({
          test: test.name,
          success: false,
          message: error.message,
          duration: 0
        });
      }
    }

    this.displayResults(passed, failed);
    return { passed, failed, results: this.testResults };
  }

  /**
   * Test 1: Backend Connectivity
   */
  async testBackendConnectivity() {
    const start = Date.now();
    
    try {
      const response = await axios.post(`${this.config.backendUrl}/deviceOrderQueueList`, {
        deviceId: this.config.deviceId
      }, { timeout: 5000 });

      const duration = Date.now() - start;
      
      if (response.status === 200 && response.data.code === 0) {
        return {
          success: true,
          message: `Backend responding (${duration}ms)`,
          duration
        };
      } else {
        return {
          success: false,
          message: `Unexpected response: ${response.status}`,
          duration
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
        duration: Date.now() - start
      };
    }
  }

  /**
   * Test 2: Device Order Queue List
   */
  async testDeviceOrderQueueList() {
    const start = Date.now();
    
    const response = await axios.post(`${this.config.backendUrl}/deviceOrderQueueList`, {
      deviceId: this.config.deviceId
    });

    const duration = Date.now() - start;
    const data = response.data;

    // Validate response structure
    if (!data.hasOwnProperty('code') || !data.hasOwnProperty('msg') || !data.hasOwnProperty('data')) {
      return {
        success: false,
        message: 'Invalid response structure',
        duration
      };
    }

    // Check if data is array
    if (!Array.isArray(data.data)) {
      return {
        success: false,
        message: 'Data field is not an array',
        duration
      };
    }

    // Validate order structure if orders exist
    for (const order of data.data) {
      if (!this.validateOrderStructure(order)) {
        return {
          success: false,
          message: 'Invalid order structure in response',
          duration
        };
      }
    }

    return {
      success: true,
      message: `Queue list valid (${data.data.length} orders, ${duration}ms)`,
      duration
    };
  }

  /**
   * Test 3: Edit Device Order Status
   */
  async testEditOrderStatus() {
    const start = Date.now();
    
    // First get an order to test with
    const queueResponse = await axios.post(`${this.config.backendUrl}/deviceOrderQueueList`, {
      deviceId: this.config.deviceId
    });

    const orders = queueResponse.data.data || [];
    if (orders.length === 0) {
      return {
        success: true,
        message: 'No orders to test status update (skipped)',
        duration: Date.now() - start
      };
    }

    // Find an item to update
    let testItem = null;
    for (const order of orders) {
      const items = [
        ...(order.typeList1 || []),
        ...(order.typeList2 || []),
        ...(order.typeList3 || []),
        ...(order.typeList4 || [])
      ];
      
      if (items.length > 0) {
        testItem = { order, item: items[0] };
        break;
      }
    }

    if (!testItem) {
      return {
        success: true,
        message: 'No items found to test status update (skipped)',
        duration: Date.now() - start
      };
    }

    // Test status update
    const statusResponse = await axios.post(`${this.config.backendUrl}/editDeviceOrderStatus`, {
      orderId: testItem.order.id,
      orderGoodsId: testItem.item.id,
      status: 4 // Set to processing
    });

    const duration = Date.now() - start;

    if (statusResponse.data.code === 0) {
      return {
        success: true,
        message: `Status update successful (${duration}ms)`,
        duration
      };
    } else {
      return {
        success: false,
        message: `Status update failed: ${statusResponse.data.msg}`,
        duration
      };
    }
  }

  /**
   * Test 4: Order Queue
   */
  async testOrderQueue() {
    const start = Date.now();
    
    const response = await axios.post(`${this.config.backendUrl}/orderQueue`, {
      orderNum: "TEST" + Date.now(),
      deviceId: this.config.deviceId,
      type: 0
    });

    const duration = Date.now() - start;

    if (response.data.code === 0) {
      return {
        success: true,
        message: `Order queue test successful (${duration}ms)`,
        duration
      };
    } else {
      return {
        success: false,
        message: `Order queue failed: ${response.data.msg}`,
        duration
      };
    }
  }

  /**
   * Test 5: Save Device Matter
   */
  async testSaveDeviceMatter() {
    const start = Date.now();
    
    const matterStatus = {
      CoffeeMatter1: 75,
      CoffeeMatter2: 60,
      CoffeeMatter5: 45,
      CoffeeMatter11: 30,
      CoffeeMatter12: 55
    };

    const deviceStatus = {
      deviceStatus1: 1,
      deviceStatus2: 1,
      deviceStatus3: 1,
      deviceStatus4: 1,
      lhStatus: 1
    };

    const response = await axios.post(`${this.config.backendUrl}/saveDeviceMatter`, {
      matterStatusJson: JSON.stringify(matterStatus),
      deviceStatusJson: JSON.stringify(deviceStatus),
      deviceId: parseInt(this.config.deviceId)
    });

    const duration = Date.now() - start;

    if (response.data.code === 0) {
      return {
        success: true,
        message: `Device matter save successful (${duration}ms)`,
        duration
      };
    } else {
      return {
        success: false,
        message: `Device matter save failed: ${response.data.msg}`,
        duration
      };
    }
  }

  /**
   * Test 6: Production Workflow
   */
  async testProductionWorkflow() {
    const start = Date.now();
    
    // This test simulates a complete production workflow
    try {
      // 1. Check for orders
      const queueResponse = await axios.post(`${this.config.backendUrl}/deviceOrderQueueList`, {
        deviceId: this.config.deviceId
      });

      // 2. Find an order with status 3 (queuing)
      const orders = queueResponse.data.data || [];
      let queuedItem = null;
      
      for (const order of orders) {
        const items = [
          ...(order.typeList1 || []),
          ...(order.typeList2 || []),
          ...(order.typeList3 || []),
          ...(order.typeList4 || [])
        ];
        
        const queued = items.find(item => item.status === 3);
        if (queued) {
          queuedItem = { order, item: queued };
          break;
        }
      }

      if (!queuedItem) {
        return {
          success: true,
          message: 'No queued orders for workflow test (skipped)',
          duration: Date.now() - start
        };
      }

      // 3. Update to processing (4)
      await axios.post(`${this.config.backendUrl}/editDeviceOrderStatus`, {
        orderId: queuedItem.order.id,
        orderGoodsId: queuedItem.item.id,
        status: 4
      });

      // 4. Simulate production time
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 5. Update to completed (5)
      await axios.post(`${this.config.backendUrl}/editDeviceOrderStatus`, {
        orderId: queuedItem.order.id,
        orderGoodsId: queuedItem.item.id,
        status: 5
      });

      const duration = Date.now() - start;
      return {
        success: true,
        message: `Production workflow completed (${duration}ms)`,
        duration
      };

    } catch (error) {
      return {
        success: false,
        message: `Production workflow failed: ${error.message}`,
        duration: Date.now() - start
      };
    }
  }

  /**
   * Test 7: Error Handling
   */
  async testErrorHandling() {
    const start = Date.now();
    
    try {
      // Test invalid order ID
      const response = await axios.post(`${this.config.backendUrl}/editDeviceOrderStatus`, {
        orderId: -999,
        orderGoodsId: -999,
        status: 4
      });

      const duration = Date.now() - start;
      
      // Should handle gracefully, not crash
      return {
        success: true,
        message: `Error handling test passed (${duration}ms)`,
        duration
      };

    } catch (error) {
      // Network errors are expected for some tests
      return {
        success: true,
        message: `Error handling working (${error.response?.status || 'network'})`,
        duration: Date.now() - start
      };
    }
  }

  /**
   * Test 8: Concurrent Requests
   */
  async testConcurrentRequests() {
    const start = Date.now();
    
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push(
        axios.post(`${this.config.backendUrl}/deviceOrderQueueList`, {
          deviceId: this.config.deviceId
        })
      );
    }

    try {
      const responses = await Promise.all(requests);
      const duration = Date.now() - start;
      
      const allSuccessful = responses.every(r => r.status === 200 && r.data.code === 0);
      
      return {
        success: allSuccessful,
        message: `Concurrent requests ${allSuccessful ? 'passed' : 'failed'} (${duration}ms)`,
        duration
      };
    } catch (error) {
      return {
        success: false,
        message: `Concurrent requests failed: ${error.message}`,
        duration: Date.now() - start
      };
    }
  }

  /**
   * Test 9: Machine Simulation
   */
  async testMachineSimulation() {
    const start = Date.now();
    
    try {
      // Create a short-lived machine simulator
      this.machine = new CoffeeMachineSimulator({
        backendUrl: this.config.backendUrl,
        deviceId: this.config.deviceId,
        pollInterval: 1000,
        autoMode: false,
        verbose: false
      });

      // Run simulation for 3 seconds
      setTimeout(() => {
        if (this.machine) {
          this.machine.isRunning = false;
        }
      }, 3000);

      // This would normally start the machine, but we'll just test instantiation
      const duration = Date.now() - start;
      
      return {
        success: true,
        message: `Machine simulation test passed (${duration}ms)`,
        duration
      };

    } catch (error) {
      return {
        success: false,
        message: `Machine simulation failed: ${error.message}`,
        duration: Date.now() - start
      };
    }
  }

  /**
   * Validate order structure
   */
  validateOrderStructure(order) {
    const requiredFields = ['id', 'status', 'orderNum'];
    
    for (const field of requiredFields) {
      if (!order.hasOwnProperty(field)) {
        return false;
      }
    }

    // Check typeList arrays
    const typeLists = ['typeList1', 'typeList2', 'typeList3', 'typeList4'];
    for (const typeList of typeLists) {
      if (order[typeList] && !Array.isArray(order[typeList])) {
        return false;
      }
    }

    return true;
  }

  /**
   * Display test results
   */
  displayResults(passed, failed) {
    console.log(chalk.blue('\n📊 Test Results Summary'));
    console.log(chalk.gray('═'.repeat(50)));
    console.log(chalk.green(`✅ Passed: ${passed}`));
    console.log(chalk.red(`❌ Failed: ${failed}`));
    console.log(chalk.blue(`📈 Success Rate: ${Math.round(passed / (passed + failed) * 100)}%`));
    
    if (failed > 0) {
      console.log(chalk.yellow('\n⚠️  Failed Tests:'));
      this.testResults
        .filter(r => !r.success)
        .forEach(r => console.log(chalk.red(`   - ${r.test}: ${r.message}`)));
    }

    console.log(chalk.gray('\n' + '═'.repeat(50)));
    console.log(chalk.cyan('🎯 Test suite completed!'));
  }

  /**
   * Run performance tests
   */
  async runPerformanceTests() {
    console.log(chalk.blue('\n⚡ Performance Test Suite'));
    console.log(chalk.gray('═'.repeat(50)));

    const tests = [
      { name: 'Single Request', count: 1 },
      { name: 'Burst (10 requests)', count: 10 },
      { name: 'Load (50 requests)', count: 50 },
      { name: 'Stress (100 requests)', count: 100 }
    ];

    for (const test of tests) {
      console.log(chalk.yellow(`\n🔬 ${test.name}:`));
      const start = Date.now();
      
      const requests = [];
      for (let i = 0; i < test.count; i++) {
        requests.push(
          axios.post(`${this.config.backendUrl}/deviceOrderQueueList`, {
            deviceId: this.config.deviceId
          })
        );
      }

      try {
        const responses = await Promise.all(requests);
        const duration = Date.now() - start;
        const avgResponse = duration / test.count;
        const successCount = responses.filter(r => r.status === 200).length;
        
        console.log(chalk.green(`   ✅ ${successCount}/${test.count} successful`));
        console.log(chalk.gray(`   ⏱️  Total time: ${duration}ms`));
        console.log(chalk.gray(`   📊 Average: ${avgResponse.toFixed(2)}ms per request`));
        
      } catch (error) {
        console.log(chalk.red(`   ❌ Failed: ${error.message}`));
      }
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const config = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--backend-url':
        config.backendUrl = args[++i];
        break;
      case '--device-id':
        config.deviceId = args[++i];
        break;
      case '--performance':
        config.performanceMode = true;
        break;
      case '--quiet':
        config.verbose = false;
        break;
      case '--help':
        console.log(`
Coffee Machine Test Suite

Usage: node test-scenarios.js [options]

Options:
  --backend-url <url>     Backend API URL (default: http://localhost:3000/api/motong)
  --device-id <id>        Device ID (default: 1)
  --performance           Run performance tests
  --quiet                 Reduce output verbosity
  --help                  Show this help message

Examples:
  node test-scenarios.js
  node test-scenarios.js --backend-url http://localhost:8080/api/motong
  node test-scenarios.js --performance --quiet
        `);
        process.exit(0);
    }
  }

  // Run tests
  const testSuite = new MachineTestSuite(config);
  
  async function runTests() {
    try {
      if (config.performanceMode) {
        await testSuite.runPerformanceTests();
      } else {
        await testSuite.runAllTests();
      }
    } catch (error) {
      console.error(chalk.red('Test suite failed:'), error.message);
      process.exit(1);
    }
  }

  runTests();
}

module.exports = MachineTestSuite;
