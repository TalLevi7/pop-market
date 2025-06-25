// src/pages/adminpages/AdminManageUsers.jsx
// This is a page in the admin's panel in which he can review + manage all the users signed up to the website, including editing their details or banning a user

import React, { useState, useEffect } from 'react';
import '../../styles/AdminManageUsers.css';

export default function AdminManageUsers() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token   = localStorage.getItem('token');

  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [editId, setEditId]   = useState(null);
  const [form, setForm]       = useState({
    username:     '',
    email:        '',
    phone_number: '',
    is_admin:     false
  });
  const [search, setSearch]   = useState('');

  // fetch users
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(res.statusText);
        setUsers(await res.json());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [API_URL, token]);

  // start edit
  const startEdit = user => {
    setEditId(user.user_id);
    setForm({
      username:     user.username,
      email:        user.email,
      phone_number: user.phone_number || '',
      is_admin:     user.is_admin === 1
    });
  };

  // save edit
  const saveEdit = async id => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error(res.statusText);
      setUsers(list =>
        list.map(u =>
          u.user_id === id
            ? { ...u, ...form, is_admin: form.is_admin ? 1 : 0 }
            : u
        )
      );
      setEditId(null);
    } catch (e) {
      alert('Update failed: ' + e.message);
    }
  };

  // delete user
  const deleteUser = async id => {
    if (!window.confirm('Delete this user?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(res.statusText);
      setUsers(list => list.filter(u => u.user_id !== id));
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  };

  // ban/unban
  const toggleBan = async (id, ban) => {
    const msg = ban ? 'Ban this user?' : 'Unban this user?';
    if (!window.confirm(msg)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${id}/ban`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ban })
      });
      if (!res.ok) throw new Error(res.statusText);
      setUsers(list =>
        list.map(u =>
          u.user_id === id ? { ...u, is_banned: ban ? 1 : 0 } : u
        )
      );
    } catch (e) {
      alert((ban ? 'Ban' : 'Unban') + ' failed: ' + e.message);
    }
  };

  // search filter
  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <p className="mu-loading">Loading…</p>;
  if (error)   return <p className="mu-error">Error: {error}</p>;

  return (
    <main className="mu-container">
      <h1>Manage Users</h1>

      <input
        className="mu-search"
        type="text"
        placeholder="Search by username or email…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <table className="mu-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Joined</th>
            <th>Admin?</th>
            <th>Banned?</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(user => (
            <tr key={user.user_id}>
              {editId === user.user_id ? (
                <>
                  <td>
                    <input
                      type="text"
                      value={form.username}
                      onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={form.phone_number}
                      onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
                    />
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString('en-GB')}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={form.is_admin}
                      onChange={e => setForm(f => ({ ...f, is_admin: e.target.checked }))}
                    />
                  </td>
                  <td>{user.is_banned ? 'Yes' : 'No'}</td>
                </>
              ) : (
                <>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.phone_number || '—'}</td>
                  <td>{new Date(user.created_at).toLocaleDateString('en-GB')}</td>
                  <td>{user.is_admin ? 'Yes' : 'No'}</td>
                  <td>{user.is_banned ? 'Yes' : 'No'}</td>
                </>
              )}

              <td className="mu-actions">
                {editId === user.user_id ? (
                  <>
                    <button className="save"   onClick={() => saveEdit(user.user_id)}>Save</button>
                    <button className="cancel" onClick={() => setEditId(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button className="edit" onClick={() => startEdit(user)}>Edit</button>
                    {user.is_banned ? (
                      <button className="unban" onClick={() => toggleBan(user.user_id, false)}>
                        Unban
                      </button>
                    ) : (
                      <button className="ban" onClick={() => toggleBan(user.user_id, true)}>
                        Ban
                      </button>
                    )}
                    <button className="delete" onClick={() => deleteUser(user.user_id)}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
