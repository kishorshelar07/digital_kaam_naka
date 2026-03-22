import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { authService, jobService } from '../services/authService';
import Loader from '../components/common/Loader';

const MAHARASHTRA_DISTRICTS = [
  'Ahmednagar','Akola','Amravati','Aurangabad','Beed','Bhandara','Buldhana',
  'Chandrapur','Dhule','Gadchiroli','Gondia','Hingoli','Jalgaon','Jalna',
  'Kolhapur','Latur','Mumbai','Nagpur','Nanded','Nandurbar','Nashik',
  'Osmanabad','Palghar','Parbhani','Pune','Raigad','Ratnagiri','Sangli',
  'Satara','Sindhudurg','Solapur','Thane','Wardha','Washim','Yavatmal'
];
const SKILL_LEVELS = [
  { value: 'beginner', label: 'नवशिके', emoji: '🌱' },
  { value: 'experienced', label: 'अनुभवी', emoji: '⚡' },
  { value: 'expert', label: 'तज्ञ', emoji: '🏆' },
];
// eslint-disable-next-line no-unused-vars
const EMPLOYER_TYPES = [
  { value: 'individual', label: 'व्यक्ती', emoji: '👤' },
  { value: 'contractor', label: 'कंत्राटदार', emoji: '🏗️' },
  { value: 'farmer', label: 'शेतकरी', emoji: '🌾' },
  { value: 'business', label: 'व्यवसाय', emoji: '🏢' },
];

const Register = () => {
  const { i18n } = useTranslation();
  const { loginSuccess } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'worker';
  const lang = i18n.language;

  const [step, setStep]             = useState(1);
  const [loading, setLoading]       = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null); // used in img preview
  const [errors, setErrors]         = useState({});

  const [form, setForm] = useState({
    name: '', language: lang,
    dailyRate: '', experienceYrs: 0, bio: '',
    skills: [],
    companyName: '', employerType: 'individual',
    city: '', district: '', state: 'Maharashtra', pincode: '',
    latitude: '', longitude: '',
  });

  const totalSteps = role === 'worker' ? 3 : 2;

  useEffect(() => {
    jobService.getCategories()
      .then(({ data }) => { if (data.success) setCategories(data.data); })
      .catch(() => {});
  }, []);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const detectGPS = () => {
    if (!navigator.geolocation) { toast.error('GPS support नाही'); return; }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { set('latitude', pos.coords.latitude); set('longitude', pos.coords.longitude); toast.success('📍 Location मिळाली!'); setGpsLoading(false); },
      () => { toast.warning('Location नाकारली'); setGpsLoading(false); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // eslint-disable-next-line no-unused-vars
  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('फोटो 5MB पेक्षा कमी असावा'); return; }
    setProfilePhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  // CHANGED: cat.id → cat._id
  const toggleSkill = (catId) => {
    setForm(prev => {
      const exists = prev.skills.find(s => s.categoryId === catId);
      if (exists) return { ...prev, skills: prev.skills.filter(s => s.categoryId !== catId) };
      return { ...prev, skills: [...prev.skills, { categoryId: catId, level: 'experienced' }] };
    });
  };

  const updateLevel = (catId, level) =>
    setForm(prev => ({ ...prev, skills: prev.skills.map(s => s.categoryId === catId ? { ...s, level } : s) }));

  const getCatName = (cat) => ({ mr: cat.nameMr, hi: cat.nameHi, en: cat.nameEn }[lang] || cat.nameEn);

  const validateStep = (s) => {
    const errs = {};
    if (s === 1) {
      if (!form.name.trim() || form.name.length < 2) errs.name = 'नाव किमान 2 अक्षरे असावे';
      if (role === 'worker' && (!form.dailyRate || parseFloat(form.dailyRate) < 100)) errs.dailyRate = 'किमान ₹100 असावी';
    }
    if (s === 2) {
      if (!form.district) errs.district = 'जिल्हा निवडा';
      if (!form.city.trim()) errs.city = 'शहर/गाव टाका';
    }
    if (s === 3 && role === 'worker') {
      if (form.skills.length === 0) errs.skills = 'किमान एक कौशल्य निवडा';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('role', role);
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'skills') fd.append('skills', JSON.stringify(v));
        else if (v !== '') fd.append(k, v);
      });
      if (profilePhoto) fd.append('profilePhoto', profilePhoto);
      const { data } = await authService.register(fd);
      if (data.success) {
        loginSuccess(data.data.user, data.data.token);
        toast.success('🎉 नोंदणी यशस्वी!');
        navigate(role === 'worker' ? '/worker/dashboard' : '/employer/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'नोंदणी अयशस्वी');
    } finally { setLoading(false); }
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    if (step === totalSteps) handleSubmit();
    else setStep(s => s + 1);
  };

  const stepLabels = role === 'worker' ? ['माहिती','पत्ता','कौशल्ये'] : ['माहिती','पत्ता'];

  return (
    <div style={{ minHeight: '80vh', padding: '24px 16px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 48 }}>{role === 'worker' ? '👷' : '🏢'}</div>
          <h1 style={{ fontSize: 20, marginTop: 8 }}>{role === 'worker' ? 'कामगार profile' : 'मालक profile'}</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, gap: 0 }}>
          {stepLabels.map((label, i) => (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13,
                  background: step > i+1 ? '#22c55e' : step === i+1 ? 'var(--color-primary)' : 'var(--color-border)',
                  color: step >= i+1 ? 'white' : 'var(--color-text-muted)' }}>{step > i+1 ? '✓' : i+1}</div>
                <div style={{ fontSize: 11, color: step === i+1 ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>{label}</div>
              </div>
              {i < stepLabels.length - 1 && <div style={{ height: 2, width: 44, background: step > i+1 ? '#22c55e' : 'var(--color-border)', margin: '0 4px', marginBottom: 18 }} />}
            </React.Fragment>
          ))}
        </div>

        {step === 1 && (
          <div className="card card-body fade-in">
            <h2 style={{ fontSize: 16, marginBottom: 20 }}>📝 मूलभूत माहिती</h2>
            <div className="form-group">
              <label className="form-label">पूर्ण नाव *</label>
              <input type="text" className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                placeholder="तुमचे पूर्ण नाव" value={form.name} onChange={e => set('name', e.target.value)} autoFocus />
              {errors.name && <div style={{ color: 'var(--color-danger)', fontSize: 12, marginTop: 4 }}>{errors.name}</div>}
            </div>
            {role === 'worker' && (
              <div className="form-group">
                <label className="form-label">रोज किती पैसे घेता? (₹/दिवस) *</label>
                <input type="number" className={`form-control ${errors.dailyRate ? 'is-invalid' : ''}`}
                  placeholder="500" value={form.dailyRate} onChange={e => set('dailyRate', e.target.value)} min="100" />
                {errors.dailyRate && <div style={{ color: 'var(--color-danger)', fontSize: 12, marginTop: 4 }}>{errors.dailyRate}</div>}
              </div>
            )}
            {role === 'employer' && (
              <div className="form-group">
                <label className="form-label">कंपनी/संस्थेचे नाव (ऐच्छिक)</label>
                <input type="text" className="form-control" placeholder="उदा. ABC Construction"
                  value={form.companyName} onChange={e => set('companyName', e.target.value)} />
              </div>
            )}
            <button type="button" className="btn btn-primary btn-block btn-lg" onClick={goNext}>पुढे →</button>
          </div>
        )}

        {step === 2 && (
          <div className="card card-body fade-in">
            <h2 style={{ fontSize: 16, marginBottom: 20 }}>📍 तुमचे ठिकाण</h2>
            <button type="button" onClick={detectGPS} disabled={gpsLoading}
              style={{ width: '100%', padding: '14px 16px', border: '2px solid', borderRadius: 12, cursor: 'pointer', fontFamily: 'var(--font-family)', marginBottom: 20,
                borderColor: form.latitude ? '#22c55e' : 'var(--color-primary)', background: form.latitude ? '#f0fdf4' : 'var(--color-primary-light)' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: form.latitude ? '#16a34a' : 'var(--color-primary)' }}>
                {form.latitude ? '✅ GPS Location मिळाली!' : '📍 GPS ने Location detect करा'}
              </div>
            </button>
            <div className="form-group">
              <label className="form-label">जिल्हा *</label>
              <select className={`form-control ${errors.district ? 'is-invalid' : ''}`}
                value={form.district} onChange={e => set('district', e.target.value)}>
                <option value="">जिल्हा निवडा...</option>
                {MAHARASHTRA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.district && <div style={{ color: 'var(--color-danger)', fontSize: 12, marginTop: 4 }}>{errors.district}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">शहर / गाव *</label>
              <input type="text" className={`form-control ${errors.city ? 'is-invalid' : ''}`}
                placeholder="उदा. पुणे, नाशिक..." value={form.city} onChange={e => set('city', e.target.value)} />
              {errors.city && <div style={{ color: 'var(--color-danger)', fontSize: 12, marginTop: 4 }}>{errors.city}</div>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-light" style={{ flex: 1 }} onClick={() => setStep(1)}>← मागे</button>
              <button type="button" className="btn btn-primary" style={{ flex: 2 }} onClick={goNext}>
                {step === totalSteps ? (loading ? <Loader text="नोंदणी..." /> : '✅ नोंदणी पूर्ण करा') : 'पुढे →'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && role === 'worker' && (
          <div className="card card-body fade-in">
            <h2 style={{ fontSize: 16, marginBottom: 6 }}>💼 तुमची कौशल्ये</h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>एक किंवा जास्त निवडा</p>
            {errors.skills && <div style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>⚠️ {errors.skills}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
              {/* CHANGED: cat.id → cat._id */}
              {categories.map(cat => {
                const sel = form.skills.some(s => s.categoryId === cat._id?.toString());
                return (
                  <button key={cat._id} type="button" onClick={() => toggleSkill(cat._id?.toString())}
                    style={{ padding: '12px 4px', border: '2px solid', borderRadius: 10, cursor: 'pointer',
                      fontFamily: 'var(--font-family)', fontSize: 11, fontWeight: 600, textAlign: 'center',
                      borderColor: sel ? 'var(--color-primary)' : 'var(--color-border)',
                      background: sel ? 'var(--color-primary-light)' : 'white',
                      color: sel ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, position: 'relative' }}>
                    <span style={{ fontSize: 24 }}>{cat.iconEmoji || '💼'}</span>
                    {getCatName(cat)}
                    {sel && <span style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: 'var(--color-primary)', color: 'white', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</span>}
                  </button>
                );
              })}
            </div>

            {form.skills.length > 0 && (
              <div style={{ background: 'var(--color-bg)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Level सांगा:</div>
                {form.skills.map(skill => {
                  // CHANGED: c.id === skill.categoryId → c._id?.toString() === skill.categoryId
                  const cat = categories.find(c => c._id?.toString() === skill.categoryId);
                  if (!cat) return null;
                  return (
                    <div key={skill.categoryId} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 18 }}>{cat.iconEmoji || '💼'}</span>
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{getCatName(cat)}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {SKILL_LEVELS.map(l => (
                          <button key={l.value} type="button" onClick={() => updateLevel(skill.categoryId, l.value)}
                            style={{ padding: '3px 7px', border: '1px solid', borderRadius: 6, cursor: 'pointer',
                              fontFamily: 'var(--font-family)', fontSize: 10,
                              borderColor: skill.level === l.value ? 'var(--color-primary)' : 'var(--color-border)',
                              background: skill.level === l.value ? 'var(--color-primary)' : 'white',
                              color: skill.level === l.value ? 'white' : 'var(--color-text-muted)' }}>
                            {l.emoji} {l.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-light" style={{ flex: 1 }} onClick={() => setStep(2)}>← मागे</button>
              <button type="button" className="btn btn-primary" style={{ flex: 2 }} onClick={goNext} disabled={loading || form.skills.length === 0}>
                {loading ? <Loader text="नोंदणी..." /> : '🎉 नोंदणी पूर्ण करा!'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
