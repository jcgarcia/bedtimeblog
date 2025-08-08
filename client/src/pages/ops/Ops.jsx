import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { API_URL, API_ENDPOINTS } from '../../config/api.js';
import OAuthSettings from '../../components/oauth-settings/OAuthSettings';
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
      case 'oauth':
        return <OAuthSettings />;
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
          className={activeTab === 'oauth' ? 'active' : ''} 
          onClick={() => setActiveTab('oauth')}
        >
          <i className="fa-solid fa-key"></i> OAuth Config
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
      const response = await fetch(`${API_URL}/api/posts`);
      console.log('🌐 Fetching from URL:', `${API_URL}/api/posts`);
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 RAW POST DATA from API:', data);
        console.log('🔍 First post structure:', data[0]);
        console.log('🔍 Post statuses:', data.map(p => ({ id: p.id, title: p.title, status: p.status, published_at: p.published_at })));
        setPosts(data);
      } else {
        console.error('❌ API Response Error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Error details:', errorText);
      }
    } catch (error) {
      console.error('❌ Network Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    // Navigate to the existing write page
    window.location.href = '/write';
  };

  const handleViewDrafts = () => {
    // Filter to show only draft posts
    const filteredPosts = posts.filter(post => {
      return post.status === 'draft' || post.status === '' || !post.status;
    });
    
    console.log('All posts:', posts);
    console.log('Filtered draft posts:', filteredPosts);
    
    if (filteredPosts.length === 0) {
      alert('No draft posts found. All posts are published! Create a new post to get started.');
      handleCreateNew();
    } else {
      alert(`Found ${filteredPosts.length} draft posts. Check the table below.`);
    }
  };

  const handleManagePublished = () => {
    // Filter to show only published posts
    const publishedPosts = posts.filter(post => 
      post.status === 'published'
    );
    
    console.log('Published posts:', publishedPosts);
    
    if (publishedPosts.length === 0) {
      alert('No published posts found. All posts are drafts.');
    } else {
      alert(`Found ${publishedPosts.length} published posts. Check the table below.`);
    }
  };

  const handleSchedule = () => {
    // Show scheduled posts functionality
    alert('Scheduled posts feature coming soon! Use the Write page to create and schedule posts.');
    handleCreateNew();
  };

  const handleEditPost = (postId) => {
    // Navigate to the edit page for this specific post
    window.location.href = `/edit/${postId}`;
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const response = await fetch(`${API_URL}/api/posts/${postId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchPosts(); // Refresh the list
        } else {
          console.error('❌ Delete failed:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="post-management">
      <div className="section-header">
        <h2>Post Management</h2>
        <button className="btn-primary" onClick={handleCreateNew}>
          <i className="fa-solid fa-plus"></i> New Post
        </button>
      </div>

      <div className="posts-grid">
        <div className="post-card">
          <h3>Create New Post</h3>
          <p>Start writing a new blog post</p>
          <button className="btn-secondary" onClick={handleCreateNew}>Create</button>
        </div>

        <div className="post-card">
          <h3>Draft Posts</h3>
          <p>Continue working on saved drafts</p>
          <button className="btn-secondary" onClick={handleViewDrafts}>View Drafts</button>
        </div>

        <div className="post-card">
          <h3>Published Posts</h3>
          <p>Edit or manage published content</p>
          <button className="btn-secondary" onClick={handleManagePublished}>Manage</button>
        </div>

        <div className="post-card">
          <h3>Scheduled Posts</h3>
          <p>Posts scheduled for future publication</p>
          <button className="btn-secondary" onClick={handleSchedule}>Schedule</button>
        </div>
      </div>

      {/* Recent Posts Table */}
      <div className="recent-posts">
        <h3>Recent Posts</h3>
        {loading ? (
          <div className="loading">Loading posts...</div>
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
              {posts.length > 0 ? (
                posts.slice(0, 10).map(post => (
                  <tr key={post.id}>
                    <td>{post.title}</td>
                    <td>
                      <span className={`status ${post.status || 'published'}`}>
                        {post.status === 'published' ? 'Published' : 
                         post.status === 'draft' ? 'Draft' :
                         post.status || 'Published'}
                      </span>
                    </td>
                    <td>{formatDate(post.date || post.created_at)}</td>
                    <td>
                      <button 
                        className="btn-small"
                        onClick={() => handleEditPost(post.id)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn-small btn-danger"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{textAlign: 'center', padding: '20px'}}>
                    No posts found. <button onClick={handleCreateNew} className="btn-link">Create your first post</button>
                  </td>
                </tr>
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
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!newUser.username || !newUser.email || !newUser.password) {
      setMessage('Please fill in all required fields.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        setMessage('User created successfully!');
        setNewUser({ username: '', email: '', password: '', first_name: '', last_name: '' });
        setShowAddForm(false);
        fetchUsers(); // Refresh the list
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.text();
        setMessage(`Error: ${error}`);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setMessage('Network error. Please try again.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const response = await fetch(`${API_URL}/api/users/${userId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (response.ok) {
          setMessage('User deleted successfully!');
          fetchUsers(); // Refresh the list
          setTimeout(() => setMessage(''), 3000);
        } else {
          const error = await response.text();
          setMessage(`Error deleting user: ${error}`);
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        setMessage('Network error. Please try again.');
      }
    }
  };

  return (
    <div className="user-management">
      <div className="section-header">
        <h2>User Management</h2>
        <p>Manage regular users who can write and edit posts</p>
        <button 
          className="btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <i className="fa-solid fa-user-plus"></i> Add User
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {showAddForm && (
        <div className="add-user-form">
          <h3>Create New User</h3>
          <form onSubmit={handleAddUser}>
            <div className="form-row">
              <div className="form-group">
                <label>Username *</label>
                <input 
                  type="text" 
                  placeholder="johndoe"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input 
                  type="email" 
                  placeholder="john@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input 
                  type="text" 
                  placeholder="John"
                  value={newUser.first_name}
                  onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input 
                  type="text" 
                  placeholder="Doe"
                  value={newUser.last_name}
                  onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Password *</label>
              <input 
                type="password" 
                placeholder="Minimum 6 characters"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                required
                minLength="6"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">
                Create User
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="users-section">
        <h3>Registered Users</h3>
        {loading ? (
          <div className="loading">Loading users...</div>
        ) : (
          <div className="users-grid">
            {users.length > 0 ? (
              users.map(user => (
                <div key={user.id} className="user-card">
                  <div className="user-avatar">
                    <i className="fa-solid fa-user"></i>
                  </div>
                  <div className="user-info">
                    <h4>{user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}</h4>
                    <p className="user-email">{user.email}</p>
                    <p className="user-username">@{user.username}</p>
                    <p className="user-date">Joined: {new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="user-actions">
                    <button 
                      className="btn-small btn-danger"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <i className="fa-solid fa-trash"></i> Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-users">
                <p>No regular users found. Create the first user to get started!</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="user-info-box">
        <h3>👥 User System Information</h3>
        <p>This system has two types of authentication:</p>
        <ul>
          <li><strong>Regular Users (Database)</strong> - Can write, edit, and delete their own posts</li>
          <li><strong>OAuth Users (Social Media)</strong> - Can only comment on posts</li>
          <li><strong>Admin Users</strong> - Can manage all posts and users</li>
        </ul>
        <p><em>Regular users created here can log in at <code>/userlogin</code> and access the writing interface.</em></p>
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
  const [contactEmail, setContactEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // SMTP Settings State
  const [smtpSettings, setSmtpSettings] = useState({
    host: 'smtp.gmail.com',
    port: '587',
    user: '',
    password: '',
    from: '',
    secure: false
  });
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpSaveStatus, setSmtpSaveStatus] = useState(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Load settings on component mount
  useEffect(() => {
    loadContactEmail();
    loadSmtpSettings();
  }, []);

  const loadContactEmail = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.SETTINGS.CONTACT);
      if (response.ok) {
        const data = await response.json();
        setContactEmail(data.email || '');
      }
    } catch (error) {
      console.error('Error loading contact email:', error);
    }
  };

  const loadSmtpSettings = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.SETTINGS.SMTP);
      if (response.ok) {
        const data = await response.json();
        setSmtpSettings(data);
      }
    } catch (error) {
      console.error('Error loading SMTP settings:', error);
    }
  };

  const saveContactEmail = async () => {
    setIsLoading(true);
    setSaveStatus(null);

    try {
      const response = await fetch(API_ENDPOINTS.SETTINGS.CONTACT, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: contactEmail }),
      });

      if (response.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error saving contact email:', error);
      setSaveStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSmtpSettings = async () => {
    setSmtpLoading(true);
    setSmtpSaveStatus(null);
    setTestResult(null);

    try {
      const response = await fetch(API_ENDPOINTS.SETTINGS.SMTP, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(smtpSettings),
      });

      if (response.ok) {
        setSmtpSaveStatus('success');
        setTimeout(() => setSmtpSaveStatus(null), 3000);
        // Reload settings to get the masked password
        await loadSmtpSettings();
      } else {
        const errorData = await response.json();
        setSmtpSaveStatus('error');
        console.error('SMTP save error:', errorData);
      }
    } catch (error) {
      console.error('Error saving SMTP settings:', error);
      setSmtpSaveStatus('error');
    } finally {
      setSmtpLoading(false);
    }
  };

  const testSmtpConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);

    try {
      const response = await fetch(API_ENDPOINTS.SETTINGS.SMTP_TEST, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(smtpSettings),
      });

      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      console.error('Error testing SMTP connection:', error);
      setTestResult({
        success: false,
        error: 'Network error during connection test'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSmtpInputChange = (field, value) => {
    setSmtpSettings(prev => ({
      ...prev,
      [field]: value
    }));
    setTestResult(null); // Clear test results when settings change
  };

  const getSmtpPreset = (provider) => {
    const presets = {
      gmail: {
        host: 'smtp.gmail.com',
        port: '587',
        secure: false
      },
      outlook: {
        host: 'smtp-mail.outlook.com',
        port: '587',
        secure: false
      },
      yahoo: {
        host: 'smtp.mail.yahoo.com',
        port: '587',
        secure: false
      },
      sendgrid: {
        host: 'smtp.sendgrid.net',
        port: '587',
        secure: false
      }
    };
    
    if (presets[provider]) {
      setSmtpSettings(prev => ({
        ...prev,
        ...presets[provider]
      }));
      setTestResult(null);
    }
  };

  return (
    <div className="site-settings">
      <h2>Site Settings</h2>
      
      <div className="settings-section">
        <h3>Contact Settings</h3>
        <div className="setting-item">
          <label>Contact Email Address</label>
          <p className="setting-description">
            Email address where contact form messages will be sent
          </p>
          <div className="contact-email-setting">
            <input 
              type="email" 
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="blog@example.com"
              className="contact-email-input"
            />
            <button 
              onClick={saveContactEmail}
              disabled={isLoading || !contactEmail}
              className="save-contact-btn"
            >
              {isLoading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-save"></i>
                  Save
                </>
              )}
            </button>
          </div>
          {saveStatus === 'success' && (
            <div className="save-message success">
              <i className="fa-solid fa-check-circle"></i>
              Contact email updated successfully!
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="save-message error">
              <i className="fa-solid fa-exclamation-triangle"></i>
              Failed to update contact email. Please try again.
            </div>
          )}
        </div>
      </div>

      <div className="settings-section">
        <h3>📧 Email Configuration (SMTP)</h3>
        <p className="setting-description">
          Configure the email server settings to enable contact form functionality.
          These settings will be used to send contact form messages to your email.
        </p>

        <div className="smtp-presets">
          <label>Quick Setup:</label>
          <div className="preset-buttons">
            <button onClick={() => getSmtpPreset('gmail')} className="preset-btn">
              <i className="fa-brands fa-google"></i> Gmail
            </button>
            <button onClick={() => getSmtpPreset('outlook')} className="preset-btn">
              <i className="fa-brands fa-microsoft"></i> Outlook
            </button>
            <button onClick={() => getSmtpPreset('yahoo')} className="preset-btn">
              <i className="fa-brands fa-yahoo"></i> Yahoo
            </button>
            <button onClick={() => getSmtpPreset('sendgrid')} className="preset-btn">
              <i className="fa-solid fa-envelope"></i> SendGrid
            </button>
          </div>
        </div>

        <div className="smtp-form">
          <div className="smtp-row">
            <div className="setting-item">
              <label>SMTP Host</label>
              <input
                type="text"
                value={smtpSettings.host}
                onChange={(e) => handleSmtpInputChange('host', e.target.value)}
                placeholder="smtp.gmail.com"
              />
            </div>
            <div className="setting-item">
              <label>Port</label>
              <input
                type="number"
                value={smtpSettings.port}
                onChange={(e) => handleSmtpInputChange('port', e.target.value)}
                placeholder="587"
                min="1"
                max="65535"
              />
            </div>
          </div>

          <div className="setting-item">
            <label>Email Username</label>
            <input
              type="email"
              value={smtpSettings.user}
              onChange={(e) => handleSmtpInputChange('user', e.target.value)}
              placeholder="your-email@gmail.com"
            />
          </div>

          <div className="setting-item">
            <label>Email Password / App Password</label>
            <input
              type="password"
              value={smtpSettings.password}
              onChange={(e) => handleSmtpInputChange('password', e.target.value)}
              placeholder="your-password-or-app-password"
            />
            <small className="help-text">
              💡 For Gmail, use an App Password instead of your regular password. 
              Generate one at: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer">Google App Passwords</a>
            </small>
          </div>

          <div className="setting-item">
            <label>From Email Address (optional)</label>
            <input
              type="email"
              value={smtpSettings.from}
              onChange={(e) => handleSmtpInputChange('from', e.target.value)}
              placeholder="Leave blank to use username"
            />
          </div>

          <div className="setting-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={smtpSettings.secure}
                onChange={(e) => handleSmtpInputChange('secure', e.target.checked)}
              />
              Use SSL/TLS (typically for port 465)
            </label>
          </div>
        </div>

        <div className="smtp-actions">
          <button
            onClick={testSmtpConnection}
            disabled={testingConnection || !smtpSettings.host || !smtpSettings.user || !smtpSettings.password}
            className="test-btn"
          >
            {testingConnection ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                Testing Connection...
              </>
            ) : (
              <>
                <i className="fa-solid fa-plug"></i>
                Test Connection
              </>
            )}
          </button>

          <button
            onClick={saveSmtpSettings}
            disabled={smtpLoading || !smtpSettings.host || !smtpSettings.user}
            className="save-smtp-btn"
          >
            {smtpLoading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                Saving...
              </>
            ) : (
              <>
                <i className="fa-solid fa-save"></i>
                Save SMTP Settings
              </>
            )}
          </button>
        </div>

        {testResult && (
          <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
            <i className={`fa-solid ${testResult.success ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
            <div>
              <strong>{testResult.success ? 'Connection Successful!' : 'Connection Failed'}</strong>
              <p>{testResult.message || testResult.error}</p>
              {testResult.details && <small>{testResult.details}</small>}
            </div>
          </div>
        )}

        {smtpSaveStatus === 'success' && (
          <div className="save-message success">
            <i className="fa-solid fa-check-circle"></i>
            SMTP settings saved successfully! Contact form emails will now be sent using these settings.
          </div>
        )}
        {smtpSaveStatus === 'error' && (
          <div className="save-message error">
            <i className="fa-solid fa-exclamation-triangle"></i>
            Failed to save SMTP settings. Please check your configuration and try again.
          </div>
        )}

        <div className="smtp-info-box">
          <h4>🔧 SMTP Configuration Guide</h4>
          <div className="config-guide">
            <div className="guide-section">
              <strong>Gmail Setup:</strong>
              <ul>
                <li>Enable 2-factor authentication on your Google account</li>
                <li>Generate an App Password at <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer">Google App Passwords</a></li>
                <li>Use your email address as username and the App Password as password</li>
                <li>Host: smtp.gmail.com, Port: 587, SSL/TLS: Off</li>
              </ul>
            </div>
            
            <div className="guide-section">
              <strong>Security Notes:</strong>
              <ul>
                <li>🔒 All SMTP passwords are encrypted and stored securely</li>
                <li>🔐 Use app-specific passwords when available (recommended for Gmail)</li>
                <li>⚡ Test the connection before saving to ensure settings work</li>
                <li>📧 The "From" address should match your SMTP provider requirements</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

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
