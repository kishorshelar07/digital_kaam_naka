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
  { value: 'beginner',    label: 'नवशिके',   emoji: '🌱' },
  { value: 'experienced', label: 'अनुभवी',   emoji: '⚡' },
  { value: 'expert',      label: 'तज्ञ',      emoji: '🏆' },
];

const EMPLOYER_TYPES = [
  { value: 'individual', label: 'व्यक्ती',    emoji: '👤' },
  { value: 'contractor', label: 'कंत्राटदार', emoji: '🏗️' },
  { value: 'farmer',     label: 'शेतकरी',     emoji: '🌾' },
  { value: 'business',   label: 'व्यवसाय',    emoji: '🏢' },
];

const Register = () => {
  const { i18n } = useTranslation();
  const { loginSuccess } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'worker';
  const lang = i18n.language;

  const [step, setStep]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [errors, setErrors]       = useState({});

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
      (pos) => {
        set('latitude', pos.coords.latitude);
        set('longitude', pos.coords.longitude);
        toast.success('📍 Location मिळाली!');
        setGpsLoading(false);
      },
      () => { toast.warning('Location नाकारली — manually जिल्हा निवडा'); setGpsLoading(false); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('फोटो 5MB पेक्षा कमी असावा'); return; }
    setProfilePhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

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

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 48 }}>{role === 'worker' ? '👷' : '🏢'}</div>
          <h1 style={{ fontSize: 20, marginTop: 8 }}>
            {role === 'worker' ? 'कामगार profile' : 'मालक profile'}
          </h1>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, gap: 0 }}>
          {stepLabels.map((label, i) => (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 13,
                  background: step > i+1 ? '#22c55e' : step === i+1 ? 'var(--color-primary)' : 'var(--color-border)',
                  color: step >= i+1 ? 'white' : 'var(--color-text-muted)',
                }}>
                  {step > i+1 ? '✓' : i+1}
                </div>
                <div style={{ fontSize: 11, color: step === i+1 ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: step === i+1 ? 700 : 400 }}>
                  {label}
                </div>
              </div>
              {i < stepLabels.length - 1 && (
                <div style={{ height: 2, width: 44, background: step > i+1 ? '#22c55e' : 'var(--color-border)', margin: '0 4px', marginBottom: 18 }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* STEP 1 — माहिती */}
        {step === 1 && (
          <div className="card card-body fade-in">
            <h2 style={{ fontSize: 16, marginBottom: 20 }}>📝 मूलभूत माहिती</h2>

            {/* Photo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, padding: 14, background: 'var(--color-bg)', borderRadius: 10 }}>
              <div style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
                onClick={() => document.getElementById('photoInput').click()}>
                <img src={photoPreview || `https://ui-avatars.com/api/?name=${form.name||'U'}&background=F97316&color=fff&size=72`}
                  alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-border)' }} />
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%',
                  background: 'var(--color-primary)', color: 'white', fontSize: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>📷</div>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>Profile Photo (ऐच्छिक)</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>JPG/PNG, max 5MB</div>
                <button type="button" className="btn btn-light btn-sm" style={{ marginTop: 6, fontSize: 11 }}
                  onClick={() => document.getElementById('photoInput').click()}>फोटो निवडा</button>
              </div>
              <input id="photoInput" type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
            </div>

            <div className="form-group">
              <label className="form-label">पूर्ण नाव *</label>
              <input type="text" className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                placeholder="तुमचे पूर्ण नाव" value={form.name}
                onChange={e => set('name', e.target.value)} autoFocus />
              {errors.name && <div style={{ color: 'var(--color-danger)', fontSize: 12, marginTop: 4 }}>{errors.name}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">भाषा</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{code:'mr',label:'मराठी'},{code:'hi',label:'हिंदी'},{code:'en',label:'English'}].map(l => (
                  <button key={l.code} type="button" onClick={() => set('language', l.code)}
                    style={{ flex: 1, padding: '10px 4px', border: '2px solid', borderRadius: 8, cursor: 'pointer',
                      fontFamily: 'var(--font-family)', fontSize: 13, fontWeight: 600,
                      borderColor: form.language === l.code ? 'var(--color-primary)' : 'var(--color-border)',
                      background: form.language === l.code ? 'var(--color-primary-light)' : 'white',
                      color: form.language === l.code ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    }}>{l.label}</button>
                ))}
              </div>
            </div>

            {role === 'worker' && (<>
              <div className="form-group">
                <label className="form-label">रोज किती पैसे घेता? (₹/दिवस) *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--color-text-muted)', fontSize: 16 }}>₹</span>
                  <input type="number" className={`form-control ${errors.dailyRate ? 'is-invalid' : ''}`}
                    placeholder="500" value={form.dailyRate}
                    onChange={e => set('dailyRate', e.target.value)}
                    style={{ paddingLeft: 28 }} min="100" max="50000" />
                </div>
                {errors.dailyRate && <div style={{ color: 'var(--color-danger)', fontSize: 12, marginTop: 4 }}>{errors.dailyRate}</div>}
                {form.dailyRate && parseFloat(form.dailyRate) >= 100 && (
                  <div style={{ fontSize: 12, color: 'var(--color-success)', marginTop: 4 }}>
                    💡 महिन्याचे: ~₹{(parseFloat(form.dailyRate) * 25).toLocaleString()}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">अनुभव (वर्षे)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button type="button" onClick={() => set('experienceYrs', Math.max(0, form.experienceYrs - 1))}
                    className="btn btn-light" style={{ width: 42, height: 42, padding: 0, fontSize: 20 }}>−</button>
                  <span style={{ fontSize: 22, fontWeight: 800, minWidth: 80, textAlign: 'center', color: 'var(--color-primary)' }}>
                    {form.experienceYrs} वर्षे
                  </span>
                  <button type="button" onClick={() => set('experienceYrs', Math.min(50, form.experienceYrs + 1))}
                    className="btn btn-primary" style={{ width: 42, height: 42, padding: 0, fontSize: 20 }}>+</button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">माझ्याबद्दल (ऐच्छिक)</label>
                <textarea className="form-control" placeholder="तुमच्या कामाबद्दल थोडे सांगा..."
                  value={form.bio} onChange={e => set('bio', e.target.value)}
                  rows={2} maxLength={300} style={{ resize: 'vertical' }} />
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'right', marginTop: 2 }}>{form.bio.length}/300</div>
              </div>
            </>)}

            {role === 'employer' && (<>
              <div className="form-group">
                <label className="form-label">तुम्ही कोण आहात? *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {EMPLOYER_TYPES.map(opt => (
                    <button key={opt.value} type="button" onClick={() => set('employerType', opt.value)}
                      style={{ padding: '12px 6px', border: '2px solid', borderRadius: 10, cursor: 'pointer',
                        fontFamily: 'var(--font-family)', fontSize: 13, fontWeight: 600,
                        borderColor: form.employerType === opt.value ? 'var(--color-primary)' : 'var(--color-border)',
                        background: form.employerType === opt.value ? 'var(--color-primary-light)' : 'white',
                        color: form.employerType === opt.value ? 'var(--color-primary)' : 'var(--color-text)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 24 }}>{opt.emoji}</span>{opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">कंपनी/संस्थेचे नाव (ऐच्छिक)</label>
                <input type="text" className="form-control" placeholder="उदा. ABC Construction"
                  value={form.companyName} onChange={e => set('companyName', e.target.value)} />
              </div>
            </>)}

            <button type="button" className="btn btn-primary btn-block btn-lg" onClick={goNext}>
              पुढे →
            </button>
          </div>
        )}

        {/* STEP 2 — पत्ता */}
        {step === 2 && (
          <div className="card card-body fade-in">
            <h2 style={{ fontSize: 16, marginBottom: 20 }}>📍 तुमचे ठिकाण</h2>

            {/* GPS Button */}
            <button type="button" onClick={detectGPS} disabled={gpsLoading}
              style={{ width: '100%', padding: '14px 16px', border: '2px solid', borderRadius: 12, cursor: 'pointer',
                fontFamily: 'var(--font-family)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
                borderColor: form.latitude ? '#22c55e' : 'var(--color-primary)',
                background: form.latitude ? '#f0fdf4' : 'var(--color-primary-light)',
              }}>
              <span style={{ fontSize: 28, flexShrink: 0 }}>{gpsLoading ? '⏳' : form.latitude ? '✅' : '📍'}</span>
              <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: form.latitude ? '#16a34a' : 'var(--color-primary)' }}>
                  {form.latitude ? 'GPS Location मिळाली!' : 'GPS ने Location detect करा'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {form.latitude
                    ? `${parseFloat(form.latitude).toFixed(4)}, ${parseFloat(form.longitude).toFixed(4)}`
                    : 'Employers तुम्हाला जवळचे workers मध्ये पाहतील'}
                </div>
              </div>
              {!form.latitude && (
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', flexShrink: 0 }}>
                  {gpsLoading ? 'मिळवत आहे...' : '→ Detect'}
                </span>
              )}
            </button>

            {/* District Dropdown */}
            <div className="form-group">
              <label className="form-label">जिल्हा * <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 400 }}>(Maharashtra)</span></label>
              <select className={`form-control ${errors.district ? 'is-invalid' : ''}`}
                value={form.district} onChange={e => set('district', e.target.value)}
                style={{ fontSize: 15 }}>
                <option value="">जिल्हा निवडा...</option>
                {MAHARASHTRA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.district && <div style={{ color: 'var(--color-danger)', fontSize: 12, marginTop: 4 }}>{errors.district}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">शहर / गाव *</label>
              <input type="text" className={`form-control ${errors.city ? 'is-invalid' : ''}`}
                placeholder="उदा. पुणे, नाशिक, सातारा..." value={form.city}
                onChange={e => set('city', e.target.value)} />
              {errors.city && <div style={{ color: 'var(--color-danger)', fontSize: 12, marginTop: 4 }}>{errors.city}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Pincode (ऐच्छिक)</label>
              <input type="text" inputMode="numeric" className="form-control"
                placeholder="411001" value={form.pincode}
                onChange={e => set('pincode', e.target.value.replace(/\D/g,'').slice(0,6))} maxLength={6} />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-light" style={{ flex: 1 }} onClick={() => setStep(1)}>← मागे</button>
              <button type="button" className="btn btn-primary" style={{ flex: 2 }} onClick={goNext}>
                {step === totalSteps ? (loading ? <Loader text="नोंदणी..." /> : '✅ नोंदणी पूर्ण करा') : 'पुढे →'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — कौशल्ये (Worker only) */}
        {step === 3 && role === 'worker' && (
          <div className="card card-body fade-in">
            <h2 style={{ fontSize: 16, marginBottom: 6 }}>💼 तुमची कौशल्ये</h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
              तुम्ही कोणते काम करता? (एक किंवा जास्त निवडा)
            </p>

            {errors.skills && (
              <div style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>
                ⚠️ {errors.skills}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
              {categories.map(cat => {
                const sel = form.skills.some(s => s.categoryId === cat.id);
                return (
                  <button key={cat.id} type="button" onClick={() => toggleSkill(cat.id)}
                    style={{ padding: '12px 4px', border: '2px solid', borderRadius: 10, cursor: 'pointer',
                      fontFamily: 'var(--font-family)', fontSize: 11, fontWeight: 600, textAlign: 'center',
                      borderColor: sel ? 'var(--color-primary)' : 'var(--color-border)',
                      background: sel ? 'var(--color-primary-light)' : 'white',
                      color: sel ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                      position: 'relative', transition: 'all 0.15s',
                    }}>
                    <span style={{ fontSize: 24 }}>{cat.iconEmoji || '💼'}</span>
                    {getCatName(cat)}
                    {sel && (
                      <span style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18,
                        borderRadius: '50%', background: 'var(--color-primary)', color: 'white',
                        fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Skill levels for selected */}
            {form.skills.length > 0 && (
              <div style={{ background: 'var(--color-bg)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Level सांगा:</div>
                {form.skills.map(skill => {
                  const cat = categories.find(c => c.id === skill.categoryId);
                  if (!cat) return null;
                  return (
                    <div key={skill.categoryId} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{cat.iconEmoji || '💼'}</span>
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{getCatName(cat)}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {SKILL_LEVELS.map(l => (
                          <button key={l.value} type="button" onClick={() => updateLevel(skill.categoryId, l.value)}
                            style={{ padding: '3px 7px', border: '1px solid', borderRadius: 6, cursor: 'pointer',
                              fontFamily: 'var(--font-family)', fontSize: 10,
                              borderColor: skill.level === l.value ? 'var(--color-primary)' : 'var(--color-border)',
                              background: skill.level === l.value ? 'var(--color-primary)' : 'white',
                              color: skill.level === l.value ? 'white' : 'var(--color-text-muted)',
                            }}>{l.emoji} {l.label}</button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-light" style={{ flex: 1 }} onClick={() => setStep(2)}>← मागे</button>
              <button type="button" className="btn btn-primary" style={{ flex: 2 }}
                onClick={goNext} disabled={loading || form.skills.length === 0}>
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