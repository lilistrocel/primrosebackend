import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { RefreshCw, Clock, Coffee, CheckCircle, XCircle, X } from 'lucide-react';
import { getApiUrl, API_ENDPOINTS } from '../utils/config';
import currencyUtils from '../utils/currency';
import { formatIngredientList } from '../services/ingredients';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Section = styled.div`
  margin-bottom: 40px;
  
  .section-title {
    color: white;
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    
    .count {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.8);
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 500;
    }
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  
  .title {
    color: white;
    font-size: 2rem;
    font-weight: bold;
    margin: 0;
  }
`;

const RefreshButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const CancelButton = styled.button`
  background: ${props => props.$isForceCancel ? 'rgba(220, 38, 38, 0.15)' : 'rgba(239, 68, 68, 0.1)'};
  border: 1px solid ${props => props.$isForceCancel ? 'rgba(220, 38, 38, 0.4)' : 'rgba(239, 68, 68, 0.3)'};
  color: ${props => props.$isForceCancel ? '#DC2626' : '#EF4444'};
  padding: 8px 12px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-weight: ${props => props.$isForceCancel ? '600' : '500'};
  font-size: 0.875rem;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: ${props => props.$isForceCancel ? 'rgba(220, 38, 38, 0.25)' : 'rgba(239, 68, 68, 0.2)'};
    transform: translateY(-1px);
    ${props => props.$isForceCancel && 'box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);'}
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    width: 14px;
    height: 14px;
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
  
  .order-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
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
  display: grid;
  gap: 12px;
`;

const OrderItem = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  
  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    
    .item-name {
      color: white;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .item-price {
      color: #10B981;
      font-weight: bold;
    }
  }
  
  .item-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    font-size: 0.8rem;
    
    .detail-group {
      .label {
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 4px;
        text-transform: uppercase;
        font-weight: 500;
      }
      
      .value {
        color: rgba(255, 255, 255, 0.9);
        font-family: 'Courier New', monospace;
        font-size: 0.75rem;
      }
    }
  }
`;

const ProductionCodes = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  
  .primary-codes {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 4px;
  }
  
  .secondary-codes {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  
  .code-primary {
    background: rgba(16, 185, 129, 0.2);
    color: #10B981;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }
  
  .code-secondary {
    background: rgba(99, 102, 241, 0.2);
    color: #6366F1;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 0.7rem;
    font-weight: 500;
  }
`;

const IngredientCodes = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  
  .ingredient {
    background: rgba(16, 185, 129, 0.2);
    color: #10B981;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 500;
  }
`;

function OrderMonitor() {
  const [orders, setOrders] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchOrders();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl(API_ENDPOINTS.ORDER_QUEUE), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ deviceId: "1" })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.code === 0 && data.data) {
          setOrders(data.data);
          setLastUpdate(new Date());
          console.log('✅ Orders fetched successfully:', data.data.length, 'orders');
        } else {
          console.error('❌ Backend returned error:', data.msg);
        }
      } else {
        console.error('❌ Failed to fetch orders:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshOrders = () => {
    fetchOrders();
  };

  const cancelOrder = async (orderId, orderNum) => {
    // Find the order to check its status
    const order = orders.find(o => o.id === orderId);
    const orderStatus = getOrderStatus(order);
    
    const isProcessing = orderStatus.status === 4;
    const confirmMessage = isProcessing 
      ? `⚠️ Order ${orderNum} is currently being processed by the coffee machine.\n\nForce canceling may interrupt production and waste ingredients.\n\nAre you sure you want to force cancel this order?`
      : `Are you sure you want to cancel order ${orderNum}?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      // Find all items in this order and cancel them
      if (!order) return;

      const allItems = [
        ...(order.typeList1 || []),
        ...(order.typeList2 || []), 
        ...(order.typeList3 || []),
        ...(order.typeList4 || []),
        ...(order.typeList100 || []) // Include test mode orders
      ];

      // Cancel each item in the order
      for (const item of allItems) {
        console.log(`🔄 Cancelling item ${item.id} for order ${orderId}...`);
        
        const requestBody = {
          orderId: orderId,
          orderGoodsId: item.id,
          status: -1 // -1 = Cancelled (backend expects -1)
        };
        
        console.log('📤 Sending cancel request:', requestBody);
        
        const response = await fetch(getApiUrl(API_ENDPOINTS.EDIT_ORDER_STATUS), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        console.log(`📥 Response status: ${response.status}`);
        
        if (response.ok) {
          const responseData = await response.json();
          console.log(`✅ Item ${item.id} cancelled successfully:`, responseData);
        } else {
          const errorData = await response.text();
          console.error(`❌ Failed to cancel item ${item.id}:`, errorData);
          throw new Error(`Failed to cancel item ${item.id}: ${response.status} ${errorData}`);
        }
      }

      const cancelType = isProcessing ? 'force cancelled' : 'cancelled';
      console.log(`✅ Order ${orderNum} ${cancelType} successfully`);
      
      // Show success notification
      alert(`Order ${orderNum} has been ${cancelType} successfully.`);
      
      // Refresh orders to show updated status
      fetchOrders();
    } catch (error) {
      console.error('❌ Error cancelling order:', error);
      alert('Failed to cancel order. Please try again.');
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

  const getOrderStatus = (order) => {
    const allItems = [
      ...(order.typeList1 || []),
      ...(order.typeList2 || []),
      ...(order.typeList3 || []),
      ...(order.typeList4 || []),
      ...(order.typeList100 || []) // Include test mode orders
    ];

    if (allItems.length === 0) {
      return { status: order.status, statusName: order.statusName };
    }

    // Check if all items are cancelled
    const allCancelled = allItems.every(item => item.status === -1 || item.status === 0);
    if (allCancelled) {
      return { status: -1, statusName: 'Cancelled' };
    }

    // Check if all items are completed
    const allCompleted = allItems.every(item => item.status === 5);
    if (allCompleted) {
      return { status: 5, statusName: 'Completed' };
    }

    // Check if any item is processing (and not cancelled)
    const anyProcessing = allItems.some(item => item.status === 4);
    if (anyProcessing) {
      return { status: 4, statusName: 'Processing' };
    }

    // Check if any item is queuing (and not cancelled)
    const anyQueuing = allItems.some(item => item.status === 3);
    if (anyQueuing) {
      return { status: 3, statusName: 'Queuing' };
    }

    // Default to order status
    return { status: order.status, statusName: order.statusName };
  };

  // Parse and extract key production codes for easy reference
  const parseProductionCodes = (jsonCodeVal) => {
    try {
      const parsed = JSON.parse(jsonCodeVal);
      const codes = {};
      
      // Extract key codes from the JSON array
      parsed.forEach(obj => {
        Object.entries(obj).forEach(([key, value]) => {
          codes[key] = value;
        });
      });
      
      // Return key codes in priority order
      const keyCodesOrder = ['classCode', 'CupCode', 'BeanCode', 'MilkCode'];
      const keyCodes = [];
      
      // Add priority codes first
      keyCodesOrder.forEach(codeType => {
        if (codes[codeType] !== undefined) {
          keyCodes.push({
            type: codeType,
            value: codes[codeType],
            label: getCodeLabel(codeType, codes[codeType]),
            isPrimary: true
          });
        }
      });
      
      // Add remaining codes
      Object.entries(codes).forEach(([key, value]) => {
        if (!keyCodesOrder.includes(key)) {
          keyCodes.push({
            type: key,
            value: value,
            label: `${key}:${value}`,
            isPrimary: false
          });
        }
      });
      
      return keyCodes;
    } catch (error) {
      console.error('Error parsing jsonCodeVal:', error);
      return [];
    }
  };

  // Get human-readable labels for production codes
  const getCodeLabel = (codeType, value) => {
    switch (codeType) {
      case 'classCode':
        return `🎯 Product: ${value}`;
      case 'CupCode':
        const cupSizes = { '1': 'Small', '2': 'Medium', '3': 'Large' };
        return `🥤 Cup: ${cupSizes[value] || value}`;
      case 'BeanCode':
        const beanTypes = { '1': 'House Blend', '2': 'Premium' };
        return `☕ Bean: ${beanTypes[value] || value}`;
      case 'MilkCode':
        const milkTypes = { '1': 'Regular', '2': 'Oat Milk' };
        return `🥛 Milk: ${milkTypes[value] || value}`;
      default:
        return `${codeType}: ${value}`;
    }
  };

  // Keep the old function for backward compatibility
  const parseJsonCodeVal = (jsonCodeVal) => {
    try {
      const parsed = JSON.parse(jsonCodeVal);
      return parsed.map(obj => Object.entries(obj).map(([k, v]) => `${k}:${v}`)).flat();
    } catch {
      return [];
    }
  };

  const parseIngredients = (matterCodes) => {
    const ingredients = formatIngredientList(matterCodes);
    return ingredients;
  };

  // Separate orders into active and historical
  const separateOrders = (orders) => {
    const active = [];
    const historical = [];
    
    orders.forEach(order => {
      const orderStatus = getOrderStatus(order);
      if (orderStatus.status === 3 || orderStatus.status === 4) {
        // Queuing or Processing = Active
        active.push(order);
      } else if (orderStatus.status === 5 || orderStatus.status === -1 || orderStatus.status === 0) {
        // Completed or Cancelled = Historical
        historical.push(order);
      }
    });
    
    return { active, historical };
  };

  const { active: activeOrders, historical: historicalOrders } = separateOrders(orders);

  return (
    <Container>
      <Header>
        <h1 className="title">Order Monitor</h1>
        <RefreshButton onClick={refreshOrders} disabled={loading}>
          <RefreshCw style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </RefreshButton>
      </Header>

      {/* Active Orders Section */}
      <Section>
        <div className="section-title">
          🔥 Active Orders
          <span className="count">{activeOrders.length}</span>
        </div>
        <OrdersGrid>
          {activeOrders.map(order => {
          const allItems = [
            ...(order.typeList1 || []),
            ...(order.typeList2 || []),
            ...(order.typeList3 || []),
            ...(order.typeList4 || []),
            ...(order.typeList100 || []) // Include test mode orders
          ];

          const orderStatus = getOrderStatus(order);

          return (
            <OrderCard key={order.id}>
              <OrderHeader>
                <div className="order-info">
                  <div className="order-number">Order #{order.orderNum}</div>
                  <div className="order-time">
                    Created: {order.createdAt} • Last updated: {lastUpdate.toLocaleTimeString()}
                  </div>
                </div>
                <div className="order-actions">
                  <div className={`order-status ${getStatusClass(orderStatus.status)}`}>
                    {getStatusIcon(orderStatus.status)}
                    {orderStatus.statusName}
                  </div>
                  {(orderStatus.status === 3 || orderStatus.status === 4) && ( // Show cancel for queuing and processing orders (not cancelled)
                    <CancelButton 
                      onClick={() => cancelOrder(order.id, order.orderNum)}
                      title={orderStatus.status === 3 ? "Cancel this queued order" : "Cancel this processing order"}
                      $isForceCancel={orderStatus.status === 4}
                    >
                      <X />
                      {orderStatus.status === 3 ? "Cancel" : "Force Cancel"}
                    </CancelButton>
                  )}
                </div>
              </OrderHeader>

              <OrderItems>
                {allItems.map(item => (
                  <OrderItem key={item.id}>
                    <div className="item-header">
                      <div className="item-name">
                        <Coffee />
                        {item.goodsNameEn} ({item.goodsName})
                        <span className={`item-status ${getStatusClass(item.status)}`} style={{
                          marginLeft: '8px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          background: item.status === 5 ? 'rgba(16, 185, 129, 0.2)' : 
                                     item.status === 4 ? 'rgba(99, 102, 241, 0.2)' : 
                                     'rgba(245, 158, 11, 0.2)',
                          color: item.status === 5 ? '#10B981' : 
                                item.status === 4 ? '#6366F1' : 
                                '#F59E0B',
                          border: `1px solid ${item.status === 5 ? 'rgba(16, 185, 129, 0.3)' : 
                                              item.status === 4 ? 'rgba(99, 102, 241, 0.3)' : 
                                              'rgba(245, 158, 11, 0.3)'}`
                        }}>
                          {getStatusName(item.status)}
                        </span>
                      </div>
                      <div className="item-price">{currencyUtils.formatPrice(item.price)}</div>
                    </div>
                    
                    <div className="item-details">
                      <div className="detail-group">
                        <div className="label">Production Codes</div>
                        <ProductionCodes>
                          {(() => {
                            const codes = parseProductionCodes(item.jsonCodeVal);
                            const primaryCodes = codes.filter(code => code.isPrimary);
                            const secondaryCodes = codes.filter(code => !code.isPrimary);
                            
                            return (
                              <>
                                {primaryCodes.length > 0 && (
                                  <div className="primary-codes">
                                    {primaryCodes.map((code, index) => (
                                      <span key={index} className="code-primary" title={`${code.type}: ${code.value}`}>
                                        {code.label}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {secondaryCodes.length > 0 && (
                                  <div className="secondary-codes">
                                    {secondaryCodes.map((code, index) => (
                                      <span key={index} className="code-secondary" title={`${code.type}: ${code.value}`}>
                                        {code.label}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </ProductionCodes>
                      </div>
                      
                      <div className="detail-group">
                        <div className="label">Required Ingredients</div>
                        <IngredientCodes>
                          {parseIngredients(item.matterCodes).slice(0, 4).map((ingredient, index) => (
                            <span key={index} className="ingredient" title={ingredient.fullName}>
                              {ingredient.name}
                            </span>
                          ))}
                          {parseIngredients(item.matterCodes).length > 4 && (
                            <span className="ingredient">+{parseIngredients(item.matterCodes).length - 4}</span>
                          )}
                        </IngredientCodes>
                      </div>
                    </div>
                  </OrderItem>
                ))}
              </OrderItems>
            </OrderCard>
          );
        })}
        </OrdersGrid>

        {activeOrders.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            color: 'rgba(255, 255, 255, 0.7)', 
            padding: '40px',
            fontSize: '1.1rem'
          }}>
            No active orders at the moment
          </div>
        )}
      </Section>

      {/* Historical Orders Section */}
      {historicalOrders.length > 0 && (
        <Section>
          <div className="section-title">
            📚 Order History
            <span className="count">{historicalOrders.length}</span>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              style={{
                marginLeft: 'auto',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              {showHistory ? 'Hide' : 'Show'} History
            </button>
          </div>
          
          {showHistory && (
            <OrdersGrid>
              {historicalOrders.map(order => {
                const allItems = [
                  ...(order.typeList1 || []),
                  ...(order.typeList2 || []),
                  ...(order.typeList3 || []),
                  ...(order.typeList4 || []),
                  ...(order.typeList100 || []) // Include test mode orders
                ];

                const orderStatus = getOrderStatus(order);

                return (
                  <OrderCard key={order.id} style={{ opacity: 0.8 }}>
                    <OrderHeader>
                      <div className="order-info">
                        <div className="order-number">Order #{order.orderNum}</div>
                        <div className="order-time">
                          Created: {order.createdAt} • Last updated: {lastUpdate.toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="order-actions">
                        <div className={`order-status ${getStatusClass(orderStatus.status)}`}>
                          {getStatusIcon(orderStatus.status)}
                          {orderStatus.statusName}
                        </div>
                      </div>
                    </OrderHeader>

                    <OrderItems>
                      {allItems.map(item => (
                        <OrderItem key={item.id}>
                          <div className="item-header">
                            <div className="item-name">
                              <Coffee />
                              {item.goodsNameEn} ({item.goodsName})
                              <span className={`item-status ${getStatusClass(item.status)}`} style={{
                                marginLeft: '8px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                background: item.status === 5 ? 'rgba(16, 185, 129, 0.2)' : 
                                           item.status === -1 ? 'rgba(239, 68, 68, 0.2)' : 
                                           'rgba(245, 158, 11, 0.2)',
                                color: item.status === 5 ? '#10B981' : 
                                      item.status === -1 ? '#EF4444' : 
                                      '#F59E0B',
                                border: `1px solid ${item.status === 5 ? 'rgba(16, 185, 129, 0.3)' : 
                                                    item.status === -1 ? 'rgba(239, 68, 68, 0.3)' : 
                                                    'rgba(245, 158, 11, 0.3)'}`
                              }}>
                                {getStatusName(item.status)}
                              </span>
                            </div>
                            <div className="item-price">{currencyUtils.formatPrice(item.price)}</div>
                          </div>
                          
                          <div className="item-details">
                            <div className="detail-group">
                              <div className="label">Production Codes</div>
                              <ProductionCodes>
                                {(() => {
                                  const codes = parseProductionCodes(item.jsonCodeVal);
                                  const primaryCodes = codes.filter(code => code.isPrimary);
                                  const secondaryCodes = codes.filter(code => !code.isPrimary);
                                  
                                  return (
                                    <>
                                      {primaryCodes.length > 0 && (
                                        <div className="primary-codes">
                                          {primaryCodes.map((code, index) => (
                                            <span key={index} className="code-primary" title={`${code.type}: ${code.value}`}>
                                              {code.label}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      {secondaryCodes.length > 0 && (
                                        <div className="secondary-codes">
                                          {secondaryCodes.map((code, index) => (
                                            <span key={index} className="code-secondary" title={`${code.type}: ${code.value}`}>
                                              {code.label}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                              </ProductionCodes>
                            </div>
                            
                            <div className="detail-group">
                              <div className="label">Required Ingredients</div>
                              <IngredientCodes>
                                {parseIngredients(item.matterCodes).slice(0, 4).map((ingredient, index) => (
                                  <span key={index} className="ingredient" title={ingredient.fullName}>
                                    {ingredient.name}
                                  </span>
                                ))}
                                {parseIngredients(item.matterCodes).length > 4 && (
                                  <span className="ingredient">+{parseIngredients(item.matterCodes).length - 4}</span>
                                )}
                              </IngredientCodes>
                            </div>
                          </div>
                        </OrderItem>
                      ))}
                    </OrderItems>
                  </OrderCard>
                );
              })}
            </OrdersGrid>
          )}
        </Section>
      )}
    </Container>
  );
}

export default OrderMonitor;
