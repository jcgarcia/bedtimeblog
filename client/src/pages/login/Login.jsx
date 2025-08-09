import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";
import { API_ENDPOINTS } from "../../config/api.js";
import "./login.css";

export default function Login() {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { userLogin } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!credentials.email || !credentials.password) {
      setError('Please enter both email and password');
      setIsLoading(false);
      return;
    }

    try {
      const result = await userLogin(credentials);
      
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="login">
      <div className="login-container">
        <div className="login-header">
          <span className="loginTitle">Welcome Back</span>
          <p>Sign in to your account</p>
        </div>

        {/* OAuth Login Options */}
        <div className="oauth-section">
          <h3>Quick Sign In</h3>
          <div className="oauth-buttons">
            <a href={API_ENDPOINTS.AUTH.GOOGLE} className="oauth-button google">
              <i className="fa-brands fa-google"></i>
              Continue with Google
            </a>
            <a href={API_ENDPOINTS.AUTH.FACEBOOK} className="oauth-button facebook">
              <i className="fa-brands fa-facebook-f"></i>
              Continue with Facebook
            </a>
            <a href={API_ENDPOINTS.AUTH.TWITTER} className="oauth-button twitter">
              <i className="fa-brands fa-twitter"></i>
              Continue with Twitter
            </a>
          </div>
        </div>

        <div className="divider">
          <span>or</span>
        </div>

        {/* Email/Password Login */}
        <form className="loginForm" onSubmit={handleSubmit}>
          {error && (
            <div className="login-error">
              <i className="fa-solid fa-exclamation-triangle"></i>
              {error}
            </div>
          )}

          <div className="login-field">
            <label>Email</label>
            <input 
              type="email" 
              name="email"
              className="loginInput" 
              placeholder="Enter your email" 
              value={credentials.email}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="login-field">
            <label>Password</label>
            <input 
              type="password" 
              name="password"
              className="loginInput" 
              placeholder="Enter your password" 
              value={credentials.password}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            className={`loginButton ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account? <Link to="/register">Sign up here</Link>
          </p>
          <p>
            Admin access? <Link to="/adminlogin">Admin Login</Link>
          </p>
        </div>

        <div className="role-info">
          <h4>User Roles</h4>
          <div className="role-badges">
            <span className="role-badge reader">Reader</span>
            <span className="role-badge writer">Writer</span>
            <span className="role-badge editor">Editor</span>
            <span className="role-badge admin">Admin</span>
          </div>
        </div>
      </div>
    </div>
  )
}

