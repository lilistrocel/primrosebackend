# Critical Validation Tests for Machine Compatibility

## Priority 1: Production-Critical Tests

### Test 1: jsonCodeVal Structure Validation
```javascript
// Test: Ensure jsonCodeVal is valid JSON and contains required codes
const validateJsonCodeVal = (jsonCodeVal) => {
  try {
    const parsed = JSON.parse(jsonCodeVal);
    
    // Must be array
    if (!Array.isArray(parsed)) return false;
    
    // Must contain classCode (primary product identifier)
    const hasClassCode = parsed.some(item => item.classCode);
    if (!hasClassCode) return false;
    
    // Should contain production parameters
    const hasCupCode = parsed.some(item => item.CupCode);
    const hasBeanCode = parsed.some(item => item.BeanCode);
    
    return { valid: true, hasClassCode, hasCupCode, hasBeanCode };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

// Test cases
const testCases = [
  {
    name: "Valid Espresso Order",
    input: "[{\"classCode\":\"5001\"},{\"CupCode\":\"2\"},{\"BeanCode\":\"1\"}]",
    expected: { valid: true, hasClassCode: true, hasCupCode: true, hasBeanCode: true }
  },
  {
    name: "Minimal Valid Structure",
    input: "[{\"classCode\":\"5001\"}]",
    expected: { valid: true, hasClassCode: true }
  },
  {
    name: "Invalid JSON",
    input: "[{\"classCode\":\"5001\"}",
    expected: { valid: false }
  }
];
```

### Test 2: Status Workflow Validation
```javascript
// Test: Ensure status transitions follow machine workflow
const validateStatusWorkflow = (currentStatus, newStatus) => {
  const validTransitions = {
    3: [4],     // Queuing -> Processing
    4: [5, -1], // Processing -> Completed or Cancelled
    5: [],      // Completed (terminal state)
    2: [3]      // Paid -> Queuing
  };
  
  return validTransitions[currentStatus]?.includes(newStatus) || false;
};

// Test cases for order status updates
const statusTests = [
  { current: 3, new: 4, valid: true, description: "Start production" },
  { current: 4, new: 5, valid: true, description: "Complete order" },
  { current: 3, new: 5, valid: false, description: "Skip processing (invalid)" },
  { current: 5, new: 4, valid: false, description: "Reverse completion (invalid)" }
];
```

### Test 3: Order ID Consistency Check
```javascript
// Test: Ensure orderId from queue list matches editOrderStatus calls
const validateOrderIdConsistency = (queueResponse, statusUpdateCall) => {
  const queueOrders = queueResponse.data;
  const { orderId, orderGoodsId } = statusUpdateCall;
  
  // Find order in queue
  const order = queueOrders.find(o => o.id === orderId);
  if (!order) return { valid: false, error: "Order not found in queue" };
  
  // Find goods item in order
  const allItems = [
    ...order.typeList1,
    ...order.typeList2,
    ...order.typeList3,
    ...order.typeList4
  ];
  
  const goodsItem = allItems.find(item => item.id === orderGoodsId);
  if (!goodsItem) return { valid: false, error: "Goods item not found" };
  
  return { valid: true, order, goodsItem };
};
```

## Priority 2: Machine Operation Tests

### Test 4: Matter Codes Format Validation
```javascript
// Test: Validate ingredient codes format
const validateMatterCodes = (matterCodes) => {
  if (!matterCodes) return { valid: true, codes: [] }; // Empty is valid
  
  // Should be comma-separated list
  const codes = matterCodes.split(',').map(code => code.trim());
  
  // Validate format (should match pattern like "CoffeeMatter12")
  const validPattern = /^[A-Za-z]+Matter\d+$/;
  const invalidCodes = codes.filter(code => !validPattern.test(code));
  
  return {
    valid: invalidCodes.length === 0,
    codes,
    invalidCodes
  };
};

// Test cases
const matterCodesTests = [
  {
    input: "CoffeeMatter12,CoffeeMatter11,CoffeeMatter1,CoffeeMatter2,CoffeeMatter5",
    expected: { valid: true, count: 5 }
  },
  {
    input: "",
    expected: { valid: true, count: 0 }
  },
  {
    input: "InvalidCode,CoffeeMatter1",
    expected: { valid: false }
  }
];
```

### Test 5: TypeList Structure Validation
```javascript
// Test: Ensure typeList arrays contain correct product categories
const validateTypeListStructure = (order) => {
  const { typeList1, typeList2, typeList3, typeList4 } = order;
  
  // All should be arrays
  const allAreLists = [typeList1, typeList2, typeList3, typeList4]
    .every(list => Array.isArray(list));
  
  if (!allAreLists) return { valid: false, error: "TypeLists must be arrays" };
  
  // Validate items in each list have correct type field
  const validateListType = (list, expectedType) => {
    return list.every(item => item.type === expectedType);
  };
  
  return {
    valid: true,
    typeList1Valid: validateListType(typeList1, 1), // 奶茶
    typeList2Valid: validateListType(typeList2, 2), // 咖啡
    typeList3Valid: validateListType(typeList3, 3), // 冰淇淋
    typeList4Valid: validateListType(typeList4, 4)  // 其他
  };
};
```

## Priority 3: Field Presence Tests

### Test 6: Multi-language Field Validation
```javascript
// Test: Ensure all language variants are present
const validateMultiLanguageFields = (item) => {
  const requiredFields = [
    'goodsName',      // Chinese
    'goodsNameEn',    // English
    'goodsNameOt',    // Other language
    'language'        // Current language setting
  ];
  
  const missingFields = requiredFields.filter(field => !item.hasOwnProperty(field));
  
  return {
    valid: missingFields.length === 0,
    missingFields,
    currentLanguage: item.language
  };
};
```

### Test 7: Required Field Presence Check
```javascript
// Test: Ensure all machine-critical fields are present
const validateRequiredFields = (orderItem) => {
  const criticalFields = [
    'id',             // For status updates
    'orderId',        // For order reference
    'status',         // For machine decision
    'jsonCodeVal',    // For production instructions
    'matterCodes',    // For ingredients
    'lhImgPath',      // For printing (can be empty)
    'goodsName',      // For display
    'type'            // For categorization
  ];
  
  const missingFields = criticalFields.filter(field => 
    !orderItem.hasOwnProperty(field)
  );
  
  return {
    valid: missingFields.length === 0,
    missingFields,
    presentFields: Object.keys(orderItem)
  };
};
```

## Automated Test Suite

### Complete Validation Pipeline
```javascript
class MachineCompatibilityValidator {
  async validateCompleteResponse(originalResponse, newResponse) {
    const results = {
      critical: [],
      high: [],
      medium: [],
      overall: { compatible: true, errors: [] }
    };
    
    // Critical tests
    results.critical.push(
      this.validateJsonCodeValStructure(originalResponse, newResponse),
      this.validateStatusWorkflow(originalResponse, newResponse),
      this.validateOrderIdConsistency(originalResponse, newResponse)
    );
    
    // High priority tests
    results.high.push(
      this.validateMatterCodes(originalResponse, newResponse),
      this.validateTypeListStructure(originalResponse, newResponse)
    );
    
    // Medium priority tests
    results.medium.push(
      this.validateFieldPresence(originalResponse, newResponse),
      this.validateMultiLanguageSupport(originalResponse, newResponse)
    );
    
    // Calculate overall compatibility
    const criticalFailures = results.critical.filter(r => !r.valid);
    if (criticalFailures.length > 0) {
      results.overall.compatible = false;
      results.overall.errors = criticalFailures.map(f => f.error);
    }
    
    return results;
  }
}
```

## Test Execution Strategy

### 1. Pre-deployment Testing
- Run all tests against original backend
- Establish baseline responses
- Document all edge cases

### 2. Development Testing
- Test each endpoint individually
- Validate field-by-field compatibility
- Test error scenarios

### 3. Integration Testing
- Full workflow testing (queue → status update)
- Multi-order scenarios
- Concurrent access testing

### 4. Production Validation
- Side-by-side comparison during migration
- Real-time compatibility monitoring
- Immediate rollback triggers

This comprehensive testing strategy ensures the coffee machine will operate identically with the new backend, preventing any production disruptions.
