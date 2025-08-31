import React, { useState, useEffect } from 'react';
import './PostManagement.css';
import { API_ENDPOINTS } from '../../../config/api';

export default function PostManagement() {
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
