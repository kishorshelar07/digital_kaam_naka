/**
 * ================================================================
 * pages/PostJob.jsx — 3-Step Job Posting Form
 * Employer posts a job: Details → Schedule → Location
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { jobService } from '../services/authService';
import Loader from '../components/common/Loader';

const PostJob = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language;
  const [step, setStep]               = useState(1);
  const [categories, setCategories]   = useState([]);
  const [loading, setLoading]         = useState(false);
  const [form, setForm] = useState({
    categoryId: '', title: '', description: '', requirements: '',
    workersNeeded: 1, dailyRate: '', isUrgent: false,
    jobDate: new Date().toISOString().split('T')[0], durationDays: 1, jobType: 'daily',
    address: '', city: '', district: '', pincode: '',
    latitude: '', longitude: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    jobService.getCategories().then(({ data }) => { if (data.success) setCategories(data.data); }).catch(() => {});
    // Get user's location for job site
    navigator.geolocation?.getCurrentPosition(pos => {
      setForm(prev => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
    }, () => {}, { timeout: 5000 });
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const getCatName = (cat) => ({ mr: cat.nameMr, hi: cat.nameHi, en: cat.nameEn }[lang] || cat.nameEn);

  const validateStep = (s) => {
    const errs = {};
    if (s === 1) {
      if (!form.categoryId) errs.categoryId = 'काम प्रकार निवडा';
      if (!form.title.trim() || form.title.length < 5) errs.title = 'काम नाव किमान 5 अक्षरे असावे';
    }
    if (s === 2) {
      if (!form.dailyRate || parseFloat(form.dailyRate) < 100) errs.dailyRate = 'रोजंदारी किमान ₹100 असावी';
      if (!form.jobDate) errs.jobDate = 'तारीख आवश्यक आहे';
    }
    if (s === 3) {
      if (!form.city.trim()) errs.city = 'शहर आवश्यक आहे';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => { if (validateStep(step)) setStep(s => s + 1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        categoryId: parseInt(form.categoryId),
        workersNeeded: parseInt(form.workersNeeded),
        dailyRate: parseFloat(form.dailyRate),
        durationDays: parseInt(form.durationDays),
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
      };
      const { data } = await jobService.create(payload);
      if (data.success) {
        toast.success('✅ काम जाहिरात यशस्वीरित्या टाकली!');
        navigate('/employer/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'काम टाकता आले नाही');
    } finally { setLoading(false); }
  };

  const StepIndicator = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, gap: 8 }}>
      {[
        { n: 1, label: t('job.post.step1') },
        { n: 2, label: t('job.post.step2') },
        { n: 3, label: t('job.post.step3') },
      ].map((s, i) => (
        <React.Fragment key={s.n}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14,
              background: step >= s.n ? 'var(--color-primary)' : 'var(--color-border)',
              color: step >= s.n ? 'white' : 'var(--color-text-muted)',
            }}>{step > s.n ? '✓' : s.n}</div>
            <div style={{ fontSize: 10, color: step >= s.n ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: 600 }}>{s.label}</div>
          </div>
          {i < 2 && <div style={{ flex: 1, height: 2, background: step > s.n ? 'var(--color-primary)' : 'var(--color-border)', maxWidth: 60, marginBottom: 16 }} />}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22 }}>📋 {t('job.post.title')}</h1>
      </div>
      <StepIndicator />

      <form onSubmit={handleSubmit}>
        {/* STEP 1: Job Details */}
        {step === 1 && (
          <div className="card card-body fade-in">
            <h2 style={{ fontSize: 17, marginBottom: 20 }}>💼 काम माहिती</h2>

            {/* Urgent Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: form.isUrgent ? 'var(--color-danger-light)' : 'var(--color-bg)', borderRadius: 10, marginBottom: 16, border: `2px solid ${form.isUrgent ? 'var(--color-danger)' : 'var(--color-border)'}` }}>
              <div>
                <div style={{ fontWeight: 700, color: form.isUrgent ? 'var(--color-danger)' : 'var(--color-text)' }}>🚨 {t('job.post.urgent')}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>जवळच्या कामगारांना push notification जाईल</div>
              </div>
              <input type="checkbox" checked={form.isUrgent} onChange={e => set('isUrgent', e.target.checked)}
                style={{ width: 22, height: 22, cursor: 'pointer', accentColor: 'var(--color-danger)' }} />
            </div>

            <div className="form-group">
              <label className="form-label">{t('job.post.category')} *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {categories.map(cat => (
                  <button key={cat.id} type="button" onClick={() => set('categoryId', cat.id)}
                    style={{
                      padding: '10px 6px', border: '2px solid', borderRadius: 8, cursor: 'pointer',
                      fontFamily: 'var(--font-family)', fontSize: 11, fontWeight: 600,
                      borderColor: form.categoryId == cat.id ? 'var(--color-primary)' : 'var(--color-border)',
                      background: form.categoryId == cat.id ? 'var(--color-primary-light)' : 'white',
                      color: form.categoryId == cat.id ? 'var(--color-primary)' : 'var(--color-text)',
                      textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    }}>
                    <span style={{ fontSize: 22 }}>{cat.iconEmoji || '💼'}</span>
                    {getCatName(cat)}
                  </button>
                ))}
              </div>
              {errors.categoryId && <div className="form-error">{errors.categoryId}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">{t('job.post.jobTitle')} *</label>
              <input type="text" className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                placeholder="उदा. 3 मजले बांधकामासाठी 5 कामगार हवेत" value={form.title}
                onChange={e => set('title', e.target.value)} maxLength={200} />
              {errors.title && <div className="form-error">{errors.title}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">{t('job.post.description')} {t('common.optional')}</label>
              <textarea className="form-control" placeholder="काम काय करायचे ते सांगा..."
                value={form.description} onChange={e => set('description', e.target.value)}
                rows={3} maxLength={2000} style={{ resize: 'vertical' }} />
            </div>

            <div className="form-group">
              <label className="form-label">{t('job.post.workersNeeded')}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button type="button" onClick={() => set('workersNeeded', Math.max(1, form.workersNeeded - 1))}
                  className="btn btn-light" style={{ width: 44, height: 44, padding: 0, fontSize: 20 }}>−</button>
                <span style={{ fontSize: 28, fontWeight: 800, minWidth: 40, textAlign: 'center', color: 'var(--color-primary)' }}>{form.workersNeeded}</span>
                <button type="button" onClick={() => set('workersNeeded', Math.min(500, form.workersNeeded + 1))}
                  className="btn btn-primary" style={{ width: 44, height: 44, padding: 0, fontSize: 20 }}>+</button>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>कामगार</span>
              </div>
            </div>

            <button type="button" onClick={handleNext} className="btn btn-primary btn-block btn-lg">पुढे →</button>
          </div>
        )}

        {/* STEP 2: Schedule & Rate */}
        {step === 2 && (
          <div className="card card-body fade-in">
            <h2 style={{ fontSize: 17, marginBottom: 20 }}>📅 तारीख, कालावधी व दर</h2>

            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">{t('job.post.jobDate')} *</label>
                <input type="date" className={`form-control ${errors.jobDate ? 'is-invalid' : ''}`}
                  value={form.jobDate} min={new Date().toISOString().split('T')[0]}
                  onChange={e => set('jobDate', e.target.value)} />
                {errors.jobDate && <div className="form-error">{errors.jobDate}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">{t('job.post.duration')}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="number" className="form-control" value={form.durationDays} min={1} max={365}
                    onChange={e => set('durationDays', e.target.value)} style={{ textAlign: 'center' }} />
                  <span style={{ flexShrink: 0, color: 'var(--color-text-muted)', fontSize: 14 }}>दिवस</span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('job.post.dailyRate')} *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, fontSize: 18, color: 'var(--color-text-muted)' }}>₹</span>
                <input type="number" className={`form-control ${errors.dailyRate ? 'is-invalid' : ''}`}
                  placeholder="500" value={form.dailyRate}
                  onChange={e => set('dailyRate', e.target.value)} style={{ paddingLeft: 32 }} min="100" />
              </div>
              {errors.dailyRate && <div className="form-error">{errors.dailyRate}</div>}
              {form.dailyRate && form.durationDays && (
                <div style={{ marginTop: 8, padding: '10px 14px', background: 'var(--color-success-light)', borderRadius: 8, fontSize: 14, color: 'var(--color-success)', fontWeight: 600 }}>
                  💰 एकूण खर्च: ₹{(parseFloat(form.dailyRate || 0) * parseInt(form.durationDays || 1) * parseInt(form.workersNeeded || 1)).toLocaleString()}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-light" style={{ flex: 1 }} onClick={() => setStep(1)}>← मागे</button>
              <button type="button" className="btn btn-primary" style={{ flex: 2 }} onClick={handleNext}>पुढे →</button>
            </div>
          </div>
        )}

        {/* STEP 3: Location */}
        {step === 3 && (
          <div className="card card-body fade-in">
            <h2 style={{ fontSize: 17, marginBottom: 20 }}>📍 {t('job.post.location')}</h2>

            <div className="form-group">
              <label className="form-label">{t('job.post.address')} {t('common.optional')}</label>
              <textarea className="form-control" placeholder="काम होणार असलेला पत्ता..."
                value={form.address} onChange={e => set('address', e.target.value)} rows={2} />
            </div>

            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">शहर *</label>
                <input type="text" className={`form-control ${errors.city ? 'is-invalid' : ''}`}
                  placeholder="शहर/गाव" value={form.city} onChange={e => set('city', e.target.value)} />
                {errors.city && <div className="form-error">{errors.city}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">जिल्हा</label>
                <input type="text" className="form-control" placeholder="जिल्हा" value={form.district} onChange={e => set('district', e.target.value)} />
              </div>
            </div>

            {form.latitude && form.longitude && (
              <div style={{ padding: '10px 14px', background: 'var(--color-success-light)', borderRadius: 8, fontSize: 13, color: 'var(--color-success)', marginBottom: 16 }}>
                📍 GPS Location मिळाली — कामगारांना नकाशावर दिसेल
              </div>
            )}

            {/* Preview Summary */}
            <div style={{ background: 'var(--color-bg)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 10, color: 'var(--color-secondary)' }}>📋 सारांश</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                <div><span style={{ color: 'var(--color-text-muted)' }}>काम:</span> <strong>{form.title}</strong></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>कामगार:</span> <strong>{form.workersNeeded}</strong></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>तारीख:</span> <strong>{form.jobDate}</strong></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>दर:</span> <strong>₹{form.dailyRate}/दिवस</strong></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>कालावधी:</span> <strong>{form.durationDays} दिवस</strong></div>
                {form.isUrgent && <div><span className="badge badge-danger">🚨 तातडीचे</span></div>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-light" style={{ flex: 1 }} onClick={() => setStep(2)}>← मागे</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
                {loading ? <Loader text="टाकत आहे..." /> : '✅ काम टाका!'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default PostJob;
