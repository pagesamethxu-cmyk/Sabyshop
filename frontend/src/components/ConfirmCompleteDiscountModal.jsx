import React, { useState, useEffect } from 'react';
import {
  FiCheckCircle, FiX, FiClock, FiPackage, FiTarget,
  FiTrendingUp, FiZap, FiInfo, FiMessageSquare, FiPercent
} from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';

/**
 * ConfirmCompleteDiscountModal
 * Displays a modal when seller completes/ends a direct product discount.
 * Allows seller to select a preset reason message or enter a custom note.
 */
const ConfirmCompleteDiscountModal = ({ isOpen, product, onClose, onConfirm, loading }) => {
  const { lang, isKhmer: ctxIsKhmer } = useLanguage();
  const isKhmer = ctxIsKhmer || lang === 'km';

  const defaultReasons = [
    {
      id: 'expired',
      icon: FiClock,
      color: '#4F46E5',
      titleKm: 'អស់កាលកំណត់ប្រូម៉ូសិន',
      titleEn: 'Promotion Period Expired',
      descKm: 'ប្រូម៉ូសិនបានដល់កាលកំណត់ ស្ដារមកតម្លៃដើមធម្មតាវិញ',
      descEn: 'The scheduled promotion duration has ended, restoring original price'
    },
    {
      id: 'sold_out',
      icon: FiPackage,
      color: '#059669',
      titleKm: 'អស់ស្តុកតម្លៃពិសេស',
      titleEn: 'Promotional Stock Sold Out',
      descKm: 'ចំនួនទំនិញតម្លៃប្រូម៉ូសិនពិសេសបានលក់អស់ពីស្តុក',
      descEn: 'Discounted inventory quota has been fully sold out'
    },
    {
      id: 'goal_reached',
      icon: FiTarget,
      color: '#D97706',
      titleKm: 'សម្រេចគោលដៅលក់',
      titleEn: 'Sales Goal Achieved',
      descKm: 'យុទ្ធនាការលក់សម្រេចបានតាមគោលដៅដែលបានគ្រោងទុក',
      descEn: 'Campaign reached target sales volume successfully'
    },
    {
      id: 'price_adjustment',
      icon: FiTrendingUp,
      color: '#2563EB',
      titleKm: 'កែសម្រួលយុទ្ធសាស្ត្រតម្លៃ',
      titleEn: 'Price Strategy Adjustment',
      descKm: 'កែសម្រួលរចនាសម្ព័ន្ធតម្លៃទំនិញសម្រាប់ទីផ្សារឡើងវិញ',
      descEn: 'Adjusting pricing structure for regular market selling'
    },
    {
      id: 'early_close',
      icon: FiZap,
      color: '#EC4899',
      titleKm: 'បញ្ចប់មុនកាលកំណត់',
      titleEn: 'Early Campaign Close',
      descKm: 'សម្រេចបញ្ចប់ការបញ្ចុះតម្លៃមុនកាលកំណត់ជាបណ្ដោះអាសន្ន',
      descEn: 'Closed the promotional campaign ahead of schedule'
    }
  ];

  const [selectedReasonId, setSelectedReasonId] = useState('expired');
  const [customNote, setCustomNote] = useState('');

  // Reset states on open
  useEffect(() => {
    if (isOpen) {
      setSelectedReasonId('expired');
      setCustomNote('');
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const origP = product.originalPrice
    ? parseFloat(product.originalPrice).toFixed(2)
    : parseFloat(product.basePrice || product.price || 0).toFixed(2);
  const currentP = parseFloat(product.basePrice || product.price || 0).toFixed(2);
  const pct = parseFloat(origP) > parseFloat(currentP) && parseFloat(origP) > 0
    ? Math.round(((parseFloat(origP) - parseFloat(currentP)) / parseFloat(origP)) * 100)
    : 0;

  const handleConfirmSubmit = () => {
    const reasonObj = defaultReasons.find(r => r.id === selectedReasonId);
    const reasonTitle = isKhmer ? reasonObj?.titleKm : reasonObj?.titleEn;
    const finalReason = customNote.trim()
      ? `${reasonTitle} — ${customNote.trim()}`
      : reasonTitle || 'Promotion Ended';

    onConfirm({
      reason: finalReason,
      reasonId: selectedReasonId,
      customNote: customNote.trim()
    });
  };

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
          maxWidth: 520,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--border, #E2E8F0)',
          overflow: 'hidden',
          padding: '24px 22px',
          position: 'relative',
          animation: 'adminModalPop 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
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

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.2) 100%)',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
              flexShrink: 0
            }}
          >
            <FiCheckCircle size={24} />
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '1.2rem',
                fontWeight: 900,
                color: 'var(--text, #0F172A)'
              }}
            >
              {isKhmer ? 'បញ្ចប់ការបញ្ចុះតម្លៃទំនិញ' : 'Complete Product Discount'}
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-light, #64748B)' }}>
              {isKhmer
                ? 'ជ្រើសរើសសារ ឬហេតុផលសម្រាប់បញ្ចប់ការបញ្ចុះតម្លៃនេះ'
                : 'Select a reason or message for completing this promotion'}
            </p>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ overflowY: 'auto', paddingRight: 4, flex: 1, marginBottom: 16 }}>
          {/* Product Preview Card */}
          <div
            style={{
              background: 'var(--bg-secondary, #F8FAFC)',
              border: '1px solid var(--border, #E2E8F0)',
              borderRadius: 16,
              padding: '12px 14px',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: '#E2E8F0',
                overflow: 'hidden',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <FiPackage size={20} color="#64748B" />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  color: 'var(--text, #0F172A)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {product.name}
              </div>
              <div
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-light, #64748B)',
                  marginTop: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap'
                }}
              >
                <span>{isKhmer ? 'តម្លៃពេលនេះ:' : 'Current:'} <strong style={{ color: '#EF4444' }}>${currentP}</strong></span>
                <span>&rarr;</span>
                <span>{isKhmer ? 'ស្ដារមកតម្លៃដើម:' : 'Restoring to:'} <strong style={{ color: '#059669' }}>${origP}</strong></span>
                {pct > 0 && (
                  <span
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#EF4444',
                      padding: '1px 5px',
                      borderRadius: 4,
                      fontSize: '0.7rem',
                      fontWeight: 800
                    }}
                  >
                    -{pct}% OFF
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Reason Section Title */}
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text, #0F172A)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiMessageSquare size={14} color="#4F46E5" />
            <span>{isKhmer ? 'សូមជ្រើសរើសសារ ឬហេតុផល (Select Reason):' : 'Select Message / Reason:'}</span>
          </div>

          {/* Selectable Reason Messages */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {defaultReasons.map((r) => {
              const IconComp = r.icon;
              const isSelected = selectedReasonId === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedReasonId(r.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 14,
                    background: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-secondary, #F8FAFC)',
                    border: isSelected ? '2px solid #10B981' : '1px solid var(--border, #E2E8F0)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: isSelected ? '#10B981' : 'rgba(100, 116, 139, 0.1)',
                      color: isSelected ? '#fff' : r.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <IconComp size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.86rem', color: isSelected ? '#065F46' : 'var(--text, #0F172A)' }}>
                      {isKhmer ? r.titleKm : r.titleEn}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-light, #64748B)', marginTop: 1 }}>
                      {isKhmer ? r.descKm : r.descEn}
                    </div>
                  </div>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: isSelected ? '5px solid #10B981' : '2px solid var(--border, #CBD5E1)',
                      background: '#fff',
                      flexShrink: 0
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Optional Custom Note Input */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light, #64748B)', display: 'block', marginBottom: 4 }}>
              {isKhmer ? 'កំណត់ចំណាំបន្ថែម (ជម្រើស)' : 'Additional Note (Optional)'}
            </label>
            <input
              type="text"
              className="input"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder={isKhmer ? 'ឧទាហរណ៍: ត្រៀមបើកកញ្ចប់ប្រូម៉ូសិនថ្មីឆាប់ៗ...' : 'e.g. Preparing for new upcoming campaign...'}
              maxLength={120}
              style={{
                width: '100%',
                height: 38,
                fontSize: '0.84rem',
                borderRadius: 10,
                background: 'var(--bg-secondary, #F8FAFC)',
                border: '1px solid var(--border, #CBD5E1)',
                padding: '0 12px'
              }}
            />
          </div>

          {/* Notice Banner */}
          <div
            style={{
              marginTop: 12,
              padding: '10px 12px',
              borderRadius: 12,
              background: 'rgba(79, 70, 229, 0.06)',
              border: '1px solid rgba(79, 70, 229, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.76rem',
              color: '#3730A3',
              lineHeight: 1.4
            }}
          >
            <FiInfo size={16} color="#4F46E5" style={{ flexShrink: 0 }} />
            <span>
              {isKhmer
                ? `តម្លៃទំនិញនឹងត្រូវស្ដារមក $${origP} វិញភ្លាមៗ ហើយប្រវត្តិបញ្ចប់ការបញ្ចុះតម្លៃនឹងត្រូវបានកត់ត្រាទុក។`
                : `Product price will be restored to $${origP} and logged in completed discount history.`}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', gap: 10, paddingTop: 10, borderTop: '1px solid var(--border, #E2E8F0)' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: 12,
              border: '1px solid var(--border, #CBD5E1)',
              background: 'transparent',
              color: 'var(--text-light, #64748B)',
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {isKhmer ? 'បោះបង់' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleConfirmSubmit}
            disabled={loading}
            style={{
              flex: 1.4,
              padding: '10px 16px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: loading ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
            }}
          >
            <FiCheckCircle size={16} />
            <span>
              {loading
                ? (isKhmer ? 'កំពុងបញ្ចប់...' : 'Completing...')
                : (isKhmer ? 'បញ្ជាក់បញ្ចប់ការបញ្ចុះ' : 'Confirm End Discount')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmCompleteDiscountModal;
