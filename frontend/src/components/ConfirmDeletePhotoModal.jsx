import React from 'react';
import { FiTrash2, FiX } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';

const ConfirmDeletePhotoModal = ({ isOpen, onClose, onConfirm }) => {
  const { lang } = useLanguage();
  if (!isOpen) return null;

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
          padding: '36px 28px 28px 28px'
        }}
      >
        <button 
          onClick={onClose}
          aria-label="Close"
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

        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.12)',
          color: '#EF4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.8rem',
          margin: '0 auto 20px auto',
          boxShadow: '0 8px 20px rgba(239, 68, 68, 0.2)'
        }}>
          <FiTrash2 />
        </div>

        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text)', marginBottom: '10px' }}>
          {lang === 'km' ? 'តើអ្នកប្រាកដជាចង់លុបរូបថត Profile មែនទេ?' : 'Delete Profile Photo?'}
        </h3>
        
        <p style={{ color: 'var(--text-light)', fontSize: '0.92rem', marginBottom: '28px', lineHeight: 1.5 }}>
          {lang === 'km' 
            ? 'រូបថត Profile របស់អ្នកនឹងត្រូវលុបចេញពីគណនី។ អ្នកអាចទាញយករូបថតថ្មីមកជំនួសបានគ្រប់ពេល។' 
            : 'Your profile photo will be removed from your account. You can upload a new photo anytime.'}
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button 
            type="button"
            onClick={onClose}
            className="btn btn-outline"
            style={{ 
              flex: 1, 
              borderColor: 'var(--border)', 
              color: 'var(--text)',
              padding: '12px 20px' 
            }}
          >
            {lang === 'km' ? 'បោះបង់' : 'Cancel'}
          </button>
          
          <button 
            type="button"
            onClick={onConfirm}
            className="btn btn-danger"
            style={{ 
              flex: 1, 
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: '#EF4444',
              borderColor: '#EF4444'
            }}
          >
            <FiTrash2 size={16} /> {lang === 'km' ? 'លុបរូបថត' : 'Delete Photo'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeletePhotoModal;
