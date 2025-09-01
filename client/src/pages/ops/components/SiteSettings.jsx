import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../../config/api';

export default function SiteSettings() {
  const [settings, setSettings] = useState({
    blogTitle: 'Guilt & Pleasure Bedtime',
    blogDescription: 'A personal blog about life experiences',
    requireApproval: true,
    enableModeration: true,
    enableAutoSave: true,
    autoSaveInterval: 30
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.SETTINGS.GET);
      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({
          ...prev,
          ...data
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      setMessage('');
      
      const response = await fetch(API_ENDPOINTS.SETTINGS.UPDATE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setMessage('Settings saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Error saving settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="site-settings">
      <div className="section-header">
        <h2>Site Settings</h2>
        <button 
          className="btn-primary" 
          onClick={saveSettings}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {message && (
        <div className={`settings-message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
      
      <div className="settings-section">
        <h3>General Settings</h3>
        <div className="setting-item">
          <label>Blog Title</label>
          <input 
            type="text" 
            name="blogTitle"
            value={settings.blogTitle}
            onChange={handleInputChange}
          />
        </div>
        <div className="setting-item">
          <label>Blog Description</label>
          <textarea 
            name="blogDescription"
            value={settings.blogDescription}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div className="settings-section">
        <h3>Editor Configuration</h3>
        <div className="setting-item">
          <label>
            <input 
              type="checkbox" 
              name="enableAutoSave"
              checked={settings.enableAutoSave}
              onChange={handleInputChange}
            />
            Enable auto-save for posts
          </label>
        </div>
        <div className="setting-item">
          <label>Auto-save interval (seconds)</label>
          <input 
            type="number" 
            name="autoSaveInterval"
            value={settings.autoSaveInterval}
            onChange={handleInputChange}
            min="10"
            max="300"
          />
        </div>
      </div>

      <div className="settings-section">
        <h3>Security Settings</h3>
        <div className="setting-item">
          <label>
            <input 
              type="checkbox" 
              name="requireApproval"
              checked={settings.requireApproval}
              onChange={handleInputChange}
            />
            Require admin approval for new posts
          </label>
        </div>
        <div className="setting-item">
          <label>
            <input 
              type="checkbox" 
              name="enableModeration"
              checked={settings.enableModeration}
              onChange={handleInputChange}
            />
            Enable comment moderation
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h3>AWS Cognito Integration</h3>
        <div className="setting-item">
          <p>Cognito configuration will be available in a future update.</p>
        </div>
      </div>

      {/* OAuth Settings can be added here if needed */}
    </div>
  );
}
