import React from 'react';
import { MdStorefront } from 'react-icons/md';
import { FiUser, FiX, FiCheckCircle } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';

const ConfirmModeSwitchModal = ({ isOpen, targetMode, onConfirm, onClose }) => {
  const { isKhmer } = useLanguage();

  if (!isOpen) return null;

  const isToSeller = targetMode === 'SELLER';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#1E293B',
          color: '#F8FAFC',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 102, 241, 0.15)',
          overflow: 'hidden',
          animation: 'popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Icon Graphic */}
        <div
          style={{
            padding: '32px 24px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative'
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.18s'
            }}
          >
            <FiX size={18} />
          </button>

          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '22px',
              background: isToSeller
                ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px',
              boxShadow: isToSeller
                ? '0 10px 25px -5px rgba(16, 185, 129, 0.4)'
                : '0 10px 25px -5px rgba(99, 102, 241, 0.4)'
            }}
          >
            {isToSeller ? (
              <MdStorefront size={38} color="#FFFFFF" />
            ) : (
              <FiUser size={36} color="#FFFFFF" />
            )}
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 8px', color: '#F8FAFC' }}>
            {isToSeller
              ? (isKhmer ? 'ប្ដូរទៅកាន់ Seller Mode?' : 'Switch to Seller Mode?')
              : (isKhmer ? 'ប្ដូរទៅកាន់ User Mode?' : 'Switch to User Mode?')
            }
          </h3>

          <p style={{ fontSize: '0.88rem', color: '#94A3B8', margin: 0, lineHeight: 1.6, maxWidth: '340px' }}>
            {isToSeller
              ? (isKhmer 
                  ? 'តើអ្នកប្រាកដជាចង់ប្តូរទៅកាន់ផ្ទាំងគ្រប់គ្រងអ្នកលក់ ដើម្បីគ្រប់គ្រងផលិតផល និងការលក់មែនទេ?' 
                  : 'Are you sure you want to open Seller Portal to manage your products and customer sales orders?')
              : (isKhmer 
                  ? 'តើអ្នកប្រាកដជាចង់ប្តូរទៅកាន់ទម្រង់អ្នកទិញទូទៅ ដើម្បីទិញទំនិញ ឬពិនិត្យការបញ្ជាទិញមែនទេ?' 
                  : 'Are you sure you want to switch back to normal User Mode to shop products or view personal orders?')
            }
          </p>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            padding: '0 24px 24px',
            display: 'flex',
            gap: '12px'
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#CBD5E1',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.18s'
            }}
          >
            {isKhmer ? 'បោះបង់' : 'Cancel'}
          </button>

          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{
              flex: 1.3,
              padding: '12px 16px',
              borderRadius: '14px',
              border: 'none',
              background: isToSeller
                ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: isToSeller
                ? '0 4px 14px rgba(16, 185, 129, 0.35)'
                : '0 4px 14px rgba(99, 102, 241, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.18s'
            }}
          >
            <FiCheckCircle size={17} />
            <span>
              {isToSeller
                ? (isKhmer ? 'ប្ដូរទៅ Seller Mode' : 'Confirm Seller Mode')
                : (isKhmer ? 'ប្ដូរទៅ User Mode' : 'Confirm User Mode')
              }
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModeSwitchModal;
