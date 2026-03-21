/**
 * ================================================================
 * pages/Home.jsx — Landing Page
 * Hero section, category grid, how it works, stats, testimonials.
 * This is the first page every user sees — must be compelling.
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { jobService } from '../services/authService';
import { CardSkeleton } from '../components/common/Loader';

const CATEGORIES = [
  { emoji: '🧱', mr: 'बांधकाम',           en: 'Construction' },
  { emoji: '🌾', mr: 'शेतीकाम',           en: 'Farming' },
  { emoji: '🏠', mr: 'घरकाम',             en: 'Household' },
  { emoji: '📦', mr: 'माल चढवणे/उतरवणे',  en: 'Loading' },
  { emoji: '🎨', mr: 'रंगकाम',            en: 'Painting' },
  { emoji: '🔧', mr: 'प्लंबिंग',           en: 'Plumbing' },
  { emoji: '⚡', mr: 'विद्युत काम',        en: 'Electrical' },
  { emoji: '💂', mr: 'सुरक्षारक्षक',        en: 'Security' },
  { emoji: '🎪', mr: 'कार्यक्रम काम',      en: 'Events' },
  { emoji: '🧹', mr: 'सफाई काम',           en: 'Cleaning' },
  { emoji: '🚛', mr: 'वाहन चालवणे',        en: 'Driving' },
  { emoji: '💼', mr: 'इतर काम',           en: 'Other' },
];

const TESTIMONIALS = [
  { name: 'रमेश कांबळे', role: 'बांधकाम कामगार, पुणे', rating: 5,
    text: 'आधी रोज नाक्यावर उभा राहायचो. आता घरून ON करतो आणि मालक येतात. Digital Kaam Naka ने माझे आयुष्य बदलले!' },
  { name: 'सीताबाई पवार', role: 'घरकाम कामगार, नाशिक', rating: 5,
    text: 'पूर्वी काम मिळणे कठीण होते. आता महिन्यात 25 दिवस काम मिळते. खूप उपयुक्त आहे.' },
  { name: 'किरण शेट्टी', role: 'कंत्राटदार, मुंबई', rating: 5,
    text: 'एकाच ठिकाणी 20 कामगार मिळाले! वेळ आणि पैसे दोन्ही वाचले. Excellent platform!' },
];

const STATS = [
  { value: '50,000+', label: 'नोंदणीकृत कामगार', icon: '👷' },
  { value: '36',      label: 'जिल्हे',            icon: '🗺️' },
  { value: '2,00,000+', label: 'यशस्वी बुकिंग्स', icon: '✅' },
  { value: '15,000+', label: 'मालक',              icon: '🏢' },
];

const HOW_IT_WORKS = [
  { step: '1', icon: '📱', title: 'नोंदणी करा', desc: 'फोन नंबरने 2 मिनिटात नोंदणी. OTP टाका, झाले!' },
  { step: '2', icon: '⚡', title: 'उपलब्ध व्हा', desc: 'सकाळी "आज उपलब्ध" ON करा. मालकांना दिसता.' },
  { step: '3', icon: '📞', title: 'बुकिंग मिळवा', desc: 'मालक तुम्हाला बुक करतात. WhatsApp वर कळते.' },
  { step: '4', icon: '💰', title: 'काम करा, पैसे मिळवा', desc: 'काम करा आणि रोख किंवा UPI ने पैसे घ्या.' },
];

const Home = () => {
  const { t, i18n } = useTranslation();
  const { isLoggedIn, isWorker, isEmployer } = useAuth();
  const navigate = useNavigate();
  const lang = i18n.language;

  const [searchQuery, setSearchQuery]   = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [categories, setCategories]     = useState([]);
  const [catLoading, setCatLoading]     = useState(true);

  // Load categories from API (for real category IDs)
  useEffect(() => {
    jobService.getCategories()
      .then(({ data }) => { if (data.success) setCategories(data.data); })
      .catch(() => setCategories([]))
      .finally(() => setCatLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/workers?q=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(searchLocation)}`);
  };

  const handleCategoryClick = (catId) => {
    navigate(`/workers?category=${catId}`);
  };

  return (
    <div>
      {/* ── HERO SECTION ──────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #1E3A5F 0%, #2d5282 50%, #1E3A5F 100%)',
        color: 'white', padding: '60px 0 80px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Background pattern */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.05,
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '30px 30px' }} />

        <div className="container" style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(249,115,22,0.2)', border: '1px solid rgba(249,115,22,0.4)',
            borderRadius: 'var(--radius-full)', padding: '6px 16px', fontSize: 14, marginBottom: 20, color: '#FED7AA' }}>
            🏗️ महाराष्ट्रातील #1 डिजिटल काम नाका
          </div>

          <h1 style={{ fontSize: 'clamp(28px, 6vw, 52px)', fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>
            <span style={{ color: 'var(--color-primary)' }}>Digital</span> Kaam Naka
          </h1>
          <p style={{ fontSize: 'clamp(18px, 4vw, 28px)', color: '#CBD5E1', fontWeight: 600, marginBottom: 8 }}>
            {t('app.tagline')}
          </p>
          <p style={{ fontSize: 16, color: '#94A3B8', maxWidth: 560, margin: '0 auto 40px' }}>
            {t('home.hero.description')}
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} style={{
            display: 'flex', gap: 8, maxWidth: 700, margin: '0 auto 40px',
            background: 'white', borderRadius: 'var(--radius-xl)', padding: 8,
            boxShadow: 'var(--shadow-xl)', flexWrap: 'wrap',
          }}>
            <input
              type="text"
              placeholder={t('home.hero.searchPlaceholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                flex: '1 1 200px', border: 'none', outline: 'none',
                padding: '10px 16px', fontSize: 15, color: 'var(--color-text)',
                background: 'transparent', minWidth: 0,
              }}
            />
            <div style={{ width: 1, background: 'var(--color-border)', margin: '4px 0', flexShrink: 0 }} />
            <input
              type="text"
              placeholder={t('home.hero.locationPlaceholder')}
              value={searchLocation}
              onChange={e => setSearchLocation(e.target.value)}
              style={{
                flex: '1 1 150px', border: 'none', outline: 'none',
                padding: '10px 16px', fontSize: 15, color: 'var(--color-text)',
                background: 'transparent', minWidth: 0,
              }}
            />
            <button type="submit" className="btn btn-primary" style={{ borderRadius: 'calc(var(--radius-xl) - 8px)', flexShrink: 0 }}>
              🔍 {t('home.hero.searchBtn')}
            </button>
          </form>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/workers" className="btn btn-primary btn-lg" style={{ textDecoration: 'none', minWidth: 200 }}>
              👷 {t('home.hero.findWorkers')}
            </Link>
            <Link to={isLoggedIn ? '/jobs/post' : '/register'} className="btn btn-lg"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '2px solid rgba(255,255,255,0.3)',
                textDecoration: 'none', minWidth: 200, backdropFilter: 'blur(4px)' }}>
              📋 {t('home.hero.postWork')}
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-white)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2>{t('home.howItWorks.title')}</h2>
            <p style={{ color: 'var(--color-text-muted)', marginTop: 8 }}>फक्त 4 सोप्या पायऱ्यात काम मिळवा</p>
          </div>
          <div className="grid-4">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '24px 16px', position: 'relative' }}>
                {/* Connector line */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div style={{
                    position: 'absolute', top: 44, left: '60%', right: '-40%',
                    height: 2, background: 'var(--color-border)',
                    display: 'none', // shown by media query
                  }} className="step-connector" />
                )}
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'var(--color-primary-light)', margin: '0 auto 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
                  border: '3px solid var(--color-primary)', position: 'relative',
                }}>
                  {step.icon}
                  <span style={{
                    position: 'absolute', top: -8, right: -8,
                    width: 24, height: 24, borderRadius: '50%',
                    background: 'var(--color-primary)', color: 'white',
                    fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{step.step}</span>
                </div>
                <h3 style={{ fontSize: 16, marginBottom: 8 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORY GRID ────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-bg)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2>{t('home.categories.title')}</h2>
            <p style={{ color: 'var(--color-text-muted)', marginTop: 8 }}>{t('home.categories.subtitle')}</p>
          </div>
          <div className="grid-4">
            {catLoading
              ? Array(12).fill(0).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />
                ))
              : (categories.length > 0 ? categories : CATEGORIES).map((cat, i) => (
                  <button
                    key={cat.id || i}
                    onClick={() => cat.id ? handleCategoryClick(cat.id) : navigate('/workers')}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 10, padding: '20px 12px', background: 'white', border: '2px solid var(--color-border)',
                      borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                      transition: 'all var(--transition)', fontFamily: 'var(--font-family)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.background = 'var(--color-primary-light)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'white'; }}
                  >
                    <span style={{ fontSize: 36 }}>{cat.iconEmoji || cat.emoji || '💼'}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', textAlign: 'center', lineHeight: 1.3 }}>
                      {lang === 'mr' ? (cat.nameMr || cat.mr) : lang === 'hi' ? (cat.nameHi || cat.mr) : (cat.nameEn || cat.en)}
                    </span>
                  </button>
                ))
            }
          </div>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────── */}
      <section style={{ background: 'var(--color-primary)', padding: '48px 0' }}>
        <div className="container">
          <div className="grid-4">
            {STATS.map((stat, i) => (
              <div key={i} style={{ textAlign: 'center', color: 'white' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>{stat.icon}</div>
                <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: 14, opacity: 0.85, marginTop: 6 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-white)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2>{t('home.testimonials.title')}</h2>
          </div>
          <div className="grid-3">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="card card-body fade-in" style={{ position: 'relative' }}>
                <div style={{ fontSize: 40, color: 'var(--color-primary)', marginBottom: 12, lineHeight: 1 }}>"</div>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--color-text)', marginBottom: 20, fontStyle: 'italic' }}>
                  {t.text}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 'auto' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'var(--color-primary)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 18,
                  }}>{t.name[0]}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{t.role}</div>
                    <div style={{ color: '#F59E0B', fontSize: 14, marginTop: 2 }}>{'★'.repeat(t.rating)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────── */}
      <section style={{ background: 'var(--color-secondary)', padding: '60px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'white', marginBottom: 12 }}>आत्ताच सुरुवात करा!</h2>
          <p style={{ color: '#94A3B8', marginBottom: 32, fontSize: 16 }}>
            लाखो कामगार आधीच जोडले गेले आहेत. तुम्हीही जोडा!
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg" style={{ textDecoration: 'none' }}>
              🚀 आत्ताच नोंदणी करा — मोफत!
            </Link>
            <Link to="/workers" className="btn btn-lg"
              style={{ background: 'transparent', color: 'white', border: '2px solid rgba(255,255,255,0.4)', textDecoration: 'none' }}>
              कामगार पाहा
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer style={{ background: '#111827', color: '#9CA3AF', padding: '40px 0 20px' }}>
        <div className="container">
          <div className="grid-4" style={{ marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 8 }}>🏗️ Digital Kaam Naka</div>
              <p style={{ fontSize: 13, lineHeight: 1.7 }}>महाराष्ट्रातील नाक्याची परंपरा आता डिजिटल!</p>
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 600, marginBottom: 12 }}>कामगारांसाठी</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link to="/register" style={{ color: '#9CA3AF', fontSize: 13, textDecoration: 'none' }}>नोंदणी करा</Link>
                <Link to="/workers" style={{ color: '#9CA3AF', fontSize: 13, textDecoration: 'none' }}>प्रोफाइल तयार करा</Link>
              </div>
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 600, marginBottom: 12 }}>मालकांसाठी</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link to="/jobs/post" style={{ color: '#9CA3AF', fontSize: 13, textDecoration: 'none' }}>काम टाका</Link>
                <Link to="/workers" style={{ color: '#9CA3AF', fontSize: 13, textDecoration: 'none' }}>कामगार शोधा</Link>
              </div>
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 600, marginBottom: 12 }}>संपर्क</div>
              <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                <div>📧 info@digitalkamnaka.in</div>
                <div>📱 +91 98765 43210</div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #1F2937', paddingTop: 20, textAlign: 'center', fontSize: 13 }}>
            © 2024 Digital Kaam Naka. All rights reserved. | Made with ❤️ for Maharashtra's workers
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
