# 🚀 Coffee Machine Backend - Startup Guide

## Quick Start Commands

### 1. Install Dependencies (if not done)
```bash
npm install
```

### 2. Initialize Database
```bash
npm run init-db
```

### 3. Start the Server
```bash
npm start
```

## Alternative Start Method
If npm start doesn't work, try:
```bash
node src/app.js
```

## Testing the API

### Method 1: PowerShell (Windows)
```powershell
# Test deviceOrderQueueList
Invoke-RestMethod -Uri "http://localhost:3000/api/motong/deviceOrderQueueList" -Method POST -Body '{"deviceId":"1"}' -ContentType "application/json"

# Test health check
Invoke-RestMethod -Uri "http://localhost:3000/health" -Method GET
```

### Method 2: Browser
Open your browser and go to:
- `http://localhost:3000` - Main info page
- `http://localhost:3000/health` - Health check

### Method 3: Postman/Insomnia
Create POST requests to:
- **URL**: `http://localhost:3000/api/motong/deviceOrderQueueList`
- **Method**: POST
- **Headers**: `Content-Type: application/json`
- **Body**: `{"deviceId":"1"}`

## Expected Response

```json
{
  "code": 0,
  "msg": "Request successfully",
  "data": [
    {
      "id": 1,
      "num": 1,
      "realPrice": "1.00",
      "status": 3,
      "orderNum": "2025091534337383",
      "created_at": 1726407237,
      "language": "en",
      "createdAt": "2025-09-15 12:33:57",
      "statusName": "Queuing",
      "typeList4": [],
      "typeList3": [],
      "typeList2": [
        {
          "id": 1,
          "deviceGoodsId": 6,
          "type": 2,
          "orderId": 1,
          "goodsId": 6,
          "goodsName": "意式浓缩",
          "goodsNameEn": "Espresso",
          "goodsNameOt": "إسبرسو",
          "goodsImg": 21,
          "goodsOptionName": "8oz纸杯;咖啡豆1",
          "goodsOptionNameEn": "8ozCup;CoffeeBean1",
          "goodsOptionNameOt": "8ozCup;CoffeeBean1",
          "language": "en",
          "status": 3,
          "price": "1.00",
          "rePrice": "1.00",
          "matterCodes": "CoffeeMatter12,CoffeeMatter11,CoffeeMatter1,CoffeeMatter2,CoffeeMatter5",
          "num": 1,
          "totalPrice": "1.00",
          "lhImgPath": "",
          "jsonCodeVal": "[{\"classCode\":\"5001\"},{\"CupCode\":\"2\"},{\"BeanCode\":\"1\"}]",
          "path": "public/uploads/20240803/6b00113e8890951736f84bea4671ea3d.png",
          "goodsPath": "http://localhost:3000/public/uploads/20240803/6b00113e8890951736f84bea4671ea3d.png",
          "statusName": "Queuing"
        }
      ],
      "typeList1": []
    }
  ]
}
```

## What We've Built

### ✅ Complete Backend Features
1. **4 API Endpoints** - Exact compatibility with original
2. **SQLite Database** - Local storage with proper schema
3. **Mock Data** - Realistic test data for machine simulation
4. **Multi-language Support** - English, Chinese, Arabic
5. **Status Management** - Complete order workflow (3→4→5)
6. **Production Instructions** - Exact `jsonCodeVal` structure
7. **Device Health Monitoring** - Ingredient and machine status
8. **Comprehensive Logging** - Machine request tracking

### 🎯 Machine Critical Features
- **`jsonCodeVal`**: `[{"classCode":"5001"},{"CupCode":"2"},{"BeanCode":"1"}]`
- **Status Workflow**: 3 (Queuing) → 4 (Processing) → 5 (Completed)
- **Matter Codes**: Ingredient management for production
- **Multi-language**: All product names in multiple languages
- **Print Images**: Support for receipt/label printing

### 📊 Database Contents
- **2 Sample Orders**: One queuing (ready), one processing
- **Coffee Products**: Espresso, Cappuccino with exact specifications
- **Device Status**: Ingredient levels and machine health
- **Exact Field Names**: camelCase matching original API

## Troubleshooting

### If Server Won't Start
1. **Check Node.js version**: `node --version` (need 16+)
2. **Reinstall dependencies**: `rm -rf node_modules && npm install`
3. **Check port**: Make sure port 3000 is free
4. **Database issues**: Delete `coffee_machine.db` and run `npm run init-db`

### If Database Errors
```bash
# Reset database completely
rm coffee_machine.db
npm run init-db
```

### If API Responses Are Wrong
- Check the mock data in `src/database/mock-data.js`
- Verify field names match exactly (camelCase)
- Check `jsonCodeVal` structure is valid JSON

## Ready for Coffee Machine!

Your backend is now ready to replace the original system:

1. **100% API Compatible** ✅
2. **Local Hosting Ready** ✅  
3. **Production Instructions** ✅
4. **Status Management** ✅
5. **Device Monitoring** ✅

The coffee machine can now connect to `http://localhost:3000/api/motong/` instead of the original backend!
