import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Activity, AlertTriangle, CheckCircle, RefreshCw, Thermometer } from 'lucide-react';
import { INGREDIENT_MAPPING, getIngredientStatus, getIngredientBoolean, getBooleanStatusText } from '../services/ingredients';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
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
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StatusCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 24px;
  
  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    
    .icon {
      width: 24px;
      height: 24px;
      color: #6366F1;
    }
    
    .title {
      color: white;
      font-size: 1.3rem;
      font-weight: bold;
      margin: 0;
    }
  }
`;

const StatusList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const StatusItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  
  .item-info {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .item-name {
      color: white;
      font-weight: 500;
    }
    
    .item-code {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.8rem;
      font-family: 'Courier New', monospace;
    }
  }
  
  .status-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${props => {
        switch (props.status) {
          case 'ok': return '#10B981';
          case 'warning': return '#F59E0B';
          case 'error': return '#EF4444';
          default: return '#6B7280';
        }
      }};
    }
    
    .status-text {
      color: ${props => {
        switch (props.status) {
          case 'ok': return '#10B981';
          case 'warning': return '#F59E0B';
          case 'error': return '#EF4444';
          default: return '#6B7280';
        }
      }};
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
    }
  }
`;

const AlertsSection = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 24px;
  
  .section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    
    .icon {
      width: 24px;
      height: 24px;
      color: #F59E0B;
    }
    
    .title {
      color: white;
      font-size: 1.3rem;
      font-weight: bold;
      margin: 0;
    }
  }
`;

const Alert = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px;
  background: ${props => {
    switch (props.type) {
      case 'warning': return 'rgba(245, 158, 11, 0.1)';
      case 'error': return 'rgba(239, 68, 68, 0.1)';
      default: return 'rgba(99, 102, 241, 0.1)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.type) {
      case 'warning': return 'rgba(245, 158, 11, 0.3)';
      case 'error': return 'rgba(239, 68, 68, 0.3)';
      default: return 'rgba(99, 102, 241, 0.3)';
    }
  }};
  border-radius: 8px;
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .alert-icon {
    width: 20px;
    height: 20px;
    color: ${props => {
      switch (props.type) {
        case 'warning': return '#F59E0B';
        case 'error': return '#EF4444';
        default: return '#6366F1';
      }
    }};
    flex-shrink: 0;
    margin-top: 2px;
  }
  
  .alert-content {
    flex: 1;
    
    .alert-title {
      color: white;
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    .alert-message {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9rem;
      line-height: 1.4;
    }
    
    .alert-time {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.8rem;
      margin-top: 8px;
    }
  }
`;

function DeviceStatus() {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [ingredientStatus, setIngredientStatus] = useState([]);
  
  // Using shared ingredient mapping

  // Initialize with real ingredient levels from backend
  useEffect(() => {
    fetchDeviceStatus();
  }, []);

  const fetchDeviceStatus = async () => {
    try {
      // Fetch real ingredient data from backend
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${apiBaseUrl}/api/motong/getLatestDeviceStatus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ deviceId: 1 })
      });

      let ingredientLevels = {};

      if (response.ok) {
        const data = await response.json();
        if (data.code === 0 && data.data && data.data.matterStatusJson) {
          // Parse the real ingredient levels from backend
          ingredientLevels = JSON.parse(data.data.matterStatusJson);
          console.log('✅ Fetched real ingredient levels from backend:', ingredientLevels);
        } else {
          console.log('⚠️ No device status found in backend, using defaults');
          throw new Error('No device status data');
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }

      // Convert to display format
      const ingredientData = Object.entries(ingredientLevels).map(([code, level]) => {
        const ingredient = INGREDIENT_MAPPING[code];
        return {
          name: ingredient ? ingredient.name : code,
          name_cn: ingredient ? ingredient.name_cn : code,
          code: code,
          level: level,
          status: getIngredientStatus(code, level)
        };
      });

      setIngredientStatus(ingredientData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch device status from backend:', error);
      console.log('Using fallback ingredient levels...');
      
      // Fallback to mock data if backend is unavailable
      const fallbackLevels = {
        CoffeeMatter1: 85,   // 8oz Paper Cups
        CoffeeMatter2: 75,   // Coffee Beans
        CoffeeMatter3: 65,   // Milk
        CoffeeMatter4: 90,   // Ice
        CoffeeMatter5: 80,   // Coffee Machine Water
        CoffeeMatter6: 45,   // Cup #1 - abnormal status
        CoffeeMatter7: 40,   // 2 Cup Sugar - abnormal status
        CoffeeMatter8: 35,   // 3 Cups - abnormal status
        CoffeeMatter9: 95,   // Printer Paper
        CoffeeMatter10: 30,  // 12oz Paper Cups - abnormal status
        CoffeeMatter11: 85,  // Coffee Machine Syrup
        CoffeeMatter12: 75,  // Robot Syrup
        CoffeeMatter13: 70,  // Coffee Beans 2
        CoffeeMatter14: 25,  // Milk 2 - abnormal status
        CoffeeMatter15: 55   // Ice Machine Water - abnormal status
      };

      const ingredientData = Object.entries(fallbackLevels).map(([code, level]) => {
        const ingredient = INGREDIENT_MAPPING[code];
        return {
          name: ingredient ? ingredient.name : code,
          name_cn: ingredient ? ingredient.name_cn : code,
          code: code,
          level: level,
          status: getIngredientStatus(code, level)
        };
      });

      setIngredientStatus(ingredientData);
      setLastUpdate(new Date());
    }
  };


  // Mock device systems
  const deviceSystems = [
    { name: 'Main Controller', code: 'deviceStatus1', status: 'ok' },
    { name: 'Heating System', code: 'deviceStatus2', status: 'ok' },
    { name: 'Pump System', code: 'deviceStatus3', status: 'ok' },
    { name: 'Grinding Unit', code: 'deviceStatus4', status: 'warning' },
    { name: 'Label Printer', code: 'lhStatus', status: 'ok' },
  ];

  // Generate alerts based on real ingredient levels
  const generateAlerts = () => {
    const alerts = [];
    
    ingredientStatus.forEach(ingredient => {
      if (ingredient.status === 'error') {
        alerts.push({
          type: 'error',
          title: `${ingredient.name} Critical`,
          message: `${ingredient.code} (${ingredient.name_cn}) is critically low at ${ingredient.level}%. Immediate refill required.`,
          time: 'Just now'
        });
      } else if (ingredient.status === 'warning') {
        alerts.push({
          type: 'warning',
          title: `${ingredient.name} Low`,
          message: `${ingredient.code} (${ingredient.name_cn}) is running low at ${ingredient.level}%. Consider refilling soon.`,
          time: '5 minutes ago'
        });
      }
    });

    // Add system alerts
    alerts.push({
      type: 'info',
      title: 'System Status',
      message: 'Coffee machine is operating normally. All critical systems functional.',
      time: '1 hour ago'
    });

    return alerts;
  };

  const alerts = generateAlerts();

  const refreshStatus = () => {
    fetchDeviceStatus();
  };


  return (
    <Container>
      <Header>
        <h1 className="title">Device Status</h1>
        <RefreshButton onClick={refreshStatus}>
          <RefreshCw />
          Refresh Status
        </RefreshButton>
      </Header>

      <StatusGrid>
        <StatusCard>
          <div className="card-header">
            <Activity className="icon" />
            <h3 className="title">Ingredient Levels</h3>
          </div>
          <StatusList>
            {ingredientStatus.map((item, index) => (
              <StatusItem key={index} status={item.status}>
                <div className="item-info">
                  <div className="item-name">
                    {item.name} ({item.name_cn})
                  </div>
                  <div className="item-code">{item.code} - {getIngredientBoolean(item.code, item.level)}</div>
                </div>
                <div className="status-indicator">
                  <div className="status-dot"></div>
                  <span className="status-text">{getBooleanStatusText(item.code, item.level)}</span>
                </div>
              </StatusItem>
            ))}
          </StatusList>
        </StatusCard>

        <StatusCard>
          <div className="card-header">
            <Thermometer className="icon" />
            <h3 className="title">System Health</h3>
          </div>
          <StatusList>
            {deviceSystems.map((system, index) => (
              <StatusItem key={index} status={system.status}>
                <div className="item-info">
                  <div className="item-name">{system.name}</div>
                  <div className="item-code">{system.code}</div>
                </div>
                <div className="status-indicator">
                  <div className="status-dot"></div>
                  <span className="status-text">
                    {system.status === 'ok' ? 'Operational' : 
                     system.status === 'warning' ? 'Degraded' : 'Offline'}
                  </span>
                </div>
              </StatusItem>
            ))}
          </StatusList>
        </StatusCard>
      </StatusGrid>

      <AlertsSection>
        <div className="section-header">
          <AlertTriangle className="icon" />
          <h3 className="title">Active Alerts</h3>
        </div>
        
        {alerts.length > 0 ? (
          alerts.map((alert, index) => (
            <Alert key={index} type={alert.type}>
              <AlertTriangle className="alert-icon" />
              <div className="alert-content">
                <div className="alert-title">{alert.title}</div>
                <div className="alert-message">{alert.message}</div>
                <div className="alert-time">{alert.time}</div>
              </div>
            </Alert>
          ))
        ) : (
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'rgba(255, 255, 255, 0.7)',
            padding: '20px 0'
          }}>
            <CheckCircle style={{ color: '#10B981' }} />
            All systems operational - no active alerts
          </div>
        )}
      </AlertsSection>
      
      <div style={{
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '0.9rem',
        marginTop: '20px'
      }}>
        Last updated: {lastUpdate.toLocaleString()}
      </div>
    </Container>
  );
}

export default DeviceStatus;
