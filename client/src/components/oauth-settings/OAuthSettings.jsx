import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import './oauth-settings.css';

const OAuthSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState({});
  const [settings, setSettings] = useState({
    google: {
      clientId: '',
      clientSecret: '',
      configured: false
    },
    facebook: {
      appId: '',
      appSecret: '',
      configured: false
    },
    twitter: {
      consumerKey: '',
      consumerSecret: '',
      configured: false
    },
    frontendUrl: 'https://blog.ingasti.com'
  });
  const [testResults, setTestResults] = useState({});
  const [showCredentials, setShowCredentials] = useState({
    google: { clientSecret: false },
    facebook: { appSecret: false },
    twitter: { consumerSecret: false }
  });

  // Load OAuth settings on component mount
  useEffect(() => {
    loadOAuthSettings();
  }, []);

  const loadOAuthSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.SETTINGS.OAUTH, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to load OAuth settings');
      }
      
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error loading OAuth settings:', error);
      alert('Failed to load OAuth settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (provider, field, value) => {
    setSettings(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  const handleGlobalInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleCredentialVisibility = (provider, field) => {
    setShowCredentials(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: !prev[provider][field]
      }
    }));
  };

  const testOAuthConfiguration = async (provider) => {
    try {
      setTesting(prev => ({ ...prev, [provider]: true }));
      
      const response = await fetch(API_ENDPOINTS.SETTINGS.OAUTH_TEST(provider), {
        method: 'POST',
        credentials: 'include'
      });
      
      const result = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        [provider]: {
          success: result.success,
          message: result.message || result.error,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
      
    } catch (error) {
      console.error(`Error testing ${provider} OAuth:`, error);
      setTestResults(prev => ({
        ...prev,
        [provider]: {
          success: false,
          message: 'Network error occurred',
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    } finally {
      setTesting(prev => ({ ...prev, [provider]: false }));
    }
  };

  const saveOAuthSettings = async () => {
    try {
      setSaving(true);
      
      const response = await fetch(API_ENDPOINTS.SETTINGS.OAUTH, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save OAuth settings');
      }
      
      const result = await response.json();
      alert('OAuth settings saved successfully!');
      
      // Reload settings to get updated configuration status
      await loadOAuthSettings();
      
    } catch (error) {
      console.error('Error saving OAuth settings:', error);
      alert('Failed to save OAuth settings');
    } finally {
      setSaving(false);
    }
  };

  const getConfiguredCount = () => {
    return [settings.google.configured, settings.facebook.configured, settings.twitter.configured]
      .filter(Boolean).length;
  };

  if (loading) {
    return <div className="oauth-settings-loading">Loading OAuth settings...</div>;
  }

  return (
    <div className="oauth-settings">
      <div className="oauth-header">
        <h2>OAuth Configuration</h2>
        <div className="oauth-status">
          Status: {getConfiguredCount()}/3 Providers Configured
        </div>
      </div>

      {/* Google OAuth Configuration */}
      <div className="oauth-provider-section">
        <div className="oauth-provider-header">
          <div className="provider-info">
            <i className="fab fa-google oauth-provider-icon google"></i>
            <h3>Google OAuth</h3>
            <span className={`config-status ${settings.google.configured ? 'configured' : 'not-configured'}`}>
              {settings.google.configured ? '✅ Configured' : '❌ Not Configured'}
            </span>
          </div>
        </div>
        
        <div className="oauth-form-group">
          <label>Client ID</label>
          <input
            type="text"
            value={settings.google.clientId}
            onChange={(e) => handleInputChange('google', 'clientId', e.target.value)}
            placeholder="Enter Google Client ID"
          />
        </div>
        
        <div className="oauth-form-group">
          <label>Client Secret</label>
          <div className="password-input-group">
            <input
              type={showCredentials.google.clientSecret ? "text" : "password"}
              value={settings.google.clientSecret}
              onChange={(e) => handleInputChange('google', 'clientSecret', e.target.value)}
              placeholder="Enter Google Client Secret"
            />
            <button
              type="button"
              className="toggle-visibility"
              onClick={() => toggleCredentialVisibility('google', 'clientSecret')}
            >
              <i className={`fa ${showCredentials.google.clientSecret ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
        </div>
        
        <div className="oauth-actions">
          <button
            className="test-button"
            onClick={() => testOAuthConfiguration('google')}
            disabled={testing.google || !settings.google.clientId || !settings.google.clientSecret}
          >
            {testing.google ? 'Testing...' : 'Test Configuration'}
          </button>
          
          {testResults.google && (
            <div className={`test-result ${testResults.google.success ? 'success' : 'error'}`}>
              <i className={`fa ${testResults.google.success ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
              {testResults.google.message}
              <small>({testResults.google.timestamp})</small>
            </div>
          )}
        </div>
      </div>

      {/* Facebook OAuth Configuration */}
      <div className="oauth-provider-section">
        <div className="oauth-provider-header">
          <div className="provider-info">
            <i className="fab fa-facebook oauth-provider-icon facebook"></i>
            <h3>Facebook OAuth</h3>
            <span className={`config-status ${settings.facebook.configured ? 'configured' : 'not-configured'}`}>
              {settings.facebook.configured ? '✅ Configured' : '❌ Not Configured'}
            </span>
          </div>
        </div>
        
        <div className="oauth-form-group">
          <label>App ID</label>
          <input
            type="text"
            value={settings.facebook.appId}
            onChange={(e) => handleInputChange('facebook', 'appId', e.target.value)}
            placeholder="Enter Facebook App ID"
          />
        </div>
        
        <div className="oauth-form-group">
          <label>App Secret</label>
          <div className="password-input-group">
            <input
              type={showCredentials.facebook.appSecret ? "text" : "password"}
              value={settings.facebook.appSecret}
              onChange={(e) => handleInputChange('facebook', 'appSecret', e.target.value)}
              placeholder="Enter Facebook App Secret"
            />
            <button
              type="button"
              className="toggle-visibility"
              onClick={() => toggleCredentialVisibility('facebook', 'appSecret')}
            >
              <i className={`fa ${showCredentials.facebook.appSecret ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
        </div>
        
        <div className="oauth-actions">
          <button
            className="test-button"
            onClick={() => testOAuthConfiguration('facebook')}
            disabled={testing.facebook || !settings.facebook.appId || !settings.facebook.appSecret}
          >
            {testing.facebook ? 'Testing...' : 'Test Configuration'}
          </button>
          
          {testResults.facebook && (
            <div className={`test-result ${testResults.facebook.success ? 'success' : 'error'}`}>
              <i className={`fa ${testResults.facebook.success ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
              {testResults.facebook.message}
              <small>({testResults.facebook.timestamp})</small>
            </div>
          )}
        </div>
      </div>

      {/* Twitter OAuth Configuration */}
      <div className="oauth-provider-section">
        <div className="oauth-provider-header">
          <div className="provider-info">
            <i className="fab fa-twitter oauth-provider-icon twitter"></i>
            <h3>Twitter OAuth</h3>
            <span className={`config-status ${settings.twitter.configured ? 'configured' : 'not-configured'}`}>
              {settings.twitter.configured ? '✅ Configured' : '❌ Not Configured'}
            </span>
          </div>
        </div>
        
        <div className="oauth-form-group">
          <label>Consumer Key</label>
          <input
            type="text"
            value={settings.twitter.consumerKey}
            onChange={(e) => handleInputChange('twitter', 'consumerKey', e.target.value)}
            placeholder="Enter Twitter Consumer Key"
          />
        </div>
        
        <div className="oauth-form-group">
          <label>Consumer Secret</label>
          <div className="password-input-group">
            <input
              type={showCredentials.twitter.consumerSecret ? "text" : "password"}
              value={settings.twitter.consumerSecret}
              onChange={(e) => handleInputChange('twitter', 'consumerSecret', e.target.value)}
              placeholder="Enter Twitter Consumer Secret"
            />
            <button
              type="button"
              className="toggle-visibility"
              onClick={() => toggleCredentialVisibility('twitter', 'consumerSecret')}
            >
              <i className={`fa ${showCredentials.twitter.consumerSecret ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
        </div>
        
        <div className="oauth-actions">
          <button
            className="test-button"
            onClick={() => testOAuthConfiguration('twitter')}
            disabled={testing.twitter || !settings.twitter.consumerKey || !settings.twitter.consumerSecret}
          >
            {testing.twitter ? 'Testing...' : 'Test Configuration'}
          </button>
          
          {testResults.twitter && (
            <div className={`test-result ${testResults.twitter.success ? 'success' : 'error'}`}>
              <i className={`fa ${testResults.twitter.success ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
              {testResults.twitter.message}
              <small>({testResults.twitter.timestamp})</small>
            </div>
          )}
        </div>
      </div>

      {/* Global Settings */}
      <div className="oauth-global-section">
        <h3>Global OAuth Settings</h3>
        
        <div className="oauth-form-group">
          <label>Frontend URL</label>
          <input
            type="url"
            value={settings.frontendUrl}
            onChange={(e) => handleGlobalInputChange('frontendUrl', e.target.value)}
            placeholder="https://blog.ingasti.com"
          />
          <small>This URL is used for OAuth callbacks. Make sure it matches your domain.</small>
        </div>
      </div>

      {/* Save Actions */}
      <div className="oauth-save-section">
        <button
          className="save-all-button"
          onClick={saveOAuthSettings}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save All OAuth Settings'}
        </button>
        
        <button
          className="reload-button"
          onClick={loadOAuthSettings}
          disabled={loading || saving}
        >
          Reload Settings
        </button>
      </div>
    </div>
  );
};

export default OAuthSettings;
