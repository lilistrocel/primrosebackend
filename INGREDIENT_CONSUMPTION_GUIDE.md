# Ingredient Code Consumption System

## Overview

The Ingredient Code Consumption System automatically tracks inventory consumption based on ingredient codes specified in product matter codes. When an order is completed, the system parses the ingredient codes and deducts the appropriate amounts from the correct inventory items.

## How It Works

### 1. Ingredient Code Mapping

The system maps ingredient codes to specific inventory items:

| Code | Inventory Item | Description |
|------|----------------|-------------|
| `BeanCode1` | Coffee Beans Type 1 | Regular coffee beans |
| `BeanCode2` | Coffee Beans Type 2 | Alternative coffee beans |
| `MilkCode1` | Milk Type 1 (Regular) | Regular milk |
| `MilkCode2` | Milk Type 2 (Alternative) | Alternative milk (oat, almond, etc.) |
| `CupCode1` | 8oz Cups | Small cups |
| `CupCode2` | 8oz Cups | Small cups (alternative mapping) |
| `CupCode3` | 12oz Cups | Large cups |

### 2. Consumption Quantities

The system automatically determines consumption quantities based on product type:

#### Coffee Bean Consumption (in grams)
- **Espresso**: 18g
- **Americano**: 18g  
- **Latte**: 18g
- **Cappuccino**: 18g
- **Cortado**: 18g
- **Default**: 18g

#### Milk Consumption (in ml)
- **Espresso**: 0ml (no milk)
- **Americano**: 0ml (no milk)
- **Latte**: 200ml
- **Cappuccino**: 150ml
- **Cortado**: 100ml
- **Default**: 200ml

#### Cup Consumption
- **1 cup per order item** (regardless of product type)

### 3. Order Processing Flow

1. **Order Completion**: When an order status changes to "Completed" (status 5)
2. **Code Parsing**: System extracts ingredient codes from product `matter_codes`
3. **Item Mapping**: Maps codes to specific inventory items
4. **Quantity Calculation**: Determines consumption amounts based on product type
5. **Stock Deduction**: Automatically deducts from correct inventory items
6. **Transaction Recording**: Creates consumption transactions with full audit trail

## Example Scenarios

### Scenario 1: Latte Order
**Order Details:**
- Product: Latte
- Matter Codes: `BeanCode1,MilkCode1,CupCode3`
- Quantity: 1

**Consumption:**
- ✅ 18g from Coffee Beans Type 1
- ✅ 200ml from Milk Type 1 (Regular)
- ✅ 1x 12oz Cup

### Scenario 2: Espresso Order
**Order Details:**
- Product: Espresso
- Matter Codes: `BeanCode2,CupCode2`
- Quantity: 1

**Consumption:**
- ✅ 18g from Coffee Beans Type 2
- ✅ 1x 8oz Cup
- ❌ No milk (espresso doesn't use milk)

### Scenario 3: Cappuccino Order (Multiple)
**Order Details:**
- Product: Cappuccino
- Matter Codes: `BeanCode1,MilkCode2,CupCode3`
- Quantity: 2

**Consumption:**
- ✅ 36g from Coffee Beans Type 1 (18g × 2)
- ✅ 300ml from Milk Type 2 (150ml × 2)
- ✅ 2x 12oz Cups

## Implementation Details

### Database Integration

The system integrates with the existing order processing:

```javascript
// In editDeviceOrderStatus.js
if (status === 5) { // Order completed
  processInventoryConsumption(orderId);
}
```

### Code Parsing Logic

```javascript
parseMatterCodes(matterCodes) {
  const codes = {};
  const codeArray = matterCodes.split(',').map(code => code.trim());
  
  codeArray.forEach(code => {
    if (code.includes('BeanCode')) {
      codes.beanCode = code.replace('BeanCode', '').trim();
    } else if (code.includes('MilkCode')) {
      codes.milkCode = code.replace('MilkCode', '').trim();
    } else if (code.includes('CupCode')) {
      codes.cupCode = code.replace('CupCode', '').trim();
    }
  });
  
  return codes;
}
```

### Consumption Processing

```javascript
processConsumptionByCodes(orderItem, ingredientCodes, orderId) {
  // Map codes to inventory items
  const itemMapping = {
    'BeanCode1': 'coffee_beans_1',
    'BeanCode2': 'coffee_beans_2',
    'MilkCode1': 'milk_1',
    'MilkCode2': 'milk_2',
    'CupCode1': 'cup_8oz',
    'CupCode2': 'cup_8oz',
    'CupCode3': 'cup_12oz'
  };
  
  // Process each ingredient type
  // ... consumption logic
}
```

## Configuration

### Setting Up Product Matter Codes

Products should have their `matter_codes` field configured with the appropriate ingredient codes:

```sql
-- Example product configurations
UPDATE products SET matter_codes = 'BeanCode1,MilkCode1,CupCode3' WHERE goods_name_en = 'Latte';
UPDATE products SET matter_codes = 'BeanCode2,CupCode2' WHERE goods_name_en = 'Espresso';
UPDATE products SET matter_codes = 'BeanCode1,MilkCode2,CupCode3' WHERE goods_name_en = 'Cappuccino';
```

### Customizing Consumption Quantities

To modify consumption quantities, update the methods in `inventory-db.js`:

```javascript
getBeanConsumptionQuantity(productName) {
  const name = productName.toLowerCase();
  
  if (name.includes('espresso')) return 18;
  if (name.includes('latte')) return 20; // Custom quantity
  // ... other products
  
  return 18; // Default
}
```

## Monitoring and Debugging

### Console Logging

The system provides detailed console logging for debugging:

```
🔄 Processing consumption for Latte
📦 Order item matter_codes: BeanCode1,MilkCode1,CupCode3
🔍 Parsed ingredient codes: { beanCode: '1', milkCode: '1', cupCode: '3' }
✅ Bean consumption: 18g of Coffee Beans Type 1
✅ Milk consumption: 200ml of Milk Type 1 (Regular)
✅ Cup consumption: 1 of 12oz Cups
```

### Transaction History

All consumption is recorded in the `inventory_transactions` table:

```sql
SELECT * FROM inventory_transactions 
WHERE transaction_type = 'order_consumption' 
ORDER BY created_at DESC;
```

### Inventory Dashboard

Monitor consumption through the inventory dashboard at `/inventory`:
- Real-time stock levels
- Recent transactions
- Low stock alerts
- Consumption patterns

## Testing

Run the test script to verify the system:

```bash
node test-ingredient-consumption.js
```

This will test various order scenarios and show expected consumption patterns.

## Troubleshooting

### Common Issues

1. **No Consumption Recorded**
   - Check if product `matter_codes` are properly configured
   - Verify ingredient codes match the mapping table
   - Ensure order status changes to "Completed" (status 5)

2. **Wrong Inventory Items**
   - Verify ingredient code mapping in `itemMapping` object
   - Check inventory item names match exactly

3. **Incorrect Quantities**
   - Review consumption quantity methods
   - Check product name matching logic

### Debug Steps

1. **Check Order Data**:
   ```sql
   SELECT og.*, p.matter_codes, p.goods_name_en 
   FROM order_goods og 
   JOIN products p ON og.goods_id = p.goods_id 
   WHERE og.order_id = [ORDER_ID];
   ```

2. **Verify Inventory Items**:
   ```sql
   SELECT * FROM inventory_items WHERE is_active = 1;
   ```

3. **Check Transactions**:
   ```sql
   SELECT * FROM inventory_transactions 
   WHERE reference_id = [ORDER_ID];
   ```

## Benefits

### Automatic Tracking
- No manual intervention required
- Real-time inventory updates
- Accurate consumption records

### Flexible Configuration
- Easy to modify consumption quantities
- Support for multiple ingredient types
- Configurable ingredient code mapping

### Full Audit Trail
- Complete transaction history
- Order reference tracking
- Detailed consumption notes

### Integration Ready
- Seamless integration with existing order system
- Compatible with current database schema
- Minimal code changes required

The Ingredient Code Consumption System provides a robust, automated solution for tracking inventory consumption based on order specifications, ensuring accurate stock management and comprehensive audit trails.
