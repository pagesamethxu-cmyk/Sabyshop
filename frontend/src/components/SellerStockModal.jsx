import React, { useState, useEffect } from 'react';
import { FiX, FiPlus, FiDatabase, FiFileText, FiCheck, FiRefreshCw } from 'react-icons/fi';
import { seller as sellerApi } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';

export default function SellerStockModal({ product, onClose, onSuccess }) {
  const { isKhmer } = useLanguage();
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newStock, setNewStock] = useState('');
  const [stockNote, setStockNote] = useState('');

  const fetchStock = async () => {
    if (!product?.id) return;
    setLoading(true);
    try {
      const res = await sellerApi.getStock(product.id);
      const stockPayload = res?.data;
      const stockData = Array.isArray(stockPayload)
        ? stockPayload
        : (Array.isArray(stockPayload?.data) ? stockPayload.data : []);
      setStock(stockData);
    } catch (err) {
      console.error('Error fetching stock:', err);
      setStock([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, [product?.id]);

  const isInviteLinkType = product?.productType === 'INVITE_LINK' ||
    (product?.name && product.name.toLowerCase().includes('invite'));

  const handleAddStock = async (e) => {
    e.preventDefault();
    const lines = newStock.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const items = [];

    for (const line of lines) {
      let email = '';
      let pass = '';
      let lineNote = '';

      if (isInviteLinkType || line.startsWith('http://') || line.startsWith('https://') || line.startsWith('t.me/') || line.startsWith('discord.gg/')) {
        if (line.includes(',')) {
          const parts = line.split(',');
          email = parts[0].trim();
          lineNote = parts.slice(1).join(',').trim();
        } else if (line.includes('|')) {
          const parts = line.split('|');
          email = parts[0].trim();
          lineNote = parts.slice(1).join('|').trim();
        } else {
          email = line.trim();
        }
        pass = 'N/A';
      } else if (line.includes(':')) {
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
        pass = 'Pass123!';
      }

      if (email) {
        items.push({
          accountEmail: email,
          accountPassword: pass || 'N/A',
          note: lineNote || stockNote.trim() || (isInviteLinkType ? 'Invite Link - Click link to join' : 'Standard Digital Account - Instant delivery')
        });
      }
    }

    if (items.length === 0) {
      toast.error(isKhmer ? 'សូមបញ្ចូលយ៉ាងហោចណាស់មួយទិន្នន័យ' : 'Please enter at least one item');
      return;
    }

    setSubmitting(true);
    try {
      await sellerApi.addStock(product.id, items);
      toast.success(isKhmer ? `បានបន្ថែម ${items.length} គណនីទៅក្នុងស្តុកជោគជ័យ!` : `Added ${items.length} item(s) to stock!`);
      setNewStock('');
      setStockNote('');
      await fetchStock();
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err?.response?.data?.message || (isKhmer ? 'មិនអាចបន្ថែមស្តុកបានទេ' : 'Failed to add stock'));
    } finally {
      setSubmitting(false);
    }
  };

  const available = stock.filter(s => !s.sold).length;
  const sold = stock.filter(s => s.sold).length;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
      padding: 16
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: '780px', maxHeight: '90vh',
        background: '#FFFFFF', borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #E2E8F0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #F8FAFC 0%, #ECFDF5 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
            }}>
              <FiDatabase size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                {isKhmer ? 'គ្រប់គ្រងស្តុក:' : 'Manage Stock:'} {product?.name}
              </h3>
              <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                {isKhmer ? 'តម្លៃដើម:' : 'Base Price:'} <strong style={{ color: '#10B981' }}>${(product?.basePrice || product?.price || 0).toFixed(2)}</strong>
              </div>
            </div>
          </div>

          <button onClick={onClose} style={{
            background: '#F1F5F9', border: 'none', borderRadius: '50%',
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#64748B', cursor: 'pointer'
          }}>
            <FiX size={18} />
          </button>
        </div>

        {/* Body content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Stats Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 14, padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10B981' }}>{available}</div>
              <div style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 700, textTransform: 'uppercase' }}>
                {isKhmer ? 'ស្តុកនៅសល់' : 'Available Stock'}
              </div>
            </div>
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 14, padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#D97706' }}>{sold}</div>
              <div style={{ fontSize: '0.72rem', color: '#B45309', fontWeight: 700, textTransform: 'uppercase' }}>
                {isKhmer ? 'បានលក់ចេញ' : 'Sold Items'}
              </div>
            </div>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#334155' }}>{stock.length}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                {isKhmer ? 'ស្តុកសរុប' : 'Total In Stock'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            
            {/* Inventory List */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>
                  {isKhmer ? 'បញ្ជីស្តុកបច្ចុប្បន្ន' : 'Current Inventory'}
                </span>
                <button onClick={fetchStock} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FiRefreshCw size={12} /> {isKhmer ? 'ទាញយកឡើងវិញ' : 'Refresh'}
                </button>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748B', fontSize: '0.85rem' }}>
                  {isKhmer ? 'កំពុងផ្ទុកបញ្ជីស្តុក...' : 'Loading inventory...'}
                </div>
              ) : stock.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 12px', color: '#94A3B8' }}>
                  <FiDatabase size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{isKhmer ? 'មិនទាន់មានស្តុកនៅឡើយទេ' : 'No stock uploaded yet'}</div>
                  <div style={{ fontSize: '0.75rem', marginTop: 2 }}>{isKhmer ? 'ប្រើទម្រង់ខាងស្តាំដើម្បីបញ្ចូលទិន្នន័យគណនី។' : 'Use the form on the right to add credentials.'}</div>
                </div>
              ) : (
                <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
                  {stock.map(s => (
                    <div key={s.id} style={{
                      background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10,
                      padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8
                    }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {s.accountEmail}
                        </div>
                        {(s.note || s.userNote || s.label) && (
                          <div style={{ fontSize: '0.72rem', color: '#6366F1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <FiFileText size={11} /> {s.note || s.userNote || s.label}
                          </div>
                        )}
                      </div>
                      <span style={{
                        padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 800,
                        background: s.sold ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                        color: s.sold ? '#EF4444' : '#10B981', flexShrink: 0
                      }}>
                        {s.sold ? (isKhmer ? 'បានលក់' : 'Sold') : (isKhmer ? 'នៅសល់' : 'Available')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Stock Form */}
            <form onSubmit={handleAddStock} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: 4 }}>
                  {isInviteLinkType
                    ? (isKhmer ? 'បញ្ចូលតំណ LINK INVITE (មួយជួរមួយ) *' : 'ADD INVITE LINKS (ONE PER LINE) *')
                    : (isKhmer ? 'បញ្ចូលគណនី / KEYS (មួយជួរមួយ) *' : 'ADD ACCOUNTS / KEYS (ONE PER LINE) *')}
                </label>
                <div style={{ fontSize: '0.72rem', color: '#64748B', marginBottom: 6 }}>
                  {isInviteLinkType ? (
                    <>Format: <code style={{ background: '#E2E8F0', padding: '1px 5px', borderRadius: 4 }}>https://link.com, Note</code> {isKhmer ? 'ឬ URL ផ្ទាល់' : 'or just link URL'}</>
                  ) : (
                    <>Format: <code style={{ background: '#E2E8F0', padding: '1px 5px', borderRadius: 4 }}>email:password</code> {isKhmer ? 'ឬ Key' : 'or key string'}</>
                  )}
                </div>
                <textarea
                  rows="6"
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 12,
                    border: '1px solid #CBD5E1', fontFamily: 'monospace', fontSize: '0.82rem',
                    resize: 'vertical', background: '#FFFFFF', color: '#0F172A'
                  }}
                  placeholder={isInviteLinkType
                    ? "https://invite.link/group1\nhttps://invite.link/group2, Join with email"
                    : "account1@gmail.com:pass123\naccount2@gmail.com:pass456\nKEY-XXXX-YYYY-ZZZZ"
                  }
                  value={newStock}
                  onChange={e => setNewStock(e.target.value)}
                  required
                />
                <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 4 }}>
                  {newStock.trim() ? `${newStock.split('\n').filter(l => l.trim()).length} ${isKhmer ? 'ជួរត្រូវបានរកឃើញ' : 'line(s) detected'}` : ''}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: 4 }}>
                  {isKhmer ? 'ការណែនាំដល់អតិថិជន / កំណត់សម្គាល់ (មិនចាំបាច់)' : 'CUSTOMER INSTRUCTIONS / NOTE (OPTIONAL)'}
                </label>
                <input
                  type="text"
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 10,
                    border: '1px solid #CBD5E1', fontSize: '0.82rem', color: '#0F172A'
                  }}
                  placeholder={isInviteLinkType
                    ? (isKhmer ? "ឧ. ចុចតំណដើម្បីចូលរួម Family Group" : "e.g. Click link to join family group")
                    : (isKhmer ? "ឧ. Profile 1 - PIN 1234 ប្រគល់ជូនភ្លាមៗ" : "e.g. Profile 1 - PIN 1234, Instant auto-delivery")
                  }
                  value={stockNote}
                  onChange={e => setStockNote(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  marginTop: 'auto', background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: '#FFFFFF', border: 'none', borderRadius: 12, padding: '11px',
                  fontWeight: 800, fontSize: '0.88rem', cursor: submitting ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                }}
              >
                <FiPlus size={16} /> {submitting
                  ? (isKhmer ? 'កំពុងបញ្ចូលស្តុក...' : 'Uploading Stock...')
                  : isInviteLinkType
                  ? (isKhmer ? 'បញ្ចូលតំណ Invite ទៅក្នុងស្តុក' : 'Add Invite Links to Stock')
                  : (isKhmer ? 'បញ្ចូលគណនីទៅក្នុងស្តុក' : 'Add Accounts to Stock')}
              </button>
            </form>

          </div>
        </div>

      </div>
    </div>
  );
}
