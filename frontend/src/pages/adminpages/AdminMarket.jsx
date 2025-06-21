// src/pages/adminpages/AdminMarket.jsx

import React, { useState, useEffect } from 'react';
import '../../styles/AdminMarket.css';

// AdminMarket: list/edit/delete all market listings
export default function AdminMarket() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token   = localStorage.getItem('token');

  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [editId, setEditId]   = useState(null);
  const [form, setForm]       = useState({ price:'', location:'', details:'' });

  // fetch listings
  useEffect(() => {
    (async() => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/admin/market`, {
          headers:{ Authorization:`Bearer ${token}` }
        });
        if (!res.ok) throw new Error(res.statusText);
        setItems(await res.json());
      } catch(e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [API_URL, token]);

  const startEdit = item => {
    setEditId(item.market_id);
    setForm({ 
      price: item.price, 
      location: item.location, 
      details: item.details || '' 
    });
  };

  const save = async id => {
    const res = await fetch(`${API_URL}/api/admin/market/${id}`, {
      method:'PUT',
      headers:{
        'Content-Type':'application/json',
        Authorization:`Bearer ${token}`
      },
      body: JSON.stringify(form)
    });
    if (!res.ok) return alert('Save failed');
    setItems(it => it.map(i =>
      i.market_id === id ? { ...i, ...form } : i
    ));
    setEditId(null);
  };

  const remove = async id => {
    if (!window.confirm('Delete this listing permanently?')) return;
    const res = await fetch(`${API_URL}/api/admin/market/${id}`, {
      method:'DELETE',
      headers:{ Authorization:`Bearer ${token}` }
    });
    if (!res.ok) return alert('Delete failed');
    setItems(it => it.filter(i => i.market_id !== id));
  };

  if (loading) return <p className="admin-loading">Loading…</p>;
  if (error)   return <p className="admin-error">Error: {error}</p>;

  return (
    <main className="admin-market-container">
      <h1>Manage Market Listings</h1>
      <table className="admin-market-table">
        <thead>
          <tr>
            <th>Pop</th>
            <th>Serial</th>
            <th>Price</th>
            <th>Location</th>
            <th>Details</th>
            <th>Upload Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.market_id}>
              <td>{item.pop_name}</td>
              <td>{item.serial_number}</td>

              {editId === item.market_id ? (
                <>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      value={form.price}
                      onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={form.location}
                      onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={form.details}
                      onChange={e => setForm(f => ({ ...f, details: e.target.value }))}
                    />
                  </td>
                </>
              ) : (
                <>
                  <td>₪{parseFloat(item.price).toFixed(2)}</td>
                  <td>{item.location}</td>
                  <td>{item.details || '—'}</td>
                </>
              )}

              <td>
                {new Date(item.date_uploaded).toLocaleDateString('en-GB')}
              </td>
              <td>{item.status}</td>

              <td className="admin-actions">
                {editId === item.market_id ? (
                  <>
                    <button className="save" onClick={() => save(item.market_id)}>
                      Save
                    </button>
                    <button className="cancel" onClick={() => setEditId(null)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button className="edit" onClick={() => startEdit(item)}>
                      Edit
                    </button>
                    <button className="delete" onClick={() => remove(item.market_id)}>
                      Delete
                    </button>
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
