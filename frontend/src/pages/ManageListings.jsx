import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ManageListings.css';

// ManageListing component: allows users to view and update their own market listings
export default function ManageListing() {
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  // Retrieve JWT token from localStorage for authenticated requests
  const token = localStorage.getItem('token');
  if (!token) {
    // If no token present, user is not logged in → redirect to login
    alert('You must be logged in to manage your listings.');
    navigate('/login');
  }

  // Component state: listings data, loading & error flags
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  // Fetch the current user's active listings when component mounts
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/market/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(res.statusText);
        // Parse and store listings
        setListings(await res.json());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [API_URL, token]);

  // Handler to update a listing's status ('sold' or 'removed')
  const updateStatus = async (id, newStatus) => {
    // Custom confirmation messages based on action
    const prompt =
      newStatus === 'removed'
        ? 'Are you sure you want to remove this ad?'
        : 'Mark this listing as sold?';
    if (!window.confirm(prompt)) return;

    try {
      const res = await fetch(`${API_URL}/api/market/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error(res.statusText);
      // Remove updated listing from UI
      setListings(ls => ls.filter(item => item.market_id !== id));
    } catch (e) {
      alert(`Failed to mark as ${newStatus}: ${e.message}`);
    }
  };

  // Show loading or error states
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
              {/* Display primary image or default fallback */}
              <img
                className="manage-image"
                src={item.market_picture || '/default-pop.png'}
                alt={item.pop_name}
              />
              <div className="manage-info">
                <h2>{item.pop_name}</h2>
                <p>Price: ₪{parseFloat(item.price).toFixed(2)}</p>
                <p>Location: {item.location}</p>
                {/* Button to mark as sold */}
                <button
                  className="manage-button sold"
                  onClick={() => updateStatus(item.market_id, 'sold')}
                >
                  Mark as Sold
                </button>
                {/* Button to remove listing */}
                <button
                  className="manage-button remove"
                  onClick={() => updateStatus(item.market_id, 'removed')}
                >
                  Remove Listing
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
