// src/pages/UserVerification.jsx

import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';

function UserVerification() {
  const params = new URLSearchParams(useLocation().search);
  const token = params.get('token');
  const [status, setStatus] = useState('pending');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification token not found in URL.');
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL}/api/userVerification?token=${token}`)
      .then(res => {
        if (res.redirected) {
          window.location.href = res.url;
        } else if (!res.ok) {
          return res.text().then(text => {
            throw new Error(text || 'Verification failed.');
          });
        } else {
          setStatus('success');
        }
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.message);
      });
  }, [token]);

  if (status === 'pending') return <p>Verifying your email… please wait.</p>;
  if (status === 'error') {
    return (
      <div>
        <h2>Verification Error</h2>
        <p>{message}</p>
        <Link to="/signup">Try signing up again</Link>
      </div>
    );
  }
  return (
    <div>
      <h2>Email Verified!</h2>
      <p>Your account is now active. <Link to="/login">Log in</Link>.</p>
    </div>
  );
}

export default UserVerification;
