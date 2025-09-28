import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../../config/api';
import { postsAPI, categoriesAPI } from '../../../services/postsAPI';
import { useAdmin } from '../../../contexts/AdminContext';
import './ContentManagement.css';

export default function ContentManagement() {
  const { isAdmin, adminUser } = useAdmin();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('posts');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', color: '#3B82F6', parent_id: null });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getCategories();
      if (response.success) {
        setCategories(response.data);
      } else {
        console.error('Failed to fetch categories:', response.error);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

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
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });
        
        if (response.ok) {
          setPosts(posts.filter(post => post.id !== postId));
        } else {
          console.error('Failed to delete post:', response.status);
          alert('Failed to delete post. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Error deleting post. Please try again.');
      }
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name || newCategory.name.trim() === '') {
      alert('Category name is required!');
      return;
    }
    
    try {
      const response = await categoriesAPI.createCategory({
        name: newCategory.name.trim(),
        description: newCategory.description?.trim() || '',
        color: newCategory.color || '#3B82F6',
        parent_id: newCategory.parent_id || null
      });
      
      if (response.success) {
        // Add the new category to the local state
        setCategories([...categories, response.data.category]);
        setNewCategory({ name: '', description: '', color: '#3B82F6', parent_id: null });
        setShowAddForm(false);
        alert('Category created successfully!');
      } else {
        alert(`Failed to create category: ${response.error}`);
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Error creating category. Please try again.');
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    // Prevent deletion of Jumble category
    if (parseInt(categoryId) === 0) {
      alert('Cannot delete the default "Jumble" category!');
      return;
    }
    
    if (window.confirm(`Delete category "${categoryName}"? This cannot be undone. Any posts in this category will be moved to "Jumble".`)) {
      try {
        const response = await categoriesAPI.deleteCategory(categoryId);
        
        if (response.success) {
          // Remove the category from local state
          setCategories(categories.filter(cat => cat.id !== categoryId));
          
          // Show success message with details
          const { postsReassigned, subcategoriesUpdated } = response.data;
          let message = 'Category deleted successfully!';
          if (postsReassigned > 0) {
            message += `\n${postsReassigned} posts moved to "Jumble" category.`;
          }
          if (subcategoriesUpdated > 0) {
            message += `\n${subcategoriesUpdated} subcategories converted to main categories.`;
          }
          alert(message);
        } else {
          alert(`Failed to delete category: ${response.error}`);
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error deleting category. Please try again.');
      }
    }
  };
  
  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      description: category.description || '',
      color: category.color || '#3B82F6',
      parent_id: category.parent_id || null
    });
    setShowAddForm(true);
  };
  
  const handleUpdateCategory = async () => {
    if (!newCategory.name || newCategory.name.trim() === '') {
      alert('Category name is required!');
      return;
    }
    
    try {
      const response = await categoriesAPI.updateCategory(editingCategory.id, {
        name: newCategory.name.trim(),
        description: newCategory.description?.trim() || '',
        color: newCategory.color || '#3B82F6',
        parent_id: newCategory.parent_id || null
      });
      
      if (response.success) {
        // Update the category in local state
        setCategories(categories.map(cat => 
          cat.id === editingCategory.id ? response.data.category : cat
        ));
        setNewCategory({ name: '', description: '', color: '#3B82F6', parent_id: null });
        setEditingCategory(null);
        setShowAddForm(false);
        alert('Category updated successfully!');
      } else {
        alert(`Failed to update category: ${response.error}`);
      }
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Error updating category. Please try again.');
    }
  };
  
  const cancelCategoryForm = () => {
    setNewCategory({ name: '', description: '', color: '#3B82F6', parent_id: null });
    setEditingCategory(null);
    setShowAddForm(false);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check admin authentication
    if (!isAdmin || !adminUser) {
      alert('Admin authentication required. Please login again.');
      return;
    }

    // Validate file type
    if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
      alert('Please select a Markdown file (.md or .markdown)');
      return;
    }

    setUploadFile(file);
    setUploading(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append('markdown', file); // Use 'markdown' field name like the working script
      
      setUploadProgress(30);

      // Get admin token from localStorage (for console uploads)
      const adminToken = localStorage.getItem('adminToken');
      
      if (!adminToken) {
        throw new Error('Admin authentication required. Please login again.');
      }

      const headers = {
        'Authorization': `Bearer ${adminToken}` // Use admin token for authentication
      };

      const response = await fetch(API_ENDPOINTS.PUBLISH.MARKDOWN, {
        method: 'POST',
        headers: headers,
        body: formData,
        credentials: 'include', // Include cookies for authentication
      });

      setUploadProgress(70);

      if (response.ok) {
        const result = await response.json();
        setUploadProgress(100);
        
        setTimeout(() => {
          alert(`Post uploaded successfully!\nTitle: ${result.title}\nCategory: ${result.category}\nPost ID: ${result.postId}`);
          fetchPosts(); // Refresh the posts list
          setUploadFile(null);
          setUploading(false);
          setUploadProgress(0);
        }, 500);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`API Error (${response.status}): ${errorData.error || errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(`Failed to upload file: ${error.message}`);
      setUploadFile(null);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const triggerFileUpload = () => {
    document.getElementById('file-upload-input').click();
  };

  const renderPostsSection = () => (
    <div className="posts-section">
      {/* Hidden file input for upload functionality */}
      <input
        id="file-upload-input"
        type="file"
        accept=".md,.markdown"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      
      <div className="posts-grid">
        <div className="post-card">
          <h3>Create New Post</h3>
          <p>Start writing a new blog post</p>
          <button 
            className="btn-secondary"
            onClick={() => window.open('/write', '_blank')}
          >
            Create
          </button>
        </div>

        <div className="post-card upload-card">
          <h3>Upload Post</h3>
          <p>Upload a Markdown file from your device</p>
          {uploading ? (
            <div className="upload-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p>Uploading... {uploadProgress}%</p>
            </div>
          ) : (
            <button 
              className="btn-secondary upload-btn"
              onClick={triggerFileUpload}
            >
              <i className="fa-solid fa-upload"></i> Upload .md
            </button>
          )}
        </div>

        <div className="post-card">
          <h3>Draft Posts</h3>
          <p>Continue working on saved drafts</p>
          <button 
            className="btn-secondary"
            onClick={async () => {
              try {
                const response = await postsAPI.getDrafts();
                const drafts = response.data || [];
                if (drafts.length === 0) {
                  alert('No draft posts found');
                } else {
                  // Navigate to a proper draft management page
                  window.location.href = '/ops/drafts';
                }
              } catch (error) {
                console.error('Error fetching drafts:', error);
                alert('Failed to fetch drafts. Please try again.');
              }
            }}
          >
            View Drafts
          </button>
        </div>

        <div className="post-card">
          <h3>Published Posts</h3>
          <p>Edit or manage published content</p>
          <button 
            className="btn-secondary"
            onClick={() => {
              const published = posts.filter(post => post.status === 'published');
              alert(`Found ${published.length} published post(s). Use the Recent Posts table below to manage them.`);
            }}
          >
            Manage
          </button>
        </div>

        <div className="post-card">
          <h3>Scheduled Posts</h3>
          <p>Posts scheduled for future publication</p>
          <button 
            className="btn-secondary"
            onClick={() => {
              const scheduled = posts.filter(post => post.status === 'scheduled');
              if (scheduled.length === 0) {
                alert('No scheduled posts found');
              } else {
                alert(`Found ${scheduled.length} scheduled post(s). This feature will be enhanced in a future update.`);
              }
            }}
          >
            Schedule
          </button>
        </div>
      </div>

      <div className="recent-posts">
        <h3>Recent Posts</h3>
        {loading ? (
          <p>Loading posts...</p>
        ) : (
          <table className="ops-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.length === 0 ? (
                <tr>
                  <td colSpan="5">No posts found</td>
                </tr>
              ) : (
                posts.map(post => (
                  <tr key={post.id}>
                    <td>{post.title}</td>
                    <td>
                      <span className="category-badge">
                        {post.category || 'Technology'}
                      </span>
                    </td>
                    <td>
                      <span className={`status ${post.status.toLowerCase()}`}>
                        {post.status}
                      </span>
                    </td>
                    <td>{new Date(post.created_at).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className="btn-small"
                        onClick={() => window.open(`/write?edit=${post.id}`, '_blank')}
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
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderCategoriesSection = () => (
    <div className="categories-section">
      {showAddForm && (
        <div className="add-category-form">
          <h3>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
          <div className="form-group">
            <label>Category Name *</label>
            <input 
              type="text" 
              placeholder="e.g., Technology"
              value={newCategory.name}
              onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea 
              placeholder="Optional description for this category"
              value={newCategory.description}
              onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>Color</label>
            <input 
              type="color" 
              value={newCategory.color}
              onChange={(e) => setNewCategory({...newCategory, color: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Parent Category (Optional)</label>
            <select 
              value={newCategory.parent_id || ''}
              onChange={(e) => setNewCategory({...newCategory, parent_id: e.target.value || null})}
            >
              <option value="">-- Main Category --</option>
              {categories
                .filter(cat => cat.id !== editingCategory?.id) // Prevent self-parent
                .filter(cat => cat.id !== 0) // Hide Jumble category
                .filter(cat => !cat.parent_id) // Only show main categories as parent options
                .map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))
              }
            </select>
            <small>Select a parent category to create a subcategory (e.g., "Ice Cream" under "Food")</small>
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={editingCategory ? handleUpdateCategory : handleAddCategory}>
              {editingCategory ? 'Update Category' : 'Create Category'}
            </button>
            <button className="btn-secondary" onClick={cancelCategoryForm}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="categories-grid">
        {categories
          .sort((a, b) => {
            // Sort by parent-child relationship, then by name
            if (!a.parent_id && b.parent_id) return -1;
            if (a.parent_id && !b.parent_id) return 1;
            if (a.parent_id && b.parent_id) {
              const parentA = categories.find(c => c.id === a.parent_id)?.name || '';
              const parentB = categories.find(c => c.id === b.parent_id)?.name || '';
              if (parentA !== parentB) return parentA.localeCompare(parentB);
            }
            return a.name.localeCompare(b.name);
          })
          .map(category => {
            const parentCategory = category.parent_id ? categories.find(c => c.id === category.parent_id) : null;
            const subcategories = categories.filter(c => c.parent_id === category.id);
            
            return (
              <div key={category.id} className={`category-card ${category.parent_id ? 'subcategory' : ''}`}>
                <div className="category-info">
                  <div className="category-header">
                    <h3 style={{ color: category.color }}>
                      {category.parent_id && <span className="subcategory-indicator">↳ </span>}
                      {category.name}
                      {category.id === 0 && <span className="default-badge">Default</span>}
                    </h3>
                    {parentCategory && (
                      <p className="parent-category">under {parentCategory.name}</p>
                    )}
                  </div>
                  <p className="category-slug">/{category.slug}</p>
                  <p className="post-count">{category.post_count || 0} posts</p>
                  {subcategories.length > 0 && (
                    <p className="subcategory-count">{subcategories.length} subcategories</p>
                  )}
                  {category.description && (
                    <p className="category-description">{category.description}</p>
                  )}
                </div>
                <div className="category-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => handleEditCategory(category)}
                    disabled={category.id === 0} // Disable editing Jumble category
                    title={category.id === 0 ? 'Cannot edit default category' : 'Edit category'}
                  >
                    <i className="fa-solid fa-edit"></i> Edit
                  </button>
                  <button 
                    className="btn-danger"
                    onClick={() => handleDeleteCategory(category.id, category.name)}
                    disabled={category.id === 0} // Disable deleting Jumble category
                    title={category.id === 0 ? 'Cannot delete default category' : 'Delete category'}
                  >
                    <i className="fa-solid fa-trash"></i> Delete
                  </button>
                </div>
              </div>
            );
          })
        }
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

  return (
    <div className="content-management">
      <div className="section-header">
        <h2>Content Management</h2>
        <div className="section-tabs">
          <button 
            className={activeSection === 'posts' ? 'active' : ''}
            onClick={() => setActiveSection('posts')}
          >
            <i className="fa-solid fa-file-lines"></i> Posts
          </button>
          <button 
            className={activeSection === 'categories' ? 'active' : ''}
            onClick={() => setActiveSection('categories')}
          >
            <i className="fa-solid fa-tags"></i> Categories
          </button>
        </div>
        <div className="header-actions">
          {activeSection === 'posts' ? (
            <button 
              className="btn-primary"
              onClick={() => window.open('/write', '_blank')}
            >
              <i className="fa-solid fa-plus"></i> New Post
            </button>
          ) : (
            <button 
              className="btn-primary"
              onClick={() => {
                if (showAddForm) {
                  cancelCategoryForm();
                } else {
                  setShowAddForm(true);
                }
              }}
            >
              <i className="fa-solid fa-plus"></i> {showAddForm ? 'Cancel' : 'Add Category'}
            </button>
          )}
        </div>
      </div>

      <div className="content-sections">
        {activeSection === 'posts' ? renderPostsSection() : renderCategoriesSection()}
      </div>
    </div>
  );
}
