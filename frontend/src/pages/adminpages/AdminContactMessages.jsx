// src/pages/adminpages/AdminContactMessages.jsx

import React, { useState, useEffect } from 'react';
import '../../styles/AdminContactMessages.css';

export default function AdminContactMessages() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token   = localStorage.getItem('token');

  const [msgs,    setMsgs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // fetch all messages
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/contact-messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(res.statusText);
        setMsgs(await res.json());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [API_URL, token]);

  // delete a message
  const deleteMsg = async id => {
    if (!window.confirm('Delete this message?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/contact-messages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(res.statusText);
      setMsgs(list => list.filter(m => m.message_id !== id));
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  };

  if (loading) return <p className="acm-loading">Loading…</p>;
  if (error)   return <p className="acm-error">Error: {error}</p>;

  return (
    <main className="acm-container">
      <h1>Contact Messages</h1>
      <table className="acm-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Sender</th>
            <th>Email</th>
            <th>Subject</th>
            <th>Message</th>
            <th>Date</th>      {/* now DD/MM/YYYY */}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {msgs.map(m => (
            <tr key={m.message_id}>
              <td>{m.message_id}</td>
              <td>{m.user_id ? `#${m.user_id} (${m.name})` : m.name}</td>
              <td>{m.email}</td>
              <td>{m.subject}</td>
              <td className="acm-body">{m.body}</td>
              <td>{m.created_at_formatted}</td>  {/* using formatted alias */}
              <td className="acm-actions">
                <button
                  className="delete"
                  onClick={() => deleteMsg(m.message_id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
