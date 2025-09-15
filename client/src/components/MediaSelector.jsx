import React, { useState, useEffect } from 'react';
import './MediaSelector.css';

const MediaSelector = ({ onSelect, selectedImage, onClose }) => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://bapi.ingasti.com/api/media/files', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch media');
      }
      
      const data = await response.json();
      if (data.success) {
        setMedia(data.media || []);
      } else {
        throw new Error(data.message || 'Failed to fetch media');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (imageUrl) => {
    onSelect(imageUrl);
    onClose();
  };

  if (loading) {
    return (
      <div className="media-selector-overlay">
        <div className="media-selector-modal">
          <div className="media-selector-header">
            <h3>Select Featured Image</h3>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="media-selector-loading">Loading media...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="media-selector-overlay">
        <div className="media-selector-modal">
          <div className="media-selector-header">
            <h3>Select Featured Image</h3>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="media-selector-error">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="media-selector-overlay">
      <div className="media-selector-modal">
        <div className="media-selector-header">
          <h3>Select Featured Image</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="media-selector-content">
          {media.length === 0 ? (
            <div className="no-media">No images available. Upload images in the Operations Panel first.</div>
          ) : (
            <div className="media-grid">
              {media.map((item, index) => (
                <div 
                  key={index} 
                  className={`media-item ${selectedImage === item.public_url ? 'selected' : ''}`}
                  onClick={() => handleImageSelect(item.public_url)}
                >
                  <img 
                    src={item.public_url} 
                    alt={item.file_name}
                    className="media-thumbnail"
                  />
                  <div className="media-info">
                    <div className="media-name">{item.file_name}</div>
                    <div className="media-details">
                      {item.file_size && <span className="media-size">{item.file_size}</span>}
                      {item.file_type && <span className="media-type">{item.file_type}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="media-selector-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          {selectedImage && (
            <button 
              className="btn-primary" 
              onClick={() => handleImageSelect(selectedImage)}
            >
              Select Image
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaSelector;
