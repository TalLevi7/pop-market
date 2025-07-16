// src/pages/UserPanel.jsx
// User Panel for a user to edit his details / select preferences
import React, { useState, useEffect } from 'react';
import '../styles/UserPanel.css';

export default function UserPanel() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token   = localStorage.getItem('token');

  const [form, setForm]       = useState({
    username: '',
    email:    '',
    phone:    '',
    notify:   false
  });
  const [newPassword, setNewPassword]             = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  // Fetch profile on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/user`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();
        setForm({
          username: data.username,
          email:    data.email,
          phone:    data.phone_number || '',
          notify:   data.notify_wishlist === 1
        });
      } catch {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [API_URL, token]);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.username.trim()) {
      setError('Username is required');
      return;
    }

    // If user entered a new password, verify match
    if ((newPassword || confirmNewPassword) && newPassword !== confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      const payload = {
        username:        form.username,
        phone_number:    form.phone,
        notify_wishlist: form.notify
      };
      if (newPassword) {
        payload.new_password = newPassword;
      }

      const res = await fetch(`${API_URL}/api/user`, {
        method: 'PUT',
        headers: {
          'Content-Type':  'application/json',
          Authorization:   `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Update failed');
      }

      setSuccess('Profile updated');
      // clear password fields on success
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) return <p className="up-loading">Loading…</p>;

  return (
    <main className="up-container">
      <h1>User Settings</h1>

      {error   && <div className="up-error">{error}</div>}
      {success && <div className="up-success">{success}</div>}

      <form className="up-form" onSubmit={handleSubmit}>

        <label htmlFor="up-email">
          Email <span className="up-note">(cannot be changed)</span>
        </label>
        <input
          id="up-email"
          type="email"
          value={form.email}
          disabled
        />

        <label htmlFor="up-username">Username</label>
        <input
          id="up-username"
          type="text"
          value={form.username}
          onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
          required
        />

        <label htmlFor="up-phone">Phone Number</label>
        <input
          id="up-phone"
          type="text"
          value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
        />
        <div className="up-help">
          Adding your phone will display it on any listings you post.
        </div>

        {/* ─── Password change fields ─────────────────────────────────────────── */}
        <label htmlFor="up-new-password">New Password</label>
        <input
          id="up-new-password"
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          pattern="(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$"
          title="At least 8 characters, with at least one letter and one number."
        />

        <label htmlFor="up-confirm-password">Confirm New Password</label>
        <input
          id="up-confirm-password"
          type="password"
          value={confirmNewPassword}
          onChange={e => setConfirmNewPassword(e.target.value)}
        />
        {/* ──────────────────────────────────────────────────────────────────── */}

        <div className="up-checkbox">
          <input
            id="up-notify"
            type="checkbox"
            checked={form.notify}
            onChange={e => setForm(f => ({ ...f, notify: e.target.checked }))}
          />
          <label htmlFor="up-notify">
            Email me when an item in my Wish List appears on Market
          </label>
        </div>

        <button type="submit" className="up-submit">
          Save Changes
        </button>
      </form>
    </main>
  );
}
