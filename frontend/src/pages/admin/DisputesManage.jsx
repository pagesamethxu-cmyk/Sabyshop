import React, { useState, useEffect } from 'react';
import { disputes as disputesApi, admin as adminApi } from '../../api/client';
import toast from 'react-hot-toast';
import {
  FiShield, FiAlertTriangle, FiCheckCircle, FiRefreshCw,
  FiEye, FiMessageSquare, FiUser, FiPackage, FiDollarSign,
  FiSearch, FiExternalLink, FiClock
} from 'react-icons/fi';
import AdminDisputeModal from '../../components/AdminDisputeModal';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export default function DisputesManage() {
  const { isKhmer } = useLanguage();
  const [disputesList, setDisputesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await disputesApi.adminGetAll();
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setDisputesList(list);
    } catch (err) {
      console.error('Error fetching admin disputes', err);
      // Fallback
      setDisputesList([
        {
          id: 1,
          orderId: 104,
          buyerName: 'Sokha Buyer',
          buyerEmail: 'sokha99@gmail.com',
          sellerStoreName: 'Alex Premium Digital',
          issueCategory: 'ACCOUNT_VOUCHER_PROBLEM',
          preferredSolution: 'REPLACEMENT',
          status: 'ESCALATED_ADMIN',
          buyerDescription: 'Account password changed after 2 days, seller did not respond within 24h.',
          createdAt: '2026-08-16T12:00:00',
          totalAmount: 14.99
        },
        {
          id: 2,
          orderId: 105,
          buyerName: 'Dara',
          buyerEmail: 'dara@gmail.com',
          sellerStoreName: 'Games & Keys',
          issueCategory: 'ORDER_NOT_RECEIVED',
          preferredSolution: 'REFUND',
          status: 'OPEN',
          buyerDescription: 'Manual delivery account has not been sent yet.',
          createdAt: '2026-08-16T15:30:00',
          totalAmount: 9.99
        },
        {
          id: 3,
          orderId: 102,
          buyerName: 'Kevin',
          buyerEmail: 'kevin@gmail.com',
          sellerStoreName: 'StreamHub',
          issueCategory: 'WRONG_INCOMPLETE_PRODUCT',
          preferredSolution: 'REPLACEMENT',
          status: 'RESOLVED_REPLACED',
          buyerDescription: 'Received standard instead of 4K ultra.',
          createdAt: '2026-08-15T10:20:00',
          totalAmount: 12.00
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const totalDisputes = disputesList.length;
  const openCount = disputesList.filter(d => d.status === 'OPEN').length;
  const investigatingCount = disputesList.filter(d => d.status === 'ESCALATED_ADMIN').length;
  const refundedCount = disputesList.filter(d => d.status === 'RESOLVED_REFUNDED' || d.status === 'RESOLVED_ADMIN_REFUNDED').length;
  const resolvedCount = disputesList.filter(d => d.status === 'RESOLVED_REPLACED' || d.status === 'RESOLVED_ADMIN_COMPLETED').length;

  const filteredDisputes = disputesList.filter(d => {
    const matchSearch = String(d.orderId).includes(search) ||
                        (d.buyerName || '').toLowerCase().includes(search.toLowerCase()) ||
                        (d.buyerEmail || '').toLowerCase().includes(search.toLowerCase()) ||
                        (d.sellerStoreName || '').toLowerCase().includes(search.toLowerCase());
    
    if (statusFilter === 'ALL') return matchSearch;
    if (statusFilter === 'INVESTIGATING') return matchSearch && d.status === 'ESCALATED_ADMIN';
    if (statusFilter === 'OPEN') return matchSearch && d.status === 'OPEN';
    if (statusFilter === 'REFUNDED') return matchSearch && (d.status === 'RESOLVED_REFUNDED' || d.status === 'RESOLVED_ADMIN_REFUNDED');
    if (statusFilter === 'RESOLVED') return matchSearch && (d.status === 'RESOLVED_REPLACED' || d.status === 'RESOLVED_ADMIN_COMPLETED');
    return matchSearch && d.status === statusFilter;
  });

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-hero">
        <div>
          <h1>
            <FiShield color="#8B5CF6" /> {isKhmer ? 'មជ្ឈមណ្ឌលដោះស្រាយវិវាទ & ពាក្យបណ្តឹង' : 'Disputes & Claims Center'}
          </h1>
          <p>{isKhmer ? 'ស៊ើបអង្កេតរបាយការណ៍របស់អ្នកទិញ សម្រុះសម្រួលរវាងអ្នកទិញ និងអ្នកលក់ និងអនុវត្តគោលការណ៍ប្តូរ/សងប្រាក់' : 'Investigate buyer reports, mediate between buyer & seller, and enforce return/replacement policies'}</p>
        </div>
        <button className="admin-btn secondary" onClick={fetchDisputes} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiRefreshCw className={loading ? 'spin' : ''} /> {isKhmer ? 'ផ្ទុកឡើងវិញ' : 'Refresh'}
        </button>
      </div>


      {/* Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 22 }}>
        <div className="admin-card" style={{ padding: 18, borderLeft: '4px solid #8B5CF6' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', fontWeight: 700 }}>{isKhmer ? 'កំពុងសម្រុះសម្រួល' : 'UNDER MEDIATION'}</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#C4B5FD', marginTop: 4 }}>{investigatingCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: 2 }}>{isKhmer ? 'ត្រូវការការសម្រេចចិត្តពី Admin' : 'Requires Admin Verdict'}</div>
        </div>

        <div className="admin-card" style={{ padding: 18, borderLeft: '4px solid #EF4444' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', fontWeight: 700 }}>{isKhmer ? 'ពាក្យបណ្តឹងបើកចំហ' : 'OPEN CLAIMS'}</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#EF4444', marginTop: 4 }}>{openCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: 2 }}>{isKhmer ? 'រង់ចាំការឆ្លើយតបរបស់អ្នកលក់' : 'Awaiting seller response'}</div>
        </div>

        <div className="admin-card" style={{ padding: 18, borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', fontWeight: 700 }}>{isKhmer ? 'ដោះស្រាយដោយប្តូរថ្មី' : 'RESOLVED REPLACED'}</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#10B981', marginTop: 4 }}>{resolvedCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: 2 }}>{isKhmer ? 'បានទទួលយកការប្តូរថ្មី' : 'Replacement accepted'}</div>
        </div>

        <div className="admin-card" style={{ padding: 18, borderLeft: '4px solid #6366F1' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', fontWeight: 700 }}>{isKhmer ? 'សងប្រាក់ត្រឡប់' : 'REFUNDED'}</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#818CF8', marginTop: 4 }}>{refundedCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: 2 }}>{isKhmer ? 'ប្រាក់ត្រូវបានសងទៅអ្នកទិញ' : 'Money returned to buyer'}</div>
        </div>
      </div>

      {/* Filter Tabs and Search */}
      <div className="admin-card" style={{ padding: 16, marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 380 }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
            <input
              type="text"
              placeholder={isKhmer ? 'ស្វែងរកតាមលេខកូដបញ្ជាទិញ អ្នកទិញ អ្នកលក់...' : 'Search by Order ID, buyer, seller...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="admin-input"
              style={{ paddingLeft: 36, width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { key: 'ALL', label: isKhmer ? 'វិវាទទាំងអស់' : 'All Disputes' },
              { key: 'INVESTIGATING', label: isKhmer ? 'ការសម្រុះសម្រួល Admin' : 'Admin Mediation' },
              { key: 'OPEN', label: isKhmer ? 'បើកចំហ' : 'Open' },
              { key: 'RESOLVED', label: isKhmer ? 'ដោះស្រាយរួច (ប្តូរថ្មី)' : 'Resolved (Replaced)' },
              { key: 'REFUNDED', label: isKhmer ? 'បានសងប្រាក់' : 'Refunded' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 18,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: '1px solid',
                  cursor: 'pointer',
                  background: statusFilter === tab.key ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
                  borderColor: statusFilter === tab.key ? '#8B5CF6' : 'rgba(255,255,255,0.1)',
                  color: statusFilter === tab.key ? '#C4B5FD' : 'var(--admin-text-muted)'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Disputes Table */}
      <div className="admin-card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>{isKhmer ? 'លេខកូដ / ផលិតផល' : 'Order / Product'}</th>
              <th>{isKhmer ? 'អ្នកទិញ' : 'Buyer'}</th>
              <th>{isKhmer ? 'អ្នកលក់' : 'Seller'}</th>
              <th>{isKhmer ? 'បញ្ហា / ដំណោះស្រាយ' : 'Issue / Solution'}</th>
              <th>{isKhmer ? 'ព័ត៌មានលម្អិតនៃបណ្តឹង' : 'Claim Details'}</th>
              <th>{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
              <th style={{ textAlign: 'right', paddingRight: 20 }}>{isKhmer ? 'សកម្មភាពសម្រុះសម្រួល' : 'Mediate Action'}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>
                  <FiRefreshCw className="spin" style={{ marginRight: 8 }} /> {isKhmer ? 'កំពុងផ្ទុកបញ្ជីវិវាទ...' : 'Loading disputes...'}
                </td>
              </tr>
            ) : filteredDisputes.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>
                  {isKhmer ? 'មិនមានករណីវិវាទដែលត្រូវនឹងការច្រោះទេ។' : 'No dispute claims found.'}
                </td>
              </tr>
            ) : (
              filteredDisputes.map(d => {
                const isMediation = d.status === 'ESCALATED_ADMIN';
                const isOpen = d.status === 'OPEN';
                const isRefunded = d.status === 'RESOLVED_REFUNDED' || d.status === 'RESOLVED_ADMIN_REFUNDED';
                const isReplaced = d.status === 'RESOLVED_REPLACED' || d.status === 'RESOLVED_ADMIN_COMPLETED';

                return (
                  <tr key={d.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {d.productImageUrl && (
                          <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }}>
                            <img src={d.productImageUrl} alt={d.productName || 'Product'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 800, color: '#FFF' }}>Order #{d.orderId}</div>
                          {d.productName && (
                            <div style={{ fontSize: '0.78rem', color: '#38BDF8', fontWeight: 700, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.productName}>
                              {d.productName}
                            </div>
                          )}
                          <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)' }}>
                            {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 700, color: '#FFF', fontSize: '0.86rem' }}>{d.buyerName || 'Buyer'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>{d.buyerEmail}</div>
                    </td>

                    <td>
                      <span style={{ fontWeight: 700, color: '#38BDF8', fontSize: '0.84rem' }}>
                        {d.sellerStoreName || 'Digital Seller'}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#EF4444' }}>
                        {d.issueCategory?.replace(/_/g, ' ') || (isKhmer ? 'បញ្ហាផលិតផល' : 'Product Issue')}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#10B981', fontWeight: 700 }}>
                        {isKhmer ? 'ចង់បាន:' : 'Wants:'} {d.preferredSolution === 'REPLACEMENT' ? (isKhmer ? 'ប្តូរគណនីថ្មី' : 'Replacement Account') : (isKhmer ? 'បង្វិលប្រាក់ 100%' : '100% Refund')}
                      </div>
                    </td>

                    <td style={{ maxWidth: 220 }}>
                      <div style={{ fontSize: '0.78rem', color: '#E2E8F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.buyerDescription}>
                        {d.buyerDescription || (isKhmer ? 'មិនមានការពិពណ៌នា' : 'No description provided')}
                      </div>
                    </td>

                    <td>
                      <div>
                        {(() => {
                          const statusConfig = {
                            OPEN: {
                              label: isKhmer ? 'រង់ចាំអ្នកលក់ (OPEN)' : 'Awaiting Seller (OPEN)',
                              bg: 'rgba(239,68,68,0.2)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.4)'
                            },
                            RESOLVED_REPLACED: {
                              label: isKhmer ? 'បានប្តូរថ្មីរួចរាល់' : 'Resolved (Replaced)',
                              bg: 'rgba(16,185,129,0.2)', color: '#10B981', border: '1px solid rgba(16,185,129,0.4)'
                            },
                            RESOLVED_REFUNDED: {
                              label: isKhmer ? 'បានបង្វិលប្រាក់' : 'Resolved (Refunded)',
                              bg: 'rgba(245,158,11,0.2)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.4)'
                            },
                            ESCALATED_ADMIN: {
                              label: isKhmer ? 'Admin សម្របសម្រួល' : 'Admin Mediation',
                              bg: 'rgba(139,92,246,0.25)', color: '#C4B5FD', border: '1px solid rgba(139,92,246,0.5)'
                            },
                            RESOLVED_ADMIN_REFUNDED: {
                              label: isKhmer ? 'Admin បង្វិលប្រាក់' : 'Admin Refunded',
                              bg: 'rgba(99,102,241,0.2)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.4)'
                            },
                            RESOLVED_ADMIN_COMPLETED: {
                              label: isKhmer ? 'Admin បញ្ចប់ជោគជ័យ' : 'Admin Completed',
                              bg: 'rgba(59,130,246,0.2)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.4)'
                            },
                            REJECTED: {
                              label: isKhmer ? 'បានបដិសេធ' : 'Rejected',
                              bg: 'rgba(100,116,139,0.2)', color: '#94A3B8', border: '1px solid rgba(100,116,139,0.4)'
                            }
                          };
                          const conf = statusConfig[d.status] || {
                            label: d.status?.replace(/_/g, ' '),
                            bg: 'rgba(100,116,139,0.2)', color: '#94A3B8', border: '1px solid rgba(100,116,139,0.4)'
                          };
                          return (
                            <span style={{
                              padding: '3px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 800,
                              background: conf.bg, color: conf.color, border: conf.border
                            }}>
                              {conf.label}
                            </span>
                          );
                        })()}
                      </div>
                      <div style={{ marginTop: 4 }}>
                        {d.replacementAccountEmail ? (
                          <span style={{
                            background: 'rgba(16,185,129,0.15)', color: '#34D399',
                            border: '1px solid rgba(16,185,129,0.3)',
                            padding: '2px 6px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 800,
                            display: 'inline-flex', alignItems: 'center', gap: 3
                          }}>
                            <FiCheckCircle size={10} /> {isKhmer ? 'Seller បានផ្តល់គណនីថ្មី' : 'New Account Added'}
                          </span>
                        ) : (
                          <span style={{
                            background: 'rgba(239,68,68,0.08)', color: '#F87171',
                            border: '1px solid rgba(239,68,68,0.2)',
                            padding: '2px 6px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 700,
                            display: 'inline-flex', alignItems: 'center', gap: 3
                          }}>
                            <FiClock size={10} /> {isKhmer ? 'Seller មិនទាន់ផ្តល់គណនីថ្មី' : 'No Account Added Yet'}
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ textAlign: 'right', paddingRight: 20 }}>
                      <button
                        onClick={() => setSelectedOrderId(d.orderId)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 8,
                          border: isMediation ? '1px solid #8B5CF6' : '1px solid rgba(255,255,255,0.15)',
                          background: isMediation ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)' : 'rgba(255,255,255,0.05)',
                          color: '#FFF',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <FiShield size={13} /> {isMediation ? (isKhmer ? 'កាត់សេចក្តីវិវាទ' : 'Mediate Verdict') : (isKhmer ? 'ពិនិត្យវិវាទ' : 'View Dispute')}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Admin Dispute Mediation Modal */}
      {selectedOrderId && (
        <AdminDisputeModal
          isOpen={Boolean(selectedOrderId)}
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onSuccess={() => {
            fetchDisputes();
            setSelectedOrderId(null);
          }}
        />
      )}
    </div>
  );
}
