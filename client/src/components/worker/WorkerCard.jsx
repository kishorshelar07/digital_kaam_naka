import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const WorkerCard = ({ worker, onBook, showBookBtn = true }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const user = worker?.user || {};

  const getSkillName = (skill) => {
    if (!skill?.category) return '';
    const map = { mr: skill.category.nameMr, hi: skill.category.nameHi, en: skill.category.nameEn };
    return map[lang] || skill.category.nameEn;
  };

  const levelColor = {
    beginner: 'badge-secondary',
    experienced: 'badge-primary',
    expert: 'badge-warning'
  };

  return (
    <div className="card worker-card fade-in">
      <div className="card-body">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img
              src={user.profilePhoto || `https://ui-avatars.com/api/?name=${user.name || 'W'}&background=F97316&color=fff&size=64`}
              alt={user.name}
              className="profile-avatar"
            />
            {worker.isAvailable && <span className="available-dot" title="आज उपलब्ध" />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Link
                to={`/workers/${worker.id}`}
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

        {worker.skills?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {worker.skills.slice(0, 3).map(skill => (
              <span key={skill.id} className={`badge ${levelColor[skill.level] || 'badge-secondary'}`}>
                {getSkillName(skill)}
              </span>
            ))}
            {worker.skills.length > 3 && (
              <span className="badge badge-secondary">+{worker.skills.length - 3}</span>
            )}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-primary)' }}>
              ₹{parseInt(worker.dailyRate).toLocaleString()}
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

        <div style={{ marginBottom: 12 }}>
          {worker.isAvailable
            ? <span className="badge badge-success" style={{ fontSize: 12 }}>🟢 आज उपलब्ध</span>
            : <span className="badge badge-secondary" style={{ fontSize: 12 }}>⚫ उपलब्ध नाही</span>
          }
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Link
            to={`/workers/${worker.id}`}
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
