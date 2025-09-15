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
      
      // Simple approach: try common folder patterns
      const possibleFolders = ['/', '/Images/', '/images/', '/media/', '/Media/'];
      let allMedia = [];
      
      for (const folder of possibleFolders) {
        try {
          console.log(`Trying folder: ${folder}`);
          const response = await fetch(`https://bapi.ingasti.com/api/media/files?folder=${encodeURIComponent(folder)}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
          });
          
          console.log(`Response for ${folder}:`, response.status, response.ok);
          
          if (response.ok) {
            const data = await response.json();
            console.log(`Data for ${folder}:`, data);
            
            if (data.success && data.media && data.media.length > 0) {
              console.log(`Raw media array for ${folder}:`, data.media);
              
              // Debug: log each media item
              data.media.forEach((item, index) => {
                console.log(`Media item ${index} in ${folder}:`, {
                  file_name: item.file_name,
                  file_type: item.file_type,
                  public_url: item.public_url,
                  full_item: item
                });
              });
              
              // Filter only image files
              const imageFiles = data.media.filter(item => 
                item.file_type && (
                  item.file_type.startsWith('image/') || 
                  item.file_name?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
                )
              );
              console.log(`Found ${imageFiles.length} images in ${folder}:`, imageFiles);
              allMedia = [...allMedia, ...imageFiles];
            } else {
              console.log(`No media or empty array in ${folder}. Success: ${data.success}, Media length: ${data.media?.length}`);
            }
          } else {
            console.log(`Failed to fetch ${folder}:`, response.status);
          }
        } catch (folderError) {
          console.error(`Error fetching folder ${folder}:`, folderError);
        }
      }
      
      console.log('Total media files found:', allMedia);
      setMedia(allMedia);
    } catch (err) {
      console.error('Error fetching media:', err);
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
