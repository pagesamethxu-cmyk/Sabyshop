import React from 'react';
import { FiGlobe, FiX } from 'react-icons/fi';

const ConfirmLanguageModal = ({ isOpen, targetLang, currentLang, onConfirm, onClose }) => {
  if (!isOpen) return null;

  const isSwitchingToEnglish = targetLang === 'en';

  const title = currentLang === 'km' ? 'បញ្ជាក់ការផ្លាស់ប្ដូរភាសា' : 'Confirm Language Switch';
  const targetLabel = isSwitchingToEnglish ? 'English (US)' : 'ភាសាខ្មែរ (Khmer)';
  
  const message = currentLang === 'km'
    ? `តើអ្នកប្រាកដជាចង់ផ្លាស់ប្ដូរភាសាកម្មវិធីទៅជា ${isSwitchingToEnglish ? 'English' : 'ភាសាខ្មែរ'} មែនទេ?`
    : `Are you sure you want to switch the application language to ${isSwitchingToEnglish ? 'English' : 'Khmer'}?`;

  const confirmBtnText = currentLang === 'km' ? 'ផ្លាស់ប្ដូរភាសា' : 'Switch Language';
  const cancelBtnText = currentLang === 'km' ? 'បោះបង់' : 'Cancel';

  return (
    <div
      className="modal-overlay animate-fade-in"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        className="modal animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '420px',
          width: '100%',
          borderRadius: '24px',
          background: '#ffffff',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
          padding: '28px 24px',
          position: 'relative',
          textAlign: 'center',
          color: '#0F172A'
        }}
      >
        {/* Close Icon */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: '#F1F5F9',
            border: 'none', borderRadius: '50%',
            width: '32px', height: '32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#64748B',
            cursor: 'pointer'
          }}
        >
          <FiX size={18} />
        </button>

        {/* Globe Badge Icon */}
        <div style={{
          width: '60px', height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(255, 71, 133, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
          color: '#FF4785',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.8rem', margin: '0 auto 16px auto',
          boxShadow: '0 8px 20px rgba(255, 71, 133, 0.15)'
        }}>
          <FiGlobe />
        </div>

        {/* Modal Title */}
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0' }}>
          {title}
        </h3>

        {/* Target Flag Pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: '#F8FAFC',
          border: '1.5px solid #E2E8F0',
          borderRadius: '20px', padding: '6px 18px',
          fontSize: '0.95rem', fontWeight: 800, color: '#1E293B',
          margin: '6px 0 16px 0'
        }}>
          {targetLabel}
        </div>

        {/* Message Description */}
        <p style={{ fontSize: '0.9rem', color: '#475569', margin: '0 0 24px 0', lineHeight: 1.5 }}>
          {message}
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1, padding: '11px 18px', borderRadius: '14px',
              fontSize: '0.9rem', fontWeight: 700, border: '1px solid #CBD5E1',
              background: '#F8FAFC', color: '#475569', cursor: 'pointer'
            }}
          >
            {cancelBtnText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1, padding: '11px 18px', borderRadius: '14px',
              fontSize: '0.9rem', fontWeight: 800,
              background: 'linear-gradient(135deg, #FF4785 0%, #8B5CF6 100%)',
              border: 'none', color: '#ffffff',
              boxShadow: '0 4px 16px rgba(255, 71, 133, 0.3)',
              cursor: 'pointer'
            }}
          >
            {confirmBtnText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmLanguageModal;
