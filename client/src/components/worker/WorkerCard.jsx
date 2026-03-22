import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const WorkerCard = ({ worker, onBook, showBookBtn = true }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const user = worker?.userId || {};

  // FIX: skill.categoryId is the populated category object
  const getSkillName = (skill) => {
    const cat = skill?.categoryId;
    if (!cat) return '';
    const map = { mr: cat.nameMr, hi: cat.nameHi, en: cat.nameEn };
    return map[lang] || cat.nameEn || '';
  };

  const levelColor = {
    beginner:   'badge-secondary',
    experienced:'badge-primary',
    expert:     'badge-warning',
  };

  return (
    <div className="card worker-card fade-in">
      <div className="card-body">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img
              src={user.profilePhoto ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'W')}&background=F97316&color=fff&size=64`}
              alt={user.name || 'Worker'}
              className="profile-avatar"
              loading="lazy"
            />
            {worker.isAvailable && (
              <span className="available-dot" title="आज उपलब्ध" aria-label="Available today" />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Link
                to={`/workers/${worker._id}`}
                style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-text)', textDecoration: 'none' }}
              >
                {user.name || 'Worker'}
              </Link>
              {worker.isVerified && (
                <span className="badge badge-verified" style={{ fontSize: 10 }}>✅ पडताळलेले</span>
              )}
            </div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 13, marginTop: 2 }}>
              📍 {worker.city}{worker.district ? `, ${worker.district}` : ''}
              {worker.distance != null && (
                <span style={{ marginLeft: 8, color: 'var(--color-primary)', fontWeight: 600 }}>
                  {parseFloat(worker.distance) < 1
                    ? `${Math.round(worker.distance * 1000)}m`
                    : `${parseFloat(worker.distance).toFixed(1)}km`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Skills */}
        {worker.skills?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {worker.skills.slice(0, 3).map((skill, idx) => (
              <span
                key={skill._id || idx}
                className={`badge ${levelColor[skill.level] || 'badge-secondary'}`}
              >
                {getSkillName(skill)}
              </span>
            ))}
            {worker.skills.length > 3 && (
              <span className="badge badge-secondary">+{worker.skills.length - 3}</span>
            )}
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-primary)' }}>
              ₹{parseInt(worker.dailyRate || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{t('common.perDay')}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: '#F59E0B', fontSize: 16 }}>★</span>
              <span style={{ fontWeight: 700 }}>{parseFloat(worker.avgRating || 0).toFixed(1)}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{worker.totalJobs || 0} कामे</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{worker.experienceYrs || 0} वर्षे</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>अनुभव</div>
          </div>
        </div>

        {/* Availability */}
        <div style={{ marginBottom: 12 }}>
          {worker.isAvailable
            ? <span className="badge badge-success" style={{ fontSize: 12 }}>🟢 आज उपलब्ध</span>
            : <span className="badge badge-secondary" style={{ fontSize: 12 }}>⚫ उपलब्ध नाही</span>
          }
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <Link
            to={`/workers/${worker._id}`}
            className="btn btn-outline btn-sm"
            style={{ flex: 1, textDecoration: 'none' }}
          >
            प्रोफाइल पाहा
          </Link>
          {showBookBtn && worker.isAvailable && (
            <button
              className="btn btn-primary btn-sm"
              style={{ flex: 1 }}
              onClick={() => onBook && onBook(worker)}
            >
              📅 बुक करा
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkerCard;
