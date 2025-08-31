import React, { useState, useEffect } from 'react';
import { staticPagesAPI } from '../../../config/apiService';

export default function PageManagement() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const response = await staticPagesAPI.getAllPages();
      if (response.success) {
        setPages(response.data);
      } else {
        setMessage('Error loading pages');
      }
    } catch (error) {
      setMessage('Error loading pages');
    } finally {
      setLoading(false);
    }
  };

  // ...full UI code from Ops.jsx...

  return (
    <div className="page-management">
      {/* ...full UI code from Ops.jsx... */}
    </div>
  );
}
