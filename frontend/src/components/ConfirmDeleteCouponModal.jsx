import React from 'react';
import { FiAlertTriangle, FiX, FiTrash2, FiTag } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';

/**
 * ConfirmDeleteCouponModal
 * Displays a confirmation dialog when deleting a coupon.
 * Supports Khmer and English languages, and previews the coupon code & discount.
 */
const ConfirmDeleteCouponModal = ({ isOpen, coupon, onClose, onConfirm, loading }) => {
  const { lang, isKhmer: ctxIsKhmer } = useLanguage();
  const isKhmer = ctxIsKhmer || lang === 'km';

  if (!isOpen || !coupon) return null;

  const isPercentage = coupon.discountType === 'PERCENTAGE' || coupon.discountType === 'PERCENT';
  const discountDisplay = isPercentage
    ? `${coupon.discountValue}%`
    : `$${parseFloat(coupon.discountValue || 0).toFixed(2)}`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div
        style={{
          background: 'var(--card-bg, #FFFFFF)',
          color: 'var(--text, #0F172A)',
          borderRadius: 24,
          width: '100%',
          maxWidth: 460,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--border, #E2E8F0)',
          overflow: 'hidden',
          padding: '28px 24px',
          textAlign: 'center',
          position: 'relative',
          animation: 'adminModalPop 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={loading}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            background: 'none',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            color: 'var(--text-light, #94A3B8)',
            padding: 6,
            borderRadius: 8
          }}
        >
          <FiX size={18} />
        </button>

        {/* Warning Icon with Red Glow */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.2)'
          }}
        >
          <FiAlertTriangle size={32} />
        </div>

        {/* Title */}
        <h3
          style={{
            margin: '0 0 12px',
            fontSize: '1.25rem',
            fontWeight: 900,
            color: 'var(--text, #0F172A)'
          }}
        >
          {isKhmer ? 'តើអ្នកប្រាកដជាចង់លុបប័ណ្ណបញ្ចុះតម្លៃនេះ?' : 'Delete Coupon Code?'}
        </h3>

        {/* Coupon Preview Card */}
        <div
          style={{
            background: 'var(--bg-secondary, #F8FAFC)',
            border: '1px dashed #CBD5E1',
            borderRadius: 16,
            padding: '14px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            textAlign: 'left'
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.15) 100%)',
              border: '1px solid rgba(99,102,241,0.3)',
              color: '#6366F1',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FiTag size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontWeight: 900,
                  fontSize: '1.1rem',
                  color: '#4F46E5',
                  letterSpacing: '0.05em'
                }}
              >
                {coupon.code}
              </span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  background: isPercentage ? 'rgba(99,102,241,0.12)' : 'rgba(16,185,129,0.12)',
                  color: isPercentage ? '#4F46E5' : '#059669'
                }}
              >
                {discountDisplay} OFF
              </span>
            </div>
            <div
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-light, #64748B)',
                marginTop: 4,
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap'
              }}
            >
              {coupon.minSpend || coupon.minPurchase ? (
                <span>
                  {isKhmer
                    ? `ទិញអប្បបរមា $${parseFloat(coupon.minSpend || coupon.minPurchase).toFixed(2)}`
                    : `Min spend $${parseFloat(coupon.minSpend || coupon.minPurchase).toFixed(2)}`}
                </span>
              ) : (
                <span>{isKhmer ? 'គ្មានកម្រិតចំណាយ' : 'No min spend'}</span>
              )}
              {(coupon.productName || coupon.product?.name) && (
                <>
                  <span>·</span>
                  <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {isKhmer ? 'ទំនិញ:' : 'For:'} {coupon.productName || coupon.product?.name}
                  </span>
                </>
              )}
              {coupon.usageCount !== undefined && (
                <>
                  <span>·</span>
                  <span>{coupon.usageCount} {isKhmer ? 'ដងបានប្រើ' : 'uses'}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Warning Details Message */}
        <p
          style={{
            margin: '0 0 24px',
            fontSize: '0.86rem',
            color: 'var(--text-light, #64748B)',
            lineHeight: 1.6
          }}
        >
          {isKhmer
            ? `ការលុបកូដ "${coupon.code}" នឹងលុបវាចេញពីប្រព័ន្ធជាអចិន្ត្រៃយ៍ ហើយអតិថិជននឹងមិនអាចប្រើប្រាស់កូដនេះសម្រាប់ការបញ្ជាទិញទៀតឡើយ។ សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`
            : `Deleting coupon "${coupon.code}" will permanently remove it from your store. Customers will no longer be able to use this code at checkout. This action cannot be undone.`}
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              padding: '11px 18px',
              borderRadius: 12,
              border: '1px solid var(--border, #CBD5E1)',
              background: 'transparent',
              color: 'var(--text-light, #64748B)',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {isKhmer ? 'បោះបង់' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1.2,
              padding: '11px 18px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: loading ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)'
            }}
          >
            <FiTrash2 size={16} />
            <span>
              {loading
                ? (isKhmer ? 'កំពុងលុប...' : 'Deleting...')
                : (isKhmer ? 'បញ្ជាក់ការលុប' : 'Confirm Delete')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteCouponModal;
