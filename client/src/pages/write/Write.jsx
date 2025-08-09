import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";
import { useAdmin } from "../../contexts/AdminContext";
import { postsAPI, categoriesAPI, uploadAPI } from "../../services/postsAPI";
import LexicalEditor from "../../components/LexicalEditor/LexicalEditor";
import "../../components/LexicalEditor/LexicalEditor.css";
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
    featuredImage: '',
    status: 'draft'
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [postId, setPostId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const currentUser = isAdmin && adminUser ? adminUser : user;
  const editPostId = searchParams.get('edit');

  useEffect(() => {
    if (editPostId) {
      setIsEditing(true);
      setPostId(editPostId);
      loadPost(editPostId);
    }
    // Load categories
    loadCategories();
  }, [editPostId]);

  // Load categories for dropdown
  const loadCategories = async () => {
    try {
      const response = await categoriesAPI.getCategories();
      if (response.data) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

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
      const response = await postsAPI.getPost(id);
      
      if (response.data) {
        const post = response.data;
        setFormData({
          title: post.title || '',
          content: post.content || '',
          excerpt: post.excerpt || '',
          category: post.category_id || '',
          featuredImage: post.featured_image || '',
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

  // Handle file upload
  const handleImageUpload = async (file) => {
    try {
      setUploadingImage(true);
      const response = await uploadAPI.uploadFile(file);
      
      if (response.data) {
        const imagePath = `/uploads/${response.data}`;
        setFormData(prev => ({
          ...prev,
          featuredImage: imagePath
        }));
        setSuccess('Image uploaded successfully!');
        setTimeout(() => setSuccess(''), 3000);
        return imagePath;
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image');
      setTimeout(() => setError(''), 3000);
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle featured image file selection
  const handleFeaturedImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await handleImageUpload(file);
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

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!formData.content.trim()) {
      setError('Content is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const postData = {
        title: formData.title,
        desc: formData.content, // API expects 'desc' field
        img: formData.featuredImage,
        cat: formData.category,
        excerpt: formData.excerpt,
        status: formData.status
      };
      
      if (isEditing) {
        const response = await postsAPI.updatePost(postId, postData);
        if (response.data) {
          setSuccess('Post updated successfully!');
          setTimeout(() => {
            navigate(`/post/${postId}`);
          }, 1500);
        }
      } else {
        const response = await postsAPI.createPost(postData);
        if (response.data) {
          setSuccess('Post created successfully!');
          // Reset form if creating new post
          setFormData({
            title: '',
            content: '',
            excerpt: '',
            category: '',
            featuredImage: '',
            status: 'draft'
          });
        }
      }
        }
      }
      
    } catch (err) {
      console.error('Error saving post:', err);
      setError(err.response?.data?.message || 'Failed to save post. Please try again.');
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
            {uploadingImage ? 'Uploading...' : 'Upload Featured Image'}
          </label>
          <input 
            type="file" 
            id="fileInput" 
            style={{display:"none"}} 
            accept="image/*"
            onChange={handleFeaturedImageChange}
            disabled={uploadingImage}
          />
          
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

        {formData.featuredImage && (
          <div className="writeFormGroup">
            <div className="featured-image-preview">
              <img src={formData.featuredImage} alt="Featured" />
              <button 
                type="button" 
                className="remove-image-btn"
                onClick={() => setFormData(prev => ({ ...prev, featuredImage: '' }))}
              >
                <i className="fa fa-times"></i>
              </button>
            </div>
          </div>
        )}
        
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
            name="category"
            className="writeInput writeSelect"
            value={formData.category}
            onChange={handleInputChange}
          >
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

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
        
        <div className="writeFormGroup writeFormGroupFull">
          <LexicalEditor
            value={formData.content}
            onChange={(content) => setFormData(prev => ({ ...prev, content }))}
            placeholder="Start writing your story..."
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
