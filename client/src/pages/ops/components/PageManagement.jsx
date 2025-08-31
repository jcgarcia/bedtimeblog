
import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../../config/api';

export default function PageManagement() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.PAGES.LIST);
      if (response.ok) {
        const data = await response.json();
        setPages(data);
      } else {
        setMessage('Error loading pages');
      }
    } catch (error) {
      setMessage('Error loading pages');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-management">
      <div className="section-header">
        <h2>Pages</h2>
        <button className="btn-primary">Add New Page</button>
      </div>
      {message && (
        <div className="error-message">{message}</div>
      )}
      <div className="pages-list">
        {loading ? (
          <div>Loading pages...</div>
        ) : (
          <table className="pages-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.length === 0 ? (
                <tr><td colSpan={4}>No pages found.</td></tr>
              ) : (
                pages.map(page => (
                  <tr key={page.id}>
                    <td>{page.title}</td>
                    <td>{page.slug}</td>
                    <td>{page.published ? 'Published' : 'Draft'}</td>
                    <td>
                      <button className="btn-secondary">Edit</button>
                      <button className="btn-danger">Delete</button>
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
