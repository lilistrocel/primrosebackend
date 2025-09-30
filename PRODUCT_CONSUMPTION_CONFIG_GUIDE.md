# Product Consumption Configuration System

## Overview

The Product Consumption Configuration System allows you to define how much of each ingredient (milk, coffee beans, cups, water) each menu item consumes. The system automatically consumes from the correct ingredient type based on the order's ingredient codes.

## Key Features

### 🎯 **Smart Ingredient Mapping**
- **BeanCode1** → Coffee Beans Type 1
- **BeanCode2** → Coffee Beans Type 2  
- **MilkCode1** → Milk Type 1 (Regular)
- **MilkCode2** → Milk Type 2 (Alternative)
- **CupCode1/2** → 8oz Cups
- **CupCode3** → 12oz Cups

### 📊 **Configurable Consumption**
- **Milk Consumption**: Define ml per drink
- **Coffee Beans**: Define grams per drink
- **Cups**: Define number of cups per drink
- **Water**: Define ml per drink (optional)

### 🔄 **Automatic Processing**
- Processes when orders complete (status 5)
- Uses configured values or falls back to defaults
- Creates detailed transaction records
- Updates inventory levels in real-time

## How It Works

### 1. **Configuration Setup**
Navigate to `/inventory/consumption-config` to configure consumption for each menu item.

### 2. **Order Processing**
When an order completes:
1. System extracts ingredient codes from product `matter_codes`
2. Looks up consumption configuration for the product
3. Maps codes to correct inventory items
4. Deducts configured quantities from inventory
5. Creates transaction records

### 3. **Example Flow**

**Order**: 2x Latte with `BeanCode1,MilkCode1,CupCode3`

**Configuration**: Latte consumes 200ml milk, 18g beans, 1 cup, 50ml water

**Result**:
- ✅ 36g from Coffee Beans Type 1 (18g × 2)
- ✅ 400ml from Milk Type 1 (200ml × 2)  
- ✅ 2x 12oz Cups (1 × 2)
- ✅ 100ml from Water (50ml × 2)

## Database Schema

### `product_consumption_config` Table
```sql
CREATE TABLE product_consumption_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  milk_consumption DECIMAL(10,2) NOT NULL DEFAULT 0,
  coffee_beans_consumption DECIMAL(10,2) NOT NULL DEFAULT 0,
  cups_consumption DECIMAL(10,2) NOT NULL DEFAULT 1,
  water_consumption DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(product_id)
);
```

## API Endpoints

### Save Configuration
```
POST /api/motong/inventory/products/:productId/consumption-config
```

**Request Body:**
```json
{
  "milk_consumption": 200,
  "coffee_beans_consumption": 18,
  "cups_consumption": 1,
  "water_consumption": 50
}
```

### Get Configuration
```
GET /api/motong/inventory/products/:productId/consumption-config
```

## Frontend Interface

### Navigation
- **Inventory Dashboard** → **Consumption Config**
- Direct link: `/inventory/consumption-config`

### Features
- **Product Grid**: Shows all menu items with consumption inputs
- **Individual Save**: Save configuration for specific products
- **Bulk Save**: Save all configurations at once
- **Real-time Validation**: Input validation and error handling

## Default Consumption Values

If no configuration exists, the system uses these defaults:

### Coffee Beans
- **All drinks**: 18g (except water-only drinks)

### Milk
- **Espresso**: 0ml (no milk)
- **Americano**: 0ml (no milk)
- **Latte**: 200ml
- **Cappuccino**: 150ml
- **Cortado**: 100ml

### Cups
- **All drinks**: 1 cup per order item

### Water
- **All drinks**: 0ml (unless specifically configured)

## Integration Points

### 1. **Order Processing**
- Integrated with `editDeviceOrderStatus.js`
- Triggers when order status becomes 5 (Completed)
- Processes all items in the order

### 2. **Inventory System**
- Uses existing inventory transaction system
- Updates stock levels automatically
- Triggers low stock alerts

### 3. **Database**
- Foreign key constraints ensure data integrity
- Automatic cleanup when products are deleted
- Indexed for performance

## Usage Examples

### Example 1: Standard Latte
**Product**: Latte
**Configuration**: 200ml milk, 18g beans, 1 cup, 50ml water
**Order**: 2x Latte with `BeanCode1,MilkCode1,CupCode3`
**Result**: 36g beans + 400ml milk + 2x 12oz cups + 100ml water

### Example 2: Espresso
**Product**: Espresso  
**Configuration**: 0ml milk, 18g beans, 1 cup, 0ml water
**Order**: 1x Espresso with `BeanCode2,CupCode1`
**Result**: 18g beans + 1x 8oz cup (no milk or water)

### Example 3: Custom Drink
**Product**: Custom Coffee
**Configuration**: 300ml milk, 25g beans, 1 cup, 100ml water
**Order**: 3x Custom Coffee with `BeanCode1,MilkCode2,CupCode3`
**Result**: 75g beans + 900ml milk + 3x 12oz cups + 300ml water

## Benefits

### 🎯 **Precision Control**
- Define exact consumption for each menu item
- No more guessing or manual calculations
- Consistent inventory tracking

### 🔄 **Automation**
- Zero manual intervention required
- Automatic processing on order completion
- Real-time inventory updates

### 📊 **Flexibility**
- Easy to modify consumption values
- Supports different drink sizes and types
- Handles complex ingredient combinations

### 🚨 **Alert Integration**
- Low stock alerts based on actual consumption
- Proactive inventory management
- Prevents stockouts

## Troubleshooting

### Common Issues

1. **Foreign Key Constraint Failed**
   - Ensure product exists in database
   - Check product ID is correct

2. **No Consumption Recorded**
   - Verify product has consumption configuration
   - Check ingredient codes in matter_codes field
   - Ensure order status is 5 (Completed)

3. **Wrong Ingredient Type Consumed**
   - Verify ingredient code mapping
   - Check matter_codes format
   - Ensure inventory items exist

### Debug Steps

1. Check product consumption configuration
2. Verify ingredient codes in order
3. Confirm inventory items exist
4. Check transaction logs
5. Verify order completion status

## Future Enhancements

- **Bulk Configuration**: Import/export consumption settings
- **Recipe Management**: Link to detailed recipes
- **Seasonal Adjustments**: Time-based consumption changes
- **Analytics**: Consumption trends and insights
- **Mobile Interface**: Configure on mobile devices

---

*This system provides complete control over ingredient consumption while maintaining the flexibility to handle various drink types and ingredient combinations.*
