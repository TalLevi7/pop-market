// src/pages/SellerReviews.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../styles/SellerReviews.css';

export default function SellerReviews() {
  const { sellerId } = useParams();
  const API_URL = import.meta.env.VITE_API_URL;

  const [data, setData]       = useState({ reviews: [], avg_rating: 0, review_count: 0 });
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

  return (
    <main className="sr-container">
      <h1>Seller Reviews</h1>
      <div className="sr-summary">
        {data.review_count > 0
          ? <>
              <span className="sr-stars">
                {Array.from({length:5},(_,i) =>
                  i < Math.round(data.avg_rating) ? '★' : '☆'
                ).join('')}
              </span>
              <span className="sr-score">
                {data.avg_rating} ({data.review_count} reviews)
              </span>
            </>
          : <span className="sr-no">No reviews yet</span>
        }
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
              {Array.from({length:5},(_,i) =>
                i < r.rating ? '★' : '☆'
              ).join('')}
            </div>
            {r.review && <p className="sr-item-review">{r.review}</p>}
          </li>
        ))}
      </ul>
      <Link to="/market" className="sr-back">← Back to Market</Link>
    </main>
  );
}
