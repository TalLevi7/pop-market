// src/pages/ContactUs.jsx

import React, { useState, useEffect } from 'react';
import '../styles/ContactUs.css';

export default function ContactUs() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token   = localStorage.getItem('token');

  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody]       = useState('');
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  // autofill for signed-in users
  useEffect(() => {
    if (!token) return;
    try {
      const payload = JSON.parse(
        atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
      );
      if (payload.username) setName(payload.username);
      if (payload.email)    setEmail(payload.email);
    } catch {
      // ignore malformed token
    }
  }, [token]);

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); 
    setSuccess('');

    if (!name.trim() || !email.trim() || !subject.trim() || !body.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ name, email, subject, body })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Submission failed');
      }
      setSuccess('Thank you! Your message has been sent.');
      setSubject('');
      setBody('');
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <main className="contact-container">
      <h1>Contact Us</h1>

      {error   && <div className="contact-error">{error}</div>}
      {success && <div className="contact-success">{success}</div>}

      <form className="contact-form" onSubmit={handleSubmit}>
        <label htmlFor="contact-name">Name</label>
        <input
          id="contact-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />

        <label htmlFor="contact-email">Email</label>
        <input
          id="contact-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <label htmlFor="contact-subject">Subject</label>
        <input
          id="contact-subject"
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          required
        />

        <label htmlFor="contact-body">Message</label>
        <textarea
          id="contact-body"
          rows="6"
          value={body}
          onChange={e => setBody(e.target.value)}
          required
        />

        <button type="submit" className="contact-submit">
          Send Message
        </button>
      </form>
    </main>
  );
}
