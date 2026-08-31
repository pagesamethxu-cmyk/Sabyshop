import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  FiTag, FiPlus, FiTrash2, FiCheck, FiX,
  FiPercent, FiDollarSign, FiCalendar, FiClock
} from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';
import ConfirmDeleteCouponModal from '../../components/ConfirmDeleteCouponModal';

export default function PromotionsManage() {
  const { isKhmer } = useLanguage();
  const [coupons, setCoupons] = useState([
    { id: 1, code: 'WELCOME10', discountType: 'PERCENT', discountValue: 10, minPurchase: 10.0, usageCount: 48, maxUses: 100, active: true, expiresAt: '2026-12-31' },
    { id: 2, code: 'SABY5', discountType: 'FIXED', discountValue: 5.0, minPurchase: 25.0, usageCount: 12, maxUses: 50, active: true, expiresAt: '2026-09-30' },
    { id: 3, code: 'FLASH20', discountType: 'PERCENT', discountValue: 20, minPurchase: 30.0, usageCount: 100, maxUses: 100, active: false, expiresAt: '2026-08-01' },
  ]);

  const [deleteConfirmCoupon, setDeleteConfirmCoupon] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState('PERCENT');
  const [newValue, setNewValue] = useState('');
  const [newMin, setNewMin] = useState('0');
  const [newMaxUses, setNewMaxUses] = useState('100');

  const handleCreateCoupon = (e) => {
    e.preventDefault();
    if (!newCode.trim() || !newValue) {
      return toast.error('Code and discount value are required');
    }

    const created = {
      id: Date.now(),
      code: newCode.trim().toUpperCase(),
      discountType: newType,
      discountValue: Number(newValue),
      minPurchase: Number(newMin || 0),
      usageCount: 0,
      maxUses: Number(newMaxUses || 100),
      active: true,
      expiresAt: '2026-12-31'
    };

    setCoupons(prev => [created, ...prev]);
    toast.success(`Coupon ${created.code} created!`);
    setShowCreateModal(false);
    setNewCode('');
    setNewValue('');
  };

  const handleToggle = (id) => {
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));
    toast.success('Coupon status updated');
  };

  const handleDelete = (coupon) => {
    setDeleteConfirmCoupon(coupon);
  };

  const confirmDeleteCoupon = () => {
    if (!deleteConfirmCoupon) return;
    setCoupons(prev => prev.filter(c => c.id !== deleteConfirmCoupon.id));
    toast.success(isKhmer ? `បានលុបកូដ ${deleteConfirmCoupon.code} ដោយជោគជ័យ!` : `Coupon "${deleteConfirmCoupon.code}" deleted successfully!`);
    setDeleteConfirmCoupon(null);
  };

  return (
    <div className="admin-page">
      <div className="admin-page-hero">
        <div>
          <h1>
            <FiTag color="#EC4899" /> {isKhmer ? 'ការផ្សព្វផ្សាយ & លេខកូដបញ្ចុះតម្លៃ' : 'Promotions & Voucher Codes'}
          </h1>
          <p>{isKhmer ? 'បង្កើតកូដប័ណ្ណបញ្ចុះតម្លៃ គ្រប់គ្រងការលក់ពិសេស និងលក្ខខណ្ឌចំណាយអប្បបរមា' : 'Create discount voucher codes, manage flash sales and minimum spend rules'}</p>
        </div>
        <button className="admin-btn primary" onClick={() => setShowCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#EC4899' }}>
          <FiPlus /> {isKhmer ? 'បង្កើតកូដបញ្ចុះតម្លៃ' : 'Create Voucher Code'}
        </button>
      </div>


      {/* Coupons Table */}
      <div className="admin-card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>{isKhmer ? 'កូដប័ណ្ណ' : 'Coupon Code'}</th>
              <th>{isKhmer ? 'បញ្ចុះតម្លៃ' : 'Discount'}</th>
              <th>{isKhmer ? 'ចំណាយអប្បបរមា' : 'Min. Spend'}</th>
              <th>{isKhmer ? 'ចំនួនប្រើប្រាស់' : 'Redemptions'}</th>
              <th>{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
              <th style={{ textAlign: 'right', paddingRight: 20 }}>{isKhmer ? 'សកម្មភាព' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(c => (
              <tr key={c.id}>
                <td>
                  <span style={{
                    padding: '4px 10px', borderRadius: 8, background: 'rgba(236,72,153,0.15)',
                    color: '#F472B6', border: '1px solid rgba(236,72,153,0.3)', fontWeight: 900,
                    fontSize: '0.86rem', letterSpacing: '0.05em'
                  }}>
                    {c.code}
                  </span>
                </td>
                <td style={{ fontWeight: 800, color: '#FFF' }}>
                  {c.discountType === 'PERCENT' ? `${c.discountValue}% ${isKhmer ? 'បញ្ចុះ' : 'OFF'}` : `$${Number(c.discountValue).toFixed(2)} ${isKhmer ? 'បញ្ចុះ' : 'OFF'}`}
                </td>
                <td style={{ color: 'var(--admin-text-muted)', fontSize: '0.82rem' }}>
                  ${Number(c.minPurchase || 0).toFixed(2)}
                </td>
                <td style={{ fontSize: '0.82rem', color: '#CBD5E1' }}>
                  <strong>{c.usageCount}</strong> {isKhmer ? 'នៃ' : '/'} {c.maxUses} {isKhmer ? 'បានប្រើ' : 'used'}
                </td>
                <td>
                  <span style={{
                    padding: '3px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 800,
                    background: c.active ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: c.active ? '#10B981' : '#EF4444',
                    border: `1px solid ${c.active ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                  }}>
                    {c.active ? (isKhmer ? 'សកម្ម' : 'ACTIVE') : (isKhmer ? 'អសកម្ម' : 'INACTIVE')}
                  </span>
                </td>
                <td style={{ textAlign: 'right', paddingRight: 20 }}>
                  <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    <button
                      onClick={() => handleToggle(c.id)}
                      style={{
                        padding: '4px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 800,
                        background: c.active ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                        color: c.active ? '#F59E0B' : '#10B981',
                        border: '1px solid', borderColor: c.active ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)',
                        cursor: 'pointer'
                      }}
                    >
                      {c.active ? (isKhmer ? 'ផ្អាក' : 'Pause') : (isKhmer ? 'បើកដំណើរការ' : 'Activate')}
                    </button>
                    <button
                      className="admin-action-btn danger"
                      onClick={() => handleDelete(c)}
                      title={isKhmer ? 'លុបប័ណ្ណ' : 'Delete Coupon'}
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
          }}
          onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}
        >
          <div style={{
            background: 'var(--admin-card-bg, #1a1f3a)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20, width: '100%', maxWidth: 440,
            padding: 24, position: 'relative', color: '#FFF'
          }}>
            <button
              onClick={() => setShowCreateModal(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-muted)' }}
            >
              <FiX size={20} />
            </button>

            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiTag color="#EC4899" /> {isKhmer ? 'បង្កើតកូដបញ្ចុះតម្លៃថ្មី' : 'Create New Promo Code'}
            </h3>

            <form onSubmit={handleCreateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: 6 }}>{isKhmer ? 'កូដប័ណ្ណ *' : 'VOUCHER CODE *'}</label>
                <input
                  type="text"
                  placeholder="e.g. SUMMER2026"
                  value={newCode}
                  onChange={e => setNewCode(e.target.value.toUpperCase())}
                  className="admin-input"
                  style={{ width: '100%', textTransform: 'uppercase', fontWeight: 800 }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: 6 }}>{isKhmer ? 'ប្រភេទ' : 'TYPE'}</label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value)}
                    className="admin-input"
                    style={{ width: '100%' }}
                  >
                    <option value="PERCENT">{isKhmer ? 'ភាគរយ (%)' : 'Percentage (%)'}</option>
                    <option value="FIXED">{isKhmer ? 'ចំនួនទឹកប្រាក់ថេរ ($)' : 'Fixed Amount ($)'}</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: 6 }}>{isKhmer ? 'តម្លៃ *' : 'VALUE *'}</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="10"
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    className="admin-input"
                    style={{ width: '100%' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: 6 }}>{isKhmer ? 'ចំណាយអប្បបរមា ($)' : 'MIN. SPEND ($)'}</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={newMin}
                    onChange={e => setNewMin(e.target.value)}
                    className="admin-input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: 6 }}>{isKhmer ? 'ចំនួនប្រើប្រាស់អតិបរមា' : 'MAX USES'}</label>
                  <input
                    type="number"
                    placeholder="100"
                    value={newMaxUses}
                    onChange={e => setNewMaxUses(e.target.value)}
                    className="admin-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" className="admin-btn secondary" onClick={() => setShowCreateModal(false)}>{isKhmer ? 'បោះបង់' : 'Cancel'}</button>
                <button type="submit" className="admin-btn primary" style={{ background: '#EC4899' }}>{isKhmer ? 'បង្កើតប័ណ្ណ' : 'Create Voucher'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirm Delete Coupon Modal */}
      <ConfirmDeleteCouponModal
        isOpen={Boolean(deleteConfirmCoupon)}
        coupon={deleteConfirmCoupon}
        onClose={() => setDeleteConfirmCoupon(null)}
        onConfirm={confirmDeleteCoupon}
      />
    </div>
  );
}
