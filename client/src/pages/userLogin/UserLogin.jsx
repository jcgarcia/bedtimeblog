import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/authContext';
import './userLogin.scss';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8800';

const UserLogin = () => {
  const [inputs, setInputs] = useState({
    username: '',
    password: ''
  });
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleChange = (e) => {
    setInputs(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputs)
      });

      if (response.ok) {
        const data = await response.json();
        login(data);
        navigate('/');
      } else {
        const errorText = await response.text();
        setErr(errorText.replace(/"/g, '') || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErr('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-login">
      <div className="login-container">
        <div className="login-header">
          <h1>Writer Login</h1>
          <p>Sign in to write and manage your posts</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              required
              type="text"
              id="username"
              name="username"
              placeholder="Enter your username"
              value={inputs.username}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              required
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              value={inputs.password}
              onChange={handleChange}
            />
          </div>

          {err && <div className="error-message">{err}</div>}

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <div className="divider">
            <span>Other Options</span>
          </div>

          <div className="other-logins">
            <Link to="/register" className="register-link">
              Don't have an account? Contact admin to create one
            </Link>
            
            <Link to="/adminlogin" className="admin-link">
              <i className="fa-solid fa-shield-halved"></i>
              Admin Login
            </Link>

            <Link to="/" className="home-link">
              <i className="fa-solid fa-home"></i>
              Back to Blog
            </Link>
          </div>

          <div className="user-types-info">
            <h3>Account Types</h3>
            <div className="account-type">
              <i className="fa-solid fa-pen"></i>
              <div>
                <strong>Writers</strong>
                <p>Database users who can create and edit posts</p>
              </div>
            </div>
            <div className="account-type">
              <i className="fa-solid fa-comments"></i>
              <div>
                <strong>Readers</strong>
                <p>OAuth users who can comment via social media</p>
              </div>
            </div>
            <div className="account-type">
              <i className="fa-solid fa-shield"></i>
              <div>
                <strong>Admins</strong>
                <p>Full access to manage content and users</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;
