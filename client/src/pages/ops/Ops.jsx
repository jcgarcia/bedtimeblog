import React, { useState } from 'react';
import './ops.css';

export default function Ops() {
  const [activeTab, setActiveTab] = useState('posts');

  // Check if user is admin (you'll implement this logic)
  const isAdmin = true; // This should come from your auth context

  if (!isAdmin) {
    return (
      <div className="ops-unauthorized">
        <h2>Unauthorized Access</h2>
        <p>You need admin privileges to access this page.</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'posts':
        return <PostManagement />;
      case 'users':
        return <UserManagement />;
      case 'settings':
        return <SiteSettings />;
      case 'analytics':
        return <Analytics />;
      case 'media':
        return <MediaManagement />;
      default:
        return <PostManagement />;
    }
  };

  return (
    <div className="ops-container">
      <div className="ops-header">
        <h1>Blog Operations Center</h1>
        <p>Manage your blog content and settings</p>
      </div>

      <div className="ops-navigation">
        <button 
          className={activeTab === 'posts' ? 'active' : ''} 
          onClick={() => setActiveTab('posts')}
        >
          <i className="fa-solid fa-file-lines"></i> Posts
        </button>
        <button 
          className={activeTab === 'users' ? 'active' : ''} 
          onClick={() => setActiveTab('users')}
        >
          <i className="fa-solid fa-users"></i> Users
        </button>
        <button 
          className={activeTab === 'settings' ? 'active' : ''} 
          onClick={() => setActiveTab('settings')}
        >
          <i className="fa-solid fa-gear"></i> Settings
        </button>
        <button 
          className={activeTab === 'analytics' ? 'active' : ''} 
          onClick={() => setActiveTab('analytics')}
        >
          <i className="fa-solid fa-chart-line"></i> Analytics
        </button>
        <button 
          className={activeTab === 'media' ? 'active' : ''} 
          onClick={() => setActiveTab('media')}
        >
          <i className="fa-solid fa-images"></i> Media
        </button>
      </div>

      <div className="ops-content">
        {renderContent()}
      </div>
    </div>
  );
}

// Post Management Component
function PostManagement() {
  const [posts, setPosts] = useState([]);

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

        <div className="post-card">
          <h3>Scheduled Posts</h3>
          <p>Posts scheduled for future publication</p>
          <button className="btn-secondary">Schedule</button>
        </div>
      </div>

      {/* Recent Posts Table */}
      <div className="recent-posts">
        <h3>Recent Posts</h3>
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
            <tr>
              <td>Sample Post Title</td>
              <td><span className="status published">Published</span></td>
              <td>Aug 4, 2025</td>
              <td>
                <button className="btn-small">Edit</button>
                <button className="btn-small btn-danger">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// User Management Component
function UserManagement() {
  return (
    <div className="user-management">
      <div className="section-header">
        <h2>User Management</h2>
        <button className="btn-primary">
          <i className="fa-solid fa-user-plus"></i> Add User
        </button>
      </div>

      <div className="users-grid">
        <div className="user-card">
          <div className="user-avatar">
            <i className="fa-solid fa-user"></i>
          </div>
          <h3>Julio Cesar Garcia</h3>
          <p>Admin</p>
          <button className="btn-secondary">Manage</button>
        </div>
      </div>
    </div>
  );
}

// Site Settings Component
function SiteSettings() {
  return (
    <div className="site-settings">
      <h2>Site Settings</h2>
      
      <div className="settings-section">
        <h3>General Settings</h3>
        <div className="setting-item">
          <label>Blog Title</label>
          <input type="text" defaultValue="Guilt & Pleasure Bedtime" />
        </div>
        <div className="setting-item">
          <label>Blog Description</label>
          <textarea defaultValue="A personal blog about life experiences"></textarea>
        </div>
      </div>

      <div className="settings-section">
        <h3>Security Settings</h3>
        <div className="setting-item">
          <label>
            <input type="checkbox" defaultChecked />
            Require admin approval for new posts
          </label>
        </div>
        <div className="setting-item">
          <label>
            <input type="checkbox" defaultChecked />
            Enable comment moderation
          </label>
        </div>
      </div>
    </div>
  );
}

// Analytics Component
function Analytics() {
  return (
    <div className="analytics">
      <h2>Analytics Dashboard</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Posts</h3>
          <p className="stat-number">24</p>
        </div>
        <div className="stat-card">
          <h3>Total Views</h3>
          <p className="stat-number">1,234</p>
        </div>
        <div className="stat-card">
          <h3>This Month</h3>
          <p className="stat-number">456</p>
        </div>
        <div className="stat-card">
          <h3>Active Users</h3>
          <p className="stat-number">12</p>
        </div>
      </div>
    </div>
  );
}

// Media Management Component
function MediaManagement() {
  return (
    <div className="media-management">
      <div className="section-header">
        <h2>Media Library</h2>
        <button className="btn-primary">
          <i className="fa-solid fa-upload"></i> Upload Media
        </button>
      </div>
      
      <div className="media-grid">
        <div className="media-item">
          <div className="media-placeholder">
            <i className="fa-solid fa-image"></i>
          </div>
          <p>No media uploaded yet</p>
        </div>
      </div>
    </div>
  );
}
