import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '../context/NotificationContext';

const TYPE_ICONS = {
  booking_request:'📅', booking_accepted:'✅', booking_rejected:'❌',
  booking_completed:'🎉', payment_received:'💰', new_rating:'⭐',
  urgent_job_nearby:'🚨', system:'📢', promotion:'🎁',
};

const NotificationsPage = () => {
  const { t, i18n } = useTranslation();
  const { notifications, markAllRead, markOneRead, loading } = useNotifications();
  const navigate = useNavigate();
  const lang = i18n.language;

  const getLocalizedContent = (notif) => {
    const key = lang.charAt(0).toUpperCase() + lang.slice(1);
    return {
      title:   notif['title' + key]   || notif.titleEn   || notif.titleMr   || 'सूचना',
      message: notif['message' + key] || notif.messageEn || notif.messageMr || '',
    };
  };

  const handleClick = async (notif) => {
    // CHANGED: notif.id → notif._id
    if (!notif.isRead) await markOneRead(notif._id);
    if (notif.referenceType === 'booking') navigate(`/bookings/${notif.referenceId}`);
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 1)   return 'आत्ताच';
    if (mins < 60)  return `${mins} मिनिटांपूर्वी`;
    if (hours < 24) return `${hours} तासांपूर्वी`;
    return `${days} दिवसांपूर्वी`;
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20 }}>🔔 {t('notifications.title')}</h1>
        {notifications.some(n => !n.isRead) && (
          <button className="btn btn-light btn-sm" onClick={markAllRead}>
            {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>लोड होत आहे...</div>
      ) : notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔕</div>
          <p>{t('notifications.noNotifications')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* CHANGED: notif.id → notif._id */}
          {notifications.map(notif => {
            const { title, message } = getLocalizedContent(notif);
            return (
              <div
                key={notif._id}
                onClick={() => handleClick(notif)}
                style={{
                  padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                  background: notif.isRead ? 'white' : 'var(--color-primary-light)',
                  border: `1px solid ${notif.isRead ? 'var(--color-border)' : 'var(--color-primary)'}`,
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                }}
              >
                <span style={{ fontSize: 28, flexShrink: 0 }}>{TYPE_ICONS[notif.type] || '🔔'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: notif.isRead ? 500 : 700, fontSize: 14, marginBottom: 2 }}>{title}</div>
                  {message && <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{message}</div>}
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>{timeAgo(notif.createdAt)}</div>
                </div>
                {!notif.isRead && (
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0, marginTop: 4 }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
