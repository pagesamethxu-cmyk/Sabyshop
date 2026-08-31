import React from 'react';
import { FiTrash2, FiX } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';

const ConfirmRemoveCartModal = ({ isOpen, item, onClose, onConfirm }) => {
  const { t } = useLanguage();
  if (!isOpen || !item) return null;

  const { product, quantity } = item;
  const itemTotal = ((product?.price ?? 0) * (quantity ?? 1)).toFixed(2);

  return (
    <div 
      className="modal-overlay animate-fade-in" 
      onClick={onClose}
      style={{ zIndex: 9999, position: 'fixed', inset: 0 }}
    >
      <div 
        className="modal animate-slide-up" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '420px',
          textAlign: 'center',
          position: 'relative',
          padding: '32px 24px 24px 24px'
        }}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          aria-label="Close modal"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '1.2rem',
            color: 'var(--text-light)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--transition)'
          }}
        >
          <FiX />
        </button>

        {/* Warning Badge Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--danger-light, rgba(239, 68, 68, 0.1))',
          color: 'var(--danger, #ef4444)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.8rem',
          margin: '0 auto 18px auto',
          boxShadow: '0 8px 20px rgba(239, 68, 68, 0.15)'
        }}>
          <FiTrash2 />
        </div>

        {/* Modal Title */}
        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
          {t('removeCart.title')}
        </h3>

        {/* Description */}
        <p style={{ color: 'var(--text-light)', fontSize: '0.92rem', marginBottom: '18px', lineHeight: 1.5 }}>
          {t('removeCart.message')}
        </p>

        {/* Item Summary Box */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 14px',
          backgroundColor: 'var(--bg-secondary, #f8fafc)',
          borderRadius: 'var(--radius-sm, 10px)',
          border: '1px solid var(--border-light, #e2e8f0)',
          marginBottom: '24px',
          textAlign: 'left'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            background: 'var(--primary-light, rgba(99, 102, 241, 0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            fontWeight: 800,
            color: 'var(--primary)',
            overflow: 'hidden',
            flexShrink: 0
          }}>
            {product?.imageUrl ? (
              <img src={product.imageUrl} alt={product?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              (product?.name || '?')[0]
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ margin: '0 0 2px 0', fontSize: '0.95rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {product?.name}
            </h4>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>
              {t('removeCart.qty')}: <strong>{quantity}</strong> · ${itemTotal}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button 
            type="button"
            onClick={onClose}
            className="btn btn-outline"
            style={{ 
              flex: 1, 
              borderColor: 'var(--border)', 
              color: 'var(--text)',
              padding: '11px 16px' 
            }}
          >
            {t('removeCart.cancel')}
          </button>
          
          <button 
            type="button"
            onClick={onConfirm}
            className="btn btn-danger"
            style={{ 
              flex: 1, 
              padding: '11px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <FiTrash2 /> {t('removeCart.remove')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmRemoveCartModal;
