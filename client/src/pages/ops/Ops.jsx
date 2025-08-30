import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { staticPagesAPI } from '../../config/apiService';
import { API_ENDPOINTS } from '../../config/api';
import './ops.css';
import CognitoAdminPanel from '../../components/cognito-admin/CognitoAdminPanel';

export default function Ops() {
  const [activeTab, setActiveTab] = useState('posts');
  const { adminUser, adminLogout } = useAdmin();

  const renderContent = () => {
    switch (activeTab) {
      case 'posts':
        return <PostManagement />;
      case 'pages':
        return <PageManagement />;
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
          className={activeTab === 'pages' ? 'active' : ''} 
          onClick={() => setActiveTab('pages')}
        >
          <i className="fa-solid fa-file-text"></i> Pages
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
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [message, setMessage] = useState('');
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'user'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      console.log('Fetching users with token:', token ? 'Token exists' : 'No token found');
      console.log('API URL:', API_ENDPOINTS.ADMIN.USERS);
      
      const response = await fetch(API_ENDPOINTS.ADMIN.USERS, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('Users data received:', data);
        setUsers(data.users);
      } else {
        const errorData = await response.text();
        console.log('Error response:', errorData);
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(API_ENDPOINTS.ADMIN.USERS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });

      const data = await response.json();

      if (response.ok) {
        setUsers([...users, data.user]);
        setNewUser({
          username: '',
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          role: 'user'
        });
        setShowAddForm(false);
        setMessage('User created successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.message || 'Error creating user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setMessage('Error creating user');
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(API_ENDPOINTS.ADMIN.USER(userId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (response.ok) {
        setUsers(users.map(user => user.id === userId ? data.user : user));
        setEditingUser(null);
        setMessage('User updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.message || 'Error updating user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setMessage('Error updating user');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(API_ENDPOINTS.ADMIN.USER(userId), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (response.ok) {
          setUsers(users.filter(user => user.id !== userId));
          setMessage('User deleted successfully!');
          setTimeout(() => setMessage(''), 3000);
        } else {
          setMessage(data.message || 'Error deleting user');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        setMessage('Error deleting user');
      }
    }
  };

  const getUserRoleColor = (role) => {
    switch (role) {
      case 'super_admin': return '#e74c3c';
      case 'admin': return '#e67e22';
      case 'editor': return '#f39c12';
      case 'author': return '#3498db';
      default: return '#95a5a6';
    }
  };

  const formatUserRole = (role) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'editor': return 'Editor';
      case 'author': return 'Author/Writer';
      default: return 'User';
    }
  };

  if (loading) {
    return (
      <div className="user-management">
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="section-header">
        <h2>User Management</h2>
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
          <form onSubmit={handleAddUser}>
            <div className="form-row">
              <div className="form-group">
                <label>Username</label>
                <input 
                  type="text" 
                  required
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  placeholder="Enter username"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="Enter email"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input 
                  type="text" 
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                  placeholder="Enter first name"
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input 
                  type="text" 
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                  placeholder="Enter last name"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="Enter password"
                  minLength="8"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select 
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="user">User</option>
                  <option value="author">Author/Writer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
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

      <div className="users-grid">
        {users.map(user => (
          <div key={user.id} className="user-card">
            <div className="user-avatar">
              <i className="fa-solid fa-user"></i>
            </div>
            <div className="user-info">
              <h3>{user.first_name && user.last_name ? 
                `${user.first_name} ${user.last_name}` : 
                user.username}
              </h3>
              <p className="user-username">@{user.username}</p>
              <p className="user-email">{user.email}</p>
              <span 
                className="user-role" 
                style={{ backgroundColor: getUserRoleColor(user.role) }}
              >
                {formatUserRole(user.role)}
              </span>
              <p className="user-status">
                <i className={`fa-solid fa-circle ${user.is_active ? 'active' : 'inactive'}`}></i>
                {user.is_active ? 'Active' : 'Inactive'}
              </p>
              <p className="user-date">
                Joined: {new Date(user.created_at).toLocaleDateString()}
              </p>
              {user.last_login_at && (
                <p className="user-last-login">
                  Last login: {new Date(user.last_login_at).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="user-actions">
              <button 
                className="btn-secondary"
                onClick={() => setEditingUser(user)}
              >
                <i className="fa-solid fa-edit"></i> Edit
              </button>
              <button 
                className="btn-danger"
                onClick={() => handleDeleteUser(user.id, user.username)}
              >
                <i className="fa-solid fa-trash"></i> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="no-users">
          <i className="fa-solid fa-users"></i>
          <h3>No users found</h3>
          <p>Create your first user by clicking the "Add User" button above.</p>
        </div>
      )}

      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit User: {editingUser.username}</h3>
              <button className="modal-close" onClick={() => setEditingUser(null)}>
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const updates = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                role: formData.get('role'),
                isActive: formData.get('isActive') === 'on'
              };
              if (formData.get('password')) {
                updates.password = formData.get('password');
              }
              handleUpdateUser(editingUser.id, updates);
            }}>
              <div className="form-group">
                <label>First Name</label>
                <input 
                  name="firstName"
                  type="text" 
                  defaultValue={editingUser.first_name || ''}
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input 
                  name="lastName"
                  type="text" 
                  defaultValue={editingUser.last_name || ''}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input 
                  name="email"
                  type="email" 
                  defaultValue={editingUser.email}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select name="role" defaultValue={editingUser.role}>
                  <option value="user">User</option>
                  <option value="author">Author/Writer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>
                  <input 
                    name="isActive"
                    type="checkbox" 
                    defaultChecked={editingUser.is_active}
                  />
                  Active User
                </label>
              </div>
              <div className="form-group">
                <label>New Password (leave blank to keep current)</label>
                <input 
                  name="password"
                  type="password" 
                  placeholder="Enter new password"
                  minLength="8"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Update User
                </button>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
  const [settings, setSettings] = useState({
    blogTitle: 'Guilt & Pleasure Bedtime',
    blogDescription: 'A personal blog about life experiences',
    requireApproval: true,
    enableModeration: true,
    enableAutoSave: true,
    autoSaveInterval: 30
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.SETTINGS.GET);
      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({
          ...prev,
          ...data
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      setMessage('');
      
      const response = await fetch(API_ENDPOINTS.SETTINGS.UPDATE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setMessage('Settings saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Error saving settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="site-settings">
      <div className="section-header">
        <h2>Site Settings</h2>
        <button 
          className="btn-primary" 
          onClick={saveSettings}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {message && (
        <div className={`settings-message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
      
      <div className="settings-section">
        <h3>General Settings</h3>
        <div className="setting-item">
          <label>Blog Title</label>
          <input 
            type="text" 
            name="blogTitle"
            value={settings.blogTitle}
            onChange={handleInputChange}
          />
        </div>
        <div className="setting-item">
          <label>Blog Description</label>
          <textarea 
            name="blogDescription"
            value={settings.blogDescription}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div className="settings-section">
        <h3>Editor Configuration</h3>
        <div className="setting-item">
          <label>
            <input 
              type="checkbox" 
              name="enableAutoSave"
              checked={settings.enableAutoSave}
              onChange={handleInputChange}
            />
            Enable auto-save for posts
          </label>
        </div>
        <div className="setting-item">
          <label>Auto-save interval (seconds)</label>
          <input 
            type="number" 
            name="autoSaveInterval"
            value={settings.autoSaveInterval}
            onChange={handleInputChange}
            min="10"
            max="300"
          />
        </div>
      </div>

      <div className="settings-section">
        <h3>Security Settings</h3>
        <div className="setting-item">
          <label>
            <input 
              type="checkbox" 
              name="requireApproval"
              checked={settings.requireApproval}
              onChange={handleInputChange}
            />
            Require admin approval for new posts
          </label>
        </div>
        <div className="setting-item">
          <label>
            <input 
              type="checkbox" 
              name="enableModeration"
              checked={settings.enableModeration}
              onChange={handleInputChange}
            />
            Enable comment moderation
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h3>AWS Cognito Integration</h3>
        <CognitoAdminPanel />
      </div>

      <OAuthSettings />
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
  // Media source selection
  const [mediaSource, setMediaSource] = useState('library'); // 'library' or 'external'
  // Media storage selection (for library)
  const [storageType, setStorageType] = useState('oci'); // 'oci' or 'aws'
  const [ociConfig, setOciConfig] = useState({
    bucket: '',
    accessKey: '',
    secretKey: '',
    region: '',
    endpoint: ''
  });
  const [awsConfig, setAwsConfig] = useState({
    bucket: '',
    accessKey: '',
    secretKey: '',
    region: '',
    endpoint: '',
    useIamRole: true
  });

  useEffect(() => {
    if (storageType === 'oci' || storageType === 'aws') {
      fetchMediaFiles();
      fetchFolders();
    } else {
      setMediaFiles([]);
      setFolders([]);
    }
  }, [currentFolder, pagination.page, filterType, searchTerm, storageType]);

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

  const response = await fetch(`${API_URL}/api/media/files?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if ((data.media || []).length === 0 && currentFolder === '/') {
          // Fallback: try fetching all files without folder filter
          const fallbackParams = new URLSearchParams({
            page: pagination.page.toString(),
            limit: pagination.limit.toString(),
            ...(filterType !== 'all' && { type: filterType }),
            ...(searchTerm && { search: searchTerm })
          });
          const fallbackResponse = await fetch(`${API_URL}/api/media/files?${fallbackParams}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          });
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            setMediaFiles(fallbackData.media || []);
            setPagination(fallbackData.pagination || pagination);
            return;
          }
        }
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
  const response = await fetch(`${API_URL}/api/media/folders`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
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

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderPath', currentFolder);

      try {
  const response = await fetch(`${API_URL}/api/media/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        return await response.json();
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        return null;
      }
    });

    try {
      await Promise.all(uploadPromises);
      await fetchMediaFiles();
      setShowUploadModal(false);
    } catch (error) {
      console.error('Error during upload:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
  const response = await fetch(`${API_URL}/api/media/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
  const response = await fetch(`${API_URL}/api/media/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
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

  // Insert UI for media server selection at the top of the return block:
  return (
    <div className="media-management">
      <div className="section-header">
        <h2>Media Center</h2>
        <div className="media-source-select" style={{marginBottom: '1em'}}>
          <label style={{marginRight: '1em'}}>Source:</label>
          <select value={mediaSource} onChange={e => setMediaSource(e.target.value)}>
            <option value="library">Media Library (OCI/AWS)</option>
            <option value="external">External Media Server</option>
          </select>
        </div>
        {mediaSource === 'library' && (
          <div className="media-server-config" style={{marginBottom: '2em', padding: '1em', border: '1px solid #eee', borderRadius: '8px'}}>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const settings = {
                  media_storage_type: storageType,
                  oci_config: ociConfig,
                  aws_config: awsConfig
                };
                try {
                  const response = await fetch(`${API_URL}/api/settings`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify(settings)
                  });
                  if (response.ok) {
                    alert('Media storage settings saved!');
                  } else {
                    alert('Failed to save settings');
                  }
                } catch (err) {
                  alert('Error saving settings');
                }
              }}
            >
              <label style={{marginRight: '1em'}}>Storage Type:</label>
              <select value={storageType} onChange={e => setStorageType(e.target.value)} style={{marginRight: '2em'}}>
                <option value="oci">OCI Object Storage</option>
                <option value="aws">AWS S3</option>
              </select>
              {storageType === 'oci' && (
                <div className="storage-config oci-config" style={{marginTop: '1em', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1em'}}>
                  <div>
                    <label>OCI Bucket Name:</label>
                    <input type="text" value={ociConfig.bucket} onChange={e => setOciConfig({ ...ociConfig, bucket: e.target.value })} />
                  </div>
                  <div>
                    <label>OCI Region:</label>
                    <input type="text" value={ociConfig.region} onChange={e => setOciConfig({ ...ociConfig, region: e.target.value })} />
                  </div>
                  <div>
                    <label>OCI Access Key:</label>
                    <input type="text" value={ociConfig.accessKey} onChange={e => setOciConfig({ ...ociConfig, accessKey: e.target.value })} />
                  </div>
                  <div>
                    <label>OCI Secret Key:</label>
                    <input type="password" value={ociConfig.secretKey} onChange={e => setOciConfig({ ...ociConfig, secretKey: e.target.value })} />
                  </div>
                  <div style={{gridColumn: '1 / span 2'}}>
                    <label>OCI Endpoint (custom, optional):</label>
                    <input type="text" value={ociConfig.endpoint} onChange={e => setOciConfig({ ...ociConfig, endpoint: e.target.value })} placeholder="https://objectstorage.region.oraclecloud.com" />
                  </div>
                </div>
              )}
              {storageType === 'aws' && (
                <div className="storage-config aws-config" style={{marginTop: '1em', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1em'}}>
                  <div style={{gridColumn: '1 / span 2'}}>
                    <label>AWS S3 Bucket Name:</label>
                    <input type="text" value={awsConfig.bucket} onChange={e => setAwsConfig({ ...awsConfig, bucket: e.target.value })} style={{width: '60%'}} />
                  </div>
                  <div>
                    <label>Target AWS Account ID:</label>
                    <input type="text" value={awsConfig.accountId || ''} onChange={e => setAwsConfig({ ...awsConfig, accountId: e.target.value })} placeholder="123456789012" />
                  </div>
                  <div>
                    <label>AWS Region:</label>
                    <input type="text" value={awsConfig.region} onChange={e => setAwsConfig({ ...awsConfig, region: e.target.value })} />
                  </div>
                  <div style={{gridColumn: '1 / span 2'}}>
                    <label>
                      <input type="checkbox" checked={awsConfig.useIamRole} onChange={e => setAwsConfig({ ...awsConfig, useIamRole: e.target.checked })} />
                      Use IAM Role (recommended for cross-account access)
                    </label>
                  </div>
                  {awsConfig.useIamRole ? (
                    <>
                      <div>
                        <label>IAM Role Name or ARN:</label>
                        <input type="text" value={awsConfig.roleArn || ''} onChange={e => setAwsConfig({ ...awsConfig, roleArn: e.target.value })} placeholder="arn:aws:iam::123456789012:role/YourRoleName" />
                      </div>
                      <div style={{gridColumn: '1 / span 2', margin: '0.5em 0', color: '#555', fontSize: '0.95em'}}>
                        <p>
                          Access Key and Secret Key are not required when using an IAM Role.<br/>
                          The backend will assume <b>this role</b> via STS for secure access.<br/>
                          <b>Make sure your EC2/K8s service account has permission to assume the target role.</b>
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label>AWS Access Key:</label>
                        <input type="text" value={awsConfig.accessKey} onChange={e => setAwsConfig({ ...awsConfig, accessKey: e.target.value })} />
                      </div>
                      <div>
                        <label>AWS Secret Key:</label>
                        <input type="password" value={awsConfig.secretKey} onChange={e => setAwsConfig({ ...awsConfig, secretKey: e.target.value })} />
                      </div>
                    </>
                  )}
                  <div style={{gridColumn: '1 / span 2'}}>
                    <label>AWS Endpoint (custom, optional):</label>
                    <input type="text" value={awsConfig.endpoint} onChange={e => setAwsConfig({ ...awsConfig, endpoint: e.target.value })} placeholder="https://s3.amazonaws.com" />
                  </div>
                </div>
              )}
              <button type="submit" className="btn-primary" style={{marginTop: '1em'}}>Save Storage Settings</button>
            </form>
          </div>
        )}
        {mediaSource === 'external' && (
          <div className="external-server-info" style={{marginBottom: '2em', padding: '1em', border: '1px solid #eee', borderRadius: '8px', background: '#fafafa'}}>
            <h3>External Media Server</h3>
            <p>Integration coming soon. Configure your external server in future releases.</p>
          </div>
        )}
        <div className="media-actions" style={{display: 'flex', gap: '1em', marginBottom: '1em'}}>
          <button 
            className="btn-secondary"
            onClick={() => setShowCreateFolder(true)}
            disabled={mediaSource !== 'library' || (storageType !== 'oci' && storageType !== 'aws')}
          >
            <i className="fa-solid fa-folder-plus"></i> New Folder
          </button>
          <button 
            className="btn-primary"
            onClick={() => setShowUploadModal(true)}
            disabled={mediaSource !== 'library' || (storageType !== 'oci' && storageType !== 'aws')}
          >
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

// Page Management Component
function PageManagement() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const response = await staticPagesAPI.getAllPages();
      if (response.success) {
        setPages(response.data);
      } else {
        setMessage('Error loading pages');
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
      setMessage('Error loading pages');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePage = async (pageId, pageTitle) => {
    if (window.confirm(`Are you sure you want to delete the page "${pageTitle}"?`)) {
      try {
        const response = await staticPagesAPI.deletePage(pageId);
        if (response.success) {
          setPages(pages.filter(page => page.id !== pageId));
          setMessage('Page deleted successfully!');
          setTimeout(() => setMessage(''), 3000);
        } else {
          setMessage('Error deleting page');
        }
      } catch (error) {
        console.error('Error deleting page:', error);
        setMessage('Error deleting page');
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#27ae60';
      case 'inactive': return '#e74c3c';
      case 'draft': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  if (loading) {
    return (
      <div className="page-management">
        <div className="loading">Loading pages...</div>
      </div>
    );
  }

  return (
    <div className="page-management">
      <div className="section-header">
        <h2>Static Page Management</h2>
        <a href="/edit-page" className="btn-primary">
          <i className="fa-solid fa-plus"></i> Create New Page
        </a>
      </div>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="pages-grid">
        <div className="page-card quick-actions">
          <h3>Quick Actions</h3>
          <div className="quick-buttons">
            <a href="/edit-page?slug=about" className="btn-secondary">
              <i className="fa-solid fa-info-circle"></i> Edit About
            </a>
            <a href="/edit-page?slug=privacy" className="btn-secondary">
              <i className="fa-solid fa-shield-alt"></i> Edit Privacy
            </a>
            <a href="/edit-page?slug=terms" className="btn-secondary">
              <i className="fa-solid fa-file-contract"></i> Edit Terms
            </a>
            <a href="/edit-page" className="btn-primary">
              <i className="fa-solid fa-plus"></i> New Page
            </a>
          </div>
        </div>

        {pages.map(page => (
          <div key={page.id} className="page-card">
            <div className="page-header">
              <h3>{page.title}</h3>
              <span 
                className="page-status" 
                style={{ backgroundColor: getStatusColor(page.status) }}
              >
                {page.status}
              </span>
            </div>
            <div className="page-info">
              <p className="page-slug">
                <i className="fa-solid fa-link"></i> /{page.slug}
              </p>
              <p className="page-template">
                <i className="fa-solid fa-layout"></i> Template: {page.template}
              </p>
              <p className="page-meta">
                <i className="fa-solid fa-calendar"></i> 
                Updated: {formatDate(page.updated_at)}
              </p>
              {page.meta_title && (
                <p className="page-seo">
                  <i className="fa-solid fa-search"></i> SEO optimized
                </p>
              )}
              {page.show_in_menu && (
                <p className="page-menu">
                  <i className="fa-solid fa-bars"></i> Shown in menu
                </p>
              )}
            </div>
            <div className="page-actions">
              <a 
                href={`/edit-page?id=${page.id}`}
                className="btn-secondary"
              >
                <i className="fa-solid fa-edit"></i> Edit
              </a>
              <a 
                href={`/${page.slug}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                <i className="fa-solid fa-external-link-alt"></i> View
              </a>
              <button 
                className="btn-danger"
                onClick={() => handleDeletePage(page.id, page.title)}
              >
                <i className="fa-solid fa-trash"></i> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {pages.length === 0 && (
        <div className="no-pages">
          <i className="fa-solid fa-file-text"></i>
          <h3>No static pages found</h3>
          <p>Create your first static page by clicking the "Create New Page" button above.</p>
          <a href="/edit-page" className="btn-primary">
            <i className="fa-solid fa-plus"></i> Create First Page
          </a>
        </div>
      )}

      <div className="page-info-box">
        <h3>📄 Static Page Management</h3>
        <p>Use this section to manage your blog's static pages like About, Privacy Policy, Terms of Service, etc.</p>
        <ul>
          <li><strong>Active Pages</strong> - Visible to visitors and indexed by search engines</li>
          <li><strong>Inactive Pages</strong> - Hidden from visitors but preserved in database</li>
          <li><strong>Draft Pages</strong> - Work-in-progress pages not yet published</li>
          <li><strong>Menu Display</strong> - Control which pages appear in navigation menu</li>
          <li><strong>SEO Settings</strong> - Configure meta titles and descriptions for better search visibility</li>
        </ul>
        <p><em>Note: Changes to pages take effect immediately after saving.</em></p>
      </div>
    </div>
  );
}

// OAuth Settings Component
function OAuthSettings() {
  const [oauthConfig, setOauthConfig] = useState({
    google: {
      enabled: false,
      clientId: '',
      clientSecret: '',
      redirectUri: ''
    },
    facebook: {
      enabled: false,
      appId: '',
      appSecret: '',
      redirectUri: ''
    },
    twitter: {
      enabled: false,
      consumerKey: '',
      consumerSecret: '',
      callbackUrl: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showSecrets, setShowSecrets] = useState({
    google: false,
    facebook: false,
    twitter: false
  });

  useEffect(() => {
    loadOAuthConfig();
  }, []);

  const loadOAuthConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/oauth', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOauthConfig(prev => ({
            ...prev,
            ...data.config
          }));
        }
      }
    } catch (error) {
      console.error('Error loading OAuth config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (provider, field, value) => {
    setOauthConfig(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  const toggleSecretVisibility = (provider) => {
    setShowSecrets(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const saveOAuthConfig = async () => {
    try {
      setLoading(true);
      setMessage('');
      
      const response = await fetch('/api/settings/oauth', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(oauthConfig)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setMessage('OAuth configuration saved successfully!');
          setTimeout(() => setMessage(''), 3000);
        } else {
          setMessage('Error saving OAuth configuration: ' + result.message);
        }
      } else {
        setMessage('Error saving OAuth configuration. Please try again.');
      }
    } catch (error) {
      console.error('Error saving OAuth config:', error);
      setMessage('Error saving OAuth configuration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const maskSecret = (secret) => {
    if (!secret || secret.length <= 4) return secret;
    return '*'.repeat(secret.length - 4) + secret.slice(-4);
  };

  return (
    <div className="settings-section oauth-settings">
      <div className="section-header">
        <h3>OAuth Authentication Settings</h3>
        <p className="section-description">
          Configure social media authentication for user login and commenting. 
          Users will be able to sign in using their social media accounts.
        </p>
      </div>

      {message && (
        <div className={`settings-message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* Google OAuth */}
      <div className="oauth-provider">
        <div className="provider-header">
          <div className="provider-info">
            <i className="fa-brands fa-google oauth-icon google"></i>
            <div>
              <h4>Google OAuth</h4>
              <p>Allow users to sign in with their Google accounts</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={oauthConfig.google.enabled}
              onChange={(e) => handleProviderChange('google', 'enabled', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {oauthConfig.google.enabled && (
          <div className="provider-config">
            <div className="config-group">
              <div className="setting-item">
                <label>Client ID</label>
                <input
                  type="text"
                  value={oauthConfig.google.clientId}
                  onChange={(e) => handleProviderChange('google', 'clientId', e.target.value)}
                  placeholder="Your Google OAuth Client ID"
                />
              </div>
              <div className="setting-item">
                <label>Client Secret</label>
                <div className="secret-input">
                  <input
                    type={showSecrets.google ? "text" : "password"}
                    value={showSecrets.google ? oauthConfig.google.clientSecret : maskSecret(oauthConfig.google.clientSecret)}
                    onChange={(e) => handleProviderChange('google', 'clientSecret', e.target.value)}
                    placeholder="Your Google OAuth Client Secret"
                  />
                  <button
                    type="button"
                    className="secret-toggle"
                    onClick={() => toggleSecretVisibility('google')}
                  >
                    <i className={`fa-solid ${showSecrets.google ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>
              <div className="setting-item">
                <label>Redirect URI</label>
                <input
                  type="text"
                  value={oauthConfig.google.redirectUri || `${window.location.origin}/auth/google/callback`}
                  onChange={(e) => handleProviderChange('google', 'redirectUri', e.target.value)}
                  placeholder="OAuth redirect URI"
                />
                <small>Add this URL to your Google OAuth app configuration</small>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Facebook OAuth */}
      <div className="oauth-provider">
        <div className="provider-header">
          <div className="provider-info">
            <i className="fa-brands fa-facebook oauth-icon facebook"></i>
            <div>
              <h4>Facebook OAuth</h4>
              <p>Allow users to sign in with their Facebook accounts</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={oauthConfig.facebook.enabled}
              onChange={(e) => handleProviderChange('facebook', 'enabled', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {oauthConfig.facebook.enabled && (
          <div className="provider-config">
            <div className="config-group">
              <div className="setting-item">
                <label>App ID</label>
                <input
                  type="text"
                  value={oauthConfig.facebook.appId}
                  onChange={(e) => handleProviderChange('facebook', 'appId', e.target.value)}
                  placeholder="Your Facebook App ID"
                />
              </div>
              <div className="setting-item">
                <label>App Secret</label>
                <div className="secret-input">
                  <input
                    type={showSecrets.facebook ? "text" : "password"}
                    value={showSecrets.facebook ? oauthConfig.facebook.appSecret : maskSecret(oauthConfig.facebook.appSecret)}
                    onChange={(e) => handleProviderChange('facebook', 'appSecret', e.target.value)}
                    placeholder="Your Facebook App Secret"
                  />
                  <button
                    type="button"
                    className="secret-toggle"
                    onClick={() => toggleSecretVisibility('facebook')}
                  >
                    <i className={`fa-solid ${showSecrets.facebook ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>
              <div className="setting-item">
                <label>Redirect URI</label>
                <input
                  type="text"
                  value={oauthConfig.facebook.redirectUri || `${window.location.origin}/auth/facebook/callback`}
                  onChange={(e) => handleProviderChange('facebook', 'redirectUri', e.target.value)}
                  placeholder="OAuth redirect URI"
                />
                <small>Add this URL to your Facebook app configuration</small>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Twitter OAuth */}
      <div className="oauth-provider">
        <div className="provider-header">
          <div className="provider-info">
            <i className="fa-brands fa-twitter oauth-icon twitter"></i>
            <div>
              <h4>Twitter OAuth</h4>
              <p>Allow users to sign in with their Twitter accounts</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={oauthConfig.twitter.enabled}
              onChange={(e) => handleProviderChange('twitter', 'enabled', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {oauthConfig.twitter.enabled && (
          <div className="provider-config">
            <div className="config-group">
              <div className="setting-item">
                <label>Consumer Key (API Key)</label>
                <input
                  type="text"
                  value={oauthConfig.twitter.consumerKey}
                  onChange={(e) => handleProviderChange('twitter', 'consumerKey', e.target.value)}
                  placeholder="Your Twitter Consumer Key"
                />
              </div>
              <div className="setting-item">
                <label>Consumer Secret (API Secret)</label>
                <div className="secret-input">
                  <input
                    type={showSecrets.twitter ? "text" : "password"}
                    value={showSecrets.twitter ? oauthConfig.twitter.consumerSecret : maskSecret(oauthConfig.twitter.consumerSecret)}
                    onChange={(e) => handleProviderChange('twitter', 'consumerSecret', e.target.value)}
                    placeholder="Your Twitter Consumer Secret"
                  />
                  <button
                    type="button"
                    className="secret-toggle"
                    onClick={() => toggleSecretVisibility('twitter')}
                  >
                    <i className={`fa-solid ${showSecrets.twitter ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>
              <div className="setting-item">
                <label>Callback URL</label>
                <input
                  type="text"
                  value={oauthConfig.twitter.callbackUrl || `${window.location.origin}/auth/twitter/callback`}
                  onChange={(e) => handleProviderChange('twitter', 'callbackUrl', e.target.value)}
                  placeholder="OAuth callback URL"
                />
                <small>Add this URL to your Twitter app configuration</small>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="oauth-actions">
        <button
          className="btn-primary"
          onClick={saveOAuthConfig}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save OAuth Configuration'}
        </button>
      </div>

      <div className="oauth-help">
        <h4>Setup Instructions</h4>
        <div className="help-section">
          <h5>🔗 Google OAuth Setup:</h5>
          <ol>
            <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">Google Cloud Console</a></li>
            <li>Create a new project or select an existing one</li>
            <li>Enable <strong>APIs & Services {'>'} Credentials</strong></li>
            <li>Create OAuth 2.0 credentials</li>
            <li>Add your redirect URI: <code>https://blog.ingasti.com/auth/google/callback</code></li>
            <li>Copy your <strong>Client ID</strong> and <strong>Client Secret</strong> and paste them above</li>
            <li>See <a href="https://developers.google.com/identity/protocols/oauth2" target="_blank" rel="noopener noreferrer">Google OAuth documentation</a> for details</li>
          </ol>
        </div>
        <div className="help-section">
          <h5>📘 Facebook OAuth Setup:</h5>
          <ol>
            <li>Go to <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer">Facebook Developers</a></li>
            <li>Create a new app and add Facebook Login</li>
            <li>Configure OAuth redirect URI: <code>https://blog.ingasti.com/auth/facebook/callback</code></li>
            <li>Get your <strong>App ID</strong> and <strong>App Secret</strong> and paste them above</li>
            <li>See <a href="https://developers.facebook.com/docs/facebook-login/" target="_blank" rel="noopener noreferrer">Facebook Login documentation</a> for details</li>
          </ol>
        </div>
        <div className="help-section">
          <h5>🐦 Twitter OAuth Setup:</h5>
          <ol>
            <li>Go to <a href="https://developer.twitter.com/" target="_blank" rel="noopener noreferrer">Twitter Developer Portal</a></li>
            <li>Create a new app and generate Consumer Keys</li>
            <li>Configure callback URL: <code>https://blog.ingasti.com/auth/twitter/callback</code></li>
            <li>Paste your <strong>Consumer Key</strong> and <strong>Consumer Secret</strong> above</li>
            <li>See <a href="https://developer.twitter.com/en/docs/authentication/oauth-1-0a" target="_blank" rel="noopener noreferrer">Twitter OAuth documentation</a> for details</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
