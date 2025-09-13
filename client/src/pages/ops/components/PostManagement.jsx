import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../../config/api';

export default function PostManagement() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.POSTS.LIST);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const response = await fetch(API_ENDPOINTS.POSTS.DELETE(postId), {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setPosts(posts.filter(post => post.id !== postId));
        }
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
      setUploadStatus({
        type: 'error',
        message: 'Please select a Markdown file (.md or .markdown)'
      });
      return;
    }

    setUploadLoading(true);
    setUploadStatus(null);
    setUploadProgress('Validating file...');

    try {
      // Read and validate file content
      const fileContent = await file.text();
      
      // Check for frontmatter
      const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
      const match = fileContent.match(frontmatterRegex);
      
      if (!match) {
        setUploadStatus({
          type: 'error',
          message: 'Invalid markdown file: Missing frontmatter. Please ensure your file has frontmatter with title and description.'
        });
        setUploadLoading(false);
        setUploadProgress(null);
        return;
      }

      const frontmatterText = match[1];
      const hasTitle = frontmatterText.includes('title:');
      const hasDescription = frontmatterText.includes('description:');

      if (!hasTitle || !hasDescription) {
        setUploadStatus({
          type: 'error',
          message: 'Invalid markdown file: Missing required frontmatter fields (title, description).'
        });
        setUploadLoading(false);
        setUploadProgress(null);
        return;
      }

      setUploadProgress('Uploading file...');

      // Upload the file
      const formData = new FormData();
      formData.append('markdown', file);

      const response = await fetch(API_ENDPOINTS.PUBLISH.MARKDOWN, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Upload failed (${response.status}): ${errorData.error || errorData.message || 'Unknown error'}`);
      }

      const result = await response.json();
      
      setUploadStatus({
        type: 'success',
        message: `Post "${result.title}" published successfully!`,
        details: {
          title: result.title,
          category: result.category,
          postId: result.postId,
          publishedAt: result.publishedAt
        }
      });

      // Refresh posts list
      fetchPosts();

    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: error.message
      });
    } finally {
      setUploadLoading(false);
      setUploadProgress(null);
      // Reset file input
      event.target.value = '';
    }
  };

  const clearUploadStatus = () => {
    setUploadStatus(null);
  };

  return (
    <div className="post-management">
      <div className="section-header">
        <h2>Post Management</h2>
        <button className="btn-primary">
          <i className="fa-solid fa-plus"></i> New Post
        </button>
      </div>

      <div className="posts-grid">
        <div className="post-card">
          <h3>Create New Post</h3>
          <p>Start writing a new blog post</p>
          <button className="btn-secondary">Create</button>
        </div>

        <div className="post-card">
          <h3>Draft Posts</h3>
          <p>Continue working on saved drafts</p>
          <button className="btn-secondary">View Drafts</button>
        </div>

        <div className="post-card">
          <h3>Published Posts</h3>
          <p>Edit or manage published content</p>
          <button className="btn-secondary">Manage</button>
        </div>

        <div className="post-card" style={{
          backgroundColor: '#e8f5e8', 
          border: '5px solid #4CAF50', 
          boxShadow: '0 0 20px rgba(76, 175, 80, 0.3)',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '-10px',
            right: '-10px',
            backgroundColor: '#FF4444',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '15px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            NEW!
          </div>
          <h3 style={{color: '#2E7D32', fontSize: '1.4rem', textAlign: 'center'}}>
            📤 UPLOAD POSTS FROM DEVICE 📤
          </h3>
          <p style={{color: '#2E7D32', fontWeight: 'bold', textAlign: 'center'}}>
            🎯 Upload markdown files from your local device 🎯
          </p>
          <div className="upload-area" style={{textAlign: 'center'}}>
            <input
              type="file"
              id="markdown-upload"
              accept=".md,.markdown"
              onChange={handleFileUpload}
              disabled={uploadLoading}
              style={{ display: 'none' }}
            />
            <label 
              htmlFor="markdown-upload" 
              className={`btn-secondary upload-btn ${uploadLoading ? 'disabled' : ''}`}
              style={{
                backgroundColor: '#4CAF50', 
                color: 'white', 
                border: 'none',
                padding: '15px 25px',
                fontSize: '18px',
                fontWeight: 'bold',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
              }}
            >
              {uploadLoading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  {uploadProgress || 'Uploading...'}
                </>
              ) : (
                <>
                  📁 CLICK TO SELECT MARKDOWN FILE 📁
                </>
              )}
            </label>
          </div>
          
          {uploadStatus && (
            <div className={`upload-status ${uploadStatus.type}`}>
              <div className="status-header">
                <i className={`fa-solid ${uploadStatus.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                <span>{uploadStatus.message}</span>
                <button 
                  className="close-status" 
                  onClick={clearUploadStatus}
                  title="Dismiss"
                >
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
              {uploadStatus.details && (
                <div className="status-details">
                  <p><strong>Title:</strong> {uploadStatus.details.title}</p>
                  <p><strong>Category:</strong> {uploadStatus.details.category}</p>
                  <p><strong>Post ID:</strong> {uploadStatus.details.postId}</p>
                  <p><strong>Published:</strong> {new Date(uploadStatus.details.publishedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent Posts Table */}
      <div className="recent-posts">
        <h3>Recent Posts</h3>
        {loading ? (
          <p>Loading posts...</p>
        ) : (
          <table className="ops-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.length === 0 ? (
                <tr>
                  <td colSpan="4">No posts found</td>
                </tr>
              ) : (
                posts.map(post => (
                  <tr key={post.id}>
                    <td>{post.title}</td>
                    <td>
                      <span className={`status ${post.status.toLowerCase()}`}>
                        {post.status}
                      </span>
                    </td>
                    <td>{new Date(post.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn-small">Edit</button>
                      <button 
                        className="btn-small btn-danger"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
