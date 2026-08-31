import React, { useState } from 'react';
import { orders as ordersApi } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import { FiPackage, FiX, FiCheck, FiSend, FiInfo } from 'react-icons/fi';

const SellerDeliverModal = ({ isOpen, onClose, order, onSuccess }) => {
  const { isKhmer } = useLanguage();
  const inviteEmail = order?.buyerInviteEmail || order?.items?.find(it => it.buyerInviteEmail)?.buyerInviteEmail || '';
  const [accountEmail, setAccountEmail] = useState(inviteEmail || '');
  const [accountPassword, setAccountPassword] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (order) {
      const email = order.buyerInviteEmail || order.items?.find(it => it.buyerInviteEmail)?.buyerInviteEmail || '';
      if (email && !accountEmail) {
        setAccountEmail(email);
      }
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalEmail = accountEmail.trim() || inviteEmail.trim();
    if (!finalEmail) {
      return toast.error(isKhmer ? 'សូមបញ្ចូលអ៊ីមែលគណនី ឬតំណភ្ជាប់ Invite Link ឬ License Key' : 'Please enter account email, invite link or license key');
    }

    setSubmitting(true);
    try {
      const payload = {
        accountEmail: finalEmail,
        accountPassword: accountPassword.trim(),
        deliveryNote: deliveryNote.trim()
      };

      await ordersApi.deliver(order.id, payload);
      toast.success(isKhmer ? `ការបញ្ជាទិញ #${order.id} ត្រូវបានប្រគល់ជូនអតិថិជនជោគជ័យ!` : `Order #${order.id} delivered successfully to customer!`);
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || (isKhmer ? 'មិនអាចប្រគល់ទំនិញបានទេ' : 'Delivery failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1050,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: 'var(--card-bg, #FFFFFF)',
          color: 'var(--text, #0F172A)',
          borderRadius: 24,
          width: '100%',
          maxWidth: 520,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
          border: '1px solid var(--border, #E2E8F0)',
          overflow: 'hidden',
          animation: 'modalPop 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 22px',
          borderBottom: '1px solid var(--border, #E2E8F0)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.04))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #10B981, #059669)',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
            }}>
              <FiPackage size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                {isKhmer ? `ប្រគល់ទំនិញ — ការបញ្ជាទិញ #${order.id}` : `Deliver Order #${order.id}`}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-light, #64748B)' }}>
                {order.items?.[0]?.product?.name || order.items?.[0]?.productName || (isKhmer ? 'ផលិតផល' : 'Product')} · ${(order.totalAmount || 0).toFixed(2)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-light, #94A3B8)',
              padding: 6,
              borderRadius: 8
            }}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Buyer Invite Email Info Box if provided */}
          {(order.buyerInviteEmail || order.items?.some(it => it.buyerInviteEmail)) && (
            <div style={{
              background: '#FEF3C7',
              border: '1.5px solid #FDE68A',
              borderRadius: 14,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#92400E', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiInfo size={15} /> {isKhmer ? 'អ៊ីមែលអតិថិជនបានបញ្ចូលសម្រាប់ឱ្យអ្នកលក់ Invite៖' : 'Customer email provided for invite:'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: '#FFF', padding: '6px 10px', borderRadius: 8, border: '1px solid #FCD34D' }}>
                <code style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>
                  {order.buyerInviteEmail || order.items?.find(it => it.buyerInviteEmail)?.buyerInviteEmail || order.userEmail}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    const mail = order.buyerInviteEmail || order.items?.find(it => it.buyerInviteEmail)?.buyerInviteEmail || order.userEmail;
                    navigator.clipboard.writeText(mail);
                    toast.success(isKhmer ? 'បានចម្លងអ៊ីមែលអតិថិជនជោគជ័យ!' : 'Customer email copied!');
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    background: '#F8FAFC',
                    color: '#4338CA',
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    cursor: 'pointer'
                  }}
                >
                  {isKhmer ? 'ចម្លងអ៊ីមែល' : 'Copy Email'}
                </button>
              </div>
              {(order.claimNote || order.items?.find(it => it.claimNote)?.claimNote) && (
                <div style={{ fontSize: '0.72rem', color: '#78350F' }}>
                  <strong>{isKhmer ? 'ចំណាំរបស់អតិថិជន៖' : 'Customer note:'}</strong> {order.claimNote || order.items?.find(it => it.claimNote)?.claimNote}
                </div>
              )}
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, display: 'block', marginBottom: 4 }}>
              {isKhmer ? 'អ៊ីមែលគណនី ឬ តំណភ្ជាប់ Invite Link ឬ លេខកូដ License Key *' : 'Account Email / Invite Link / License Key *'}
            </label>
            <input
              type="text"
              value={accountEmail}
              onChange={e => setAccountEmail(e.target.value)}
              placeholder={isKhmer ? 'ឧ. user@gmail.com ឬ https://invite.link...' : 'e.g. user@gmail.com or https://invite.link...'}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--border, #CBD5E1)',
                background: 'var(--bg-secondary, #F8FAFC)',
                color: 'var(--text, #0F172A)',
                fontSize: '0.88rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, display: 'block', marginBottom: 4 }}>
              {isKhmer ? 'ពាក្យសម្ងាត់គណនី (មិនបាច់បំពេញក៏បាន បើសិនជា Link ឬ License Key)' : 'Account Password (Optional if Link or License Key)'}
            </label>
            <input
              type="text"
              value={accountPassword}
              onChange={e => setAccountPassword(e.target.value)}
              placeholder={isKhmer ? 'ឧ. Pass1234!' : 'e.g. Pass1234!'}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--border, #CBD5E1)',
                background: 'var(--bg-secondary, #F8FAFC)',
                color: 'var(--text, #0F172A)',
                fontSize: '0.88rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, display: 'block', marginBottom: 4 }}>
              {isKhmer ? 'កំណត់ចំណាំអ្នកលក់ ឬ ការណែនាំបន្ថែមជូនអ្នកទិញ' : 'Seller Note or Instructions to Buyer'}
            </label>
            <textarea
              value={deliveryNote}
              onChange={e => setDeliveryNote(e.target.value)}
              placeholder={isKhmer ? 'ឧ. Profile 1 PIN 1234 សូមកុំប្តូរឈ្មោះ Profile...' : 'e.g. Profile 1 PIN 1234, please do not rename profile...'}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--border, #CBD5E1)',
                background: 'var(--bg-secondary, #F8FAFC)',
                color: 'var(--text, #0F172A)',
                fontSize: '0.85rem',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 10,
            padding: '10px 12px',
            fontSize: '0.74rem',
            color: '#065F46',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <FiInfo size={14} style={{ flexShrink: 0 }} />
            <span>
              {isKhmer
                ? 'បន្ទាប់ពីប្រគល់ទំនិញរួច ស្ថានភាពនឹងប្តូរទៅជា DELIVERED (បានប្រគល់)។ ប្រាក់ចំណូលនឹងត្រូវបញ្ជូនទៅសមតុល្យរបស់អ្នកភ្លាមៗពេលដែលអតិថិជនចុចទទួល ឬផុតរយៈពេល 48 ម៉ោង (Auto-Release)។'
                : 'After delivery, order status updates to DELIVERED. Earnings will release to your available balance upon buyer confirmation or auto-release after 48 hours.'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                borderRadius: 10,
                border: '1px solid var(--border, #CBD5E1)',
                background: 'transparent',
                color: 'var(--text-light, #64748B)',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              {isKhmer ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '9px 20px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#FFF',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: submitting ? 'wait' : 'pointer',
                boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {submitting ? (isKhmer ? 'កំពុងប្រគល់...' : 'Delivering...') : <><FiSend size={14} /> {isKhmer ? 'ប្រគល់ទំនិញជូនអ្នកទិញ' : 'Deliver to Buyer'}</>}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default SellerDeliverModal;

