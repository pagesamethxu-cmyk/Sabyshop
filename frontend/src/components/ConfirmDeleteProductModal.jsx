import React from 'react';
import { FiAlertTriangle, FiX, FiTrash2, FiPackage } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';

const ConfirmDeleteProductModal = ({ isOpen, product, onClose, onConfirm, loading }) => {
  const { lang, isKhmer: ctxIsKhmer } = useLanguage();
  const isKhmer = ctxIsKhmer || lang === 'km';

  if (!isOpen || !product) return null;

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

        {/* Warning Icon with Red Pulse Glow */}
        <div style={{
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
        }}>
          <FiAlertTriangle size={32} />
        </div>

        {/* Title */}
        <h3 style={{
          margin: '0 0 12px',
          fontSize: '1.25rem',
          fontWeight: 900,
          color: 'var(--text, #0F172A)'
        }}>
          {isKhmer ? 'តើអ្នកប្រាកដជាចង់លុបទំនិញនេះ?' : 'Delete Product?'}
        </h3>

        {/* Product Preview Card */}
        <div style={{
          background: 'var(--bg-secondary, #F8FAFC)',
          border: '1px solid var(--border, #E2E8F0)',
          borderRadius: 16,
          padding: '12px 14px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          textAlign: 'left'
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            background: '#E2E8F0',
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <FiPackage size={22} color="#64748B" />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text, #0F172A)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {product.name}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-light, #64748B)', marginTop: 2, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span>{product.category?.name || product.categoryName || (isKhmer ? 'ទំនិញ' : 'Product')}</span>
              <span>·</span>
              <span style={{ fontWeight: 800, color: '#10B981' }}></span>
              {product.duration && (
                <>
                  <span>·</span>
                  <span>{product.duration}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Warning Details Message */}
        <p style={{
          margin: '0 0 24px',
          fontSize: '0.86rem',
          color: 'var(--text-light, #64748B)',
          lineHeight: 1.6
        }}>
          {isKhmer
            ? 'ការលុបទំនិញនេះនឹងលុបទិន្នន័យផលិតផល និងស្តុកគណនី (Stock Items) ទាំងអស់ចេញពីប្រព័ន្ធ។ សកម្មភាពនេះមិនអាចត្រឡប់វិញបានឡើយ។'
            : 'Deleting this product will permanently remove all product details and associated stock inventory. This action cannot be undone.'}
        </p>

        {/* Actions */}
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
            <span>{loading ? (isKhmer ? 'កំពុងលុប...' : 'Deleting...') : (isKhmer ? 'បញ្ជាក់ការលុប' : 'Confirm Delete')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteProductModal;