# Virtual Inventory System Guide

## Overview

The Virtual Inventory System provides comprehensive inventory tracking for your coffee machine operation. It automatically tracks ingredient consumption, manages stock levels, and provides alerts when inventory runs low.

## Features

### 🏪 Inventory Management
- **Real-time Stock Tracking**: Monitor current stock levels for all ingredients
- **Multi-category Support**: Track cups, milk, coffee beans, and water separately
- **Automatic Consumption**: Automatically deduct ingredients when orders are completed
- **Stock Adjustments**: Manual top-ups and adjustments with full transaction history

### 📊 Dashboard & Analytics
- **Visual Dashboard**: Real-time overview of inventory status across all categories
- **Stock Level Indicators**: Color-coded bars showing stock levels (green/yellow/red)
- **Recent Transactions**: Track all inventory movements
- **Low Stock Alerts**: Automatic notifications when items fall below thresholds

### 🔔 Alert System
- **Low Stock Alerts**: Notifications when inventory drops below minimum thresholds
- **Out of Stock Warnings**: Immediate alerts when items are completely depleted
- **Overstock Notifications**: Alerts when inventory exceeds 90% of maximum capacity
- **Alert Management**: Mark alerts as resolved and track alert history

## System Components

### Database Schema

#### Inventory Items (`inventory_items`)
- Tracks all inventory items with their properties
- Categories: cups, milk, coffee_beans, water
- Units: ml, cups, grams, etc.
- Stock levels: current, max, min threshold
- Cost tracking and supplier information

#### Inventory Transactions (`inventory_transactions`)
- Records all stock movements
- Types: top_up, order_consumption, adjustment, waste
- Links to orders and manual operations
- Full audit trail with timestamps

#### Product Ingredients (`product_ingredients`)
- Maps products to their ingredient requirements
- Defines quantity per unit for each ingredient
- Supports optional ingredients
- Enables automatic consumption calculation

#### Inventory Alerts (`inventory_alerts`)
- Tracks all inventory-related alerts
- Types: low_stock, out_of_stock, overstock
- Resolution tracking
- Alert history

### API Endpoints

#### Inventory Items
- `GET /api/motong/inventory/items` - List all inventory items
- `POST /api/motong/inventory/items` - Create new inventory item
- `PUT /api/motong/inventory/items/:id` - Update inventory item
- `DELETE /api/motong/inventory/items/:id` - Delete inventory item

#### Transactions
- `GET /api/motong/inventory/transactions` - List transactions
- `POST /api/motong/inventory/transactions` - Create transaction

#### Product Ingredients
- `GET /api/motong/inventory/products/:productId/ingredients` - Get product ingredients
- `POST /api/motong/inventory/products/:productId/ingredients` - Set product ingredients

#### Dashboard
- `GET /api/motong/inventory/dashboard` - Get dashboard data
- `GET /api/motong/inventory/alerts` - Get alerts
- `POST /api/motong/inventory/alerts/:alertId/resolve` - Resolve alert

## Setup Instructions

### 1. Initial Setup
The inventory system is automatically initialized when the backend starts. Default inventory items are created:

- **8oz Cups**: 100 units (max: 500, min: 50)
- **12oz Cups**: 100 units (max: 500, min: 50)
- **Milk Type 1**: 2000ml (max: 5000ml, min: 600ml)
- **Milk Type 2**: 1500ml (max: 4000ml, min: 500ml)
- **Coffee Beans Type 1**: 2000g (max: 5000g, min: 500g)
- **Coffee Beans Type 2**: 1800g (max: 5000g, min: 500g)
- **Water**: 10000ml (max: 20000ml, min: 2000ml)

### 2. Configure Product Ingredients
Run the setup script to map products to their ingredient requirements:

```bash
node setup-product-ingredients.js
```

This script automatically configures ingredient requirements for common coffee products:
- **Latte**: 18g coffee beans, 200ml milk, 1x 12oz cup
- **Cappuccino**: 18g coffee beans, 150ml milk, 1x 12oz cup
- **Americano**: 18g coffee beans, 200ml water, 1x 12oz cup
- **Espresso**: 18g coffee beans, 1x 8oz cup
- **Cortado**: 18g coffee beans, 100ml milk, 1x 8oz cup

### 3. Access the Dashboard
Navigate to `/inventory` in your admin interface to access the inventory dashboard.

## Usage Guide

### Managing Inventory Items

#### Adding New Items
1. Go to Inventory Management (`/inventory/management`)
2. Click "Add Item"
3. Fill in the required information:
   - **Name**: Unique identifier (e.g., `milk_3`)
   - **Display Name**: Human-readable name (e.g., `Oat Milk`)
   - **Category**: Select from cups, milk, coffee_beans, water
   - **Unit**: Measurement unit (ml, cups, grams, etc.)
   - **Current Stock**: Initial stock level
   - **Max Stock**: Maximum capacity
   - **Min Threshold**: Alert threshold
   - **Cost Per Unit**: Cost tracking (optional)
   - **Supplier**: Supplier information (optional)

#### Updating Stock Levels
1. Go to Inventory Management
2. Click "Edit" on the item you want to update
3. Modify the current stock level
4. Save changes

#### Manual Stock Adjustments
1. Go to Inventory Management
2. Click "Add Transaction"
3. Select transaction type:
   - **Top Up**: Adding stock
   - **Adjustment**: Manual correction
   - **Waste**: Stock loss
4. Enter quantity and notes
5. Save transaction

### Monitoring Inventory

#### Dashboard Overview
The inventory dashboard (`/inventory`) provides:
- **Category Summary**: Total items, stock levels, alerts per category
- **Low Stock Items**: Items below threshold with visual indicators
- **Active Alerts**: Current alerts requiring attention
- **Recent Transactions**: Latest inventory movements

#### Stock Level Indicators
- 🟢 **Green**: Stock above 50% of maximum
- 🟡 **Yellow**: Stock between 20-50% of maximum
- 🔴 **Red**: Stock below 20% of maximum or below minimum threshold

#### Alert Management
- **Low Stock**: Item below minimum threshold
- **Out of Stock**: Item completely depleted
- **Overstock**: Item above 90% of maximum capacity
- **Resolve Alerts**: Mark alerts as resolved when restocked

### Automatic Consumption Tracking

The system automatically tracks ingredient consumption when orders are completed:

1. **Order Processing**: When an order status changes to "Completed" (status 5)
2. **Ingredient Calculation**: System calculates required ingredients based on product configuration
3. **Stock Deduction**: Automatically deducts ingredients from inventory
4. **Transaction Recording**: Creates consumption transactions with order references
5. **Alert Generation**: Checks for low stock and generates alerts if needed

### Example: Latte Order
When a latte order is completed:
1. System looks up latte product ingredients (18g coffee beans, 200ml milk, 1x 12oz cup)
2. Deducts these amounts from inventory
3. Creates consumption transaction: "Consumed for Latte (Order #123)"
4. Updates stock levels
5. Checks if any items are now below threshold
6. Generates alerts if needed

## Configuration Examples

### Setting Up a New Product
1. **Create Product**: Add product in Item Management
2. **Configure Ingredients**: Set up ingredient requirements
3. **Test Order**: Place test order to verify consumption tracking

### Customizing Thresholds
1. **Edit Item**: Go to inventory item
2. **Update Thresholds**: Modify min_threshold and max_stock
3. **Save Changes**: Thresholds take effect immediately

### Adding New Ingredient Types
1. **Create Item**: Add new inventory item
2. **Set Category**: Choose appropriate category
3. **Configure Units**: Set measurement unit
4. **Update Products**: Add ingredient to product requirements

## Troubleshooting

### Common Issues

#### Inventory Not Updating
- Check if product ingredients are configured
- Verify order status is changing to "Completed"
- Check database connection and inventory system initialization

#### Alerts Not Generating
- Verify min_threshold is set correctly
- Check if alerts are being resolved
- Ensure stock levels are being updated

#### Dashboard Not Loading
- Check API endpoints are accessible
- Verify database migrations completed
- Check browser console for errors

### Debug Information
- Check server logs for inventory processing messages
- Verify transaction records in database
- Test API endpoints directly

## API Reference

### Inventory Items
```javascript
// Get all items
GET /api/motong/inventory/items

// Create item
POST /api/motong/inventory/items
{
  "name": "milk_3",
  "display_name": "Oat Milk",
  "category": "milk",
  "unit": "ml",
  "current_stock": 1000,
  "max_stock": 3000,
  "min_threshold": 300
}

// Update item
PUT /api/motong/inventory/items/1
{
  "current_stock": 1500
}
```

### Transactions
```javascript
// Create transaction
POST /api/motong/inventory/transactions
{
  "item_id": 1,
  "transaction_type": "top_up",
  "quantity": 500,
  "notes": "Weekly restock"
}
```

### Product Ingredients
```javascript
// Set product ingredients
POST /api/motong/inventory/products/1/ingredients
{
  "ingredients": [
    {
      "ingredient_id": 1,
      "quantity_per_unit": 18,
      "unit": "grams",
      "is_optional": false
    }
  ]
}
```

## Best Practices

### Inventory Management
1. **Regular Monitoring**: Check dashboard daily
2. **Set Realistic Thresholds**: Base on actual usage patterns
3. **Track Costs**: Use cost tracking for profitability analysis
4. **Supplier Management**: Record supplier information for reordering

### Alert Management
1. **Respond Quickly**: Address low stock alerts promptly
2. **Resolve Alerts**: Mark alerts as resolved when restocked
3. **Review Patterns**: Analyze alert frequency to optimize thresholds

### Data Maintenance
1. **Regular Backups**: Backup inventory data regularly
2. **Transaction History**: Keep transaction records for auditing
3. **Performance Monitoring**: Monitor system performance with large datasets

## Support

For technical support or questions about the inventory system:
1. Check server logs for error messages
2. Verify database connectivity
3. Test API endpoints
4. Review configuration settings

The inventory system is designed to be robust and self-maintaining, but proper configuration and monitoring are essential for optimal performance.
