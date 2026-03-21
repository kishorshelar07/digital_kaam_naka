import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { changeLanguage } from '../i18n/i18n';
import { toast } from 'react-toastify';

const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('लॉग आउट यशस्वी!');
    navigate('/');
  };

  const LANGS = [
    { code: 'mr', label: 'मराठी' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'en', label: 'English' },
  ];

  const LINKS = [
    { icon: '📋', label: 'माझ्या Bookings', to: '/bookings' },
    { icon: '🔔', label: 'सूचना', to: '/notifications' },
    { icon: '👤', label: 'प्रोफाइल बदला', to: user?.role === 'worker' ? `/workers/${user?.workerProfile?.id}` : '/employer/dashboard' },
  ];

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 20, marginBottom: 24 }}>⚙️ {t('nav.settings')}</h1>

      {/* User Info */}
      <div className="card card-body" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <img
          src={user?.profilePhoto || `https://ui-avatars.com/api/?name=${user?.name}&background=F97316&color=fff&size=64`}
          alt=""
          style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }}
        />
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{user?.name}</div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>📞 +91 {user?.phone}</div>
          <span className="badge badge-primary" style={{ marginTop: 4, textTransform: 'capitalize' }}>
            {user?.role}
          </span>
        </div>
      </div>

      {/* Language */}
      <div className="card card-body" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, marginBottom: 12 }}>🌐 भाषा बदला</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {LANGS.map(l => (
            <button key={l.code}
              onClick={() => changeLanguage(l.code)}
              className={`btn ${i18n.language === l.code ? 'btn-primary' : 'btn-light'}`}
              style={{ flex: 1 }}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="card" style={{ marginBottom: 16 }}>
        {LINKS.map(item => (
          <button key={item.label} onClick={() => navigate(item.to)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14, width: '100%',
              padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-family)', fontSize: 15,
              borderBottom: '1px solid var(--color-border)',
            }}>
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{item.label}</span>
            <span style={{ marginLeft: 'auto', color: 'var(--color-text-muted)' }}>→</span>
          </button>
        ))}
      </div>

      <button onClick={handleLogout} className="btn btn-danger btn-block btn-lg">
        🚪 {t('nav.logout')}
      </button>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)', marginTop: 24 }}>
        Digital Kaam Naka v1.0.0 | Made in Maharashtra 🧡
      </p>
    </div>
  );
};

export default SettingsPage;
