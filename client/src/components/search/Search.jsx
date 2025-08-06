import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './search.css';

export default function Search({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Mock posts data - replace with actual API call
  const mockPosts = [
    {
      id: 1,
      title: "What you can expect from copilot",
      excerpt: "Exploring the capabilities and features of GitHub Copilot in modern development workflows...",
      date: "14/06/2025",
      status: "public",
      content: "GitHub Copilot has revolutionized the way developers write code. This AI-powered assistant helps with code completion, suggestions, and even entire function implementations."
    },
    {
      id: 2,
      title: "Getting Started with React",
      excerpt: "A comprehensive guide to building modern web applications with React...",
      date: "10/06/2025",
      status: "public",
      content: "React is a powerful JavaScript library for building user interfaces. In this guide, we'll explore components, hooks, and state management."
    },
    {
      id: 3,
      title: "Understanding CSS Grid",
      excerpt: "Master the art of layout design with CSS Grid system...",
      date: "08/06/2025",
      status: "draft",
      content: "CSS Grid provides a two-dimensional layout system that makes it easy to design complex web layouts with clean and semantic HTML."
    },
    {
      id: 4,
      title: "JavaScript ES6 Features",
      excerpt: "Exploring modern JavaScript features that every developer should know...",
      date: "05/06/2025",
      status: "public",
      content: "ES6 introduced many powerful features like arrow functions, destructuring, template literals, and async/await that make JavaScript more expressive."
    }
  ];

  // Close search on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Focus on search input when opened
      const searchInput = document.querySelector('.search-input');
      if (searchInput) {
        setTimeout(() => searchInput.focus(), 100);
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Search function
  const performSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Search through mock posts
    const results = mockPosts.filter(post => {
      const searchText = `${post.title} ${post.excerpt} ${post.content}`.toLowerCase();
      return searchText.includes(query.toLowerCase()) && post.status === 'public';
    });

    setSearchResults(results);
    setIsLoading(false);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  if (!isOpen) return null;

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-container" onClick={(e) => e.stopPropagation()}>
        <div className="search-header">
          <h2>
            <i className="fa-solid fa-magnifying-glass"></i>
            Search Blog
          </h2>
          <button className="search-close" onClick={onClose}>
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        <form className="search-form" onSubmit={handleSearchSubmit}>
          <div className="search-input-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search posts, topics, or keywords..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <button type="submit" className="search-submit">
              <i className="fa-solid fa-search"></i>
            </button>
          </div>
        </form>

        <div className="search-results">
          {isLoading && (
            <div className="search-loading">
              <div className="loading-spinner"></div>
              <p>Searching...</p>
            </div>
          )}

          {!isLoading && hasSearched && searchResults.length === 0 && (
            <div className="search-no-results">
              <i className="fa-solid fa-search-minus"></i>
              <h3>No results found</h3>
              <p>Try different keywords or check your spelling</p>
            </div>
          )}

          {!isLoading && searchResults.length > 0 && (
            <div className="search-results-list">
              <h3>Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</h3>
              {searchResults.map(post => (
                <Link 
                  key={post.id} 
                  to={`/post/${post.id}`} 
                  className="search-result-item"
                  onClick={onClose}
                >
                  <div className="search-result-content">
                    <h4>{post.title}</h4>
                    <p>{post.excerpt}</p>
                    <div className="search-result-meta">
                      <span className="search-result-date">
                        <i className="fa-solid fa-calendar"></i>
                        {post.date}
                      </span>
                      <span className="search-result-status">
                        <i className="fa-solid fa-globe"></i>
                        {post.status}
                      </span>
                    </div>
                  </div>
                  <div className="search-result-icon">
                    <i className="fa-solid fa-arrow-right"></i>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!hasSearched && (
            <div className="search-suggestions">
              <h3>Popular Topics</h3>
              <div className="search-tags">
                <button 
                  className="search-tag" 
                  onClick={() => {
                    setSearchQuery('copilot');
                    performSearch('copilot');
                  }}
                >
                  Copilot
                </button>
                <button 
                  className="search-tag" 
                  onClick={() => {
                    setSearchQuery('react');
                    performSearch('react');
                  }}
                >
                  React
                </button>
                <button 
                  className="search-tag" 
                  onClick={() => {
                    setSearchQuery('javascript');
                    performSearch('javascript');
                  }}
                >
                  JavaScript
                </button>
                <button 
                  className="search-tag" 
                  onClick={() => {
                    setSearchQuery('css');
                    performSearch('css');
                  }}
                >
                  CSS
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
