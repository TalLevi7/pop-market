// src/pages/adminpages/AdminPopSuggestions.jsx
// This is a page in the admin's panel in which he can review the POPs users suggested adding to the catalog

import React, { useState, useEffect } from 'react';
import '../../styles/AdminPopSuggestions.css';

export default function AdminPopSuggestions() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token   = localStorage.getItem('token');

  const [items,  setItems]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // fetch pending suggestions
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/admin/suggestions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(res.statusText);
        setItems(await res.json());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [API_URL, token]);

  // handle accept/reject
  const handle = async (id, action) => {
    const confirmMsg =
      action === 'accept'
        ? 'Accept this suggestion?'
        : 'Reject this suggestion?';
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(
        `${API_URL}/api/admin/suggestions/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ action })
        }
      );
      if (!res.ok) throw new Error(res.statusText);
      // remove from list
      setItems(items.filter(i => i.suggestion_id !== id));
    } catch (e) {
      alert(`Failed to ${action}: ${e.message}`);
    }
  };

  if (loading) return <p className="aps-loading">Loading…</p>;
  if (error)   return <p className="aps-error">Error: {error}</p>;

  return (
    <main className="aps-container">
      <h1>Review Pop Suggestions</h1>
      <table className="aps-table">
        <thead>
          <tr>
            <th>Pop Name</th>
            <th>Serial #</th>
            <th>Details</th>
            <th>Image</th>
            <th>Suggested On</th>
            <th>By</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.suggestion_id}>
              <td>{item.pop_name}</td>
              <td>{item.serial_number || '—'}</td>
              <td>{item.details || '—'}</td>
              <td>
                {item.image_url ? (
                  <a href={item.image_url} target="_blank" rel="noreferrer">
                    <img
                      src={item.image_url}
                      alt={item.pop_name}
                      className="aps-thumb"
                    />
                  </a>
                ) : (
                  '—'
                )}
              </td>
              <td>{item.created_at}</td>
              <td>
                {item.username
                  ? `${item.username} (${item.email})`
                  : 'Guest'}
              </td>
              <td className="aps-actions">
                <button
                  className="accept"
                  onClick={() => handle(item.suggestion_id, 'accept')}
                >
                  Accept
                </button>
                <button
                  className="reject"
                  onClick={() => handle(item.suggestion_id, 'reject')}
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
