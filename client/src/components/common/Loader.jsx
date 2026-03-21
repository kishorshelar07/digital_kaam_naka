import React from 'react';

export const CardSkeleton = () => (
  <div className="card card-body" style={{ gap: 12, display: 'flex', flexDirection: 'column' }}>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <div className="skeleton skeleton-avatar" />
      <div style={{ flex: 1 }}>
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-text" style={{ width: '40%' }} />
      </div>
    </div>
    <div className="skeleton skeleton-text" />
    <div className="skeleton skeleton-text" style={{ width: '70%' }} />
    <div className="skeleton" style={{ height: 40, borderRadius: 8, marginTop: 4 }} />
  </div>
);

const Loader = ({ fullPage = false, text = 'लोड होत आहे...' }) => {
  if (fullPage) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '60vh', gap: 16, color: 'var(--color-text-muted)'
    }}>
      <div style={{
        width: 48, height: 48, border: '4px solid var(--color-border)',
        borderTop: '4px solid var(--color-primary)', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <p style={{ fontSize: 14 }}>{text}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--color-text-muted)', fontSize: 14 }}>
      <div style={{
        width: 20, height: 20, border: '3px solid var(--color-border)',
        borderTop: '3px solid var(--color-primary)', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      {text}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Loader;
