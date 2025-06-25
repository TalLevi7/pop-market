// src/pages/adminpages/AdminApproveListings.jsx
// This is a page in the admin's panel in which he can review + approve / disapprove new Market listings

import React, { useState, useEffect } from 'react';
import '../../styles/AdminApproveListings.css';

export default function AdminApproveListings() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token   = localStorage.getItem('token');

  const [queue,      setQueue]      = useState([]);
  const [catalog,    setCatalog]    = useState([]);
  const [selected,   setSelected]   = useState({});  // market_id → chosen pop_id
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  // Fetch pending listings
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [qRes, cRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/approvals`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_URL}/api/catalog`) // for linking
        ]);
        if (!qRes.ok) throw new Error(qRes.statusText);
        if (!cRes.ok) throw new Error(cRes.statusText);
        setQueue(await qRes.json());
        setCatalog(await cRes.json());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [API_URL, token]);

  // Approve or reject, including linking if needed
  const handle = async (id, action, popId) => {
    // if approving a custom Pop, you must choose a catalog pop
    const item = queue.find(q => q.market_id === id);
    if (action === 'approve' && item.pop_id == null) {
      if (!popId) {
        alert('Please select a catalog Pop to link before approving.');
        return;
      }
    }
    const confirmMsg =
      action === 'approve'
        ? 'Approve this listing?' 
        : 'Reject this listing?';
    if (!window.confirm(confirmMsg)) return;

    try {
      const body = { action };
      if (action === 'approve' && item.pop_id == null) {
        body.pop_id = parseInt(popId, 10);
      }
      const res = await fetch(
        `${API_URL}/api/admin/approvals/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(body)
        }
      );
      if (!res.ok) throw new Error(res.statusText);
      // remove from queue
      setQueue(q => q.filter(item => item.market_id !== id));
    } catch (e) {
      alert(`Failed to ${action}: ${e.message}`);
    }
  };

  if (loading) return <p className="admin-loading">Loading…</p>;
  if (error)   return <p className="admin-error">Error: {error}</p>;

  return (
    <main className="admin-approve-container">
      <h1>Approve New Listings</h1>
      <table className="admin-approve-table">
        <thead>
          <tr>
            <th>Pop</th>
            <th>Serial</th>
            <th>Link to Catalog</th>
            <th>Price</th>
            <th>Location</th>
            <th>Details</th>
            <th>Uploaded</th>
            <th>Seller</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {queue.map(item => {
            const isCustom = item.pop_id == null;
            return (
              <tr key={item.market_id}>
                <td>{ item.pop_name }</td>
                <td>
                  {isCustom
                    ? (item.custom_serial_number || '—')
                    : item.serial_number
                  }
                </td>
                <td>
                  {isCustom ? (
                    <select
                      value={selected[item.market_id] || ''}
                      onChange={e => {
                        setSelected(s => ({
                          ...s,
                          [item.market_id]: e.target.value
                        }));
                      }}
                    >
                      <option value="">— select Pop —</option>
                      {catalog.map(p => (
                        <option
                          key={p.pop_id}
                          value={p.pop_id}
                        >
                          {p.pop_name} – {p.serial_number}
                        </option>
                      ))}
                    </select>
                  ) : (
                    '—'
                  )}
                </td>
                <td>₪{parseFloat(item.price).toFixed(2)}</td>
                <td>{item.location}</td>
                <td>{item.details || '—'}</td>
                <td>
                  {new Date(item.date_uploaded)
                    .toLocaleDateString('en-GB')}
                </td>
                <td>{item.seller_username}</td>
                <td className="admin-approve-actions">
                  <button
                    className="approve"
                    onClick={() =>
                      handle(
                        item.market_id,
                        'approve',
                        selected[item.market_id]
                      )
                    }
                  >
                    Approve
                  </button>
                  <button
                    className="reject"
                    onClick={() =>
                      handle(item.market_id, 'reject')
                    }
                  >
                    Reject
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
