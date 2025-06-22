// src/pages/Signup.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Signup.css';

function Signup() {
  const [username, setUsername]         = useState('');
  const [email, setEmail]               = useState('');
  const [phoneNumber, setPhoneNumber]   = useState('');
  const [password, setPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError]               = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/signup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            email,
            password,
            phone_number: phoneNumber || null
          })
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Signup failed');
        return;
      }

      // Show success message as an alert
      window.alert('Signed up successfully!');

      // Redirect to login after alert
      setTimeout(() => {
        navigate('/login');
      }, 2000); // Redirect after 2 seconds
    } catch (err) {
      console.error('Signup error:', err);
      setError('Server error, please try again.');
    }
  };

  return (
    <div className="signup-page">
      <img src='./images/signup-left.png' alt="signup Left Pic" className="signup-side-image" />
      <div className="signup-container">
        <h2>Sign Up</h2>
        <form onSubmit={handleSubmit} className="signup-form">
          <label htmlFor="username">Username:</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          
          <label htmlFor="phoneNumber">Phone Number (optional):</label>
          <input
            id="phoneNumber"
            type="tel"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
          />
          <div className="signup-help">
            Adding your phone number will display it on any market listings you post.
          </div>

          <label htmlFor="password">Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
          />

          {error && <p className="error">{error}</p>}
          <button type="submit">Sign Up</button>
        </form>

        <p className="login-text">
          Already have an account? <Link to="/login">Log in here</Link>
        </p>
      </div>
      <img src='./images/signup-right.png' alt="signup right Pic" className="signup-side-image" />
    </div>
  );
}

export default Signup;
