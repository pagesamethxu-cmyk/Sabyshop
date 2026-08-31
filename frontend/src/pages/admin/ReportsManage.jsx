import React, { useState } from 'react';
import { admin as adminApi, products as productsApi } from '../../api/client';
import toast from 'react-hot-toast';
import {
  FiFileText, FiDownload, FiAlertTriangle, FiCheckCircle,
  FiRefreshCw, FiTrendingUp, FiDollarSign, FiShoppingBag,
  FiUsers, FiShield, FiExternalLink, FiSearch, FiStar, FiFilter, FiCheck
} from 'react-icons/fi';
import { MdStorefront } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export default function ReportsManage() {
  const { isKhmer } = useLanguage();
  const [exportingType, setExportingType] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'UNDER_REVIEW' | 'RESOLVED'

  const [reportedProducts, setReportedProducts] = useState([
    {
      id: 1,
      productId: 1,
      productName: 'Netflix Premium 1 Month',
      sellerStoreName: 'Alex Premium Digital',
      reasonKm: 'គ្មានការធានា ឬអ្នកលក់បដិសេធការធានា',
      reasonEn: 'No warranty provided / Seller refused warranty',
      starRating: 1,
      reporterEmail: 'buyer1@gmail.com',
      description: 'Account worked for only 2 days then password was reset. Seller refused to replace.',
      reportedAt: '2026-08-16T10:15:00',
      status: 'UNDER_REVIEW'
    },
    {
      id: 2,
      productId: 2,
      productName: 'Spotify Premium 1 Month',
      sellerStoreName: 'StreamHub',
      reasonKm: 'គណនីផុតកំណត់មុនពេលផុតកំណត់ការធានា',
      reasonEn: 'Account expired before warranty ended',
      starRating: 2,
      reporterEmail: 'sokha99@gmail.com',
      description: 'Spotify family plan was cancelled by family owner within 1 week.',
      reportedAt: '2026-08-15T16:40:00',
      status: 'RESOLVED'
    }
  ]);

  const handleExport = async (type) => {
    setExportingType(type);
    const toastId = toast.loading(isKhmer ? `កំពុងបង្កើតរបាយការណ៍ ${type}...` : `Generating ${type} report...`);
    try {
      let filename = `${type.toLowerCase()}_report_${Date.now()}.csv`;
      let csvContent = '';

      if (type === 'ORDERS') {
        const res = await adminApi.getAllOrders();
        const orders = Array.isArray(res.data) ? res.data : [];
        csvContent = 'Order ID,Customer,Total Amount,Status,Date\n' +
          orders.map(o => `${o.id},"${o.customerEmail}",${o.totalAmount},${o.status},"${o.createdAt}"`).join('\n');
      } else if (type === 'SELLERS') {
        const res = await adminApi.getAllSellers();
        const sellers = Array.isArray(res.data) ? res.data : [];
        csvContent = 'Seller ID,Store Name,Email,Balance,Status,Products\n' +
          sellers.map(s => `${s.id},"${s.storeName}","${s.email}",${s.balance},${s.status},${s.productCount || 0}`).join('\n');
      } else {
        const res = await productsApi.getAll();
        const prods = Array.isArray(res.data) ? res.data : [];
        csvContent = 'Product ID,Name,Price,Stock,Category,Seller\n' +
          prods.map(p => `${p.id},"${p.name}",${p.price},${p.stockCount},"${p.category?.name || ''}","${p.sellerStoreName || 'Admin'}"`).join('\n');
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(isKhmer ? `ទាញយករបាយការណ៍ ${type} ជោគជ័យ!` : `${type} report exported successfully!`, { id: toastId });
    } catch (err) {
      toast.error(isKhmer ? 'ការទាញយករបាយការណ៍បរាជ័យ' : 'Failed to generate export', { id: toastId });
    } finally {
      setExportingType(null);
    }
  };

  const filteredReports = reportedProducts.filter(rp => {
    const reasonText = (isKhmer ? rp.reasonKm : rp.reasonEn) || '';
    const matchesSearch = (rp.productName || '').toLowerCase().includes(search.toLowerCase()) ||
      (rp.sellerStoreName || '').toLowerCase().includes(search.toLowerCase()) ||
      (rp.reporterEmail || '').toLowerCase().includes(search.toLowerCase()) ||
      reasonText.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter !== 'ALL' && rp.status !== statusFilter) return false;
    return true;
  });

  const toggleReportStatus = (id) => {
    setReportedProducts(prev => prev.map(r => {
      if (r.id === id) {
        const nextStatus = r.status === 'UNDER_REVIEW' ? 'RESOLVED' : 'UNDER_REVIEW';
        toast.success(isKhmer 
          ? `ស្ថានភាពបានប្តូរទៅជា: ${nextStatus === 'RESOLVED' ? 'បានដោះស្រាយ' : 'កំពុងត្រួតពិនិត្យ'}`
          : `Status changed to: ${nextStatus}`);
        return { ...r, status: nextStatus };
      }
      return r;
    }));
  };

  return (
    <div className="admin-animate-in">
      {/*  Page Header  */}
      <div className="admin-page-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiFileText color="#3B82F6" /> {isKhmer ? 'មជ្ឈមណ្ឌលរបាយការណ៍ & គុណភាពប្រព័ន្ធ' : 'Platform Reports & Quality Center'}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--admin-text-secondary)', marginTop: 4 }}>
            {isKhmer 
              ? 'តាមដានការរាយការណ៍បញ្ហាផលិតផលពីអតិថិជន ការបំពានការធានា និងទាញយកទិន្នន័យ Audit'
              : 'Monitor customer product flags, warranty violations, and export system audit data'}
          </div>
        </div>
      </div>

      {/*  Quick Export Cards  */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 28 }}>
        
        {/* Card 1: Orders & Revenue */}
        <div className="admin-card admin-glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '3px solid #3B82F6' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: '#FFF' }}>
                {isKhmer ? 'ការបញ្ជាទិញ & ចំណូល' : 'Orders & Revenue'}
              </span>
              <span style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
                <FiShoppingBag size={18} />
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', lineHeight: 1.5, margin: '0 0 18px 0' }}>
              {isKhmer 
                ? 'ទិន្នន័យលម្អិតអំពីការទិញរបស់អតិថិជន ស្ថានភាព Escrow និងប្រតិបត្តិការទូទាត់ប្រាក់ ABA KHQR។'
                : 'Full breakdown of customer purchases, escrow states, and ABA KHQR transactions.'}
            </p>
          </div>
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => handleExport('ORDERS')}
            disabled={exportingType === 'ORDERS'}
            style={{ width: '100%', fontSize: '0.85rem', fontWeight: 800, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', color: '#fff', border: 'none', boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)', cursor: 'pointer' }}
          >
            <FiDownload className={exportingType === 'ORDERS' ? 'spin' : ''} size={15} />
            {exportingType === 'ORDERS' ? (isKhmer ? 'កំពុងទាញយក...' : 'Exporting...') : (isKhmer ? 'ទាញយក Orders CSV' : 'Export Orders CSV')}
          </button>
        </div>

        {/* Card 2: Sellers & Payouts */}
        <div className="admin-card admin-glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '3px solid #10B981' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: '#FFF' }}>
                {isKhmer ? 'អ្នកលក់ & ការទូទាត់ប្រាក់' : 'Sellers & Payouts'}
              </span>
              <span style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                <FiUsers size={18} />
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', lineHeight: 1.5, margin: '0 0 18px 0' }}>
              {isKhmer 
                ? 'សមតុល្យអ្នកលក់ដែលបានផ្ទៀងផ្ទាត់ ទំហំនៃការលក់ ស្ថានភាពហាង និងឯកសារបញ្ជាក់ KYC។'
                : 'Audited seller balances, sales volumes, store statuses, and KYC verifications.'}
            </p>
          </div>
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => handleExport('SELLERS')}
            disabled={exportingType === 'SELLERS'}
            style={{ width: '100%', fontSize: '0.85rem', fontWeight: 800, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#fff', border: 'none', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)', cursor: 'pointer' }}
          >
            <FiDownload className={exportingType === 'SELLERS' ? 'spin' : ''} size={15} />
            {exportingType === 'SELLERS' ? (isKhmer ? 'កំពុងទាញយក...' : 'Exporting...') : (isKhmer ? 'ទាញយក Sellers CSV' : 'Export Sellers CSV')}
          </button>
        </div>

        {/* Card 3: Product Inventory */}
        <div className="admin-card admin-glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '3px solid #8B5CF6' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: '#FFF' }}>
                {isKhmer ? 'ស្តុកផលិតផលក្នុងប្រព័ន្ធ' : 'Product Inventory'}
              </span>
              <span style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6' }}>
                <FiFileText size={18} />
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', lineHeight: 1.5, margin: '0 0 18px 0' }}>
              {isKhmer 
                ? 'កាតាឡុកទំនិញសកម្មទាំងអស់ ចំនួនស្តុកក្នុងដៃ ប្រភេទផលិតផល និងការកំណត់តម្លៃ។'
                : 'Active merchandise catalog, stock quantities, and pricing configuration.'}
            </p>
          </div>
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => handleExport('PRODUCTS')}
            disabled={exportingType === 'PRODUCTS'}
            style={{ width: '100%', fontSize: '0.85rem', fontWeight: 800, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', color: '#fff', border: 'none', boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)', cursor: 'pointer' }}
          >
            <FiDownload className={exportingType === 'PRODUCTS' ? 'spin' : ''} size={15} />
            {exportingType === 'PRODUCTS' ? (isKhmer ? 'កំពុងទាញយក...' : 'Exporting...') : (isKhmer ? 'ទាញយក Products CSV' : 'Export Products CSV')}
          </button>
        </div>
      </div>

      {/*  Filters & Search Bar  */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 16, marginBottom: 18
      }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{
            display: 'flex', gap: 4, background: 'rgba(30, 41, 59, 0.6)',
            padding: 4, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <button
              onClick={() => setStatusFilter('ALL')}
              style={{
                padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700, borderRadius: 8,
                background: statusFilter === 'ALL' ? 'var(--admin-primary)' : 'transparent',
                color: statusFilter === 'ALL' ? '#fff' : 'var(--admin-text-secondary)', border: 'none', cursor: 'pointer'
              }}
            >
              {isKhmer ? 'ទាំងអស់' : 'All'} ({reportedProducts.length})
            </button>
            <button
              onClick={() => setStatusFilter('UNDER_REVIEW')}
              style={{
                padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700, borderRadius: 8,
                background: statusFilter === 'UNDER_REVIEW' ? '#EF4444' : 'transparent',
                color: statusFilter === 'UNDER_REVIEW' ? '#fff' : 'var(--admin-text-secondary)', border: 'none', cursor: 'pointer'
              }}
            >
              <FiAlertTriangle size={12} style={{ marginRight: 4 }} /> {isKhmer ? 'កំពុងពិនិត្យ' : 'Under Review'}
            </button>
            <button
              onClick={() => setStatusFilter('RESOLVED')}
              style={{
                padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700, borderRadius: 8,
                background: statusFilter === 'RESOLVED' ? '#10B981' : 'transparent',
                color: statusFilter === 'RESOLVED' ? '#fff' : 'var(--admin-text-secondary)', border: 'none', cursor: 'pointer'
              }}
            >
              <FiCheckCircle size={12} style={{ marginRight: 4 }} /> {isKhmer ? 'បានដោះស្រាយ' : 'Resolved'}
            </button>
          </div>
        </div>

        <div style={{ position: 'relative', width: 300 }}>
          <FiSearch style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
          <input
            type="text"
            className="input"
            placeholder={isKhmer ? 'ស្វែងរកតាមឈ្មោះផលិតផល, ហាង...' : 'Search product, store, reason...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', paddingLeft: 40, paddingRight: 14, height: 40,
              background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 12, color: '#fff', fontSize: '0.85rem'
            }}
          />
        </div>
      </div>

      {/*  Reported Products Table  */}
      <div className="admin-card admin-glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiAlertTriangle color="#EF4444" /> {isKhmer ? 'ផលិតផលដែលអតិថិជនរាយការណ៍ (ការធានា & គុណភាព)' : 'Customer Reported Products (Warranty & Defects)'}
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.76rem', color: 'var(--admin-text-muted)' }}>
              {isKhmer 
                ? 'របាយការណ៍ផ្ទាល់ដែលបានផ្ញើដោយអតិថិជនដែលបានវាយតម្លៃផ្កាយ 1 ឬ 2 ដោយសារបញ្ហាការធានា'
                : 'Direct flags submitted by customers rating 1 or 2 stars due to warranty failure'}
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>{isKhmer ? 'ផលិតផល' : 'PRODUCT'}</th>
                <th>{isKhmer ? 'ហាងអ្នកលក់' : 'SELLER'}</th>
                <th>{isKhmer ? 'មូលហេតុនៃការរាយការណ៍' : 'REPORT REASON'}</th>
                <th>{isKhmer ? 'ពិន្ទុ' : 'RATING'}</th>
                <th>{isKhmer ? 'កំណត់សម្គាល់អតិថិជន' : 'CUSTOMER NOTES'}</th>
                <th>{isKhmer ? 'ស្ថានភាព' : 'STATUS'}</th>
                <th>{isKhmer ? 'កាលបរិច្ឆេទ' : 'DATE'}</th>
                <th style={{ textAlign: 'right', paddingRight: 20 }}>{isKhmer ? 'សកម្មភាព' : 'ACTION'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                    {isKhmer ? 'មិនមានរបាយការណ៍ផលិតផលទេ' : 'No reported products found'}
                  </td>
                </tr>
              ) : (
                filteredReports.map(rp => (
                  <tr key={rp.id}>
                    <td>
                      <div style={{ fontWeight: 800, color: '#FFF', fontSize: '0.9rem' }}>{rp.productName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>ID #{rp.productId}</div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#38BDF8', fontWeight: 700, fontSize: '0.84rem' }}>
                        <MdStorefront size={15} />
                        {rp.sellerStoreName}
                      </div>
                    </td>

                    <td>
                      <span style={{ color: '#F87171', fontWeight: 700, fontSize: '0.82rem' }}>
                        {isKhmer ? rp.reasonKm : rp.reasonEn}
                      </span>
                    </td>

                    <td>
                      <span style={{ padding: '3px 9px', borderRadius: 6, background: rp.starRating === 1 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: rp.starRating === 1 ? '#EF4444' : '#F59E0B', fontWeight: 800, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <FiStar size={12} fill="currentColor" /> {rp.starRating}
                      </span>
                    </td>

                    <td style={{ maxWidth: 220 }}>
                      <div style={{ fontSize: '0.78rem', color: '#E2E8F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={rp.description}>
                        {rp.description}
                      </div>
                    </td>

                    <td>
                      <button
                        type="button"
                        onClick={() => toggleReportStatus(rp.id)}
                        className={`admin-badge ${rp.status === 'RESOLVED' ? 'completed' : 'cancelled'}`}
                        style={{ fontSize: '0.72rem', padding: '3px 8px', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        title={isKhmer ? 'ចុចដើម្បីប្តូរស្ថានភាព' : 'Click to toggle status'}
                      >
                        {rp.status === 'RESOLVED' ? <FiCheck size={11} /> : <FiAlertTriangle size={11} />}
                        {rp.status === 'RESOLVED' ? (isKhmer ? 'បានដោះស្រាយ' : 'RESOLVED') : (isKhmer ? 'កំពុងពិនិត្យ' : 'UNDER REVIEW')}
                      </button>
                    </td>

                    <td style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
                      {new Date(rp.reportedAt).toLocaleDateString()}
                    </td>

                    <td style={{ textAlign: 'right', paddingRight: 20 }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <Link
                          to={`/product/${rp.productId}`}
                          target="_blank"
                          className="admin-action-btn edit"
                          title={isKhmer ? 'ពិនិត្យទំព័រផលិតផល' : 'Inspect Product Page'}
                          style={{ color: '#38BDF8', borderColor: 'rgba(56,189,248,0.3)', width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'rgba(56,189,248,0.1)' }}
                        >
                          <FiExternalLink size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
