import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postsAPI } from '../../config/apiService';
import { useAdmin } from '../../contexts/AdminContext';
import { API_URL } from '../../config/api';
import "./singlePost.css";
import PostImg from '../../media/NewPost.jpg';

export default function SinglePost() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { adminUser } = useAdmin();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  // Debug admin user state
  useEffect(() => {
    console.log('🔐 SinglePost AdminUser State:', {
      adminUser,
      hasAdminUser: !!adminUser,
      adminUserKeys: adminUser ? Object.keys(adminUser) : 'none',
      adminUserRole: adminUser?.role,
      adminUserId: adminUser?.id
    });
  }, [adminUser]);

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
    if (post?.category_id) tags.push(`Category ${post.category_id}`);
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

  // Check if user can edit this post (admin or author)
  const canEditPost = () => {
    console.log('🔑 Checking edit permissions:', { 
      adminUser, 
      postAuthorId: post?.author_id,
      hasAdminUser: !!adminUser,
      adminUserRole: adminUser?.role,
      adminUserId: adminUser?.id,
      isAdmin: adminUser?.role === 'admin',
      isAuthor: adminUser?.id === post?.author_id
    });
    
    if (!adminUser) {
      console.log('❌ No admin user found');
      return false;
    }
    
    // If user is admin, they can edit any post
    if (adminUser.role === 'admin') {
      console.log('✅ User is admin - can edit any post');
      return true;
    }
    
    // If user is the author of the post, they can edit it
    if (adminUser.id === post?.author_id) {
      console.log('✅ User is post author - can edit');
      return true;
    }
    
    console.log('❌ User cannot edit this post');
    return false;
  };

  // Handle edit post
  const handleEditPost = () => {
    console.log('🔧 Edit button clicked for post:', postId);
    console.log('🔑 Current admin user:', adminUser);
    
    if (!adminUser) {
      alert('You need to be logged in as an admin to edit posts. Please log in through the Operations Panel.');
      navigate('/ops');
      return;
    }
    
    if (!canEditPost()) {
      alert(`You do not have permission to edit this post. You can only edit posts you created or if you're an admin.`);
      return;
    }
    
    console.log('🔧 Navigating to edit page for post:', postId);
    // Navigate directly to the edit page for this specific post
    navigate(`/edit/${postId}`);
  };

  // Handle delete post
  const handleDeletePost = async () => {
    console.log('🗑️ Delete button clicked for post:', postId);
    console.log('🔑 Current admin user:', adminUser);
    
    if (!adminUser) {
      alert('You need to be logged in as an admin to delete posts. Please log in through the Operations Panel.');
      navigate('/ops');
      return;
    }
    
    if (!canEditPost()) {
      alert(`You do not have permission to delete this post. You can only delete posts you created or if you're an admin.`);
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${post.title}"? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include', // Include cookies for authentication
      });

      if (response.ok) {
        alert('Post deleted successfully!');
        navigate('/'); // Redirect to home page
      } else {
        const errorText = await response.text();
        console.error('Delete failed:', response.status, errorText);
        alert('Failed to delete post. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Error deleting post. Please check your connection and try again.');
    }
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
              <div className="singlePostEdit">
                  <i 
                    className={`SinglePostIcon fa-regular fa-pen-to-square ${canEditPost() ? 'authorized' : 'unauthorized'}`}
                    onClick={handleEditPost}
                    title={canEditPost() ? "Edit post" : "Login required to edit"}
                    style={{ cursor: 'pointer' }}
                  ></i>
                  <i 
                    className={`SinglePostIcon fa-regular fa-trash-can ${canEditPost() ? 'authorized' : 'unauthorized'}`}
                    onClick={handleDeletePost}
                    title={canEditPost() ? "Delete post" : "Login required to delete"}
                    style={{ cursor: 'pointer' }}
                  ></i>           
              </div>
            </h1>
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
