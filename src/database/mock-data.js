// Lazy require to avoid circular dependency with db.js
let db = null;
function getDb() {
  if (!db) {
    db = require('./db');
  }
  return db;
}
const networkConfig = require('../config/network');

class MockDataGenerator {
  static generateTimestamp() {
    return Math.floor(Date.now() / 1000);
  }

  static generateDateTime() {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }

  static generateOrderNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    return `${year}${month}${day}${random}`;
  }

  static insertMockData() {
    console.log('🔄 Inserting mock data...');

    try {
      // Clear existing data first
      getDb().clearAllData();

      // Insert default categories first
      this.insertDefaultCategories();

      // Insert mock products first
      this.insertMockProducts();

      // Insert mock orders
      const orders = this.getMockOrders();
      const orderGoods = this.getMockOrderGoods();

      // Insert orders and collect their IDs
      const orderIds = [];
      orders.forEach(order => {
        const result = getDb().insertOrder(order);
        orderIds.push(result.lastInsertRowid);
        console.log(`✅ Inserted order ${order.orderNum} with ID: ${result.lastInsertRowid}`);
      });

      // Insert order goods with correct order IDs - 1 ITEM PER ORDER like original backend
      orderGoods.forEach((goods, index) => {
        // Map each item to its own order ID (1:1 mapping)
        goods.orderId = orderIds[index] || orderIds[0]; // Each item gets its own order
        const result = getDb().insertOrderGoods(goods);
        console.log(`✅ Inserted goods ${goods.goodsName} with ID: ${result.lastInsertRowid}`);
      });

      // Insert device status
      this.insertMockDeviceStatus();

      console.log('🎉 Mock data insertion completed!');
    } catch (error) {
      console.error('❌ Error inserting mock data:', error);
      throw error;
    }
  }

  static getMockOrders() {
    const now = this.generateTimestamp();
    const nowDateTime = this.generateDateTime();

    return [
      {
        deviceId: 1,
        orderNum: this.generateOrderNumber(),
        uid: 6,
        num: 1,
        realPrice: "1.00",
        payMoney: "1.00",
        status: 3, // Queuing - ready for machine to process
        createdAt: now,
        createdTime: nowDateTime,
        payTime: nowDateTime,
        paymentIntent: `pi_${Math.random().toString(36).substr(2, 24)}`,
        name: "STORE1",
        address: "辽宁省沈阳市铁西区十三号路",
        guomaoChannel: "123",
        guomaoUsedUser: "22110001",
        language: "en"
      },
      {
        deviceId: 1,
        orderNum: this.generateOrderNumber(),
        uid: 7,
        num: 1,
        realPrice: "2.50",
        payMoney: "2.50",
        status: 4, // Processing - machine is working on this
        createdAt: now - 300, // 5 minutes ago
        createdTime: new Date(Date.now() - 300000).toISOString().slice(0, 19).replace('T', ' '),
        payTime: new Date(Date.now() - 300000).toISOString().slice(0, 19).replace('T', ' '),
        paymentIntent: `pi_${Math.random().toString(36).substr(2, 24)}`,
        name: "STORE1",
        address: "辽宁省沈阳市铁西区十三号路",
        guomaoChannel: "123",
        guomaoUsedUser: "22110001",
        language: "en"
      }
    ];
  }

  static getMockOrderGoods() {
    return [
      // Order 1 - Espresso ONLY (Ready to process) - 1 item per order like original backend
      {
        orderId: 1,
        deviceGoodsId: 6,
        goodsId: 6,
        goodsName: "意式浓缩",
        goodsNameEn: "Espresso",
        goodsNameOt: "إسبرسو",
        goodsImg: 21,
        goodsOptionName: "8oz纸杯;咖啡豆1",
        goodsOptionNameEn: "8ozCup;CoffeeBean1",
        goodsOptionNameOt: "8ozCup;CoffeeBean1",
        type: 2, // Coffee
        status: 3, // Queuing
        price: "1.00",
        rePrice: "1.00",
        matterCodes: "CoffeeMatter12,CoffeeMatter11,CoffeeMatter1,CoffeeMatter2,CoffeeMatter5",
        num: 1,
        totalPrice: "1.00",
        lhImgPath: "",
        jsonCodeVal: JSON.stringify([
          {"classCode": "5001"},
          {"CupCode": "2"},
          {"BeanCode": "1"}
        ]),
        path: "public/uploads/20240803/6b00113e8890951736f84bea4671ea3d.png",
        goodsPath: networkConfig.getFrontendApiUrl() + "/public/uploads/20240803/6b00113e8890951736f84bea4671ea3d.png",
        language: "en"
      },
      // Order 2 - Cappuccino ONLY (Currently processing) - 1 item per order like original backend
      {
        orderId: 2,
        deviceGoodsId: 7,
        goodsId: 7,
        goodsName: "卡布奇诺",
        goodsNameEn: "Cappuccino",
        goodsNameOt: "كابتشينو",
        goodsImg: 22,
        goodsOptionName: "12oz纸杯;咖啡豆2",
        goodsOptionNameEn: "12ozCup;CoffeeBean2",
        goodsOptionNameOt: "12ozCup;CoffeeBean2",
        type: 2, // Coffee
        status: 4, // Processing
        price: "2.50",
        rePrice: "2.50",
        matterCodes: "CoffeeMatter12,CoffeeMatter11,CoffeeMatter1,CoffeeMatter3,CoffeeMatter6",
        num: 1,
        totalPrice: "2.50",
        lhImgPath: "",
        jsonCodeVal: JSON.stringify([
          {"classCode": "5002"},
          {"CupCode": "3"},
          {"BeanCode": "2"}
        ]),
        path: "public/uploads/20240803/cappuccino.png",
        goodsPath: networkConfig.getFrontendApiUrl() + "/public/uploads/20240803/cappuccino.png",
        language: "en"
      }
    ];
  }

  static insertDefaultCategories() {
    console.log('🏷️ Inserting default categories...');
    
    const defaultCategories = [
      { name: 'Classics', icon: '☕', display_order: 0 },
      { name: 'Latte Art', icon: '🎨', display_order: 1 },
      { name: 'Specialty', icon: '⭐', display_order: 2 },
      { name: 'Cold Brew', icon: '🧊', display_order: 3 },
      { name: 'Seasonal', icon: '🍂', display_order: 4 },
      { name: 'Ice Cream', icon: '🍦', display_order: 5 }
    ];

    defaultCategories.forEach(category => {
      try {
        const result = getDb().insertCategory(category);
        console.log(`✅ Inserted category: ${category.name} with ID: ${result.lastInsertRowid}`);
      } catch (error) {
        console.error(`❌ Failed to insert category ${category.name}:`, error.message);
      }
    });
  }

  static insertMockProducts() {
    console.log('📦 Inserting mock products...');
    
    const mockProducts = [
      {
        goodsId: 6,
        deviceGoodsId: 6,
        goodsName: '意式浓缩',
        goodsNameEn: 'Espresso',
        goodsNameOt: 'إسبرسو',
        type: 2,
        price: 1.50,
        rePrice: 1.50,
        matterCodes: 'CoffeeMatter12,CoffeeMatter11,CoffeeMatter1,CoffeeMatter2,CoffeeMatter5',
        jsonCodeVal: '[{"classCode":"5001"},{"CupCode":"2"},{"BeanCode":"1"}]',
        goodsImg: 21,
        path: 'public/uploads/20240803/6b00113e8890951736f84bea4671ea3d.png',
        goodsPath: networkConfig.getFrontendApiUrl() + '/public/uploads/20240803/6b00113e8890951736f84bea4671ea3d.png'
      },
      {
        goodsId: 7,
        deviceGoodsId: 7,
        goodsName: '卡布奇诺',
        goodsNameEn: 'Cappuccino',
        goodsNameOt: 'كابتشينو',
        type: 2,
        price: 2.50,
        rePrice: 2.50,
        matterCodes: 'CoffeeMatter12,CoffeeMatter11,CoffeeMatter1,CoffeeMatter3,CoffeeMatter6',
        jsonCodeVal: '[{"classCode":"5002"},{"CupCode":"3"},{"BeanCode":"2"}]',
        goodsImg: 22,
        path: 'public/uploads/20240803/cappuccino.png',
        goodsPath: networkConfig.getFrontendApiUrl() + '/public/uploads/20240803/cappuccino.png'
      },
      {
        goodsId: 8,
        deviceGoodsId: 8,
        goodsName: '拿铁',
        goodsNameEn: 'Latte',
        goodsNameOt: 'لاتيه',
        type: 2,
        price: 3.00,
        rePrice: 3.00,
        matterCodes: 'CoffeeMatter12,CoffeeMatter11,CoffeeMatter1,CoffeeMatter2,CoffeeMatter3',
        jsonCodeVal: '[{"classCode":"5003"},{"CupCode":"3"},{"BeanCode":"1"}]',
        goodsImg: 23,
        path: 'public/uploads/20240803/latte.png',
        goodsPath: networkConfig.getFrontendApiUrl() + '/public/uploads/20240803/latte.png'
      },
      {
        goodsId: 9,
        deviceGoodsId: 9,
        goodsName: '美式咖啡',
        goodsNameEn: 'Americano',
        goodsNameOt: 'أمريكانو',
        type: 2,
        price: 2.00,
        rePrice: 2.00,
        matterCodes: 'CoffeeMatter12,CoffeeMatter11,CoffeeMatter1,CoffeeMatter2,CoffeeMatter5',
        jsonCodeVal: '[{"classCode":"5004"},{"CupCode":"2"},{"BeanCode":"1"}]',
        goodsImg: 24,
        path: 'public/uploads/20240803/americano.png',
        goodsPath: networkConfig.getFrontendApiUrl() + '/public/uploads/20240803/americano.png'
      },
      // Ice Cream Product (type=3, device=4)
      {
        goodsId: 28,
        deviceGoodsId: 32,
        goodsName: '原味冰激淋',
        goodsNameEn: 'Vanilla Ice Cream',
        goodsNameOt: 'آيس كريم فانيلا',
        type: 3,
        price: 3.00,
        rePrice: 3.00,
        matterCodes: 'IceMatter10,IceMatter9,IceMatter7,IceMatter6',
        jsonCodeVal: '[{"classCode":"00430001"},{"fruitpiecesType":"0"}]',
        goodsImg: 125,
        path: 'public/uploads/icecream/vanilla.png',
        goodsPath: networkConfig.getFrontendApiUrl() + '/public/uploads/icecream/vanilla.png',
        category: 'Ice Cream',
        hasToppingOptions: true,
        defaultToppingType: 0
      }
    ];

    for (const productData of mockProducts) {
      try {
        const result = getDb().insertProduct(productData);
        console.log(`✅ Product ${productData.goodsNameEn} inserted with ID: ${result.lastInsertRowid}`);
      } catch (error) {
        console.error(`❌ Error inserting product ${productData.goodsNameEn}:`, error);
      }
    }
  }

  static insertMockDeviceStatus() {
    // Real coffee machine ingredients based on the provided image
    const coffeeMatterStatus = {
      "CoffeeMatter1": 85,  // 8oz纸杯 (8oz Paper Cups)
      "CoffeeMatter2": 75,  // 咖啡豆 (Coffee Beans)
      "CoffeeMatter3": 65,  // 牛奶 (Milk)
      "CoffeeMatter4": 90,  // 冰块 (Ice)
      "CoffeeMatter5": 80,  // 咖啡机水 (Coffee Machine Water)
      "CoffeeMatter6": 45,  // 1号杯 (Cup #1) - abnormal status
      "CoffeeMatter7": 40,  // 2杯糖 (2 Cup Sugar) - abnormal status
      "CoffeeMatter8": 35,  // 3杯子 (3 Cups) - abnormal status
      "CoffeeMatter9": 95,  // 打印纸张 (Printer Paper)
      "CoffeeMatter10": 30, // 12oz纸杯 (12oz Paper Cups) - abnormal status
      "CoffeeMatter11": 85, // 咖啡机糖浆 (Coffee Machine Syrup)
      "CoffeeMatter12": 75, // 机器人糖浆 (Robot Syrup)
      "CoffeeMatter13": 70, // 咖啡豆2 (Coffee Beans 2)
      "CoffeeMatter14": 25, // 牛奶2 (Milk 2) - abnormal status
      "CoffeeMatter15": 55  // 制冰机水 (Ice Machine Water) - abnormal status
    };

    const coffeeDeviceStatus = {
      "deviceStatus1": 1, // Main system OK
      "deviceStatus2": 1, // Heating system OK
      "deviceStatus3": 1, // Pump system OK
      "deviceStatus4": 0, // Maintenance needed
      "lhStatus": 1       // Printer OK
    };

    // Insert coffee machine status (deviceId=1)
    const coffeeResult = getDb().saveDeviceStatus(
      1, // device_id for coffee machine
      JSON.stringify(coffeeMatterStatus),
      JSON.stringify(coffeeDeviceStatus)
    );
    console.log(`☕ Inserted coffee machine status with ID: ${coffeeResult.lastInsertRowid}`);

    // Ice cream machine ingredients (deviceId=4)
    const iceCreamMatterStatus = {
      "IceMatter6": 1,   // Ice Cream Base - available (1 = in stock)
      "IceMatter7": 1,   // Vanilla Flavor - available
      "IceMatter8": 1,   // Chocolate Flavor - available
      "IceMatter9": 1,   // Ice Cream Cups - available
      "IceMatter10": 1   // Toppings Container - available
    };

    const iceCreamDeviceStatus = {
      "deviceStatus1": 1, // Main system OK
      "deviceStatus2": 1, // Freezer system OK
      "deviceStatus3": 1, // Dispenser OK
      "lhStatus": 1       // Printer OK
    };

    // Insert ice cream machine status (deviceId=4)
    const iceCreamResult = getDb().saveDeviceStatus(
      4, // device_id for ice cream machine
      JSON.stringify(iceCreamMatterStatus),
      JSON.stringify(iceCreamDeviceStatus)
    );
    console.log(`🍦 Inserted ice cream machine status with ID: ${iceCreamResult.lastInsertRowid}`);
  }

  // Helper method to add new orders dynamically
  static addNewOrder(productType = 'espresso') {
    const orderNum = this.generateOrderNumber();
    const now = this.generateTimestamp();
    const nowDateTime = this.generateDateTime();

    const orderData = {
      deviceId: 1,
      orderNum: orderNum,
      uid: Math.floor(Math.random() * 100) + 1,
      num: 1,
      realPrice: "1.50",
      payMoney: "1.50",
      status: 3, // Ready for processing
      createdAt: now,
      createdTime: nowDateTime,
      payTime: nowDateTime,
      paymentIntent: `pi_${Math.random().toString(36).substr(2, 24)}`,
      name: "STORE1",
      address: "辽宁省沈阳市铁西区十三号路",
      guomaoChannel: "123",
      guomaoUsedUser: "22110001",
      language: "en"
    };

    const orderResult = getDb().insertOrder(orderData);
    const orderId = orderResult.lastInsertRowid;

    // Add corresponding goods
    let goodsData;
    if (productType === 'espresso') {
      goodsData = {
        orderId: orderId,
        deviceGoodsId: 6,
        goodsId: 6,
        goodsName: "意式浓缩",
        goodsNameEn: "Espresso",
        goodsNameOt: "إسبرسو",
        goodsImg: 21,
        goodsOptionName: "8oz纸杯;咖啡豆1",
        goodsOptionNameEn: "8ozCup;CoffeeBean1",
        goodsOptionNameOt: "8ozCup;CoffeeBean1",
        type: 2,
        status: 3,
        price: "1.50",
        rePrice: "1.50",
        matterCodes: "CoffeeMatter12,CoffeeMatter11,CoffeeMatter1,CoffeeMatter2,CoffeeMatter5",
        num: 1,
        totalPrice: "1.50",
        lhImgPath: "",
        jsonCodeVal: JSON.stringify([
          {"classCode": "5001"},
          {"CupCode": "2"},
          {"BeanCode": "1"}
        ]),
        path: "public/uploads/20240803/6b00113e8890951736f84bea4671ea3d.png",
        goodsPath: networkConfig.getFrontendApiUrl() + "/public/uploads/20240803/6b00113e8890951736f84bea4671ea3d.png",
        language: "en"
      };
    }

    if (goodsData) {
      const goodsResult = getDb().insertOrderGoods(goodsData);
      console.log(`✅ Added new order ${orderNum} with goods ID: ${goodsResult.lastInsertRowid}`);
      return { orderId, goodsId: goodsResult.lastInsertRowid, orderNum };
    }
  }
}

module.exports = MockDataGenerator;
