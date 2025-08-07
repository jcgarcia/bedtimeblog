import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../config/api.js';

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

      // Verify token with backend
      const response = await fetch(`${API_URL}api/admin/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsAdmin(true);
          setAdminUser(data.user);
        } else {
          localStorage.removeItem('adminToken');
          setIsAdmin(false);
        }
      } else {
        localStorage.removeItem('adminToken');
        setIsAdmin(false);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Admin auth check failed:', error);
      localStorage.removeItem('adminToken');
      setIsAdmin(false);
      setIsLoading(false);
    }
  };

  const adminLogin = async (credentials) => {
    try {
      setIsLoading(true);
      
      // Call the real API
      const response = await fetch(`${API_URL}api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        localStorage.setItem('adminToken', data.token);
        
        setIsAdmin(true);
        setAdminUser(data.user);
        
        setIsLoading(false);
        return { success: true, message: data.message };
      } else {
        setIsLoading(false);
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Admin login failed:', error);
      setIsLoading(false);
      return { success: false, message: 'Network error. Please try again.' };
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
