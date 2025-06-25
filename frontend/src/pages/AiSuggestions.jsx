import React, { useState, useEffect } from 'react';
import { useNavigate, Link }         from 'react-router-dom';
import { FaHeart, FaRegHeart }       from 'react-icons/fa';
import '../styles/AiSuggestions.css';

export default function AiSuggestions() {
  const API_URL        = import.meta.env.VITE_API_URL;
  const navigate       = useNavigate();
  const token          = localStorage.getItem('token');

  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [items, setItems]           = useState([]);
  const [wishlist, setWishlist]     = useState([]);
  const [collectionIds, setCollectionIds] = useState([]);

  // redirect if not logged in
  useEffect(() => {
    if (!token) {
      alert('Login required to see recommendations');
      navigate('/login');
    }
  }, [token, navigate]);

  // fetch wishlist
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/wishlist`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(rows => setWishlist(rows.map(x => x.pop_id)))
      .catch(console.error);
  }, [API_URL, token]);

  // fetch collection
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/collection`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load collection'))
      .then(rows => setCollectionIds(rows.map(x => x.pop_id)))
      .catch(console.error);
  }, [API_URL, token]);

  // fetch AI suggestions
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/catalog/ai-suggestions`, {
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

  // toggle wishlist
  const toggleWishlist = async popId => {
    const inList = wishlist.includes(popId);
    const method = inList ? 'DELETE' : 'POST';
    const url    = `${API_URL}/api/wishlist${inList ? `/${popId}` : ''}`;
    const opts   = {
      method,
      headers: {
        'Content-Type':'application/json',
        Authorization:`Bearer ${token}`
      },
      ...(method === 'POST' && { body: JSON.stringify({ pop_id: popId }) })
    };
    const res = await fetch(url, opts);
    if (!res.ok) { alert('Wishlist failed'); return; }
    setWishlist(w => inList ? w.filter(id => id !== popId) : [...w, popId]);
  };

  // add to collection
  const handleAddToCollection = async (popId, popName) => {
    if (collectionIds.includes(popId)) {
      alert(`${popName} is already in your collection`);
      return;
    }
    const res = await fetch(`${API_URL}/api/collection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ pop_id: popId })
    });
    if (!res.ok) {
      alert('Failed to add to collection');
      return;
    }
    setCollectionIds(prev => [...prev, popId]);
    alert(`${popName} has been added to your collection`);
  };

  if (loading) return <p className="as-loading">Loading recommendations…</p>;
  if (error)   return <p className="as-error">Error: {error}</p>;

  return (
    <main className="as-container">
      <h1>Your AI Recommendations </h1> <h3>(based on your current collection)</h3>

      {items.length === 0
        ? <p className="as-none">Add more to your collection to get suggestions!</p>
        : <div className="as-grid">
            {items.map(p => {
              const fav   = wishlist.includes(p.pop_id);
              const inCol = collectionIds.includes(p.pop_id);
              return (
                <div className="as-card" key={p.pop_id}>
                  <div
                    className={`wishlist-icon${fav ? ' filled' : ''}`}
                    onClick={() => toggleWishlist(p.pop_id)}
                  >
                    { fav ? <FaHeart/> : <FaRegHeart/> }
                  </div>
                  <img src={p.picture} alt={p.pop_name} />
                  <h3>{p.pop_name}</h3>
                  <h4>{p.serial_number}</h4>
                  <p><strong>Category:</strong> {p.category}</p>
                  <p><strong>Sub-Category:</strong> {p.sub_category}</p>
                  <p><strong>Release-Year:</strong> {p.release_year}</p>
                  <button
                    className="as-add-button"
                    disabled={inCol}
                    onClick={() => handleAddToCollection(p.pop_id, p.pop_name)}
                  >
                    {inCol ? 'In Collection' : 'Add to collection'}
                  </button>
                </div>
              );
            })}
          </div>
      }

      {/* ← Back to Catalog */}
      <div className="as-back">
        <Link to="/catalog">← Back to Catalog</Link>
      </div>
    </main>
  );
}
