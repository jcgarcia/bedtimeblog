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
  const [newFolderName, setNewFolderName] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
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
      externalId: ''
    }
  });

  useEffect(() => {
    if (mediaServerType === 'internal') {
      fetchMediaFiles();
      fetchFolders();
    } else if (mediaServerType === 'aws') {
      // Load existing AWS configuration including External ID
      loadAwsConfiguration();
      setMediaFiles([]);
      setFolders([]);
    } else {
      // TODO: Integrate with external media server API when available
      setMediaFiles([]);
      setFolders([]);
    }
  }, [currentFolder, pagination.page, filterType, searchTerm, mediaServerType]);

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
          externalId: cloudConfig.aws.externalId
        }),
      });

      if (response.ok) {
        alert('✅ AWS S3 Configuration Saved Successfully!\n\n🔐 Security Status:\n• IAM Role ARN configured\n• External ID secured in database\n• Region settings applied\n• Ready for secure S3 operations\n\n📋 Next Steps:\n• Ensure AWS IAM role trust policy includes your External ID\n• Test upload functionality\n• Monitor CloudTrail for access logs');
      } else {
        const error = await response.text();
        alert(`❌ Failed to save AWS configuration: ${error}`);
      }
    } catch (error) {
      console.error('Error saving AWS configuration:', error);
      alert('❌ Error saving AWS configuration. Please check your connection and try again.');
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
      formData.append('folderPath', currentFolder);

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
      <div className="section-header">
        <h2>Media Library</h2>
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
            <div className="cloud-media-config" style={{ position: 'relative' }}>
              <h4>AWS S3 Configuration</h4>
              <div className="config-info">
                <div className="security-notice">
                  <i className="fa-solid fa-shield-halved"></i>
                  <strong>Enterprise Security Configuration</strong>
                  <p>This integration uses IAM roles and AWS Organizations with Identity Center for secure, credential-free access. No IAM users or access keys are required.</p>
                </div>
              </div>
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
              
              {/* Debug Information and Save Button - Below Form */}
              <div style={{ 
                marginTop: '20px',
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                <div style={{ width: '400px' }}>
                  <div className="debug-info" style={{ 
                    background: '#f8f9fa', 
                    padding: '15px', 
                    border: '1px solid #dee2e6',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    borderRadius: '4px',
                    marginBottom: '15px'
                  }}>
                    <strong>🔧 Configuration Debug Status:</strong><br/>
                    • Bucket Name: <span style={{color: cloudConfig.aws.bucketName ? 'green' : 'red'}}>{cloudConfig.aws.bucketName || 'MISSING'}</span><br/>
                    • Region: <span style={{color: cloudConfig.aws.region ? 'green' : 'red'}}>{cloudConfig.aws.region || 'MISSING'}</span><br/>
                    • Role ARN: <span style={{color: cloudConfig.aws.roleArn ? 'green' : 'red'}}>{cloudConfig.aws.roleArn ? `${cloudConfig.aws.roleArn.substring(0, 40)}...` : 'MISSING'}</span><br/>
                    • External ID: <span style={{color: cloudConfig.aws.externalId ? 'green' : 'red'}}>{cloudConfig.aws.externalId ? 'SET ✅' : 'MISSING ❌'}</span><br/>
                    • Save Button: <span style={{color: (!cloudConfig.aws.bucketName || !cloudConfig.aws.region || !cloudConfig.aws.roleArn || !cloudConfig.aws.externalId) ? 'red' : 'green'}}>{(!cloudConfig.aws.bucketName || !cloudConfig.aws.region || !cloudConfig.aws.roleArn || !cloudConfig.aws.externalId) ? 'DISABLED ❌' : 'ENABLED ✅'}</span>
                  </div>
                  
                  <button 
                    className="btn-warning"
                    onClick={saveAwsConfiguration}
                    disabled={!cloudConfig.aws.bucketName || !cloudConfig.aws.region || !cloudConfig.aws.roleArn || !cloudConfig.aws.externalId}
                    style={{
                      backgroundColor: '#ff9800',
                      color: 'white',
                      border: '2px solid #f57c00',
                      fontSize: '16px',
                      padding: '12px 20px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      width: '100%',
                      opacity: (!cloudConfig.aws.bucketName || !cloudConfig.aws.region || !cloudConfig.aws.roleArn || !cloudConfig.aws.externalId) ? 0.5 : 1
                    }}
                  >
                    <i className="fa-solid fa-cloud-arrow-up"></i> Save AWS S3 Configuration
                  </button>
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
              disabled={mediaServerType === 'aws' && (!cloudConfig.aws.bucketName || !cloudConfig.aws.region || !cloudConfig.aws.roleArn || !cloudConfig.aws.externalId)}
              title={
                mediaServerType === 'aws' 
                  ? `Save AWS S3 configuration to database. Debug: bucket=${cloudConfig.aws.bucketName}, region=${cloudConfig.aws.region}, role=${cloudConfig.aws.roleArn}, externalId=${cloudConfig.aws.externalId ? 'SET' : 'MISSING'}` 
                  : 'Configure OCI Object Storage'
              }
              style={{
                opacity: mediaServerType === 'aws' && (!cloudConfig.aws.bucketName || !cloudConfig.aws.region || !cloudConfig.aws.roleArn || !cloudConfig.aws.externalId) ? 0.5 : 1
              }}
            >
              <i className="fa-solid fa-cloud"></i> {mediaServerType === 'aws' ? 'Save AWS Config' : 'Configure Cloud'}
            </button>
          )}
        </div>
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
      {folders.length > 0 && (
        <div className="folder-navigation">
          <h3>Folders</h3>
          <div className="folders-grid">
            {currentFolder !== '/' && (
              <div 
                className="folder-item"
                onClick={() => setCurrentFolder('/')}
              >
                <i className="fa-solid fa-arrow-up"></i>
                <span>.. (Back to root)</span>
              </div>
            )}
            {folders
              .filter(folder => folder.path.startsWith(currentFolder) && 
                               folder.path !== currentFolder)
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
                      src={file.public_url} 
                      alt={file.alt_text || file.original_name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
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

                <div className="media-actions">
                  <button 
                    className="btn-icon"
                    onClick={() => window.open(file.public_url, '_blank')}
                    title="View file"
                  >
                    <i className="fa-solid fa-eye"></i>
                  </button>
                  <button 
                    className="btn-icon"
                    onClick={() => navigator.clipboard.writeText(file.public_url)}
                    title="Copy URL"
                  >
                    <i className="fa-solid fa-copy"></i>
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
    </div>
  );
}
