/**
 * components/common/Navbar.jsx
 * FIXED: Mobile view — language switcher + hamburger menu visible
 */

import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { changeLanguage } from '../../i18n/i18n';
import NotificationBell from './NotificationBell';
import './Navbar.css';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { user, isLoggedIn, isWorker, isEmployer, isAdmin, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen]     = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMenuOpen(false);
    setMobileMenu(false);
  };

  const langs = [
    { code: 'mr', label: 'म' },
    { code: 'hi', label: 'हि' },
    { code: 'en', label: 'EN' },
  ];

  return (
    <>
      <nav className="navbar-desktop" aria-label="Main navigation">
        <div className="navbar-container">

          {/* Logo */}
          <Link to="/" className="navbar-brand" onClick={() => setMobileMenu(false)}>
            <span className="brand-icon">🏗️</span>
            <div>
              <span className="brand-name">Digital Kaam Naka</span>
              <span className="brand-tagline">{t('app.tagline')}</span>
            </div>
          </Link>

          {/* Desktop Center Links */}
          <div className="navbar-links">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>{t('nav.home')}</NavLink>
            <NavLink to="/workers" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>{t('search.title')}</NavLink>
            <NavLink to="/jobs" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>काम पाहा</NavLink>
          </div>

          {/* Right Section */}
          <div className="navbar-right">

            {/* Desktop Lang Switcher */}
            <div className="lang-switcher lang-desktop">
              {langs.map(l => (
                <button key={l.code} className={`lang-btn ${i18n.language === l.code ? 'active' : ''}`}
                  onClick={() => changeLanguage(l.code)}>{l.label}</button>
              ))}
            </div>

            {/* Desktop Auth */}
            {isLoggedIn ? (
              <div className="auth-section desktop-only">
                <NotificationBell count={unreadCount} />
                <div className="user-menu" onClick={() => setMenuOpen(!menuOpen)}>
                  <img src={user?.profilePhoto || `https://ui-avatars.com/api/?name=${user?.name}&background=F97316&color=fff`}
                    alt={user?.name} className="user-avatar" />
                  <span className="user-name">{user?.name?.split(' ')[0]}</span>
                  <span className="dropdown-arrow">{menuOpen ? '▲' : '▼'}</span>
                  {menuOpen && (
                    <div className="user-dropdown" onClick={e => e.stopPropagation()}>
                      <div className="dropdown-header">
                        <strong>{user?.name}</strong>
                        <span className="dropdown-role">{user?.role}</span>
                      </div>
                      <Link to={isWorker ? '/worker/dashboard' : isAdmin ? '/admin' : '/employer/dashboard'}
                        className="dropdown-item" onClick={() => setMenuOpen(false)}>📊 {t('nav.dashboard')}</Link>
                      <Link to="/bookings" className="dropdown-item" onClick={() => setMenuOpen(false)}>📋 {t('nav.bookings')}</Link>
                      <Link to="/notifications" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                        🔔 {t('nav.notifications')}
                        {unreadCount > 0 && <span className="badge-count">{unreadCount}</span>}
                      </Link>
                      <Link to="/settings" className="dropdown-item" onClick={() => setMenuOpen(false)}>⚙️ {t('nav.settings')}</Link>
                      <hr className="dropdown-divider" />
                      <button className="dropdown-item text-danger" onClick={handleLogout}>🚪 {t('nav.logout')}</button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="auth-buttons desktop-only">
                <Link to="/login" className="btn btn-outline btn-sm">{t('nav.login')}</Link>
                <Link to="/register" className="btn btn-primary btn-sm">{t('nav.register')}</Link>
              </div>
            )}

            {/* Mobile Right: Lang + Hamburger */}
            <div className="mobile-right">
              <div className="lang-switcher lang-mobile">
                {langs.map(l => (
                  <button key={l.code} className={`lang-btn ${i18n.language === l.code ? 'active' : ''}`}
                    onClick={() => changeLanguage(l.code)}>{l.label}</button>
                ))}
              </div>
              <button className="hamburger-btn" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Menu">
                {mobileMenu ? '✕' : '☰'}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenu && (
          <div className="mobile-dropdown">
            <NavLink to="/" end className="mobile-menu-item" onClick={() => setMobileMenu(false)}>🏠 {t('nav.home')}</NavLink>
            <NavLink to="/workers" className="mobile-menu-item" onClick={() => setMobileMenu(false)}>🔍 {t('search.title')}</NavLink>
            <NavLink to="/jobs" className="mobile-menu-item" onClick={() => setMobileMenu(false)}>💼 काम पाहा</NavLink>

            {isLoggedIn ? (
              <>
                <div className="mobile-menu-divider" />
                <div className="mobile-user-info">
                  <img src={user?.profilePhoto || `https://ui-avatars.com/api/?name=${user?.name}&background=F97316&color=fff&size=40`}
                    alt={user?.name} className="mobile-user-avatar" />
                  <div>
                    <div style={{ fontWeight: 700 }}>{user?.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{user?.role}</div>
                  </div>
                </div>
                <NavLink to={isWorker ? '/worker/dashboard' : isAdmin ? '/admin' : '/employer/dashboard'}
                  className="mobile-menu-item" onClick={() => setMobileMenu(false)}>📊 {t('nav.dashboard')}</NavLink>
                <NavLink to="/bookings" className="mobile-menu-item" onClick={() => setMobileMenu(false)}>
                  📋 {t('nav.bookings')}
                  {unreadCount > 0 && <span className="badge-count" style={{ marginLeft: 'auto' }}>{unreadCount}</span>}
                </NavLink>
                <NavLink to="/notifications" className="mobile-menu-item" onClick={() => setMobileMenu(false)}>🔔 {t('nav.notifications')}</NavLink>
                <NavLink to="/settings" className="mobile-menu-item" onClick={() => setMobileMenu(false)}>⚙️ {t('nav.settings')}</NavLink>
                <div className="mobile-menu-divider" />
                <button className="mobile-menu-item text-danger" onClick={handleLogout}>🚪 {t('nav.logout')}</button>
              </>
            ) : (
              <>
                <div className="mobile-menu-divider" />
                <Link to="/login" className="mobile-menu-item" onClick={() => setMobileMenu(false)}>👤 {t('nav.login')}</Link>
                <Link to="/register" className="mobile-menu-item" onClick={() => setMobileMenu(false)}>✅ {t('nav.register')}</Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Mobile Bottom Tab Bar */}
      <nav className="navbar-mobile" aria-label="Mobile navigation">
        <NavLink to="/" end className={({ isActive }) => `mobile-tab ${isActive ? 'active' : ''}`}>
          <span className="tab-icon">🏠</span>
          <span className="tab-label">{t('nav.home')}</span>
        </NavLink>
        <NavLink to="/workers" className={({ isActive }) => `mobile-tab ${isActive ? 'active' : ''}`}>
          <span className="tab-icon">🔍</span>
          <span className="tab-label">{t('nav.search')}</span>
        </NavLink>
        {isEmployer && (
          <NavLink to="/jobs/post" className={({ isActive }) => `mobile-tab post-tab ${isActive ? 'active' : ''}`}>
            <span className="tab-icon post-icon">+</span>
            <span className="tab-label">{t('nav.postJob')}</span>
          </NavLink>
        )}
        {isWorker && (
          <NavLink to="/worker/dashboard" className={({ isActive }) => `mobile-tab post-tab ${isActive ? 'active' : ''}`}>
            <span className="tab-icon post-icon">⚡</span>
            <span className="tab-label">उपलब्ध</span>
          </NavLink>
        )}
        <NavLink to="/bookings" className={({ isActive }) => `mobile-tab ${isActive ? 'active' : ''}`}>
          <span className="tab-icon">📋</span>
          {unreadCount > 0 && <span className="tab-badge">{unreadCount}</span>}
          <span className="tab-label">{t('nav.bookings')}</span>
        </NavLink>
        <NavLink to={isLoggedIn ? (isWorker ? '/worker/dashboard' : '/employer/dashboard') : '/login'}
          className={({ isActive }) => `mobile-tab ${isActive ? 'active' : ''}`}>
          <span className="tab-icon">
            {isLoggedIn
              ? <img src={user?.profilePhoto || `https://ui-avatars.com/api/?name=${user?.name}&background=F97316&color=fff&size=32`}
                  alt="" className="tab-avatar" />
              : '👤'}
          </span>
          <span className="tab-label">{t('nav.profile')}</span>
        </NavLink>
      </nav>

      {(menuOpen || mobileMenu) && (
        <div className="nav-overlay" onClick={() => { setMenuOpen(false); setMobileMenu(false); }} />
      )}
    </>
  );
};

export default Navbar;
