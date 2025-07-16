// src/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/ForgotPassword.css';

export default function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [message, setMessage] = useState('');
  const [error, setError]     = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/forgot-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setMessage('If that email exists, you’ll receive a reset link shortly.');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-container">
        <h2>Forgot Password</h2>
        {error && <p className="error">{error}</p>}
        {message ? (
          <p className="message">{message}</p>
        ) : (
          <form onSubmit={handleSubmit} className="forgot-form">
            <label htmlFor="email">Enter your account email:</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <button type="submit">Send Reset Link</button>
          </form>
        )}
        <p><Link to="/login">Back to login</Link></p>
      </div>
    </div>
  );
}
