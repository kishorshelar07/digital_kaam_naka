import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <div style={{
    minHeight: '60vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center'
  }}>
    <div style={{ fontSize: 80, marginBottom: 16 }}>🔍</div>
    <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-secondary)', marginBottom: 8 }}>404</h1>
    <h2 style={{ fontSize: 20, marginBottom: 8 }}>पृष्ठ सापडले नाही</h2>
    <p style={{ color: 'var(--color-text-muted)', marginBottom: 28, maxWidth: 320 }}>
      तुम्ही शोधत असलेले पृष्ठ अस्तित्वात नाही किंवा हलवले गेले आहे.
    </p>
    <Link to="/" className="btn btn-primary btn-lg" style={{ textDecoration: 'none' }}>
      🏠 मुख्यपानावर जा
    </Link>
  </div>
);

export default NotFound;
