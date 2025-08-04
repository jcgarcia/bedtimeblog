import axios from 'axios';
import { API_ENDPOINTS, API_URL } from './api.js';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens if needed
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Clear auth token on unauthorized
      localStorage.removeItem('authToken');
      // Optionally redirect to login
    }
    return Promise.reject(error);
  }
);

// Posts API functions
export const postsAPI = {
  // Get all posts with optional pagination
  getAllPosts: async (page = 1, limit = 10) => {
    try {
      const response = await apiClient.get(`/api/posts?page=${page}&limit=${limit}`);
      // The API returns an array directly, so we wrap it in a success structure
      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      console.error('Error fetching posts:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch posts'
      };
    }
  },

  // Get a specific post by ID
  getPostById: async (id) => {
    try {
      const response = await apiClient.get(`/api/posts/${id}`);
      // The API returns a single object, so we wrap it in a success structure
      return {
        success: true,
        data: response.data || null
      };
    } catch (error) {
      console.error(`Error fetching post ${id}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch post'
      };
    }
  },

  // Create a new post
  createPost: async (postData) => {
    try {
      const response = await apiClient.post('/api/posts', postData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error creating post:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create post'
      };
    }
  },

  // Update a post
  updatePost: async (id, postData) => {
    try {
      const response = await apiClient.put(`/api/posts/${id}`, postData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error updating post ${id}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update post'
      };
    }
  },

  // Delete a post
  deletePost: async (id) => {
    try {
      const response = await apiClient.delete(`/api/posts/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error deleting post ${id}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete post'
      };
    }
  },

  // Search posts
  searchPosts: async (query, page = 1, limit = 10) => {
    try {
      const response = await apiClient.get(`/api/posts/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      console.error('Error searching posts:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to search posts'
      };
    }
  },
};

// Auth API functions
export const authAPI = {
  // Login
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/api/auth/login', credentials);
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  },

  // Register
  register: async (userData) => {
    try {
      const response = await apiClient.post('/api/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Error registering:', error);
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      await apiClient.post('/api/auth/logout');
      localStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error logging out:', error);
      // Still remove token even if API call fails
      localStorage.removeItem('authToken');
    }
  },

  // Verify token
  verifyToken: async () => {
    try {
      const response = await apiClient.get('/api/auth/verify');
      return response.data;
    } catch (error) {
      console.error('Error verifying token:', error);
      throw error;
    }
  },
};

// Health check
export const healthAPI = {
  check: async () => {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      console.error('Error checking health:', error);
      throw error;
    }
  },
};

// Export axios instance for custom requests
export { apiClient };
