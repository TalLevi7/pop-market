import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/AdminPanel.css';

// AdminPanel component: entry point to the admin dashboard
export default function AdminPanel() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Decode JWT payload to extract is_admin flag
  const decodeJWTPayload = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64    = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  };

  const payload = token ? decodeJWTPayload(token) : null;
  const isAdmin = payload?.is_admin === 1;

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin) {
      alert('Admin access only.');
      navigate('/');
    }
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;

  return (
    <main className="admin-container">
      <h1>Admin Dashboard</h1>
      <div className="admin-grid">
        <Link to="/admin/market" className="admin-card">
          <span className="card-icon">🛒</span>
          <span className="card-label">Manage<br />Market Listings</span>
        </Link>
        <Link to="/admin/approvals" className="admin-card">
          <span className="card-icon">✅</span>
          <span className="card-label">Approve<br />New Listings</span>
        </Link>
        <Link to="/admin/catalog" className="admin-card">
          <span className="card-icon">📚</span>
          <span className="card-label">Edit<br />Catalog</span>
        </Link>
        <Link to="/admin/users" className="admin-card">
          <span className="card-icon">👥</span>
          <span className="card-label">Manage<br />Users</span>
        </Link>
        <Link to="/admin/contact-messages" className="admin-card">
          <span className="card-icon">📨</span>
          <span className="card-label">Contact<br />Messages</span>
        </Link>
        <Link to="/admin/suggestions" className="admin-card">
          <span className="card-icon">💡</span>
          <span className="card-label">Review<br />Pop Suggestions</span>
        </Link>
        <Link to="/admin/feedbacks" className="admin-card">
          <span className="card-icon">📝</span>
          <span className="card-label">Review<br />Feedbacks</span>
        </Link>
      </div>
    </main>
  );
}
