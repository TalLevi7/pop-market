import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ManageListings.css';

export default function ManageListing() {
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  // Auth check
  const token = localStorage.getItem('token');
  if (!token) {
    alert('You must be logged in to manage your listings.');
    navigate('/login');
  }

  // State
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  // Fetch only the current user’s listings
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/market/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(res.statusText);
        setListings(await res.json());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [API_URL, token]);

  // Mark a listing as sold
  const handleMarkSold = async (id) => {
    if (!window.confirm('Mark this listing as sold?')) return;
    try {
      const res = await fetch(`${API_URL}/api/market/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'sold' })
      });
      if (!res.ok) throw new Error(res.statusText);
      // remove from UI
      setListings(ls => ls.filter(item => item.market_id !== id));
    } catch (e) {
      alert('Failed to mark as sold: ' + e.message);
    }
  };

  if (loading) return <div className="manage-loading">Loading your listings…</div>;
  if (error)   return <div className="manage-error">Error: {error}</div>;

  return (
    <main className="manage-container">
      <h1>Manage Your Listings</h1>

      {listings.length === 0 ? (
        <p>You have no active listings.</p>
      ) : (
        <div className="manage-list">
          {listings.map(item => (
            <div className="manage-card" key={item.market_id}>
              <img
                className="manage-image"
                src={item.market_picture || '/default-pop.png'}
                alt={item.pop_name}
              />
              <div className="manage-info">
                <h2>{item.pop_name}</h2>
                <p>Price: ₪{parseFloat(item.price).toFixed(2)}</p>
                <p>Location: {item.location}</p>
                <button
                  className="manage-button sold"
                  onClick={() => handleMarkSold(item.market_id)}
                >
                  Mark as Sold
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
