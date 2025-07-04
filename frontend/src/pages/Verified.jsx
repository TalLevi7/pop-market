// src/pages/Verified.jsx

import React from 'react';
import { Link } from 'react-router-dom';

function Verified() {
  return (
    <div className="verified-page">
      <h2>🎉 Email Confirmed!</h2>
      <p>Your email address has been verified successfully.</p>
      <Link to="/login">
        <button>Go to Login</button>
      </Link>
    </div>
  );
}

export default Verified;
