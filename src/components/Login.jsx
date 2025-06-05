import React, { useState } from 'react';
import '../styles/Auth.css'

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const resp = await fetch('http://localhost:5050/login', {
        method: 'POST',
        credentials: 'include', // important: send/receive session cookie
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const result = await resp.json();
      if (!resp.ok) {
        setErrorMsg(result.error || 'Login failed');
        return;
      }

      // If login succeeded, notify parent
      onLoginSuccess();
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg('Network error');
    }
  };

  return (
    <div className="auth-container">
      <div className='auth-inner'>
        <h1 className="auth-title">LifeXP</h1>

        <div className="auth-box" style={{ maxWidth: '320px', margin: 'auto', padding: '1rem' }}>
          <h2>🔐 Login</h2>
          {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
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
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
