import React, { useState, useEffect } from 'react';
import { admin as adminApi } from '../../api/client';
import { FiRefreshCw, FiCheck, FiX, FiDollarSign, FiClock, FiCheckCircle, FiTrendingUp } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

const StatusBadge = ({ status, isKhmer }) => {
  const map = {
    COMPLETED: { bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.2) 100%)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', shadow: '0 0 10px rgba(16, 185, 129, 0.3)', label: isKhmer ? 'បានបញ្ចប់' : 'COMPLETED' },
    REJECTED: { bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.2) 100%)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', shadow: '0 0 10px rgba(239, 68, 68, 0.3)', label: isKhmer ? 'បានបដិសេធ' : 'REJECTED' },
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

export default function WithdrawalsManage() {
 const { isKhmer } = useLanguage();
 const [withdrawals, setWithdrawals] = useState([]);
 const [loading, setLoading] = useState(true);
 const [pendingOnly, setPendingOnly] = useState(false);
 const [actionLoading, setActionLoading] = useState(null);
 const [noteModal, setNoteModal] = useState(null); // { id, action }
 const [note, setNote] = useState('');

 const [previewImage, setPreviewImage] = useState(null);

 const load = async () => {
 setLoading(true);
 try {
 const res = await adminApi.getAllWithdrawals(pendingOnly);
 const rawData = res.data ?? res;
 const list = Array.isArray(rawData) ? rawData : (rawData?.data && Array.isArray(rawData.data) ? rawData.data : []);
 setWithdrawals(list);
 } catch (err) {
 console.error('Failed to load withdrawals:', err);
 const msg = err?.response?.data?.message || err?.message || 'Failed to load withdrawals';
 toast.error(msg);
 }
 finally { setLoading(false); }
 };

 useEffect(() => { load(); }, [pendingOnly]);

 const handleAction = async () => {
 if (!noteModal) return;
 setActionLoading(noteModal.id);
 try {
 if (noteModal.action === 'complete') {
 await adminApi.completeWithdrawal(noteModal.id, note);
 toast.success('Withdrawal marked as completed');
 } else {
 await adminApi.rejectWithdrawal(noteModal.id, note);
 toast.success('Withdrawal rejected and balance refunded');
 }
 setNoteModal(null);
 setNote('');
 load();
 } catch (err) {
 toast.error(err?.response?.data?.message || (isKhmer ? 'សកម្មភាពបរាជ័យ' : 'Action failed'));
 } finally {
 setActionLoading(null);
 }
 };

 const pending = withdrawals.filter(w => w.status === 'PENDING');

 return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{isKhmer ? 'ការដកប្រាក់' : 'Withdrawals'}</h1>
          <p className="admin-page-subtitle">{isKhmer ? `សំណើរង់ចាំ ${pending.length}` : `${pending.length} pending request${pending.length !== 1 ? 's' : ''}`}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className={`admin-btn ${pendingOnly ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
            onClick={() => setPendingOnly(p => !p)}
            id="withdrawals-filter-pending"
          >
            {pendingOnly ? (isKhmer ? 'សំណើរង់ចាំតែប៉ុណ្ណោះ' : 'Pending Only') : (isKhmer ? 'បង្ហាញទាំងអស់' : 'Show All')}
          </button>
          <button className="admin-btn admin-btn-primary" onClick={load} id="withdrawals-refresh">
            <FiRefreshCw size={15} /> {isKhmer ? 'ផ្ទុកឡើងវិញ' : 'Refresh'}
          </button>
        </div>
      </div>

      {/*  Stat Cards Grid (Matching Admin Dashboard Glassmorphism Cards)  */}
      <div className="admin-stats-grid" style={{ marginBottom: 24 }}>
        {[
          {
            title: isKhmer ? 'ការដកប្រាក់រង់ចាំ' : 'PENDING WITHDRAWALS',
            color: 'green',
            icon: <FiClock />,
            value: `$${withdrawals.filter(w => w.status === 'PENDING').reduce((s, w) => s + (w.amount || 0), 0).toFixed(2)}`,
            change: isKhmer ? `${pending.length} សំណើ` : `${pending.length} Requests`,
            up: pending.length > 0,
            bars: [30, 50, 45, 65, 60, 80, 75, 90],
          },
          {
            title: isKhmer ? 'ប្រាក់បានទូទាត់សរុប' : 'TOTAL PAID OUT',
            color: 'blue',
            icon: <FiDollarSign />,
            value: `$${withdrawals.filter(w => w.status === 'COMPLETED').reduce((s, w) => s + (w.amount || 0), 0).toFixed(2)}`,
            change: isKhmer ? 'ទូទាត់រួចរាល់' : 'Completed Payouts',
            up: true,
            bars: [40, 60, 55, 75, 70, 90, 85, 95],
          },
          {
            title: isKhmer ? 'ចំនួនដកប្រាក់ជោគជ័យ' : 'COMPLETED PAYOUTS',
            color: 'purple',
            icon: <FiCheckCircle />,
            value: withdrawals.filter(w => w.status === 'COMPLETED').length,
            change: isKhmer ? 'ផ្ទេរប្រាក់ជោគជ័យ' : 'Successful Transfers',
            up: true,
            bars: [25, 40, 35, 55, 50, 70, 65, 80],
          },
          {
            title: isKhmer ? 'សំណើសរុប' : 'TOTAL REQUESTS',
            color: 'pink',
            icon: <FiTrendingUp />,
            value: withdrawals.length,
            change: isKhmer ? 'សំណើទាំងអស់' : 'All Submissions',
            up: true,
            bars: [20, 35, 45, 60, 55, 75, 70, 85],
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#818CF8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {isKhmer ? 'កំណត់ហេតុសំណើដកប្រាក់របស់អ្នកលក់' : 'SELLER WITHDRAWAL REQUEST LOGS'}
          </span>
          <div style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 600 }}>
            {isKhmer ? 'បង្ហាញ' : 'Showing'} <strong style={{ color: '#ffffff' }}>{withdrawals.length}</strong> {isKhmer ? 'កំណត់ត្រាដកប្រាក់' : 'withdrawal records'}
          </div>
        </div>

        {/* Table */}
        <div className="admin-table-wrapper" style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(30, 41, 59, 0.85)' }}>
                <th style={{ color: '#94A3B8', padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.06em' }}>#</th>
                <th style={{ color: '#94A3B8', padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.06em' }}>{isKhmer ? 'អ្នកលក់' : 'SELLER'}</th>
                <th style={{ color: '#94A3B8', padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.06em' }}>{isKhmer ? 'ចំនួនទឹកប្រាក់' : 'AMOUNT'}</th>
                <th style={{ color: '#94A3B8', padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.06em' }}>KHQR</th>
                <th style={{ color: '#94A3B8', padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.06em' }}>{isKhmer ? 'ស្ថានភាព' : 'STATUS'}</th>
                <th style={{ color: '#94A3B8', padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.06em' }}>{isKhmer ? 'កាលបរិច្ឆេទស្នើសុំ' : 'REQUESTED'}</th>
                <th style={{ color: '#94A3B8', padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.06em' }}>{isKhmer ? 'ចំណាំ ADMIN' : 'ADMIN NOTE'}</th>
                <th style={{ color: '#94A3B8', padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.06em' }}>{isKhmer ? 'សកម្មភាព' : 'ACTIONS'}</th>
              </tr>
            </thead>
 <tbody>
 {loading ? (
 <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>{isKhmer ? 'កំពុងផ្ទុកសំណើដកប្រាក់...' : 'Loading withdrawal requests...'}</td></tr>
 ) : withdrawals.length === 0 ? (
 <tr>
 <td colSpan={8} style={{ padding: 0 }}>
 <div style={{ padding: '60px 20px', textAlign: 'center' }}>
 <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
 <FiDollarSign size={28} color="#10B981" />
 </div>
 <h3 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px 0' }}>No Withdrawal Requests Found</h3>
 <p style={{ color: '#94A3B8', fontSize: '0.88rem', margin: 0 }}>
 Sellers have not submitted any payout withdrawal requests yet.
 </p>
 </div>
 </td>
 </tr>
 ) : withdrawals.map(w => (
 <tr key={w.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
 <td style={{ padding: '14px 20px', color: '#94A3B8', fontWeight: 600 }}>#{w.id}</td>
 <td style={{ padding: '14px 20px' }}>
 <div style={{ fontWeight: 700, color: '#ffffff' }}>{w.sellerName || '—'}</div>
 <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{w.sellerEmail}</div>
 </td>
 <td style={{ padding: '14px 20px', color: '#34D399', fontWeight: 800, fontSize: '1.05rem' }}>${(w.amount || 0).toFixed(2)}</td>
 <td style={{ padding: '14px 20px' }}>
 <div style={{ maxWidth: 220, display: 'flex', flexDirection: 'column', gap: 6 }}>
 {w.khqrImageUrl && (
 <div 
 onClick={() => setPreviewImage(w.khqrImageUrl)}
 style={{
 cursor: 'pointer',
 width: 64,
 height: 64,
 borderRadius: 8,
 overflow: 'hidden',
 border: '1px solid rgba(129, 140, 248, 0.4)',
 background: '#0f172a',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
 }}
 title="Click to view QR Code picture"
 >
 <img src={w.khqrImageUrl} alt="KHQR Code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
 </div>
 )}
 {w.khqrString && (
 <div>
 <code style={{ fontSize: '0.72rem', color: '#CBD5E1', wordBreak: 'break-all', whiteSpace: 'pre-wrap', background: 'rgba(30, 41, 59, 0.8)', padding: '4px 6px', borderRadius: 6, display: 'block', border: '1px solid rgba(255,255,255,0.08)' }}>
 {w.khqrString?.slice(0, 50)}{w.khqrString?.length > 50 ? '...' : ''}
 </code>
 <button onClick={() => { navigator.clipboard.writeText(w.khqrString); toast.success('KHQR string copied!'); }}
 style={{ fontSize: '0.75rem', color: '#818CF8', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0 0 0', fontWeight: 700 }}
 id={`copy-khqr-${w.id}`}>
 Copy String
 </button>
 </div>
 )}
 </div>
 </td>
 <td style={{ padding: '14px 20px' }}><StatusBadge status={w.status} /></td>
 <td style={{ padding: '14px 20px', color: '#94A3B8', fontSize: '0.82rem' }}>
 {w.requestedAt ? new Date(w.requestedAt).toLocaleString() : '—'}
 </td>
 <td style={{ padding: '14px 20px', color: '#94A3B8', fontSize: '0.82rem', maxWidth: 160 }}>
 {w.adminNote || '—'}
 </td>
 <td style={{ padding: '14px 20px' }}>
 {w.status === 'PENDING' && (
 <div style={{ display: 'flex', gap: 6 }}>
 <button
 className="admin-btn admin-btn-success"
 onClick={() => { setNoteModal({ id: w.id, action: 'complete' }); setNote(''); }}
 disabled={actionLoading === w.id}
 style={{ fontSize: '0.78rem', padding: '6px 12px', gap: 4, display: 'flex', alignItems: 'center', borderRadius: 8 }}
 id={`complete-withdraw-${w.id}`}
 >
 <FiCheck size={12} /> Complete
 </button>
 <button
 className="admin-btn admin-btn-danger"
 onClick={() => { setNoteModal({ id: w.id, action: 'reject' }); setNote(''); }}
 disabled={actionLoading === w.id}
 style={{ fontSize: '0.78rem', padding: '6px 12px', gap: 4, display: 'flex', alignItems: 'center', borderRadius: 8 }}
 id={`reject-withdraw-${w.id}`}
 >
 <FiX size={12} /> Reject
 </button>
 </div>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 {/* Action confirmation modal */}
 {noteModal && (
 <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
 <div style={{ background: 'var(--admin-card)', borderRadius: 16, border: '1px solid var(--admin-border)', maxWidth: 400, width: '100%', padding: 24 }}>
 <h3 style={{ margin: '0 0 16px', color: 'var(--admin-text)', fontWeight: 700 }}>
 {noteModal.action === 'complete' ? ' Mark as Completed' : ' Reject Withdrawal'}
 </h3>
 <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
 {noteModal.action === 'complete'
 ? 'Confirm you have sent the payment to the seller\'s KHQR.'
 : 'Balance will be refunded to the seller automatically.'}
 </p>
 <textarea
 placeholder="Admin note (optional)..."
 value={note}
 onChange={e => setNote(e.target.value)}
 rows={3}
 style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--admin-border)', background: 'var(--admin-bg)', color: 'var(--admin-text)', fontSize: '0.88rem', resize: 'vertical', boxSizing: 'border-box', marginBottom: 16 }}
 id="withdraw-action-note"
 />
 <div style={{ display: 'flex', gap: 10 }}>
 <button className="admin-btn admin-btn-ghost" onClick={() => setNoteModal(null)} style={{ flex: 1 }} id="withdraw-action-cancel">Cancel</button>
 <button
 className={`admin-btn ${noteModal.action === 'complete' ? 'admin-btn-success' : 'admin-btn-danger'}`}
 onClick={handleAction}
 disabled={!!actionLoading}
 style={{ flex: 2 }}
 id="withdraw-action-confirm"
 >
 {actionLoading ? 'Processing...' : noteModal.action === 'complete' ? 'Confirm Completed' : 'Confirm Rejection'}
 </button>
 </div>
 </div>
 </div>
 )}

 {/* KHQR Image Preview Modal */}
 {previewImage && (
 <div 
 onClick={() => setPreviewImage(null)}
 style={{
 position: 'fixed', inset: 0, zIndex: 10000,
 background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
 display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
 }}
 >
 <div style={{ position: 'relative', maxWidth: 450, width: '100%', background: '#0f172a', padding: 20, borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)', textAlign: 'center' }}>
 <button 
 onClick={() => setPreviewImage(null)}
 style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', color: '#ffffff', fontSize: '1.4rem', cursor: 'pointer' }}
 >
 
 </button>
 <h4 style={{ color: '#ffffff', margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 700 }}>Seller KHQR Code Picture</h4>
 <img src={previewImage} alt="KHQR Full Code" style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 12 }} />
 <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: 12, margin: '12px 0 0 0' }}>Scan with Bakong or any mobile banking app to send payout</p>
 </div>
 </div>
 )}
 </div>
 );
}
