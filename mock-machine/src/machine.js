#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');
const figlet = require('figlet');

/**
 * Coffee Machine Simulator
 * Mimics the exact behavior of the real coffee machine
 * - Polls deviceOrderQueueList continuously
 * - Updates order status through production workflow
 * - Reports device health and ingredient status
 * - Handles production based on jsonCodeVal instructions
 */
class CoffeeMachineSimulator {
  constructor(config = {}) {
    this.config = {
      backendUrl: config.backendUrl || 'http://localhost:3000/api/motong',
      deviceId: config.deviceId || '1',
      pollInterval: config.pollInterval || 5000, // 5 seconds
      machineId: config.machineId || 'MOCK-001',
      autoMode: config.autoMode || true,
      verbose: config.verbose || true,
      ...config
    };

    this.isRunning = false;
    this.currentOrders = new Map();
    this.machineStatus = {
      power: true,
      ready: true,
      maintenance: false,
      temperature: 85,
      pressure: 15,
      waterLevel: 80,
      ingredientLevels: {
        CoffeeMatter1: 85,   // 8oz纸杯 (8oz Paper Cups)
        CoffeeMatter2: 75,   // 咖啡豆 (Coffee Beans)
        CoffeeMatter3: 65,   // 牛奶 (Milk)
        CoffeeMatter4: 90,   // 冰块 (Ice)
        CoffeeMatter5: 80,   // 咖啡机水 (Coffee Machine Water)
        CoffeeMatter6: 45,   // 1号杯 (Cup #1) - abnormal status
        CoffeeMatter7: 40,   // 2杯糖 (2 Cup Sugar) - abnormal status
        CoffeeMatter8: 35,   // 3杯子 (3 Cups) - abnormal status
        CoffeeMatter9: 95,   // 打印纸张 (Printer Paper)
        CoffeeMatter10: 30,  // 12oz纸杯 (12oz Paper Cups) - abnormal status
        CoffeeMatter11: 85,  // 咖啡机糖浆 (Coffee Machine Syrup)
        CoffeeMatter12: 75,  // 机器人糖浆 (Robot Syrup)
        CoffeeMatter13: 70,  // 咖啡豆2 (Coffee Beans 2)
        CoffeeMatter14: 25,  // 牛奶2 (Milk 2) - abnormal status
        CoffeeMatter15: 55   // 制冰机水 (Ice Machine Water) - abnormal status
      }
    };

    this.productionQueue = [];
    this.statistics = {
      ordersProcessed: 0,
      totalPolls: 0,
      errors: 0,
      uptime: Date.now()
    };

    // Production time estimates (in milliseconds)
    this.productionTimes = {
      '5001': 45000, // Espresso - 45 seconds
      '5002': 60000, // Cappuccino - 60 seconds
      '5003': 35000, // Short Black - 35 seconds
      '3001': 30000, // Ice cream - 30 seconds
      '3002': 25000, // Slush 1 - 25 seconds
      '3003': 25000, // Slush 2 - 25 seconds
      '1001': 40000, // Tea variant - 40 seconds
      'default': 30000 // Default production time
    };

    this.setupSignalHandlers();
  }

  /**
   * Start the coffee machine simulator
   */
  async start() {
    try {
      this.displayBanner();
      await this.initializeMachine();
      this.isRunning = true;
      
      console.log(chalk.green('\n🚀 Coffee Machine Simulator Started!'));
      console.log(chalk.cyan(`📡 Backend: ${this.config.backendUrl}`));
      console.log(chalk.cyan(`🆔 Device ID: ${this.config.deviceId}`));
      console.log(chalk.cyan(`⏱️  Poll Interval: ${this.config.pollInterval}ms`));
      console.log(chalk.cyan(`🤖 Auto Mode: ${this.config.autoMode ? 'ON' : 'OFF'}`));
      
      // Start main operation loops
      this.startOrderPolling();
      this.startDeviceStatusReporting();
      this.startProductionSimulation();
      
      console.log(chalk.yellow('\n📋 Machine is now polling for orders...\n'));
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to start machine simulator:'), error.message);
      process.exit(1);
    }
  }

  /**
   * Display machine startup banner
   */
  displayBanner() {
    console.clear();
    console.log(chalk.blue(figlet.textSync('COFFEE MACHINE', { 
      font: 'Small',
      horizontalLayout: 'fitted'
    })));
    console.log(chalk.blue(figlet.textSync('SIMULATOR', { 
      font: 'Small',
      horizontalLayout: 'fitted'
    })));
    console.log(chalk.gray('═'.repeat(60)));
    console.log(chalk.yellow('  🤖 Mock Coffee Machine for Backend Testing'));
    console.log(chalk.gray('═'.repeat(60)));
  }

  /**
   * Initialize machine - test backend connectivity
   */
  async initializeMachine() {
    console.log(chalk.yellow('🔧 Initializing machine systems...'));
    
    try {
      // Test backend connectivity
      console.log(chalk.gray('   Testing backend connectivity...'));
      const response = await axios.post(`${this.config.backendUrl}/deviceOrderQueueList`, {
        deviceId: this.config.deviceId
      }, { timeout: 10000 });

      if (response.status === 200) {
        console.log(chalk.green('   ✅ Backend connection successful'));
        console.log(chalk.gray(`   📊 Initial queue: ${response.data.data?.length || 0} orders`));
      } else {
        throw new Error(`Backend returned status ${response.status}`);
      }

    } catch (error) {
      console.log(chalk.red('   ❌ Backend connection failed:'), error.message);
      console.log(chalk.yellow('   ⚠️  Machine will continue in offline mode'));
    }

    // Initialize machine components
    console.log(chalk.gray('   ☕ Coffee brewing system: READY'));
    console.log(chalk.gray('   🥛 Milk steaming system: READY'));
    console.log(chalk.gray('   🧊 Ice dispensing system: READY'));
    console.log(chalk.gray('   🖨️  Receipt printer: READY'));
    console.log(chalk.gray('   📡 Network communication: READY'));
    
    await this.reportDeviceStatus(); // Initial status report
  }

  /**
   * Main order polling loop - mimics real machine behavior
   */
  startOrderPolling() {
    const pollForOrders = async () => {
      if (!this.isRunning) return;

      try {
        this.statistics.totalPolls++;
        
        if (this.config.verbose) {
          process.stdout.write(chalk.gray('🔍 Polling... '));
        }

        const response = await axios.post(`${this.config.backendUrl}/deviceOrderQueueList`, {
          deviceId: this.config.deviceId
        }, { timeout: 5000 });

        if (response.data.code === 0) {
          const orders = response.data.data || [];
          await this.processOrderQueue(orders);
          
          if (this.config.verbose) {
            console.log(chalk.green(`Found ${orders.length} orders`));
          }
        } else {
          console.log(chalk.yellow(`⚠️  Backend returned code: ${response.data.code}`));
        }

      } catch (error) {
        this.statistics.errors++;
        if (this.config.verbose) {
          console.log(chalk.red(`❌ Poll failed: ${error.message}`));
        }
      }

      // Schedule next poll
      setTimeout(pollForOrders, this.config.pollInterval);
    };

    // Start polling
    pollForOrders();
  }

  /**
   * Process the order queue from backend response
   */
  async processOrderQueue(orders) {
    for (const order of orders) {
      // Process each type list
      const allItems = [
        ...(order.typeList1 || []),
        ...(order.typeList2 || []),
        ...(order.typeList3 || []),
        ...(order.typeList4 || [])
      ];

      for (const item of allItems) {
        await this.processOrderItem(order, item);
      }
    }
  }

  /**
   * Process individual order item
   */
  async processOrderItem(order, item) {
    const itemKey = `${item.orderId}-${item.id}`;
    const existingItem = this.currentOrders.get(itemKey);

    // Check if this is a new item or status changed
    if (!existingItem || existingItem.status !== item.status) {
      console.log(chalk.blue(`\n📦 Order Item ${item.id}:`));
      console.log(chalk.gray(`   Product: ${item.goodsName || item.goodsNameEn || 'Unknown'}`));
      console.log(chalk.gray(`   Status: ${item.status} (${item.statusName})`));
      console.log(chalk.gray(`   JsonCodeVal: ${item.jsonCodeVal}`));

      // Store current state
      this.currentOrders.set(itemKey, {
        ...item,
        orderId: order.id,
        lastSeen: Date.now()
      });

      // Handle based on status
      switch (item.status) {
        case 3: // Queuing - Ready to start production
          if (this.config.autoMode) {
            await this.startProduction(order, item);
          }
          break;
        
        case 4: // Processing - Already in production
          console.log(chalk.yellow(`   ⚙️  Currently in production...`));
          break;
        
        case 5: // Completed
          console.log(chalk.green(`   ✅ Production completed!`));
          this.statistics.ordersProcessed++;
          break;
      }
    }
  }

  /**
   * Start production for an order item
   */
  async startProduction(order, item) {
    try {
      console.log(chalk.cyan(`\n🔄 Starting production for item ${item.id}...`));

      // Parse production instructions
      const instructions = this.parseJsonCodeVal(item.jsonCodeVal);
      console.log(chalk.gray(`   📋 Production Instructions:`));
      console.log(chalk.gray(`      - Class Code: ${instructions.classCode}`));
      console.log(chalk.gray(`      - Cup Code: ${instructions.cupCode || 'default'}`));
      console.log(chalk.gray(`      - Bean Code: ${instructions.beanCode || 'default'}`));

      // Check ingredient availability
      if (!this.checkIngredients(item.matterCodes)) {
        console.log(chalk.red(`   ❌ Insufficient ingredients for production`));
        return;
      }

      // Update status to "Processing" (4)
      await this.updateOrderStatus(order.id, item.id, 4);

      // Add to production queue
      const productionTime = this.productionTimes[instructions.classCode] || this.productionTimes.default;
      
      this.productionQueue.push({
        orderId: order.id,
        itemId: item.id,
        productName: item.goodsName || item.goodsNameEn,
        instructions,
        startTime: Date.now(),
        estimatedCompletion: Date.now() + productionTime,
        matterCodes: item.matterCodes
      });

      console.log(chalk.yellow(`   ⏱️  Estimated completion: ${Math.round(productionTime/1000)}s`));

    } catch (error) {
      console.log(chalk.red(`   ❌ Failed to start production: ${error.message}`));
    }
  }

  /**
   * Parse jsonCodeVal instructions
   */
  parseJsonCodeVal(jsonCodeVal) {
    try {
      const parsed = JSON.parse(jsonCodeVal);
      const instructions = {};
      
      for (const instruction of parsed) {
        if (instruction.classCode) instructions.classCode = instruction.classCode;
        if (instruction.CupCode) instructions.cupCode = instruction.CupCode;
        if (instruction.BeanCode) instructions.beanCode = instruction.BeanCode;
        if (instruction.cupCode) instructions.cupCode = instruction.cupCode;
        if (instruction.beanCode) instructions.beanCode = instruction.beanCode;
      }
      
      return instructions;
    } catch (error) {
      console.log(chalk.red(`   ⚠️  Failed to parse jsonCodeVal: ${jsonCodeVal}`));
      return { classCode: 'unknown' };
    }
  }

  /**
   * Check ingredient availability
   */
  checkIngredients(matterCodes) {
    if (!matterCodes) return true;

    const requiredIngredients = matterCodes.split(',');
    const unavailable = [];

    for (const ingredient of requiredIngredients) {
      const level = this.machineStatus.ingredientLevels[ingredient.trim()];
      if (level === undefined || level <= 0) {
        unavailable.push(ingredient);
      }
    }

    if (unavailable.length > 0) {
      console.log(chalk.red(`   ❌ Unavailable ingredients: ${unavailable.join(', ')}`));
      return false;
    }

    return true;
  }

  /**
   * Update order status via backend API
   */
  async updateOrderStatus(orderId, orderGoodsId, status) {
    try {
      const response = await axios.post(`${this.config.backendUrl}/editDeviceOrderStatus`, {
        orderId: orderId,
        orderGoodsId: orderGoodsId,
        status: status
      });

      if (response.data.code === 0) {
        const statusNames = { 3: 'Queuing', 4: 'Processing', 5: 'Completed' };
        console.log(chalk.green(`   ✅ Status updated to ${status} (${statusNames[status]})`));
        return true;
      } else {
        console.log(chalk.red(`   ❌ Status update failed: ${response.data.msg}`));
        return false;
      }
    } catch (error) {
      console.log(chalk.red(`   ❌ Status update error: ${error.message}`));
      return false;
    }
  }

  /**
   * Production simulation loop
   */
  startProductionSimulation() {
    setInterval(() => {
      if (!this.isRunning) return;

      const now = Date.now();
      const completedItems = [];

      // Check for completed items
      for (let i = 0; i < this.productionQueue.length; i++) {
        const item = this.productionQueue[i];
        
        if (now >= item.estimatedCompletion) {
          completedItems.push(item);
          this.productionQueue.splice(i, 1);
          i--;
        }
      }

      // Complete finished items
      for (const item of completedItems) {
        this.completeProduction(item);
      }

      // Display production status
      if (this.productionQueue.length > 0) {
        console.log(chalk.blue(`\n⚙️  Production Queue (${this.productionQueue.length} items):`));
        for (const item of this.productionQueue) {
          const remaining = Math.max(0, Math.round((item.estimatedCompletion - now) / 1000));
          console.log(chalk.gray(`   ${item.productName}: ${remaining}s remaining`));
        }
      }

    }, 2000); // Check every 2 seconds
  }

  /**
   * Complete production of an item
   */
  async completeProduction(item) {
    console.log(chalk.green(`\n✅ Production completed: ${item.productName}`));
    console.log(chalk.gray(`   Production time: ${Math.round((Date.now() - item.startTime) / 1000)}s`));

    // Consume ingredients
    if (item.matterCodes) {
      this.consumeIngredients(item.matterCodes);
    }

    // Update status to "Completed" (5)
    await this.updateOrderStatus(item.orderId, item.itemId, 5);

    // Print receipt simulation
    console.log(chalk.cyan(`   🖨️  Printing receipt...`));
    
    this.statistics.ordersProcessed++;
  }

  /**
   * Consume ingredients after production
   */
  consumeIngredients(matterCodes) {
    const ingredients = matterCodes.split(',');
    for (const ingredient of ingredients) {
      const trimmed = ingredient.trim();
      if (this.machineStatus.ingredientLevels[trimmed] > 0) {
        this.machineStatus.ingredientLevels[trimmed] -= Math.floor(Math.random() * 5) + 1;
        this.machineStatus.ingredientLevels[trimmed] = Math.max(0, this.machineStatus.ingredientLevels[trimmed]);
      }
    }
  }

  /**
   * Report device status to backend
   */
  async reportDeviceStatus() {
    try {
      const matterStatusJson = JSON.stringify(this.machineStatus.ingredientLevels);
      const deviceStatusJson = JSON.stringify({
        deviceStatus1: this.machineStatus.power ? 1 : 0,
        deviceStatus2: this.machineStatus.ready ? 1 : 0,
        deviceStatus3: this.machineStatus.maintenance ? 0 : 1,
        deviceStatus4: this.machineStatus.temperature > 80 ? 1 : 0,
        lhStatus: 1, // Printer status
        temperature: this.machineStatus.temperature,
        pressure: this.machineStatus.pressure,
        waterLevel: this.machineStatus.waterLevel
      });

      const response = await axios.post(`${this.config.backendUrl}/saveDeviceMatter`, {
        matterStatusJson,
        deviceStatusJson,
        deviceId: parseInt(this.config.deviceId)
      });

      if (response.data.code === 0) {
        if (this.config.verbose) {
          console.log(chalk.gray('📊 Device status reported successfully'));
        }
      }
    } catch (error) {
      if (this.config.verbose) {
        console.log(chalk.red(`❌ Device status report failed: ${error.message}`));
      }
    }
  }

  /**
   * Start periodic device status reporting
   */
  startDeviceStatusReporting() {
    // Report status every 30 seconds
    setInterval(() => {
      if (this.isRunning) {
        this.reportDeviceStatus();
        this.simulateEnvironmentalChanges();
      }
    }, 30000);
  }

  /**
   * Simulate environmental changes (temperature, ingredient levels, etc.)
   */
  simulateEnvironmentalChanges() {
    // Temperature fluctuation
    this.machineStatus.temperature += (Math.random() - 0.5) * 2;
    this.machineStatus.temperature = Math.max(75, Math.min(95, this.machineStatus.temperature));

    // Pressure fluctuation
    this.machineStatus.pressure += (Math.random() - 0.5) * 1;
    this.machineStatus.pressure = Math.max(12, Math.min(18, this.machineStatus.pressure));

    // Water level decrease
    if (Math.random() < 0.1) { // 10% chance
      this.machineStatus.waterLevel = Math.max(0, this.machineStatus.waterLevel - Math.floor(Math.random() * 5));
    }

    // Random ingredient depletion
    for (const ingredient in this.machineStatus.ingredientLevels) {
      if (Math.random() < 0.05) { // 5% chance
        this.machineStatus.ingredientLevels[ingredient] = Math.max(0, 
          this.machineStatus.ingredientLevels[ingredient] - Math.floor(Math.random() * 3));
      }
    }
  }

  /**
   * Display current machine statistics
   */
  displayStatistics() {
    const uptime = Math.round((Date.now() - this.statistics.uptime) / 1000);
    console.log(chalk.blue('\n📊 Machine Statistics:'));
    console.log(chalk.gray(`   Uptime: ${uptime}s`));
    console.log(chalk.gray(`   Orders Processed: ${this.statistics.ordersProcessed}`));
    console.log(chalk.gray(`   Total Polls: ${this.statistics.totalPolls}`));
    console.log(chalk.gray(`   Errors: ${this.statistics.errors}`));
    console.log(chalk.gray(`   Success Rate: ${((this.statistics.totalPolls - this.statistics.errors) / this.statistics.totalPolls * 100).toFixed(1)}%`));
    console.log(chalk.gray(`   Queue Length: ${this.productionQueue.length}`));
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  setupSignalHandlers() {
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log(chalk.yellow('\n🛑 Shutting down coffee machine simulator...'));
    this.isRunning = false;
    
    this.displayStatistics();
    
    console.log(chalk.green('✅ Coffee machine simulator stopped safely.'));
    process.exit(0);
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
      case '--poll-interval':
        config.pollInterval = parseInt(args[++i]);
        break;
      case '--no-auto':
        config.autoMode = false;
        break;
      case '--quiet':
        config.verbose = false;
        break;
      case '--help':
        console.log(`
Coffee Machine Simulator

Usage: node machine.js [options]

Options:
  --backend-url <url>     Backend API URL (default: http://localhost:3000/api/motong)
  --device-id <id>        Device ID (default: 1)
  --poll-interval <ms>    Polling interval in milliseconds (default: 5000)
  --no-auto               Disable automatic production mode
  --quiet                 Reduce output verbosity
  --help                  Show this help message

Examples:
  node machine.js
  node machine.js --backend-url http://localhost:8080/api/motong --device-id 2
  node machine.js --poll-interval 3000 --no-auto
        `);
        process.exit(0);
    }
  }

  // Start the simulator
  const machine = new CoffeeMachineSimulator(config);
  machine.start();
}

module.exports = CoffeeMachineSimulator;
