import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminAuthContext = createContext();

// Admin PIN - hardcoded for security
const ADMIN_PIN = '1987';

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check sessionStorage on mount
  useEffect(() => {
    const authStatus = sessionStorage.getItem('adminAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const verifyPin = (pin) => {
    if (pin === ADMIN_PIN) {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuthenticated', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuthenticated');
  };

  const value = {
    isAuthenticated,
    isLoading,
    verifyPin,
    logout
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export default AdminAuthContext;
