import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { workerService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { RatingDisplay } from '../components/rating/RatingStars';
import Loader from '../components/common/Loader';

const WorkerProfilePage = () => {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const { isEmployer } = useAuth();
  const navigate = useNavigate();
  const lang = i18n.language;

  const [worker, setWorker]   = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [wRes, rRes] = await Promise.all([
          workerService.getById(id),
          workerService.getReviews(id, { limit: 5 }),
        ]);
        if (wRes.data.success) setWorker(wRes.data.data);
        if (rRes.data.success) setReviews(rRes.data.data || []);
      } catch { toast.error('Profile लोड होऊ शकली नाही'); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  if (loading) return <div className="container section-sm"><Loader fullPage /></div>;
  if (!worker)  return <div className="container section-sm"><p>Worker सापडला नाही</p></div>;

  // CHANGED: worker.user → worker.userId (MongoDB populated field)
  const workerUser = worker.userId || {};
  const getCatName = (cat) => ({ mr: cat?.nameMr, hi: cat?.nameHi, en: cat?.nameEn }[lang] || cat?.nameEn || '');
  const levelLabel = { beginner: 'नवीन', experienced: 'अनुभवी', expert: 'तज्ञ' };
  const levelColor = { beginner: 'badge-secondary', experienced: 'badge-primary', expert: 'badge-warning' };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
      <div className="card" style={{ marginBottom: 16, overflow: 'visible' }}>
        <div style={{ height: 120, background: 'linear-gradient(135deg, #1E3A5F, #2d5282)', borderRadius: '16px 16px 0 0' }} />
        <div className="card-body" style={{ paddingTop: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginTop: -40, marginBottom: 16, flexWrap: 'wrap' }}>
            <img
              src={workerUser.profilePhoto || `https://ui-avatars.com/api/?name=${workerUser.name}&background=F97316&color=fff&size=96`}
              alt={workerUser.name}
              style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '4px solid white', flexShrink: 0 }}
            />
            <div style={{ flex: 1, paddingBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 22, margin: 0 }}>{workerUser.name}</h1>
                {worker.isVerified && <span className="badge badge-verified">✅ पडताळलेले</span>}
                {worker.isAvailable && <span className="badge badge-success">🟢 आज उपलब्ध</span>}
              </div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>
                📍 {worker.city}{worker.district ? `, ${worker.district}` : ''} | {worker.experienceYrs} वर्षे अनुभव
              </div>
              <RatingDisplay rating={worker.avgRating} count={worker.totalJobs} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'रोजंदारी', value: `₹${parseInt(worker.dailyRate).toLocaleString()}`, sub: 'प्रती दिवस', color: 'var(--color-primary)' },
              { label: 'एकूण काम', value: worker.totalJobs, sub: 'पूर्ण केलेली', color: 'var(--color-secondary)' },
              { label: 'रेटिंग', value: `${parseFloat(worker.avgRating || 0).toFixed(1)} ★`, sub: 'सरासरी', color: '#F59E0B' },
            ].map((stat, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '12px 8px', background: 'var(--color-bg)', borderRadius: 10 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{stat.label}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {worker.skills?.length > 0 && (
        <div className="card card-body" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>💼 कौशल्ये</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {/* CHANGED: skill.id → skill._id */}
            {worker.skills.map(skill => (
              <span key={skill._id} className={`badge ${levelColor[skill.level] || 'badge-secondary'}`}
                style={{ fontSize: 13, padding: '6px 14px' }}>
                {skill.categoryId?.iconEmoji || ''} {getCatName(skill.categoryId || {})} — {levelLabel[skill.level] || ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {worker.bio && (
        <div className="card card-body" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, marginBottom: 8 }}>👤 माझ्याबद्दल</h3>
          <p style={{ color: 'var(--color-text)', lineHeight: 1.7 }}>{worker.bio}</p>
        </div>
      )}

      {reviews.length > 0 && (
        <div className="card card-body" style={{ marginBottom: 80 }}>
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>⭐ अभिप्राय</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* CHANGED: r.id → r._id */}
            {reviews.map(r => (
              <div key={r._id} style={{ paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <img
                    src={r.ratedBy?.profilePhoto || `https://ui-avatars.com/api/?name=${r.ratedBy?.name || 'U'}&background=1E3A5F&color=fff&size=36`}
                    alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{r.ratedBy?.name}</div>
                    <div style={{ color: '#F59E0B', fontSize: 14 }}>
                      {'★'.repeat(r.score)}{'☆'.repeat(5 - r.score)}
                    </div>
                  </div>
                </div>
                {r.review && <p style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.6, margin: 0 }}>{r.review}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CHANGED: worker.id → worker._id */}
      {isEmployer && worker.isAvailable && (
        <div className="sticky-bottom-btn">
          <button className="btn btn-primary btn-block btn-lg" style={{ boxShadow: 'var(--shadow-lg)' }}
            onClick={() => navigate(`/book/${worker._id}`)}>
            📅 {t('worker.profile.bookNow')}
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkerProfilePage;