// src/pages/adminpages/AdminReviewFeedback.jsx

import React, { useState, useEffect } from 'react';
import '../../styles/AdminReviewFeedback.css';

export default function AdminReviewFeedback() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token   = localStorage.getItem('token');

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState('');
  const [editId, setEditId]       = useState(null);
  const [form, setForm]           = useState({ rating:'', review:'' });

  // fetch all feedback
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/admin/feedback`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(res.statusText);
        setFeedbacks(await res.json());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [API_URL, token]);

  // filter by seller, buyer, or review text
  const filtered = feedbacks.filter(f =>
    f.seller_username.toLowerCase().includes(search.toLowerCase()) ||
    f.buyer_username.toLowerCase().includes(search.toLowerCase()) ||
    (f.review && f.review.toLowerCase().includes(search.toLowerCase()))
  );

  // begin editing
  const startEdit = f => {
    setEditId(f.feedback_id);
    setForm({ rating: f.rating, review: f.review || '' });
  };

  // save edits
  const saveEdit = async id => {
    try {
      const res = await fetch(`${API_URL}/api/admin/feedback/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error(res.statusText);
      setFeedbacks(list =>
        list.map(f =>
          f.feedback_id === id
            ? { ...f, rating: form.rating, review: form.review }
            : f
        )
      );
      setEditId(null);
    } catch (e) {
      alert('Save failed: ' + e.message);
    }
  };

  // approve or reject
  const toggleApprove = async (id, approved) => {
    const msg = approved ? 'Approve?' : 'Reject?';
    if (!window.confirm(msg)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ approved })
      });
      if (!res.ok) throw new Error(res.statusText);
      setFeedbacks(list =>
        list.map(f =>
          f.feedback_id === id ? { ...f, approved } : f
        )
      );
    } catch (e) {
      alert((approved ? 'Approve' : 'Reject') + ' failed: ' + e.message);
    }
  };

  if (loading) return <p className="arf-loading">Loading…</p>;
  if (error)   return <p className="arf-error">Error: {error}</p>;

  return (
    <main className="arf-container">
      <h1>Review Feedback</h1>

      <input
        className="arf-search"
        type="text"
        placeholder="Search seller, buyer or review…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <table className="arf-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Seller</th>
            <th>Buyer</th>
            <th>Rating</th>
            <th>Review</th>
            <th>Submitted</th>
            <th>Approved?</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(f => (
            <tr key={f.feedback_id}>
              {editId === f.feedback_id ? (
                <>
                  <td>{f.feedback_id}</td>
                  <td>{f.seller_username}</td>
                  <td>{f.buyer_username}</td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={form.rating}
                      onChange={e => setForm(p => ({ ...p, rating: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={form.review}
                      onChange={e => setForm(p => ({ ...p, review: e.target.value }))}
                    />
                  </td>
                  <td>{new Date(f.created_at).toLocaleDateString('en-GB')}</td>
                  <td>{f.approved ? 'Yes' : 'No'}</td>
                </>
              ) : (
                <>
                  <td>{f.feedback_id}</td>
                  <td>{f.seller_username}</td>
                  <td>{f.buyer_username}</td>
                  <td>{f.rating}</td>
                  <td>{f.review || '—'}</td>
                  <td>{new Date(f.created_at).toLocaleDateString('en-GB')}</td>
                  <td>{f.approved ? 'Yes' : 'No'}</td>
                </>
              )}
              <td className="arf-actions">
                {editId === f.feedback_id ? (
                  <>
                    <button className="save"   onClick={() => saveEdit(f.feedback_id)}>Save</button>
                    <button className="cancel" onClick={() => setEditId(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button className="edit" onClick={() => startEdit(f)}>Edit</button>
                    {f.approved
                      ? <button className="reject" onClick={() => toggleApprove(f.feedback_id, 0)}>Reject</button>
                      : <button className="approve" onClick={() => toggleApprove(f.feedback_id, 1)}>Approve</button>
                    }
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
