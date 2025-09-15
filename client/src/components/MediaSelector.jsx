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
      
      const adminToken = localStorage.getItem('adminToken');
      console.log('📱 MediaSelector Debug Info:');
      console.log('- Admin token exists:', !!adminToken);
      console.log('- Admin token (first 20 chars):', adminToken?.substring(0, 20) + '...');
      
      // First, get the actual folder list from the API
      console.log('🗂️ Fetching actual folders from API...');
      const foldersResponse = await fetch('https://bapi.ingasti.com/api/media/folders', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📁 Folders response status:', foldersResponse.status);
      
      let actualFolders = ['/']; // Default fallback
      
      if (foldersResponse.ok) {
        const foldersData = await foldersResponse.json();
        console.log('📁 Folders API response:', foldersData);
        
        if (foldersData.success && foldersData.folders) {
          // Extract folder paths - try different possible property names
          actualFolders = foldersData.folders.map(folder => {
            if (typeof folder === 'string') return folder;
            return folder.path || folder.folder_path || folder.name || '/';
          });
          console.log('📁 Actual folders found:', actualFolders);
        }
      } else {
        console.error('❌ Failed to fetch folders. Status:', foldersResponse.status);
        const errorText = await foldersResponse.text();
        console.error('❌ Error response:', errorText);
      }
      
      // Now try both actual folders AND common patterns
      const allFoldersToTry = [...new Set([...actualFolders, '/', '/Images/', '/images/', '/media/', '/Media/'])];
      console.log('📂 All folders to try:', allFoldersToTry);
      
      let allMedia = [];
      
      for (const folder of allFoldersToTry) {
        try {
          console.log(`🔍 Trying folder: "${folder}"`);
          const mediaUrl = `https://bapi.ingasti.com/api/media/files?folder=${encodeURIComponent(folder)}`;
          console.log(`🔗 Media URL: ${mediaUrl}`);
          
          const response = await fetch(mediaUrl, {
            headers: {
              'Authorization': `Bearer ${adminToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log(`📊 Response for "${folder}": Status ${response.status}, OK: ${response.ok}`);
          
          if (response.ok) {
            const data = await response.json();
            console.log(`📄 Data for "${folder}":`, data);
            
            if (data.success && data.media && Array.isArray(data.media)) {
              console.log(`✅ Valid response for "${folder}": ${data.media.length} items found`);
              
              // Debug: log each media item
              data.media.forEach((item, index) => {
                console.log(`📷 Media item ${index} in "${folder}":`, {
                  file_name: item.file_name || item.original_name,
                  file_type: item.file_type,
                  public_url: item.public_url,
                  signed_url: item.signed_url,
                  full_item: item
                });
              });
              
              // Filter only image files and add them with proper URLs
              const imageFiles = data.media.filter(item => {
                const isImage = item.file_type && (
                  item.file_type.startsWith('image/') || 
                  (item.file_name || item.original_name)?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
                );
                console.log(`🖼️ File "${item.file_name || item.original_name}" is image: ${isImage}`);
                return isImage;
              }).map(item => ({
                ...item,
                // Ensure we have the right properties for display
                file_name: item.file_name || item.original_name,
                public_url: item.public_url || item.signed_url || item.url
              }));
              
              console.log(`🎯 Found ${imageFiles.length} images in "${folder}":`, imageFiles);
              allMedia = [...allMedia, ...imageFiles];
            } else {
              console.log(`⚠️ No media or invalid response structure in "${folder}". Success: ${data.success}, Media: ${data.media}, Is Array: ${Array.isArray(data.media)}`);
            }
          } else {
            console.error(`❌ Failed to fetch "${folder}": Status ${response.status}`);
            const errorText = await response.text();
            console.error(`❌ Error response for "${folder}":`, errorText);
          }
        } catch (folderError) {
          console.error(`💥 Error fetching folder "${folder}":`, folderError);
        }
      }
      
      console.log('🏁 Total media files found across all folders:', allMedia.length);
      console.log('📋 Final media list:', allMedia);
      setMedia(allMedia);
    } catch (err) {
      console.error('💥 Error fetching media:', err);
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
