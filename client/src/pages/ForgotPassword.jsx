/**
 * pages/ForgotPassword.jsx — Password Reset Page
 * Flow:
 *   Step 1: Phone number टाका
 *   Step 2: OTP verify करा (SMS / WhatsApp)
 *   Step 3: नवीन password set करा
 *   Step 4: Success → Login page
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link }                   from 'react-router-dom';
import { toast }                               from 'react-toastify';
import { authService }                         from '../services/authService';
import Loader                                  from '../components/common/Loader';

const STEPS = {
  PHONE:    'phone',
  OTP:      'otp',
  PASSWORD: 'password',
  SUCCESS:  'success',
};

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep]             = useState(STEPS.PHONE);
  const [phone, setPhone]           = useState('');
  const [otp, setOtp]               = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [countdown, setCountdown]   = useState(0);

  const otpRefs = useRef([]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Password strength check
  const getStrength = (pass) => {
    if (!pass) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pass.length >= 6)  score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    if (score <= 1) return { level: 1, label: 'कमकुवत',   color: 'var(--color-danger)' };
    if (score <= 3) return { level: 2, label: 'ठीक आहे',  color: 'var(--color-warning)' };
    return              { level: 3, label: 'मजबूत',     color: 'var(--color-success)' };
  };

  const strength = getStrength(newPassword);

  // ── STEP 1: Phone submit ──────────────────────────────────
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error('कृपया valid 10 अंकी mobile number टाका.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authService.forgotPassword(phone);
      if (data.success) {
        toast.success(`OTP पाठवला! +91 ${phone} वर SMS/WhatsApp तपासा.`);
        setOtp(['', '', '', '', '', '']);
        setStep(STEPS.OTP);
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
    if (newOtp.every(d => d)) handleVerifyOtp(newOtp.join(''));
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0)
      otpRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = Array(6).fill('');
    pasted.split('').forEach((d, i) => { if (i < 6) newOtp[i] = d; });
    setOtp(newOtp);
    if (pasted.length === 6) setTimeout(() => handleVerifyOtp(pasted), 50);
  };

  // ── STEP 2: OTP verify ────────────────────────────────────
  const handleVerifyOtp = async (otpValue = otp.join('')) => {
    if (otpValue.length !== 6) { toast.error('6 अंकी OTP टाका.'); return; }
    // Client side OTP verify — फक्त format check
    // Actual verify reset-password API call वर होईल
    setStep(STEPS.PASSWORD);
    setTimeout(() => document.getElementById('new-password-input')?.focus(), 150);
  };

  // ── OTP resend ────────────────────────────────────────────
  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const { data } = await authService.forgotPassword(phone);
      if (data.success) {
        toast.success('OTP पुन्हा पाठवला!');
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

  // ── STEP 3: New password submit ───────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error('Password किमान 6 अक्षरे असावा.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('दोन्ही password जुळत नाहीत.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await authService.resetPassword(phone, otp.join(''), newPassword);
      if (data.success) {
        setStep(STEPS.SUCCESS);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Password reset अयशस्वी.';
      toast.error(msg);
      // OTP चुकीचा असेल तर OTP step वर परत जा
      if (err.response?.status === 400 && msg.toLowerCase().includes('otp')) {
        setOtp(['', '', '', '', '', '']);
        setStep(STEPS.OTP);
        setTimeout(() => otpRefs.current[0]?.focus(), 150);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Shared styles ─────────────────────────────────────────
  const card = {
    background: 'white',
    borderRadius: 'var(--radius-lg)',
    padding: 28,
    border: '1px solid var(--color-border)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  };

  const BackBtn = ({ to, label = '← मागे जा' }) => (
    <button
      onClick={() => setStep(to)}
      style={{
        background: 'none', border: 'none', color: 'var(--color-primary)',
        cursor: 'pointer', fontWeight: 600, fontSize: 14,
        padding: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 4,
      }}
    >
      {label}
    </button>
  );

  const PhonePill = () => (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: 'var(--color-secondary-light)', borderRadius: 'var(--radius-full)',
      padding: '4px 12px', marginBottom: 20, fontSize: 14, fontWeight: 600,
      color: 'var(--color-secondary)',
    }}>
      📱 +91 {phone}
    </div>
  );

  // Progress indicator
  const steps = [
    { key: STEPS.PHONE,    label: 'Number' },
    { key: STEPS.OTP,      label: 'OTP' },
    { key: STEPS.PASSWORD, label: 'Password' },
  ];
  const currentIndex = steps.findIndex(s => s.key === step);

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🔑</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-secondary)', margin: 0 }}>
            Password Reset करा
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: '6px 0 0' }}>
            OTP ने तुमचा password बदला
          </p>
        </div>

        {/* Step Progress */}
        {step !== STEPS.SUCCESS && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, gap: 0 }}>
            {steps.map((s, i) => {
              const done    = i < currentIndex;
              const active  = i === currentIndex;
              return (
                <React.Fragment key={s.key}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700,
                      background: done ? 'var(--color-success)' : active ? 'var(--color-primary)' : 'var(--color-border)',
                      color: done || active ? 'white' : 'var(--color-text-muted)',
                      transition: 'all 0.2s',
                    }}>
                      {done ? '✓' : i + 1}
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: active ? 'var(--color-primary)' : done ? 'var(--color-success)' : 'var(--color-text-muted)',
                    }}>
                      {s.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{
                      flex: 1, height: 2, maxWidth: 60, margin: '0 4px',
                      marginBottom: 18,
                      background: i < currentIndex ? 'var(--color-success)' : 'var(--color-border)',
                      transition: 'background 0.3s',
                    }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* ── STEP 1: Phone ──────────────────────────────── */}
        {step === STEPS.PHONE && (
          <div style={card} className="fade-in">
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Mobile Number टाका</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 24 }}>
              Registered mobile number वर OTP येईल
            </p>
            <form onSubmit={handlePhoneSubmit}>
              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{
                    padding: '12px 14px', border: '2px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)', fontWeight: 600,
                    color: 'var(--color-text-muted)', flexShrink: 0, fontSize: 15,
                  }}>
                    🇮🇳 +91
                  </div>
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
                {loading ? <Loader text="पाठवत आहे..." /> : '📱 OTP पाठवा'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Link to="/login" style={{ fontSize: 14, color: 'var(--color-primary)', fontWeight: 600 }}>
                ← Login कडे परत जा
              </Link>
            </div>
          </div>
        )}

        {/* ── STEP 2: OTP ────────────────────────────────── */}
        {step === STEPS.OTP && (
          <div style={card} className="fade-in">
            <BackBtn to={STEPS.PHONE} />
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>OTP टाका</h2>
            <PhonePill />
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 4 }}>
              वरील number वर 6 अंकी OTP पाठवला आहे.
            </p>
            <p style={{ color: 'var(--color-primary)', fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
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
              {loading ? <Loader text="verify होत आहे..." /> : '✅ OTP Verify करा'}
            </button>

            {/* Resend */}
            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--color-text-muted)' }}>
              {countdown > 0
                ? <span>OTP पुन्हा पाठवण्यासाठी {countdown}s थांबा</span>
                : (
                  <button
                    onClick={handleResendOtp}
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

        {/* ── STEP 3: New Password ────────────────────────── */}
        {step === STEPS.PASSWORD && (
          <div style={card} className="fade-in">
            <BackBtn to={STEPS.OTP} />
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>नवीन Password टाका</h2>
            <PhonePill />

            <form onSubmit={handleResetPassword}>
              {/* New Password */}
              <div className="form-group">
                <label className="form-label">नवीन Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="new-password-input"
                    type={showPass ? 'text' : 'password'}
                    className="form-control"
                    placeholder="किमान 6 अक्षरे"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    autoFocus
                    style={{ paddingRight: 48 }}
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

                {/* Password Strength Bar */}
                {newPassword.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {[1, 2, 3].map(i => (
                        <div key={i} style={{
                          flex: 1, height: 4, borderRadius: 2,
                          background: i <= strength.level ? strength.color : 'var(--color-border)',
                          transition: 'background 0.2s',
                        }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 12, color: strength.color, fontWeight: 600 }}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label">Password Confirm करा</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className="form-control"
                    placeholder="वरील password पुन्हा टाका"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    style={{
                      paddingRight: 48,
                      borderColor: confirmPassword && (
                        confirmPassword === newPassword
                          ? 'var(--color-success)'
                          : 'var(--color-danger)'
                      ),
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(s => !s)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: 0,
                    }}
                  >
                    {showConfirm ? '🙈' : '👁️'}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <div style={{ fontSize: 12, color: 'var(--color-danger)', marginTop: 4 }}>
                    ❌ Password जुळत नाहीत
                  </div>
                )}
                {confirmPassword && confirmPassword === newPassword && (
                  <div style={{ fontSize: 12, color: 'var(--color-success)', marginTop: 4 }}>
                    ✅ Password जुळतात
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block btn-lg"
                disabled={
                  loading ||
                  newPassword.length < 6 ||
                  newPassword !== confirmPassword
                }
              >
                {loading ? <Loader text="बदलत आहे..." /> : '🔐 Password बदला'}
              </button>
            </form>
          </div>
        )}

        {/* ── STEP 4: Success ─────────────────────────────── */}
        {step === STEPS.SUCCESS && (
          <div style={{ ...card, textAlign: 'center' }} className="fade-in">
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-success)', marginBottom: 8 }}>
              Password यशस्वीरित्या बदलला!
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 28 }}>
              आता तुमच्या नवीन password ने login करा.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary btn-block btn-lg"
            >
              Login करा →
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;
