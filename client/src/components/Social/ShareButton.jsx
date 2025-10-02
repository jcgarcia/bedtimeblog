import React, { useState } from 'react';
import { API_URL } from '../../config/api';
import axios from 'axios';
import './Social.css';

const ShareButton = ({ postId, postTitle, postUrl, postDescription }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Get the full post URL
  const fullPostUrl = postUrl || `${window.location.origin}/post/${postId}`;
  
  // Encode content for sharing
  const encodedTitle = encodeURIComponent(postTitle || 'Check out this post');
  const encodedUrl = encodeURIComponent(fullPostUrl);
  const encodedDescription = encodeURIComponent(postDescription || '');

  // Track share analytics
  const trackShare = async (platform) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      await axios.post(`${API_URL}/api/social/posts/${postId}/share`, {
        platform: platform
      }, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
    } catch (error) {
      console.error('Error tracking share:', error);
    }
  };

  // Share on different platforms
  const shareOnFacebook = () => {
    trackShare('facebook');
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
    setShowDropdown(false);
  };

  const shareOnTwitter = () => {
    trackShare('twitter');
    window.open(`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`, '_blank');
    setShowDropdown(false);
  };

  const shareOnLinkedIn = () => {
    trackShare('linkedin');
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, '_blank');
    setShowDropdown(false);
  };

  const shareOnWhatsApp = () => {
    trackShare('whatsapp');
    window.open(`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`, '_blank');
    setShowDropdown(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullPostUrl);
      setCopySuccess(true);
      trackShare('copy_link');
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = fullPostUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
    setShowDropdown(false);
  };

  // Native sharing for mobile devices
  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: postTitle,
          text: postDescription,
          url: fullPostUrl,
        });
        trackShare('native');
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      setShowDropdown(!showDropdown);
    }
  };

  return (
    <div className="share-button-container">
      <button 
        className="share-button"
        onClick={shareNative}
        title="Share this post"
      >
        <span className="share-icon">🔗</span>
        <span className="share-text">Share</span>
      </button>

      {showDropdown && (
        <div className="share-dropdown">
          <div className="share-dropdown-content">
            <button onClick={shareOnFacebook} className="share-option facebook">
              <span className="share-option-icon">📘</span>
              <span>Facebook</span>
            </button>
            <button onClick={shareOnTwitter} className="share-option twitter">
              <span className="share-option-icon">🐦</span>
              <span>Twitter</span>
            </button>
            <button onClick={shareOnLinkedIn} className="share-option linkedin">
              <span className="share-option-icon">💼</span>
              <span>LinkedIn</span>
            </button>
            <button onClick={shareOnWhatsApp} className="share-option whatsapp">
              <span className="share-option-icon">💬</span>
              <span>WhatsApp</span>
            </button>
            <button onClick={copyToClipboard} className="share-option copy">
              <span className="share-option-icon">{copySuccess ? '✅' : '📋'}</span>
              <span>{copySuccess ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {showDropdown && (
        <div 
          className="share-dropdown-overlay" 
          onClick={() => setShowDropdown(false)}
        ></div>
      )}
    </div>
  );
};

export default ShareButton;