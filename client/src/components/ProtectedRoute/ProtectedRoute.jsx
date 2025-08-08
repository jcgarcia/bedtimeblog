import React from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import './protectedroute.css';

const ProtectedRoute = ({ children, requireAdmin = false, allowRegularUsers = false }) => {
  const { isAdmin, isLoading } = useAdmin();

  if (isLoading) {
    return (
      <div className="protected-loading">
        <div className="loading-spinner"></div>
        <p>Verifying credentials...</p>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="protected-unauthorized">
        <div className="unauthorized-content">
          <div className="unauthorized-icon">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <h1>Administrator Access Required</h1>
          <p>This area is restricted to administrators only.</p>
          <div className="unauthorized-details">
            <h3>Access Requirements:</h3>
            <ul>
              <li>Valid administrator credentials</li>
              <li>Proper security clearance</li>
              <li>System authorization</li>
            </ul>
          </div>
          <div className="unauthorized-actions">
            <button 
              className="btn-admin-login"
              onClick={() => window.location.href = '/adminlogin'}
            >
              <i className="fa-solid fa-key"></i>
              Admin Login
            </button>
            <button 
              className="btn-go-home"
              onClick={() => window.location.href = '/'}
            >
              <i className="fa-solid fa-home"></i>
              Return Home
            </button>
          </div>
          <div className="unauthorized-footer">
            <p>
              <i className="fa-solid fa-info-circle"></i>
              If you believe you should have access, please contact the system administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (allowRegularUsers && !isAdmin) {
    return (
      <div className="protected-unauthorized">
        <div className="unauthorized-content">
          <div className="unauthorized-icon">
            <i className="fa-solid fa-user-lock"></i>
          </div>
          <h1>User Authentication Required</h1>
          <p>Please log in as a registered user to access this feature.</p>
          <div className="unauthorized-details">
            <h3>You can access this page by:</h3>
            <ul>
              <li>Logging in as a registered user</li>
              <li>Using administrator credentials</li>
            </ul>
          </div>
          <div className="unauthorized-actions">
            <button 
              className="btn-user-login"
              onClick={() => window.location.href = '/userlogin'}
            >
              <i className="fa-solid fa-sign-in-alt"></i>
              User Login
            </button>
            <button 
              className="btn-admin-login"
              onClick={() => window.location.href = '/adminlogin'}
            >
              <i className="fa-solid fa-key"></i>
              Admin Login
            </button>
            <button 
              className="btn-go-home"
              onClick={() => window.location.href = '/'}
            >
              <i className="fa-solid fa-home"></i>
              Return Home
            </button>
          </div>
          <div className="unauthorized-footer">
            <p>
              <i className="fa-solid fa-info-circle"></i>
              OAuth login is only for commenting. Writing posts requires a registered account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
