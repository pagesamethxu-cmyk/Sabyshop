import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiDatabase, FiFileText } from 'react-icons/fi';
import { admin as adminApi, products as productsApi } from '../../api/client';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

const StockManage = () => {
  const { isKhmer } = useLanguage();
  const { id } = useParams();
  const [stock, setStock] = useState([]);
  const [productName, setProductName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newStock, setNewStock] = useState('');
  const [stockNote, setStockNote] = useState('');

  const [resolvedProductId, setResolvedProductId] = useState(id);

  const fetchStock = async () => {
    let targetId = id;
    setLoading(true);

    if (!targetId || targetId === 'undefined') {
      try {
        const prodsRes = await productsApi.getAll();
        const prods = Array.isArray(prodsRes.data) ? prodsRes.data : (prodsRes.data?.data || []);
        if (prods.length > 0) {
          targetId = prods[0].id;
          setResolvedProductId(targetId);
        }
      } catch (e) {}
    } else {
      setResolvedProductId(id);
    }

    if (!targetId || targetId === 'undefined') {
      setLoading(false);
      return;
    }

    try {
      const [prodRes, stockRes] = await Promise.allSettled([
        productsApi.getById(targetId),
        adminApi.getStock(targetId),
      ]);

      if (prodRes.status === 'fulfilled') {
        const prod = prodRes.value?.data?.data || prodRes.value?.data || prodRes.value;
        setProductName(prod?.name || prod?.productName || '');
      }

      if (stockRes.status === 'fulfilled') {
        const stockPayload = stockRes.value?.data;
        const stockData = Array.isArray(stockPayload)
          ? stockPayload
          : (Array.isArray(stockPayload?.data) ? stockPayload.data : []);
        setStock(stockData);
      } else {
        setStock([]);
      }
    } catch (err) {
      console.error("Error loading stock details", err);
      setStock([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStock(); }, [id]);

  const handleAddStock = async (e) => {
    e.preventDefault();
    const lines = newStock.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const items = [];

    for (const line of lines) {
      let email = "";
      let pass = "";
      if (line.includes(':')) {
        const parts = line.split(':');
        email = parts[0].trim();
        pass = parts.slice(1).join(':').trim();
      } else if (line.includes('|')) {
        const parts = line.split('|');
        email = parts[0].trim();
        pass = parts.slice(1).join('|').trim();
      } else if (line.includes(' ')) {
        const parts = line.split(/\s+/);
        email = parts[0].trim();
        pass = parts.slice(1).join(' ').trim();
      } else {
        email = line.trim();
        pass = "Pass123!";
      }

      if (email) {
        items.push({
          accountEmail: email,
          accountPassword: pass || "Pass123!",
          note: stockNote.trim() || 'Standard Digital Account - Instant 0-second delivery'
        });
      }
    }

    if (items.length === 0) { toast.error('Please enter at least one item'); return; }

    setSubmitting(true);
    const targetId = resolvedProductId || id || 1;
    try {
      await adminApi.addStock(targetId, items);
      toast.success(`Added ${items.length} stock item(s) to Database!`);
      setNewStock('');
      setStockNote('');
      fetchStock();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add stock'); }
    finally { setSubmitting(false); }
  };

  const available = stock.filter(s => !s.sold).length;
  const sold = stock.filter(s => s.sold).length;

  if (loading && stock.length === 0) {
    return <div className="admin-loading"><div className="admin-spinner" /></div>;
  }

  return (
    <div className="admin-animate-in">
      <Link to="/admin/products" className="admin-back-link">
        <FiArrowLeft size={15} /> {isKhmer ? 'ត្រឡប់ទៅបញ្ជីផលិតផល' : 'Back to Products'}
      </Link>

      <div className="admin-page-header" style={{ marginBottom: 24 }}>
        <div className="admin-page-title">
          <FiDatabase /> {isKhmer ? 'ស្តុក៖' : 'Stock:'} {productName || `${isKhmer ? 'ផលិតផលលេខ' : 'Product #'} ${id}`}
        </div>
        {/* Stats summary */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="admin-card" style={{ padding: '10px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 90 }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#6EE7B7' }}>{available}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isKhmer ? 'មានក្នុងស្តុក' : 'Available'}</span>
          </div>
          <div className="admin-card" style={{ padding: '10px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 90 }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FBBF24' }}>{sold}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isKhmer ? 'បានលក់' : 'Sold'}</span>
          </div>
          <div className="admin-card" style={{ padding: '10px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 90 }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{stock.length}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isKhmer ? 'សរុប' : 'Total'}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* Current Inventory */}
        <div className="admin-card" style={{ padding: 0 }}>
          <div className="admin-card-header">
            <span className="admin-card-title">{isKhmer ? 'ស្តុកបច្ចុប្បន្ន' : 'Current Inventory'}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>{stock.length} {isKhmer ? 'គណនី' : 'items'}</span>
          </div>
          <div style={{ maxHeight: 480, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stock.map(s => (
              <div key={s.id} className="admin-stock-item">
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span>{s.accountEmail}</span>
                    {(s.note || s.userNote || s.label) && (
                      <span style={{
                        background: 'rgba(167, 139, 250, 0.15)',
                        color: '#A78BFA',
                        border: '1px solid rgba(167, 139, 250, 0.3)',
                        borderRadius: '4px',
                        padding: '1px 6px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <FiFileText size={10} /> {isKhmer ? 'ចំណាំ' : 'Note'}: {s.note || s.userNote || s.label}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', fontFamily: 'monospace', marginTop: 2 }}>
                    {s.accountPassword ? ''.repeat(Math.min(s.accountPassword.length, 12)) : '—'}
                  </div>
                </div>
                <span className={`admin-badge ${s.sold ? 'pending' : 'completed'}`}>
                  {s.sold ? (isKhmer ? 'បានលក់' : 'Sold') : (isKhmer ? 'មានក្នុងស្តុក' : 'Available')}
                </span>
              </div>
            ))}
            {stock.length === 0 && (
              <div className="admin-empty">
                <FiDatabase />
                <p>{isKhmer ? 'មិនទាន់មានគណនីក្នុងស្តុកនៅឡើយទេ។ សូមបន្ថែមតាមទម្រង់ខាងស្តាំ!' : 'No accounts in stock. Add some using the form!'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Add Stock */}
        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-title"><FiPlus size={16} /> {isKhmer ? 'បន្ថែមស្តុកថ្មី' : 'Add New Stock'}</span>
          </div>
          <div className="admin-card-body">
            <form onSubmit={handleAddStock} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="admin-form-label">
                  {isKhmer ? 'ទម្រង់៖' : 'Format:'} <code style={{ background: 'rgba(108,99,255,0.12)', color: 'var(--admin-accent)', padding: '2px 6px', borderRadius: 4, fontSize: '0.8rem' }}>email:password</code> ({isKhmer ? 'មួយជួរមួយគណនី' : 'one per line'})
                </label>
                <textarea
                  className="admin-textarea"
                  rows="8"
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem', minHeight: 160, resize: 'vertical', marginTop: 8 }}
                  placeholder={"user1@gmail.com:pass123\nuser2@gmail.com:pass456\nuser3@gmail.com:pass789"}
                  value={newStock}
                  onChange={e => setNewStock(e.target.value)}
                  required
                />
                <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                  {newStock.trim() ? `${newStock.split('\n').filter(l => l.trim()).length} ${isKhmer ? 'ជួរត្រូវបានរកឃើញ' : 'line(s) detected'}` : (isKhmer ? 'បិទភ្ជាប់ព័ត៌មានគណនីនៅទីនេះ' : 'Paste your credentials here')}
                </div>
              </div>

              {/* Note / Customer Instructions Input */}
              <div>
                <label className="admin-form-label" style={{ display: 'block', marginBottom: 6 }}>
                  {isKhmer ? 'ចំណាំ / ការណែនាំសម្រាប់អតិថិជន (មិនចាំបាច់)៖' : 'Note / Instructions for Customer (Optional):'}
                </label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ width: '100%', padding: '10px 14px', fontSize: '0.85rem' }}
                  placeholder={isKhmer ? 'ឧទាហរណ៍៖ Profile 1 - PIN 1234, សូមកុំផ្លាស់ប្តូរលេខសម្ងាត់...' : 'e.g. Profile 1 - PIN 1234, Do not change password...'}
                  value={stockNote}
                  onChange={e => setStockNote(e.target.value)}
                />
                <div style={{ marginTop: 4, fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>
                  {isKhmer ? 'ចំណាំនេះនឹងត្រូវបានផ្ញើជូនអតិថិជនរួមជាមួយអ៊ីមែល និងពាក្យសម្ងាត់។' : 'This Note will be delivered to customer along with Email and Password.'}
                </div>
              </div>

              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                style={{ width: '100%', padding: '12px' }}
                disabled={submitting}
              >
                <FiPlus size={15} /> {submitting ? (isKhmer ? 'កំពុងបញ្ចូល...' : 'Adding...') : (isKhmer ? 'បញ្ចូលគណនីទៅក្នុងស្តុក' : 'Add Accounts')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockManage;
