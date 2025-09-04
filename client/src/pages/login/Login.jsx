import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";
import "./login.css";

export default function Login() {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cognitoConfig, setCognitoConfig] = useState(null);
  const { userLogin } = useUser();
  const navigate = useNavigate();

  // Load Cognito configuration
  useEffect(() => {
    const loadCognitoConfig = async () => {
      try {
        // You can load this from your settings API or use the saved config
        setCognitoConfig({
          domain: 'blog-auth-1756980364.auth.eu-west-2.amazoncognito.com',
          clientId: '50bvr2ect5ja74rc3qtdb3jn1a',
          redirectUri: window.location.origin + '/auth/callback'
        });
      } catch (error) {
        console.error('Failed to load Cognito config:', error);
      }
    };
    
    loadCognitoConfig();
  }, []);

  const handleCognitoLogin = () => {
    if (!cognitoConfig) {
      setError('Authentication system not configured');
      return;
    }

    const cognitoUrl = `https://${cognitoConfig.domain}/login?` +
      `client_id=${cognitoConfig.clientId}&` +
      `response_type=code&` +
      `scope=email+openid+profile&` +
      `redirect_uri=${encodeURIComponent(cognitoConfig.redirectUri)}`;
    
    window.location.href = cognitoUrl;
  };

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

        {/* Cognito Login (Recommended) */}
        <div className="oauth-section">
          <h3>🔐 Secure Sign In</h3>
          <p className="cognito-description">
            Powered by AWS Cognito - Enterprise-grade security with social media options
          </p>
          <div className="oauth-buttons">
            <button 
              onClick={handleCognitoLogin} 
              className="oauth-button cognito"
              disabled={!cognitoConfig}
            >
              <i className="fa-solid fa-shield-halved"></i>
              {!cognitoConfig ? 'Loading...' : 'Sign In with AWS Cognito'}
            </button>
          </div>
          <p className="cognito-features">
            ✓ Google, Facebook, Apple sign-in options<br/>
            ✓ Secure password management<br/>
            ✓ Multi-factor authentication ready
          </p>
        </div>

        <div className="divider">
          <span>or use legacy login</span>
        </div>

        {/* Email/Password Login (Legacy) */}
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
              'Sign In (Legacy)'
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

