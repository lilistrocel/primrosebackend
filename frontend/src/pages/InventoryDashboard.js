import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import api from '../services/api';

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  color: white;
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const ActionButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
  }
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
  border-radius: 12px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  }
`;

const StatTitle = styled.h3`
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 12px 0;
  opacity: 0.9;
`;

const StatValue = styled.div`
  color: white;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 8px;
`;

const StatSubtext = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
  margin-bottom: 30px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Section = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const SectionTitle = styled.h2`
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 20px 0;
`;

const InventoryTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  color: white;
`;

const TableHeader = styled.th`
  text-align: left;
  padding: 12px 8px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`;

const TableCell = styled.td`
  padding: 12px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const StockBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 4px;
`;

const StockFill = styled.div`
  height: 100%;
  background: ${props => {
    if (props.$percentage <= 20) return '#ff4757';
    if (props.$percentage <= 50) return '#ffa502';
    return '#2ed573';
  }};
  width: ${props => Math.min(props.$percentage, 100)}%;
  transition: all 0.3s ease;
`;

const AlertList = styled.div`
  max-height: 300px;
  overflow-y: auto;
`;

const AlertItem = styled.div`
  background: rgba(255, 71, 87, 0.1);
  border: 1px solid rgba(255, 71, 87, 0.3);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  color: white;
`;

const AlertTitle = styled.div`
  font-weight: 600;
  margin-bottom: 4px;
  color: #ff4757;
`;

const AlertMessage = styled.div`
  font-size: 0.9rem;
  opacity: 0.9;
`;

const TransactionList = styled.div`
  max-height: 300px;
  overflow-y: auto;
`;

const TransactionItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
`;

const TransactionInfo = styled.div`
  flex: 1;
`;

const TransactionType = styled.span`
  background: ${props => {
    switch (props.type) {
      case 'top_up': return 'rgba(46, 213, 115, 0.2)';
      case 'order_consumption': return 'rgba(255, 71, 87, 0.2)';
      case 'adjustment': return 'rgba(255, 165, 2, 0.2)';
      default: return 'rgba(255, 255, 255, 0.2)';
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'top_up': return '#2ed573';
      case 'order_consumption': return '#ff4757';
      case 'adjustment': return '#ffa502';
      default: return 'white';
    }
  }};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-right: 8px;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: white;
  font-size: 1.2rem;
`;

const ErrorMessage = styled.div`
  background: rgba(255, 71, 87, 0.1);
  border: 1px solid rgba(255, 71, 87, 0.3);
  border-radius: 8px;
  padding: 16px;
  color: #ff4757;
  margin-bottom: 20px;
`;

function InventoryDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch dashboard data and inventory items in parallel
      const [dashboardResponse, itemsResponse] = await Promise.all([
        api.get('/api/motong/inventory/dashboard'),
        api.get('/api/motong/inventory/items')
      ]);
      
      setDashboardData(dashboardResponse.data.data);
      setInventoryItems(itemsResponse.data.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load inventory dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStockPercentage = (current, max) => {
    if (max === 0) return 0;
    return Math.round((current / max) * 100);
  };

  if (loading) {
    return (
      <DashboardContainer>
        <LoadingSpinner>Loading inventory dashboard...</LoadingSpinner>
      </DashboardContainer>
    );
  }

  if (error) {
    return (
      <DashboardContainer>
        <ErrorMessage>{error}</ErrorMessage>
        <ActionButton onClick={fetchDashboardData}>Retry</ActionButton>
      </DashboardContainer>
    );
  }

  if (!dashboardData) {
    return (
      <DashboardContainer>
        <ErrorMessage>No data available</ErrorMessage>
      </DashboardContainer>
    );
  }

  const { summary, recentTransactions, lowStockItems, alerts } = dashboardData;

  return (
    <DashboardContainer>
      <Header>
        <Title>Inventory Dashboard</Title>
        <ActionButton onClick={fetchDashboardData}>
          Refresh Data
        </ActionButton>
      </Header>

      <StatsGrid>
        {summary.map(category => (
          <StatCard key={category.category}>
            <StatTitle>{category.category.replace('_', ' ').toUpperCase()}</StatTitle>
            <StatValue>{category.total_items}</StatValue>
            <StatSubtext>
              {category.low_stock_items} low stock, {category.out_of_stock_items} out of stock
            </StatSubtext>
          </StatCard>
        ))}
      </StatsGrid>

      <ContentGrid>
        <Section>
          <SectionTitle>Inventory Overview</SectionTitle>
          <InventoryTable>
            <thead>
              <tr>
                <TableHeader>Item</TableHeader>
                <TableHeader>Current Stock</TableHeader>
                <TableHeader>Max Stock</TableHeader>
                <TableHeader>Status</TableHeader>
              </tr>
            </thead>
            <tbody>
              {inventoryItems.map(item => (
                <tr key={item.id}>
                  <TableCell>{item.display_name}</TableCell>
                  <TableCell>{item.current_stock} {item.unit}</TableCell>
                  <TableCell>{item.max_stock} {item.unit}</TableCell>
                  <TableCell>
                    <StockBar>
                      <StockFill 
                        $percentage={getStockPercentage(item.current_stock, item.max_stock)}
                      />
                    </StockBar>
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </InventoryTable>
        </Section>

        <div>
          <Section>
            <SectionTitle>Active Alerts</SectionTitle>
            <AlertList>
              {alerts.length === 0 ? (
                <div style={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', padding: '20px' }}>
                  No active alerts
                </div>
              ) : (
                alerts.map(alert => (
                  <AlertItem key={alert.id}>
                    <AlertTitle>{alert.item_name}</AlertTitle>
                    <AlertMessage>{alert.message}</AlertMessage>
                  </AlertItem>
                ))
              )}
            </AlertList>
          </Section>

          <Section style={{ marginTop: '20px' }}>
            <SectionTitle>Recent Transactions</SectionTitle>
            <TransactionList>
              {recentTransactions.length === 0 ? (
                <div style={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', padding: '20px' }}>
                  No recent transactions
                </div>
              ) : (
                recentTransactions.map(transaction => (
                  <TransactionItem key={transaction.id}>
                    <TransactionInfo>
                      <div>
                        <TransactionType type={transaction.transaction_type}>
                          {transaction.transaction_type.replace('_', ' ').toUpperCase()}
                        </TransactionType>
                        {transaction.item_name}
                      </div>
                      <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                        {formatDate(transaction.created_at)}
                      </div>
                    </TransactionInfo>
                    <div style={{ fontWeight: '600' }}>
                      {transaction.quantity > 0 ? '+' : ''}{transaction.quantity} {transaction.unit}
                    </div>
                  </TransactionItem>
                ))
              )}
            </TransactionList>
          </Section>
        </div>
      </ContentGrid>
    </DashboardContainer>
  );
}

export default InventoryDashboard;
