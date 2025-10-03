import React, { useState } from 'react';

export default function Register({ onSuccess }) {
  const [form, setForm] = useState({ username: '', full_name: '', password: '', role: 'student' });
  const [message, setMessage] = useState('');

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Registered successfully! Please login.');
        if (onSuccess) onSuccess();
        setForm({ username: '', full_name: '', password: '', role: 'student' });
      } else {
        setMessage('Registration failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      setMessage('Error: ' + err.message);
    }
  }

  return (
    <form onSubmit={submit} className="card p-3">
      <h5>Register</h5>
      <input className="form-control mb-2" name="username" placeholder="Username" value={form.username} onChange={update} required />
      <input className="form-control mb-2" name="full_name" placeholder="Full Name" value={form.full_name} onChange={update} required />
      <input type="password" className="form-control mb-2" name="password" placeholder="Password" value={form.password} onChange={update} required />
      <select className="form-control mb-2" name="role" value={form.role} onChange={update}>
        <option value="student">Student</option>
        <option value="lecturer">Lecturer</option>
        <option value="prl">Principal Lecturer (PRL)</option>
        <option value="pl">Program Leader (PL)</option>
        <option value="admin">Admin</option>
      </select>
      <button className="btn btn-primary mb-2">Register</button>
      <div className="text-success">{message}</div>
    </form>
  );
}
