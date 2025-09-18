import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Coffee, Package, Activity, DollarSign, TrendingUp, Clock } from 'lucide-react';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  }
  
  .icon {
    width: 24px;
    height: 24px;
    color: ${props => props.iconColor || '#10B981'};
    margin-bottom: 12px;
  }
  
  .value {
    color: white;
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 4px;
  }
  
  .label {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
    margin-bottom: 8px;
  }
  
  .change {
    color: ${props => props.changeColor || '#10B981'};
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    gap: 4px;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const RecentOrders = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 24px;
  
  .title {
    color: white;
    font-size: 1.3rem;
    font-weight: bold;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
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
  
  .order-info {
    flex: 1;
    
    .order-name {
      color: white;
      font-weight: 500;
      margin-bottom: 4px;
    }
    
    .order-details {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.8rem;
    }
  }
  
  .order-status {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    
    &.queuing {
      background: rgba(245, 158, 11, 0.2);
      color: #F59E0B;
    }
    
    &.processing {
      background: rgba(99, 102, 241, 0.2);
      color: #6366F1;
    }
    
    &.completed {
      background: rgba(16, 185, 129, 0.2);
      color: #10B981;
    }
  }
`;

const SystemStatus = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 24px;
  
  .title {
    color: white;
    font-size: 1.3rem;
    font-weight: bold;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
`;

const StatusItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
  
  .status-name {
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
  }
  
  .status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => props.status === 'ok' ? '#10B981' : props.status === 'warning' ? '#F59E0B' : '#EF4444'};
  }
`;

function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    ordersToday: 0,
    activeProducts: 24,
    revenue: 0,
    uptime: '98.5%'
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch orders for recent activity
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${apiBaseUrl}/api/motong/deviceOrderQueueList`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ deviceId: "1" })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.code === 0 && data.data) {
          // Convert orders to dashboard format
          const recentOrders = data.data.slice(-5).map(order => {
            const allItems = [
              ...order.typeList1 || [],
              ...order.typeList2 || [],
              ...order.typeList3 || [],
              ...order.typeList4 || []
            ];
            const mainItem = allItems[0];
            
            return {
              id: order.id,
              name: mainItem ? mainItem.goodsName : 'Unknown',
              orderNum: order.orderNum,
              status: order.status === 3 ? 'queuing' : order.status === 4 ? 'processing' : 'completed',
              time: new Date(order.createdAt).toLocaleTimeString()
            };
          });

          setOrders(recentOrders);
          setStats(prev => ({
            ...prev,
            ordersToday: data.data.length,
            revenue: data.data.reduce((sum, order) => sum + parseFloat(order.realPrice || 0), 0)
          }));
        }
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
    }
  };

  const systemStatus = [
    { name: 'Coffee Machine', status: 'ok' },
    { name: 'Backend Server', status: 'ok' },
    { name: 'Database', status: 'ok' },
    { name: 'Printer', status: 'ok' },
    { name: 'Ingredient Level', status: 'warning' },
  ];

  return (
    <Container>
      <StatsGrid>
        <StatCard iconColor="#10B981">
          <Coffee className="icon" />
          <div className="value">{stats.ordersToday}</div>
          <div className="label">Orders Today</div>
          <div className="change">
            <TrendingUp size={12} />
            Real-time data
          </div>
        </StatCard>
        
        <StatCard iconColor="#6366F1">
          <Package className="icon" />
          <div className="value">{stats.activeProducts}</div>
          <div className="label">Active Products</div>
          <div className="change">
            <TrendingUp size={12} />
            5 available types
          </div>
        </StatCard>
        
        <StatCard iconColor="#F59E0B">
          <DollarSign className="icon" />
          <div className="value">${stats.revenue.toFixed(2)}</div>
          <div className="label">Revenue Today</div>
          <div className="change">
            <TrendingUp size={12} />
            Live calculation
          </div>
        </StatCard>
        
        <StatCard iconColor="#EF4444">
          <Activity className="icon" />
          <div className="value">98.5%</div>
          <div className="label">Machine Uptime</div>
          <div className="change">
            <Clock size={12} />
            Last restart: 2 days ago
          </div>
        </StatCard>
      </StatsGrid>

      <ContentGrid>
        <RecentOrders>
          <h3 className="title">
            <Coffee />
            Recent Orders
          </h3>
          {orders.map(order => (
            <OrderItem key={order.id}>
              <div className="order-info">
                <div className="order-name">{order.name}</div>
                <div className="order-details">#{order.orderNum} • {order.time}</div>
              </div>
              <div className={`order-status ${order.status}`}>
                {order.status}
              </div>
            </OrderItem>
          ))}
        </RecentOrders>

        <SystemStatus>
          <h3 className="title">
            <Activity />
            System Status
          </h3>
          {systemStatus.map((item, index) => (
            <StatusItem key={index} status={item.status}>
              <div className="status-name">{item.name}</div>
              <div className="status-indicator"></div>
            </StatusItem>
          ))}
        </SystemStatus>
      </ContentGrid>
    </Container>
  );
}

export default Dashboard;
