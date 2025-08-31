import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../../config/api';

export default function SocialMediaManagement() {
  const [socialLinks, setSocialLinks] = useState({
    facebook: '',
    twitter: '',
    instagram: '',
    threads: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Fetch social media links from the server
    const fetchSocialLinks = async () => {
      setLoading(true);
      try {
        const response = await fetch(API_ENDPOINTS.SOCIAL_MEDIA_LINKS);
        const data = await response.json();
        setSocialLinks(data);
      } catch (error) {
        console.error('Error fetching social media links:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSocialLinks();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSocialLinks((prevLinks) => ({ ...prevLinks, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch(API_ENDPOINTS.UPDATE_SOCIAL_MEDIA_LINKS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(socialLinks),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      setMessage('Social media links updated successfully!');
    } catch (error) {
      console.error('Error updating social media links:', error);
      setMessage('Failed to update social media links. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="social-management">
      <h2>Social Media Management</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div>
            <label>
              Facebook:
              <input
                type="text"
                name="facebook"
                value={socialLinks.facebook}
                onChange={handleChange}
              />
            </label>
          </div>
          <div>
            <label>
              Twitter:
              <input
                type="text"
                name="twitter"
                value={socialLinks.twitter}
                onChange={handleChange}
              />
            </label>
          </div>
          <div>
            <label>
              Instagram:
              <input
                type="text"
                name="instagram"
                value={socialLinks.instagram}
                onChange={handleChange}
              />
            </label>
          </div>
          <div>
            <label>
              Threads:
              <input
                type="text"
                name="threads"
                value={socialLinks.threads}
                onChange={handleChange}
              />
            </label>
          </div>
          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {message && <p>{message}</p>}
        </form>
      )}
    </div>
  );
}
