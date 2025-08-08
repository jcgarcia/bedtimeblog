import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';
import { API_URL } from '../../config/api';
import "./userlogin.css";

export default function UserLogin() {
  const navigate = useNavigate();
  const { adminLogin } = useAdmin(); // Reuse admin login functionality
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const userData = await response.json();
        
        // Use the admin login function to set user data
        adminLogin(userData);
        
        // Redirect to write page or home
        navigate('/write');
      } else {
        const errorMessage = await response.text();
        setError(errorMessage || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-login">
      <div className="login-container">
        <div className="login-header">
          <h1>User Login</h1>
          <p>Sign in to write and manage your posts</p>
        </div>

        {error && (
          <div className="error-message">
            <i className="fa-solid fa-exclamation-triangle"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">
              <i className="fa-solid fa-user"></i>
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Enter your username"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <i className="fa-solid fa-lock"></i>
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className={`login-button ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                Signing in...
              </>
            ) : (
              <>
                <i className="fa-solid fa-sign-in-alt"></i>
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <div className="auth-info">
            <h3>🔐 Authentication Types</h3>
            <div className="auth-types">
              <div className="auth-type">
                <strong>User Login (This Page)</strong>
                <p>For registered users who can write and edit posts</p>
              </div>
              <div className="auth-type">
                <strong>Social Login (/login)</strong>
                <p>For commenting on posts only</p>
              </div>
              <div className="auth-type">
                <strong>Admin Login (/adminlogin)</strong>
                <p>For administrators and operations panel</p>
              </div>
            </div>
          </div>

          <div className="navigation-links">
            <Link to="/login" className="nav-link">
              <i className="fa-solid fa-comments"></i>
              Social Login (For Commenting)
            </Link>
            <Link to="/adminlogin" className="nav-link">
              <i className="fa-solid fa-shield-halved"></i>
              Admin Login
            </Link>
            <Link to="/" className="nav-link">
              <i className="fa-solid fa-home"></i>
              Return Home
            </Link>
          </div>

          <div className="contact-info">
            <p>
              <i className="fa-solid fa-info-circle"></i>
              Need an account? Contact the administrator to get registered.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
