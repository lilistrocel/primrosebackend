import React, { useState } from 'react';
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
  Settings2,
  History,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react';

const SidebarContainer = styled.div`
  width: ${props => props.collapsed ? '60px' : '250px'};
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;
`;

const ToggleButton = styled.button`
  position: absolute;
  top: 20px;
  right: 10px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }
`;

const Logo = styled.div`
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  
  h1 {
    color: white;
    font-size: 1.5rem;
    font-weight: bold;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: opacity 0.3s ease;
    opacity: ${props => props.collapsed ? '0' : '1'};
  }
  
  p {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.8rem;
    margin-top: 5px;
    transition: opacity 0.3s ease;
    opacity: ${props => props.collapsed ? '0' : '1'};
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
  position: relative;
  
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
    flex-shrink: 0;
  }
  
  span {
    transition: opacity 0.3s ease;
    opacity: ${props => props.collapsed ? '0' : '1'};
    white-space: nowrap;
  }
  
  /* Tooltip for collapsed state */
  &:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 0.8rem;
    white-space: nowrap;
    z-index: 1000;
    pointer-events: none;
    opacity: ${props => props.collapsed ? '1' : '0'};
    transition: opacity 0.2s ease;
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
    transition: opacity 0.3s ease;
    opacity: ${props => props.collapsed ? '0' : '1'};
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
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <SidebarContainer collapsed={collapsed}>
      <Logo collapsed={collapsed}>
        <ToggleButton onClick={toggleSidebar}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </ToggleButton>
        <h1>
          <Coffee />
          Coffee Manager
        </h1>
        <p>Machine Control Center</p>
      </Logo>
      
      <Navigation>
        <NavItem to="/" end collapsed={collapsed} data-tooltip="Dashboard">
          <Home />
          <span>Dashboard</span>
        </NavItem>
        
        <NavItem to="/items" collapsed={collapsed} data-tooltip="Item Management">
          <Package />
          <span>Item Management</span>
        </NavItem>
        
        <NavItem to="/latte-art" collapsed={collapsed} data-tooltip="Latte Art Designs">
          <Palette />
          <span>Latte Art Designs</span>
        </NavItem>
        
        <NavItem to="/option-names" collapsed={collapsed} data-tooltip="Option Names">
          <Languages />
          <span>Option Names</span>
        </NavItem>
        
        <NavItem to="/create-order" collapsed={collapsed} data-tooltip="Create Order">
          <ShoppingCart />
          <span>Create Order</span>
        </NavItem>
        
        <NavItem to="/orders" collapsed={collapsed} data-tooltip="Order Monitor">
          <ClipboardList />
          <span>Order Monitor</span>
        </NavItem>
        
        <NavItem to="/order-history" collapsed={collapsed} data-tooltip="Order History">
          <History />
          <span>Order History</span>
        </NavItem>
        
        <NavItem to="/kiosk" target="_blank" collapsed={collapsed} data-tooltip="Kiosk Mode">
          <Monitor />
          <span>Kiosk Mode</span>
        </NavItem>
        
        <NavItem to="/mobile-kiosk" target="_blank" collapsed={collapsed} data-tooltip="Mobile Kiosk">
          <Smartphone />
          <span>Mobile Kiosk</span>
        </NavItem>
        
        <NavItem to="/inventory" collapsed={collapsed} data-tooltip="Inventory Dashboard">
          <BarChart3 />
          <span>Inventory Dashboard</span>
        </NavItem>
        
        <NavItem to="/inventory/management" collapsed={collapsed} data-tooltip="Inventory Management">
          <Warehouse />
          <span>Inventory Management</span>
        </NavItem>
        
        <NavItem to="/inventory/consumption-config" collapsed={collapsed} data-tooltip="Consumption Config">
          <Settings2 />
          <span>Consumption Config</span>
        </NavItem>
        
        <NavItem to="/alerts" collapsed={collapsed} data-tooltip="Alert Dashboard">
          <AlertTriangle />
          <span>Alert Dashboard</span>
        </NavItem>
        
        <NavItem to="/device" collapsed={collapsed} data-tooltip="Device Status">
          <Activity />
          <span>Device Status</span>
        </NavItem>
        
        <NavItem to="/system-controls" collapsed={collapsed} data-tooltip="System Controls">
          <Settings />
          <span>System Controls</span>
        </NavItem>
        
        <NavItem to="/settings" collapsed={collapsed} data-tooltip="Settings">
          <Settings />
          <span>Settings</span>
        </NavItem>
      </Navigation>
      
      <StatusIndicator collapsed={collapsed}>
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
