import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { bookingService } from '../services/authService';
import BookingStatusBadge from '../components/booking/BookingStatus';
import { CardSkeleton } from '../components/common/Loader';

const STATUS_OPTIONS = [
  { value: '',           label: 'सर्व' },
  { value: 'pending',    label: '⏳ प्रलंबित' },
  { value: 'accepted',   label: '✅ स्वीकारले' },
  { value: 'started',    label: '🔨 सुरू आहे' },
  { value: 'completed',  label: '🎉 पूर्ण' },
  { value: 'cancelled',  label: '🚫 रद्द' },
];

const BookingsListPage = () => {
  const { t } = useTranslation();
  const { isWorker } = useAuth();
  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatus] = useState('');

  useEffect(() => {
    const params = statusFilter ? { status: statusFilter } : {};
    bookingService.getAll(params)
      .then(({ data }) => { if (data.success) setBookings(data.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 20, marginBottom: 20 }}>📋 माझ्या Bookings</h1>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {STATUS_OPTIONS.map(opt => (
          <button key={opt.value} onClick={() => { setLoading(true); setStatus(opt.value); }}
            style={{
              padding: '7px 14px', borderRadius: 20, border: '1px solid',
              whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'var(--font-family)',
              fontSize: 13, fontWeight: 600,
              borderColor: statusFilter === opt.value ? 'var(--color-primary)' : 'var(--color-border)',
              background:  statusFilter === opt.value ? 'var(--color-primary)' : 'white',
              color:       statusFilter === opt.value ? 'white' : 'var(--color-text-muted)',
            }}>
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 16px', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: 60, marginBottom: 12 }}>📭</div>
          <p>{t('booking.noBookings')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {bookings.map(booking => {
            // CHANGED: booking.employer?.user → booking.employerId?.userId
            //          booking.worker?.user  → booking.workerId?.userId
            const otherParty = isWorker
              ? booking.employerId?.userId
              : booking.workerId?.userId;
            return (
              // CHANGED: booking.id → booking._id
              <Link key={booking._id} to={`/bookings/${booking._id}`}
                style={{ textDecoration: 'none', display: 'block' }}>
                <div className="card card-body" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img
                    src={otherParty?.profilePhoto ||
                      `https://ui-avatars.com/api/?name=${otherParty?.name || 'U'}&background=F97316&color=fff&size=48`}
                    alt=""
                    style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{otherParty?.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                      {booking.startDate} | {booking.totalDays} दिवस
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: 15 }}>
                      ₹{parseInt(booking.totalAmount).toLocaleString()}
                    </div>
                  </div>
                  <BookingStatusBadge status={booking.status} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookingsListPage;
