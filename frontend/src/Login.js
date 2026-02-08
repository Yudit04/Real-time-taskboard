import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onLoginSuccess }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Use the IP address to avoid CORS issues if testing from multiple devices
      const baseUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:8080' 
        : `http://${window.location.hostname}:8080`;

      const res = await axios.post(`${baseUrl}/api/auth/login`, credentials);
      
      // PERMANENT FIX: Store the token so TaskBoard can find it
      localStorage.setItem('token', res.data.token);
      onLoginSuccess();
    } catch (err) {
      setError('Invalid credentials. Try admin / admin');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={{ color: '#172B4D' }}>Team Login</h2>
        <form onSubmit={handleLogin}>
          <input 
            type="text" 
            placeholder="Username" 
            style={styles.input}
            onChange={e => setCredentials({...credentials, username: e.target.value})} 
          />
          <input 
            type="password" 
            placeholder="Password" 
            style={styles.input}
            onChange={e => setCredentials({...credentials, password: e.target.value})} 
          />
          <button type="submit" style={styles.button}>Login</button>
        </form>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F4F5F7' },
  card: { background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center', width: '300px' },
  input: { width: '100%', padding: '10px', margin: '10px 0', borderRadius: '4px', border: '1px solid #dfe1e6', boxSizing: 'border-box' },
  button: { width: '100%', padding: '10px', background: '#0052CC', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
};

export default Login;