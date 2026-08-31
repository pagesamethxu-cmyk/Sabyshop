import React from 'react';
import { FiLogOut, FiX } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';

const ConfirmLogoutModal = ({ isOpen, onClose, onConfirm }) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay animate-fade-in" 
      onClick={onClose}
      style={{ 
        zIndex: 9999, 
        position: 'fixed', 
        inset: 0,
        background: 'rgba(5, 5, 12, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div 
        className="animate-slide-up" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '400px',
          background: '#13111C',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          padding: '22px 24px',
          color: '#ffffff',
          position: 'relative'
        }}
      >
        {/* Top Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FF4D4D', fontWeight: 800, fontSize: '1.1rem' }}>
            <FiLogOut size={19} />
            <span>{t('logout.title') || 'Log Out'}</span>
          </div>

          <button 
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#A0A0B0',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
          >
            <FiX size={15} />
          </button>
        </div>

        {/* Subtle Horizontal Divider */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: '0 -24px 16px -24px' }} />

        {/* Body Message */}
        <p style={{ color: '#D0D0E0', fontSize: '0.9rem', lineHeight: 1.5, textAlign: 'left', margin: '0 0 24px 0', fontWeight: 500 }}>
          {t('logout.message') || 'Are you sure you want to log out of your account session?'}
        </p>

        {/* Action Buttons Aligned Right */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center' }}>
          <button 
            type="button"
            onClick={onClose}
            style={{ 
              background: '#232033', 
              color: '#E0E0F0',
              border: 'none',
              borderRadius: '10px',
              padding: '9px 20px', 
              fontSize: '0.86rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#2D2940'}
            onMouseOut={(e) => e.currentTarget.style.background = '#232033'}
          >
            {t('logout.cancel') || 'Cancel'}
          </button>
          
          <button 
            type="button"
            onClick={onConfirm}
            style={{ 
              background: 'linear-gradient(135deg, #FF4D4D 0%, #EF4444 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '9px 22px',
              fontSize: '0.86rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(255, 77, 77, 0.35)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            {t('logout.logout') || 'Log Out'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmLogoutModal;
