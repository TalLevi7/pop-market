// src/pages/adminpages/AdminEditCatalog.jsx

import React, { useState, useEffect } from 'react';
import '../../styles/AdminEditCatalog.css';

export default function AdminEditCatalog() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token   = localStorage.getItem('token');

  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [editId, setEditId]   = useState(null);
  const [form, setForm]       = useState({
    pop_name: '',
    serial_number: '',
    category: '',
    sub_category: '',
    release_year: '',
    picture: ''
  });
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/admin/catalog`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(res.statusText);
        setItems(await res.json());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [API_URL, token]);

  const categories    = Array.from(new Set(items.map(i => i.category).filter(Boolean)));
  const subCategories = Array.from(new Set(items.map(i => i.sub_category).filter(Boolean)));

  const startEdit = item => {
    setEditId(item.pop_id);
    setShowNew(false);
    setForm({
      pop_name:      item.pop_name,
      serial_number: item.serial_number || '',
      category:      item.category || '',
      sub_category:  item.sub_category || '',
      release_year:  item.release_year || '',
      picture:       item.picture || ''
    });
  };

  const saveEdit = async id => {
    try {
      const res = await fetch(`${API_URL}/api/admin/catalog/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error(res.statusText);
      setItems(list => list.map(i =>
        i.pop_id === id ? { ...i, ...form } : i
      ));
      setEditId(null);
    } catch (e) {
      alert('Save failed: ' + e.message);
    }
  };

  const deleteEntry = async id => {
    if (!window.confirm('Delete this catalog entry?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/catalog/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(res.statusText);
      setItems(list => list.filter(i => i.pop_id !== id));
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  };

  const startNew = () => {
    setShowNew(true);
    setEditId(null);
    setForm({
      pop_name: '',
      serial_number: '',
      category: '',
      sub_category: '',
      release_year: '',
      picture: ''
    });
  };

  const saveNew = async () => {
    if (!form.pop_name.trim()) return alert('Pop name is required');
    try {
      const res = await fetch(`${API_URL}/api/admin/catalog`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error(res.statusText);
      const { pop_id } = await res.json();
      setItems(list => [...list, { pop_id, ...form }]);
      setShowNew(false);
    } catch (e) {
      alert('Add failed: ' + e.message);
    }
  };

  const filtered = items.filter(i =>
    i.pop_name.toLowerCase().includes(search.toLowerCase()) ||
    (i.serial_number || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <p className="admin-loading">Loading…</p>;
  if (error)   return <p className="admin-error">Error: {error}</p>;

  return (
    <main className="admin-catalog-container">
      <h1>Edit Catalog</h1>
      <div className="catalog-controls">
        <input
          type="text"
          placeholder="Search by name or serial…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="add-new-btn" onClick={startNew}>
          + Add New Pop
        </button>
      </div>

      <table className="admin-catalog-table">
        <thead>
          <tr>
            <th>Serial #</th>
            <th>Name</th>
            <th>Category</th>
            <th>Sub Category</th>
            <th>Release Year</th>
            <th>Picture Link</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {showNew && (
            <tr className="new-row">
              <td>
                <input
                  type="text"
                  value={form.serial_number}
                  onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))}
                  placeholder="Serial #"
                />
              </td>
              <td>
                <input
                  type="text"
                  value={form.pop_name}
                  onChange={e => setForm(f => ({ ...f, pop_name: e.target.value }))}
                  placeholder="Name"
                />
              </td>
              <td>
                <input list="cat-list"
                       value={form.category}
                       onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                       placeholder="Category" />
                <datalist id="cat-list">
                  {categories.map(c => <option key={c} value={c} />)}
                </datalist>
              </td>
              <td>
                <input list="subcat-list"
                       value={form.sub_category}
                       onChange={e => setForm(f => ({ ...f, sub_category: e.target.value }))}
                       placeholder="Sub Category" />
                <datalist id="subcat-list">
                  {subCategories.map(s => <option key={s} value={s} />)}
                </datalist>
              </td>
              <td>
                <input
                  type="number"
                  value={form.release_year}
                  onChange={e => setForm(f => ({ ...f, release_year: e.target.value }))}
                  placeholder="YYYY"
                />
              </td>
              <td>
                <input
                  type="url"
                  value={form.picture}
                  onChange={e => setForm(f => ({ ...f, picture: e.target.value }))}
                  placeholder="https://..."
                />
              </td>
              <td className="admin-catalog-actions">
                <button className="save"   onClick={saveNew}>Save</button>
                <button className="cancel" onClick={() => setShowNew(false)}>Cancel</button>
              </td>
            </tr>
          )}

          {filtered.map(item => (
            <tr key={item.pop_id}>
              <td>{item.serial_number || '—'}</td>
              <td>
                {editId === item.pop_id ? (
                  <input
                    type="text"
                    value={form.pop_name}
                    onChange={e => setForm(f => ({ ...f, pop_name: e.target.value }))}
                  />
                ) : (
                  item.pop_name
                )}
              </td>
              <td>
                {editId === item.pop_id ? (
                  <input list="cat-list"
                         value={form.category}
                         onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  />
                ) : (
                  item.category || '—'
                )}
              </td>
              <td>
                {editId === item.pop_id ? (
                  <input list="subcat-list"
                         value={form.sub_category}
                         onChange={e => setForm(f => ({ ...f, sub_category: e.target.value }))}
                  />
                ) : (
                  item.sub_category || '—'
                )}
              </td>
              <td>
                {editId === item.pop_id ? (
                  <input
                    type="number"
                    value={form.release_year}
                    onChange={e => setForm(f => ({ ...f, release_year: e.target.value }))}
                  />
                ) : (
                  item.release_year || '—'
                )}
              </td>
              <td>
                {editId === item.pop_id ? (
                  <input
                    type="url"
                    value={form.picture}
                    onChange={e => setForm(f => ({ ...f, picture: e.target.value }))}
                    placeholder="https://..."
                  />
                ) : item.picture ? (
                  <a href={item.picture} target="_blank" rel="noopener noreferrer">
                    View
                  </a>
                ) : '—'}
              </td>
              <td className="admin-catalog-actions">
                {editId === item.pop_id ? (
                  <>
                    <button className="save"   onClick={() => saveEdit(item.pop_id)}>Save</button>
                    <button className="cancel" onClick={() => setEditId(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button className="edit"   onClick={() => startEdit(item)}>Edit</button>
                    <button className="delete" onClick={() => deleteEntry(item.pop_id)}>Delete</button>
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
