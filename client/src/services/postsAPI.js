import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://bapi.ingasti.com/api' 
  : 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Posts API
export const postsAPI = {
  // Get all posts or posts by category
  getPosts: (category = null) => {
    const url = category ? `/posts?cat=${category}` : '/posts';
    return api.get(url);
  },

  // Get single post by ID
  getPost: (id) => {
    return api.get(`/posts/${id}`);
  },

  // Get single post by ID (alias for consistency)
  getPostById: (id) => {
    return api.get(`/posts/${id}`).then(response => ({
      success: true,
      data: response.data
    })).catch(error => ({
      success: false,
      error: error.message
    }));
  },

  // Create new post
  createPost: (postData) => {
    return api.post('/posts', postData);
  },

  // Update existing post
  updatePost: (id, postData) => {
    return api.put(`/posts/${id}`, postData);
  },

  // Delete post
  deletePost: (id) => {
    return api.delete(`/posts/${id}`);
  },
};

// Categories API
export const categoriesAPI = {
  // Get all categories
  getCategories: () => {
    return api.get('/categories');
  },
};

// Upload API
export const uploadAPI = {
  // Upload file
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default api;
