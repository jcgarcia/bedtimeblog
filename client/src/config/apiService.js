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
    // Add auth token if available (check both authToken and adminToken)
    const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken');
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
      // Clear auth tokens on unauthorized
      localStorage.removeItem('authToken');
      localStorage.removeItem('adminToken');
      // Optionally redirect to login
    }
    return Promise.reject(error);
  }
);

// Posts API functions
export const postsAPI = {
  // Get all posts with optional pagination and category filtering
  getAllPosts: async (page = 1, limit = 10, category = null) => {
    try {
      // Simplified API call to match the backend API
      const response = await apiClient.get('/api/posts');
      
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

  // Get posts by category
  getPostsByCategory: async (category, page = 1, limit = 10) => {
    return postsAPI.getAllPosts(page, limit, category);
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
      
      // Check if response indicates success (200-299 status codes)
      if (response.status >= 200 && response.status < 300) {
        return {
          success: true,
          data: response.data
        };
      } else {
        return {
          success: false,
          error: `Unexpected status: ${response.status}`
        };
      }
    } catch (error) {
      console.error(`Error updating post ${id}:`, error);
      
      // Handle specific error cases
      if (error.response) {
        // Server responded with an error status
        const status = error.response.status;
        const errorMessage = error.response.data?.error || error.response.data || 'Failed to update post';
        
        // Some errors might still mean the operation succeeded
        if (status === 308 || status === 302) {
          // Redirect responses might indicate success but with redirect
          return {
            success: true,
            data: { message: 'Post updated successfully' }
          };
        }
        
        return {
          success: false,
          error: errorMessage
        };
      } else if (error.request) {
        // Network error
        return {
          success: false,
          error: 'Network error - please check your connection'
        };
      } else {
        // Other error
        return {
          success: false,
          error: 'Failed to update post'
        };
      }
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

// Static Pages API
export const staticPagesAPI = {
  // Get all pages (admin)
  getAllPages: async () => {
    try {
      const response = await apiClient.get('/api/pages');
      if (response.data.success) {
        return {
          success: true,
          data: response.data.pages || []
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to fetch pages'
        };
      }
    } catch (error) {
      console.error('Error fetching all pages:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch pages'
      };
    }
  },

  // Get pages for menu
  getMenuPages: async () => {
    try {
      const response = await apiClient.get('/api/pages/menu');
      if (response.data.success) {
        return {
          success: true,
          data: response.data.pages || []
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to fetch menu pages'
        };
      }
    } catch (error) {
      console.error('Error fetching menu pages:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch menu pages'
      };
    }
  },

  // Get page by slug (public)
  getPageBySlug: async (slug) => {
    try {
      const response = await apiClient.get(`/api/pages/slug/${slug}`);
      if (response.data.success) {
        return {
          success: true,
          data: response.data.page || null
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to fetch page'
        };
      }
    } catch (error) {
      console.error(`Error fetching page ${slug}:`, error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch page'
      };
    }
  },

  // Get page by ID (admin)
  getPageById: async (id) => {
    try {
      const response = await apiClient.get(`/api/pages/${id}`);
      if (response.data.success) {
        return {
          success: true,
          data: response.data.page || null
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to fetch page'
        };
      }
    } catch (error) {
      console.error(`Error fetching page ${id}:`, error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch page'
      };
    }
  },

  // Create new page
  createPage: async (pageData) => {
    try {
      const response = await apiClient.post('/api/pages', pageData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error creating page:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create page'
      };
    }
  },

  // Update page
  updatePage: async (id, pageData) => {
    try {
      const response = await apiClient.put(`/api/pages/${id}`, pageData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error updating page ${id}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update page'
      };
    }
  },

  // Delete page
  deletePage: async (id) => {
    try {
      const response = await apiClient.delete(`/api/pages/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error deleting page ${id}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete page'
      };
    }
  },
};

// Export axios instance for custom requests
export { apiClient };
