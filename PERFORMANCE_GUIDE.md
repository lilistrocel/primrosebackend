# Coffee Machine Backend - Performance & Optimization Guide

## 🚀 Quick Start

### 1. Clean Development Mode (Minimal Logging)

For a clean development experience without message flooding:

```bash
# Windows
npm run dev:cleaned

# Or direct backend only
npm run dev:clean
npm run start:clean
```

This mode:
- ✅ Minimal console output
- ✅ Only logs machine traffic
- ✅ No verbose debugging
- ✅ Production-like performance
- ✅ Clean, readable logs

### 2. Performance Check

Run comprehensive performance tests:

```bash
npm run performance
```

This will test:
- API response times
- Database query performance
- Memory usage
- CPU usage
- Request throughput
- Load testing (1, 5, 10, 20 concurrent requests)

**Expected Results:**
- Health Check: < 10ms
- Order Queue List: < 50ms
- Products List: < 30ms
- Categories List: < 20ms

### 3. Memory Efficiency Audit

Check for memory leaks and inefficiencies:

```bash
npm run memory:audit
```

This analyzes:
- Unused dependencies
- Memory leak patterns
- Route efficiency
- Database query optimization
- File sizes
- Code quality

---

## 📊 Performance Benchmarks

### Optimal Performance Targets

| Endpoint | Target | Warning | Critical |
|----------|--------|---------|----------|
| Health Check | < 10ms | 50ms | 100ms |
| Order Queue | < 50ms | 100ms | 200ms |
| Products List | < 30ms | 80ms | 150ms |
| Create Order | < 100ms | 200ms | 500ms |
| Device Status | < 40ms | 100ms | 200ms |

### Memory Usage Guidelines

- **Heap Used**: Should stay under 80% of heap total
- **Growth Rate**: < 100KB per request
- **RSS**: < 200MB for typical operation

---

## 🔧 Optimization Strategies

### 1. Logging Optimization

**Problem:** Verbose logging floods console and impacts performance

**Solution:**
- Use `src/app.production.js` for production/clean development
- Only log critical events (errors, machine traffic)
- Remove debug logging from routes

**Before:**
```javascript
// Logs EVERYTHING
console.log('📥 Payload:', JSON.stringify(req.body, null, 2));
console.log('📋 All Headers:', JSON.stringify(req.headers, null, 2));
```

**After:**
```javascript
// Only log machine traffic
if (isMachine) {
  console.log(`[${timestamp}] 🤖 Machine: ${req.method} ${req.path}`);
}
```

### 2. Database Optimization

**Best Practices:**
- Use prepared statements (already implemented ✅)
- Add indexes on frequently queried columns (implemented ✅)
- Avoid N+1 queries
- Use transactions for batch operations

**Example:**
```javascript
// Good: Single query with JOIN
const orders = db.getAllOrdersWithItems();

// Bad: N+1 query
const orders = db.getAllOrders();
orders.forEach(order => {
  order.items = db.getItemsByOrderId(order.id); // N queries!
});
```

### 3. Memory Management

**Avoid Memory Leaks:**
- Clean up event listeners
- Clear intervals/timeouts
- Avoid global variables
- Use weak references for caches

**Example:**
```javascript
// Good: Clean up
const interval = setInterval(pollMachine, 5000);
process.on('exit', () => clearInterval(interval));

// Bad: Never cleaned up
setInterval(pollMachine, 5000);
```

### 4. Route Efficiency

**Consolidate Routes:**
```javascript
// Instead of registering each route separately:
this.app.use('/api/motong', productsRoute);
this.app.use('/api/motong', categoriesRoute);
// ... 20 more times

// Consider: Single router with all endpoints
const motongRouter = express.Router();
motongRouter.use(productsRoute);
motongRouter.use(categoriesRoute);
this.app.use('/api/motong', motongRouter);
```

### 5. Caching Strategy

**Implement Caching for Static Data:**
```javascript
// Cache categories (rarely change)
let categoriesCache = null;
let cacheTime = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCategories() {
  if (categoriesCache && Date.now() - cacheTime < CACHE_TTL) {
    return categoriesCache;
  }
  
  categoriesCache = db.getAllCategories();
  cacheTime = Date.now();
  return categoriesCache;
}
```

---

## 🎯 Development Modes Comparison

### Debug Mode (Verbose)
```bash
npm run dev:debug
```
- ✅ Full logging
- ✅ Request/response details
- ✅ Network traffic analysis
- ❌ Console flooding
- ❌ Slower performance
- **Use When:** Debugging machine communication issues

### Normal Mode
```bash
npm run dev:full
```
- ✅ Standard logging
- ✅ Machine traffic logs
- ✅ Error logging
- ⚠️ Moderate console output
- **Use When:** General development

### Production Mode (Recommended)
```bash
npm run dev:cleaned
```
- ✅ Minimal logging
- ✅ Fast performance
- ✅ Clean console
- ✅ Machine traffic only
- **Use When:** Daily development, demos, testing

---

## 📈 Performance Monitoring

### Real-time Monitoring

**Monitor Memory Usage:**
```bash
# While system is running
node -e "setInterval(() => { const used = process.memoryUsage(); console.log('Heap:', Math.round(used.heapUsed/1024/1024) + 'MB'); }, 5000)"
```

**Monitor API Performance:**
```bash
# Use the built-in performance check
npm run performance
```

### Production Monitoring Tools

**Recommended Tools:**
- **PM2**: Process manager with built-in monitoring
- **New Relic**: APM for Node.js
- **DataDog**: Infrastructure monitoring
- **Custom Metrics**: WebSocket-based dashboard

---

## 🚨 Troubleshooting

### Issue: High Memory Usage

**Check:**
```bash
npm run memory:audit
```

**Common Causes:**
- Memory leaks from unclosed connections
- Large arrays/objects not garbage collected
- Event listener accumulation
- Circular references

**Fix:**
- Use WeakMap/WeakSet for caches
- Clean up listeners: `emitter.removeListener()`
- Avoid global variables
- Use streams for large data

### Issue: Slow API Responses

**Check:**
```bash
npm run performance
```

**Common Causes:**
- Missing database indexes
- N+1 queries
- Synchronous operations
- Large payload serialization

**Fix:**
- Add indexes: `CREATE INDEX idx_name ON table(column)`
- Use async/await properly
- Implement pagination
- Compress responses

### Issue: Console Flooding

**Solution:**
```bash
# Switch to production mode
npm run dev:cleaned

# Or backend only
npm run start:clean
```

---

## 🎓 Best Practices Summary

### DO ✅
- Use production mode for daily development
- Run performance checks regularly
- Monitor memory usage
- Use prepared statements
- Implement caching
- Clean up resources
- Use async/await
- Validate input data

### DON'T ❌
- Log everything in production
- Use synchronous operations
- Store large data in memory
- Create memory leaks
- Skip database indexes
- Ignore performance metrics
- Use global variables
- Trust user input

---

## 📚 Additional Resources

- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)
- [SQLite Optimization](https://www.sqlite.org/optoverview.html)
- [Express Performance Tips](https://expressjs.com/en/advanced/best-practice-performance.html)

---

## 🔍 Quick Commands Reference

```bash
# Performance & Optimization
npm run dev:cleaned         # Clean development mode (minimal logging)
npm run performance         # Run performance tests
npm run memory:audit        # Memory efficiency audit

# Development Modes
npm run dev:full           # Normal mode with logging
npm run dev:debug          # Debug mode with verbose logging
npm run dev:health         # Health check only

# Backend Only
npm run start:clean        # Production mode backend
npm run dev:clean          # Development mode with minimal logging

# Monitoring
npm run health             # System health check
npm run check-alerts       # Check system alerts
```

---

**Last Updated:** October 12, 2025
**System Version:** 1.0.0

