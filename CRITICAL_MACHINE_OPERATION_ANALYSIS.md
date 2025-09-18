# Critical Machine Operation Analysis

## Machine Decision-Making Process

Based on the real API response, here's how the coffee machine operates:

### 1. Continuous Polling Cycle
```
Machine → GET deviceOrderQueueList → Parse Response → Make Decision → Update Status → Repeat
```

### 2. Critical Field Analysis

#### `jsonCodeVal` - Production Instructions (MOST CRITICAL)
```json
"jsonCodeVal": "[{\"classCode\":\"5001\"},{\"CupCode\":\"2\"},{\"BeanCode\":\"1\"}]"
```

**Structure Breakdown:**
- **`classCode`**: Primary product identifier
  - `"5001"` = Espresso (specific recipe/product)
  - This is the master key that determines what the machine produces
- **`CupCode`**: Container specification
  - `"2"` = 8oz paper cup (affects portion size and dispensing)
- **`BeanCode`**: Ingredient variant
  - `"1"` = CoffeeBean1 (specific bean type/blend)

**Machine Logic:**
1. Machine parses `jsonCodeVal` to extract production parameters
2. Uses `classCode` to select the correct recipe/program
3. Uses `CupCode` to determine portion size and cup type
4. Uses `BeanCode` to select ingredient source

#### `status` - Order State Monitoring
```json
"status": 4  // "Processing"
```

**Status Flow:**
- `3`: "Queuing" (待制作) - Order ready for production
- `4`: "Processing" (制作中) - Machine actively working
- `5`: "Completed" (已完成) - Order finished, remove from queue

**Machine Behavior:**
- Polls for orders with `status: 3` (new orders to start)
- Updates orders to `status: 4` when production begins
- Updates orders to `status: 5` when production completes

#### `matterCodes` - Ingredient Requirements
```json
"matterCodes": "CoffeeMatter12,CoffeeMatter11,CoffeeMatter1,CoffeeMatter2,CoffeeMatter5"
```

**Purpose:**
- Defines required ingredients for the specific order
- Machine checks ingredient availability before starting production
- Links to `saveDeviceMatter` endpoint for inventory tracking

#### `lhImgPath` - Printer Integration
```json
"lhImgPath": ""  // Empty in this example
```

**When populated:**
- Machine downloads image from this path
- Prints receipt/label for the order
- Critical for order identification and customer pickup

### 3. Machine Operation Flow

#### Step 1: Order Detection
```javascript
// Machine polls every X seconds
const response = await fetch('/deviceOrderQueueList', {
  method: 'POST',
  body: JSON.stringify({"deviceId": "1"})
});

const orders = response.data;
const pendingOrders = orders.filter(order => order.status === 3); // Queuing
```

#### Step 2: Production Decision
```javascript
// For each pending order
pendingOrders.forEach(order => {
  order.typeList2.forEach(item => {  // Coffee items
    const instructions = JSON.parse(item.jsonCodeVal);
    const classCode = instructions.find(i => i.classCode).classCode;
    const cupCode = instructions.find(i => i.CupCode).CupCode;
    const beanCode = instructions.find(i => i.BeanCode).BeanCode;
    
    // Machine uses these codes to configure production
    machine.selectRecipe(classCode);      // "5001" -> Espresso recipe
    machine.setCupSize(cupCode);          // "2" -> 8oz cup
    machine.selectBeans(beanCode);        // "1" -> CoffeeBean1
  });
});
```

#### Step 3: Status Updates
```javascript
// Start production
await updateOrderStatus(orderId, goodsId, 4); // "Processing"

// Complete production
await updateOrderStatus(orderId, goodsId, 5); // "Completed"
```

### 4. Critical Compatibility Requirements

#### JSON Structure Exactness
The `jsonCodeVal` parsing is extremely sensitive:
- **MUST** be valid JSON string
- **MUST** contain array of objects
- **MUST** include `classCode` for product identification
- Additional codes (`CupCode`, `BeanCode`) **MUST** be preserved

#### Field Presence Requirements
```json
{
  "status": 4,                    // REQUIRED - Machine decision logic
  "jsonCodeVal": "[...]",         // REQUIRED - Production instructions
  "orderId": 933,                 // REQUIRED - For status updates
  "id": 1048,                     // REQUIRED - For status updates (goodsId)
  "matterCodes": "...",           // REQUIRED - Ingredient validation
  "lhImgPath": "",                // REQUIRED - Even if empty
  "typeList2": [...],             // REQUIRED - Coffee items container
  "goodsName": "意式浓缩",         // REQUIRED - Display/logging
  "goodsNameEn": "Espresso"       // REQUIRED - Multi-language support
}
```

### 5. Database Schema Implications

#### Critical Tables
```sql
-- Orders table must preserve exact status workflow
CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    status INTEGER NOT NULL,      -- 3,4,5 workflow critical
    device_id INTEGER NOT NULL,
    order_num VARCHAR(50) UNIQUE,
    -- ... other fields
);

-- Order goods must preserve jsonCodeVal exactly
CREATE TABLE order_goods (
    id INTEGER PRIMARY KEY,
    order_id INTEGER,
    json_code_val TEXT NOT NULL,  -- CRITICAL: Exact JSON preservation
    matter_codes TEXT,            -- Comma-separated ingredient codes
    lh_img_path VARCHAR(255),     -- Printer image path
    goods_name VARCHAR(100),      -- Chinese name
    goods_name_en VARCHAR(100),   -- English name
    goods_name_ot VARCHAR(100),   -- Other language
    language VARCHAR(10),         -- Current language setting
    type INTEGER,                 -- Product category (2 = coffee)
    status INTEGER,               -- Item-level status
    -- ... other fields
);
```

### 6. Migration Risk Assessment

#### HIGHEST RISK AREAS:
1. **`jsonCodeVal` Structure**: Any change breaks production logic
2. **Status Workflow**: Incorrect status transitions stop machine operation
3. **Field Naming**: Machine expects exact field names (camelCase sensitive)
4. **Type Classification**: `typeList2` must contain coffee items exactly

#### ZERO-TOLERANCE FIELDS:
- `jsonCodeVal` - Must be identical JSON structure
- `status` - Must follow exact 3→4→5 workflow
- `orderId` + `id` - Must be consistent for status updates
- `matterCodes` - Must match ingredient system exactly

### 7. Validation Priority

#### Level 1 (CRITICAL): Machine Operation
- `jsonCodeVal` parsing and structure
- Status workflow (3→4→5)
- Order ID consistency
- Required field presence

#### Level 2 (HIGH): Production Quality
- `matterCodes` accuracy
- Multi-language field consistency
- Image path handling

#### Level 3 (MEDIUM): User Experience
- Display names and formatting
- Timestamp accuracy
- Price calculations

This analysis shows that the machine is essentially a JSON-driven production system that relies heavily on structured data for decision-making. Any deviation in critical fields will break the production workflow.
