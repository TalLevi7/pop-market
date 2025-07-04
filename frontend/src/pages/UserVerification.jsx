// src/pages/UserVerification.jsx

import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import '../styles/UserVerification.css'; 

export default function UserVerification() {
  const API_URL = import.meta.env.VITE_API_URL;
  const params = new URLSearchParams(useLocation().search);
  const token = params.get('token');

  const [status, setStatus] = useState('pending'); // 'pending' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification token not found in URL.');
      return;
    }

    (async () => {
      try {
        setStatus('pending');
        const res = await fetch(`${API_URL}/api/userVerification?token=${token}`);
        if (res.redirected) {
          window.location.href = res.url;
        } else if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Verification failed.');
        } else {
          setStatus('success');
        }
      } catch (err) {
        setStatus('error');
        setMessage(err.message);
      }
    })();
  }, [API_URL, token]);

  if (status === 'pending') {
    return <p className="verification-loading">Verifying your email… please wait.</p>;
  }

  if (status === 'error') {
    return (
      <div className="verification-error">
        <h1>Verification Error</h1>
        <p>{message}</p>
        <Link to="/signup">
          <button className="btn">Try signing up again</button>
        </Link>
      </div>
    );
  }

  // status === 'success'
  return (
    <div className="verification-success">
      <h1>🎉 Email Confirmed!</h1>
      <p>Your email address has been verified successfully.</p>
      <Link to="/login">
        <button className="btn">Go to Login</button>
      </Link>
    </div>
  );
}
