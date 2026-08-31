import React, { useState, useEffect } from 'react';
import { admin as adminApi } from '../../api/client';
import { FiRefreshCw, FiExternalLink, FiUsers, FiUserCheck, FiUserX, FiClock, FiSearch, FiSlash, FiCalendar, FiCheckCircle, FiX, FiDollarSign, FiPlusCircle, FiMinusCircle, FiEdit3, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import { MdStorefront } from 'react-icons/md';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

const StatusBadge = ({ status, isKhmer }) => {
  const map = {
    ACTIVE: { bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.2) 100%)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', shadow: '0 0 10px rgba(16, 185, 129, 0.3)', label: isKhmer ? 'សកម្ម' : 'ACTIVE' },
    EXPIRED: { bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.2) 100%)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', shadow: '0 0 10px rgba(239, 68, 68, 0.3)', label: isKhmer ? 'ផុតកំណត់' : 'EXPIRED' },
    PENDING: { bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(180, 83, 9, 0.2) 100%)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#fbbf24', shadow: '0 0 10px rgba(245, 158, 11, 0.3)', label: isKhmer ? 'រង់ចាំ' : 'PENDING' },
  };
  const c = map[status] || { bg: 'rgba(100, 116, 139, 0.2)', border: '1px solid rgba(100, 116, 139, 0.3)', color: '#94a3b8', shadow: 'none', label: status };
  return (
    <span style={{
      padding: '4px 12px',
      borderRadius: 20,
      fontSize: '0.75rem',
      fontWeight: 800,
      letterSpacing: '0.03em',
      background: c.bg,
      border: c.border,
      color: c.color,
      boxShadow: c.shadow,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
      {c.label}
    </span>
  );
};

const DuplicateBadge = ({ daysRemaining, isKhmer }) => (
  <span style={{
    padding: '4px 10px',
    borderRadius: 12,
    fontSize: '0.72rem',
    fontWeight: 900,
    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.2) 100%)',
    border: '1px solid rgba(239, 68, 68, 0.5)',
    color: '#fca5a5',
    boxShadow: '0 0 10px rgba(239, 68, 68, 0.3)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4
  }}>
    <FiClock size={11} />
    {isKhmer ? `ឈ្មោះជាន់គ្នា (នៅសល់ ${daysRemaining ?? 7} ថ្ងៃ)` : `DUPLICATE (${daysRemaining ?? 7}d left)`}
  </span>
);

export default function SellersManage() {
  const { isKhmer } = useLanguage();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [scanningDuplicates, setScanningDuplicates] = useState(false);

  const handleScanDuplicates = async () => {
    setScanningDuplicates(true);
    try {
      const res = await adminApi.scanDuplicateSellers();
      const data = res.data?.data || res.data || {};
      const flagged = data.flaggedNewDuplicates || 0;
      const totalGroups = data.totalDuplicateGroups || 0;
      toast.success(
        isKhmer
          ? `បានស្កេនរួចរាល់! រកឃើញឈ្មោះជាន់គ្នា ${totalGroups} ក្រុម, បានដាក់ការព្រមាន ៧ ថ្ងៃលើហាងថ្មី ${flagged}`
          : `Scan complete! Found ${totalGroups} duplicate groups, flagged ${flagged} new duplicate stores with 7-day warning.`
      );
      load();
    } catch (err) {
      console.error('Failed to scan duplicates:', err);
      toast.error('Failed to scan duplicate stores');
    } finally {
      setScanningDuplicates(false);
    }
  };

  const handleFlagDuplicate = async (targetUserId) => {
    try {
      await adminApi.flagDuplicateSeller(targetUserId);
      toast.success(isKhmer ? 'បានដាក់ការព្រមានឈ្មោះជាន់គ្នា ៧ ថ្ងៃជោគជ័យ' : 'Flagged store as duplicate with 7-day warning');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to flag duplicate store');
    }
  };

  const [actionLoading, setActionLoading] = useState(null);

  // Custom Confirm Modal state (replaces native window.confirm)
  const [confirmModal, setConfirmModal] = useState(null); // { sellerId, storeName, currentStatus, newStatus }

  // Edit Expiration Modal state
  const [expiryModal, setExpiryModal] = useState(null); // { sellerId, storeName, currentExpiry, userId }
  const [customDays, setCustomDays] = useState(30);
  const [customDate, setCustomDate] = useState('');

  // Edit Balance Modal state (+ / - / set)
  const [balanceModal, setBalanceModal] = useState(null); // { sellerId, userId, storeName, currentBalance }
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceMode, setBalanceMode] = useState('ADD'); // 'ADD' (+), 'DEDUCT' (-), 'SET' (=)
  const [balanceReason, setBalanceReason] = useState('');

  // Delete / Ban Seller Store Modal state
  const [deleteModal, setDeleteModal] = useState(null); // { sellerId, userId, storeName, ownerName }

  const executeDeleteSeller = async () => {
    if (!deleteModal) return;
    const targetUserId = deleteModal.userId || deleteModal.sellerId;
    setActionLoading(targetUserId);
    try {
      await adminApi.deleteSeller(targetUserId);
      toast.success('Seller store deleted and seller banned successfully! (បានលុបហាង និងបិទគណនីស្គែមជោគជ័យ)');
      setDeleteModal(null);
      load();
    } catch (err) {
      console.error('Failed deleting seller:', err);
      toast.error(err?.response?.data?.message || 'Failed deleting seller store');
    } finally {
      setActionLoading(null);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAllSellers();
      const list = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : []));
      setSellers(list);
    } catch (err) {
      console.error('Failed to load sellers:', err);
      toast.error('Failed to load sellers');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Restrict / Activate Seller Store Confirmation Executer
  const executeToggleStatus = async (targetUserId, newStatus) => {
    setActionLoading(targetUserId);
    setConfirmModal(null);
    try {
      await adminApi.updateSellerStatus(targetUserId, newStatus);
      toast.success(newStatus === 'EXPIRED' ? 'Restricted seller store (ហាងត្រូវផ្អាក)' : 'Activated seller store (ហាងបើកដំណើរការ)');
      load();
    } catch (err) {
      console.error('Failed updating seller status:', err);
      toast.error(err?.response?.data?.message || 'Failed updating seller status');
    } finally {
      setActionLoading(null);
    }
  };

  // Save Expiration Date Handler
  const handleSaveExpiration = async () => {
    if (!expiryModal) return;
    const targetUserId = expiryModal.userId || expiryModal.sellerId;
    setActionLoading(targetUserId);

    try {
      let payload = {};
      if (customDate) {
        payload = { subscriptionExpiresAt: customDate };
      } else {
        payload = { days: customDays };
      }

      await adminApi.updateSellerExpiration(targetUserId, payload);
      toast.success('Seller expiration date updated successfully!');
      setExpiryModal(null);
      load();
    } catch (err) {
      console.error('Failed updating expiration:', err);
      toast.error(err?.response?.data?.message || 'Failed updating expiration date');
    } finally {
      setActionLoading(null);
    }
  };

  // Save Balance (+ / - / SET) Handler
  const handleSaveBalance = async () => {
    if (!balanceModal) return;
    const targetUserId = balanceModal.userId || balanceModal.sellerId;
    const parsedAmt = parseFloat(balanceAmount) || 0;
    if (parsedAmt <= 0 && balanceMode !== 'SET') {
      toast.error('Please enter a valid amount');
      return;
    }
    setActionLoading(targetUserId);

    try {
      await adminApi.updateSellerBalance(targetUserId, {
        amount: parsedAmt,
        mode: balanceMode,
        reason: balanceReason
      });
      toast.success('Seller balance updated successfully! (ធ្វើបច្ចុប្បន្នភាពសមតុល្យហាងជោគជ័យ)');
      setBalanceModal(null);
      load();
    } catch (err) {
      console.error('Failed updating balance:', err);
      toast.error(err?.response?.data?.message || 'Failed updating seller balance');
    } finally {
      setActionLoading(null);
    }
  };

  const [planFilter, setPlanFilter] = useState('ALL');

  const filtered = sellers.filter(s => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || (s.storeName && s.storeName.toLowerCase().includes(q)) ||
      (s.ownerName && s.ownerName.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q));

    const matchesPlan = planFilter === 'ALL' || (s.subscriptionPlan === planFilter);

    return matchesSearch && matchesPlan;
  });

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{isKhmer ? 'អ្នកលក់' : 'Sellers'}</h1>
          <p className="admin-page-subtitle">{isKhmer ? `គណនីអ្នកលក់សរុប ${sellers.length}` : `${sellers.length} total seller accounts`}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className="admin-btn"
            onClick={handleScanDuplicates}
            disabled={scanningDuplicates}
            style={{
              background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
              color: '#fff',
              border: 'none',
              fontWeight: 800,
              padding: '8px 16px',
              borderRadius: 10,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
              cursor: 'pointer'
            }}
          >
            <FiAlertTriangle size={15} />
            {scanningDuplicates ? (isKhmer ? 'កំពុងស្កេន...' : 'Scanning...') : (isKhmer ? 'ស្កេនឈ្មោះជាន់គ្នា' : 'Scan Duplicate Stores')}
          </button>
          <button className="admin-btn admin-btn-primary" onClick={load} id="sellers-refresh-btn">
            <FiRefreshCw size={15} /> {isKhmer ? 'ផ្ទុកឡើងវិញ' : 'Refresh'}
          </button>
        </div>
      </div>

      {/*  Stat Cards Grid  */}
      <div className="admin-stats-grid" style={{ marginBottom: 24 }}>
        {[
          {
            title: isKhmer ? 'អ្នកលក់សរុប' : 'TOTAL SELLERS',
            color: 'blue',
            icon: <FiUsers />,
            value: sellers.length,
            change: isKhmer ? 'គណនីហាង' : 'Store Accounts',
            up: true,
            bars: [30, 50, 40, 60, 45, 65, 55, 75, 60, 80],
          },
          {
            title: isKhmer ? 'អ្នកលក់សកម្ម' : 'ACTIVE SELLERS',
            color: 'green',
            icon: <FiUserCheck />,
            value: sellers.filter(s => s.subscriptionStatus === 'ACTIVE').length,
            change: isKhmer ? 'សកម្ម' : 'Active',
            up: true,
            bars: [40, 60, 50, 75, 65, 85, 80, 95],
          },
          {
            title: isKhmer ? 'ផុតកំណត់ / ផ្អាក' : 'EXPIRED / RESTRICTED',
            color: 'pink',
            icon: <FiUserX />,
            value: sellers.filter(s => s.subscriptionStatus === 'EXPIRED').length,
            change: isKhmer ? 'ផ្អាកដំណើរការ' : 'Restricted',
            up: false,
            bars: [20, 15, 30, 25, 20, 10, 15, 10],
          },
          {
            title: isKhmer ? 'រង់ចាំការអនុម័ត' : 'PENDING APPROVAL',
            color: 'purple',
            icon: <FiClock />,
            value: sellers.filter(s => s.subscriptionStatus === 'PENDING').length,
            change: isKhmer ? 'រង់ចាំ' : 'Pending',
            up: true,
            bars: [30, 45, 40, 55, 50, 65, 60, 75],
          },
        ].map((s, i) => (
          <div key={i} className={`admin-stat-card ${s.color}`}>
            <div>
              <div className="admin-stat-label">{s.title}</div>
              <div className="admin-stat-value">{s.value}</div>
              <span className={`admin-stat-change ${s.up ? 'up' : 'down'}`}>
                {s.up ? '' : ''} {s.change}
              </span>
            </div>
            <div className="admin-stat-icon">{s.icon}</div>
            {s.bars && (
              <div className="admin-stat-bars">
                {s.bars.map((h, bi) => (
                  <div key={bi} className="bar" style={{ height: `${h}%` }} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/*  Main Content Container Card  */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 18,
        padding: '24px',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
        marginBottom: 24
      }}>
        {/* Search Bar & Subscription Plan Filter Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: 1, maxWidth: 460 }}>
            <label htmlFor="sellers-search" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#818CF8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              {isKhmer ? 'ស្វែងរក & ច្រោះអ្នកលក់' : 'SEARCH & FILTER SELLERS'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="admin-search-input"
                placeholder={isKhmer ? 'ស្វែងរកឈ្មោះហាង ម្ចាស់ ឬអ៊ីមែល...' : 'Search store name, owner, or email...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                id="sellers-search"
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 42px',
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(124, 58, 237, 0.35)',
                  borderRadius: 12,
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)'
                }}
              />
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#A78BFA', display: 'flex' }}>
                <FiSearch size={16} />
              </span>
            </div>
          </div>

          {/* Subscription Plan Filter Tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#818CF8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {isKhmer ? 'កញ្ចប់សមាជិកភាព' : 'SUBSCRIPTION PLAN FILTER'}
            </label>
            <div style={{ display: 'flex', gap: 6, background: 'rgba(30, 41, 59, 0.6)', padding: 4, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
              {[
                { id: 'ALL', label: isKhmer ? 'គ្រប់កញ្ចប់' : 'All Plans' },
                { id: 'PLAN_1', label: 'Basic ($2.50)' },
                { id: 'PLAN_2', label: 'Pro + AI ($4.50)' },
                { id: 'PLAN_3', label: 'VIP ($6.00)' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setPlanFilter(tab.id)}
                  style={{
                    background: planFilter === tab.id ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'transparent',
                    color: planFilter === tab.id ? '#ffffff' : '#94A3B8',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 600 }}>
            {isKhmer ? 'បង្ហាញ' : 'Showing'} <strong style={{ color: '#ffffff' }}>{filtered.length}</strong> {isKhmer ? 'នៃ' : 'of'} <strong style={{ color: '#ffffff' }}>{sellers.length}</strong> {isKhmer ? 'អ្នកលក់' : 'sellers'}
          </div>
        </div>

        {/* Table */}
        <div className="admin-table-wrapper" style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(30, 41, 59, 0.85)' }}>
                <th style={{ color: '#94A3B8', padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.06em' }}>{isKhmer ? 'ហាង' : 'STORE'}</th>
                <th style={{ color: '#94A3B8', padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.06em' }}>{isKhmer ? 'ម្ចាស់ហាង' : 'OWNER'}</th>
                <th style={{ color: '#94A3B8', padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.06em' }}>{isKhmer ? 'អ៊ីមែល' : 'EMAIL'}</th>
                <th style={{ color: '#94A3B8', padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.06em' }}>{isKhmer ? 'កញ្ចប់សមាជិក' : 'MEMBERSHIP PLAN'}</th>
                <th style={{ color: '#94A3B8', padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.06em' }}>{isKhmer ? 'ស្ថានភាព' : 'STATUS'}</th>
                <th style={{ color: '#94A3B8', padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.06em' }}>{isKhmer ? 'សមតុល្យ' : 'BALANCE'}</th>
                <th style={{ color: '#94A3B8', padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.06em' }}>{isKhmer ? 'ផលិតផល' : 'PRODUCTS'}</th>
                <th style={{ color: '#94A3B8', padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.06em' }}>{isKhmer ? 'ផុតកំណត់' : 'EXPIRES'}</th>
                <th style={{ color: '#94A3B8', padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.06em' }}>{isKhmer ? 'សកម្មភាព' : 'ACTIONS'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>Loading sellers data...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 0 }}>
                    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                        <MdStorefront size={28} color="#818CF8" />
                      </div>
                      <h3 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px 0' }}>No Seller Accounts Found</h3>
                      <p style={{ color: '#94A3B8', fontSize: '0.88rem', margin: 0 }}>
                        There are currently no registered seller accounts matching your filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(s => {
                const sellerUserId = s.userId || s.id;
                const isActive = s.subscriptionStatus === 'ACTIVE';

                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {s.storeLogoUrl
                          ? <img src={s.storeLogoUrl} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover' }} />
                          : <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MdStorefront size={16} color="#818CF8" /></div>
                        }
                        <div>
                          <div style={{ fontWeight: 700, color: '#ffffff' }}>{s.storeName || '—'}</div>
                          {s.duplicateWarning && (
                            <div style={{ marginTop: 4 }}>
                              <DuplicateBadge daysRemaining={s.duplicateDaysRemaining} isKhmer={isKhmer} />
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', color: '#CBD5E1' }}>{s.ownerName || '—'}</td>
                    <td style={{ padding: '14px 20px', color: '#94A3B8', fontSize: '0.85rem' }}>{s.email}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 10,
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        background: s.subscriptionPlan === 'PLAN_3' ? 'rgba(139, 92, 246, 0.2)' : s.subscriptionPlan === 'PLAN_2' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                        border: `1px solid ${s.subscriptionPlan === 'PLAN_3' ? '#8B5CF6' : s.subscriptionPlan === 'PLAN_2' ? '#EC4899' : '#6366F1'}60`,
                        color: s.subscriptionPlan === 'PLAN_3' ? '#C084FC' : s.subscriptionPlan === 'PLAN_2' ? '#F472B6' : '#818CF8'
                      }}>
                        {s.subscriptionPlan === 'PLAN_3' ? 'VIP ($6.00)' : s.subscriptionPlan === 'PLAN_2' ? 'Pro ($4.50)' : 'Basic ($2.50)'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}><StatusBadge status={s.subscriptionStatus} /></td>
                    <td style={{ padding: '14px 20px', color: '#34D399', fontWeight: 800 }}>${(s.balance || 0).toFixed(2)}</td>
                    <td style={{ padding: '14px 20px', color: '#ffffff', fontWeight: 700 }}>{s.productCount ?? '—'}</td>
                    <td style={{ padding: '14px 20px', color: '#94A3B8', fontSize: '0.82rem' }}>
                      {s.subscriptionExpiresAt ? new Date(s.subscriptionExpiresAt).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {/* Restrict / Activate Toggle Button */}
                        <button
                          onClick={() => setConfirmModal({
                            sellerId: sellerUserId,
                            storeName: s.storeName || s.email,
                            currentStatus: s.subscriptionStatus,
                            newStatus: isActive ? 'EXPIRED' : 'ACTIVE'
                          })}
                          disabled={actionLoading === sellerUserId}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 8,
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            border: isActive ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(16, 185, 129, 0.5)',
                            background: isActive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: isActive ? '#f87171' : '#34d399',
                            transition: 'all 0.2s'
                          }}
                          title={isActive ? 'Restrict store from displaying products' : 'Activate store'}
                        >
                          {isActive ? <FiSlash size={13} /> : <FiCheckCircle size={13} />}
                          {isActive ? 'Restrict' : 'Activate'}
                        </button>

                        {/* Edit Balance (+ / - / SET) Button */}
                        <button
                          onClick={() => {
                            setBalanceModal({
                              sellerId: s.id,
                              userId: sellerUserId,
                              storeName: s.storeName || s.email,
                              currentBalance: s.balance || 0
                            });
                            setBalanceAmount('');
                            setBalanceMode('ADD');
                            setBalanceReason('');
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 8,
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#34D399',
                            transition: 'all 0.2s'
                          }}
                          title="Add (+), Deduct (-), or Set seller balance"
                        >
                          <FiDollarSign size={13} /> Edit Balance
                        </button>

                        {/* Edit Expiry Date Button */}
                        <button
                          onClick={() => {
                            setExpiryModal({
                              sellerId: s.id,
                              userId: sellerUserId,
                              storeName: s.storeName,
                              currentExpiry: s.subscriptionExpiresAt
                            });
                            setCustomDays(30);
                            setCustomDate('');
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 8,
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            border: '1px solid rgba(129, 140, 248, 0.4)',
                            background: 'rgba(99, 102, 241, 0.15)',
                            color: '#818CF8',
                            transition: 'all 0.2s'
                          }}
                          title="Change subscription expiration date or days"
                        >
                          <FiCalendar size={13} /> Edit Expiry
                        </button>

                        {/* Delete / Ban Scammed Store Button */}
                        <button
                          onClick={() => {
                            setDeleteModal({
                              sellerId: s.id,
                              userId: sellerUserId,
                              storeName: s.storeName || s.email,
                              ownerName: s.ownerName || s.email
                            });
                          }}
                          disabled={actionLoading === sellerUserId}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 8,
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            border: '1px solid rgba(239, 68, 68, 0.6)',
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#F87171',
                            transition: 'all 0.2s'
                          }}
                          title="Delete store & ban seller if scammed users"
                        >
                          <FiTrash2 size={13} /> Delete Store (លុបហាង)
                        </button>

                        {/* View Store External Link */}
                        <a href={`/store/${sellerUserId}`} target="_blank" rel="noreferrer"
                          style={{ color: '#94A3B8', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.80rem', fontWeight: 600, padding: '4px 6px' }}>
                          <FiExternalLink size={13} />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/*  Custom Status Confirmation Modal  */}
      {confirmModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: 20
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
            border: confirmModal.newStatus === 'EXPIRED' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 22,
            padding: 30,
            maxWidth: 440,
            width: '100%',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)',
            textAlign: 'center'
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              background: confirmModal.newStatus === 'EXPIRED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              border: confirmModal.newStatus === 'EXPIRED' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              {confirmModal.newStatus === 'EXPIRED'
                ? <FiSlash size={32} color="#f87171" />
                : <FiCheckCircle size={32} color="#34d399" />
              }
            </div>

            <h3 style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: 800, margin: '0 0 8px' }}>
              {confirmModal.newStatus === 'EXPIRED'
                ? 'Restrict Seller Store? (ផ្អាកហាង)'
                : 'Activate Seller Store? (បើកហាង)'
              }
            </h3>

            <p style={{ color: '#94A3B8', fontSize: '0.88rem', margin: '0 0 24px', lineHeight: 1.5 }}>
              {confirmModal.newStatus === 'EXPIRED'
                ? `Are you sure you want to restrict store "${confirmModal.storeName}"? All products of this store will be hidden from buyers.`
                : `Are you sure you want to activate store "${confirmModal.storeName}"? Store access will be restored.`
              }
            </p>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12,
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'transparent', color: '#94A3B8',
                  fontWeight: 700, cursor: 'pointer'
                }}
              >
                Cancel (បោះបង់)
              </button>
              <button
                type="button"
                onClick={() => executeToggleStatus(confirmModal.sellerId, confirmModal.newStatus)}
                disabled={actionLoading === confirmModal.sellerId}
                style={{
                  flex: 1.2, padding: '12px', borderRadius: 12, border: 'none',
                  background: confirmModal.newStatus === 'EXPIRED'
                    ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                    : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#ffffff', fontWeight: 800, cursor: 'pointer',
                  boxShadow: confirmModal.newStatus === 'EXPIRED'
                    ? '0 4px 14px rgba(239, 68, 68, 0.4)'
                    : '0 4px 14px rgba(16, 185, 129, 0.4)'
                }}
              >
                {confirmModal.newStatus === 'EXPIRED' ? 'Restrict Store' : 'Activate Store'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/*  Edit Seller Balance Modal (+ / - / SET)  */}
      {balanceModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: 20
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 22,
            padding: 28,
            maxWidth: 480,
            width: '100%',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34D399' }}>
                  <FiDollarSign size={22} />
                </div>
                <div>
                  <h3 style={{ color: '#ffffff', margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Adjust Seller Balance</h3>
                  <p style={{ color: '#94A3B8', margin: '2px 0 0 0', fontSize: '0.82rem' }}>{balanceModal.storeName}</p>
                </div>
              </div>
              <button
                onClick={() => setBalanceModal(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Current Balance Notice */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 12,
              padding: '14px 16px',
              marginBottom: 20,
              fontSize: '0.88rem',
              color: '#CBD5E1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>Current Available Balance:</span>
              <strong style={{ color: '#34D399', fontSize: '1.1rem', fontWeight: 900 }}>
                ${(balanceModal.currentBalance || 0).toFixed(2)}
              </strong>
            </div>

            {/* Action Mode Tabs */}
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#818CF8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              SELECT ADJUSTMENT MODE (ជ្រើសរើសរបៀបកែប្រែ)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
              {[
                { key: 'ADD', label: ' Add (+)', icon: <FiPlusCircle size={14} />, color: '#10B981', bg: 'rgba(16, 185, 129, 0.2)' },
                { key: 'DEDUCT', label: ' Deduct (-)', icon: <FiMinusCircle size={14} />, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.2)' },
                { key: 'SET', label: ' Set Exact (=)', icon: <FiEdit3 size={14} />, color: '#818CF8', bg: 'rgba(99, 102, 241, 0.2)' },
              ].map(mode => (
                <button
                  key={mode.key}
                  type="button"
                  onClick={() => setBalanceMode(mode.key)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 12,
                    border: balanceMode === mode.key ? `2px solid ${mode.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                    background: balanceMode === mode.key ? mode.bg : 'rgba(30, 41, 59, 0.6)',
                    color: mode.color,
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4
                  }}
                >
                  {mode.icon} {mode.label}
                </button>
              ))}
            </div>

            {/* Amount Input */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#818CF8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                {balanceMode === 'ADD' ? 'Amount to Add ($)' : (balanceMode === 'DEDUCT' ? 'Amount to Deduct ($)' : 'New Total Balance ($)')} *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter amount (e.g. 10.00)"
                value={balanceAmount}
                onChange={e => setBalanceAmount(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(124, 58, 237, 0.4)',
                  borderRadius: 12,
                  color: '#ffffff',
                  fontSize: '1rem',
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Reason Input */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#818CF8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Reason / Remark (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Bonus, Fee correction, Manual payout adjustment..."
                value={balanceReason}
                onChange={e => setBalanceReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 12,
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Calculation Preview */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 24,
              fontSize: '0.85rem',
              color: '#34D399',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Calculated New Balance:</span>
              <strong style={{ fontSize: '1.15rem', fontWeight: 900 }}>
                ${(() => {
                  const current = balanceModal.currentBalance || 0;
                  const amt = parseFloat(balanceAmount) || 0;
                  if (balanceMode === 'ADD') return (current + amt).toFixed(2);
                  if (balanceMode === 'DEDUCT') return Math.max(0, current - amt).toFixed(2);
                  return Math.max(0, amt).toFixed(2);
                })()}
              </strong>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setBalanceModal(null)}
                style={{
                  padding: '10px 18px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'transparent',
                  color: '#94A3B8',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBalance}
                disabled={actionLoading}
                style={{
                  padding: '10px 22px',
                  borderRadius: 10,
                  border: 'none',
                  background: balanceMode === 'DEDUCT'
                    ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                    : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                }}
              >
                Save Balance
              </button>
            </div>
          </div>
        </div>
      )}

      {/*  Edit Expiration Modal  */}
      {expiryModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
            border: '1px solid rgba(124, 58, 237, 0.4)',
            borderRadius: 20,
            padding: 28,
            maxWidth: 480,
            width: '100%',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818CF8' }}>
                  <FiCalendar size={20} />
                </div>
                <div>
                  <h3 style={{ color: '#ffffff', margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Change Store Expiry</h3>
                  <p style={{ color: '#94A3B8', margin: '2px 0 0 0', fontSize: '0.82rem' }}>{expiryModal.storeName}</p>
                </div>
              </div>
              <button
                onClick={() => setExpiryModal(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Current Expiry Notice */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 20,
              fontSize: '0.85rem',
              color: '#CBD5E1'
            }}>
              Current Expiration: <strong style={{ color: '#34D399' }}>
                {expiryModal.currentExpiry ? new Date(expiryModal.currentExpiry).toLocaleString() : 'Not Set'}
              </strong>
            </div>

            {/* Quick Presets */}
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#818CF8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              QUICK PRESETS (បន្ថែមថ្ងៃ)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
              {[
                { label: '+7 Days', days: 7 },
                { label: '+30 Days', days: 30 },
                { label: '+90 Days', days: 90 },
                { label: '+365 Days', days: 365 },
                { label: 'Expire Now', days: -1 },
              ].map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setCustomDays(p.days);
                    setCustomDate('');
                  }}
                  style={{
                    padding: '10px',
                    borderRadius: 10,
                    border: customDays === p.days && !customDate ? '2px solid #818CF8' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: customDays === p.days && !customDate ? 'rgba(99, 102, 241, 0.25)' : 'rgba(30, 41, 59, 0.6)',
                    color: p.days < 0 ? '#f87171' : '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Specific Date Input */}
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#818CF8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              OR SET SPECIFIC DATE (ជ្រើសរើសថ្ងៃច្បាស់លាស់)
            </label>
            <input
              type="date"
              value={customDate}
              onChange={e => {
                setCustomDate(e.target.value);
                setCustomDays(null);
              }}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(124, 58, 237, 0.4)',
                borderRadius: 12,
                color: '#ffffff',
                fontSize: '0.9rem',
                outline: 'none',
                marginBottom: 24,
                boxSizing: 'border-box'
              }}
            />

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setExpiryModal(null)}
                style={{
                  padding: '10px 18px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'transparent',
                  color: '#94A3B8',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveExpiration}
                disabled={actionLoading}
                style={{
                  padding: '10px 22px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/*  Delete / Ban Scammed Seller Store Modal  */}
      {deleteModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: '#0f172a', border: '1px solid #dc2626', borderRadius: 24,
            padding: 28, maxWidth: 460, width: '100%', color: '#f8fafc',
            boxShadow: '0 20px 50px rgba(220, 38, 38, 0.35)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 46, height: 46, borderRadius: '50%', background: 'rgba(220,38,38,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ef4444', flexShrink: 0
              }}>
                <FiTrash2 size={24} color="#f87171" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#f87171' }}>
                  Delete Seller Store (លុបហាងស្គែម)
                </h3>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                  Store: <strong>{deleteModal.storeName}</strong>
                </span>
              </div>
            </div>

            <div style={{
              background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 14, padding: 14, marginBottom: 20, fontSize: '0.84rem', color: '#fca5a5', lineHeight: 1.5
            }}>
              <strong>WARNING:</strong> This action will permanently remove the store profile <strong>"{deleteModal.storeName}"</strong>, unlist all products listed by this seller, and demote the user back to a regular USER. Use this if the seller scammed users or violated platform policies.
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12, border: '1px solid #334155',
                  background: '#1e293b', color: '#94a3b8', fontWeight: 700, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteSeller}
                disabled={actionLoading === (deleteModal.userId || deleteModal.sellerId)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#ffffff',
                  fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 14px rgba(220,38,38,0.4)'
                }}
              >
                {actionLoading === (deleteModal.userId || deleteModal.sellerId) ? 'Deleting...' : 'Confirm Delete Store'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
