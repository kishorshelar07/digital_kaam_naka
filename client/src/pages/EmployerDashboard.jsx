import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { jobService, bookingService } from '../services/authService';
import { CardSkeleton } from '../components/common/Loader';
import BookingStatusBadge from '../components/booking/BookingStatus';

const EmployerDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [jobs, setJobs]         = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [jobsRes, bookingsRes] = await Promise.all([
          jobService.getAll({ limit: 5, status: 'open' }),
          bookingService.getAll({ limit: 5 }),
        ]);
        if (jobsRes.data.success)     setJobs(jobsRes.data.data || []);
        if (bookingsRes.data.success) setBookings(bookingsRes.data.data || []);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const STATS = [
    { label: 'सक्रिय जाहिराती',  value: jobs.length,                                       icon: '📋', color: 'var(--color-primary)' },
    { label: 'प्रलंबित बुकिंग',  value: bookings.filter(b => b.status === 'pending').length, icon: '⏳', color: '#F59E0B' },
    { label: 'सक्रिय कामगार',    value: bookings.filter(b => b.status === 'started').length, icon: '🔨', color: 'var(--color-success)' },
    { label: 'पूर्ण कामे',        value: bookings.filter(b => b.status === 'completed').length,icon: '✅', color: 'var(--color-secondary)' },
  ];

  return (
    <div className="container section-sm">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22 }}>
            {t('employer.dashboard.greeting', { name: user?.name?.split(' ')[0] })}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>तुमच्या कामांचे व्यवस्थापन करा</p>
        </div>
        <Link to="/jobs/post" className="btn btn-primary btn-lg" style={{ textDecoration: 'none' }}>
          + {t('employer.dashboard.postJob')}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24, gap: 12 }}>
        {STATS.map((stat, i) => (
          <div key={i} className="card card-body" style={{ textAlign: 'center', padding: '16px 12px' }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{stat.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        {/* Active Jobs */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18 }}>📋 माझ्या जाहिराती</h2>
            <Link to="/jobs" style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 600 }}>सर्व →</Link>
          </div>
          {loading ? <CardSkeleton /> : jobs.length === 0 ? (
            <div className="card card-body" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '32px 16px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <p>अजून कोणतीही जाहिरात नाही</p>
              <Link to="/jobs/post" className="btn btn-primary" style={{ marginTop: 12, textDecoration: 'none' }}>
                + काम टाका
              </Link>
            </div>
          ) : jobs.map(job => (
            <div key={job.id} className="card card-body" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{job.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                    📅 {job.jobDate} | ₹{parseInt(job.dailyRate).toLocaleString()}/दिवस
                  </div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    👷 {job.workersBooked}/{job.workersNeeded} कामगार
                  </div>
                </div>
                <span className={`status-pill ${job.status === 'open' ? 'status-open' : 'status-completed'}`}>
                  {job.status === 'open' ? 'उपलब्ध' : job.status}
                </span>
              </div>
              {job.isUrgent && <div className="badge badge-danger" style={{ marginTop: 8, fontSize: 11 }}>🚨 तातडीचे</div>}
            </div>
          ))}
        </div>

        {/* Recent Bookings */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18 }}>📊 अलीकडील बुकिंग</h2>
            <Link to="/bookings" style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 600 }}>सर्व →</Link>
          </div>
          {loading ? <CardSkeleton /> : bookings.length === 0 ? (
            <div className="card card-body" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '32px 16px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <p>अजून कोणतीही बुकिंग नाही</p>
              <Link to="/workers" className="btn btn-outline" style={{ marginTop: 12, textDecoration: 'none' }}>
                कामगार शोधा
              </Link>
            </div>
          ) : bookings.map(booking => (
            <div key={booking.id} className="card card-body" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img
                  src={booking.worker?.user?.profilePhoto ||
                    `https://ui-avatars.com/api/?name=${booking.worker?.user?.name || 'W'}&background=F97316&color=fff&size=40`}
                  alt=""
                  style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{booking.worker?.user?.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                    {booking.startDate} | ₹{parseInt(booking.totalAmount).toLocaleString()}
                  </div>
                </div>
                <BookingStatusBadge status={booking.status} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="card card-body" style={{ marginTop: 24, background: 'var(--color-primary-light)', border: '2px solid var(--color-primary)', textAlign: 'center', padding: 28 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>👷</div>
        <h3 style={{ marginBottom: 8 }}>जवळचे उपलब्ध कामगार शोधा</h3>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 16, fontSize: 14 }}>
          आत्ता उपलब्ध असलेले कामगार GPS द्वारे शोधा
        </p>
        <Link to="/workers?availableToday=true" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
          🗺️ जवळचे कामगार पाहा
        </Link>
      </div>
    </div>
  );
};

export default EmployerDashboard;
