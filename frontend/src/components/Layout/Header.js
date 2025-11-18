import React from 'react';
import styled from 'styled-components';
import { Bell, User, Wifi } from 'lucide-react';

const HeaderContainer = styled.header`
  height: 70px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  gap: 20px;
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  
  .header-logo {
    width: 45px;
    height: 45px;
    object-fit: contain;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    padding: 5px;
  }
  
  @media (max-width: 768px) {
    .header-logo {
      width: 35px;
      height: 35px;
    }
  }
`;

const PageTitle = styled.div`
  color: white;
  
  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
  }
  
  p {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
    margin: 2px 0 0 0;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const ConnectionStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(16, 185, 129, 0.2);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 20px;
  color: #10B981;
  font-size: 0.8rem;
  font-weight: 500;
  
  svg {
    width: 14px;
    height: 14px;
  }
  
  &.disconnected {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.3);
    color: #EF4444;
  }
`;

const IconButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
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

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
  
  .user-details {
    text-align: right;
    
    .name {
      font-size: 0.9rem;
      font-weight: 500;
    }
    
    .role {
      font-size: 0.7rem;
      color: rgba(255, 255, 255, 0.7);
    }
  }
`;

function Header() {
  const currentPath = window.location.pathname;
  
  const getPageInfo = () => {
    switch (currentPath) {
      case '/':
        return { title: 'Dashboard', subtitle: 'Overview of K2 machine operations' };
      case '/items':
        return { title: 'Item Management', subtitle: 'Manage products and production variables' };
      case '/orders':
        return { title: 'Order Monitor', subtitle: 'Real-time order tracking and status' };
      case '/device':
        return { title: 'Device Status', subtitle: 'Machine health and ingredient levels' };
      case '/settings':
        return { title: 'Settings', subtitle: 'System configuration and preferences' };
      default:
        return { title: 'K2 Machine Manager', subtitle: 'Machine control center' };
    }
  };
  
  const { title, subtitle } = getPageInfo();
  
  return (
    <HeaderContainer>
      <LogoSection>
        <img src="/K2-logo.jpg" alt="K2" className="header-logo" />
        <PageTitle>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </PageTitle>
      </LogoSection>
      
      <HeaderActions>
        <ConnectionStatus>
          <Wifi />
          Connected
        </ConnectionStatus>
        
        <IconButton>
          <Bell />
        </IconButton>
        
        <UserInfo>
          <div className="user-details">
            <div className="name">Admin User</div>
            <div className="role">System Administrator</div>
          </div>
          <IconButton>
            <User />
          </IconButton>
        </UserInfo>
      </HeaderActions>
    </HeaderContainer>
  );
}

export default Header;
