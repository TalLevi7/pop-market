// src/pages/NewFeedback.jsx
// Page for signed-in users to leave feedback on sellers they dealt with

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/NewFeedback.css';

export default function NewFeedback() {
  const API_URL  = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const token    = localStorage.getItem('token');
  const params   = new URLSearchParams(useLocation().search);
  const marketId = params.get('market_id');

  // require login
  useEffect(() => {
    if (!token) {
      alert('You must be logged in to leave feedback');
      navigate('/login');
    }
  }, [token, navigate]);

  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [error, setError]   = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/market/${marketId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rating, review: review.trim() })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to submit feedback');
      }
      alert('Thanks! Your feedback is awaiting approval.');
      navigate('/market');
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <main className="newfeedback-container">
      <h1>Leave Feedback</h1>
      {error && <div className="newfeedback-error">{error}</div>}
      <form className="newfeedback-form" onSubmit={handleSubmit}>
        <label htmlFor="rating">Rating:</label>
        <select
          id="rating"
          value={rating}
          onChange={e => setRating(Number(e.target.value))}
        >
          {[5,4,3,2,1].map(n => (
            <option key={n} value={n}>{n} ★</option>
          ))}
        </select>

        <label htmlFor="review">Review (optional):</label>
        <textarea
          id="review"
          rows="4"
          value={review}
          onChange={e => setReview(e.target.value)}
        />

        <button type="submit">Submit Feedback</button>
      </form>
    </main>
  );
}
