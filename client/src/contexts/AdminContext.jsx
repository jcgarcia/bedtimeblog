import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState(null);

  // Check for existing admin session on component mount
  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      // TODO: Validate token with backend
      // For now, we'll check if it's a valid token format
      if (adminToken === 'admin-authenticated') {
        setIsAdmin(true);
        setAdminUser({
          id: 1,
          username: 'admin',
          email: 'admin@ingasti.com',
          role: 'super_admin'
        });
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Admin auth check failed:', error);
      setIsAdmin(false);
      setIsLoading(false);
    }
  };

  const adminLogin = async (credentials) => {
    try {
      setIsLoading(true);
      
      // TODO: Replace with actual API call
      // const response = await fetch('/api/admin/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(credentials)
      // });
      
      // Mock authentication - replace with real logic
      if (credentials.username === 'admin' && credentials.password === 'admin123') {
        const mockToken = 'admin-authenticated';
        localStorage.setItem('adminToken', mockToken);
        
        setIsAdmin(true);
        setAdminUser({
          id: 1,
          username: 'admin',
          email: 'admin@ingasti.com',
          role: 'super_admin'
        });
        
        setIsLoading(false);
        return { success: true, message: 'Login successful' };
      } else {
        setIsLoading(false);
        return { success: false, message: 'Invalid credentials' };
      }
    } catch (error) {
      console.error('Admin login failed:', error);
      setIsLoading(false);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  };

  const adminLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAdmin(false);
    setAdminUser(null);
  };

  const value = {
    isAdmin,
    isLoading,
    adminUser,
    adminLogin,
    adminLogout,
    checkAdminAuth
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
