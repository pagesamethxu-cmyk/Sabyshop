import React, { useState, useEffect } from 'react';
import { FiX, FiPlus, FiDatabase, FiCheckCircle, FiClock, FiFileText, FiAlertCircle } from 'react-icons/fi';
import { seller as sellerApi } from '../api/client';
import toast from 'react-hot-toast';

export default function SellerAddStockModal({ product, onClose, onSuccess }) {
  const [stockList, setStockList] = useState([]);
  const [loadingStock, setLoadingStock] = useState(true);
  const [newStockText, setNewStockText] = useState('');
  const [stockNote, setStockNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('add'); // 'add' | 'inventory'

  const fetchStock = async () => {
    if (!product?.id) return;
    setLoadingStock(true);
    try {
      const res = await sellerApi.getStock(product.id);
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setStockList(data);
    } catch (err) {
      console.error('Failed to load stock list', err);
      setStockList([]);
    } finally {
      setLoadingStock(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, [product?.id]);

  const handleAddStock = async (e) => {
    e.preventDefault();
    if (!newStockText.trim()) {
      toast.error('Please enter account credentials');
      return;
    }

    const lines = newStockText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const items = [];

    for (const line of lines) {
      let email = '';
      let pass = '';

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
        pass = 'Pass123!';
      }

      if (email) {
        items.push({
          accountEmail: email,
          accountPassword: pass || 'Pass123!',
          ...(stockNote.trim() ? { note: stockNote.trim() } : {})
        });
      }
    }

    if (items.length === 0) {
      toast.error('No valid credentials found. Use email:password format.');
      return;
    }

    setSubmitting(true);
    try {
      await sellerApi.addStock(product.id, items);
      toast.success(`Successfully added ${items.length} account(s) to stock!`);
      setNewStockText('');
      setStockNote('');
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add stock');
    } finally {
      setSubmitting(false);
    }
  };

  const availableCount = stockList.filter(s => !s.sold).length;
  const soldCount = stockList.filter(s => s.sold).length;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 24,
        width: '100%',
        maxWidth: 680,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        border: '1px solid #E2E8F0'
      }}>
        {/* Header - Clean layout with absolute top-right Close X button */}
        <div style={{
          padding: '18px 24px',
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0, paddingRight: 44 }}>
            {product?.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.4)', flexShrink: 0 }}
              />
            ) : (
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <FiDatabase size={22} color="#fff" />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Add & Manage Stock
              </h3>
              <div style={{ fontSize: '0.82rem', opacity: 0.95, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                {product?.name || 'Product Stock'} — ${(product?.price || 0).toFixed(2)}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              position: 'absolute',
              top: 18,
              right: 20,
              background: 'rgba(255, 255, 255, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              borderRadius: 10,
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
              transition: 'all 0.2s ease',
              zIndex: 10
            }}
          >
            <FiX size={20} />
          </button>
        </div>


        {/* Stock Stats Bar */}
        <div style={{
          background: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap'
        }}>
          <div style={{
            flex: '1 1 130px', background: '#FFFFFF', padding: '10px 14px', borderRadius: 12,
            border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 10
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>AVAILABLE</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10B981' }}>{availableCount}</div>
            </div>
          </div>

          <div style={{
            flex: '1 1 130px', background: '#FFFFFF', padding: '10px 14px', borderRadius: 12,
            border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 10
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>SOLD</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#D97706' }}>{soldCount}</div>
            </div>
          </div>

          <div style={{
            flex: '1 1 130px', background: '#FFFFFF', padding: '10px 14px', borderRadius: 12,
            border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 10
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#6366F1' }} />
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL ITEMS</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#4F46E5' }}>{stockList.length}</div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex', borderBottom: '1px solid #E2E8F0', padding: '0 24px', background: '#FFFFFF'
        }}>
          <button
            onClick={() => setActiveTab('add')}
            style={{
              padding: '12px 18px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'add' ? '3px solid #10B981' : '3px solid transparent',
              color: activeTab === 'add' ? '#10B981' : '#64748B',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <FiPlus size={16} /> Add New Accounts
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            style={{
              padding: '12px 18px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'inventory' ? '3px solid #10B981' : '3px solid transparent',
              color: activeTab === 'inventory' ? '#10B981' : '#64748B',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <FiDatabase size={16} /> Current Inventory ({stockList.length})
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {activeTab === 'add' ? (
            <form onSubmit={handleAddStock} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#334155',
                  display: 'block',
                  marginBottom: 6
                }}>
                  Enter Accounts Credentials (One item per line):
                </label>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#64748B',
                  marginBottom: 10,
                  background: '#F1F5F9',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                  lineHeight: 1.4
                }}>
                  Format: <code style={{ color: '#059669', fontWeight: 700 }}>email:password</code> or <code style={{ color: '#059669', fontWeight: 700 }}>email|password</code>
                </div>
                <textarea
                  rows="6"
                  placeholder={"user1@gmail.com:pass123\nuser2@gmail.com:pass456\nuser3@gmail.com:pass789"}
                  value={newStockText}
                  onChange={e => setNewStockText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    resize: 'vertical',
                    minHeight: 130,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
                <div style={{ marginTop: 6, fontSize: '0.78rem', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
                  <span>
                    {newStockText.trim()
                      ? `${newStockText.split('\n').filter(l => l.trim()).length} line(s) detected`
                      : 'Paste your login accounts here'}
                  </span>
                </div>
              </div>

              {/* Note / Customer Instructions Input */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Note / Instructions for Customer (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Profile 1 - PIN 1234, Do not change password..."
                  value={stockNote}
                  onChange={e => setStockNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 12,
                    border: 'none',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <FiPlus size={16} /> {submitting ? 'Adding Stock...' : 'Confirm & Add Stock'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '12px 20px',
                    borderRadius: 12,
                    border: '1px solid #CBD5E1',
                    background: '#F8FAFC',
                    color: '#475569',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div>
              {loadingStock ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748B' }}>
                  Loading stock items...
                </div>
              ) : stockList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
                  <FiDatabase size={36} style={{ opacity: 0.4, marginBottom: 8 }} />
                  <div style={{ fontWeight: 700 }}>No accounts in stock yet</div>
                  <div style={{ fontSize: '0.82rem', marginTop: 4 }}>Switch to "Add New Accounts" tab to import stock.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
                  {stockList.map(item => (
                    <div
                      key={item.id}
                      style={{
                        background: item.sold ? '#F8FAFC' : '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: 12,
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between',
                        gap: 12
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span>{item.accountEmail}</span>
                          {(item.note || item.userNote || item.label) && (
                            <span style={{
                              background: 'rgba(16, 185, 129, 0.12)',
                              color: '#059669',
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                              borderRadius: 6,
                              padding: '2px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}>
                              <FiFileText size={11} /> {item.note || item.userNote || item.label}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B', fontFamily: 'monospace', marginTop: 2 }}>
                          {item.accountPassword ? ''.repeat(Math.min(item.accountPassword.length, 12)) : '—'}
                        </div>
                      </div>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: item.sold ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                        color: item.sold ? '#D97706' : '#059669',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.sold ? 'Sold' : 'Available'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
