import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../../config/api';
import './MediaManagement.css';

export default function MediaManagement() {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState('/');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(null); // Contains file object when moving
  const [newFolderName, setNewFolderName] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [activeSection, setActiveSection] = useState('library'); // 'library' or 'config'
  const [credentialStatus, setCredentialStatus] = useState(null);
  // Media server configuration with OCI/AWS support
  const [mediaServerType, setMediaServerType] = useState('internal'); // 'internal', 'oci', 'aws'
  const [externalMediaServerUrl, setExternalMediaServerUrl] = useState('');
  const [cloudConfig, setCloudConfig] = useState({
    oci: {
      bucketName: '',
      namespace: '',
      region: 'us-ashburn-1',
      publicUrl: ''
    },
    aws: {
      bucketName: '',
      region: 'eu-west-2',
      roleArn: '',
      externalId: '',
      accessKey: '',
      secretKey: '',
      sessionToken: ''
    }
  });

  // Helper function to check if AWS authentication is configured
  const isAwsAuthValid = () => {
    const hasBasicConfig = cloudConfig.aws.bucketName && cloudConfig.aws.region;
    const hasRoleAuth = cloudConfig.aws.roleArn && cloudConfig.aws.externalId;
    const hasKeyAuth = cloudConfig.aws.accessKey && cloudConfig.aws.secretKey;
    
    // Both role and keys are required - keys for initial auth, role for assumption
    return hasBasicConfig && hasRoleAuth && hasKeyAuth;
  };

  useEffect(() => {
    // Load initial configuration
    loadMediaStorageConfig();
  }, []);

  useEffect(() => {
    if (mediaServerType === 'internal') {
      fetchMediaFiles();
      fetchFolders();
    } else if (mediaServerType === 'aws') {
      // Load existing AWS configuration including External ID
      loadAwsConfiguration();
      fetchMediaFiles(); // For AWS, we still load from database
      fetchFolders(); // AWS also uses folder structure
      fetchCredentialStatus(); // Check credential status
    } else {
      // TODO: Integrate with external media server API when available
      setMediaFiles([]);
      setFolders([]);
    }
  }, [currentFolder, pagination.page, filterType, searchTerm, mediaServerType]);

  // Additional useEffect to handle folder navigation state changes
  useEffect(() => {
    // Force component update when returning to root to ensure upload button visibility
    if (currentFolder === '/' && activeSection === 'library') {
      // Reset any stale state that might hide the upload button
      setLoading(false);
    }
  }, [currentFolder, activeSection]);

  const loadMediaStorageConfig = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.SETTINGS.MEDIA_STORAGE, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          // Set the correct storage type from database
          setMediaServerType(data.config.storageType || 'internal');
          
          // Load cloud configurations if available
          if (data.config.awsConfig) {
            setCloudConfig(prev => ({
              ...prev,
              aws: {
                ...prev.aws,
                ...data.config.awsConfig
              }
            }));
          }
          
          if (data.config.ociConfig) {
            setCloudConfig(prev => ({
              ...prev,
              oci: {
                ...prev.oci,
                ...data.config.ociConfig
              }
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error loading media storage configuration:', error);
    }
  };

  const fetchMediaFiles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        folder: currentFolder,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filterType !== 'all' && { type: filterType }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`${API_ENDPOINTS.MEDIA.FILES}?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMediaFiles(data.media || []);
        setPagination(data.pagination || pagination);
      }
    } catch (error) {
      console.error('Error fetching media files:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.MEDIA.FOLDERS, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFolders(data.folders || []);
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  // Save AWS configuration to database
  const saveAwsConfiguration = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.SETTINGS.AWS_CONFIG, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({
          bucketName: cloudConfig.aws.bucketName,
          region: cloudConfig.aws.region,
          roleArn: cloudConfig.aws.roleArn,
          externalId: cloudConfig.aws.externalId,
          accessKey: cloudConfig.aws.accessKey,
          secretKey: cloudConfig.aws.secretKey,
          sessionToken: cloudConfig.aws.sessionToken
        }),
      });

      if (response.ok) {
        const hasAccessKeys = cloudConfig.aws.accessKey && cloudConfig.aws.secretKey;
        const authMethod = hasAccessKeys ? 'Role-based + Access Keys (hybrid)' : 'Role-based (recommended)';
        alert(`✅ AWS S3 Configuration Saved Successfully!\n\n🔐 Security Status:\n• Authentication: ${authMethod}\n• Bucket configured: ${cloudConfig.aws.bucketName}\n• Region: ${cloudConfig.aws.region}\n• Role ARN: ${cloudConfig.aws.roleArn}\n• External ID: Configured\n• Ready for secure S3 operations\n\n📋 Next Steps:\n• Verify AWS IAM role trust policy matches External ID\n• Test upload functionality${hasAccessKeys ? '\n⚠️ Note: Access keys expire every 8 hours' : ''}`);
      } else {
        const error = await response.text();
        alert(`❌ Failed to save AWS configuration: ${error}`);
      }
    } catch (error) {
      console.error('Error saving AWS configuration:', error);
      alert('❌ Error saving AWS configuration. Please check your connection and try again.');
    }
  };

  // Test AWS connection
  const testAwsConnection = async () => {
    if (!isAwsAuthValid()) {
      alert('❌ Please configure all required AWS settings before testing connection.');
      return;
    }

    try {
      // Show loading state
      const testButton = document.querySelector('.btn-test-connection');
      const originalText = testButton.innerHTML;
      testButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Testing...';
      testButton.disabled = true;

      const response = await fetch(API_ENDPOINTS.MEDIA.TEST_AWS_CONNECTION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({
          bucketName: cloudConfig.aws.bucketName,
          region: cloudConfig.aws.region,
          roleArn: cloudConfig.aws.roleArn,
          externalId: cloudConfig.aws.externalId,
          accessKey: cloudConfig.aws.accessKey,
          secretKey: cloudConfig.aws.secretKey,
          sessionToken: cloudConfig.aws.sessionToken
        }),
      });

      // Restore button state
      testButton.innerHTML = originalText;
      testButton.disabled = !isAwsAuthValid();

      if (response.ok) {
        const result = await response.json();
        alert(`✅ AWS S3 Connection Successful!\n\n🔐 Connection Details:\n• Bucket: ${cloudConfig.aws.bucketName}\n• Region: ${cloudConfig.aws.region}\n• Role: ${cloudConfig.aws.roleArn}\n• Status: ${result.status || 'Connected'}\n• Timestamp: ${new Date().toLocaleString()}\n\n✨ Ready to save configuration and start uploading media!`);
      } else {
        const errorData = await response.json();
        alert(`❌ AWS S3 Connection Failed\n\n🔍 Error Details:\n${errorData.error || 'Unknown error'}\n\n💡 Common Issues:\n• Check IAM role trust policy includes External ID\n• Verify credentials are not expired\n• Ensure bucket exists and is accessible\n• Confirm region matches bucket location`);
      }
    } catch (error) {
      console.error('Error testing AWS connection:', error);
      
      // Restore button state
      const testButton = document.querySelector('.btn-test-connection');
      if (testButton) {
        testButton.innerHTML = '<i class="fa-solid fa-plug"></i> Test Connection';
        testButton.disabled = !isAwsAuthValid();
      }
      
      alert(`❌ Connection Test Failed\n\n🔍 Error: ${error.message}\n\n💡 Please check:\n• Network connectivity\n• AWS credentials validity\n• Server configuration`);
    }
  };

  // Load existing AWS configuration from database
  const loadAwsConfiguration = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.SETTINGS.AWS_CONFIG, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.awsConfig) {
          setCloudConfig(prev => ({
            ...prev,
            aws: {
              ...prev.aws,
              ...data.awsConfig
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error loading AWS configuration:', error);
    }
  };

  // Sync S3 bucket with database
  const syncS3WithDatabase = async () => {
    if (mediaServerType !== 'aws') {
      alert('S3 sync is only available for AWS storage');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.MEDIA.SYNC_S3, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Sync completed! ${result.synced} files added to database.`);
        // Refresh media files after sync
        fetchMediaFiles();
      } else {
        const error = await response.json();
        alert(`Sync failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Error syncing S3:', error);
      alert('Error syncing S3 bucket with database');
    } finally {
      setLoading(false);
    }
  };

  // Refresh AWS credentials manually
  const refreshAwsCredentials = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.MEDIA.REFRESH_CREDENTIALS, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('✅ AWS credentials refreshed successfully! You can now test the connection.');
        // Update credential status after refresh
        await fetchCredentialStatus();
      } else {
        const error = await response.json();
        alert(`❌ Failed to refresh credentials: ${error.message}`);
      }
    } catch (error) {
      console.error('Error refreshing credentials:', error);
      alert('❌ Error refreshing AWS credentials');
    } finally {
      setLoading(false);
    }
  };

  // Fetch credential status
  const fetchCredentialStatus = async () => {
    if (mediaServerType !== 'aws') return;
    
    try {
      const response = await fetch(API_ENDPOINTS.MEDIA.CREDENTIAL_STATUS, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCredentialStatus(data.status);
      }
    } catch (error) {
      console.error('Error fetching credential status:', error);
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) {
      console.log('No files selected');
      return;
    }

    console.log('Starting upload for', files.length, 'files');
    setUploading(true);
    
    const uploadPromises = Array.from(files).map(async (file) => {
      console.log('Uploading file:', file.name, 'size:', file.size);
      const formData = new FormData();
      formData.append('file', file);
      // Let backend auto-categorize based on file type instead of forcing current folder

      try {
        const response = await fetch(API_ENDPOINTS.MEDIA.UPLOAD, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          },
          body: formData,
        });

        console.log('Upload response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Upload failed:', errorText);
          throw new Error(`Upload failed for ${file.name}: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Upload successful:', result);
        return result;
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        alert(`Failed to upload ${file.name}: ${error.message}`);
        return null;
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      const successful = results.filter(r => r !== null);
      console.log(`Upload complete: ${successful.length}/${files.length} files uploaded`);
      
      if (successful.length > 0) {
        await fetchMediaFiles();
        alert(`Successfully uploaded ${successful.length} file(s)`);
      }
      setShowUploadModal(false);
    } catch (error) {
      console.error('Error during upload:', error);
      alert('Upload process failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await fetch(API_ENDPOINTS.MEDIA.FOLDERS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({
          name: newFolderName,
          parentPath: currentFolder
        }),
      });

      if (response.ok) {
        await fetchFolders();
        setNewFolderName('');
        setShowCreateFolder(false);
      }
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(API_ENDPOINTS.MEDIA.DELETE(fileId), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (response.ok) {
        await fetchMediaFiles();
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleMoveFile = async (fileId, targetFolder) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.MEDIA.FILES}/${fileId}/move`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({ targetFolder }),
      });

      if (response.ok) {
        setShowMoveModal(null);
        await fetchMediaFiles();
        alert('File moved successfully!');
      } else {
        const error = await response.text();
        alert(`Error moving file: ${error}`);
      }
    } catch (error) {
      console.error('Error moving file:', error);
      alert('Error moving file. Please try again.');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType, mimeType) => {
    if (mimeType && mimeType.startsWith('image/')) {
      return 'fa-image';
    } else if (mimeType && mimeType.startsWith('video/')) {
      return 'fa-video';
    } else if (fileType === 'pdf') {
      return 'fa-file-pdf';
    }
    return 'fa-file';
  };

  const isImage = (mimeType) => mimeType && mimeType.startsWith('image/');

  // Generate secure External ID for AWS S3 integration
  const generateExternalId = async () => {
    // Generate cryptographically secure External ID
    // Format: alphanumeric + allowed special chars (+-=,.@:/-)
    // Length: 32 characters for high entropy
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-=,.@:/-';
    const length = 32;
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    const externalId = Array.from(array, byte => chars[byte % chars.length]).join('');
    
    try {
      // Save External ID to database via settings API
      const response = await fetch(API_ENDPOINTS.SETTINGS.AWS_EXTERNAL_ID, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          externalId: externalId,
          generatedAt: new Date().toISOString(),
          generatedBy: 'admin'
        })
      });

      if (response.ok) {
        // Update the configuration
        setCloudConfig(prev => ({
          ...prev,
          aws: { 
            ...prev.aws, 
            externalId: externalId 
          }
        }));

        // Copy to clipboard
        try {
          await navigator.clipboard.writeText(externalId);
          alert(`✅ Secure External ID generated and copied to clipboard!\n\n🔐 External ID: ${externalId}\n\n⚠️ IMPORTANT SECURITY NOTES:\n• External ID has been saved securely in the database\n• Value copied to clipboard for easy AWS configuration\n• Keep this External ID secret and secure\n• Use this value in your AWS IAM role trust policy\n• Never share in public repositories or documentation\n• Rotate this ID quarterly for best security`);
        } catch (clipboardError) {
          alert(`✅ Secure External ID generated and saved!\n\n🔐 External ID: ${externalId}\n\n📋 Please manually copy this value (clipboard access not available)\n\n⚠️ IMPORTANT SECURITY NOTES:\n• External ID has been saved securely in the database\n• Keep this External ID secret and secure\n• Use this value in your AWS IAM role trust policy\n• Never share in public repositories or documentation\n• Rotate this ID quarterly for best security`);
        }
        
        console.log('Generated and saved External ID for AWS S3 integration:', externalId);
      } else {
        throw new Error('Failed to save External ID to database');
      }
    } catch (error) {
      console.error('Error saving External ID:', error);
      alert(`❌ Error saving External ID to database.\n\nGenerated ID: ${externalId}\n\nPlease contact your system administrator.`);
    }
  };

  // Copy External ID to clipboard
  const copyExternalId = async () => {
    const externalId = cloudConfig.aws.externalId;
    if (!externalId) {
      alert('No External ID available. Please generate one first.');
      return;
    }

    try {
      await navigator.clipboard.writeText(externalId);
      alert(`📋 External ID copied to clipboard!\n\n🔐 External ID: ${externalId}\n\n⚠️ Remember: Use this value in your AWS IAM role trust policy`);
    } catch (error) {
      alert(`Manual copy required:\n\n🔐 External ID: ${externalId}\n\nPlease manually copy this value (clipboard access not available)`);
    }
  };

  return (
    <div className="media-management">
      {/* Section Navigation */}
      <div className="section-navigation">
        <button 
          className={`section-tab ${activeSection === 'library' ? 'active' : ''}`}
          onClick={() => setActiveSection('library')}
        >
          <i className="fa-solid fa-images"></i>
          Media Library
        </button>
        <button 
          className={`section-tab ${activeSection === 'config' ? 'active' : ''}`}
          onClick={() => setActiveSection('config')}
        >
          <i className="fa-solid fa-gear"></i>
          Storage Configuration
        </button>
      </div>

      {/* Media Library Section */}
      {activeSection === 'library' && (
        <div className="library-section" key={`library-${currentFolder}-${mediaFiles.length}`}>
          <div className="section-header">
            <h2>Media Library</h2>
            <div className="media-actions">
              <button 
                className="btn-secondary"
                onClick={() => setShowCreateFolder(true)}
                disabled={mediaServerType === 'external'}
              >
                <i className="fa-solid fa-folder-plus"></i> New Folder
              </button>
              <button 
                className="btn-primary"
                onClick={() => setShowUploadModal(true)}
                disabled={mediaServerType === 'external'}
              >
                <i className="fa-solid fa-upload"></i> Upload Media
              </button>
              {(mediaServerType === 'oci' || mediaServerType === 'aws') && (
                <button 
                  className="btn-warning"
                  onClick={mediaServerType === 'aws' ? saveAwsConfiguration : () => alert('OCI configuration will be implemented in future version.')}
                  disabled={mediaServerType === 'aws' && !isAwsAuthValid()}
                  title={
                    mediaServerType === 'aws' 
                      ? `Save AWS S3 configuration to database. Auth: ${cloudConfig.aws.roleArn ? 'Role' : cloudConfig.aws.accessKey ? 'Keys' : 'None'}` 
                      : 'Configure OCI Object Storage'
                  }
                  style={{
                    opacity: mediaServerType === 'aws' && !isAwsAuthValid() ? 0.5 : 1
                  }}
                >
                  <i className="fa-solid fa-cloud"></i> {mediaServerType === 'aws' ? 'Save AWS Config' : 'Configure Cloud'}
                </button>
              )}
            </div>
          </div>

          {/* Current Storage Info */}
          <div className="current-storage-info">
            <span>Current Storage: <strong>{mediaServerType === 'aws' ? 'AWS S3' : mediaServerType === 'oci' ? 'Oracle Cloud' : mediaServerType === 'internal' ? 'Internal Server' : 'External Server'}</strong></span>
            <button 
              className="btn-link"
              onClick={() => setActiveSection('config')}
            >
              <i className="fa-solid fa-gear"></i> Change Storage
            </button>
          </div>

          {/* Media Controls */}
          <div className="media-controls">
            <div className="media-search">
              <input
                type="text"
                placeholder="Search media files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="media-filters">
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Files</option>
                <option value="jpg">Images (JPG)</option>
                <option value="png">Images (PNG)</option>
                <option value="gif">Images (GIF)</option>
                <option value="pdf">Documents (PDF)</option>
                <option value="mp4">Videos (MP4)</option>
              </select>
            </div>

            <div className="folder-breadcrumb">
              <span>Location: {currentFolder}</span>
            </div>
          </div>

          {/* Folder Navigation */}
          {(folders.length > 0 || currentFolder !== '/') && (
            <div className="folder-navigation">
              <h3>Folders</h3>
              <div className="folders-grid">
                {currentFolder !== '/' && (
                  <div 
                    className="folder-item back-button"
                    onClick={async () => {
                      setCurrentFolder('/');
                      // Reset pagination to page 1 when going back to root
                      setPagination(prev => ({ ...prev, page: 1 }));
                      // Clear any search/filter state that might interfere
                      setSearchTerm('');
                      setFilterType('all');
                      // Force immediate re-render by updating loading state
                      setLoading(true);
                      // Fetch data immediately - no timeout needed
                      try {
                        await Promise.all([
                          fetchFolders(),
                          fetchMediaFiles()
                        ]);
                      } catch (error) {
                        console.error('Error refreshing media library:', error);
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    <i className="fa-solid fa-arrow-up"></i>
                    <span>.. (Back to root)</span>
                  </div>
                )}
                {folders.length > 0 && folders
                  .filter(folder => {
                    // Show folders that are direct children of current folder
                    if (currentFolder === '/') {
                      return !folder.path.includes('/', 1); // Root level folders
                    }
                    return folder.path.startsWith(currentFolder) && 
                           folder.path !== currentFolder &&
                           folder.path.split('/').length === currentFolder.split('/').length + 1;
                  })
                  .map(folder => (
                    <div 
                      key={folder.id}
                      className="folder-item"
                      onClick={() => setCurrentFolder(folder.path)}
                    >
                      <i className="fa-solid fa-folder"></i>
                      <span>{folder.name}</span>
                      <small>({folder.file_count} files)</small>
                    </div>
                  ))}
                {currentFolder !== '/' && (
                  <div className="folder-current-info">
                    <i className="fa-solid fa-info-circle"></i>
                    <small>Currently viewing: {currentFolder}</small>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Media Grid */}
          {loading ? (
            <div className="loading">Loading media files...</div>
          ) : (
            <div className="media-grid">
              {mediaFiles.length === 0 ? (
                <div className="media-empty">
                  <i className="fa-solid fa-image"></i>
                  <p>No media files found</p>
                  <button 
                    className="btn-primary"
                    onClick={() => setShowUploadModal(true)}
                  >
                    Upload your first file
                  </button>
                </div>
              ) : (
                mediaFiles.map(file => (
                  <div key={file.id} className="media-item">
                    <div className="media-thumbnail">
                      {isImage(file.mime_type) ? (
                        <img 
                          src={file.thumbnail_url || file.public_url || file.signed_url} 
                          alt={file.alt_text || file.original_name}
                          onError={(e) => {
                            // If thumbnail fails, try the original image
                            if (file.thumbnail_url && e.target.src === file.thumbnail_url) {
                              e.target.src = file.public_url || file.signed_url;
                            } else {
                              // If all fails, show file icon
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }
                          }}
                          loading="lazy"
                        />
                      ) : null}
                      <div 
                        className="file-icon" 
                        style={{ display: isImage(file.mime_type) ? 'none' : 'flex' }}
                      >
                        <i className={`fa-solid ${getFileIcon(file.file_type, file.mime_type)}`}></i>
                      </div>
                    </div>
                    
                    <div className="media-info">
                      <h4 title={file.original_name}>{file.original_name}</h4>
                      <p className="file-size">{formatFileSize(file.file_size)}</p>
                      <p className="file-type">{file.file_type.toUpperCase()}</p>
                      <p className="upload-date">
                        {new Date(file.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="media-item-actions">
                      <button 
                        className="btn-icon"
                        onClick={() => window.open(file.public_url || file.signed_url, '_blank')}
                        title="View file"
                      >
                        <i className="fa-solid fa-eye"></i>
                      </button>
                      <button 
                        className="btn-icon"
                        onClick={() => navigator.clipboard.writeText(file.public_url || file.signed_url)}
                        title="Copy URL"
                      >
                        <i className="fa-solid fa-copy"></i>
                      </button>
                      <button 
                        className="btn-icon"
                        onClick={() => setShowMoveModal(file)}
                        title="Move to different folder"
                      >
                        <i className="fa-solid fa-folder-arrow-up"></i>
                      </button>
                      <button 
                        className="btn-icon delete"
                        onClick={() => handleDeleteFile(file.id)}
                        title="Delete file"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button 
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </button>
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <button 
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Configuration Section */}
      {activeSection === 'config' && (
        <div className="config-section">
          <div className="section-header">
            <h2>Storage Configuration</h2>
            <p className="section-description">Configure where your media files are stored and managed.</p>
          </div>
          
          <div className="media-server-config">
          <label>Media Server:</label>
          <select value={mediaServerType} onChange={e => setMediaServerType(e.target.value)}>
            <option value="internal">Internal (Blog Server)</option>
            <option value="oci">Oracle Cloud Infrastructure (OCI)</option>
            <option value="aws">Amazon Web Services (AWS)</option>
            <option value="external">External Media Server</option>
          </select>
          
          {mediaServerType === 'oci' && (
            <div className="cloud-media-config">
              <h4>OCI Object Storage Configuration</h4>
              <div className="config-grid">
                <div className="config-field">
                  <label>Bucket Name:</label>
                  <input
                    type="text"
                    value={cloudConfig.oci.bucketName}
                    onChange={e => setCloudConfig(prev => ({
                      ...prev,
                      oci: { ...prev.oci, bucketName: e.target.value }
                    }))}
                    placeholder="my-media-bucket"
                  />
                </div>
                <div className="config-field">
                  <label>Namespace:</label>
                  <input
                    type="text"
                    value={cloudConfig.oci.namespace}
                    onChange={e => setCloudConfig(prev => ({
                      ...prev,
                      oci: { ...prev.oci, namespace: e.target.value }
                    }))}
                    placeholder="your-tenancy-namespace"
                  />
                </div>
                <div className="config-field">
                  <label>Region:</label>
                  <select
                    value={cloudConfig.oci.region}
                    onChange={e => setCloudConfig(prev => ({
                      ...prev,
                      oci: { ...prev.oci, region: e.target.value }
                    }))}
                  >
                    <option value="us-ashburn-1">US East (Ashburn)</option>
                    <option value="us-phoenix-1">US West (Phoenix)</option>
                    <option value="eu-frankfurt-1">EU (Frankfurt)</option>
                    <option value="ap-mumbai-1">Asia Pacific (Mumbai)</option>
                  </select>
                </div>
                <div className="config-field">
                  <label>Public URL Base:</label>
                  <input
                    type="url"
                    value={cloudConfig.oci.publicUrl}
                    onChange={e => setCloudConfig(prev => ({
                      ...prev,
                      oci: { ...prev.oci, publicUrl: e.target.value }
                    }))}
                    placeholder="https://objectstorage.us-ashburn-1.oraclecloud.com/n/namespace/b/bucket/o/"
                  />
                </div>
              </div>
              <div className="media-server-status">
                <small style={{ color: 'orange' }}>
                  ⚠️ OCI integration requires proper API credentials configured on the server.
                </small>
              </div>
            </div>
          )}
          
          {mediaServerType === 'aws' && (
            <div className="cloud-media-config">
              <h4>AWS S3 Configuration</h4>
              <div className="config-info">
                <div className="security-notice">
                  <i className="fa-solid fa-shield-halved"></i>
                  <strong>Enterprise Security Configuration</strong>
                  <p>This integration uses IAM roles and AWS Organizations with Identity Center for secure, credential-free access. No IAM users or access keys are required.</p>
                </div>
              </div>
              
              <div className="aws-config-main">
                <div className="aws-config-fields">
                  <div className="config-grid">
                    <div className="config-field">
                      <label>Bucket Name:</label>
                      <input
                        type="text"
                        value={cloudConfig.aws.bucketName}
                        onChange={e => setCloudConfig(prev => ({
                          ...prev,
                          aws: { ...prev.aws, bucketName: e.target.value.trim() }
                        }))}
                        placeholder="my-media-bucket"
                      />
                    </div>
                    <div className="config-field">
                      <label>Region:</label>
                      <select
                        value={cloudConfig.aws.region}
                        onChange={e => setCloudConfig(prev => ({
                          ...prev,
                          aws: { ...prev.aws, region: e.target.value }
                        }))}
                      >
                        <option value="us-east-1">US East (N. Virginia)</option>
                        <option value="us-west-2">US West (Oregon)</option>
                        <option value="eu-west-1">Europe (Ireland)</option>
                        <option value="eu-west-2">Europe (London)</option>
                        <option value="eu-central-1">Europe (Frankfurt)</option>
                        <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                        <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
                      </select>
                    </div>
                    <div className="config-field">
                      <label>IAM Role ARN:</label>
                      <input
                        type="text"
                        value={cloudConfig.aws.roleArn || ''}
                        onChange={e => setCloudConfig(prev => ({
                          ...prev,
                          aws: { ...prev.aws, roleArn: e.target.value.trim() }
                        }))}
                        placeholder="arn:aws:iam::ACCOUNT:role/MediaUploadRole"
                      />
                      <small>Cross-account IAM role for secure access</small>
                    </div>
                <div className="config-field">
                  <label>External ID (Required):</label>
                  <div className="external-id-input-group">
                    <input
                      type="text"
                      value={cloudConfig.aws.externalId || ''}
                      onChange={e => setCloudConfig(prev => ({
                        ...prev,
                        aws: { ...prev.aws, externalId: e.target.value.trim() }
                      }))}
                      placeholder="Click Generate to create secure External ID"
                      className="external-id-input"
                      readOnly={!!cloudConfig.aws.externalId}
                    />
                    <div className="external-id-buttons">
                      <button
                        type="button"
                        className="btn-generate-external-id"
                        onClick={generateExternalId}
                        title="Generate secure External ID"
                        disabled={!!cloudConfig.aws.externalId}
                      >
                        <i className="fa-solid fa-refresh"></i> Generate
                      </button>
                      {cloudConfig.aws.externalId && (
                        <button
                          type="button"
                          className="btn-copy-external-id"
                          onClick={copyExternalId}
                          title="Copy External ID to clipboard"
                        >
                          <i className="fa-solid fa-copy"></i> Copy
                        </button>
                      )}
                      {cloudConfig.aws.externalId && (
                        <button
                          type="button"
                          className="btn-regenerate-external-id"
                          onClick={() => {
                            if (confirm('⚠️ WARNING: Regenerating the External ID will invalidate the current AWS IAM role configuration.\n\nYou will need to update your AWS IAM role trust policy with the new External ID.\n\nAre you sure you want to continue?')) {
                              setCloudConfig(prev => ({
                                ...prev,
                                aws: { ...prev.aws, externalId: '' }
                              }));
                            }
                          }}
                          title="Regenerate External ID (requires AWS configuration update)"
                        >
                          <i className="fa-solid fa-rotate"></i> Regenerate
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="external-id-info">
                    <small><strong>Critical Security:</strong> External ID prevents confused deputy attacks</small>
                    <small><strong>Requirements:</strong> 2-1,224 characters, alphanumeric + special chars (+-=,.@:/-)</small>
                    <small><strong>Best Practice:</strong> Generate unique ID per AWS account, rotate quarterly</small>
                    {cloudConfig.aws.externalId && (
                      <small><strong>Status:</strong> ✅ External ID configured and saved securely in database</small>
                    )}
                  </div>
                </div>

                  </div>
                </div>
                
                {/* Identity Center Credentials - Full Width Section */}
                <div className="identity-center-credentials-section">
                  <div className="auth-section-header">
                    <h5><i className="fa-solid fa-key"></i> Identity Center Credentials (Required)</h5>
                    <small style={{ color: '#1976d2', fontWeight: '600' }}>
                      ℹ️ Obtain these credentials from AWS Identity Center portal - refresh manually when expired
                    </small>
                  </div>
                  <div className="access-key-grid">
                    <div className="config-field">
                      <label>Access Key ID (Required):</label>
                      <input
                        type="text"
                        value={cloudConfig.aws.accessKey || ''}
                        onChange={e => setCloudConfig(prev => ({
                          ...prev,
                          aws: { ...prev.aws, accessKey: e.target.value.trim() }
                        }))}
                        placeholder="ASIA... (from Identity Center)"
                        required
                      />
                      <small style={{ color: '#28a745' }}>From Identity Center portal</small>
                    </div>
                    <div className="config-field">
                      <label>Secret Access Key (Required):</label>
                      <input
                        type="password"
                        value={cloudConfig.aws.secretKey || ''}
                        onChange={e => setCloudConfig(prev => ({
                          ...prev,
                          aws: { ...prev.aws, secretKey: e.target.value.trim() }
                        }))}
                        placeholder="Secret key..."
                        required
                      />
                      <small style={{ color: '#28a745' }}>From Identity Center portal</small>
                    </div>
                    <div className="config-field session-token-field">
                      <label>Session Token (Required):</label>
                      <input
                        type="password"
                        value={cloudConfig.aws.sessionToken || ''}
                        onChange={e => setCloudConfig(prev => ({
                          ...prev,
                          aws: { ...prev.aws, sessionToken: e.target.value.trim() }
                        }))}
                        placeholder="Session token..."
                        required
                      />
                      <small style={{ color: '#28a745' }}>From Identity Center portal (12-hour expiration)</small>
                    </div>
                  </div>
                  <div className="auth-method-note">
                    <strong>🔑 Identity Center Authentication:</strong> All credentials obtained from AWS Identity Center portal → App assumes role → Gets fresh S3 access → User refreshes credentials from portal when expired
                  </div>
                </div>
                
                <div className="aws-config-sidebar">
                  {/* Configuration Status and Save Button */}
                  <div className="config-field">
                    {/* Status Cards Container */}
                    <div className="aws-status-cards-container">
                      {/* Debug Status Card */}
                      <div className="debug-info">
                        <strong>🔧 Configuration Status:</strong><br/>
                        • Bucket: <span style={{color: cloudConfig.aws.bucketName ? 'green' : 'red'}}>{cloudConfig.aws.bucketName || 'MISSING'}</span><br/>
                        • Region: <span style={{color: cloudConfig.aws.region ? 'green' : 'red'}}>{cloudConfig.aws.region || 'MISSING'}</span><br/>
                        • Role ARN: <span style={{color: cloudConfig.aws.roleArn ? 'green' : 'red'}}>{cloudConfig.aws.roleArn ? 'SET ✅' : 'MISSING ❌'}</span><br/>
                        • External ID: <span style={{color: cloudConfig.aws.externalId ? 'green' : 'red'}}>{cloudConfig.aws.externalId ? 'SET ✅' : 'MISSING ❌'}</span><br/>
                        • Access Key: <span style={{color: cloudConfig.aws.accessKey ? 'green' : 'red'}}>{cloudConfig.aws.accessKey ? 'SET ✅' : 'REQUIRED ❌'}</span><br/>
                        • Secret Key: <span style={{color: cloudConfig.aws.secretKey ? 'green' : 'red'}}>{cloudConfig.aws.secretKey ? 'SET ✅' : 'REQUIRED ❌'}</span><br/>
                        • Session Token: <span style={{color: cloudConfig.aws.sessionToken ? 'green' : 'red'}}>{cloudConfig.aws.sessionToken ? 'SET ✅' : 'REQUIRED ❌'}</span>
                      </div>

                      {/* Credential Status Card */}
                      {credentialStatus && (
                        <div className="debug-info" style={{backgroundColor: credentialStatus.isExpired ? '#ffe6e6' : credentialStatus.isNearExpiry ? '#fff3cd' : '#e6ffe6'}}>
                          <strong>🔑 Credential Status:</strong><br/>
                          • Status: <span style={{color: credentialStatus.isExpired ? 'red' : credentialStatus.isNearExpiry ? 'orange' : 'green'}}>
                            {credentialStatus.isExpired ? 'EXPIRED ❌' : credentialStatus.isNearExpiry ? 'EXPIRING SOON ⚠️' : 'VALID ✅'}
                          </span><br/>
                          {credentialStatus.timeUntilExpiryMinutes !== null && (
                            <>• Time left: <span style={{color: credentialStatus.isNearExpiry ? 'orange' : 'green'}}>
                              {credentialStatus.timeUntilExpiryMinutes > 0 ? `${credentialStatus.timeUntilExpiryMinutes} minutes` : 'Expired'}
                            </span><br/></>
                          )}
                          • Cached: <span style={{color: credentialStatus.hasCachedCredentials ? 'green' : 'red'}}>
                            {credentialStatus.hasCachedCredentials ? 'YES ✅' : 'NO ❌'}
                          </span><br/>
                          • Auto-refresh: <span style={{color: credentialStatus.nextRefreshScheduled ? 'green' : 'red'}}>
                            {credentialStatus.nextRefreshScheduled ? 'ACTIVE ✅' : 'INACTIVE ❌'}
                          </span>
                        </div>
                      )}

                      {/* Configuration Complete Notice */}
                      <div className="aws-security-info">
                        <h5>✅ Configuration Complete</h5>
                        <p>
                          All AWS S3 settings are configured. Test connection first, then save to activate secure cloud storage.
                        </p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="action-buttons">
                      <button 
                        className="btn-test-connection"
                        onClick={testAwsConnection}
                        disabled={!isAwsAuthValid()}
                        style={{
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: '2px solid #0056b3',
                          fontSize: '14px',
                          padding: '10px 20px',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          width: '100%',
                          marginBottom: '10px',
                          opacity: !isAwsAuthValid() ? 0.5 : 1
                        }}
                      >
                        <i className="fa-solid fa-plug"></i> Test Connection
                      </button>

                      <button 
                        className="btn-refresh-credentials"
                        onClick={refreshAwsCredentials}
                        disabled={loading}
                        style={{
                          backgroundColor: '#fd7e14',
                          color: 'white',
                          border: '2px solid #e55100',
                          fontSize: '14px',
                          padding: '10px 20px',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          width: '100%',
                          marginBottom: '10px'
                        }}
                      >
                        <i className="fa-solid fa-refresh"></i> Refresh Credentials
                      </button>
                      
                      <button 
                        className="btn-save-config"
                        onClick={saveAwsConfiguration}
                        disabled={!isAwsAuthValid()}
                        style={{
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: '2px solid #1e7e34',
                          fontSize: '14px',
                          padding: '10px 20px',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          width: '100%',
                          opacity: !isAwsAuthValid() ? 0.5 : 1
                        }}
                      >
                        <i className="fa-solid fa-save"></i> Save Configuration
                      </button>
                      
                      <button 
                        className="btn-sync-s3"
                        onClick={syncS3WithDatabase}
                        disabled={mediaServerType !== 'aws'}
                        style={{
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          border: '2px solid #138496',
                          fontSize: '14px',
                          padding: '10px 20px',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          width: '100%',
                          opacity: mediaServerType !== 'aws' ? 0.5 : 1,
                          marginTop: '10px'
                        }}
                        title="Sync S3 bucket files with database records"
                      >
                        <i className="fa-solid fa-sync"></i> Sync S3 to Database
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {mediaServerType === 'aws' && (
            <div className="media-server-status">
              <div className="status-item">
                <i className="fa-solid fa-lock"></i>
                <span><strong>Private Access Only:</strong> S3 bucket configured with private access and authorized policies only</span>
              </div>
              <div className="status-item">
                <i className="fa-solid fa-users-gear"></i>
                <span><strong>Organization SSO:</strong> Uses AWS Organizations with Identity Center - no IAM users created</span>
              </div>
              <div className="status-item">
                <i className="fa-solid fa-key"></i>
                <span><strong>IAM Role Security:</strong> Temporary credentials via STS AssumeRole for enhanced security</span>
              </div>
            </div>
          )}
          
          {mediaServerType === 'external' && (
            <div className="external-media-server-url">
              <label>External Media Server URL:</label>
              <input
                type="url"
                value={externalMediaServerUrl}
                onChange={e => setExternalMediaServerUrl(e.target.value)}
                placeholder="https://mediaserver.example.com/api"
              />
              <div className="media-server-warning">
                <small style={{ color: 'orange' }}>
                  External media server integration is not yet implemented. Please use internal server for now.
                </small>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload Media</h3>
              <button onClick={() => setShowUploadModal(false)}>
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="upload-area">
                <input
                  type="file"
                  id="media-upload"
                  multiple
                  accept="image/*,video/*,.pdf"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  style={{ display: 'none' }}
                />
                <label htmlFor="media-upload" className="upload-label">
                  <i className="fa-solid fa-cloud-upload"></i>
                  <p>Click to select files or drag and drop</p>
                  <small>Supported: Images, Videos, PDFs (Max 10MB each)</small>
                </label>
              </div>
              {uploading && (
                <div className="upload-progress">
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Uploading files...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="modal-overlay" onClick={() => setShowCreateFolder(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Folder</h3>
              <button onClick={() => setShowCreateFolder(false)}>
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="folder-input"
              />
              <div className="modal-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setShowCreateFolder(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary"
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                >
                  Create Folder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Move File Modal */}
      {showMoveModal && (
        <div className="modal-overlay" onClick={() => setShowMoveModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Move File</h3>
              <button onClick={() => setShowMoveModal(null)}>
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Move <strong>{showMoveModal.filename}</strong> to:</p>
              <select 
                className="folder-select"
                onChange={(e) => {
                  if (e.target.value && confirm(`Move ${showMoveModal.filename} to ${e.target.value}?`)) {
                    handleMoveFile(showMoveModal.id, e.target.value);
                  }
                }}
                defaultValue=""
              >
                <option value="">Select destination folder...</option>
                {folders.map(folder => (
                  <option 
                    key={folder.name} 
                    value={folder.name}
                    disabled={folder.name === currentFolder}
                  >
                    {folder.name === '' ? 'Root' : folder.name}
                  </option>
                ))}
              </select>
              <div className="modal-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setShowMoveModal(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
