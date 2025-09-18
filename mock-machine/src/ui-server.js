#!/usr/bin/env node

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const axios = require('axios');

/**
 * Coffee Machine Simulator Web Interface
 * Real-time dashboard for monitoring and controlling the mock machine
 */
class MachineUI {
  constructor(config = {}) {
    this.config = {
      port: config.port || 3002,
      backendUrl: config.backendUrl || 'http://localhost:3000/api/motong',
      machineDataFile: config.machineDataFile || './machine-data.json',
      ...config
    };

    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.machineData = {
      status: 'offline',
      orders: [],
      statistics: {
        ordersProcessed: 0,
        totalPolls: 0,
        errors: 0,
        uptime: Date.now()
      },
      ingredients: {},
      deviceStatus: {},
      productionQueue: []
    };

    this.setupRoutes();
    this.setupSocketHandlers();
    this.startDataCollection();
  }

  /**
   * Setup Express routes
   */
  setupRoutes() {
    // Serve static files
    this.app.use('/static', express.static(path.join(__dirname, '../public')));
    this.app.use(express.json());

    // Main dashboard
    this.app.get('/', (req, res) => {
      res.send(this.generateDashboardHTML());
    });

    // API endpoints for machine control
    this.app.get('/api/machine/status', (req, res) => {
      res.json(this.machineData);
    });

    this.app.post('/api/machine/control', (req, res) => {
      const { action, params } = req.body;
      this.handleMachineControl(action, params);
      res.json({ success: true, action, params });
    });

    // Machine data endpoint
    this.app.get('/api/machine/logs', (req, res) => {
      try {
        const logs = this.readMachineLogs();
        res.json(logs);
      } catch (error) {
        res.status(500).json({ error: 'Failed to read logs' });
      }
    });
  }

  /**
   * Setup Socket.IO handlers for real-time communication
   */
  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(chalk.blue('📱 Dashboard client connected'));

      // Send initial data
      socket.emit('machineData', this.machineData);

      // Handle machine control requests
      socket.on('controlMachine', (data) => {
        this.handleMachineControl(data.action, data);
      });

      socket.on('disconnect', () => {
        console.log(chalk.gray('📱 Dashboard client disconnected'));
      });
    });
  }

  /**
   * Generate HTML dashboard
   */
  generateDashboardHTML() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coffee Machine Simulator Dashboard</title>
    <script src="https://cdn.socket.io/4.5.0/socket.io.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            color: white;
        }

        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 0.9em;
        }

        .status-online { background: #4CAF50; color: white; }
        .status-offline { background: #f44336; color: white; }
        .status-error { background: #ff9800; color: white; }

        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }

        .card h3 {
            margin-bottom: 15px;
            color: #333;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
        }

        .stat-item {
            text-align: center;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 8px;
        }

        .stat-value {
            font-size: 1.5em;
            font-weight: bold;
            color: #667eea;
        }

        .stat-label {
            font-size: 0.9em;
            color: #666;
            margin-top: 5px;
        }

        .order-item {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 12px;
            margin: 8px 0;
            border-left: 4px solid #667eea;
        }

        .order-status {
            font-weight: bold;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
        }

        .status-3 { background: #fff3cd; color: #856404; }
        .status-4 { background: #cce5ff; color: #004085; }
        .status-5 { background: #d4edda; color: #155724; }

        .ingredient-bar {
            display: flex;
            align-items: center;
            margin: 8px 0;
        }

        .ingredient-name {
            min-width: 120px;
            font-size: 0.9em;
        }

        .progress-bar {
            flex: 1;
            height: 20px;
            background: #e0e0e0;
            border-radius: 10px;
            overflow: hidden;
            margin: 0 10px;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #ff6b6b 0%, #ffd93d 50%, #6bcf7f 100%);
            transition: width 0.3s ease;
        }

        .ingredient-level {
            min-width: 40px;
            text-align: right;
            font-weight: bold;
        }

        .controls {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }

        .btn {
            padding: 10px 16px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 0.9em;
            transition: all 0.3s ease;
        }

        .btn-primary {
            background: #667eea;
            color: white;
        }

        .btn-primary:hover {
            background: #5a67d8;
            transform: translateY(-2px);
        }

        .btn-danger {
            background: #f56565;
            color: white;
        }

        .btn-warning {
            background: #ed8936;
            color: white;
        }

        .btn-success {
            background: #48bb78;
            color: white;
        }

        .logs {
            background: #1a1a1a;
            color: #00ff00;
            font-family: 'Courier New', monospace;
            padding: 15px;
            border-radius: 8px;
            height: 200px;
            overflow-y: auto;
            font-size: 0.9em;
        }

        .log-entry {
            margin: 2px 0;
        }

        .chart-container {
            position: relative;
            height: 300px;
            margin-top: 20px;
        }

        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
        }

        @keyframes slideIn {
            0% { 
                transform: translateX(100%);
                opacity: 0;
            }
            100% { 
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes fadeOut {
            0% { 
                transform: translateX(0);
                opacity: 1;
            }
            100% { 
                transform: translateX(100%);
                opacity: 0;
            }
        }

        .processing {
            animation: pulse 2s infinite;
        }

        .order-item {
            transition: all 0.3s ease;
        }

        .order-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>☕ Coffee Machine Simulator</h1>
            <div class="status-badge" id="machineStatus">OFFLINE</div>
        </div>

        <div class="dashboard-grid">
            <!-- Statistics Card -->
            <div class="card">
                <h3>📊 Statistics</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-value" id="ordersProcessed">0</div>
                        <div class="stat-label">Orders Processed</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="totalPolls">0</div>
                        <div class="stat-label">Total Polls</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="errorCount">0</div>
                        <div class="stat-label">Errors</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="uptime">0s</div>
                        <div class="stat-label">Uptime</div>
                    </div>
                </div>
            </div>

            <!-- Current Orders Card -->
            <div class="card">
                <h3>📋 Current Orders</h3>
                <div id="currentOrders">
                    <p style="color: #666; text-align: center; padding: 20px;">No active orders</p>
                </div>
            </div>

            <!-- Production Queue Card -->
            <div class="card">
                <h3>⚙️ Production Queue</h3>
                <div id="productionQueue">
                    <p style="color: #666; text-align: center; padding: 20px;">No items in production</p>
                </div>
            </div>

            <!-- Ingredient Levels Card -->
            <div class="card">
                <h3>🥤 Ingredient Levels</h3>
                <div id="ingredientLevels">
                    <p style="color: #666; text-align: center; padding: 20px;">Loading...</p>
                </div>
            </div>

            <!-- Machine Controls Card -->
            <div class="card">
                <h3>🎮 Machine Controls</h3>
                <div class="controls">
                    <button class="btn btn-primary" onclick="startMachine()">Start Machine</button>
                    <button class="btn btn-danger" onclick="stopMachine()">Stop Machine</button>
                    <button class="btn btn-warning" onclick="resetMachine()">Reset</button>
                    <button class="btn btn-success" onclick="refillIngredients()">Refill All</button>
                </div>
                <div class="controls" style="margin-top: 10px;">
                    <button class="btn btn-warning" onclick="simulateEspressoProduction()">Make Espresso</button>
                    <button class="btn btn-warning" onclick="simulateCappuccinoProduction()">Make Cappuccino</button>
                    <button class="btn btn-warning" onclick="simulateLatteProduction()">Make Latte</button>
                </div>
            </div>

            <!-- Device Status Card -->
            <div class="card">
                <h3>🔧 Device Status</h3>
                <div id="deviceStatus">
                    <p style="color: #666; text-align: center; padding: 20px;">Loading...</p>
                </div>
            </div>
        </div>

        <!-- Logs Section -->
        <div class="card">
            <h3>📝 Machine Logs</h3>
            <div class="logs" id="machineLogs">
                <div class="log-entry">Waiting for machine connection...</div>
            </div>
        </div>

        <!-- Performance Chart -->
        <div class="card">
            <h3>📈 Performance Chart</h3>
            <div class="chart-container">
                <canvas id="performanceChart"></canvas>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        let performanceChart;
        let chartData = [];

        // Initialize chart
        function initChart() {
            const ctx = document.getElementById('performanceChart').getContext('2d');
            performanceChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Orders Processed',
                        data: [],
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4
                    }, {
                        label: 'Error Rate %',
                        data: [],
                        borderColor: '#f56565',
                        backgroundColor: 'rgba(245, 101, 101, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // Socket event handlers
        socket.on('machineData', (data) => {
            updateDashboard(data);
        });

        socket.on('logUpdate', (logEntry) => {
            addLogEntry(logEntry);
        });

        function updateDashboard(data) {
            // Update status badge
            const statusElement = document.getElementById('machineStatus');
            statusElement.textContent = data.status.toUpperCase();
            statusElement.className = 'status-badge status-' + data.status;

            // Update statistics
            document.getElementById('ordersProcessed').textContent = data.statistics.ordersProcessed || 0;
            document.getElementById('totalPolls').textContent = data.statistics.totalPolls || 0;
            document.getElementById('errorCount').textContent = data.statistics.errors || 0;
            
            const uptime = Math.round((Date.now() - (data.statistics.uptime || Date.now())) / 1000);
            document.getElementById('uptime').textContent = uptime + 's';

            // Update orders
            updateOrders(data.orders || []);

            // Update production queue
            updateProductionQueue(data.productionQueue || []);

            // Update ingredient levels
            updateIngredientLevels(data.ingredients || {});

            // Update device status
            updateDeviceStatus(data.deviceStatus || {});

            // Update chart
            updateChart(data.statistics);
        }

        function updateOrders(orders) {
            const container = document.getElementById('currentOrders');
            if (orders.length === 0) {
                container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No active orders</p>';
                return;
            }

            container.innerHTML = orders.map(order => 
                \`<div class="order-item">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong>Order #\${order.id}</strong>
                        <span class="order-status status-\${order.status}">\${getStatusName(order.status)}</span>
                    </div>
                    <div style="margin-top: 8px; font-size: 0.9em; color: #666;">
                        Product: \${order.productName || 'Unknown'}<br>
                        Order: \${order.orderNum || 'N/A'}<br>
                        Instructions: \${order.jsonCodeVal || 'N/A'}
                    </div>
                    <div style="margin-top: 10px; display: flex; gap: 8px;">
                        \${order.status === 3 ? \`<button class="btn btn-primary" style="padding: 6px 12px; font-size: 0.8em;" onclick="startProduction(\${order.orderId}, \${order.id})">Start Production</button>\` : ''}
                        \${order.status === 4 ? \`<button class="btn btn-success" style="padding: 6px 12px; font-size: 0.8em;" onclick="finishOrder(\${order.orderId}, \${order.id})">Finish Order</button>\` : ''}
                        \${order.status === 5 ? \`<span style="color: #48bb78; font-weight: bold; font-size: 0.8em;">✅ Completed</span>\` : ''}
                    </div>
                </div>\`
            ).join('');
        }

        function updateProductionQueue(queue) {
            const container = document.getElementById('productionQueue');
            if (queue.length === 0) {
                container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No items in production</p>';
                return;
            }

            container.innerHTML = queue.map(item => {
                const remaining = Math.max(0, Math.round((item.estimatedCompletion - Date.now()) / 1000));
                return \`<div class="order-item processing">
                    <strong>\${item.productName}</strong>
                    <div style="margin-top: 5px; font-size: 0.9em;">
                        Time remaining: <strong>\${remaining}s</strong>
                    </div>
                </div>\`;
            }).join('');
        }

        function updateIngredientLevels(ingredients) {
            const container = document.getElementById('ingredientLevels');
            const ingredientList = Object.entries(ingredients);
            
            if (ingredientList.length === 0) {
                container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No ingredient data</p>';
                return;
            }

            container.innerHTML = ingredientList.map(([name, level]) => 
                \`<div class="ingredient-bar">
                    <div class="ingredient-name">\${name}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: \${level}%"></div>
                    </div>
                    <div class="ingredient-level">\${level}%</div>
                </div>\`
            ).join('');
        }

        function updateDeviceStatus(status) {
            const container = document.getElementById('deviceStatus');
            const statusList = Object.entries(status);
            
            if (statusList.length === 0) {
                container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No device status data</p>';
                return;
            }

            container.innerHTML = statusList.map(([key, value]) => 
                \`<div style="display: flex; justify-content: space-between; margin: 8px 0;">
                    <span>\${key}:</span>
                    <strong style="color: \${value ? '#48bb78' : '#f56565'}">\${value ? 'OK' : 'ERROR'}</strong>
                </div>\`
            ).join('');
        }

        function updateChart(statistics) {
            const now = new Date().toLocaleTimeString();
            chartData.push({
                time: now,
                orders: statistics.ordersProcessed || 0,
                errorRate: statistics.totalPolls > 0 ? (statistics.errors / statistics.totalPolls * 100) : 0
            });

            // Keep only last 20 data points
            if (chartData.length > 20) {
                chartData = chartData.slice(-20);
            }

            performanceChart.data.labels = chartData.map(d => d.time);
            performanceChart.data.datasets[0].data = chartData.map(d => d.orders);
            performanceChart.data.datasets[1].data = chartData.map(d => d.errorRate);
            performanceChart.update();
        }

        function addLogEntry(entry) {
            const logsContainer = document.getElementById('machineLogs');
            const logDiv = document.createElement('div');
            logDiv.className = 'log-entry';
            logDiv.textContent = \`[\${new Date().toLocaleTimeString()}] \${entry}\`;
            logsContainer.appendChild(logDiv);
            logsContainer.scrollTop = logsContainer.scrollHeight;

            // Keep only last 50 log entries
            const logs = logsContainer.children;
            if (logs.length > 50) {
                logsContainer.removeChild(logs[0]);
            }
        }

        function getStatusName(status) {
            const names = {
                3: 'Queuing',
                4: 'Processing', 
                5: 'Completed'
            };
            return names[status] || 'Unknown';
        }

        // Control functions
        function startMachine() {
            socket.emit('controlMachine', { action: 'start' });
            addLogEntry('Start command sent');
        }

        function stopMachine() {
            socket.emit('controlMachine', { action: 'stop' });
            addLogEntry('Stop command sent');
        }

        function resetMachine() {
            socket.emit('controlMachine', { action: 'reset' });
            addLogEntry('Reset command sent');
        }

        function refillIngredients() {
            socket.emit('controlMachine', { action: 'refill' });
            addLogEntry('Refill command sent');
        }

        function simulateEspressoProduction() {
            socket.emit('controlMachine', { 
                action: 'consumeIngredients', 
                matterCodes: 'CoffeeMatter12,CoffeeMatter11,CoffeeMatter1,CoffeeMatter2,CoffeeMatter5' 
            });
            addLogEntry('☕ Simulating Espresso production - consuming ingredients');
        }

        function simulateCappuccinoProduction() {
            socket.emit('controlMachine', { 
                action: 'consumeIngredients', 
                matterCodes: 'CoffeeMatter12,CoffeeMatter11,CoffeeMatter1,CoffeeMatter3,CoffeeMatter6' 
            });
            addLogEntry('☕ Simulating Cappuccino production - consuming ingredients');
        }

        function simulateLatteProduction() {
            socket.emit('controlMachine', { 
                action: 'consumeIngredients', 
                matterCodes: 'CoffeeMatter12,CoffeeMatter11,CoffeeMatter1,CoffeeMatter2,CoffeeMatter3' 
            });
            addLogEntry('☕ Simulating Latte production - consuming ingredients');
        }

        // Order management functions
        async function startProduction(orderId, orderGoodsId) {
            try {
                addLogEntry(\`Starting production for Order \${orderId}, Item \${orderGoodsId}\`);
                
                const response = await fetch('/api/machine/control', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'updateOrderStatus',
                        params: {
                            orderId: orderId,
                            orderGoodsId: orderGoodsId,
                            status: 4  // Processing
                        }
                    })
                });

                if (response.ok) {
                    addLogEntry(\`✅ Order \${orderId} started production\`);
                } else {
                    addLogEntry(\`❌ Failed to start production for Order \${orderId}\`);
                }
            } catch (error) {
                addLogEntry(\`❌ Error starting production: \${error.message}\`);
            }
        }

        async function finishOrder(orderId, orderGoodsId) {
            try {
                addLogEntry(\`Finishing Order \${orderId}, Item \${orderGoodsId}\`);
                
                const response = await fetch('/api/machine/control', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'updateOrderStatus',
                        params: {
                            orderId: orderId,
                            orderGoodsId: orderGoodsId,
                            status: 5  // Completed
                        }
                    })
                });

                if (response.ok) {
                    addLogEntry(\`✅ Order \${orderId} completed successfully!\`);
                    // Add a celebration effect
                    showOrderCompleted(orderId);
                } else {
                    addLogEntry(\`❌ Failed to complete Order \${orderId}\`);
                }
            } catch (error) {
                addLogEntry(\`❌ Error completing order: \${error.message}\`);
            }
        }

        function showOrderCompleted(orderId) {
            // Create a temporary success notification
            const notification = document.createElement('div');
            notification.style.cssText = \`
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #48bb78, #38a169);
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                z-index: 1000;
                font-weight: bold;
                animation: slideIn 0.3s ease;
            \`;
            notification.innerHTML = \`🎉 Order #\${orderId} Completed! ☕\`;
            
            document.body.appendChild(notification);
            
            // Remove after 3 seconds
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }

        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', () => {
            initChart();
            addLogEntry('Dashboard initialized');
        });
    </script>
</body>
</html>
    `;
  }

  /**
   * Handle machine control commands
   */
  async handleMachineControl(action, data) {
    console.log(chalk.blue(`🎮 Control command: ${action}`), data || '');
    
    switch (action) {
      case 'start':
        // Implementation would send signal to machine simulator
        this.broadcastUpdate({ type: 'control', action: 'start' });
        break;
      case 'stop':
        this.broadcastUpdate({ type: 'control', action: 'stop' });
        break;
      case 'reset':
        this.resetMachineData();
        this.broadcastUpdate({ type: 'control', action: 'reset' });
        break;
      case 'refill':
        await this.refillIngredients();
        this.broadcastUpdate({ type: 'control', action: 'refill' });
        break;
      case 'consumeIngredients':
        await this.simulateIngredientConsumption(data.matterCodes);
        this.broadcastUpdate({ type: 'control', action: 'consumeIngredients' });
        break;
      case 'updateOrderStatus':
        await this.updateOrderStatus(data);
        break;
    }
  }

  /**
   * Update order status via backend API
   */
  async updateOrderStatus(params) {
    try {
      const axios = require('axios');
      console.log(chalk.cyan(`📋 Updating order status: Order ${params.orderId}, Item ${params.orderGoodsId}, Status ${params.status}`));
      
      const response = await axios.post(`${this.config.backendUrl}/editDeviceOrderStatus`, {
        orderId: params.orderId,
        orderGoodsId: params.orderGoodsId,
        status: params.status
      });

      if (response.data && response.data.code === 0) {
        console.log(chalk.green(`✅ Order status updated successfully`));
        
        // Simulate ingredient consumption when order is completed
        if (params.status === 5) {
          // Find the order item to get matterCodes
          const orderItem = this.machineData.orders.find(order => 
            order.items && order.items.some(item => item.id === params.orderGoodsId)
          );
          
          if (orderItem) {
            const item = orderItem.items.find(item => item.id === params.orderGoodsId);
            if (item && item.matterCodes) {
              this.simulateIngredientConsumption(item.matterCodes);
            }
          }
        }
        
        // Broadcast log update
        const statusNames = { 3: 'Queuing', 4: 'Processing', 5: 'Completed' };
        this.broadcastUpdate({ 
          type: 'log', 
          message: `Order ${params.orderId} status changed to ${params.status} (${statusNames[params.status]})` 
        });
        
        // Trigger data refresh
        await this.updateSimulatedData();
        this.broadcastUpdate({ type: 'data' });
        
      } else {
        console.log(chalk.red(`❌ Failed to update order status: ${response.data?.msg}`));
        this.broadcastUpdate({ 
          type: 'log', 
          message: `Failed to update Order ${params.orderId}: ${response.data?.msg}` 
        });
      }
    } catch (error) {
      console.log(chalk.red(`❌ Error updating order status: ${error.message}`));
      this.broadcastUpdate({ 
        type: 'log', 
        message: `Error updating order status: ${error.message}` 
      });
    }
  }

  /**
   * Reset machine data
   */
  resetMachineData() {
    this.machineData.statistics = {
      ordersProcessed: 0,
      totalPolls: 0,
      errors: 0,
      uptime: Date.now()
    };
    this.machineData.orders = [];
    this.machineData.productionQueue = [];
  }

  /**
   * Refill all ingredients and report to backend
   */
  async refillIngredients() {
    // Refill all ingredients to 100%
    for (const ingredient in this.machineData.ingredients) {
      this.machineData.ingredients[ingredient] = 100;
    }
    
    console.log('🔄 All ingredients refilled to 100%');

    // Prepare data for saveDeviceMatter API call
    const matterStatusJson = JSON.stringify(this.machineData.ingredients);
    const deviceStatusJson = JSON.stringify({
      deviceStatus1: 1, // Power status
      deviceStatus2: 1, // Ready status  
      deviceStatus3: 1, // Maintenance status
      deviceStatus4: 0, // Error status
      lhStatus: 1       // Printer status
    });

    try {
      // Call saveDeviceMatter API to update backend
      const response = await axios.post(`${this.config.backendUrl}/saveDeviceMatter`, {
        matterStatusJson: matterStatusJson,
        deviceStatusJson: deviceStatusJson,
        deviceId: 1
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      if (response.data.code === 0) {
        console.log('✅ Ingredient refill reported to backend successfully');
        this.broadcastUpdate({ 
          type: 'log', 
          message: '✅ All ingredients refilled and reported to backend'
        });
      } else {
        console.log('⚠️ Backend returned error:', response.data.msg);
        this.broadcastUpdate({ 
          type: 'log', 
          message: `⚠️ Refill reported but backend returned: ${response.data.msg}`
        });
      }
    } catch (error) {
      console.error('❌ Failed to report refill to backend:', error.message);
      this.broadcastUpdate({ 
        type: 'log', 
        message: `❌ Refill completed but failed to report to backend: ${error.message}`
      });
    }
    
    // Broadcast update to show new levels immediately
    this.broadcastUpdate({ type: 'data' });
  }

  /**
   * Simulate ingredient consumption during production
   */
  async simulateIngredientConsumption(matterCodes) {
    if (!matterCodes) return;
    
    const ingredients = matterCodes.split(',').map(code => code.trim());
    let consumed = false;
    
    for (const ingredient of ingredients) {
      if (this.machineData.ingredients[ingredient] !== undefined) {
        // Consume 2-5% of ingredient per order
        const consumption = Math.floor(Math.random() * 4) + 2;
        this.machineData.ingredients[ingredient] = Math.max(0, this.machineData.ingredients[ingredient] - consumption);
        consumed = true;
      }
    }
    
    if (consumed) {
      console.log(`🏭 Ingredients consumed during production: ${ingredients.join(', ')}`);
      // Sync updated ingredient levels with backend
      await this.syncIngredientsWithBackend();
    }
  }

  /**
   * Sync current ingredient levels with backend
   */
  async syncIngredientsWithBackend() {
    try {
      const matterStatusJson = JSON.stringify(this.machineData.ingredients);
      const deviceStatusJson = JSON.stringify({
        deviceStatus1: this.machineData.deviceStatus.power ? 1 : 0,
        deviceStatus2: this.machineData.deviceStatus.ready ? 1 : 0,
        deviceStatus3: this.machineData.deviceStatus.maintenance ? 0 : 1,
        deviceStatus4: 0, // Error status
        lhStatus: 1       // Printer status
      });

      const response = await axios.post(`${this.config.backendUrl}/saveDeviceMatter`, {
        matterStatusJson: matterStatusJson,
        deviceStatusJson: deviceStatusJson,
        deviceId: 1
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      if (response.data.code === 0) {
        console.log('📊 Ingredient levels synced with backend');
      } else {
        console.log('⚠️ Backend sync returned error:', response.data.msg);
      }
    } catch (error) {
      console.error('❌ Failed to sync ingredients with backend:', error.message);
    }
  }

  /**
   * Broadcast update to all connected clients
   */
  broadcastUpdate(data) {
    this.io.emit('machineData', this.machineData);
    if (data.type === 'log') {
      this.io.emit('logUpdate', data.message);
    }
  }

  /**
   * Start collecting data (simulated)
   */
  startDataCollection() {
    // Simulate data updates every 2 seconds
    setInterval(() => {
      // This would normally read from the actual machine simulator
      this.updateSimulatedData();
      this.broadcastUpdate({ type: 'data' });
    }, 2000);
    
    // Sync ingredient levels with backend every 30 seconds
    setInterval(() => {
      this.syncIngredientsWithBackend();
    }, 30000);
  }

  /**
   * Update data from backend
   */
  async updateSimulatedData() {
    try {
      // Fetch real orders from backend
      const axios = require('axios');
      const ordersResponse = await axios.post(`${this.config.backendUrl}/deviceOrderQueueList`, {
        deviceId: '1'
      });

      if (ordersResponse.data && ordersResponse.data.code === 0) {
        const orders = ordersResponse.data.data || [];
        this.machineData.orders = [];

        // Process orders to extract items
        for (const order of orders) {
          const allItems = [
            ...(order.typeList1 || []),
            ...(order.typeList2 || []),
            ...(order.typeList3 || []),
            ...(order.typeList4 || [])
          ];

          for (const item of allItems) {
            this.machineData.orders.push({
              id: item.id,
              orderId: order.id,
              productName: item.goodsName || item.goodsNameEn || 'Unknown',
              status: item.status,
              jsonCodeVal: item.jsonCodeVal,
              matterCodes: item.matterCodes,
              statusName: item.statusName,
              orderNum: order.orderNum
            });
          }
        }

        this.machineData.statistics.ordersProcessed = this.machineData.orders.filter(o => o.status === 5).length;
      }

      // Initialize ingredient levels only if they don't exist (preserve refill values)
      if (!this.machineData.ingredients || Object.keys(this.machineData.ingredients).length === 0) {
        this.machineData.ingredients = {
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
        };
      }

      this.machineData.deviceStatus = {
        power: true,
        ready: true,
        maintenance: false,
        temperature: 85 + (Math.random() - 0.5) * 5,
        pressure: 15 + (Math.random() - 0.5) * 1
      };

      this.machineData.status = this.machineData.deviceStatus.ready ? 'online' : 'error';

    } catch (error) {
      console.log(`⚠️ Could not fetch backend data: ${error.message}`);
      this.machineData.status = 'error';
    }
  }

  /**
   * Read machine logs (placeholder)
   */
  readMachineLogs() {
    return [
      { timestamp: Date.now(), level: 'info', message: 'Machine simulator UI started' },
      { timestamp: Date.now() - 1000, level: 'info', message: 'Waiting for machine connection' }
    ];
  }

  /**
   * Start the UI server
   */
  start() {
    this.server.listen(this.config.port, () => {
      console.log(chalk.green(`🖥️  Machine UI Dashboard started`));
      console.log(chalk.cyan(`📱 Dashboard: http://localhost:${this.config.port}`));
      console.log(chalk.cyan(`🔗 Backend: ${this.config.backendUrl}`));
      console.log(chalk.gray('Real-time monitoring and control interface ready!'));
    });
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const config = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--port':
        config.port = parseInt(args[++i]);
        break;
      case '--backend-url':
        config.backendUrl = args[++i];
        break;
      case '--help':
        console.log(`
Coffee Machine UI Server

Usage: node ui-server.js [options]

Options:
  --port <port>           UI server port (default: 3002)
  --backend-url <url>     Backend API URL (default: http://localhost:3000/api/motong)
  --help                  Show this help message

Examples:
  node ui-server.js
  node ui-server.js --port 8080 --backend-url http://localhost:8080/api/motong
        `);
        process.exit(0);
    }
  }

  const ui = new MachineUI(config);
  ui.start();
}

module.exports = MachineUI;
