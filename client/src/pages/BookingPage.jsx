import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { workerService, bookingService } from '../services/authService';
import Loader from '../components/common/Loader';

const BookingPage = () => {
  const { workerId, id: bookingId } = useParams();
  const { isEmployer } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [worker, setWorker]       = useState(null);
  const [booking, setBooking]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false); // Step 2 — confirm before submit

  const [form, setForm] = useState({
    startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    totalDays: 1,
    agreedRate: '',
    bookingNote: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        if (workerId) {
          const { data } = await workerService.getById(workerId);
          if (data.success) {
            setWorker(data.data);
            setForm(prev => ({ ...prev, agreedRate: data.data.dailyRate }));
          }
        } else if (bookingId) {
          const { data } = await bookingService.getById(bookingId);
          if (data.success) setBooking(data.data);
        }
      } catch { toast.error('माहिती लोड होऊ शकली नाही'); }
      finally { setLoading(false); }
    };
    load();
  }, [workerId, bookingId]);

  const totalAmount = parseFloat(form.agreedRate || 0) * parseInt(form.totalDays || 1);
  const workerName = worker?.user?.name || 'Worker';
  const lang = i18n.language;
  const getSkillName = (skill) => ({ mr: skill?.category?.nameMr, hi: skill?.category?.nameHi, en: skill?.category?.nameEn }[lang] || skill?.category?.nameEn);

  const handleBook = async () => {
    setSubmitting(true);
    try {
      const { data } = await bookingService.create({
        workerId: parseInt(workerId),
        startDate: form.startDate,
        totalDays: parseInt(form.totalDays),
        agreedRate: parseFloat(form.agreedRate),
        bookingNote: form.bookingNote,
      });
      if (data.success) {
        toast.success('✅ Booking request पाठवली!');
        navigate('/bookings');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking होऊ शकली नाही');
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="container section-sm"><Loader fullPage /></div>;

  // CREATE BOOKING — Step 1: Form
  if (workerId && worker && !confirmed) {
    const workerUser = worker.user || {};
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '24px 16px' }}>

        {/* Worker Summary Card */}
        <div className="card card-body" style={{ marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center', background: 'linear-gradient(135deg, #fff7ed, #ffedd5)' }}>
          <img
            src={workerUser.profilePhoto || `https://ui-avatars.com/api/?name=${workerUser.name}&background=F97316&color=fff&size=64`}
            alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{workerUser.name}</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>📍 {worker.city}, {worker.district}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              {worker.skills?.slice(0, 2).map(s => (
                <span key={s.id} className="badge badge-primary" style={{ fontSize: 11 }}>
                  {s.category?.iconEmoji} {getSkillName(s)}
                </span>
              ))}
              {worker.isVerified && <span className="badge badge-verified" style={{ fontSize: 11 }}>✅ Verified</span>}
            </div>
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-primary)' }}>₹{parseInt(worker.dailyRate).toLocaleString()}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>प्रती दिवस</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'center', marginTop: 4 }}>
              <span style={{ color: '#f59e0b' }}>★</span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{parseFloat(worker.avgRating || 0).toFixed(1)}</span>
            </div>
          </div>
        </div>

        <h1 style={{ fontSize: 18, marginBottom: 20 }}>📅 Booking details</h1>

        <div className="card card-body">

          {/* Date + Days */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">काम सुरू तारीख *</label>
              <input type="date" className="form-control"
                value={form.startDate}
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">किती दिवस?</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button type="button" onClick={() => setForm(p => ({ ...p, totalDays: Math.max(1, p.totalDays - 1) }))}
                  className="btn btn-light" style={{ width: 38, height: 38, padding: 0, fontSize: 18 }}>−</button>
                <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-primary)', minWidth: 36, textAlign: 'center' }}>
                  {form.totalDays}
                </span>
                <button type="button" onClick={() => setForm(p => ({ ...p, totalDays: Math.min(365, p.totalDays + 1) }))}
                  className="btn btn-primary" style={{ width: 38, height: 38, padding: 0, fontSize: 18 }}>+</button>
              </div>
            </div>
          </div>

          {/* Rate */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>रोजंदारी (₹/दिवस) *</span>
              <button type="button" onClick={() => setForm(p => ({ ...p, agreedRate: worker.dailyRate }))}
                style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer' }}>
                ↺ Default ₹{parseInt(worker.dailyRate).toLocaleString()}
              </button>
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--color-text-muted)', fontSize: 16 }}>₹</span>
              <input type="number" className="form-control" value={form.agreedRate} min={100}
                onChange={e => setForm(p => ({ ...p, agreedRate: e.target.value }))}
                style={{ paddingLeft: 28 }} />
            </div>
            {parseFloat(form.agreedRate) < parseFloat(worker.dailyRate) && (
              <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4 }}>
                ⚠️ Worker चा सामान्य दर ₹{parseInt(worker.dailyRate).toLocaleString()} आहे
              </div>
            )}
          </div>

          {/* Note */}
          <div className="form-group">
            <label className="form-label">काम कोणते? (ऐच्छिक)</label>
            <textarea className="form-control"
              placeholder="उदा: घर रंगकाम, मजूर काम, शेत नांगरणी..."
              value={form.bookingNote}
              onChange={e => setForm(p => ({ ...p, bookingNote: e.target.value }))}
              rows={2} maxLength={200} />
          </div>

          {/* Amount Summary */}
          <div style={{ background: 'var(--color-bg)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 4 }}>
              <span>₹{form.agreedRate || 0} × {form.totalDays} दिवस</span>
              <span>₹{totalAmount.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18, borderTop: '1px solid var(--color-border)', paddingTop: 8 }}>
              <span>एकूण रक्कम</span>
              <span style={{ color: 'var(--color-primary)' }}>₹{totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <button type="button" className="btn btn-primary btn-block btn-lg"
            disabled={!form.agreedRate || parseFloat(form.agreedRate) < 100}
            onClick={() => setConfirmed(true)}>
            पुढे — Confirm करा →
          </button>
        </div>
      </div>
    );
  }

  // CREATE BOOKING — Step 2: Confirm screen
  if (workerId && worker && confirmed) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: 18, marginBottom: 4 }}>✅ Booking Confirm करा</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20 }}>
          खाली सर्व माहिती तपासा आणि confirm करा
        </p>

        <div className="card card-body" style={{ marginBottom: 20 }}>
          {/* Worker */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', paddingBottom: 14, borderBottom: '1px solid var(--color-border)', marginBottom: 14 }}>
            <img src={worker.user?.profilePhoto || `https://ui-avatars.com/api/?name=${workerName}&background=F97316&color=fff&size=48`}
              alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
            <div>
              <div style={{ fontWeight: 700 }}>{workerName}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>📍 {worker.city}, {worker.district}</div>
            </div>
          </div>

          {/* Details */}
          {[
            ['📅 तारीख', form.startDate],
            ['⏱️ कालावधी', `${form.totalDays} दिवस`],
            ['💰 रोजंदारी', `₹${parseInt(form.agreedRate).toLocaleString()}/दिवस`],
            ['💵 एकूण', `₹${totalAmount.toLocaleString()}`],
            form.bookingNote && ['📝 काम', form.bookingNote],
          ].filter(Boolean).map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>{label}</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 13 }}>
          💡 <strong>लक्षात ठेवा:</strong> Booking request पाठवल्यावर worker accept किंवा reject करेल.
          Payment काम पूर्ण झाल्यावर होते.
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-light" style={{ flex: 1 }} onClick={() => setConfirmed(false)}>
            ← बदला
          </button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleBook} disabled={submitting}>
            {submitting ? <Loader text="पाठवत आहे..." /> : '📤 Booking Request पाठवा'}
          </button>
        </div>
      </div>
    );
  }

  // VIEW BOOKING DETAIL
  if (bookingId && booking) {
    const workerUser   = booking.worker?.user || {};
    const employerUser = booking.employer?.user || {};

    const statusConfig = {
      pending:   { label: 'प्रलंबित',   color: '#f59e0b', bg: '#fffbeb', icon: '⏳' },
      accepted:  { label: 'स्वीकारले', color: '#22c55e', bg: '#f0fdf4', icon: '✅' },
      rejected:  { label: 'नाकारले',   color: '#ef4444', bg: '#fef2f2', icon: '❌' },
      started:   { label: 'सुरू आहे',  color: '#3b82f6', bg: '#eff6ff', icon: '🔨' },
      completed: { label: 'पूर्ण',     color: '#8b5cf6', bg: '#faf5ff', icon: '🎉' },
      cancelled: { label: 'रद्द',      color: '#6b7280', bg: '#f9fafb', icon: '🚫' },
    };
    const st = statusConfig[booking.status] || statusConfig.pending;

    return (
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--color-text-muted)' }}>←</button>
          <h1 style={{ fontSize: 18, margin: 0 }}>Booking #{booking.id}</h1>
          <span style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700, color: st.color, background: st.bg }}>
            {st.icon} {st.label}
          </span>
        </div>

        <div className="card card-body" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 12 }}>👷 कामगार</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={workerUser.profilePhoto || `https://ui-avatars.com/api/?name=${workerUser.name}&background=F97316&color=fff&size=48`}
              alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
            <div>
              <div style={{ fontWeight: 700 }}>{workerUser.name}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>📞 {workerUser.phone}</div>
            </div>
          </div>
        </div>

        <div className="card card-body" style={{ marginBottom: 16 }}>
          {[
            ['📅 तारीख',      booking.startDate],
            ['📆 कालावधी',   `${booking.totalDays} दिवस`],
            ['💰 रोजंदारी',  `₹${parseInt(booking.agreedRate).toLocaleString()}`],
            ['💵 एकूण',       `₹${parseInt(booking.totalAmount).toLocaleString()}`],
            booking.bookingNote && ['📝 नोट', booking.bookingNote],
          ].filter(Boolean).map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>{label}</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{value}</span>
            </div>
          ))}
        </div>

        {booking.status === 'completed' && !booking.ratingGivenToWorker && (
          <button className="btn btn-primary btn-block" onClick={() => navigate(`/rate/${booking.id}`)}>
            ⭐ Rating द्या
          </button>
        )}
        {booking.status === 'completed' && (!booking.payment || booking.payment?.status !== 'completed') && (
          <button className="btn btn-success btn-block" style={{ marginTop: 8 }} onClick={() => navigate(`/payment/${booking.id}`)}>
            💰 Payment करा
          </button>
        )}
      </div>
    );
  }

  return <div className="container section-sm"><p>Booking सापडली नाही</p></div>;
};

export default BookingPage;