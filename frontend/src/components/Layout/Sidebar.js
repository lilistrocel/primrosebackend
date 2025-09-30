import React from 'react';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import { 
  Coffee, 
  Package, 
  ClipboardList, 
  Activity, 
  Settings,
  Home,
  ShoppingCart,
  Monitor,
  Palette,
  Smartphone,
  Languages,
  Warehouse,
  BarChart3,
  Settings2
} from 'lucide-react';

const SidebarContainer = styled.div`
  width: 250px;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
`;

const Logo = styled.div`
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  h1 {
    color: white;
    font-size: 1.5rem;
    font-weight: bold;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  
  p {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.8rem;
    margin-top: 5px;
  }
`;

const Navigation = styled.nav`
  flex: 1;
  padding: 20px 0;
`;

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
  
  &.active {
    background: rgba(255, 255, 255, 0.15);
    color: white;
    border-left-color: #10B981;
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const StatusIndicator = styled.div`
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  
  .status-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.8rem;
    margin-bottom: 8px;
  }
  
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10B981;
  }
  
  .status-dot.warning {
    background: #F59E0B;
  }
  
  .status-dot.error {
    background: #EF4444;
  }
`;

function Sidebar() {
  return (
    <SidebarContainer>
      <Logo>
        <h1>
          <Coffee />
          Coffee Manager
        </h1>
        <p>Machine Control Center</p>
      </Logo>
      
      <Navigation>
        <NavItem to="/" end>
          <Home />
          Dashboard
        </NavItem>
        
        <NavItem to="/items">
          <Package />
          Item Management
        </NavItem>
        
        <NavItem to="/latte-art">
          <Palette />
          Latte Art Designs
        </NavItem>
        
        <NavItem to="/option-names">
          <Languages />
          Option Names
        </NavItem>
        
        <NavItem to="/create-order">
          <ShoppingCart />
          Create Order
        </NavItem>
        
        <NavItem to="/orders">
          <ClipboardList />
          Order Monitor
        </NavItem>
        
        <NavItem to="/kiosk" target="_blank">
          <Monitor />
          Kiosk Mode
        </NavItem>
        
        <NavItem to="/mobile-kiosk" target="_blank">
          <Smartphone />
          Mobile Kiosk
        </NavItem>
        
        <NavItem to="/inventory">
          <BarChart3 />
          Inventory Dashboard
        </NavItem>
        
        <NavItem to="/inventory/management">
          <Warehouse />
          Inventory Management
        </NavItem>
        
        <NavItem to="/inventory/consumption-config">
          <Settings2 />
          Consumption Config
        </NavItem>
        
        <NavItem to="/device">
          <Activity />
          Device Status
        </NavItem>
        
        <NavItem to="/system-controls">
          <Settings />
          System Controls
        </NavItem>
        
        <NavItem to="/settings">
          <Settings />
          Settings
        </NavItem>
      </Navigation>
      
      <StatusIndicator>
        <div className="status-item">
          <span>Backend Server</span>
          <div className="status-dot"></div>
        </div>
        <div className="status-item">
          <span>Coffee Machine</span>
          <div className="status-dot"></div>
        </div>
        <div className="status-item">
          <span>Database</span>
          <div className="status-dot"></div>
        </div>
      </StatusIndicator>
    </SidebarContainer>
  );
}

export default Sidebar;
