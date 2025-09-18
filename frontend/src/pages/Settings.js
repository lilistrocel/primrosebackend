import React from 'react';
import styled from 'styled-components';
import { Save, Server, Database, Wifi, Bell } from 'lucide-react';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const SettingsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const SettingsSection = styled.div`
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
      color: #6366F1;
    }
    
    .title {
      color: white;
      font-size: 1.3rem;
      font-weight: bold;
      margin: 0;
    }
    
    .description {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
      margin: 0;
      margin-left: auto;
    }
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  label {
    display: block;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
    margin-bottom: 8px;
    font-size: 0.9rem;
  }
  
  .helper-text {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.8rem;
    margin-top: 6px;
    line-height: 1.4;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #6366F1;
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #6366F1;
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
  
  option {
    background: #1F2937;
    color: white;
  }
`;

const Switch = styled.label`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.2);
    transition: 0.4s;
    border-radius: 34px;
    
    &:before {
      position: absolute;
      content: "";
      height: 26px;
      width: 26px;
      left: 4px;
      bottom: 4px;
      background: white;
      transition: 0.4s;
      border-radius: 50%;
    }
  }
  
  input:checked + .slider {
    background: #6366F1;
  }
  
  input:checked + .slider:before {
    transform: translateX(26px);
  }
`;

const SwitchGroup = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .switch-info {
    flex: 1;
    
    .switch-label {
      color: rgba(255, 255, 255, 0.9);
      font-weight: 500;
      margin-bottom: 4px;
    }
    
    .switch-description {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.8rem;
    }
  }
`;

const SaveButton = styled.button`
  background: #10B981;
  border: 1px solid #10B981;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
  
  &:hover {
    background: #059669;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const ConnectionStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 8px;
  color: #10B981;
  font-size: 0.9rem;
  
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10B981;
  }
`;

function Settings() {
  return (
    <Container>
      <SettingsGrid>
        <SettingsSection>
          <div className="section-header">
            <Server className="icon" />
            <h3 className="title">Backend Configuration</h3>
            <span className="description">Coffee machine API settings</span>
          </div>
          
          <FormGroup>
            <label>Backend Server URL</label>
            <Input 
              type="url" 
              defaultValue="http://localhost:3000"
              placeholder="http://localhost:3000"
            />
            <div className="helper-text">
              The base URL where your coffee machine backend is running. Change this to switch between local and remote backends.
            </div>
          </FormGroup>
          
          <FormGroup>
            <label>API Base Path</label>
            <Input 
              type="text" 
              defaultValue="/api/motong"
              placeholder="/api/motong"
            />
            <div className="helper-text">
              The API path that the coffee machine will call. Must match exactly for compatibility.
            </div>
          </FormGroup>
          
          <FormGroup>
            <label>Device ID</label>
            <Input 
              type="number" 
              defaultValue="1"
              placeholder="1"
            />
            <div className="helper-text">
              Unique identifier for this coffee machine device.
            </div>
          </FormGroup>
          
          <ConnectionStatus>
            <div className="status-dot"></div>
            Backend connection: Active
          </ConnectionStatus>
        </SettingsSection>

        <SettingsSection>
          <div className="section-header">
            <Database className="icon" />
            <h3 className="title">Database Settings</h3>
            <span className="description">Local data storage configuration</span>
          </div>
          
          <FormGroup>
            <label>Database File Path</label>
            <Input 
              type="text" 
              defaultValue="./coffee_machine.db"
              placeholder="./coffee_machine.db"
            />
            <div className="helper-text">
              Path to the SQLite database file. Relative to the backend server directory.
            </div>
          </FormGroup>
          
          <FormGroup>
            <label>Backup Frequency</label>
            <Select defaultValue="daily">
              <option value="hourly">Every Hour</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="manual">Manual Only</option>
            </Select>
            <div className="helper-text">
              How often to automatically backup the database.
            </div>
          </FormGroup>
          
          <FormGroup>
            <label>Max Database Size (MB)</label>
            <Input 
              type="number" 
              defaultValue="100"
              placeholder="100"
            />
            <div className="helper-text">
              Maximum size for the database before old records are archived.
            </div>
          </FormGroup>
        </SettingsSection>

        <SettingsSection>
          <div className="section-header">
            <Wifi className="icon" />
            <h3 className="title">Machine Communication</h3>
            <span className="description">Coffee machine connection settings</span>
          </div>
          
          <FormGroup>
            <label>Polling Interval (seconds)</label>
            <Input 
              type="number" 
              defaultValue="5"
              placeholder="5"
            />
            <div className="helper-text">
              How often the machine checks for new orders. Lower values = more responsive, higher server load.
            </div>
          </FormGroup>
          
          <FormGroup>
            <label>Request Timeout (seconds)</label>
            <Input 
              type="number" 
              defaultValue="10"
              placeholder="10"
            />
            <div className="helper-text">
              Maximum time to wait for API responses before timing out.
            </div>
          </FormGroup>
          
          <SwitchGroup>
            <div className="switch-info">
              <div className="switch-label">Enable Request Logging</div>
              <div className="switch-description">Log all machine requests for debugging</div>
            </div>
            <Switch>
              <input type="checkbox" defaultChecked />
              <span className="slider"></span>
            </Switch>
          </SwitchGroup>
        </SettingsSection>

        <SettingsSection>
          <div className="section-header">
            <Bell className="icon" />
            <h3 className="title">Notifications & Alerts</h3>
            <span className="description">Alert and monitoring preferences</span>
          </div>
          
          <SwitchGroup>
            <div className="switch-info">
              <div className="switch-label">Low Ingredient Alerts</div>
              <div className="switch-description">Notify when ingredients are running low</div>
            </div>
            <Switch>
              <input type="checkbox" defaultChecked />
              <span className="slider"></span>
            </Switch>
          </SwitchGroup>
          
          <SwitchGroup>
            <div className="switch-info">
              <div className="switch-label">Machine Error Alerts</div>
              <div className="switch-description">Immediate alerts for machine malfunctions</div>
            </div>
            <Switch>
              <input type="checkbox" defaultChecked />
              <span className="slider"></span>
            </Switch>
          </SwitchGroup>
          
          <SwitchGroup>
            <div className="switch-info">
              <div className="switch-label">Order Completion Notifications</div>
              <div className="switch-description">Notify when orders are completed</div>
            </div>
            <Switch>
              <input type="checkbox" />
              <span className="slider"></span>
            </Switch>
          </SwitchGroup>
          
          <FormGroup>
            <label>Alert Email</label>
            <Input 
              type="email" 
              placeholder="admin@company.com"
            />
            <div className="helper-text">
              Email address to receive critical alerts (optional).
            </div>
          </FormGroup>
        </SettingsSection>

        <SaveButton>
          <Save />
          Save Settings
        </SaveButton>
      </SettingsGrid>
    </Container>
  );
}

export default Settings;
