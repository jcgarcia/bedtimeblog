import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../../config/api';
import './ContentManagement.css';

export default function ContentManagement() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([
    { id: 1, name: 'Technology', slug: 'technology', post_count: 7 },
    { id: 2, name: 'Lifestyle', slug: 'lifestyle', post_count: 0 },
    { id: 3, name: 'Tutorial', slug: 'tutorial', post_count: 0 },
    { id: 4, name: 'News', slug: 'news', post_count: 0 },
    { id: 5, name: 'Review', slug: 'review', post_count: 0 }
  ]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('posts');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', slug: '' });

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

  const renderPostsSection = () => (
    <div className="posts-section">
      <div className="posts-grid">
        <div className="post-card">
          <h3>Create New Post</h3>
          <p>Start writing a new blog post</p>
          <button 
            className="btn-secondary"
            onClick={() => window.open('/create-post', '_blank')}
          >
            Create
          </button>
        </div>

        <div className="post-card">
          <h3>Draft Posts</h3>
          <p>Continue working on saved drafts</p>
          <button 
            className="btn-secondary"
            onClick={() => {
              const drafts = posts.filter(post => post.status === 'draft');
              if (drafts.length === 0) {
                alert('No draft posts found');
              } else {
                alert(`Found ${drafts.length} draft post(s). This feature will show drafts in a future update.`);
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
                        onClick={() => window.open(`/create-post?edit=${post.id}`, '_blank')}
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
              <button 
                className="btn-secondary"
                onClick={() => {
                  const newName = prompt('Enter new category name:', category.name);
                  if (newName && newName !== category.name) {
                    setCategories(categories.map(cat => 
                      cat.id === category.id 
                        ? {...cat, name: newName, slug: generateSlug(newName)}
                        : cat
                    ));
                  }
                }}
              >
                <i className="fa-solid fa-edit"></i> Edit
              </button>
              <button 
                className="btn-danger"
                onClick={() => {
                  if (window.confirm(`Delete category "${category.name}"? This cannot be undone.`)) {
                    setCategories(categories.filter(cat => cat.id !== category.id));
                  }
                }}
              >
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
              onClick={() => window.open('/create-post', '_blank')}
            >
              <i className="fa-solid fa-plus"></i> New Post
            </button>
          ) : (
            <button 
              className="btn-primary"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <i className="fa-solid fa-plus"></i> Add Category
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
