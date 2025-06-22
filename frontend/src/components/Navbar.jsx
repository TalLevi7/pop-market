import React, { useState, useContext } from 'react'; 
import { Link, useNavigate } from 'react-router-dom'; // React Router
import { AuthContext } from '../context/AuthContext'; // Import AuthContext
import '../styles/Common.css'; // make sure to create this CSS file

function Navbar() {
  const { logout } = useContext(AuthContext); // Get isAuthenticated from AuthContext
  const navigate = useNavigate();

  // Takes a token string, returns { user_id, username, exp, ... } or null.
  const decodeJWTPayload = (token) => {
    try {
      const base64Url = token.split('.')[1]; // second segment = payload
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const json = atob(base64);
      return JSON.parse(json);
    } catch (err) {
      return null;
    }
  };

    // ─── On every render, read token from localStorage ───────────────────
  const token = localStorage.getItem('token');
  let username = null;
  let isAuthenticated = false;

  if (token) {
    const payload = decodeJWTPayload(token);
    if (
      payload &&
      payload.username &&
      typeof payload.exp === 'number'
    ) {
      // Check if token is expired (exp is in seconds)
      const nowSec = Math.floor(Date.now() / 1000);
      if (payload.exp > nowSec) {
        isAuthenticated = true;
        username = payload.username;
      } else {
        // Token expired → remove it
        localStorage.removeItem('token');
      }
    } else {
      // Malformed token → remove it
      localStorage.removeItem('token');
    }
  }


  const handleLogout = () => {
    logout(); // Logout function from AuthContext
    alert('Logged out successfully!'); // Show logout success alert
    navigate('/'); // Redirect to Home page after logout, no matter where the user is
  };

  const handleRestrictedPageAccess = (page) => {
    if (!isAuthenticated) {
      alert(`Access to the ${page} page requires you to log in.`);
      navigate('/login'); // Redirect to login page if the user isn't authenticated
    }
  };

  return (
    <header className="navbar">
      <img src="/images/popmarketlogo.png" alt="Pop-Market Logo" className="logo" />
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/market">Market</Link>
        </li>
        <li>
          <Link to="/catalog">Catalog</Link>
        </li>

        {/* Always show the links, but restrict access if not authenticated */}
        <li onClick={() => handleRestrictedPageAccess('Collection')}>
          <Link to="/collection">My Collection</Link>
        </li>
        <li onClick={() => handleRestrictedPageAccess('Wishlist')}>
          <Link to="/wishlist">Wish List</Link>
        </li>
      </ul>
      <div className="auth-buttons">
        {isAuthenticated && username ? (
          <>
            <span className="navbar-greeting">
              Hello,&nbsp;{username} 😊
            </span>
            <Link to="/userpanel" className="user-panel-icon" title="User Panel">
              <img src="/images/user-icon.png" alt="User Panel" className="user-icon" />
            </Link>
            <button className="logout" onClick={handleLogout}>
              Log Out
            </button>
          </>
        ) : (
          <Link to="/login">
            <button className="login">Log In</button>
          </Link>
        )}
      </div>
    </header>
  );
}

export default Navbar;
