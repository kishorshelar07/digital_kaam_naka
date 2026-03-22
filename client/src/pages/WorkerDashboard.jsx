import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { workerService, bookingService } from '../services/authService';
import BookingStatusBadge from '../components/booking/BookingStatus';
import Loader, { CardSkeleton } from '../components/common/Loader';

const WorkerDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [worker, setWorker]             = useState(null);
  const [bookings, setBookings]         = useState([]);
  const [earnings, setEarnings]         = useState(null);
  const [loading, setLoading]           = useState(true);
  const [toggling, setToggling]         = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showAvailModal, setShowAvailModal]   = useState(false);
  const [radius, setRadius]                   = useState(20);
  const [detectedLocation, setDetectedLocation] = useState(null);
  const [submitting, setSubmitting]           = useState(false);

  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      // CHANGED: user.workerProfile?.id → user.workerProfile?._id
      const profileRes = await workerService.getById(user.workerProfile?._id);
      if (profileRes.data.success) setWorker(profileRes.data.data);

      const bookingsRes = await bookingService.getAll({ limit: 5, status: 'pending,accepted,started' });
      if (bookingsRes.data.success) setBookings(bookingsRes.data.data || []);

      // CHANGED: user.workerProfile?.id → user.workerProfile?._id
      if (user.workerProfile?._id) {
        const earningsRes = await workerService.getEarnings(user.workerProfile._id);
        if (earningsRes.data.success) setEarnings(earningsRes.data.data);
      }
    } catch { toast.error('डेटा लोड होऊ शकला नाही'); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  const handleAvailabilityToggle = async () => {
    const newValue = !worker?.isAvailable;
    if (newValue === true) {
      setGettingLocation(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => { setDetectedLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGettingLocation(false); setShowAvailModal(true); },
          () => { setDetectedLocation(null); setGettingLocation(false); setShowAvailModal(true); },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      } else { setGettingLocation(false); setShowAvailModal(true); }
    } else {
      setToggling(true);
      try {
        await workerService.setAvailability({ isAvailable: false, date: new Date().toISOString().split('T')[0] });
        setWorker(prev => ({ ...prev, isAvailable: false }));
        toast.info('❌ तुम्ही आता अनुपलब्ध आहात');
      } catch { toast.error('Update होऊ शकले नाही'); }
      finally { setToggling(false); }
    }
  };

  const confirmAvailability = async () => {
    setSubmitting(true);
    try {
      const { data } = await workerService.setAvailability({
        isAvailable: true,
        date: new Date().toISOString().split('T')[0],
        latitude: detectedLocation?.lat,
        longitude: detectedLocation?.lng,
        radiusKm: radius,
      });
      if (data.success) {
        setWorker(prev => ({ ...prev, isAvailable: true }));
        setShowAvailModal(false);
        toast.success('✅ तुम्ही आता उपलब्ध आहात!');
      }
    } catch { toast.error('Update होऊ शकले नाही'); }
    finally { setSubmitting(false); }
  };

  const handleAccept = async (bookingId) => {
    try {
      const { data } = await bookingService.accept(bookingId);
      if (data.success) { toast.success('✅ Booking स्वीकारली!'); loadDashboardData(); }
    } catch { toast.error('Booking accept होऊ शकली नाही'); }
  };

  const handleReject = async (bookingId) => {
    if (!window.confirm('हे booking नाकारायचे आहे का?')) return;
    try {
      const { data } = await bookingService.reject(bookingId, '');
      if (data.success) { toast.info('Booking नाकारली'); loadDashboardData(); }
    } catch { toast.error('Booking reject होऊ शकली नाही'); }
  };

  const handleStartWork = async (bookingId) => {
    try {
      let lat, lng;
      try {
        const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
        lat = pos.coords.latitude; lng = pos.coords.longitude;
      } catch {}
      const { data } = await bookingService.start(bookingId, { latitude: lat, longitude: lng });
      if (data.success) { toast.success('🔨 काम सुरू झाले!'); loadDashboardData(); }
    } catch { toast.error('काम सुरू करता आले नाही'); }
  };

  if (loading) return (
    <div className="container section-sm">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
        {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
      </div>
    </div>
  );

  const isAvailable = worker?.isAvailable;
  // CHANGED: user?.workerProfile?.id → user?.workerProfile?._id
  const workerProfile = user?.workerProfile || {};

  return (
    <div className="container section-sm">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, marginBottom: 4 }}>
          {t('worker.dashboard.greeting', { name: user?.name?.split(' ')[0] })}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
          {new Date().toLocaleDateString('mr-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Availability Toggle */}
      <div className="card card-body" style={{
        marginBottom: 20, borderWidth: 3,
        borderColor: isAvailable ? '#22c55e' : 'var(--color-border)',
        background: isAvailable ? '#f0fdf4' : 'white',
        textAlign: 'center', padding: 28, transition: 'all 0.3s',
      }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>{isAvailable ? '🟢' : '🔴'}</div>
        <h2 style={{ fontSize: 18, marginBottom: 4, color: isAvailable ? '#16a34a' : '#ea580c' }}>
          {isAvailable ? 'आज उपलब्ध आहात!' : 'आज उपलब्ध नाही'}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20 }}>
          {isAvailable ? `Employers तुम्हाला ${radius}km परिसरात पाहू शकतात` : 'Toggle ON करा'}
        </p>
        <button onClick={handleAvailabilityToggle} disabled={toggling || gettingLocation}
          style={{ width: 120, height: 56, borderRadius: 28, border: 'none', cursor: 'pointer',
            background: isAvailable ? '#22c55e' : '#d1d5db', position: 'relative', margin: '0 auto', display: 'block' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'white', position: 'absolute', top: 4,
            left: isAvailable ? 68 : 4, transition: 'left 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
            {toggling || gettingLocation ? '⏳' : isAvailable ? '✅' : '😴'}
          </div>
        </button>
      </div>

      {/* Availability Confirm Modal */}
      {showAvailModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div className="card card-body" style={{ width: '100%', maxWidth: 480, borderRadius: '20px 20px 16px 16px', padding: 24 }}>
            <h3 style={{ fontSize: 18, marginBottom: 16, textAlign: 'center' }}>📍 Availability Confirm करा</h3>
            <div style={{ padding: 14, borderRadius: 10, marginBottom: 16, background: detectedLocation ? '#f0fdf4' : '#fff7ed', border: `1px solid ${detectedLocation ? '#22c55e' : '#f97316'}` }}>
              {detectedLocation
                ? <div style={{ fontWeight: 700, color: '#16a34a' }}>✅ GPS Location मिळाली — {detectedLocation.lat.toFixed(4)}, {detectedLocation.lng.toFixed(4)}</div>
                : <div style={{ fontWeight: 700, color: '#ea580c' }}>⚠️ GPS Location नाही</div>}
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: 600, display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>काम किती दूर जाल?</span>
                <span style={{ color: 'var(--color-primary)', fontWeight: 800 }}>{radius} km</span>
              </label>
              <input type="range" min="5" max="100" step="5" value={radius}
                onChange={e => setRadius(parseInt(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-light" style={{ flex: 1 }} onClick={() => setShowAvailModal(false)}>रद्द</button>
              <button className="btn btn-success" style={{ flex: 2 }} onClick={confirmAvailability} disabled={submitting}>
                {submitting ? '⏳ Update होत आहे...' : '✅ उपलब्ध आहे!'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: 24, gap: 12 }}>
        {[
          { label: t('worker.dashboard.totalJobs'), value: worker?.totalJobs || 0, icon: '💼', color: 'var(--color-secondary)' },
          { label: t('worker.dashboard.rating'), value: `${parseFloat(worker?.avgRating || 0).toFixed(1)} ⭐`, icon: '⭐', color: '#F59E0B' },
          { label: t('worker.dashboard.monthEarnings'), value: `₹${parseInt(earnings?.thisMonth?.amount || 0).toLocaleString()}`, icon: '💰', color: 'var(--color-success)' },
        ].map((stat, i) => (
          <div key={i} className="card card-body" style={{ textAlign: 'center', padding: '16px 12px' }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{stat.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Pending Bookings */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18 }}>📋 {t('worker.dashboard.pendingRequests')}</h2>
          <Link to="/bookings" style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 600 }}>सर्व पाहा →</Link>
        </div>

        {bookings.length === 0 ? (
          <div className="card card-body" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '32px 16px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <p>{t('worker.dashboard.noBookings')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* CHANGED: booking.id → booking._id, booking.employer?.user → booking.employerId?.userId */}
            {bookings.map(booking => (
              <div key={booking._id} className="card card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <img
                    src={booking.employerId?.userId?.profilePhoto ||
                      `https://ui-avatars.com/api/?name=${booking.employerId?.userId?.name || 'E'}&background=1E3A5F&color=fff&size=48`}
                    alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{booking.employerId?.userId?.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                      📅 {booking.startDate} | {booking.totalDays} दिवस
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-primary)', marginTop: 2 }}>
                      ₹{parseInt(booking.agreedRate).toLocaleString()}/दिवस = ₹{parseInt(booking.totalAmount).toLocaleString()} एकूण
                    </div>
                  </div>
                  <BookingStatusBadge status={booking.status} />
                </div>

                {booking.bookingNote && (
                  <div style={{ background: 'var(--color-bg)', borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                    💬 "{booking.bookingNote}"
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  {booking.status === 'pending' && (
                    <>
                      {/* CHANGED: booking.id → booking._id */}
                      <button onClick={() => handleAccept(booking._id)} className="btn btn-success" style={{ flex: 1 }}>✅ स्वीकारा</button>
                      <button onClick={() => handleReject(booking._id)} className="btn btn-danger btn-sm" style={{ minWidth: 80 }}>❌ नाकारा</button>
                    </>
                  )}
                  {booking.status === 'accepted' && (
                    <button onClick={() => handleStartWork(booking._id)} className="btn btn-primary" style={{ flex: 1 }}>🔨 काम सुरू झाले</button>
                  )}
                  {booking.status === 'started' && (
                    <div style={{ flex: 1, textAlign: 'center', color: 'var(--color-primary)', fontWeight: 600 }}>🔨 काम सुरू आहे...</div>
                  )}
                  <Link to={`/bookings/${booking._id}`} className="btn btn-light btn-sm" style={{ textDecoration: 'none' }}>तपशील</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid-2" style={{ gap: 12 }}>
        {/* CHANGED: workerProfile.id → workerProfile._id */}
        <Link to={`/workers/${workerProfile._id}`} className="card card-body"
          style={{ textDecoration: 'none', textAlign: 'center', padding: 20, display: 'block' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>👤</div>
          <div style={{ fontWeight: 600 }}>माझा प्रोफाइल</div>
        </Link>
        <Link to="/bookings" className="card card-body"
          style={{ textDecoration: 'none', textAlign: 'center', padding: 20, display: 'block' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <div style={{ fontWeight: 600 }}>सर्व Bookings</div>
        </Link>
      </div>
    </div>
  );
};

export default WorkerDashboard;
