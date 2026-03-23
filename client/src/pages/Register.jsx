/**
 * ================================================================
 * pages/Register.jsx — Registration Page
 * Flow:
 *   ROLE → PHONE (OTP verify) → PASSWORD (optional) →
 *   INFO → LOCATION → SKILLS (worker only) → Dashboard
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link }                   from 'react-router-dom';
import { useTranslation }                      from 'react-i18next';
import { toast }                               from 'react-toastify';
import { useAuth }                             from '../context/AuthContext';
import { authService, jobService }             from '../services/authService';
import Loader                                  from '../components/common/Loader';

// ── Constants ─────────────────────────────────────────────────
const MAHARASHTRA_DISTRICTS = [
  'Ahmednagar','Akola','Amravati','Aurangabad','Beed','Bhandara','Buldhana',
  'Chandrapur','Dhule','Gadchiroli','Gondia','Hingoli','Jalgaon','Jalna',
  'Kolhapur','Latur','Mumbai','Nagpur','Nanded','Nandurbar','Nashik',
  'Osmanabad','Palghar','Parbhani','Pune','Raigad','Ratnagiri','Sangli',
  'Satara','Sindhudurg','Solapur','Thane','Wardha','Washim','Yavatmal',
];

const SKILL_LEVELS = [
  { value: 'beginner',    label: 'नवशिके',  emoji: '🌱' },
  { value: 'experienced', label: 'अनुभवी',  emoji: '⚡' },
  { value: 'expert',      label: 'तज्ञ',    emoji: '🏆' },
];

const EMPLOYER_TYPES = [
  { value: 'individual', label: 'व्यक्ती',    emoji: '👤' },
  { value: 'contractor', label: 'कंत्राटदार', emoji: '🏗️' },
  { value: 'farmer',     label: 'शेतकरी',    emoji: '🌾' },
  { value: 'business',   label: 'व्यवसाय',   emoji: '🏢' },
];

// Step keys
const STEPS = {
  ROLE:     'role',
  PHONE:    'phone',
  PASSWORD: 'password',
  INFO:     'info',
  LOCATION: 'location',
  SKILLS:   'skills',
};

// Step labels for progress bar (shown from PHONE onwards)
const STEP_META = {
  worker: [
    { key: STEPS.PHONE,    label: 'फोन'       },
    { key: STEPS.PASSWORD, label: 'पासवर्ड'   },
    { key: STEPS.INFO,     label: 'माहिती'    },
    { key: STEPS.LOCATION, label: 'पत्ता'     },
    { key: STEPS.SKILLS,   label: 'कौशल्ये'   },
  ],
  employer: [
    { key: STEPS.PHONE,    label: 'फोन'       },
    { key: STEPS.PASSWORD, label: 'पासवर्ड'   },
    { key: STEPS.INFO,     label: 'माहिती'    },
    { key: STEPS.LOCATION, label: 'पत्ता'     },
  ],
};

// ── Component ─────────────────────────────────────────────────
const Register = () => {
  const { i18n }        = useTranslation();
  const { loginSuccess, isLoggedIn } = useAuth();
  const navigate        = useNavigate();
  const lang            = i18n.language;

  // Current step
  const [step, setStep]       = useState(STEPS.ROLE);
  const [role, setRole]       = useState('');  // 'worker' | 'employer'

  // Phone + OTP sub-state
  const [phone, setPhone]         = useState('');
  const [otpSent, setOtpSent]     = useState(false);
  const [otp, setOtp]             = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef([]);

  // Form data
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [skipPass, setSkipPass]   = useState(false);

  const [form, setForm] = useState({
    name: '', language: lang,
    dailyRate: '', experienceYrs: 0, bio: '',
    companyName: '', employerType: 'individual',
    skills: [],
    city: '', district: '', state: 'Maharashtra', pincode: '', address: '',
    latitude: '', longitude: '',
  });

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [categories, setCategories]     = useState([]);
  const [errors, setErrors]             = useState({});
  const [loading, setLoading]           = useState(false);
  const [gpsLoading, setGpsLoading]     = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) navigate('/dashboard', { replace: true });
  }, [isLoggedIn, navigate]);

  // Load categories
  useEffect(() => {
    jobService.getCategories()
      .then(({ data }) => { if (data.success) setCategories(data.data); })
      .catch(() => {});
  }, []);

  // OTP countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // ── Helpers ───────────────────────────────────────────────
  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const stepsForRole = STEP_META[role] || [];
  const currentStepIndex = stepsForRole.findIndex(s => s.key === step);

  // ── ROLE selection ────────────────────────────────────────
  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep(STEPS.PHONE);
  };

  // ── PHONE: Send OTP ───────────────────────────────────────
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error('कृपया valid 10 अंकी mobile number टाका.');
      return;
    }

    // Check if already registered
    try {
      const { data: checkData } = await authService.checkUser(phone);
      if (checkData.data.registered) {
        toast.warning('हा नंबर आधीच registered आहे. Login करा.');
        navigate('/login');
        return;
      }
    } catch {}

    setLoading(true);
    try {
      const { data } = await authService.sendOtp(phone);
      if (data.success) {
        toast.success(`OTP पाठवला! +91 ${phone} वर SMS/WhatsApp तपासा.`);
        setOtpSent(true);
        setOtp(['', '', '', '', '', '']);
        setCountdown(60);
        setTimeout(() => otpRefs.current[0]?.focus(), 150);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP पाठवता आला नाही.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handlers ────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    if (newOtp.every(d => d) && newOtp.join('').length === 6) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    pasted.split('').forEach((d, i) => { if (i < 6) newOtp[i] = d; });
    setOtp(newOtp);
    if (pasted.length === 6) setTimeout(() => handleVerifyOtp(pasted), 50);
  };

  // ── PHONE: Verify OTP ─────────────────────────────────────
  const handleVerifyOtp = async (otpValue = otp.join('')) => {
    if (otpValue.length !== 6) { toast.error('6 अंकी OTP टाका.'); return; }

    setLoading(true);
    try {
      const { data } = await authService.verifyOtp(phone, otpValue);
      if (data.success && data.data.needsRegistration) {
        // Save temp token → used for register API call
        if (data.data.token) localStorage.setItem('kamnaka_token', data.data.token);
        toast.success('📱 Phone verify झाला!');
        setStep(STEPS.PASSWORD);
      } else if (data.success && !data.data.needsRegistration) {
        // Phone already has a complete account
        toast.warning('हा नंबर आधीच registered आहे. Login करा.');
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP चुकीचा आहे.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ── GPS detect ────────────────────────────────────────────
  const detectGPS = () => {
    if (!navigator.geolocation) { toast.error('GPS support नाही.'); return; }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set('latitude', pos.coords.latitude);
        set('longitude', pos.coords.longitude);
        toast.success('📍 Location मिळाली!');
        setGpsLoading(false);
      },
      () => { toast.warning('Location permission नाकारली.'); setGpsLoading(false); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // ── Photo upload ──────────────────────────────────────────
  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('फोटो 5MB पेक्षा कमी असावा.'); return; }
    setProfilePhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  // ── Skills ────────────────────────────────────────────────
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

  // ── Validation ────────────────────────────────────────────
  const validateCurrentStep = () => {
    const errs = {};
    if (step === STEPS.INFO) {
      if (!form.name.trim() || form.name.length < 2) errs.name = 'नाव किमान 2 अक्षरे असावे.';
      if (role === 'worker' && (!form.dailyRate || parseFloat(form.dailyRate) < 100)) {
        errs.dailyRate = 'किमान ₹100 असावी.';
      }
    }
    if (step === STEPS.LOCATION) {
      if (!form.district) errs.district = 'जिल्हा निवडा.';
      if (!form.city.trim()) errs.city = 'शहर/गाव टाका.';
    }
    if (step === STEPS.SKILLS && role === 'worker') {
      if (form.skills.length === 0) errs.skills = 'किमान एक कौशल्य निवडा.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Navigation ────────────────────────────────────────────
  const getNextStep = () => {
    const order = [STEPS.PHONE, STEPS.PASSWORD, STEPS.INFO, STEPS.LOCATION, STEPS.SKILLS];
    const idx   = order.indexOf(step);
    const next  = order[idx + 1];
    // Skip SKILLS for employer
    if (next === STEPS.SKILLS && role !== 'worker') return null;
    return next;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    const next = getNextStep();
    if (next) {
      setStep(next);
    } else {
      handleSubmit();
    }
  };

  const isLastStep = !getNextStep();

  // ── Final Submit ──────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('role', role);
      fd.append('phone', phone);

      // Password (if set and not skipped)
      if (!skipPass && password.trim().length >= 6) {
        fd.append('password', password.trim());
      }

      // Form fields
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'skills') fd.append('skills', JSON.stringify(v));
        else if (v !== '' && v !== null && v !== undefined) fd.append(k, v);
      });

      // Profile photo
      if (profilePhoto) fd.append('profilePhoto', profilePhoto);

      const { data } = await authService.register(fd);
      if (data.success) {
        loginSuccess(data.data.user, data.data.token);
        toast.success('🎉 नोंदणी यशस्वी! स्वागत आहे!');
        navigate(role === 'worker' ? '/worker/dashboard' : '/employer/dashboard', { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'नोंदणी अयशस्वी. पुन्हा प्रयत्न करा.');
    } finally {
      setLoading(false);
    }
  };

  // ── Shared styles ─────────────────────────────────────────
  const cardStyle = {
    background: 'white', borderRadius: 'var(--radius-lg)',
    padding: 24, border: '1px solid var(--color-border)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  };

  // ── Progress Bar ──────────────────────────────────────────
  const ProgressBar = () => {
    if (step === STEPS.ROLE) return null;
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, gap: 0 }}>
        {stepsForRole.map((s, i) => {
          const done    = i < currentStepIndex;
          const current = i === currentStepIndex;
          return (
            <React.Fragment key={s.key}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 12,
                  background: done ? '#22c55e' : current ? 'var(--color-primary)' : 'var(--color-border)',
                  color: (done || current) ? 'white' : 'var(--color-text-muted)',
                  transition: 'all 0.3s',
                }}>
                  {done ? '✓' : i + 1}
                </div>
                <div style={{ fontSize: 10, color: current ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                  {s.label}
                </div>
              </div>
              {i < stepsForRole.length - 1 && (
                <div style={{
                  height: 2, width: 36,
                  background: done ? '#22c55e' : 'var(--color-border)',
                  margin: '0 4px', marginBottom: 18,
                  transition: 'all 0.3s',
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // ── RENDER ────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '80vh', padding: '24px 16px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>

        {/* Header */}
        {step === STEPS.ROLE && (
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 48 }}>🏗️</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-secondary)', margin: '8px 0 4px' }}>
              Digital Kaam Naka
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
              नोंदणी करा — एकदाच, मग कधीही login करा!
            </p>
          </div>
        )}

        {step !== STEPS.ROLE && (
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 36 }}>{role === 'worker' ? '👷' : '🏢'}</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '6px 0 0' }}>
              {role === 'worker' ? 'कामगार नोंदणी' : 'मालक नोंदणी'}
            </h2>
          </div>
        )}

        <ProgressBar />

        {/* ── STEP: Role Select ──────────────────────────── */}
        {step === STEPS.ROLE && (
          <div className="fade-in">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <button
                onClick={() => handleRoleSelect('worker')}
                style={{
                  padding: 24, border: '2px solid var(--color-primary)',
                  borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                  background: 'var(--color-primary-light)', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 16,
                }}
              >
                <span style={{ fontSize: 48 }}>👷</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--color-primary)' }}>
                    मी कामगार आहे
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
                    Painting, plumbing, construction, शेती आणि इतर काम
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleRoleSelect('employer')}
                style={{
                  padding: 24, border: '2px solid var(--color-secondary)',
                  borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                  background: 'white', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 16,
                }}
              >
                <span style={{ fontSize: 48 }}>🏢</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--color-secondary)' }}>
                    मी मालक / नियोक्ता आहे
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
                    कामगार शोधतो, काम देतो
                  </div>
                </div>
              </button>
            </div>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--color-text-muted)' }}>
              आधीच account आहे?{' '}
              <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                Login करा
              </Link>
            </p>
          </div>
        )}

        {/* ── STEP: Phone + OTP ─────────────────────────────*/}
        {step === STEPS.PHONE && (
          <div style={cardStyle} className="fade-in">
            {!otpSent ? (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📱 Mobile Number</h3>
                <form onSubmit={handleSendOtp}>
                  <div className="form-group">
                    <label className="form-label">Mobile Number *</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{
                        padding: '12px 14px', border: '2px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)', fontWeight: 600,
                        color: 'var(--color-text-muted)', flexShrink: 0, fontSize: 15,
                      }}>🇮🇳 +91</div>
                      <input
                        type="tel" inputMode="numeric" className="form-control"
                        placeholder="10 अंकी number" value={phone} autoFocus
                        onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        maxLength={10} style={{ flex: 1 }}
                      />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>
                      हाच number login साठी username असेल
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary btn-block btn-lg"
                    disabled={loading || phone.length !== 10}>
                    {loading ? <Loader text="OTP पाठवत आहे..." /> : '📱 OTP पाठवा'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <button onClick={() => setOtpSent(false)} style={{
                    background: 'none', border: 'none', color: 'var(--color-primary)',
                    cursor: 'pointer', fontWeight: 600, fontSize: 14, padding: 0,
                  }}>← मागे</button>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>OTP टाका</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 4 }}>
                  +91 {phone} वर पाठवला
                </p>
                <p style={{ color: 'var(--color-primary)', fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
                  💡 SMS किंवा WhatsApp तपासा
                </p>

                {/* OTP Boxes */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
                  {otp.map((digit, i) => (
                    <input key={i} ref={el => otpRefs.current[i] = el}
                      type="tel" inputMode="numeric" maxLength={1} value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                      style={{
                        width: 48, height: 54, textAlign: 'center',
                        fontSize: 22, fontWeight: 700, border: '2px solid',
                        borderColor: digit ? 'var(--color-primary)' : 'var(--color-border)',
                        borderRadius: 'var(--radius-md)', outline: 'none',
                        background: digit ? 'var(--color-primary-light)' : 'white',
                        transition: 'all 0.15s',
                      }}
                    />
                  ))}
                </div>

                <button onClick={() => handleVerifyOtp()}
                  className="btn btn-primary btn-block btn-lg"
                  disabled={loading || otp.some(d => !d)}>
                  {loading ? <Loader text="verify होत आहे..." /> : '✅ Verify करा'}
                </button>

                <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--color-text-muted)' }}>
                  {countdown > 0
                    ? <span>{countdown}s नंतर पुन्हा पाठवा</span>
                    : <button onClick={handleSendOtp} disabled={loading}
                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                        🔄 OTP पुन्हा पाठवा
                      </button>
                  }
                </div>
              </>
            )}
          </div>
        )}

        {/* ── STEP: Password ────────────────────────────────*/}
        {step === STEPS.PASSWORD && (
          <div style={cardStyle} className="fade-in">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>🔐 Password सेट करा</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 20 }}>
              Optional आहे — skip करता येईल. Password असेल तर login faster होतो.
            </p>

            {!skipPass && (
              <>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="form-control"
                      placeholder="किमान 6 अक्षरे"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoFocus
                      style={{ paddingRight: 44 }}
                    />
                    <button type="button" onClick={() => setShowPass(s => !s)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: 0 }}>
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>

                  {/* Password strength indicator */}
                  {password.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                        {[1, 2, 3].map(n => (
                          <div key={n} style={{
                            flex: 1, height: 4, borderRadius: 2,
                            background: password.length >= n * 4
                              ? (password.length >= 10 ? '#22c55e' : password.length >= 6 ? '#f59e0b' : '#ef4444')
                              : 'var(--color-border)',
                            transition: 'background 0.3s',
                          }} />
                        ))}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        {password.length < 6 ? '⚠️ खूप छोटा' : password.length < 10 ? '✓ ठीक आहे' : '✅ मजबूत'}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (password.trim().length > 0 && password.trim().length < 6) {
                      toast.error('Password किमान 6 अक्षरे असावा.');
                      return;
                    }
                    setStep(STEPS.INFO);
                  }}
                  className="btn btn-primary btn-block btn-lg"
                  disabled={password.length > 0 && password.length < 6}
                >
                  पुढे →
                </button>
              </>
            )}

            <button
              onClick={() => { setSkipPass(true); setPassword(''); setStep(STEPS.INFO); }}
              style={{
                width: '100%', marginTop: skipPass ? 0 : 12,
                padding: '12px 0', border: '1px dashed var(--color-border)',
                borderRadius: 'var(--radius-md)', cursor: 'pointer',
                background: 'none', color: 'var(--color-text-muted)',
                fontSize: 14, fontWeight: 600,
              }}
            >
              Skip करा — नंतर सेट करता येईल →
            </button>
          </div>
        )}

        {/* ── STEP: Info ────────────────────────────────────*/}
        {step === STEPS.INFO && (
          <div style={cardStyle} className="fade-in">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>📝 मूलभूत माहिती</h3>

            {/* Profile Photo */}
            <div className="form-group" style={{ textAlign: 'center' }}>
              <div
                onClick={() => document.getElementById('photo-input').click()}
                style={{
                  width: 90, height: 90, borderRadius: '50%', margin: '0 auto 8px',
                  border: '2px dashed var(--color-primary)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', background: 'var(--color-primary-light)',
                }}
              >
                {photoPreview
                  ? <img src={photoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 28 }}>📷</span>
                }
              </div>
              <input id="photo-input" type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>फोटो upload करा (optional)</div>
            </div>

            {/* Name */}
            <div className="form-group">
              <label className="form-label">पूर्ण नाव *</label>
              <input type="text" className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                placeholder="तुमचे पूर्ण नाव" value={form.name} autoFocus
                onChange={e => set('name', e.target.value)} />
              {errors.name && <div style={{ color: 'var(--color-danger)', fontSize: 12, marginTop: 4 }}>{errors.name}</div>}
            </div>

            {/* Worker specific */}
            {role === 'worker' && (
              <>
                <div className="form-group">
                  <label className="form-label">रोजचे दर (₹/दिवस) *</label>
                  <input type="number" className={`form-control ${errors.dailyRate ? 'is-invalid' : ''}`}
                    placeholder="उदा. 500" value={form.dailyRate} min="100"
                    onChange={e => set('dailyRate', e.target.value)} />
                  {errors.dailyRate && <div style={{ color: 'var(--color-danger)', fontSize: 12, marginTop: 4 }}>{errors.dailyRate}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">अनुभव (वर्षे)</label>
                  <input type="number" className="form-control" placeholder="0" min="0" max="50"
                    value={form.experienceYrs} onChange={e => set('experienceYrs', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">स्वतःबद्दल थोडे सांगा (optional)</label>
                  <textarea className="form-control" rows={3} maxLength={500}
                    placeholder="तुमच्या कामाबद्दल, अनुभवाबद्दल..."
                    value={form.bio} onChange={e => set('bio', e.target.value)} />
                </div>
              </>
            )}

            {/* Employer specific */}
            {role === 'employer' && (
              <>
                <div className="form-group">
                  <label className="form-label">कंपनी / संस्थेचे नाव (optional)</label>
                  <input type="text" className="form-control" placeholder="उदा. ABC Construction"
                    value={form.companyName} onChange={e => set('companyName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">प्रकार</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {EMPLOYER_TYPES.map(t => (
                      <button key={t.value} type="button"
                        onClick={() => set('employerType', t.value)}
                        style={{
                          padding: '10px 8px', border: '2px solid',
                          borderColor: form.employerType === t.value ? 'var(--color-primary)' : 'var(--color-border)',
                          borderRadius: 8, cursor: 'pointer', background: form.employerType === t.value ? 'var(--color-primary-light)' : 'white',
                          fontFamily: 'var(--font-family)', fontSize: 13, fontWeight: 600,
                        }}>
                        {t.emoji} {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-light" style={{ flex: 1 }} onClick={() => setStep(STEPS.PASSWORD)}>← मागे</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleNext}>पुढे →</button>
            </div>
          </div>
        )}

        {/* ── STEP: Location ───────────────────────────────*/}
        {step === STEPS.LOCATION && (
          <div style={cardStyle} className="fade-in">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>📍 तुमचे ठिकाण</h3>

            {/* GPS Button */}
            <button type="button" onClick={detectGPS} disabled={gpsLoading}
              style={{
                width: '100%', padding: '14px 16px', border: '2px solid',
                borderRadius: 12, cursor: 'pointer', fontFamily: 'var(--font-family)',
                marginBottom: 16, transition: 'all 0.2s',
                borderColor: form.latitude ? '#22c55e' : 'var(--color-primary)',
                background: form.latitude ? '#f0fdf4' : 'var(--color-primary-light)',
              }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: form.latitude ? '#16a34a' : 'var(--color-primary)' }}>
                {gpsLoading ? '📍 Location शोधत आहे...' : form.latitude ? '✅ GPS Location मिळाली!' : '📍 GPS ने Location detect करा'}
              </div>
              {!form.latitude && (
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  Nearby worker search साठी उपयोगी
                </div>
              )}
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
                placeholder="उदा. पुणे, नाशिक, साताऱ्याचे कराड..."
                value={form.city} onChange={e => set('city', e.target.value)} />
              {errors.city && <div style={{ color: 'var(--color-danger)', fontSize: 12, marginTop: 4 }}>{errors.city}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Pincode (optional)</label>
              <input type="tel" inputMode="numeric" className="form-control" placeholder="6 अंकी pincode"
                maxLength={6} value={form.pincode} onChange={e => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-light" style={{ flex: 1 }} onClick={() => setStep(STEPS.INFO)}>← मागे</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleNext} disabled={loading}>
                {isLastStep
                  ? (loading ? <Loader text="नोंदणी होत आहे..." /> : '🎉 नोंदणी पूर्ण करा!')
                  : 'पुढे →'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: Skills (Worker only) ───────────────────*/}
        {step === STEPS.SKILLS && role === 'worker' && (
          <div style={cardStyle} className="fade-in">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>💼 तुमची कौशल्ये</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>एक किंवा जास्त निवडा</p>

            {errors.skills && (
              <div style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>
                ⚠️ {errors.skills}
              </div>
            )}

            {/* Category Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
              {categories.map(cat => {
                const sel = form.skills.some(s => s.categoryId === cat._id?.toString());
                return (
                  <button key={cat._id} type="button" onClick={() => toggleSkill(cat._id?.toString())}
                    style={{
                      padding: '12px 4px', border: '2px solid', borderRadius: 10, cursor: 'pointer',
                      fontFamily: 'var(--font-family)', fontSize: 11, fontWeight: 600, textAlign: 'center',
                      borderColor: sel ? 'var(--color-primary)' : 'var(--color-border)',
                      background: sel ? 'var(--color-primary-light)' : 'white',
                      color: sel ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, position: 'relative',
                      transition: 'all 0.15s',
                    }}>
                    <span style={{ fontSize: 24 }}>{cat.iconEmoji || '💼'}</span>
                    {getCatName(cat)}
                    {sel && (
                      <span style={{
                        position: 'absolute', top: -6, right: -6, width: 18, height: 18,
                        borderRadius: '50%', background: 'var(--color-primary)',
                        color: 'white', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Level Selector */}
            {form.skills.length > 0 && (
              <div style={{ background: 'var(--color-bg)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Level सांगा:</div>
                {form.skills.map(skill => {
                  const cat = categories.find(c => c._id?.toString() === skill.categoryId);
                  if (!cat) return null;
                  return (
                    <div key={skill.categoryId} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 18 }}>{cat.iconEmoji || '💼'}</span>
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{getCatName(cat)}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {SKILL_LEVELS.map(l => (
                          <button key={l.value} type="button" onClick={() => updateLevel(skill.categoryId, l.value)}
                            style={{
                              padding: '3px 7px', border: '1px solid', borderRadius: 6, cursor: 'pointer',
                              fontFamily: 'var(--font-family)', fontSize: 10,
                              borderColor: skill.level === l.value ? 'var(--color-primary)' : 'var(--color-border)',
                              background: skill.level === l.value ? 'var(--color-primary)' : 'white',
                              color: skill.level === l.value ? 'white' : 'var(--color-text-muted)',
                            }}>
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
              <button className="btn btn-light" style={{ flex: 1 }} onClick={() => setStep(STEPS.LOCATION)}>← मागे</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleNext}
                disabled={loading || form.skills.length === 0}>
                {loading ? <Loader text="नोंदणी होत आहे..." /> : '🎉 नोंदणी पूर्ण करा!'}
              </button>
            </div>
          </div>
        )}

        {/* T&C */}
        {step !== STEPS.ROLE && (
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--color-text-muted)' }}>
            नोंदणी करून तुम्ही आमच्या{' '}
            <Link to="/terms" style={{ color: 'var(--color-primary)' }}>अटी व शर्ती</Link>
            {' '}आणि{' '}
            <Link to="/privacy" style={{ color: 'var(--color-primary)' }}>गोपनीयता धोरणाशी</Link>
            {' '}सहमत आहात.
          </p>
        )}

      </div>
    </div>
  );
};

export default Register;