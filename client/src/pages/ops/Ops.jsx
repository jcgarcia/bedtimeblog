import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { API_ENDPOINTS } from '../../config/api';
import './ops.css';

export default function Ops() {
  const [activeTab, setActiveTab] = useState('posts');
  const { adminUser, adminLogout } = useAdmin();

  const renderContent = () => {
    switch (activeTab) {
      case 'posts':
        return <PostManagement />;
      case 'users':
        return <UserManagement />;
      case 'categories':
        return <CategoryManagement />;
      case 'social':
        return <SocialMediaManagement />;
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
        <div className="admin-info">
          <span>Welcome, {adminUser?.username || 'Admin'}</span>
          <button className="btn-logout" onClick={adminLogout}>
            <i className="fa-solid fa-sign-out-alt"></i> Logout
          </button>
        </div>
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
          className={activeTab === 'categories' ? 'active' : ''} 
          onClick={() => setActiveTab('categories')}
        >
          <i className="fa-solid fa-tags"></i> Categories
        </button>
        <button 
          className={activeTab === 'social' ? 'active' : ''} 
          onClick={() => setActiveTab('social')}
        >
          <i className="fa-solid fa-share-nodes"></i> Social Media
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
  const [loading, setLoading] = useState(true);

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

// Social Media Management Component
function SocialMediaManagement() {
  const [socialLinks, setSocialLinks] = useState({
    facebook: '',
    twitter: '',
    instagram: '',
    threads: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Load current social media links
  useEffect(() => {
    fetchSocialLinks();
  }, []);

  const fetchSocialLinks = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.SETTINGS.SOCIAL);
      if (response.ok) {
        const data = await response.json();
        setSocialLinks(data);
      }
    } catch (error) {
      console.error('Error fetching social links:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (platform, value) => {
    setSocialLinks(prev => ({
      ...prev,
      [platform]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      const response = await fetch(API_ENDPOINTS.SETTINGS.SOCIAL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(socialLinks)
      });

      if (response.ok) {
        setMessage('Social media links updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error('Failed to update social media links');
      }
    } catch (error) {
      console.error('Error updating social links:', error);
      setMessage('Error updating social media links. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const validateUrl = (url) => {
    if (!url) return true; // Empty URLs are valid
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  if (loading) {
    return (
      <div className="social-management">
        <div className="loading">Loading social media settings...</div>
      </div>
    );
  }

  return (
    <div className="social-management">
      <div className="section-header">
        <h2>Social Media Links</h2>
        <p>Configure the social media links that appear in your blog's header and sidebar</p>
      </div>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="social-links-form">
        <div className="social-link-item">
          <div className="social-icon">
            <i className="fa-brands fa-square-facebook"></i>
          </div>
          <div className="social-input">
            <label>Facebook Page URL</label>
            <input
              type="url"
              placeholder="https://facebook.com/your-page"
              value={socialLinks.facebook}
              onChange={(e) => handleInputChange('facebook', e.target.value)}
              className={!validateUrl(socialLinks.facebook) ? 'invalid' : ''}
            />
            {socialLinks.facebook && !validateUrl(socialLinks.facebook) && (
              <span className="error-text">Please enter a valid URL</span>
            )}
          </div>
        </div>

        <div className="social-link-item">
          <div className="social-icon">
            <i className="fa-brands fa-square-x-twitter"></i>
          </div>
          <div className="social-input">
            <label>X (Twitter) Profile URL</label>
            <input
              type="url"
              placeholder="https://x.com/your-username"
              value={socialLinks.twitter}
              onChange={(e) => handleInputChange('twitter', e.target.value)}
              className={!validateUrl(socialLinks.twitter) ? 'invalid' : ''}
            />
            {socialLinks.twitter && !validateUrl(socialLinks.twitter) && (
              <span className="error-text">Please enter a valid URL</span>
            )}
          </div>
        </div>

        <div className="social-link-item">
          <div className="social-icon">
            <i className="fa-brands fa-square-instagram"></i>
          </div>
          <div className="social-input">
            <label>Instagram Profile URL</label>
            <input
              type="url"
              placeholder="https://instagram.com/your-username"
              value={socialLinks.instagram}
              onChange={(e) => handleInputChange('instagram', e.target.value)}
              className={!validateUrl(socialLinks.instagram) ? 'invalid' : ''}
            />
            {socialLinks.instagram && !validateUrl(socialLinks.instagram) && (
              <span className="error-text">Please enter a valid URL</span>
            )}
          </div>
        </div>

        <div className="social-link-item">
          <div className="social-icon">
            <i className="fa-brands fa-square-threads"></i>
          </div>
          <div className="social-input">
            <label>Threads Profile URL</label>
            <input
              type="url"
              placeholder="https://threads.net/@your-username"
              value={socialLinks.threads}
              onChange={(e) => handleInputChange('threads', e.target.value)}
              className={!validateUrl(socialLinks.threads) ? 'invalid' : ''}
            />
            {socialLinks.threads && !validateUrl(socialLinks.threads) && (
              <span className="error-text">Please enter a valid URL</span>
            )}
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button 
          className="btn-primary"
          onClick={handleSave}
          disabled={saving || Object.values(socialLinks).some(url => url && !validateUrl(url))}
        >
          {saving ? (
            <>
              <i className="fa-solid fa-spinner fa-spin"></i> Saving...
            </>
          ) : (
            <>
              <i className="fa-solid fa-save"></i> Save Changes
            </>
          )}
        </button>
      </div>

      <div className="social-preview">
        <h3>Preview</h3>
        <p>This is how your social media icons will appear in the blog:</p>
        <div className="preview-icons">
          {socialLinks.facebook && (
            <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer">
              <i className="fa-brands fa-square-facebook"></i>
            </a>
          )}
          {socialLinks.twitter && (
            <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer">
              <i className="fa-brands fa-square-x-twitter"></i>
            </a>
          )}
          {socialLinks.instagram && (
            <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer">
              <i className="fa-brands fa-square-instagram"></i>
            </a>
          )}
          {socialLinks.threads && (
            <a href={socialLinks.threads} target="_blank" rel="noopener noreferrer">
              <i className="fa-brands fa-square-threads"></i>
            </a>
          )}
          {!Object.values(socialLinks).some(url => url) && (
            <p className="no-links">No social media links configured yet.</p>
          )}
        </div>
      </div>

      <div className="social-info-box">
        <h3>📱 Social Media Guidelines</h3>
        <p>When setting up your social media links:</p>
        <ul>
          <li><strong>Use full URLs</strong> - Include https:// in your links</li>
          <li><strong>Test your links</strong> - Make sure they lead to the correct profiles</li>
          <li><strong>Keep them updated</strong> - Update links if you change usernames</li>
          <li><strong>Leave blank if not used</strong> - Icons won't appear for empty links</li>
          <li><strong>Examples:</strong>
            <ul>
              <li>Facebook: https://facebook.com/your-page</li>
              <li>X (Twitter): https://x.com/your-username</li>
              <li>Instagram: https://instagram.com/your-username</li>
              <li>Threads: https://threads.net/@your-username</li>
            </ul>
          </li>
        </ul>
        <p><em>Note: Changes will be reflected immediately on your blog after saving.</em></p>
      </div>
    </div>
  );
}
function CategoryManagement() {
  const [categories, setCategories] = useState([
    { id: 1, name: 'Technology', slug: 'technology', post_count: 7 },
    { id: 2, name: 'Lifestyle', slug: 'lifestyle', post_count: 0 },
    { id: 3, name: 'Tutorial', slug: 'tutorial', post_count: 0 },
    { id: 4, name: 'News', slug: 'news', post_count: 0 },
    { id: 5, name: 'Review', slug: 'review', post_count: 0 }
  ]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', slug: '' });

  const handleAddCategory = () => {
    if (newCategory.name && newCategory.slug) {
      const category = {
        id: Date.now(),
        name: newCategory.name,
        slug: newCategory.slug,
        post_count: 0
      };
      setCategories([...categories, category]);
      setNewCategory({ name: '', slug: '' });
      setShowAddForm(false);
    }
  };

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name) => {
    setNewCategory({
      name,
      slug: generateSlug(name)
    });
  };

  return (
    <div className="category-management">
      <div className="section-header">
        <h2>Category Management</h2>
        <button 
          className="btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <i className="fa-solid fa-plus"></i> Add Category
        </button>
      </div>

      {showAddForm && (
        <div className="add-category-form">
          <div className="form-group">
            <label>Category Name</label>
            <input 
              type="text" 
              placeholder="e.g., Technology"
              value={newCategory.name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Slug (URL-friendly)</label>
            <input 
              type="text" 
              placeholder="e.g., technology"
              value={newCategory.slug}
              onChange={(e) => setNewCategory({...newCategory, slug: e.target.value})}
            />
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={handleAddCategory}>
              Create Category
            </button>
            <button className="btn-secondary" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="categories-grid">
        {categories.map(category => (
          <div key={category.id} className="category-card">
            <div className="category-info">
              <h3>{category.name}</h3>
              <p className="category-slug">/{category.slug}</p>
              <p className="post-count">{category.post_count} posts</p>
            </div>
            <div className="category-actions">
              <button className="btn-secondary">
                <i className="fa-solid fa-edit"></i> Edit
              </button>
              <button className="btn-danger">
                <i className="fa-solid fa-trash"></i> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="category-info-box">
        <h3>📋 Post Category Guidelines</h3>
        <p>When creating or editing posts, make sure to:</p>
        <ul>
          <li><strong>Select a category</strong> - Every post should belong to a category</li>
          <li><strong>Use relevant categories</strong> - Choose the most appropriate category for your content</li>
          <li><strong>Technology</strong> - Programming, tools, software, hardware, tech reviews</li>
          <li><strong>Lifestyle</strong> - Personal experiences, life tips, productivity</li>
          <li><strong>Tutorial</strong> - Step-by-step guides, how-to articles</li>
          <li><strong>News</strong> - Industry news, updates, announcements</li>
          <li><strong>Review</strong> - Product reviews, book reviews, service reviews</li>
        </ul>
        <p><em>Note: All existing posts have been automatically assigned to the Technology category.</em></p>
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
