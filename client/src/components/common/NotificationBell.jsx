import React from 'react';
import { Link } from 'react-router-dom';

const NotificationBell = ({ count = 0 }) => (
  <Link to="/notifications" style={{
    position: 'relative', display: 'inline-flex',
    color: 'var(--color-text-muted)', fontSize: 22, textDecoration: 'none'
  }}>
    🔔
    {count > 0 && (
      <span style={{
        position: 'absolute', top: -6, right: -6,
        background: 'var(--color-danger)', color: 'white',
        fontSize: 10, fontWeight: 700, minWidth: 18, height: 18,
        borderRadius: '50%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', border: '2px solid white', padding: '0 3px',
      }}>
        {count > 99 ? '99+' : count}
      </span>
    )}
  </Link>
);

export default NotificationBell;
