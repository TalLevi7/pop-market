// src/pages/Market.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import '../styles/Market.css';

export default function Market() {
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  // — Authentication check (JWT in localStorage) —
  const token = localStorage.getItem('token');
  let isAuthenticated = false;
  let currentUserId = null;

  // helper to decode JWT payload
  const decodeJWTPayload = (t) => {
    try {
      const base64 = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  };

  if (token) {
    const payload = decodeJWTPayload(token);
    if (payload && payload.exp > Math.floor(Date.now() / 1000)) {
      isAuthenticated = true;
      currentUserId = payload.user_id; // ← grab user_id for self-check
    } else {
      localStorage.removeItem('token');
    }
  }

  // — State —
  const [listings, setListings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [orderBy, setOrderBy]       = useState('date_desc');
  const [currentIdx, setCurrentIdx] = useState({});
  const [lightbox, setLightbox]     = useState({
    isOpen: false,
    images: [],
    current: 0
  });

  // — Fetch listings —
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/market`);
        if (!res.ok) throw new Error(res.statusText);
        setListings(await res.json());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [API_URL]);

  // — Derived filters —
  const categories = useMemo(
    () => Array.from(new Set(listings.map(i => i.category))).sort(),
    [listings]
  );
  const locations = useMemo(
    () => Array.from(new Set(listings.map(i => i.location))).sort(),
    [listings]
  );

  // — Apply search & filters —
  const filtered = useMemo(
    () =>
      listings.filter(item => {
        const matchesSearch =
          item.pop_name.toLowerCase().includes(searchText.toLowerCase()) ||
          item.details.toLowerCase().includes(searchText.toLowerCase());
        const matchesCategory =
          !categoryFilter || item.category === categoryFilter;
        const matchesLocation =
          !locationFilter || item.location === locationFilter;
        return matchesSearch && matchesCategory && matchesLocation;
      }),
    [listings, searchText, categoryFilter, locationFilter]
  );

  // — Apply sorting —
  const sorted = useMemo(() => {
    const copy = [...filtered];
    switch (orderBy) {
      case 'date_asc':
        copy.sort((a, b) => new Date(a.date_uploaded) - new Date(b.date_uploaded));
        break;
      case 'date_desc':
        copy.sort((a, b) => new Date(b.date_uploaded) - new Date(a.date_uploaded));
        break;
      case 'price_asc':
        copy.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case 'price_desc':
        copy.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      default:
        break;
    }
    return copy;
  }, [filtered, orderBy]);

  // — Restrict posting/management —
  const handleRestricted = page => {
    if (!isAuthenticated) {
      alert(`Access to the ${page} page requires you to log in.`);
      navigate('/login');
    }
  };

  // — Card carousel controls —
  const nextImage = (id, total) => {
    setCurrentIdx(ci => ({
      ...ci,
      [id]: ((ci[id] || 0) + 1) % total
    }));
  };
  const prevImage = (id, total) => {
    setCurrentIdx(ci => ({
      ...ci,
      [id]: ((ci[id] || 0) - 1 + total) % total
    }));
  };

  // — Lightbox controls —
  const openLightbox = (imgs, startIdx) => {
    setLightbox({ isOpen: true, images: imgs, current: startIdx });
  };
  const closeLightbox = () => {
    setLightbox(lb => ({ ...lb, isOpen: false }));
  };
  const lbPrev = () => {
    setLightbox(lb => ({
      ...lb,
      current: (lb.current - 1 + lb.images.length) % lb.images.length
    }));
  };
  const lbNext = () => {
    setLightbox(lb => ({
      ...lb,
      current: (lb.current + 1) % lb.images.length
    }));
  };

  if (loading) return <div className="market-loading">Loading listings…</div>;
  if (error)   return <div className="market-error">Error: {error}</div>;

  return (
    <main className="market-container">
      {/* Top Controls */}
      <div className="market-controls">
        <div className="market-search-filter">
          <input
            type="text"
            className="market-search-input"
            placeholder="Search by name or details…"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          <select
            className="market-filter-select"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            className="market-filter-select"
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
          >
            <option value="">All Locations</option>
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        <div className="market-orderpost">
          <div className="market-orderby">
            <label htmlFor="orderBySelect">Order by:</label>
            <select
              id="orderBySelect"
              value={orderBy}
              onChange={e => setOrderBy(e.target.value)}
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="price_asc">Price Low → High</option>
              <option value="price_desc">Price High → Low</option>
            </select>
          </div>
        </div>

        <div className="market-postbutton">
          <Link to="/NewListing">
            <button
              className="post-ad-button"
              onClick={() => handleRestricted('NewListing')}
            >
              + Post an Ad
            </button>
          </Link>

          {/* NEW Manage Listings button */}
          <Link to="/ManageListings">
            <button
              className="post-ad-button"
              onClick={() => handleRestricted('ManageListings')}
              style={{ marginLeft: '1rem', backgroundColor: '#6c757d' }}
            >
              Manage Listings
            </button>
          </Link>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="market-no-results">
          No listings match your criteria.
        </div>
      ) : (
        <div className="market-grid">
          {sorted.map(item => {
            // parse avg_rating from string → number
            const avg = parseFloat(item.avg_rating) || 0;
            const imgs = [
              item.market_picture,
              item.market_picture2,
              item.market_picture3
            ].filter(u => u);
            const total = imgs.length || 1;
            if (!imgs.length) imgs.push('/default-pop.png');
            const idx = currentIdx[item.market_id] || 0;

            return (
              <div className="market-card" key={item.market_id}>
                <div className="carousel-container">
                  {idx > 0 && (
                    <button
                      className="carousel-btn prev"
                      onClick={() => prevImage(item.market_id, total)}
                    >‹</button>
                  )}
                  <img
                    className="market-card-image zoomable"
                    src={imgs[idx]}
                    alt={`${item.pop_name} view ${idx + 1}`}
                    onClick={() => openLightbox(imgs, idx)}
                  />
                  {idx < total - 1 && (
                    <button
                      className="carousel-btn next"
                      onClick={() => nextImage(item.market_id, total)}
                    >›</button>
                  )}
                </div>

                <div className="market-card-body">
                  <h3 className="pop-name">{item.pop_name}</h3>
                  {item.category && <p className="pop-category">{item.category}</p>}
                  <p className="pop-serial"><strong>Serial:</strong> {item.serial_number}</p>
                  <p className="pop-location"><strong>Location:</strong> {item.location}</p>
                  <p className="pop-price">₪{parseFloat(item.price).toFixed(2)}</p>
                  <p className="pop-date">
                    <strong>Uploaded:</strong>{' '}
                    {new Date(item.date_uploaded).toLocaleDateString('en-IL',{
                      year:'numeric',month:'short',day:'numeric'
                    })}
                  </p>
                  <p className="pop-details">{item.details || <em>No extra details</em>}</p>
                </div>

                <div className="market-card-footer">
                  <p className="seller-info"><strong>Seller:</strong> {item.seller_username}</p>
                  <p className="seller-contact"><strong>Email:</strong> {item.seller_email}</p>
                  {item.seller_phone && (
                    <p className="seller-contact">
                      <strong>Phone Number:</strong> {item.seller_phone}
                    </p>
                  )}

                  {/* ★ Rating summary with Reviews link */}
                  {item.review_count > 0 ? (
                    <div className="rating-summary">
                      <a
                        className="reviews-link"
                        onClick={() => window.open(`/seller/${item.seller_id}/reviews`, '_blank')}
                      >
                        Seller Reviews
                      </a>
                      :&nbsp;
                      {Array.from({ length: 5 }, (_, i) => {
                        const starNum = i + 1;
                        if (avg >= starNum) {
                          return <FaStar key={i} />;
                        } else if (avg >= starNum - 0.5) {
                          return <FaStarHalfAlt key={i} />;
                        } else {
                          return <FaRegStar key={i} />;
                        }
                      })}
                      &nbsp;({avg.toFixed(1)})
                    </div>
                  ) : (
                    <div className="rating-summary">
                      <a
                        className="reviews-link"
                        onClick={() => window.open(`/seller/${item.seller_id}/reviews`, '_blank')}
                      >
                        Reviews
                      </a>
                      : No reviews yet
                    </div>
                  )}

                  {/* Leave Feedback */}
                  {isAuthenticated && currentUserId !== item.seller_id && (
                    <button
                      className="leave-feedback"
                      onClick={() =>
                        window.open(`/feedback/new?market_id=${item.market_id}`, '_blank')
                      }
                    >
                      Leave Feedback
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Overlay */}
      {lightbox.isOpen && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <button
            className="lb-btn prev"
            onClick={e => { e.stopPropagation(); lbPrev(); }}
            disabled={lightbox.images.length < 2}
          >‹</button>
          <div className="lightbox-image-container" onClick={e => e.stopPropagation()}>
            <img
              src={lightbox.images[lightbox.current]}
              alt=""
              className="lightbox-image"
            />
          </div>
          <button
            className="lb-btn next"
            onClick={e => { e.stopPropagation(); lbNext(); }}
            disabled={lightbox.images.length < 2}
          >›</button>
        </div>
      )}
    </main>
  );
}
