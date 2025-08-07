import { createContext, useContext, useState, useEffect } from 'react';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for user data in localStorage on app load
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('user');
      }
    }

    // Check for user data in URL parameters (from OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get('user');
    const loginSuccess = urlParams.get('login');

    if (userParam && loginSuccess === 'success') {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Clean up URL
        const url = new URL(window.location);
        url.searchParams.delete('user');
        url.searchParams.delete('login');
        window.history.replaceState({}, document.title, url.toString());
      } catch (error) {
        console.error('Error parsing OAuth user data:', error);
      }
    }

    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
