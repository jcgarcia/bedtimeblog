import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";
import { useAdmin } from "../../contexts/AdminContext";
import { postsAPI } from "../../config/apiService";
import "./write.css";
import PostImg from '../../media/NewPost.jpg';

export default function Write() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { adminUser, isAdmin } = useAdmin();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    tags: '',
    status: 'draft'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [postId, setPostId] = useState(null);

  const currentUser = isAdmin && adminUser ? adminUser : user;
  const editPostId = searchParams.get('edit');

  useEffect(() => {
    if (editPostId) {
      setIsEditing(true);
      setPostId(editPostId);
      loadPost(editPostId);
    }
  }, [editPostId]);

  // Check if user can write posts
  const canWrite = () => {
    if (!currentUser) return false;
    const allowedRoles = ['admin', 'super_admin', 'editor', 'author', 'writer'];
    return allowedRoles.includes(currentUser.role);
  };

  // Load post for editing
  const loadPost = async (id) => {
    try {
      setLoading(true);
      const response = await postsAPI.getPostById(id);
      
      if (response.success && response.data) {
        const post = response.data;
        setFormData({
          title: post.title || '',
          content: post.content || '',
          excerpt: post.excerpt || '',
          category: post.category_id || '',
          tags: '', // TODO: Handle tags properly
          status: post.status || 'draft'
        });
      } else {
        setError('Failed to load post for editing');
      }
    } catch (err) {
      console.error('Error loading post:', err);
      setError('Failed to load post for editing');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('You must be logged in to write posts');
      return;
    }

    if (!canWrite()) {
      setError('You do not have permission to write posts');
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // TODO: Implement create/update post API calls
      console.log('Form data:', formData);
      console.log('Is editing:', isEditing);
      console.log('Post ID:', postId);
      
      if (isEditing) {
        setSuccess('Post updated successfully! (API integration pending)');
      } else {
        setSuccess('Post created successfully! (API integration pending)');
      }
      
      // Reset form if creating new post
      if (!isEditing) {
        setFormData({
          title: '',
          content: '',
          excerpt: '',
          category: '',
          tags: '',
          status: 'draft'
        });
      }
      
    } catch (err) {
      console.error('Error saving post:', err);
      setError('Failed to save post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Redirect if user can't write
  if (!currentUser) {
    return (
      <div className="write">
        <div className="write-error">
          <h2>Access Denied</h2>
          <p>You must be logged in to write posts.</p>
          <button onClick={() => navigate('/userlogin')}>Login</button>
        </div>
      </div>
    );
  }

  if (!canWrite()) {
    return (
      <div className="write">
        <div className="write-error">
          <h2>Access Denied</h2>
          <p>You do not have permission to write posts.</p>
          <p>Current role: {currentUser.role}</p>
          <button onClick={() => navigate('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="write">
      <img 
        className="writeImg" 
        src={PostImg}
        alt="Post writing" 
      />
      
      <div className="write-header">
        <h1>{isEditing ? 'Edit Post' : 'Write New Post'}</h1>
        <p>Welcome, {currentUser.firstName || currentUser.name || currentUser.username}!</p>
      </div>

      {error && <div className="write-error-message">{error}</div>}
      {success && <div className="write-success-message">{success}</div>}
      
      <form className="writeForm" onSubmit={handleSubmit}>
        <div className="writeFormGroup">
          <label htmlFor="fileInput" className="file-upload-label">
            <i className="writeIcon fa-solid fa-file-arrow-up"></i> 
            Upload Image
          </label>
          <input type="file" id="fileInput" style={{display:"none"}} accept="image/*"/>
          
          <input 
            type="text" 
            name="title"
            placeholder="Post Title" 
            className="writeInput" 
            value={formData.title}
            onChange={handleInputChange}
            autoFocus={true}
            required
          />
        </div>
        
        <div className="writeFormGroup">
          <input 
            type="text" 
            name="excerpt"
            placeholder="Brief excerpt or description" 
            className="writeInput" 
            value={formData.excerpt}
            onChange={handleInputChange}
          />
        </div>
        
        <div className="writeFormGroup">
          <select 
            name="status"
            className="writeInput writeSelect"
            value={formData.status}
            onChange={handleInputChange}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>
        
        <div className="writeFormGroup">
          <textarea 
            name="content"
            placeholder="Tell your story..." 
            className="writeInput writeText"
            value={formData.content}
            onChange={handleInputChange}
            rows={15}
            required
          />
        </div>
        
        <div className="writeFormActions">
          <button 
            type="button" 
            className="writeCancel"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="writeSubmit"
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEditing ? 'Update Post' : 'Publish Post')}
          </button>
        </div>
      </form>
    </div>
  );
}
