import React from 'react';
import { FiAlertTriangle, FiX, FiTrash2 } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';

const ConfirmCancelOrderModal = ({ isOpen, orderId, selectedCount = 1, onClose, onConfirm, loading }) => {
  const { lang } = useLanguage();
  const isKhmer = lang === 'km';

  if (!isOpen) return null;

  const titleText = isKhmer
    ? (selectedCount > 1 ? `លុបការបញ្ជាទិញ ${selectedCount}?` : orderId ? `លុបការបញ្ជាទិញ #${orderId}?` : 'លុបការបញ្ជាទិញ?')
    : (selectedCount > 1 ? `Delete ${selectedCount} Orders?` : orderId ? `Delete Order #${orderId}?` : 'Delete Order?');

  const messageText = isKhmer
    ? (selectedCount > 1
        ? `តើអ្នកប្រាកដជាចង់លុបការបញ្ជាទិញចំនួន ${selectedCount} ដែលបានជ្រើសរើសនេះមែនទេ? ការសកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`
        : `តើអ្នកប្រាកដជាចង់លុប ${orderId ? `ការបញ្ជាទិញ #${orderId}` : 'ការបញ្ជាទិញនេះ'} មែនទេ? ការសកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`)
    : (selectedCount > 1
        ? `Are you sure you want to delete these ${selectedCount} selected orders? This action cannot be undone.`
        : `Are you sure you want to delete ${orderId ? `order #${orderId}` : 'this order'}? This action cannot be undone.`);

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 9999, position: 'fixed', inset: 0 }} onClick={onClose}>
      <div 
        className="modal animate-slide-up" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '420px', textAlign: 'center', position: 'relative', padding: '32px 24px 24px 24px' }}
      >
        <button 
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none',
            fontSize: '1.2rem', color: 'var(--text-light)', cursor: 'pointer'
          }}
        >
          <FiX />
        </button>

        <div style={{
          width: '64px', height: '64px', borderRadius: '50%', background: 'var(--danger-light)',
          color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', margin: '0 auto 16px auto'
        }}>
          <FiAlertTriangle />
        </div>

        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
          {titleText}
        </h3>
        
        <p style={{ color: 'var(--text-light)', fontSize: '0.92rem', marginBottom: '24px', lineHeight: 1.5 }}>
          {messageText}
        </p>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn btn-outline"
            style={{ flex: 1, borderColor: 'var(--border)', color: 'var(--text)', padding: '10px 16px' }}
          >
            {isKhmer ? 'បោះបង់' : 'Cancel'}
          </button>
          
          <button 
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="btn btn-danger"
            style={{ flex: 1, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <FiTrash2 /> {loading ? (isKhmer ? 'កំពុងលុប...' : 'Deleting...') : (isKhmer ? 'បញ្ជាក់ការលុប' : 'Confirm Delete')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmCancelOrderModal;
