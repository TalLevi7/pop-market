// src/pages/SellerReviews.jsx
// A page that shows a seller reviews on the market

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../styles/SellerReviews.css';

export default function SellerReviews() {
  const { sellerId } = useParams();
  const API_URL      = import.meta.env.VITE_API_URL;

  const [data, setData]       = useState({
    seller_username: '',
    avg_rating: 0,
    review_count: 0,
    reviews: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/market/seller/${sellerId}/reviews`);
        if (!res.ok) throw new Error(res.statusText);
        setData(await res.json());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [API_URL, sellerId]);

  if (loading) return <p className="sr-loading">Loading reviews…</p>;
  if (error)   return <p className="sr-error">Error: {error}</p>;

  // guard .toFixed by coercing to Number
  const avg   = Number(data.avg_rating)   || 0;
  const count = Number(data.review_count) || 0;

  return (
    <main className="sr-container">
      <h1 className="sr-title">{data.seller_username} - Seller reviews</h1>

      <div className="sr-summary">
        {count > 0 ? (
          <>Average:
            <div className="sr-summary-stars">
              {Array.from({ length: 5 }, (_, i) =>
                i < Math.round(avg) ? '★' : '☆'
              ).join('')}
            </div>
            <div className="sr-summary-text">
              {avg.toFixed(1)} / 5 ({count} review{count !== 1 ? 's' : ''})
            </div>
          </>
        ) : (
          <div className="sr-no">No reviews yet</div>
        )}
      </div>

      <ul className="sr-list">
        {data.reviews.map(r => (
          <li key={r.feedback_id} className="sr-item">
            <div className="sr-item-header">
              <strong>{r.buyer_username}</strong>
              <span className="sr-date">
                {new Date(r.created_at).toLocaleDateString('en-GB')}
              </span>
            </div>
            <div className="sr-item-rating">
              {Array.from({ length: 5 }, (_, i) =>
                i < r.rating ? '★' : '☆'
              ).join('')}
            </div>
            {r.review && <p className="sr-item-review">{r.review}</p>}
          </li>
        ))}
      </ul>

      <div className="sr-back">
        <Link to="/market">← Back to Market</Link>
      </div>
    </main>
  );
}
