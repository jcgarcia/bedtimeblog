import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../../config/api';

export default function PostManagement() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState([]);
  const [publishedPosts, setPublishedPosts] = useState([]);
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.POSTS.LIST);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
        
        // Separate posts by status
        setDrafts(data.filter(post => post.status === 'draft'));
        setPublishedPosts(data.filter(post => post.status === 'published'));
        setScheduledPosts(data.filter(post => post.status === 'scheduled'));
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Navigation handlers
  const handleCreateNewPost = () => {
    navigate('/write');
  };

  const handleViewDrafts = () => {
    // For now, we'll show an alert with draft count, but this could navigate to a drafts page
    if (drafts.length === 0) {
      alert('No draft posts found. Create a new post to start writing!');
    } else {
      alert(`You have ${drafts.length} draft post(s). Check the Recent Posts table below to edit them.`);
    }
  };

  const handleManagePublished = () => {
    if (publishedPosts.length === 0) {
      alert('No published posts found. Create and publish a post first!');
    } else {
      alert(`You have ${publishedPosts.length} published post(s). Check the Recent Posts table below to manage them.`);
    }
  };

  const handleSchedulePosts = () => {
    if (scheduledPosts.length === 0) {
      alert('No scheduled posts found. Create a post and set its status to "Scheduled"!');
    } else {
      alert(`You have ${scheduledPosts.length} scheduled post(s). Check the Recent Posts table below to manage them.`);
    }
  };

  const handleEditPost = (postId) => {
    navigate(`/write?edit=${postId}`);
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
        <button className="btn-primary" onClick={handleCreateNewPost}>
          <i className="fa-solid fa-plus"></i> New Post
        </button>
      </div>

      <div className="posts-grid">
        <div className="post-card">
          <h3>Create New Post</h3>
          <p>Start writing a new blog post</p>
          <button className="btn-secondary" onClick={handleCreateNewPost}>Create</button>
        </div>

        <div className="post-card">
          <h3>Draft Posts</h3>
          <p>Continue working on saved drafts ({drafts.length})</p>
          <button className="btn-secondary" onClick={handleViewDrafts}>View Drafts</button>
        </div>

        <div className="post-card">
          <h3>Published Posts</h3>
          <p>Edit or manage published content ({publishedPosts.length})</p>
          <button className="btn-secondary" onClick={handleManagePublished}>Manage</button>
        </div>

        <div className="post-card">
          <h3>Scheduled Posts</h3>
          <p>Posts scheduled for future publication ({scheduledPosts.length})</p>
          <button className="btn-secondary" onClick={handleSchedulePosts}>Schedule</button>
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
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
