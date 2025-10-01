import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { AlertTriangle, X, CheckCircle, AlertCircle, Info, Clock, Package, Zap } from 'lucide-react';
import { getApiUrl } from '../utils/config';

const AlertDashboardContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const AlertCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
  overflow: hidden;
  width: 100%;
  max-width: 800px;
  border-left: 6px solid ${props => {
    switch(props.severity) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#6b7280';
    }
  }};
`;

const AlertHeader = styled.div`
  padding: 20px;
  background: ${props => {
    switch(props.severity) {
      case 'critical': return '#fef2f2';
      case 'warning': return '#fffbeb';
      case 'info': return '#eff6ff';
      default: return '#f9fafb';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const AlertContent = styled.div`
  padding: 20px;
`;

const AlertTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AlertMessage = styled.p`
  margin: 0 0 12px 0;
  color: #6b7280;
  font-size: 14px;
`;

const AlertDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 16px;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 14px;
  color: #374151;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
`;

const Button = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  
  ${props => props.variant === 'primary' && `
    background: #3b82f6;
    color: white;
    
    &:hover {
      background: #2563eb;
    }
  `}
  
  ${props => props.variant === 'success' && `
    background: #10b981;
    color: white;
    
    &:hover {
      background: #059669;
    }
  `}
  
  ${props => props.variant === 'danger' && `
    background: #ef4444;
    color: white;
    
    &:hover {
      background: #dc2626;
    }
  `}
`;

const SummaryCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 24px;
  width: 100%;
  max-width: 800px;
  text-align: center;
`;

const SummaryTitle = styled.h2`
  margin: 0 0 16px 0;
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

const SummaryStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-top: 20px;
`;

const StatItem = styled.div`
  padding: 16px;
  border-radius: 8px;
  background: ${props => {
    switch(props.type) {
      case 'critical': return '#fef2f2';
      case 'warning': return '#fffbeb';
      case 'info': return '#eff6ff';
      default: return '#f9fafb';
    }
  }};
  border: 2px solid ${props => {
    switch(props.type) {
      case 'critical': return '#fecaca';
      case 'warning': return '#fed7aa';
      case 'info': return '#bfdbfe';
      default: return '#e5e7eb';
    }
  }};
`;

const StatNumber = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${props => {
    switch(props.type) {
      case 'critical': return '#dc2626';
      case 'warning': return '#d97706';
      case 'info': return '#2563eb';
      default: return '#6b7280';
    }
  }};
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const NoAlertsMessage = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 48px 24px;
  text-align: center;
  width: 100%;
  max-width: 600px;
`;

const NoAlertsIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const NoAlertsTitle = styled.h2`
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 700;
  color: #10b981;
`;

const NoAlertsText = styled.p`
  margin: 0;
  color: #6b7280;
  font-size: 16px;
`;

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: white;
  font-size: 18px;
`;

const AlertDashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('/api/motong/alert-dashboard/getActiveAlerts'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (response.ok) {
        const data = await response.json();
        if (data.code === 0) {
          setAlerts(data.data);
          setSummary(data.summary);
          console.log('✅ Alerts fetched successfully:', data.data.length, 'alerts');
        } else {
          console.error('❌ Backend returned error:', data.msg);
        }
      } else {
        console.error('❌ Failed to fetch alerts:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId) => {
    try {
      const response = await fetch(getApiUrl('/api/motong/alert-dashboard/resolveAlert'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ alertId })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.code === 0) {
          console.log('✅ Alert resolved successfully');
          // Refresh alerts
          fetchAlerts();
        } else {
          console.error('❌ Failed to resolve alert:', data.msg);
        }
      } else {
        console.error('❌ Failed to resolve alert:', response.status);
      }
    } catch (error) {
      console.error('❌ Error resolving alert:', error);
    }
  };

  const resolveAllAlerts = async () => {
    try {
      const response = await fetch(getApiUrl('/api/motong/alert-dashboard/resolveAllAlerts'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (response.ok) {
        const data = await response.json();
        if (data.code === 0) {
          console.log('✅ All alerts resolved successfully');
          // Refresh alerts
          fetchAlerts();
        } else {
          console.error('❌ Failed to resolve all alerts:', data.msg);
        }
      } else {
        console.error('❌ Failed to resolve all alerts:', response.status);
      }
    } catch (error) {
      console.error('❌ Error resolving all alerts:', error);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <AlertDashboardContainer>
        <LoadingSpinner>
          <Zap className="w-6 h-6 mr-2 animate-spin" />
          Loading alerts...
        </LoadingSpinner>
      </AlertDashboardContainer>
    );
  }

  // If no alerts, show clean "no alerts" message
  if (alerts.length === 0) {
    return (
      <AlertDashboardContainer>
        <NoAlertsMessage>
          <NoAlertsIcon>✅</NoAlertsIcon>
          <NoAlertsTitle>All Clear!</NoAlertsTitle>
          <NoAlertsText>No active alerts. Your inventory is in good shape.</NoAlertsText>
        </NoAlertsMessage>
      </AlertDashboardContainer>
    );
  }

  return (
    <AlertDashboardContainer>
      {/* Summary Card */}
      {summary && (
        <SummaryCard>
          <SummaryTitle>
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            Active Alerts Dashboard
          </SummaryTitle>
          <SummaryStats>
            <StatItem type="critical">
              <StatNumber type="critical">{summary.critical}</StatNumber>
              <StatLabel>Critical</StatLabel>
            </StatItem>
            <StatItem type="warning">
              <StatNumber type="warning">{summary.warning}</StatNumber>
              <StatLabel>Warning</StatLabel>
            </StatItem>
            <StatItem type="info">
              <StatNumber type="info">{summary.info}</StatNumber>
              <StatLabel>Info</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>{summary.total}</StatNumber>
              <StatLabel>Total</StatLabel>
            </StatItem>
          </SummaryStats>
          
          {summary.total > 0 && (
            <ActionButtons style={{ justifyContent: 'center', marginTop: '20px' }}>
              <Button variant="success" onClick={resolveAllAlerts}>
                <CheckCircle className="w-4 h-4" />
                Resolve All Alerts
              </Button>
            </ActionButtons>
          )}
        </SummaryCard>
      )}

      {/* Individual Alert Cards */}
      {alerts.map((alert) => (
        <AlertCard key={alert.id} severity={alert.severity}>
          <AlertHeader severity={alert.severity}>
            <div>
              <AlertTitle>
                {getSeverityIcon(alert.severity)}
                {alert.itemName} - {alert.alertType.replace('_', ' ').toUpperCase()}
              </AlertTitle>
              <AlertMessage>{alert.message}</AlertMessage>
            </div>
            <Button variant="primary" onClick={() => resolveAlert(alert.id)}>
              <CheckCircle className="w-4 h-4" />
              Resolve
            </Button>
          </AlertHeader>
          
          <AlertContent>
            <AlertDetails>
              <DetailItem>
                <Package className="w-4 h-4" />
                <span>Current: {alert.currentStock} {alert.unit}</span>
              </DetailItem>
              <DetailItem>
                <AlertTriangle className="w-4 h-4" />
                <span>Threshold: {alert.thresholdValue} {alert.unit}</span>
              </DetailItem>
              <DetailItem>
                <Clock className="w-4 h-4" />
                <span>Created: {formatDate(alert.createdAt)}</span>
              </DetailItem>
              <DetailItem>
                <span>Category: {alert.category}</span>
              </DetailItem>
            </AlertDetails>
          </AlertContent>
        </AlertCard>
      ))}
    </AlertDashboardContainer>
  );
};

export default AlertDashboard;
