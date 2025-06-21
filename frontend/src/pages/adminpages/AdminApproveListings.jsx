import React, { useState, useEffect } from 'react';
import '../../styles/AdminApproveListings.css';

// AdminApproveListings: shows all new listings for approval
export default function AdminApproveListings() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token   = localStorage.getItem('token');

  const [queue, setQueue]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/admin/approvals`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(res.statusText);
        setQueue(await res.json());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [API_URL, token]);

  const handle = async (id, action) => {
    const msg = action === 'approve'
      ? 'Approve this listing?'
      : 'Reject this listing?';
    if (!window.confirm(msg)) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/approvals/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      if (!res.ok) throw new Error(res.statusText);
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
            <th>Price</th>
            <th>Location</th>
            <th>Details</th>
            <th>Uploaded</th>
            <th>Seller</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {queue.map(item => (
            <tr key={item.market_id}>
              <td>{item.pop_name}</td>
              <td>{item.serial_number}</td>
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
                  onClick={() => handle(item.market_id, 'approve')}
                >
                  Approve
                </button>
                <button
                  className="reject"
                  onClick={() => handle(item.market_id, 'reject')}
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
