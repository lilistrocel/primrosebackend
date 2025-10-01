import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Clock, 
  Coffee, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  Calendar,
  Eye,
  RefreshCw,
  Download,
  AlertTriangle,
  Info
} from 'lucide-react';
import { getApiUrl } from '../utils/config';

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  
  h1 {
    color: white;
    font-size: 2rem;
    font-weight: bold;
    margin: 0;
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const SearchBox = styled.div`
  position: relative;
  flex: 1;
  min-width: 200px;
  
  input {
    width: 100%;
    padding: 12px 16px 12px 40px;
    border: none;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 0.9rem;
    
    &::placeholder {
      color: rgba(255, 255, 255, 0.7);
    }
    
    &:focus {
      outline: none;
      background: rgba(255, 255, 255, 0.2);
    }
  }
  
  svg {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(255, 255, 255, 0.7);
    width: 18px;
    height: 18px;
  }
`;

const FilterButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  &.active {
    background: rgba(99, 102, 241, 0.3);
    border-color: rgba(99, 102, 241, 0.5);
  }
`;

const DateRange = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  
  input {
    padding: 8px 12px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 0.9rem;
    
    &::placeholder {
      color: rgba(255, 255, 255, 0.7);
    }
  }
`;

const OrdersGrid = styled.div`
  display: grid;
  gap: 20px;
`;

const OrderCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  }
`;

const OrderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  
  .order-info {
    .order-number {
      color: white;
      font-size: 1.1rem;
      font-weight: bold;
      margin-bottom: 4px;
    }
    
    .order-time {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
    }
  }
  
  .order-status {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 6px;
    
    &.queuing {
      background: rgba(245, 158, 11, 0.2);
      color: #F59E0B;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    
    &.processing {
      background: rgba(99, 102, 241, 0.2);
      color: #6366F1;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }
    
    &.completed {
      background: rgba(16, 185, 129, 0.2);
      color: #10B981;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    
    &.cancelled {
      background: rgba(239, 68, 68, 0.2);
      color: #EF4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    
    svg {
      width: 14px;
      height: 14px;
    }
  }
`;

const OrderItems = styled.div`
  margin-bottom: 16px;
`;

const OrderItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
  
  .item-info {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .item-name {
      color: white;
      font-weight: 500;
    }
    
    .item-quantity {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
    }
  }
  
  .item-price {
    color: rgba(255, 255, 255, 0.8);
    font-weight: 600;
  }
`;

const DebugInfo = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
  
  .debug-header {
    display: flex;
    align-items: center;
    gap: 8px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 12px;
  }
  
  .debug-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    
    .debug-item {
      .label {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.8rem;
        margin-bottom: 4px;
      }
      
      .value {
        color: white;
        font-size: 0.9rem;
        font-weight: 500;
      }
    }
  }
`;

const ViewDetailsButton = styled.button`
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.4);
  color: #6366F1;
  padding: 8px 16px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(99, 102, 241, 0.3);
    transform: translateY(-1px);
  }
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: white;
  
  svg {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.7);
  
  svg {
    width: 48px;
    height: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }
  
  h3 {
    color: white;
    margin-bottom: 8px;
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 30px;
  
  button {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.2);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  .page-info {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;
  }
`;

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [pagination.offset, statusFilter, dateFrom, dateTo]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      const requestBody = {
        deviceId: "1",
        limit: pagination.limit,
        offset: pagination.offset
      };
      
      if (statusFilter) requestBody.status = statusFilter;
      if (dateFrom) requestBody.dateFrom = dateFrom;
      if (dateTo) requestBody.dateTo = dateTo;
      
      // Use the new getAllOrdersSimple endpoint that shows all orders including completed ones
      const response = await fetch(getApiUrl('/api/motong/getAllOrdersSimple'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ deviceId: "1" })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.code === 0) {
          // The getAllOrdersSimple endpoint already provides debug info
          setOrders(data.data);
          setPagination(prev => ({
            ...prev,
            total: data.data.length,
            hasMore: false
          }));
          console.log('✅ Order history fetched successfully:', data.data.length, 'orders');
        } else {
          console.error('❌ Backend returned error:', data.msg);
        }
      } else {
        console.error('❌ Failed to fetch order history:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching order history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 3:
        return <Clock />;
      case 4:
        return <Coffee />;
      case 5:
        return <CheckCircle />;
      case -1:
      case 0:
        return <XCircle />;
      default:
        return <XCircle />;
    }
  };

  const getStatusName = (status) => {
    switch (status) {
      case 3:
        return 'Queuing';
      case 4:
        return 'Processing';
      case 5:
        return 'Completed';
      case -1:
      case 0:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 3:
        return 'queuing';
      case 4:
        return 'processing';
      case 5:
        return 'completed';
      case -1:
      case 0:
        return 'cancelled';
      default:
        return 'unknown';
    }
  };

  const filteredOrders = orders.filter(order => 
    !searchTerm || 
    order.orderNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.debugInfo?.orderId.toString().includes(searchTerm)
  );

  const handlePreviousPage = () => {
    if (pagination.offset > 0) {
      setPagination(prev => ({
        ...prev,
        offset: Math.max(0, prev.offset - prev.limit)
      }));
    }
  };

  const handleNextPage = () => {
    if (pagination.hasMore) {
      setPagination(prev => ({
        ...prev,
        offset: prev.offset + prev.limit
      }));
    }
  };

  const clearFilters = () => {
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setSearchTerm('');
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  return (
    <Container>
      <Header>
        <h1>Order History & Debug</h1>
        <FilterButton onClick={() => setShowFilters(!showFilters)} className={showFilters ? 'active' : ''}>
          <Filter />
          Filters
        </FilterButton>
      </Header>

      <Controls>
        <SearchBox>
          <Search />
          <input
            type="text"
            placeholder="Search by order number or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchBox>
        
        {showFilters && (
          <>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '12px 16px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '0.9rem'
              }}
            >
              <option value="">All Status</option>
              <option value="3">Queuing</option>
              <option value="4">Processing</option>
              <option value="5">Completed</option>
              <option value="-1">Cancelled</option>
            </select>
            
            <DateRange>
              <input
                type="date"
                placeholder="From Date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <input
                type="date"
                placeholder="To Date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </DateRange>
            
            <FilterButton onClick={clearFilters}>
              Clear
            </FilterButton>
          </>
        )}
      </Controls>

      {loading ? (
        <LoadingSpinner>
          <RefreshCw />
          <span style={{ marginLeft: '12px' }}>Loading orders...</span>
        </LoadingSpinner>
      ) : filteredOrders.length === 0 ? (
        <EmptyState>
          <AlertTriangle />
          <h3>No orders found</h3>
          <p>Try adjusting your search criteria or date range.</p>
        </EmptyState>
      ) : (
        <OrdersGrid>
          {filteredOrders.map(order => {
            const allItems = [
              ...order.typeList1 || [],
              ...order.typeList2 || [],
              ...order.typeList3 || [],
              ...order.typeList4 || []
            ];

            return (
              <OrderCard key={order.id}>
                <OrderHeader>
                  <div className="order-info">
                    <div className="order-number">{order.orderNum}</div>
                    <div className="order-time">
                      {new Date(order.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className={`order-status ${getStatusClass(order.status)}`}>
                    {getStatusIcon(order.status)}
                    {getStatusName(order.status)}
                  </div>
                </OrderHeader>

                <OrderItems>
                  {allItems.map(item => (
                    <OrderItem key={item.id}>
                      <div className="item-info">
                        <span className="item-name">{item.goodsName}</span>
                        <span className="item-quantity">x{item.num}</span>
                      </div>
                      <div className="item-price">${item.totalPrice}</div>
                    </OrderItem>
                  ))}
                </OrderItems>

                {order.debugInfo && (
                  <DebugInfo>
                    <div className="debug-header">
                      <Info />
                      Debug Information
                    </div>
                    <div className="debug-grid">
                      <div className="debug-item">
                        <div className="label">Order ID</div>
                        <div className="value">{order.debugInfo.orderId}</div>
                      </div>
                      <div className="debug-item">
                        <div className="label">Total Items</div>
                        <div className="value">{order.debugInfo.totalItems}</div>
                      </div>
                      <div className="debug-item">
                        <div className="label">Has Cancelled Items</div>
                        <div className="value">{order.debugInfo.hasCancelledItems ? 'Yes' : 'No'}</div>
                      </div>
                      <div className="debug-item">
                        <div className="label">Created At</div>
                        <div className="value">{new Date(order.debugInfo.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                  </DebugInfo>
                )}

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <ViewDetailsButton>
                    <Eye />
                    View Details
                  </ViewDetailsButton>
                </div>
              </OrderCard>
            );
          })}
        </OrdersGrid>
      )}

      {pagination.total > 0 && (
        <Pagination>
          <button onClick={handlePreviousPage} disabled={pagination.offset === 0}>
            Previous
          </button>
          <div className="page-info">
            Showing {pagination.offset + 1}-{Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
          </div>
          <button onClick={handleNextPage} disabled={!pagination.hasMore}>
            Next
          </button>
        </Pagination>
      )}
    </Container>
  );
}

export default OrderHistory;
