import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';
import { API_URL } from '../../config/api';
import "./write.css";
import PostImg from '../../media/NewPost.jpg';

export default function Write() {
  const { postId } = useParams(); // Get postId from URL if editing
  const navigate = useNavigate();
  const { adminUser } = useAdmin();
  
  const [post, setPost] = useState({
    title: '',
    content: '',
    featured_image: '',
    category_id: 1, // Default category
    status: 'published'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    if (!adminUser) {
      alert('You must be logged in to write or edit posts.');
      navigate('/ops');
      return;
    }
  }, [adminUser, navigate]);

  // Load post data if editing
  useEffect(() => {
    if (postId) {
      setIsEditing(true);
      fetchPost();
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/posts/${postId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setPost({
          title: data.title || '',
          content: data.content || '',
          featured_image: data.featured_image || '',
          category_id: data.category_id || 1,
          status: data.status || 'published'
        });
      } else {
        alert('Failed to load post for editing.');
        navigate('/ops');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      alert('Error loading post. Please try again.');
      navigate('/ops');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setPost(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // For now, we'll just store the file name
      // In a full implementation, you'd upload this to a server
      handleInputChange('featured_image', file.name);
      alert('Image selected. Note: Full image upload functionality needs to be implemented.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!post.title.trim() || !post.content.trim()) {
      alert('Please fill in both title and content.');
      return;
    }

    try {
      setSaving(true);
      
      const url = isEditing 
        ? `${API_URL}/api/posts/${postId}`
        : `${API_URL}/api/posts`;
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: post.title,
          content: post.content,
          desc: post.content, // Legacy support
          img: post.featured_image,
          cat: post.category_id,
          status: post.status
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(isEditing ? 'Post updated successfully!' : 'Post created successfully!');
        
        // Navigate to the post or back to operations
        if (isEditing) {
          navigate(`/post/${postId}`);
        } else if (result.postId) {
          navigate(`/post/${result.postId}`);
        } else {
          navigate('/ops');
        }
      } else {
        const errorText = await response.text();
        console.error('Save failed:', response.status, errorText);
        alert(`Failed to ${isEditing ? 'update' : 'create'} post. Please try again.`);
      }
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Error saving post. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const confirmCancel = window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.');
    if (confirmCancel) {
      if (isEditing) {
        navigate(`/post/${postId}`);
      } else {
        navigate('/ops');
      }
    }
  };

  if (loading) {
    return (
      <div className="write">
        <div className="loading">
          <p>Loading post for editing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="write">
      <img 
        className="writeImg" 
        src={post.featured_image || PostImg}
        alt="Post writing" 
      />
      
      <div className="write-header">
        <h1>{isEditing ? 'Edit Post' : 'Write New Post'}</h1>
        <div className="write-actions">
          <button 
            type="button" 
            className="writeCancel"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      </div>

      <form className="writeForm" onSubmit={handleSubmit}>
        <div className="writeFormGroup">
          <label htmlFor="fileInput">
            <i className="writeIcon fa-solid fa-file-arrow-up"></i> 
          </label>
          <input 
            type="file" 
            id="fileInput" 
            style={{display:"none"}}
            onChange={handleImageUpload}
            accept="image/*"
          />
          <input 
            type="text" 
            placeholder="Title" 
            className="writeInput" 
            autoFocus={true}
            value={post.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            required
          />
        </div>
        
        <div className="writeFormGroup">
          <textarea 
            placeholder="Tell the story..." 
            className="writeInput writeText"
            value={post.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            required
            rows={20}
          />
        </div>
        
        <div className="writeFormGroup">
          <select 
            className="writeInput"
            value={post.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
          >
            <option value="draft">Save as Draft</option>
            <option value="published">Publish</option>
          </select>
        </div>
        
        <button 
          type="submit" 
          className="writeSubmit"
          disabled={saving}
        >
          {saving ? (
            <>
              <i className="fa-solid fa-spinner fa-spin"></i>
              {isEditing ? ' Updating...' : ' Publishing...'}
            </>
          ) : (
            isEditing ? 'Update Post' : 'Publish Post'
          )}
        </button>
      </form>
    </div>
  );
}
