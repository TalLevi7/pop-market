// src/pages/ResetPassword.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/ResetPassword.css';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const token  = params.get('token') || '';

  const [password, setPassword]       = useState('');
  const [confirmPassword, setConfirm] = useState('');
  const [error, setError]             = useState('');
  const [message, setMessage]         = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, new_password: password })
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');

      setMessage('Password reset! Redirecting to login…');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="reset-page">
      <div className="reset-container">
        <h2>Reset Password</h2>

        {error && <p className="error">{error}</p>}

        {message ? (
          <p className="message">{message}</p>
        ) : (
          <form onSubmit={handleSubmit} className="reset-form">
            <label htmlFor="password">New Password:</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              pattern="(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$"
              title="At least 8 characters, with at least one letter and one number."
            />

            <label htmlFor="confirm">Confirm Password:</label>
            <input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirm(e.target.value)}
              required
            />

            <button type="submit">Reset Password</button>
          </form>
        )}
      </div>
    </div>
  );
}
