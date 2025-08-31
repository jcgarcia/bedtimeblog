import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../../config/api';

export default function MediaManagement() {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState('/');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  return (
    <div className="media-management">
      <div className="section-header">
        <h2>Media Library</h2>
        <div className="media-actions">
          <button className="btn-secondary" onClick={() => setShowCreateFolder(true)}>
            <i className="fa-solid fa-folder-plus"></i> New Folder
          </button>
          <button className="btn-primary" onClick={() => setShowUploadModal(true)}>
            <i className="fa-solid fa-upload"></i> Upload Media
          </button>
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
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
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
              <div className="folder-item" onClick={() => setCurrentFolder('/')}> 
                <i className="fa-solid fa-arrow-up"></i>
                <span>.. (Back to root)</span>
              </div>
            )}
            {folders.filter(folder => folder.path.startsWith(currentFolder) && folder.path !== currentFolder)
              .map(folder => (
                <div key={folder.id} className="folder-item" onClick={() => setCurrentFolder(folder.path)}>
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
              <button className="btn-primary" onClick={() => setShowUploadModal(true)}>
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
                  <div className="file-icon" style={{ display: isImage(file.mime_type) ? 'none' : 'flex' }}>
                    <i className={`fa-solid ${getFileIcon(file.file_type, file.mime_type)}`}></i>
                  </div>
                </div>
                <div className="media-info">
                  <h4 title={file.original_name}>{file.original_name}</h4>
                  <p className="file-size">{formatFileSize(file.file_size)}</p>
                  <p className="file-type">{file.file_type.toUpperCase()}</p>
                  <p className="upload-date">{new Date(file.created_at).toLocaleDateString()}</p>
                </div>
                <div className="media-actions">
                  <button className="btn-icon" onClick={() => window.open(file.public_url, '_blank')} title="View file">
                    <i className="fa-solid fa-eye"></i>
                  </button>
                  <button className="btn-icon" onClick={() => navigator.clipboard.writeText(file.public_url)} title="Copy URL">
                    <i className="fa-solid fa-copy"></i>
                  </button>
                  <button className="btn-icon delete" onClick={() => handleDeleteFile(file.id)} title="Delete file">
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
          <button disabled={pagination.page === 1} onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}>
            Previous
          </button>
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <button disabled={pagination.page === pagination.totalPages} onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}>
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
                <button className="btn-secondary" onClick={() => setShowCreateFolder(false)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                  Create Folder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
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
        )}
      )}
      </div>
  );
}
