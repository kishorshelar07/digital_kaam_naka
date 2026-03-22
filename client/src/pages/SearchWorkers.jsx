import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { workerService, jobService } from '../services/authService';
import WorkerCard from '../components/worker/WorkerCard';
import { CardSkeleton } from '../components/common/Loader';

// ── Filter Panel — defined OUTSIDE component to avoid remount ──
const FilterPanel = ({ filters, categories, lang, onFilter, onReset, activeCount }) => {
  const getCatName = (cat) =>
    ({ mr: cat.nameMr, hi: cat.nameHi, en: cat.nameEn }[lang] || cat.nameEn);

  return (
    <div className="card card-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, margin: 0 }}>🔧 फिल्टर</h3>
        {activeCount > 0 && (
          <button onClick={onReset} className="btn btn-light btn-sm" style={{ fontSize: 12 }}>
            🔄 साफ करा ({activeCount})
          </button>
        )}
      </div>

      {/* Category */}
      <div className="form-group">
        <label className="form-label">कामाचा प्रकार</label>
        <select
          className="form-control"
          value={filters.category}
          onChange={e => onFilter('category', e.target.value)}
        >
          <option value="">सर्व प्रकार</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat._id}>{getCatName(cat)}</option>
          ))}
        </select>
      </div>

      {/* District */}
      <div className="form-group">
        <label className="form-label">जिल्हा</label>
        <select
          className="form-control"
          value={filters.district}
          onChange={e => onFilter('district', e.target.value)}
        >
          <option value="">सर्व जिल्हे</option>
          {['Pune','Mumbai','Nashik','Aurangabad','Nagpur','Kolhapur',
            'Solapur','Satara','Sangli','Latur','Ahmednagar','Thane'].map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Max Rate */}
      <div className="form-group">
        <label className="form-label">
          जास्तीत जास्त दर{filters.maxRate ? ` — ₹${filters.maxRate}` : ''}
        </label>
        <input
          type="range"
          min="0" max="2000" step="100"
          value={filters.maxRate || 0}
          onChange={e => onFilter('maxRate', e.target.value === '0' ? '' : e.target.value)}
          style={{ width: '100%', accentColor: 'var(--color-primary)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
          <span>₹0</span><span>₹2000</span>
        </div>
      </div>

      {/* Available Today */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: '1px solid var(--color-border)', marginBottom: 8 }}>
        <input
          type="checkbox"
          id="avail-filter"
          checked={filters.availableToday}
          onChange={e => onFilter('availableToday', e.target.checked)}
          style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--color-primary)' }}
        />
        <label htmlFor="avail-filter" style={{ fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
          🟢 आज उपलब्ध
        </label>
      </div>

      {/* Sort */}
      <div className="form-group">
        <label className="form-label">क्रमवारी</label>
        <select
          className="form-control"
          value={filters.sort}
          onChange={e => onFilter('sort', e.target.value)}
        >
          <option value="rating">⭐ रेटिंगनुसार</option>
          <option value="rate_asc">₹ कमी दरापासून</option>
          <option value="rate_desc">₹ जास्त दरापासून</option>
          <option value="jobs">💼 सर्वाधिक काम</option>
          <option value="newest">🆕 नवीन आधी</option>
        </select>
      </div>
    </div>
  );
};

const SearchWorkers = () => {
  const { i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lang = i18n.language;

  const [workers, setWorkers]       = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    category:       searchParams.get('category') || '',
    district:       searchParams.get('location') || '',
    maxRate:        '',
    availableToday: searchParams.get('availableToday') === 'true',
    sort:           'rating',
  });

  useEffect(() => {
    jobService.getCategories()
      .then(({ data }) => { if (data.success) setCategories(data.data); })
      .catch(() => {});
  }, []);

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    try {
      // BUG FIX: Build params carefully — don't delete valid values like sort
      const params = { page, limit: 12, sort: filters.sort };

      if (filters.category)       params.category    = filters.category;
      if (filters.district)       params.district    = filters.district;
      if (filters.maxRate)        params.maxRate     = filters.maxRate;
      if (filters.availableToday) params.isAvailable = 'true';

      const { data } = await workerService.getAll(params);
      if (data.success) {
        setWorkers(data.data || []);
        setTotal(data.count || 0);
      }
    } catch {
      toast.error('कामगार लोड होऊ शकले नाहीत');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchWorkers(); }, [fetchWorkers]);

  const handleFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ category: '', district: '', maxRate: '', availableToday: false, sort: 'rating' });
    setPage(1);
  }, []);

  const activeFilterCount = [
    filters.category,
    filters.district,
    filters.maxRate,
    filters.availableToday,
  ].filter(Boolean).length;

  return (
    <div className="container section-sm">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22 }}>कामगार शोधा</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
            {loading ? 'लोड होत आहे...' : `${total} कामगार सापडले`}
          </p>
        </div>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="mobile-filter-btn"
          style={{
            alignItems: 'center', gap: 6,
            padding: '10px 16px', borderRadius: 'var(--radius-md)',
            border: `2px solid ${activeFilterCount > 0 ? 'var(--color-primary)' : 'var(--color-border)'}`,
            background: activeFilterCount > 0 ? 'var(--color-primary-light)' : 'white',
            color: activeFilterCount > 0 ? 'var(--color-primary)' : 'var(--color-text)',
            fontFamily: 'var(--font-family)', fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}
        >
          🔧 फिल्टर {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
        </button>
      </div>

      {/* Mobile filter drawer */}
      {showFilters && (
        <div style={{ marginBottom: 20 }}>
          <FilterPanel
            filters={filters}
            categories={categories}
            lang={lang}
            onFilter={handleFilter}
            onReset={resetFilters}
            activeCount={activeFilterCount}
          />
        </div>
      )}

      <div className="search-layout">
        {/* Desktop Sidebar */}
        <div className="search-sidebar">
          <FilterPanel
            filters={filters}
            categories={categories}
            lang={lang}
            onFilter={handleFilter}
            onReset={resetFilters}
            activeCount={activeFilterCount}
          />
        </div>

        {/* Results */}
        <div>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : workers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
              <h3>कोणतेही कामगार सापडले नाहीत</h3>
              <p style={{ marginTop: 8, fontSize: 14 }}>वेगळे फिल्टर वापरून पाहा</p>
              {activeFilterCount > 0 && (
                <button onClick={resetFilters} className="btn btn-primary" style={{ marginTop: 16 }}>
                  सर्व फिल्टर साफ करा
                </button>
              )}
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                {workers.map(worker => (
                  <WorkerCard
                    key={worker._id}
                    worker={worker}
                    onBook={(w) => navigate(`/book/${w._id}`)}
                  />
                ))}
              </div>

              {total > 12 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 32 }}>
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn btn-light">← मागे</button>
                  <span style={{ padding: '12px 20px', fontWeight: 600, fontSize: 14 }}>
                    पृष्ठ {page} / {Math.ceil(total / 12)}
                  </span>
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