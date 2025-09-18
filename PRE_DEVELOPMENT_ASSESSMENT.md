# Coffee Machine Backend Replacement - Pre-Development Assessment

## Current Scenario Analysis

### Existing System Architecture
- **Current Backend**: `http://kintsuji.motonbackend.top/swoft/api/motong/`
- **Coffee Machine**: 1 physical machine making API calls
- **Communication**: HTTP POST requests with JSON payloads
- **Constraint**: Machine software cannot be modified

### Current API Endpoints Analysis

#### 1. Device Order Queue List (`deviceOrderQueueList`) - **MOST CRITICAL**
**Purpose**: Coffee machine polls constantly to check for active orders and production instructions
- **Method**: POST
- **Input**: `{"deviceId":"1"}`
- **Output**: Complex nested structure with order details, categorized by product types
- **CRITICAL MACHINE OPERATION FIELDS**:
  - **`status`**: Order/item status (4 = "Processing" - machine actively monitors this)
  - **`jsonCodeVal`**: **MOST CRITICAL** - Production instructions in JSON format
    - `classCode`: Exact product identifier (e.g., "5001" for Espresso)
    - `CupCode`: Cup type specification (e.g., "2" for 8oz cup)
    - `BeanCode`: Coffee bean type (e.g., "1" for CoffeeBean1)
  - **`lhImgPath`**: Print image path for receipt/label printer
  - **`orderId` + `goodsId`**: Reference keys for status updates via editDeviceOrderStatus
- **Additional Fields**:
  - **`matterCodes`**: Required ingredients list (e.g., "CoffeeMatter12,CoffeeMatter11...")
  - **`typeList1-4`**: Product categorization (1:奶茶, 2:咖啡, 3:冰淇淋, 4:其他)
  - Multi-language support (`goodsNameEn`, `goodsNameOt`, `language`)
- **Machine Behavior**: Continuously polls this endpoint to detect new orders and extract production parameters

#### 2. Edit Device Order Status (`editDeviceOrderStatus`) - **CRITICAL**
**Purpose**: Machine reports completion/progress of orders
- **Method**: POST
- **Input**: `{"orderId":933,"orderGoodsId":1048,"status":5}` (uses orderId + goodsId from queue list)
- **Output**: Simple success/failure response `{"code":0,"msg":"Operation successfully","data":[]}`
- **Status Values**: 
  - 4: "Processing" (machine working on order)
  - 5: "Completed" (machine finished - removes from active queue)
  - -1: "Cancelled/Deleted"
- **Machine Behavior**: Calls this when order status changes (start production → completion)

#### 3. Order Queue (`orderQueue`)
**Purpose**: Queue management (less frequently used)
- **Method**: POST
- **Input**: `{"orderNum":"...", "deviceId":"1", "type":0}`
- **Output**: Complete order details with status update

#### 4. Save Device Matter (`saveDeviceMatter`)
**Purpose**: Report machine and ingredient status
- **Method**: POST
- **Input**: JSON strings for material and device status
- **Critical for**: Inventory management and machine health monitoring

## Technical Requirements

### Backend Requirements
1. **API Compatibility**: 100% mimicry of existing endpoints
2. **Response Format**: Exact JSON structure matching
3. **Status Codes**: Consistent HTTP responses
4. **Data Persistence**: Local database for orders and device state
5. **Real-time Updates**: Support for order status changes

### Infrastructure Requirements
1. **Local Hosting**: Localhost deployment on machine computer
2. **Database**: Local database (SQLite recommended for simplicity)
3. **Web Server**: Lightweight HTTP server
4. **Port Configuration**: Configurable port (default 8080 or 3000)

### Validation Strategy
1. **API Testing**: Automated comparison between old and new backends
2. **Response Validation**: JSON structure and field validation
3. **Load Testing**: Ensure performance under machine usage patterns
4. **Migration Testing**: Gradual switchover capability

## Proposed Architecture

### Technology Stack Options

#### Option A: Node.js + Express
- **Pros**: Fast development, JSON native, extensive ecosystem
- **Cons**: Single-threaded limitations
- **Database**: SQLite with better-sqlite3
- **ORM**: Prisma or direct SQL

#### Option B: Python + FastAPI
- **Pros**: Excellent for APIs, automatic documentation, type safety
- **Cons**: Slightly more setup overhead
- **Database**: SQLite with SQLAlchemy
- **Features**: Auto-generated OpenAPI docs

#### Option C: Go + Gin/Echo
- **Pros**: High performance, single binary deployment
- **Cons**: Longer development time
- **Database**: SQLite with GORM

### Database Schema Design

```sql
-- Orders table
CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    device_id INTEGER,
    order_num VARCHAR(50) UNIQUE,
    uid INTEGER,
    num INTEGER,
    real_price DECIMAL(10,2),
    status INTEGER,
    created_at INTEGER,
    created_time DATETIME,
    updated_time DATETIME,
    pay_time DATETIME,
    queue_time DATETIME,
    make_time DATETIME,
    success_time DATETIME
);

-- Order items (goods)
CREATE TABLE order_goods (
    id INTEGER PRIMARY KEY,
    order_id INTEGER,
    device_goods_id INTEGER,
    goods_id INTEGER,
    goods_name VARCHAR(100),
    goods_img INTEGER,
    goods_option_name VARCHAR(100),
    type INTEGER, -- 1:奶茶, 2:咖啡, 3:冰淇淋, 4:其他
    status INTEGER,
    price DECIMAL(10,2),
    re_price DECIMAL(10,2),
    matter_codes TEXT,
    num INTEGER,
    total_price DECIMAL(10,2),
    json_code_val TEXT,
    path VARCHAR(255),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Device status tracking
CREATE TABLE device_status (
    id INTEGER PRIMARY KEY,
    device_id INTEGER,
    matter_status_json TEXT,
    device_status_json TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### API Implementation Strategy

1. **Phase 1**: Core API endpoints with exact response matching
2. **Phase 2**: Database integration and persistence
3. **Phase 3**: Validation and testing against existing backend
4. **Phase 4**: Migration strategy and monitoring

## Frontend Requirements

### Order Management Interface
1. **Dashboard**: Real-time order status overview
2. **Order Details**: Individual order management
3. **Device Monitoring**: Machine status and ingredient levels
4. **Historical Data**: Order history and analytics
5. **Configuration**: Device settings and API endpoints

### Technical Features
- Real-time updates (WebSocket or polling)
- Mobile-responsive design
- Order status workflow management
- Ingredient inventory tracking
- Machine health monitoring

## Development Phases

### Phase 1: Backend Core (Week 1-2)
- [ ] Set up project structure
- [ ] Implement exact API endpoint mimicry
- [ ] Create database schema
- [ ] Basic CRUD operations

### Phase 2: Validation & Testing (Week 2-3)
- [ ] API comparison testing framework
- [ ] Response validation scripts
- [ ] Performance testing
- [ ] Documentation updates

### Phase 3: Migration Strategy (Week 3)
- [ ] Parallel running capability
- [ ] Gradual switchover mechanism
- [ ] Monitoring and logging
- [ ] Rollback procedures

### Phase 4: Frontend Development (Week 4-5)
- [ ] Dashboard development
- [ ] Order management interface
- [ ] Device monitoring UI
- [ ] Integration testing

## Risk Assessment

### High Risk
- **API Compatibility**: Any deviation could break machine communication
- **Data Migration**: Ensuring no order loss during transition
- **Performance**: Local hosting performance vs cloud backend

### Medium Risk
- **Database Corruption**: Local SQLite reliability
- **Network Issues**: Localhost connectivity problems
- **Machine Downtime**: During migration period

### Mitigation Strategies
- Comprehensive testing before deployment
- Backup and rollback procedures
- Gradual migration with monitoring
- Documentation of all API behaviors

## Success Criteria

1. **100% API Compatibility**: All machine calls work identically
2. **Zero Downtime Migration**: Seamless transition
3. **Performance Maintenance**: Response times ≤ current backend
4. **Data Integrity**: No order or status data loss
5. **Frontend Functionality**: Complete order management capability

## Next Steps

1. Choose technology stack based on team expertise
2. Set up development environment
3. Implement first API endpoint for testing
4. Create validation framework
5. Begin iterative development and testing

---

*This assessment provides the foundation for developing a robust, compatible replacement backend while maintaining system integrity and enabling future enhancements.*
