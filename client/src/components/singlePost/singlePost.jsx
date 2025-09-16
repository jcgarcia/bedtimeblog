import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postsAPI } from '../../config/apiService';
import { useUser } from '../../contexts/UserContext';
import { useAdmin } from '../../contexts/AdminContext';
import axios from 'axios';
import "./singlePost.css";
import PostImg from '../../media/NewPost.jpg';

export default function SinglePost() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { adminUser, isAdmin } = useAdmin();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);

  // Get current user (admin or regular user)
  const currentUser = isAdmin && adminUser ? adminUser : user;

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchLikes();
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await postsAPI.getPostById(postId);
      
      if (response.success && response.data) {
        setPost(response.data);
      } else {
        setError('Post not found');
      }
    } catch (err) {
      console.error('Error fetching post:', err);
      setError('Failed to load post. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLikes = async () => {
    try {
      const res = await axios.get(`/api/likes/${postId}`);
      setLikeCount(res.data.likes);
      // Optionally, check if current user has liked (requires backend support)
    } catch (err) {
      setLikeCount(0);
    }
  };

  const handleLike = async () => {
    if (!currentUser) return;
    try {
      await axios.post(`/api/likes/${postId}`, { userId: currentUser.id });
      setLiked(true);
      setLikeCount(likeCount + 1);
    } catch (err) {
      alert('Failed to like post.');
    }
  };

  const handleUnlike = async () => {
    if (!currentUser) return;
    try {
      await axios.delete(`/api/likes/${postId}`, { data: { userId: currentUser.id } });
      setLiked(false);
      setLikeCount(likeCount - 1);
    } catch (err) {
      alert('Failed to unlike post.');
    }
  };

  // Check if current user can edit this post
  const canEditPost = () => {
    if (!currentUser) return false;
    
    // Admins and super admins can edit any post
    if (currentUser.role === 'admin' || currentUser.role === 'super_admin') {
      return true;
    }
    
    // Editors can edit any post
    if (currentUser.role === 'editor') {
      return true;
    }
    
    // Authors/writers can edit their own posts
    if ((currentUser.role === 'author' || currentUser.role === 'writer') && post) {
      return currentUser.id === post.author_id || currentUser.username === post.username;
    }
    
    return false;
  };

  // Handle edit button click
  const handleEdit = () => {
    if (canEditPost()) {
      navigate(`/write?edit=${postId}`);
    }
  };

  // Handle delete button click
  const handleDelete = async () => {
    if (!canEditPost()) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the post "${post.title}"? This action cannot be undone.`
    );
    
    if (confirmDelete) {
      try {
        const response = await postsAPI.deletePost(postId);
        if (response.success || response.status === 200) {
          alert('Post deleted successfully!');
          // Redirect to home page after deletion
          navigate('/');
        } else {
          alert('Failed to delete post: ' + (response.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post. Please try again.');
      }
    }
  };

  // Format date to be more readable
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Extract tags from available data
  const getTags = () => {
    const tags = [];
    if (post?.status) tags.push(post.status);
    if (post?.visibility) tags.push(post.visibility);
    if (post?.category_name) tags.push(post.category_name);
    return tags;
  };

  // Render content safely (basic HTML rendering)
  const renderContent = (content) => {
    if (!content) return 'No content available';
    
    // Convert markdown-style content to basic HTML
    let html = content
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    
    // Wrap in paragraph tags
    html = '<p>' + html + '</p>';
    
    return { __html: html };
  };

  if (loading) {
    return (
      <div className='singlePost'>
        <div className="loading">
          <p>Loading post...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='singlePost'>
        <div className="error">
          <p>{error}</p>
          <button onClick={fetchPost} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className='singlePost'>
        <div className="error">
          <p>Post not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className='singlePost'>
      <div className="singlePostWrapper">
          <img 
            src={post.featured_image || PostImg}
            alt={post.title || "Blog post"} 
            className="singlePostImg" 
            />
            <h1 className="singlePostTitle">
                {post.title || 'Untitled Post'}
            {canEditPost() && (
              <div className="singlePostEdit">
                <i 
                  className="SinglePostIcon fa-regular fa-pen-to-square" 
                  onClick={handleEdit}
                  title="Edit post"
                ></i>
                <i 
                  className="SinglePostIcon fa-regular fa-trash-can"
                  onClick={handleDelete}
                  title="Delete post"
                ></i>           
              </div>
            )}
            </h1>
            {/* Likes button and count */}
            <div className="singlePostLikes">
              <button 
                className={liked ? "liked-btn" : "like-btn"}
                onClick={liked ? handleUnlike : handleLike}
                disabled={!currentUser}
              >
                {liked ? '❤️ Unlike' : '🤍 Like'}
              </button>
              <span>{likeCount} likes</span>
            </div>
            <div className="singlePostInfo">
                <span className='singlePostAuthor'>
                    Author: <b>{post.username || post.first_name || `Author ${post.author_id}` || 'Unknown'}</b>
                </span>
                <span className='singlePostDate'>
                  {post.published_at ? formatDate(post.published_at) : 
                   post.created_at ? formatDate(post.created_at) : 'Unknown date'}
                </span>
            </div>
            
            {/* Display tags if available */}
            {getTags().length > 0 && (
              <div className="singlePostTags">
                <strong>Tags: </strong>
                {getTags().map((tag, index) => (
                  <span key={index} className="singlePostTag">{tag}</span>
                ))}
              </div>
            )}
            
            {/* Display description if available */}
            {post.excerpt && (
              <div className="singlePostDescription">
                <p><em>{post.excerpt}</em></p>
              </div>
            )}
            
            {/* Display meta description if available */}
            {post.meta_description && post.meta_description !== post.excerpt && (
              <div className="singlePostDescription">
                <p><em>{post.meta_description}</em></p>
              </div>
            )}
            
            <div 
              className="singlePostContent"
              dangerouslySetInnerHTML={renderContent(post.content)}
            />
            
            {/* Display post stats */}
            <div className="singlePostStats">
              <span>👁️ {post.view_count || 0} views</span>
              <span>❤️ {post.like_count || 0} likes</span>
              <span>💬 {post.comment_count || 0} comments</span>
              {post.reading_time && <span>📖 {post.reading_time} min read</span>}
            </div>
      </div>
    </div>
  );
}
