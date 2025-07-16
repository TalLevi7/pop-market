// Login page - Upon successful log in, stores the user's details in a JWToken
import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';  // Import Link here
import { AuthContext } from '../context/AuthContext'; // Import AuthContext
import '../styles/Login.css';

function Login() {
  const { login } = useContext(AuthContext); // Destructure 'login' from AuthContext
  const [email, setEmail] = useState(''); // State for email input
  const [password, setPassword] = useState(''); // State for password input
  const [error, setError] = useState(''); // State for error handling
  const navigate = useNavigate(); // Use react-router's navigate for redirection

  // Handle form submission for login
  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent form from refreshing the page
    setError(''); // Reset the error message before making the API call

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/login`, // Your API URL for login
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }), // Sending the email and password
        }
      );

      const data = await response.json(); // Parsing the response from the server

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      // On successful login, call the 'login' function from AuthContext to store the token
      login(data.token);

      // Show "Logged In Successfully!" alert
      alert("Logged In Successfully!");

      // Redirect the user to the homepage after a successful login
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError('Server error, please try again.'); // Set a generic error message
    }
  };

  return (
    <div className="login-page">
      <img src="./images/login-left.png" alt="Login Left" className="login-side-image" />
      <div className="login-container">
        <h2>Login to your Account</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)} // Update email state
            required
          />

          <label htmlFor="password">Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)} // Update password state
            required
          />

          {error && <p className="error">{error}</p>} {/* Display error message */}
          <button type="submit">Login</button>
        </form>
        <p className="forgot-text">
          Forgot password? <Link to="/forgot-password">Click here</Link>
        </p>
        <p className="signup-text">
          Don't have an account? <Link to="/signup">Sign up here</Link>
        </p>
      </div>
      <img src="./images/login-right.png" alt="Login Right" className="login-side-image" />
    </div>
  );
}

export default Login;
