import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(API_ENDPOINTS.AUTH.VERIFY, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('userToken');
      }
    } catch (error) {
      console.error('User auth check failed:', error);
      localStorage.removeItem('userToken');
    } finally {
      setIsLoading(false);
    }
  };

  const userLogin = async (credentials) => {
    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('userToken', data.token);
        setUser(data.user);
        setIsLoading(false);
        return { success: true, message: data.message };
      } else {
        setIsLoading(false);
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('User login failed:', error);
      setIsLoading(false);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const userLogout = () => {
    localStorage.removeItem('userToken');
    setUser(null);
  };

  const value = {
    user,
    isLoading,
    userLogin,
    userLogout,
    checkUserAuth
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};