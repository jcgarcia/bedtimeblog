import React from 'react';

export default function Analytics() {
  return (
    <div className="analytics">
      <h2>Analytics Dashboard</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Posts</h3>
          <p className="stat-number">24</p>
        </div>
        <div className="stat-card">
          <h3>Total Views</h3>
          <p className="stat-number">1,234</p>
        </div>
        <div className="stat-card">
          <h3>This Month</h3>
          <p className="stat-number">456</p>
        </div>
        <div className="stat-card">
          <h3>Active Users</h3>
          <p className="stat-number">12</p>
        </div>
      </div>
    </div>
  );
}
