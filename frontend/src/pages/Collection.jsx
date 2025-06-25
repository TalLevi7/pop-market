// src/pages/Collection.jsx
// Show's a signed-in user's collection

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';  // ← added Link
import '../styles/Collection.css';

export default function Collection() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSub, setFilterSub]           = useState('');
  const API_URL = import.meta.env.VITE_API_URL;

  const navigate = useNavigate();

  // Fetch the user's personal collection
  useEffect(() => {
    const token   = localStorage.getItem('token');
    fetch(`${API_URL}/api/collection`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async res => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to load collection');
        }
        return res.json();
      })
      .then(data => setItems(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [API_URL]);

  const handleRemove = async id => {
    const token   = localStorage.getItem('token');
    const removedItem = items.find(i => i.collection_id === id);
    const popName     = removedItem?.pop_name || 'Item';

    const res = await fetch(`${API_URL}/api/collection/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      setItems(prev => prev.filter(i => i.collection_id !== id));
      alert(`${popName} has been deleted from your collection`);
    } else {
      console.error('Failed to remove item');
    }
  };

  // Derive category list, scoped by selected sub-category
  const categories = useMemo(
    () => Array.from(
      new Set(
        items
          .filter(i => !filterSub || i.sub_category === filterSub)
          .map(i => i.category)
      )
    ),
    [items, filterSub]
  );

  // Derive sub-category list, scoped by selected category
  const subCategories = useMemo(
    () => Array.from(
      new Set(
        items
          .filter(i => !filterCategory || i.category === filterCategory)
          .map(i => i.sub_category)
      )
    ),
    [items, filterCategory]
  );

  const filtered = items
    .filter(i => i.pop_name.toLowerCase().includes(search.toLowerCase()))
    .filter(i => !filterCategory || i.category === filterCategory)
    .filter(i => !filterSub      || i.sub_category === filterSub);

  if (loading) return <div className="collection"><p>Loading your collection…</p></div>;
  if (error)   return <div className="collection error"><p>{error}</p></div>;

  // NEW: if user has no collection items at all
  if (items.length === 0) {
    return (
      <div className="collection-empty">
        <h1>Your Collection Is Empty</h1>
        <p>
          Go to the{' '}
          <Link to="/catalog" className="empty-link">
            Catalog
          </Link>{' '}
          to start adding items to your Collection.
        </p>
      </div>
    );
  }

  return (
    <div className="collection">
      <h1>Your Collection</h1>

      <div className="catalog-filters">
        <input
          type="text"
          placeholder="Search by name"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterSub} onChange={e => setFilterSub(e.target.value)}>
          <option value="">All Sub-Categories</option>
          {subCategories.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length === 0
        ? <p className="empty">No items match your filters.</p>
        : <div className="catalog-grid">
            {filtered.map(item => (
              <div key={item.collection_id} className="pop-card">
                <img src={item.picture} alt={item.pop_name} />
                <h3>{item.pop_name}</h3>
                <h4>{item.serial_number}</h4>
                <p>{item.category} – {item.sub_category}</p>
                <small>
                  Acquired: {new Date(item.acquired_date).toLocaleDateString('en-GB')}
                </small>
                <div className="card-actions">
                  <button
                    className="collectiontomarket-button"
                    onClick={() => {
                      // open NewListing in new tab with pop preselected
                      const url = `${window.location.origin}/newlisting?popId=${item.pop_id}`;
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    Sell on market
                  </button>
                  <button
                    className="removefromcollection-button"
                    onClick={() => handleRemove(item.collection_id)}
                  >
                    Remove this item
                  </button>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  );
}
