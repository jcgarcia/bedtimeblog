/**
 * ImageDialog - Modal for inserting images from media library or uploading new ones
 */

import { useState, useEffect } from 'react';
import { uploadAPI } from '../../services/postsAPI';
import './ImageDialog.css';

const ImageDialog = ({ isOpen, onClose, onInsertImage }) => {
  const [activeTab, setActiveTab] = useState('library');
  const [mediaLibrary, setMediaLibrary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [showCaption, setShowCaption] = useState(false);

  // Fetch media library when dialog opens
  useEffect(() => {
    if (isOpen && activeTab === 'library') {
      fetchMediaLibrary();
    }
  }, [isOpen, activeTab]);

  const fetchMediaLibrary = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://bapi.ingasti.com/api/media/files', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📚 Media library API response:', data);
        setMediaLibrary(data.media || []);
      }
    } catch (error) {
      console.error('Error fetching media library:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const response = await uploadAPI.uploadFile(file);
      if (response.success) {
        // Convert S3 key to signed URL for display
        const signedUrlResponse = await fetch(
          `https://bapi.ingasti.com/api/media/signed-url?key=${encodeURIComponent(response.data)}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (signedUrlResponse.ok) {
          const urlData = await signedUrlResponse.json();
          setSelectedImage({
            s3_key: response.data,
            signed_url: urlData.signed_url,
            original_name: file.name
          });
          setAltText(file.name);
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleLibraryImageSelect = async (mediaItem) => {
    try {
      // Get signed URL for the selected image
      const response = await fetch(
        `https://bapi.ingasti.com/api/media/signed-url?key=${encodeURIComponent(mediaItem.s3_key)}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setSelectedImage({
          ...mediaItem,
          signed_url: data.signed_url
        });
        setAltText(mediaItem.alt_text || mediaItem.original_name || '');
      }
    } catch (error) {
      console.error('Error getting signed URL:', error);
    }
  };

  const handleInsert = () => {
    if (selectedImage) {
      onInsertImage({
        src: selectedImage.signed_url,
        altText: altText || selectedImage.original_name || '',
        caption: caption,
        showCaption: showCaption && caption.trim() !== '',
        width: selectedImage.width,
        height: selectedImage.height
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    setAltText('');
    setCaption('');
    setShowCaption(false);
    setActiveTab('library');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="image-dialog-overlay" onClick={handleClose}>
      <div className="image-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="image-dialog-header">
          <h2>Insert Image</h2>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>

        <div className="image-dialog-tabs">
          <button
            className={`tab ${activeTab === 'library' ? 'active' : ''}`}
            onClick={() => setActiveTab('library')}
          >
            Media Library
          </button>
          <button
            className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload New
          </button>
        </div>

        <div className="image-dialog-content">
          {activeTab === 'library' && (
            <div className="media-library-tab">
              {loading ? (
                <div className="loading">Loading media library...</div>
              ) : (
                <div className="media-grid">
                  {mediaLibrary.map((item) => (
                    <div
                      key={item.id}
                      className={`media-item ${selectedImage?.id === item.id ? 'selected' : ''}`}
                      onClick={() => handleLibraryImageSelect(item)}
                    >
                      <img
                        src={`https://bapi.ingasti.com/api/media/signed-url?key=${encodeURIComponent(item.s3_key)}`}
                        alt={item.alt_text || item.original_name}
                        loading="lazy"
                      />
                      <div className="media-info">
                        <span className="filename">{item.original_name}</span>
                        <span className="file-size">{Math.round(item.file_size / 1024)} KB</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="upload-tab">
              <div className="upload-area">
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <label htmlFor="image-upload" className="upload-label">
                  {uploading ? 'Uploading...' : 'Choose Image to Upload'}
                </label>
              </div>
            </div>
          )}

          {selectedImage && (
            <div className="image-preview-section">
              <h3>Selected Image</h3>
              <div className="image-preview">
                <img src={selectedImage.signed_url} alt="Preview" />
              </div>
              
              <div className="image-options">
                <div className="form-group">
                  <label>Alt Text:</label>
                  <input
                    type="text"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="Describe the image for accessibility"
                  />
                </div>
                
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={showCaption}
                      onChange={(e) => setShowCaption(e.target.checked)}
                    />
                    Show Caption
                  </label>
                </div>
                
                {showCaption && (
                  <div className="form-group">
                    <label>Caption:</label>
                    <input
                      type="text"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Image caption"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="image-dialog-footer">
          <button className="cancel-button" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="insert-button"
            onClick={handleInsert}
            disabled={!selectedImage}
          >
            Insert Image
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageDialog;