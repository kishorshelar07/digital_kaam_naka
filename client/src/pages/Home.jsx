import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { jobService } from '../services/authService';

const FALLBACK_CATEGORIES = [
  { emoji: '🏗️', mr: 'बांधकाम',         en: 'Construction' },
  { emoji: '🌾', mr: 'शेती',             en: 'Farming' },
  { emoji: '🔧', mr: 'प्लंबिंग',          en: 'Plumbing' },
  { emoji: '⚡', mr: 'विद्युत काम',       en: 'Electrical' },
  { emoji: '🎨', mr: 'रंगकाम',           en: 'Painting' },
  { emoji: '🪚', mr: 'सुतारकाम',         en: 'Carpentry' },
  { emoji: '📦', mr: 'माल वाहतूक',       en: 'Loading' },
  { emoji: '🧹', mr: 'साफसफाई',           en: 'Cleaning' },
  { emoji: '🌱', mr: 'बागकाम',           en: 'Gardening' },
  { emoji: '🔒', mr: 'सुरक्षा',           en: 'Security' },
  { emoji: '🚗', mr: 'वाहन चालवणे',      en: 'Driving' },
  { emoji: '🍳', mr: 'स्वयंपाक',          en: 'Cooking' },
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
  { value: '2,00,000+',label: 'यशस्वी बुकिंग',   icon: '✅' },
  { value: '15,000+', label: 'मालक',              icon: '🏢' },
];

const HOW_IT_WORKS = [
  { step: '1', icon: '📱', title: 'नोंदणी करा',        desc: 'फोन नंबरने 2 मिनिटात नोंदणी. OTP टाका, झाले!' },
  { step: '2', icon: '⚡', title: 'उपलब्ध व्हा',        desc: 'सकाळी "आज उपलब्ध" ON करा. मालकांना दिसता.' },
  { step: '3', icon: '📞', title: 'बुकिंग मिळवा',       desc: 'मालक तुम्हाला बुक करतात. WhatsApp वर कळते.' },
  { step: '4', icon: '💰', title: 'काम करा, पैसे मिळवा', desc: 'काम करा आणि रोख किंवा UPI ने पैसे घ्या.' },
];

const Home = () => {
  const { t, i18n } = useTranslation();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const lang = i18n.language;

  const [searchQuery, setSearchQuery]     = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [categories, setCategories]       = useState([]);
  const [catLoading, setCatLoading]       = useState(true);

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
    navigate(catId ? `/workers?category=${catId}` : '/workers');
  };

  const displayCats = categories.length > 0 ? categories : FALLBACK_CATEGORIES;

  return (
    <div>
      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-pattern" aria-hidden="true" />
        <div className="container" style={{ position: 'relative', textAlign: 'center' }}>

          <div className="hero-badge">
            🏗️ महाराष्ट्रातील #1 डिजिटल काम नाका
          </div>

          <h1 className="hero-title">
            <span style={{ color: 'var(--color-primary)' }}>Digital</span> Kaam Naka
          </h1>
          <p className="hero-tagline">{t('app.tagline')}</p>
          <p className="hero-desc">{t('home.hero.description')}</p>

          {/* Search */}
          <form onSubmit={handleSearch} className="hero-search">
            <input
              type="text"
              placeholder={t('home.hero.searchPlaceholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="hero-search-input"
              aria-label="काम शोधा"
            />
            <div className="hero-search-divider" aria-hidden="true" />
            <input
              type="text"
              placeholder={t('home.hero.locationPlaceholder')}
              value={searchLocation}
              onChange={e => setSearchLocation(e.target.value)}
              className="hero-search-input"
              aria-label="ठिकाण"
            />
            <button type="submit" className="btn btn-primary hero-search-btn">
              🔍 {t('home.hero.searchBtn')}
            </button>
          </form>

          {/* CTA */}
          <div className="hero-cta">
            <Link to="/workers" className="btn btn-primary btn-lg hero-btn" style={{ textDecoration: 'none' }}>
              👷 {t('home.hero.findWorkers')}
            </Link>
            <Link
              to={isLoggedIn ? '/jobs/post' : '/register'}
              className="btn btn-lg hero-btn hero-btn-ghost"
              style={{ textDecoration: 'none' }}
            >
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
          <div className="how-grid">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="how-step">
                <div className="how-icon-wrap">
                  <span className="how-icon">{step.icon}</span>
                  <span className="how-step-num">{step.step}</span>
                </div>
                <h3 style={{ fontSize: 16, marginBottom: 8 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-bg)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2>{t('home.categories.title')}</h2>
            <p style={{ color: 'var(--color-text-muted)', marginTop: 8 }}>{t('home.categories.subtitle')}</p>
          </div>
          <div className="cat-grid">
            {catLoading
              ? Array(12).fill(0).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />
                ))
              : displayCats.map((cat, i) => (
                  <button
                    key={cat._id || i}
                    className="cat-btn"
                    onClick={() => handleCategoryClick(cat._id)}
                    aria-label={cat.nameEn || cat.en}
                  >
                    <span className="cat-emoji">{cat.iconEmoji || cat.emoji || '💼'}</span>
                    <span className="cat-name">
                      {lang === 'mr' ? (cat.nameMr || cat.mr)
                        : lang === 'hi' ? (cat.nameHi || cat.mr)
                        : (cat.nameEn || cat.en)}
                    </span>
                  </button>
                ))
            }
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────── */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {STATS.map((stat, i) => (
              <div key={i} className="stat-item">
                <div className="stat-icon" aria-hidden="true">{stat.icon}</div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
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
          <div className="testimonial-grid">
            {TESTIMONIALS.map((item, i) => (
              <div key={i} className="card card-body testimonial-card fade-in">
                <div className="testimonial-quote" aria-hidden="true">"</div>
                <p className="testimonial-text">{item.text}</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar" aria-hidden="true">{item.name[0]}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{item.role}</div>
                    <div style={{ color: '#F59E0B', fontSize: 14, marginTop: 2 }} aria-label={`${item.rating} stars`}>
                      {'★'.repeat(item.rating)}
                    </div>
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
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">🏗️ Digital Kaam Naka</div>
              <p className="footer-tagline">महाराष्ट्रातील नाक्याची परंपरा आता डिजिटल!</p>
            </div>
            <div>
              <div className="footer-heading">कामगारांसाठी</div>
              <div className="footer-links">
                <Link to="/register" className="footer-link">नोंदणी करा</Link>
                <Link to="/workers" className="footer-link">प्रोफाइल तयार करा</Link>
              </div>
            </div>
            <div>
              <div className="footer-heading">मालकांसाठी</div>
              <div className="footer-links">
                <Link to="/jobs/post" className="footer-link">काम टाका</Link>
                <Link to="/workers" className="footer-link">कामगार शोधा</Link>
              </div>
            </div>
            <div>
              <div className="footer-heading">संपर्क</div>
              <div className="footer-contact">
                <div>📧 info@digitalkamnaka.in</div>
                <div>📱 +91 98765 43210</div>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            © 2024 Digital Kaam Naka. All rights reserved. | Made with ❤️ for Maharashtra's workers
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
