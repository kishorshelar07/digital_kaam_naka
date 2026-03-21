/**
 * ================================================================
 * pages/Login.jsx — OTP-based Login & Registration
 * Flow: Phone → OTP → Role Select → Profile Setup → Dashboard
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import Loader from '../components/common/Loader';

const STEPS = { PHONE: 'phone', OTP: 'otp', ROLE: 'role', PROFILE: 'profile' };

const Login = () => {
  const { t } = useTranslation();
  const { loginSuccess, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const [step, setStep]             = useState(STEPS.PHONE);
  const [phone, setPhone]           = useState('');
  const [otp, setOtp]               = useState(['', '', '', '', '', '']);
  const [role, setRole]             = useState('');
  const [loading, setLoading]       = useState(false);
  const [countdown, setCountdown]   = useState(0);

  const otpRefs = useRef([]);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) navigate(from, { replace: true });
  }, [isLoggedIn, navigate, from]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // ── STEP 1: Send OTP ──────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error(t('errors.phoneInvalid'));
      return;
    }

    setLoading(true);
    try {
      const { data } = await authService.sendOtp(phone);
      if (data.success) {
        toast.success(`OTP पाठवला! ${phone} वर तपासा`);
        setStep(STEPS.OTP);
        setCountdown(60);
        // Focus first OTP input
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('errors.networkError'));
    } finally {
      setLoading(false);
    }
  };

  // ── OTP Input Handler ─────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return; // digits only
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    // Auto-advance to next input
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    // Auto-submit when all 6 digits entered
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
    if (pasted.length === 6) {
      setTimeout(() => handleVerifyOtp(pasted), 50);
    }
  };

  // ── STEP 2: Verify OTP ────────────────────────────────────
  const handleVerifyOtp = async (otpValue = otp.join('')) => {
    if (otpValue.length !== 6) { toast.error(t('errors.otpInvalid')); return; }

    setLoading(true);
    try {
      const { data } = await authService.verifyOtp(phone, otpValue);
      if (data.success) {
        if (data.data.needsRegistration) {
          // New user — store temp token, go to role selection
          if (data.data.token) localStorage.setItem('kamnaka_token', data.data.token);
          setStep(STEPS.ROLE);
          toast.success('OTP verified! आता तुमची भूमिका निवडा.');
        } else {
          // Existing user — fully logged in
          loginSuccess(data.data.user, data.data.token);
          toast.success('✅ स्वागत आहे!');
          navigate(from, { replace: true });
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('errors.otpWrong'));
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 3: Select Role ───────────────────────────────────
  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    navigate(`/register?role=${selectedRole}`);
  };

  const commonCardStyle = {
    flex: 1, padding: 24, border: '3px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)', cursor: 'pointer',
    textAlign: 'center', background: 'white', transition: 'all var(--transition)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* ── Header ────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏗️</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-secondary)' }}>Digital Kaam Naka</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>घरी बसा, काम मिळा!</p>
        </div>

        {/* ── STEP 1: Phone ─────────────────────────────── */}
        {step === STEPS.PHONE && (
          <div className="card card-body fade-in">
            <h2 style={{ fontSize: 20, marginBottom: 4 }}>लॉग इन करा</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 24 }}>
              तुमचा मोबाइल नंबर टाका. OTP येईल.
            </p>
            <form onSubmit={handleSendOtp}>
              <div className="form-group">
                <label className="form-label">{t('auth.phone')}</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{
                    padding: '12px 14px', border: '2px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)', fontWeight: 600, background: 'var(--color-bg)',
                    fontSize: 15, color: 'var(--color-text-muted)', flexShrink: 0,
                  }}>🇮🇳 +91</div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    className="form-control"
                    placeholder={t('auth.phonePlaceholder')}
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    maxLength={10}
                    autoFocus
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading || phone.length !== 10}>
                {loading ? <Loader text="OTP पाठवत आहे..." /> : `📱 ${t('auth.getOtp')}`}
              </button>
            </form>
          </div>
        )}

        {/* ── STEP 2: OTP Verify ────────────────────────── */}
        {step === STEPS.OTP && (
          <div className="card card-body fade-in">
            <button onClick={() => setStep(STEPS.PHONE)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', marginBottom: 8, fontWeight: 600, fontSize: 14, padding: 0 }}>
              ← मागे जा
            </button>
            <h2 style={{ fontSize: 20, marginBottom: 4 }}>OTP तपासा</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 8 }}>
              +91 {phone} वर 6 अंकी OTP पाठवला.
            </p>
            <p style={{ color: 'var(--color-primary)', fontSize: 13, fontWeight: 600, marginBottom: 24 }}>
              💡 SMS किंवा WhatsApp तपासा
            </p>

            {/* OTP Input Boxes */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 28 }}>
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
                    width: 50, height: 56, textAlign: 'center',
                    fontSize: 24, fontWeight: 700, border: '2px solid',
                    borderColor: digit ? 'var(--color-primary)' : 'var(--color-border)',
                    borderRadius: 'var(--radius-md)', outline: 'none',
                    background: digit ? 'var(--color-primary-light)' : 'white',
                    color: 'var(--color-text)',
                    transition: 'all var(--transition)',
                  }}
                />
              ))}
            </div>

            <button
              onClick={() => handleVerifyOtp()}
              className="btn btn-primary btn-block btn-lg"
              disabled={loading || otp.some(d => !d)}
            >
              {loading ? <Loader text="तपासत आहे..." /> : `✅ ${t('auth.verifyOtp')}`}
            </button>

            {/* Resend OTP */}
            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--color-text-muted)' }}>
              {countdown > 0
                ? <span>{countdown} सेकंदात पुन्हा पाठवा</span>
                : <button onClick={handleSendOtp} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                    🔄 {t('auth.resendOtp')}
                  </button>
              }
            </div>
          </div>
        )}

        {/* ── STEP 3: Role Selection ────────────────────── */}
        {step === STEPS.ROLE && (
          <div className="card card-body fade-in">
            <h2 style={{ fontSize: 20, marginBottom: 8 }}>तुम्ही कोण आहात?</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 24 }}>
              तुमची भूमिका निवडा. नंतर बदलता येत नाही.
            </p>
            <div style={{ display: 'flex', gap: 16, flexDirection: 'column' }}>
              <button
                onClick={() => handleRoleSelect('worker')}
                style={{ ...commonCardStyle, borderColor: 'var(--color-primary)' }}
              >
                <span style={{ fontSize: 56 }}>👷</span>
                <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--color-secondary)' }}>{t('auth.iAmWorker')}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{t('auth.workerDesc')}</div>
                <span className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>हे निवडा →</span>
              </button>

              <button
                onClick={() => handleRoleSelect('employer')}
                style={{ ...commonCardStyle, borderColor: 'var(--color-secondary)' }}
              >
                <span style={{ fontSize: 56 }}>🏢</span>
                <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--color-secondary)' }}>{t('auth.iAmEmployer')}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{t('auth.employerDesc')}</div>
                <span className="btn btn-secondary" style={{ width: '100%', marginTop: 8 }}>हे निवडा →</span>
              </button>
            </div>
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--color-text-muted)' }}>
          नोंदणी करून, तुम्ही आमच्या{' '}
          <Link to="/terms" style={{ color: 'var(--color-primary)' }}>अटी व शर्ती</Link> आणि{' '}
          <Link to="/privacy" style={{ color: 'var(--color-primary)' }}>गोपनीयता धोरणाशी</Link> सहमत आहात.
        </p>
      </div>
    </div>
  );
};

export default Login;
