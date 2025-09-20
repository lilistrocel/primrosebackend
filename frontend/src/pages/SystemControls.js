import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Power, TestTube, Settings, AlertTriangle, Check, X, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { getApiUrl } from '../utils/config';

const Container = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  
  h1 {
    color: #1F2937;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 2rem;
  }
`;

const RefreshButton = styled.button`
  background: #6366F1;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #5856EB;
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
`;

const ControlCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${props => {
    if (props.variant === 'danger') return '#EF4444';
    if (props.variant === 'warning') return '#F59E0B';
    if (props.variant === 'success') return '#10B981';
    return '#6366F1';
  }};
  
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    
    .title-section {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .icon {
        width: 24px;
        height: 24px;
        color: ${props => {
          if (props.variant === 'danger') return '#EF4444';
          if (props.variant === 'warning') return '#F59E0B';
          if (props.variant === 'success') return '#10B981';
          return '#6366F1';
        }};
      }
      
      .title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #1F2937;
      }
    }
    
    .status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      background: ${props => {
        if (props.enabled) return '#D1FAE5';
        return '#FEE2E2';
      }};
      color: ${props => {
        if (props.enabled) return '#065F46';
        return '#991B1B';
      }};
      
      .status-icon {
        width: 16px;
        height: 16px;
      }
    }
  }
  
  .card-description {
    color: #6B7280;
    margin-bottom: 24px;
    line-height: 1.5;
  }
  
  .card-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
`;

const ActionButton = styled.button`
  background: ${props => {
    if (props.variant === 'danger') return '#EF4444';
    if (props.variant === 'success') return '#10B981';
    if (props.variant === 'warning') return '#F59E0B';
    return '#6366F1';
  }};
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  flex: 1;
  justify-content: center;
  min-width: 140px;
  
  &:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const AlertBanner = styled.div`
  background: ${props => {
    if (props.type === 'warning') return '#FEF3C7';
    if (props.type === 'error') return '#FEE2E2';
    if (props.type === 'success') return '#D1FAE5';
    return '#DBEAFE';
  }};
  border: 1px solid ${props => {
    if (props.type === 'warning') return '#F59E0B';
    if (props.type === 'error') return '#EF4444';
    if (props.type === 'success') return '#10B981';
    return '#3B82F6';
  }};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  
  .alert-icon {
    width: 20px;
    height: 20px;
    color: ${props => {
      if (props.type === 'warning') return '#D97706';
      if (props.type === 'error') return '#DC2626';
      if (props.type === 'success') return '#059669';
      return '#2563EB';
    }};
  }
  
  .alert-text {
    flex: 1;
    color: ${props => {
      if (props.type === 'warning') return '#92400E';
      if (props.type === 'error') return '#991B1B';
      if (props.type === 'success') return '#065F46';
      return '#1E40AF';
    }};
    font-weight: 500;
  }
`;

function SystemControls() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [frontendEnabled, setFrontendEnabled] = useState(true);
  const [testMode, setTestMode] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('/api/motong/system-settings'));
      const result = await response.json();
      
      if (result.code === 0) {
        setSettings(result.data);
        
        // Update local state for quick access
        const frontendSetting = result.data.find(s => s.key === 'frontend_enabled');
        const testSetting = result.data.find(s => s.key === 'test_mode');
        
        setFrontendEnabled(frontendSetting ? frontendSetting.value : true);
        setTestMode(testSetting ? testSetting.value : false);
      } else {
        console.error('Failed to fetch system settings:', result.msg);
      }
    } catch (error) {
      console.error('Error fetching system settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = async (key, currentValue) => {
    if (updating === key) return;

    try {
      setUpdating(key);
      
      const response = await fetch(getApiUrl(`/api/motong/system-settings/toggle/${key}`), {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.code === 0) {
        // Update local state
        if (key === 'frontend_enabled') {
          setFrontendEnabled(result.data.newValue);
        } else if (key === 'test_mode') {
          setTestMode(result.data.newValue);
        }
        
        // Refresh settings to get updated data
        fetchSettings();
        
        console.log(`✅ Toggled ${key}:`, result.data.previousValue, '→', result.data.newValue);
      } else {
        alert('Failed to toggle setting: ' + result.msg);
      }
    } catch (error) {
      console.error('Error toggling setting:', error);
      alert('Error toggling setting');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>
          <RefreshCw size={32} style={{ marginBottom: '16px', animation: 'spin 1s linear infinite' }} />
          <div>Loading system controls...</div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <h1>
          <Settings />
          System Controls
        </h1>
        <RefreshButton onClick={fetchSettings} disabled={loading}>
          <RefreshCw />
          Refresh Status
        </RefreshButton>
      </Header>

      {/* System Status Alerts */}
      {!frontendEnabled && (
        <AlertBanner type="error">
          <AlertTriangle className="alert-icon" />
          <div className="alert-text">
            <strong>Frontend Disabled:</strong> The kiosk is currently showing "Out of Order" message to customers.
          </div>
        </AlertBanner>
      )}

      {testMode && (
        <AlertBanner type="warning">
          <TestTube className="alert-icon" />
          <div className="alert-text">
            <strong>Test Mode Active:</strong> Coffee orders are being sent to typeList100 instead of typeList2, and all ingredients are forced to full stock. The machine will not process these orders.
          </div>
        </AlertBanner>
      )}

      <Grid>
        {/* Frontend Control */}
        <ControlCard 
          variant={frontendEnabled ? 'success' : 'danger'} 
          enabled={frontendEnabled}
        >
          <div className="card-header">
            <div className="title-section">
              <Power className="icon" />
              <div className="title">Frontend Control</div>
            </div>
            <div className="status">
              {frontendEnabled ? <Check className="status-icon" /> : <X className="status-icon" />}
              {frontendEnabled ? 'Online' : 'Offline'}
            </div>
          </div>
          
          <div className="card-description">
            Controls whether customers can access the kiosk interface and place orders. 
            When disabled, the kiosk shows an "Out of Order" message.
          </div>
          
          <div className="card-actions">
            <ActionButton
              variant={frontendEnabled ? 'danger' : 'success'}
              onClick={() => toggleSetting('frontend_enabled', frontendEnabled)}
              disabled={updating === 'frontend_enabled'}
            >
              {frontendEnabled ? <EyeOff /> : <Eye />}
              {updating === 'frontend_enabled' 
                ? 'Updating...' 
                : frontendEnabled 
                  ? 'Disable Frontend' 
                  : 'Enable Frontend'
              }
            </ActionButton>
          </div>
        </ControlCard>

        {/* Test Mode Control */}
        <ControlCard 
          variant={testMode ? 'warning' : 'success'} 
          enabled={!testMode}
        >
          <div className="card-header">
            <div className="title-section">
              <TestTube className="icon" />
              <div className="title">Test Mode</div>
            </div>
            <div className="status">
              {testMode ? <AlertTriangle className="status-icon" /> : <Check className="status-icon" />}
              {testMode ? 'Test Mode' : 'Production'}
            </div>
          </div>
          
          <div className="card-description">
            When enabled, coffee orders are sent to typeList100 instead of typeList2, and all ingredients are forced to full stock, allowing you to test orders without ingredient restrictions or triggering the coffee machine.
          </div>
          
          <div className="card-actions">
            <ActionButton
              variant={testMode ? 'success' : 'warning'}
              onClick={() => toggleSetting('test_mode', testMode)}
              disabled={updating === 'test_mode'}
            >
              {testMode ? <Check /> : <TestTube />}
              {updating === 'test_mode' 
                ? 'Updating...' 
                : testMode 
                  ? 'Disable Test Mode' 
                  : 'Enable Test Mode'
              }
            </ActionButton>
          </div>
        </ControlCard>
      </Grid>

      {/* System Information */}
      <div style={{ marginTop: '32px', padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#1F2937' }}>System Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '0.9rem' }}>
          <div>
            <div style={{ color: '#6B7280', marginBottom: '4px' }}>Frontend Status</div>
            <div style={{ fontWeight: '600', color: frontendEnabled ? '#059669' : '#DC2626' }}>
              {frontendEnabled ? '🟢 Online' : '🔴 Offline'}
            </div>
          </div>
          <div>
            <div style={{ color: '#6B7280', marginBottom: '4px' }}>Test Mode</div>
            <div style={{ fontWeight: '600', color: testMode ? '#D97706' : '#059669' }}>
              {testMode ? '🧪 Enabled' : '✅ Disabled'}
            </div>
          </div>
          <div>
            <div style={{ color: '#6B7280', marginBottom: '4px' }}>Order Routing</div>
            <div style={{ fontWeight: '600', color: '#374151' }}>
              {testMode ? 'typeList100 (Debug)' : 'typeList2 (Production)'}
            </div>
          </div>
          <div>
            <div style={{ color: '#6B7280', marginBottom: '4px' }}>Last Updated</div>
            <div style={{ fontWeight: '600', color: '#374151' }}>
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}

export default SystemControls;
