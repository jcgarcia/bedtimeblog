


import React, { useState, useEffect } from 'react';
import LexicalEditor from '../../../components/LexicalEditor/LexicalEditor';
import '../../../components/LexicalEditor/LexicalEditor.css';
import { staticPagesAPI } from '../../../config/apiService';

export default function PageManagement() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [form, setForm] = useState({ title: '', slug: '', content: '', published: false });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const response = await staticPagesAPI.getAllPages();
      if (response.success) {
        setPages(response.data);
        setMessage('');
      } else {
        setMessage('Error loading pages');
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
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
        setShowForm(false);
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
    setForm({
      title: page.title || '',
      slug: page.slug || '',
      content: page.content && typeof page.content === 'string' ? page.content : (page.content && page.content.root ? JSON.stringify(page.content) : ''),
      published: page.published || false,
      id: page.id
    });
    setShowForm(true);
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
        setShowForm(false);
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

  // Quick Actions for static pages
  const quickActions = [
    { label: 'Edit About', slug: 'about' },
    { label: 'Edit Terms', slug: 'terms' },
    { label: 'Edit Privacy', slug: 'privacy' }
  ];

  return (
    <div className="page-management dashboard-style">
      <div className="panel-header">
        <div className="quick-actions-box">
          <h3>Quick Actions</h3>
          <div className="quick-btns">
            {quickActions.map(action => (
              <button key={action.slug} className="btn-secondary" onClick={() => {
                const page = pages.find(p => p.slug === action.slug);
                if (page) handleEditPage(page);
              }}>{action.label}</button>
            ))}
            <button className="btn-primary" onClick={() => { setShowForm(true); setEditingPage(null); setForm({ title: '', slug: '', content: '', published: false }); }}>+ New Page</button>
          </div>
        </div>
        <button className="btn-primary create-page-btn" onClick={() => { setShowForm(true); setEditingPage(null); setForm({ title: '', slug: '', content: '', published: false }); }}>
          <i className="fa-solid fa-plus"></i> Create New Page
        </button>
      </div>
      {message && (
        <div className="error-message">{message}</div>
      )}
      <div className="pages-cards dashboard-grid">
        {loading ? (
          <div>Loading pages...</div>
        ) : (
          pages.length === 0 ? (
            <div>No pages found.</div>
          ) : (
            pages.map(page => (
              <div key={page.id} className="page-card dashboard-card">
                <h3>{page.title}</h3>
                <div className="page-slug"><i className="fa-solid fa-link"></i> /{page.slug}</div>
                <div className="page-meta">
                  <div>Template: {page.template || 'Default'}</div>
                  <div>Updated: {page.updated_at ? new Date(page.updated_at).toLocaleDateString() : 'N/A'}</div>
                  <div>{page.seo ? 'SEO optimized' : 'Not optimized'}</div>
                  <div>{page.menu ? 'Shown in menu' : 'Hidden from menu'}</div>
                </div>
                <div className="page-actions">
                  <button className="btn-secondary" onClick={() => handleEditPage(page)}>
                    <i className="fa-solid fa-edit"></i> Edit
                  </button>
                  <button className="btn-danger" onClick={() => handleDeletePage(page.id)}>
                    <i className="fa-solid fa-trash"></i> Delete
                  </button>
                </div>
              </div>
            ))
          )
        )}
      </div>
      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditingPage(null); }}>
          <div className="modal-content page-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h3>{editingPage ? `Edit Page: ${form.title}` : 'Add New Page'}</h3>
              <button className="modal-close" onClick={() => { setShowForm(false); setEditingPage(null); }}>
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); editingPage ? handleUpdatePage() : handleAddPage(); }}>
              <div className="form-group">
                <label>Title</label>
                <input type="text" name="title" value={form.title} onChange={handleInputChange} placeholder="Title" style={{ width: 400, fontSize: 16, marginBottom: 10 }} />
              </div>
              <div className="form-group">
                <label>Slug</label>
                <input type="text" name="slug" value={form.slug} onChange={handleInputChange} placeholder="Slug" style={{ width: 400, fontSize: 16, marginBottom: 10 }} />
              </div>
              <div className="form-group">
                <label>Page Content</label>
                <LexicalEditor
                  value={form.content}
                  onChange={content => setForm(prev => ({ ...prev, content }))}
                  placeholder="Start writing your page content..."
                />
              </div>
              <div className="form-group">
                <label>
                  <input type="checkbox" name="published" checked={form.published} onChange={handleInputChange} /> Published
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingPage(null); }}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {editingPage ? 'Update Page' : 'Add Page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
