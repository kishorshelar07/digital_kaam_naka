import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { workerService, jobService } from '../services/authService';
import WorkerCard from '../components/worker/WorkerCard';
import { CardSkeleton } from '../components/common/Loader';

const SearchWorkers = () => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lang = i18n.language;

  const [workers, setWorkers]       = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [filters, setFilters] = useState({
    category:      searchParams.get('category') || '',
    district:      searchParams.get('location') || '',
    maxRate:       '',
    minRating:     '',
    availableToday: searchParams.get('availableToday') === 'true',
    sort:          'rating',
  });

  useEffect(() => {
    jobService.getCategories()
      .then(({ data }) => { if (data.success) setCategories(data.data); })
      .catch(() => {});
  }, []);

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, page, limit: 12 };
      if (filters.availableToday) params.isAvailable = true;
      delete params.availableToday;
      Object.keys(params).forEach(k => !params[k] && delete params[k]);

      const { data } = await workerService.getAll(params);
      if (data.success) { setWorkers(data.data); setTotal(data.count || 0); }
    } catch { toast.error('कामगार लोड होऊ शकले नाहीत'); }
    finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { fetchWorkers(); }, [fetchWorkers]);

  const handleFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const getCatName = (cat) => ({ mr: cat.nameMr, hi: cat.nameHi, en: cat.nameEn }[lang] || cat.nameEn);

  return (
    <div className="container section-sm">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22 }}>{t('search.title')}</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>{total} कामगार सापडले</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24 }}>
        {/* Filters */}
        <div>
          <div className="card card-body">
            <h3 style={{ fontSize: 15, marginBottom: 16 }}>🔧 {t('search.filters')}</h3>

            <div className="form-group">
              <label className="form-label">{t('search.category')}</label>
              <select className="form-control" value={filters.category}
                onChange={e => handleFilter('category', e.target.value)}>
                <option value="">सर्व प्रकार</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{getCatName(cat)}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">जास्तीत जास्त दर: {filters.maxRate ? `₹${filters.maxRate}` : 'कोणताही'}</label>
              <input type="range" min="200" max="5000" step="100"
                style={{ width: '100%' }}
                value={filters.maxRate || 5000}
                onChange={e => handleFilter('maxRate', e.target.value === '5000' ? '' : e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">{t('search.minRating')}</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[0, 3, 4, 4.5].map(r => (
                  <button key={r} onClick={() => handleFilter('minRating', r || '')}
                    style={{
                      flex: 1, padding: '6px 4px', border: '1px solid', borderRadius: 6,
                      cursor: 'pointer', fontSize: 11, fontWeight: 600,
                      borderColor: filters.minRating == r ? 'var(--color-primary)' : 'var(--color-border)',
                      background: filters.minRating == r ? 'var(--color-primary-light)' : 'white',
                      color: filters.minRating == r ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    }}>
                    {r ? `${r}★+` : 'सर्व'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: '1px solid var(--color-border)' }}>
              <input type="checkbox" id="avail" checked={filters.availableToday}
                onChange={e => handleFilter('availableToday', e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer' }} />
              <label htmlFor="avail" style={{ fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                🟢 {t('search.availableToday')}
              </label>
            </div>

            <div className="form-group" style={{ marginTop: 8 }}>
              <label className="form-label">{t('search.sortBy')}</label>
              <select className="form-control" value={filters.sort}
                onChange={e => handleFilter('sort', e.target.value)}>
                <option value="rating">⭐ रेटिंगनुसार</option>
                <option value="rate_asc">₹ कमी दरापासून</option>
                <option value="rate_desc">₹ जास्त दरापासून</option>
                <option value="jobs">💼 सर्वाधिक काम</option>
              </select>
            </div>

            <button onClick={() => setFilters({ category: '', district: '', maxRate: '', minRating: '', availableToday: false, sort: 'rating' })}
              className="btn btn-light btn-sm btn-block">
              🔄 फिल्टर साफ करा
            </button>
          </div>
        </div>

        {/* Worker Grid */}
        <div>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : workers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
              <h3>{t('search.noResults')}</h3>
              <p style={{ marginTop: 8 }}>{t('search.tryAdjusting')}</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                {workers.map(worker => (
                  <WorkerCard key={worker.id} worker={worker}
                    onBook={(w) => navigate(`/book/${w.id}`)} />
                ))}
              </div>
              {total > 12 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn btn-light">← मागे</button>
                  <span style={{ padding: '12px 20px', fontWeight: 600 }}>पृष्ठ {page}</span>
                  <button disabled={page * 12 >= total} onClick={() => setPage(p => p + 1)} className="btn btn-light">पुढे →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchWorkers;
