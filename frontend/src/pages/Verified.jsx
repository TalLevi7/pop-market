// src/pages/Verified.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/UserVerification.css'; 

function Verified() {
  return (
    <div className="verification-success">
      <h2>🎉 Email Confirmed!</h2>
      <p>Your email address has been verified successfully.</p>
      <Link to="/login">
        <button>Go to Login</button>
      </Link>
    </div>
  );
}

export default Verified;
