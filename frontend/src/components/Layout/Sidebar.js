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
  flex-shrink: 0;
  
  /* Mobile responsiveness */
  @media (max-width: 768px) {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 1000;
    transform: ${props => props.collapsed ? 'translateX(-100%)' : 'translateX(0)'};
    width: 250px;
    box-shadow: ${props => props.collapsed ? 'none' : '2px 0 10px rgba(0, 0, 0, 0.3)'};
  }
  
  @media (max-width: 480px) {
    width: ${props => props.collapsed ? '0' : '200px'};
  }
`;

// Mobile menu overlay
const MobileOverlay = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: ${props => props.show ? 'block' : 'none'};
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
    backdrop-filter: blur(2px);
  }
`;

// Mobile menu button
const MobileMenuButton = styled.button`
  display: none;
  
  @media (max-width: 768px) {
    display: flex;
    position: fixed;
    top: 15px;
    left: 15px;
    z-index: 998;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    padding: 10px;
    color: white;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.05);
    }
    
    &:active {
      transform: scale(0.95);
    }
  }
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
  flex-shrink: 0;
  
  .logo-image {
    width: ${props => props.collapsed ? '40px' : '80px'};
    height: ${props => props.collapsed ? '40px' : '80px'};
    object-fit: contain;
    margin: ${props => props.collapsed ? '0 auto' : '0 auto 10px'};
    transition: all 0.3s ease;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.1);
    padding: 8px;
    display: block;
  }
  
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
  
  /* Mobile adjustments */
  @media (max-width: 768px) {
    padding: 15px;
    
    .logo-image {
      width: 70px;
      height: 70px;
    }
    
    h1 {
      font-size: 1.3rem;
    }
    
    p {
      font-size: 0.75rem;
    }
  }
`;

const Navigation = styled.nav`
  flex: 1;
  padding: 20px 0;
  overflow-y: auto;
  overflow-x: hidden;
  
  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
    
    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
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
  
  /* Mobile adjustments */
  @media (max-width: 768px) {
    padding: 14px 20px;
    font-size: 0.95rem;
    
    svg {
      width: 22px;
      height: 22px;
    }
    
    /* Hide tooltips on mobile */
    &:hover::after {
      display: none;
    }
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };
  
  // Check if mobile on mount and window resize
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);
  
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <MobileMenuButton onClick={toggleMobileMenu}>
        <Menu size={24} />
      </MobileMenuButton>
      
      <MobileOverlay show={mobileMenuOpen} onClick={closeMobileMenu} />
      
      <SidebarContainer collapsed={isMobile ? !mobileMenuOpen : collapsed}>
      <Logo collapsed={collapsed}>
        <ToggleButton onClick={toggleSidebar}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </ToggleButton>
        <img src="/K2-logo.jpg" alt="K2 Logo" className="logo-image" />
        <h1>K2 Machine Manager</h1>
        <p>Machine Control Center</p>
      </Logo>
      
      <Navigation>
        <NavItem to="/" end collapsed={collapsed} data-tooltip="Dashboard" onClick={closeMobileMenu}>
          <Home />
          <span>Dashboard</span>
        </NavItem>
        
        <NavItem to="/items" collapsed={collapsed} data-tooltip="Item Management" onClick={closeMobileMenu}>
          <Package />
          <span>Item Management</span>
        </NavItem>
        
        <NavItem to="/latte-art" collapsed={collapsed} data-tooltip="Latte Art Designs" onClick={closeMobileMenu}>
          <Palette />
          <span>Latte Art Designs</span>
        </NavItem>
        
        <NavItem to="/option-names" collapsed={collapsed} data-tooltip="Option Names" onClick={closeMobileMenu}>
          <Languages />
          <span>Option Names</span>
        </NavItem>
        
        <NavItem to="/create-order" collapsed={collapsed} data-tooltip="Create Order" onClick={closeMobileMenu}>
          <ShoppingCart />
          <span>Create Order</span>
        </NavItem>
        
        <NavItem to="/orders" collapsed={collapsed} data-tooltip="Order Monitor" onClick={closeMobileMenu}>
          <ClipboardList />
          <span>Order Monitor</span>
        </NavItem>
        
        <NavItem to="/order-history" collapsed={collapsed} data-tooltip="Order History" onClick={closeMobileMenu}>
          <History />
          <span>Order History</span>
        </NavItem>
        
        <NavItem to="/kiosk" target="_blank" collapsed={collapsed} data-tooltip="Kiosk Mode" onClick={closeMobileMenu}>
          <Monitor />
          <span>Kiosk Mode</span>
        </NavItem>
        
        <NavItem to="/mobile-kiosk" target="_blank" collapsed={collapsed} data-tooltip="Mobile Kiosk" onClick={closeMobileMenu}>
          <Smartphone />
          <span>Mobile Kiosk</span>
        </NavItem>
        
        <NavItem to="/inventory" collapsed={collapsed} data-tooltip="Inventory Dashboard" onClick={closeMobileMenu}>
          <BarChart3 />
          <span>Inventory Dashboard</span>
        </NavItem>
        
        <NavItem to="/inventory/management" collapsed={collapsed} data-tooltip="Inventory Management" onClick={closeMobileMenu}>
          <Warehouse />
          <span>Inventory Management</span>
        </NavItem>
        
        <NavItem to="/inventory/consumption-config" collapsed={collapsed} data-tooltip="Consumption Config" onClick={closeMobileMenu}>
          <Settings2 />
          <span>Consumption Config</span>
        </NavItem>
        
        <NavItem to="/alerts" collapsed={collapsed} data-tooltip="Alert Dashboard" onClick={closeMobileMenu}>
          <AlertTriangle />
          <span>Alert Dashboard</span>
        </NavItem>
        
        <NavItem to="/device" collapsed={collapsed} data-tooltip="Device Status" onClick={closeMobileMenu}>
          <Activity />
          <span>Device Status</span>
        </NavItem>
        
        <NavItem to="/system-controls" collapsed={collapsed} data-tooltip="System Controls" onClick={closeMobileMenu}>
          <Settings />
          <span>System Controls</span>
        </NavItem>
        
        <NavItem to="/settings" collapsed={collapsed} data-tooltip="Settings" onClick={closeMobileMenu}>
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
    </>
  );
}

export default Sidebar;
