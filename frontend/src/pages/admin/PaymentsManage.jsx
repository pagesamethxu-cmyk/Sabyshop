import React, { useState, useEffect } from 'react';
import { admin as adminApi, orders as ordersApi, payments as paymentsApi } from '../../api/client';
import toast from 'react-hot-toast';
import {
  FiCreditCard, FiCheckCircle, FiClock, FiXCircle,
  FiRefreshCw, FiSearch, FiDollarSign, FiArrowUpRight,
  FiExternalLink, FiEye, FiShield, FiPercent
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export default function PaymentsManage() {
  const { isKhmer } = useLanguage();
  const [activeSection, setActiveSection] = useState('PAYMENTS'); // 'PAYMENTS', 'COMMISSIONS', 'REFUNDS'
  const [payments, setPayments] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const [payRes, commRes, refRes] = await Promise.allSettled([
        paymentsApi.getAll(),
        paymentsApi.getAdminCommissions(),
        paymentsApi.getAdminRefunds()
      ]);
      if (payRes.status === 'fulfilled') {
        const list = Array.isArray(payRes.value.data) ? payRes.value.data : (payRes.value.data?.data || []);
        setPayments(list);
      }
      if (commRes.status === 'fulfilled') {
        const clist = Array.isArray(commRes.value.data) ? commRes.value.data : (commRes.value.value || commRes.value.data?.data || []);
        setCommissions(clist);
      }
      if (refRes.status === 'fulfilled') {
        const rlist = Array.isArray(refRes.value.data) ? refRes.value.data : (refRes.value.data?.data || []);
        setRefunds(rlist);
      }
    } catch (err) {
      console.error('Error fetching payments data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const totalVolume = payments
    .filter(p => p.paymentStatus === 'SUCCESSFUL')
    .reduce((sum, p) => sum + Number(p.totalAmount || 0), 0);

  const successCount = payments.filter(p => p.paymentStatus === 'SUCCESSFUL').length;
  const pendingCount = payments.filter(p => p.paymentStatus === 'PENDING').length;
  const failedCount = payments.filter(p => p.paymentStatus === 'FAILED').length;
  const refundCount = payments.filter(p => p.paymentStatus === 'REFUNDED').length;

  const filteredPayments = payments.filter(p => {
    const matchSearch = String(p.orderId).includes(search) ||
                        (p.customerEmail || '').toLowerCase().includes(search.toLowerCase()) ||
                        (p.customerName || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || p.paymentStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-hero">
        <div>
          <h1>
            <FiCreditCard color="#10B981" /> {isKhmer ? 'ប្រតិបត្តិការទូទាត់ប្រាក់' : 'Payment Transactions'}
          </h1>
          <p>{isKhmer ? 'តាមដានកំណត់ហេតុប្រតិបត្តិការទូទាត់ ABA KHQR PayWay, Escrow និងការទូទាត់' : 'Monitor ABA KHQR PayWay live transaction logs, escrow, and settlements'}</p>
        </div>
        <button className="admin-btn secondary" onClick={fetchPayments} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiRefreshCw className={loading ? 'spin' : ''} /> {isKhmer ? 'ផ្ទុកឡើងវិញ' : 'Refresh'}
        </button>
      </div>


      {/* Top Section Nav Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {[
          { key: 'PAYMENTS', label: isKhmer ? 'ប្រតិបត្តិការទូទាត់ (Payments)' : 'Payment Transactions (Table 23)', icon: FiCreditCard },
          { key: 'COMMISSIONS', label: isKhmer ? 'កម្រៃវេទិកា (Commissions)' : 'Platform Commission Cut (Table 32)', icon: FiPercent },
          { key: 'REFUNDS', label: isKhmer ? 'សងប្រាក់ត្រឡប់ (Refunds)' : 'Escrow Refunds (Table 30)', icon: FiShield },
        ].map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveSection(t.key)}
            style={{
              padding: '10px 18px',
              borderRadius: 12,
              background: activeSection === t.key ? 'rgba(16,185,129,0.15)' : 'var(--admin-card-bg)',
              color: activeSection === t.key ? '#10B981' : 'var(--admin-text-secondary)',
              border: activeSection === t.key ? '2px solid #10B981' : '1px solid var(--admin-card-border)',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {activeSection === 'PAYMENTS' && (
        <>
          {/* Top Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 22 }}>
            <div className="admin-card" style={{ padding: 18, borderLeft: '4px solid #10B981' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', fontWeight: 700 }}>{isKhmer ? 'ទំហំទឹកប្រាក់ទូទាត់' : 'PROCESSED VOLUME'}</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#10B981', marginTop: 4 }}>${totalVolume.toFixed(2)}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: 2 }}>{successCount} {isKhmer ? 'ការទូទាត់ជោគជ័យ' : 'settled payments'}</div>
            </div>

            <div className="admin-card" style={{ padding: 18, borderLeft: '4px solid #F59E0B' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', fontWeight: 700 }}>{isKhmer ? 'កំពុងកាន់កាប់ ESCROW' : 'PENDING ESCROW'}</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#F59E0B', marginTop: 4 }}>{pendingCount}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: 2 }}>{isKhmer ? 'រង់ចាំការផ្ទៀងផ្ទាត់/បញ្ជាក់' : 'Awaiting verification/confirmation'}</div>
            </div>

            <div className="admin-card" style={{ padding: 18, borderLeft: '4px solid #6366F1' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', fontWeight: 700 }}>{isKhmer ? 'ប្រាក់សងត្រឡប់' : 'REFUNDS PROCESSED'}</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#818CF8', marginTop: 4 }}>{refundCount}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: 2 }}>{isKhmer ? 'សងត្រឡប់តាមរយៈការដោះស្រាយវិវាទ' : 'Returned via dispute resolution'}</div>
            </div>

            <div className="admin-card" style={{ padding: 18, borderLeft: '4px solid #EF4444' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', fontWeight: 700 }}>{isKhmer ? 'បរាជ័យ / បានបោះបង់' : 'FAILED / CANCELLED'}</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#EF4444', marginTop: 4 }}>{failedCount}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: 2 }}>{isKhmer ? 'ផុតកំណត់វគ្គ KHQR' : 'Expired KHQR sessions'}</div>
            </div>
          </div>

          {/* Filter Tabs and Search */}
          <div className="admin-card" style={{ padding: 16, marginBottom: 18 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 380 }}>
                <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
                <input
                  type="text"
                  placeholder={isKhmer ? 'ស្វែងរកតាមលេខកូដបញ្ជាទិញ ឈ្មោះ ឬអ៊ីមែល...' : 'Search by Order ID, customer name or email...'}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="admin-input"
                  style={{ paddingLeft: 36, width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['ALL', 'SUCCESSFUL', 'PENDING', 'FAILED', 'REFUNDED'].map(st => {
                  const label = st === 'ALL' ? (isKhmer ? 'ទាំងអស់' : 'ALL')
                    : st === 'SUCCESSFUL' ? (isKhmer ? 'ជោគជ័យ' : 'SUCCESSFUL')
                    : st === 'PENDING' ? (isKhmer ? 'រង់ចាំ' : 'PENDING')
                    : st === 'FAILED' ? (isKhmer ? 'បរាជ័យ' : 'FAILED')
                    : (isKhmer ? 'សងត្រឡប់' : 'REFUNDED');

                  return (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 18,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        border: '1px solid',
                        cursor: 'pointer',
                        background: statusFilter === st
                          ? (st === 'SUCCESSFUL' ? 'rgba(16,185,129,0.25)' : st === 'PENDING' ? 'rgba(245,158,11,0.25)' : st === 'FAILED' ? 'rgba(239,68,68,0.25)' : 'rgba(99,102,241,0.25)')
                          : 'transparent',
                        borderColor: statusFilter === st
                          ? (st === 'SUCCESSFUL' ? '#10B981' : st === 'PENDING' ? '#F59E0B' : st === 'FAILED' ? '#EF4444' : '#6366F1')
                          : 'rgba(255,255,255,0.1)',
                        color: statusFilter === st
                          ? (st === 'SUCCESSFUL' ? '#10B981' : st === 'PENDING' ? '#F59E0B' : st === 'FAILED' ? '#EF4444' : '#A5B4FC')
                          : 'var(--admin-text-muted)'
                      }}
                    >
                      {label} ({st === 'ALL' ? payments.length : payments.filter(p => p.paymentStatus === st).length})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Transactions Table (Table 23: payments) */}
      {activeSection === 'PAYMENTS' && (
        <div className="admin-card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>{isKhmer ? 'ការបញ្ជាទិញ / លេខយោង' : 'Order / Ref'}</th>
                <th>{isKhmer ? 'អតិថិជន' : 'Customer'}</th>
                <th>{isKhmer ? 'វិធីសាស្ត្រ' : 'Method'}</th>
                <th>{isKhmer ? 'ចំនួនទឹកប្រាក់' : 'Amount'}</th>
                <th>{isKhmer ? 'កាលបរិច្ឆេទ' : 'Date'}</th>
                <th>{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                <th style={{ textAlign: 'right', paddingRight: 20 }}>{isKhmer ? 'សកម្មភាព' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>
                    <FiRefreshCw className="spin" style={{ marginRight: 8 }} /> {isKhmer ? 'កំពុងផ្ទុកប្រតិបត្តិការ...' : 'Loading transactions...'}
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>
                    {isKhmer ? 'រកមិនឃើញប្រតិបត្តិការទូទាត់ប្រាក់ទេ។' : 'No payment transactions found.'}
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p, idx) => {
                  const isSuccess = p.paymentStatus === 'SUCCESSFUL';
                  const isPending = p.paymentStatus === 'PENDING';
                  const isRefund = p.paymentStatus === 'REFUNDED';
                  const isFailed = p.paymentStatus === 'FAILED';

                  return (
                    <tr key={idx}>
                      <td>
                        <div style={{ fontWeight: 800, color: '#FFF' }}>Order #{p.orderId}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>KHQR Session</div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 700, color: '#FFF', fontSize: '0.86rem' }}>{p.customerName || 'Customer'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>{p.customerEmail}</div>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38BDF8', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <FiCreditCard size={13} /> {p.paymentMethod || 'ABA KHQR'}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontWeight: 900, color: '#FFF', fontSize: '0.95rem' }}>
                          ${Number(p.totalAmount || 0).toFixed(2)}
                        </span>
                      </td>

                      <td style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
                        {p.createdAt ? new Date(p.createdAt).toLocaleString() : 'N/A'}
                      </td>

                      <td>
                        <span style={{
                          padding: '3px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 800,
                          background: isSuccess ? 'rgba(16, 185, 129, 0.15)' : isPending ? 'rgba(245, 158, 11, 0.15)' : isRefund ? 'rgba(99, 102, 241, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: isSuccess ? '#10B981' : isPending ? '#F59E0B' : isRefund ? '#A5B4FC' : '#EF4444',
                          border: `1px solid ${isSuccess ? 'rgba(16,185,129,0.3)' : isPending ? 'rgba(245,158,11,0.3)' : isRefund ? 'rgba(99,102,241,0.3)' : 'rgba(239,68,68,0.3)'}`
                        }}>
                          {p.paymentStatus}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right', paddingRight: 20 }}>
                        <Link
                          to={`/orders/${p.orderId}`}
                          className="admin-action-btn edit"
                          title="View Order Details"
                          style={{ color: '#8B5CF6', borderColor: 'rgba(139,92,246,0.3)' }}
                        >
                          <FiEye size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Commissions Cut Table (Table 32: seller_commissions) */}
      {activeSection === 'COMMISSIONS' && (
        <div className="admin-card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>{isKhmer ? 'Order ID' : 'Order ID'}</th>
                <th>{isKhmer ? 'អ្នកលក់' : 'Seller Store'}</th>
                <th>{isKhmer ? 'ចំណូលលក់ (Gross)' : 'Gross Amount'}</th>
                <th>{isKhmer ? 'កម្រៃវេទិកា (5% Cut)' : 'Platform Revenue'}</th>
                <th>{isKhmer ? 'ចំណូលសុទ្ធអ្នកលក់ (Net)' : 'Seller Net'}</th>
                <th>{isKhmer ? 'កាលបរិច្ឆេទ' : 'Date'}</th>
                <th>{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {commissions.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>
                    {isKhmer ? 'មិនទាន់មានកំណត់ត្រាកម្រៃជើងសារនៅឡើយទេ' : 'No commission records found.'}
                  </td>
                </tr>
              ) : (
                commissions.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 800 }}>#{c.order?.id || c.orderId || '—'}</td>
                    <td>{c.seller?.sellerProfile?.storeName || c.seller?.name || 'Seller'}</td>
                    <td style={{ fontWeight: 800 }}>${(c.grossAmount || 0).toFixed(2)}</td>
                    <td style={{ color: '#10B981', fontWeight: 900 }}>+${(c.commissionAmount || 0).toFixed(2)} ({c.commissionRate}%)</td>
                    <td style={{ color: '#38BDF8', fontWeight: 700 }}>${(c.sellerNetAmount || 0).toFixed(2)}</td>
                    <td style={{ fontSize: '0.78rem' }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</td>
                    <td><span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>{c.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Refunds Table (Table 30: order_refunds) */}
      {activeSection === 'REFUNDS' && (
        <div className="admin-card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>{isKhmer ? 'លេខបញ្ជាទិញ' : 'Order ID'}</th>
                <th>{isKhmer ? 'ចំនួនទឹកប្រាក់' : 'Refund Amount'}</th>
                <th>{isKhmer ? 'ប្រភេទសង' : 'Refund Type'}</th>
                <th>{isKhmer ? 'មូលហេតុ' : 'Reason'}</th>
                <th>{isKhmer ? 'កាលបរិច្ឆេទ' : 'Processed Date'}</th>
                <th>{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {refunds.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>
                    {isKhmer ? 'មិនទាន់មានកំណត់ត្រាសងប្រាក់ត្រឡប់នៅឡើយទេ' : 'No refund records found.'}
                  </td>
                </tr>
              ) : (
                refunds.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 800 }}>#{r.order?.id || r.orderId || '—'}</td>
                    <td style={{ fontWeight: 900, color: '#8B5CF6' }}>${(r.amount || 0).toFixed(2)}</td>
                    <td>{r.refundType}</td>
                    <td style={{ fontSize: '0.8rem' }}>{r.reason}</td>
                    <td style={{ fontSize: '0.78rem' }}>{r.processedAt ? new Date(r.processedAt).toLocaleString() : '—'}</td>
                    <td><span className="badge" style={{ background: 'rgba(139,92,246,0.15)', color: '#8B5CF6' }}>{r.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
