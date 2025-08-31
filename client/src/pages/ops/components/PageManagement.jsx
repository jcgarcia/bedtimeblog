

import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../../config/api';

export default function PageManagement() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [form, setForm] = useState({ title: '', slug: '', content: '', published: false });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.PAGES.LIST);
      if (response.ok) {
        const data = await response.json();
        setPages(Array.isArray(data) ? data : data.pages || []);
      } else {
        setMessage('Error loading pages');
      }
    } catch (error) {
      setMessage('Error loading pages');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAddPage = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.PAGES.CREATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (response.ok) {
        setMessage('Page added successfully!');
        setShowAddForm(false);
        setForm({ title: '', slug: '', content: '', published: false });
        fetchPages();
      } else {
        setMessage('Error adding page');
      }
    } catch (error) {
      setMessage('Error adding page');
    }
  };

  const handleEditPage = (page) => {
    setEditingPage(page);
    setForm({ ...page });
    setShowAddForm(true);
  };

  const handleUpdatePage = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.PAGES.UPDATE(form.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (response.ok) {
        setMessage('Page updated successfully!');
        setShowAddForm(false);
        setEditingPage(null);
        setForm({ title: '', slug: '', content: '', published: false });
        fetchPages();
      } else {
        setMessage('Error updating page');
      }
    } catch (error) {
      setMessage('Error updating page');
    }
  };

  const handleDeletePage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this page?')) return;
    try {
      const response = await fetch(API_ENDPOINTS.PAGES.DELETE(id), {
        method: 'DELETE'
      });
      if (response.ok) {
        setMessage('Page deleted successfully!');
        fetchPages();
      } else {
        setMessage('Error deleting page');
      }
    } catch (error) {
      setMessage('Error deleting page');
    }
  };

  return (
    <div className="page-management">
      <div className="section-header">
        <h2>Pages</h2>
        <button className="btn-primary" onClick={() => { setShowAddForm(true); setEditingPage(null); setForm({ title: '', slug: '', content: '', published: false }); }}>Add New Page</button>
      </div>
      {message && (
        <div className="error-message">{message}</div>
      )}
      {showAddForm && (
        <div className="page-form-modal">
          <div className="modal-content">
            <h3>{editingPage ? 'Edit Page' : 'Add New Page'}</h3>
            <input type="text" name="title" value={form.title} onChange={handleInputChange} placeholder="Title" />
            <input type="text" name="slug" value={form.slug} onChange={handleInputChange} placeholder="Slug" />
            <textarea name="content" value={form.content} onChange={handleInputChange} placeholder="Content" />
            <label>
              <input type="checkbox" name="published" checked={form.published} onChange={handleInputChange} /> Published
            </label>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => { setShowAddForm(false); setEditingPage(null); }}>Cancel</button>
              <button className="btn-primary" onClick={editingPage ? handleUpdatePage : handleAddPage}>
                {editingPage ? 'Update Page' : 'Add Page'}
              </button>
            </div>
          </div>
        </div>
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
                      <button className="btn-secondary" onClick={() => handleEditPage(page)}>Edit</button>
                      <button className="btn-danger" onClick={() => handleDeletePage(page.id)}>Delete</button>
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
