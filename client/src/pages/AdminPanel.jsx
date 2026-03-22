/**
 * pages/AdminPanel.jsx
 * CHANGES: user.id → user._id (MongoDB ObjectId)
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../services/api';
import Loader from '../components/common/Loader';

const AdminPanel = () => {
  const { t } = useTranslation();
  const [stats, setStats]     = useState(null);
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('dashboard');
  const [search, setSearch]   = useState('');

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(({ data }) => { if (data.success) setStats(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'users') {
      api.get('/admin/users', { params: { q: search, limit: 20 } })
        .then(({ data }) => { if (data.success) setUsers(data.data || []); })
        .catch(() => {});
    }
  }, [tab, search]);

  const handleVerifyUser = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/verify`);
      toast.success('User पडताळला!');
      // CHANGED: u.id → u._id
      setUsers(prev => prev.map(u => u._id?.toString() === userId?.toString() ? { ...u, isVerified: true } : u));
    } catch { toast.error('पडताळणी अयशस्वी'); }
  };

  const handleToggleBlock = async (userId, isActive) => {
    try {
      await api.put(`/admin/users/${userId}/block`);
      toast.success(isActive ? 'User block केला' : 'User unblock केला');
      // CHANGED: u.id → u._id
      setUsers(prev => prev.map(u => u._id?.toString() === userId?.toString() ? { ...u, isActive: !u.isActive } : u));
    } catch { toast.error('अयशस्वी'); }
  };

  if (loading) return <div className="container section-sm"><Loader fullPage /></div>;

  const TABS = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'users',     label: '👥 Users' },
    { id: 'bookings',  label: '📋 Bookings' },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22 }}>🔧 Admin Panel</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Digital Kaam Naka Platform Management</p>
      </div>

      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid var(--color-border)', marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '10px 20px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-family)', fontWeight: 600, fontSize: 14,
              background: 'none', borderBottom: `3px solid ${tab === t.id ? 'var(--color-primary)' : 'transparent'}`,
              color: tab === t.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
              marginBottom: -2,
            }}>{t.label}</button>
        ))}
      </div>

      {tab === 'dashboard' && stats && (
        <div>
          <div className="grid-4" style={{ marginBottom: 24, gap: 16 }}>
            {[
              { label: 'एकूण Users', value: stats.totalUsers, icon: '👥', color: 'var(--color-secondary)' },
              { label: 'कामगार', value: stats.totalWorkers, icon: '👷', color: 'var(--color-primary)' },
              { label: 'मालक', value: stats.totalEmployers, icon: '🏢', color: '#8B5CF6' },
              { label: 'एकूण Bookings', value: stats.totalBookings, icon: '📋', color: '#0EA5E9' },
              { label: 'पूर्ण Bookings', value: stats.completedBookings, icon: '✅', color: 'var(--color-success)' },
              { label: 'Platform महसूल', value: `₹${parseInt(stats.platformRevenue || 0).toLocaleString()}`, icon: '💰', color: '#F59E0B' },
            ].map((s, i) => (
              <div key={i} className="card card-body" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <input type="text" className="form-control" style={{ maxWidth: 400 }}
              placeholder="नाव किंवा फोन नंबर शोधा..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: 'var(--color-bg)' }}>
                  {['नाव', 'फोन', 'भूमिका', 'पडताळणी', 'स्थिती', 'क्रिया'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--color-text-muted)', borderBottom: '2px solid var(--color-border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* CHANGED: user.id → user._id */}
                {users.map(user => (
                  <tr key={user._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img src={user.profilePhoto || `https://ui-avatars.com/api/?name=${user.name}&background=F97316&color=fff&size=32`}
                          alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                        <span style={{ fontWeight: 500 }}>{user.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>{user.phone}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge ${user.role === 'worker' ? 'badge-primary' : user.role === 'employer' ? 'badge-secondary' : 'badge-warning'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {user.isVerified
                        ? <span className="badge badge-success">✅ पडताळलेले</span>
                        : <span className="badge badge-warning">⏳ प्रलंबित</span>
                      }
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {user.isActive
                        ? <span className="badge badge-success">सक्रिय</span>
                        : <span className="badge badge-danger">Block</span>
                      }
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {/* CHANGED: user.id → user._id */}
                        {!user.isVerified && user.role !== 'admin' && (
                          <button className="btn btn-success btn-sm" onClick={() => handleVerifyUser(user._id)}>✅ Verify</button>
                        )}
                        {user.role !== 'admin' && (
                          <button className={`btn btn-sm ${user.isActive ? 'btn-danger' : 'btn-light'}`}
                            onClick={() => handleToggleBlock(user._id, user.isActive)}>
                            {user.isActive ? '🚫 Block' : '✅ Unblock'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--color-text-muted)' }}>कोणताही User सापडला नाही</div>
            )}
          </div>
        </div>
      )}

      {tab === 'bookings' && (
        <div className="card card-body" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <h3>All Bookings</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>Connect /admin/bookings endpoint</p>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
