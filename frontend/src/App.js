import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './pages/Dashboard';
import ItemManagement from './pages/ItemManagement';
import OrderMonitor from './pages/OrderMonitor';
import CreateOrder from './pages/CreateOrder';
import KioskOrder from './pages/KioskOrder';
import DeviceStatus from './pages/DeviceStatus';
import Settings from './pages/Settings';
import LatteArtManagement from './pages/LatteArtManagement';

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Figtree', 'Inter', 'Segoe UI', 'Roboto', sans-serif;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
`;

function App() {
  const location = useLocation();
  const isKioskMode = location.pathname === '/kiosk';

  // Full-screen kiosk mode
  if (isKioskMode) {
    return <KioskOrder />;
  }

  // Regular admin interface with sidebar
  return (
    <AppContainer>
      <Sidebar />
      <MainContent>
        <Header />
        <ContentArea>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/items" element={<ItemManagement />} />
            <Route path="/latte-art" element={<LatteArtManagement />} />
            <Route path="/orders" element={<OrderMonitor />} />
            <Route path="/order-monitor" element={<OrderMonitor />} />
            <Route path="/create-order" element={<CreateOrder />} />
            <Route path="/device" element={<DeviceStatus />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </ContentArea>
      </MainContent>
    </AppContainer>
  );
}

export default App;
