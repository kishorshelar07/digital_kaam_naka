/**
 * ================================================================
 * pages/Login.jsx — Login Page
 * Flow:
 *   Phone → checkUser →
 *     Not registered       → redirect to /register
 *     Registered, no pass  → send OTP → verify → Dashboard
 *     Registered, has pass → Choose (OTP | Password) → Dashboard
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link }      from 'react-router-dom';
import { toast }                               from 'react-toastify';
import { useAuth }                             from '../context/AuthContext';
import { authService }                         from '../services/authService';
import Loader                                  from '../components/common/Loader';

const STEPS = {
  PHONE:    'phone',
  CHOOSE:   'choose',
  OTP:      'otp',
  PASSWORD: 'password',
};

const Login = () => {
  const { loginSuccess, isLoggedIn } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || '/dashboard';

  // State
  const [step, setStep]           = useState(STEPS.PHONE);
  const [phone, setPhone]         = useState('');
  const [otp, setOtp]             = useState(['', '', '', '', '', '']);
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [hasPassword, setHasPassword] = useState(false);

  const otpRefs = useRef([]);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) navigate(from, { replace: true });
  }, [isLoggedIn, navigate, from]);

  // Countdown for OTP resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // ── STEP 1: Check if phone is registered ─────────────────
  const handleCheckPhone = async (e) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error('कृपया valid 10 अंकी mobile number टाका.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await authService.checkUser(phone);
      if (!data.success) { toast.error(data.message); return; }

      const { registered, hasPassword: hasPwd } = data.data;

      if (!registered) {
        toast.info('हा नंबर registered नाही. आधी नोंदणी करा.');
        navigate(`/register`, { state: { phone } });
        return;
      }

      setHasPassword(hasPwd);

      if (hasPwd) {
        // Has password → let user choose OTP or Password
        setStep(STEPS.CHOOSE);
      } else {
        // No password → send OTP directly
        await doSendOtp();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'काहीतरी चुकले. पुन्हा प्रयत्न करा.');
    } finally {
      setLoading(false);
    }
  };

  // ── Send OTP helper ───────────────────────────────────────
  const doSendOtp = async () => {
    try {
      const { data } = await authService.sendOtp(phone);
      if (data.success) {
        toast.success(`OTP पाठवला! +91 ${phone} वर SMS/WhatsApp तपासा.`);
        setOtp(['', '', '', '', '', '']);
        setStep(STEPS.OTP);
        setCountdown(60);
        setTimeout(() => otpRefs.current[0]?.focus(), 150);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP पाठवता आला नाही.');
    }
  };

  const handleSendOtp = async () => {
    setLoading(true);
    await doSendOtp();
    setLoading(false);
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

  // ── STEP OTP: Verify OTP → login ─────────────────────────
  const handleVerifyOtp = async (otpValue = otp.join('')) => {
    if (otpValue.length !== 6) { toast.error('6 अंकी OTP टाका.'); return; }

    setLoading(true);
    try {
      const { data } = await authService.verifyOtp(phone, otpValue);
      if (data.success) {
        if (data.data.needsRegistration) {
          // Should not happen on login page — but handle gracefully
          if (data.data.token) localStorage.setItem('kamnaka_token', data.data.token);
          navigate('/register', { state: { phone } });
          return;
        }
        loginSuccess(data.data.user, data.data.token);
        toast.success('✅ Login यशस्वी! स्वागत आहे.');
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP चुकीचा आहे.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ── STEP PASSWORD: Login with password ───────────────────
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!password.trim()) { toast.error('Password टाका.'); return; }

    setLoading(true);
    try {
      const { data } = await authService.loginWithPassword(phone, password);
      if (data.success) {
        loginSuccess(data.data.user, data.data.token);
        toast.success('✅ Login यशस्वी! स्वागत आहे.');
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password चुकीचा आहे.');
    } finally {
      setLoading(false);
    }
  };

  // ── Shared styles ─────────────────────────────────────────
  const cardStyle = {
    background: 'white',
    borderRadius: 'var(--radius-lg)',
    padding: 28,
    border: '1px solid var(--color-border)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  };

  const backBtn = (onClick) => (
    <button
      onClick={onClick}
      style={{
        background: 'none', border: 'none', color: 'var(--color-primary)',
        cursor: 'pointer', fontWeight: 600, fontSize: 14, padding: '0 0 12px 0',
        display: 'flex', alignItems: 'center', gap: 4,
      }}
    >
      ← मागे जा
    </button>
  );

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏗️</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-secondary)', margin: 0 }}>
            Digital Kaam Naka
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: '6px 0 0' }}>
            घरी बसा, काम मिळा!
          </p>
        </div>

        {/* ── STEP: Phone ──────────────────────────────────── */}
        {step === STEPS.PHONE && (
          <div style={cardStyle} className="fade-in">
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>लॉग इन करा</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 24 }}>
              तुमचा mobile number टाका
            </p>
            <form onSubmit={handleCheckPhone}>
              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{
                    padding: '12px 14px', border: '2px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)', fontWeight: 600,
                    color: 'var(--color-text-muted)', flexShrink: 0, fontSize: 15,
                  }}>🇮🇳 +91</div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    className="form-control"
                    placeholder="10 अंकी number"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    maxLength={10}
                    autoFocus
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-block btn-lg"
                disabled={loading || phone.length !== 10}
              >
                {loading ? <Loader text="तपासत आहे..." /> : 'पुढे →'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--color-text-muted)' }}>
              नवीन आहात?{' '}
              <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                नोंदणी करा
              </Link>
            </p>
          </div>
        )}

        {/* ── STEP: Choose OTP or Password ─────────────────── */}
        {step === STEPS.CHOOSE && (
          <div style={cardStyle} className="fade-in">
            {backBtn(() => setStep(STEPS.PHONE))}
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Login पद्धत निवडा</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 24 }}>
              +91 {phone}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* OTP Option */}
              <button
                onClick={handleSendOtp}
                disabled={loading}
                style={{
                  padding: 20, border: '2px solid var(--color-primary)',
                  borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                  background: 'var(--color-primary-light)', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 16,
                }}
              >
                <span style={{ fontSize: 32 }}>📱</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-primary)' }}>
                    OTP ने login करा
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>
                    SMS / WhatsApp वर OTP येईल
                  </div>
                </div>
                {loading && <Loader />}
              </button>

              {/* Password Option */}
              <button
                onClick={() => setStep(STEPS.PASSWORD)}
                style={{
                  padding: 20, border: '2px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                  background: 'white', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 16,
                }}
              >
                <span style={{ fontSize: 32 }}>🔐</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-secondary)' }}>
                    Password ने login करा
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>
                    तुमचा password टाका
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: OTP Verify ─────────────────────────────── */}
        {step === STEPS.OTP && (
          <div style={cardStyle} className="fade-in">
            {backBtn(() => setStep(hasPassword ? STEPS.CHOOSE : STEPS.PHONE))}
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>OTP टाका</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 4 }}>
              +91 {phone} वर 6 अंकी OTP पाठवला.
            </p>
            <p style={{ color: 'var(--color-primary)', fontSize: 13, fontWeight: 600, marginBottom: 24 }}>
              💡 SMS किंवा WhatsApp तपासा
            </p>

            {/* OTP Boxes */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => otpRefs.current[i] = el}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  onPaste={i === 0 ? handleOtpPaste : undefined}
                  style={{
                    width: 48, height: 54, textAlign: 'center',
                    fontSize: 22, fontWeight: 700,
                    border: '2px solid',
                    borderColor: digit ? 'var(--color-primary)' : 'var(--color-border)',
                    borderRadius: 'var(--radius-md)', outline: 'none',
                    background: digit ? 'var(--color-primary-light)' : 'white',
                    transition: 'all 0.15s',
                  }}
                />
              ))}
            </div>

            <button
              onClick={() => handleVerifyOtp()}
              className="btn btn-primary btn-block btn-lg"
              disabled={loading || otp.some(d => !d)}
            >
              {loading ? <Loader text="verify होत आहे..." /> : '✅ Verify करा'}
            </button>

            {/* Resend */}
            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--color-text-muted)' }}>
              {countdown > 0
                ? <span>{countdown}s नंतर पुन्हा पाठवा</span>
                : (
                  <button
                    onClick={handleSendOtp}
                    disabled={loading}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
                  >
                    🔄 OTP पुन्हा पाठवा
                  </button>
                )
              }
            </div>
          </div>
        )}

        {/* ── STEP: Password Login ──────────────────────────── */}
        {step === STEPS.PASSWORD && (
          <div style={cardStyle} className="fade-in">
            {backBtn(() => setStep(STEPS.CHOOSE))}
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Password टाका</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 24 }}>
              +91 {phone}
            </p>

            <form onSubmit={handlePasswordLogin}>
              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="form-control"
                    placeholder="तुमचा password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoFocus
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: 0,
                    }}
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block btn-lg"
                disabled={loading || !password.trim()}
              >
                {loading ? <Loader text="login होत आहे..." /> : '🔐 Login करा'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button
                onClick={handleSendOtp}
                disabled={loading}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
              >
                📱 OTP ने login करा
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                Password विसरलात?{' '}
              </span>
              <button
                onClick={handleSendOtp}
                disabled={loading}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}
              >
                OTP ने reset करा
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--color-text-muted)' }}>
          login करून तुम्ही आमच्या{' '}
          <Link to="/terms" style={{ color: 'var(--color-primary)' }}>अटी व शर्ती</Link>
          {' '}आणि{' '}
          <Link to="/privacy" style={{ color: 'var(--color-primary)' }}>गोपनीयता धोरणाशी</Link>
          {' '}सहमत आहात.
        </p>
      </div>
    </div>
  );
};

export default Login;