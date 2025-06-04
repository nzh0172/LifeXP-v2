import React, { useState } from 'react';

export default function Register({ onRegisterSuccess, onCancel }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const resp = await fetch('http://localhost:5050/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const result = await resp.json();
      if (!resp.ok) {
        setErrorMsg(result.error || 'Registration failed');
        return;
      }

      setSuccessMsg('Account created! You can now log in.');
      // Optionally clear form
      setUsername('');
      setPassword('');

      // If you want to auto‐login right after register, do:
      onRegisterSuccess();
    } catch (err) {
      console.error('Register error:', err);
      setErrorMsg('Network error');
    }
  };

  return (
    <div style={{ maxWidth: '320px', margin: 'auto', padding: '1rem' }}>
      <h2>📝 Register</h2>
      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
      {successMsg && <p style={{ color: 'green' }}>{successMsg}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username:</label><br />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ marginTop: '0.5rem' }}>
          <label>Password:</label><br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </div>
        <button type="submit" style={{ marginTop: '1rem', width: '100%' }}>
          Create Account
        </button>
      </form>
      <button onClick={onCancel} style={{ marginTop: '0.5rem', color: 'gray' }}>
        Cancel
      </button>
    </div>
  );
}
