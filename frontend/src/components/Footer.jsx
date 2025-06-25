// This is the Footer seen across all pages at the BOTTOM of each page

import React from 'react';
import { Link } from 'react-router-dom'; //React Router
import '../styles/Common.css'; // Custom styles for footer

function Footer() {
  return (
<footer className="footer">
      <div className="footer-container">
        <nav className="footer-nav">
          <Link to="/about">About Pop-Market</Link>
          <span className="divider">|</span>
          <Link to="/contactus">Contact Us</Link>
        </nav>
        <p>© 2025 Pop-Market. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
