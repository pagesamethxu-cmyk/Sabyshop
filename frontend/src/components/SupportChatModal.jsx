import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMessageSquare, FiX, FiShield, FiPackage, FiArrowRight } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';

/**
 * SupportChatModal
 * Instead of an inline chat (which duplicates ChatHistoryPage), this modal
 * acts as a friendly prompt that navigates the user to the unified Support Chat
 * page pre-selected on the correct order.
 */
const SupportChatModal = ({ isOpen, onClose, orderId, orderDetails }) => {
  const navigate = useNavigate();
  const { isKhmer } = useLanguage();

  if (!isOpen) return null;

  const productName =
    orderDetails?.items?.[0]?.product?.name ||
    orderDetails?.items?.[0]?.productName ||
    orderDetails?.productName || '';

  const handleOpenChat = () => {
    onClose();
    navigate(`/chats?order=${orderId}`);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,23,42,0.55)',
          backdropFilter: 'blur(4px)',
          zIndex: 1100,
        }}
      />

      {/* Modal card */}
      <div style={{
        position: 'fixed',
        bottom: 24, right: 20,
        width: 'min(420px, calc(100vw - 32px))',
        zIndex: 1101,
        borderRadius: 20,
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        overflow: 'hidden',
        animation: 'supportModalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <style>{`
          @keyframes supportModalIn {
            from { opacity:0; transform:translateY(30px) scale(0.96); }
            to   { opacity:1; transform:none; }
          }
        `}</style>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)',
          padding: '16px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              position: 'relative',
            }}>
              <FiShield size={20} color="#fff" />
              {/* Online pulse */}
              <span style={{
                position: 'absolute', bottom: -2, right: -2,
                width: 10, height: 10, borderRadius: '50%',
                background: '#22c55e',
                border: '2px solid #6366f1',
                boxShadow: '0 0 0 3px rgba(34,197,94,0.3)',
              }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.97rem', color: '#fff' }}>
                {isKhmer ? 'ផ្នែកជំនួយ Saby Shop' : 'Saby Shop Support'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.8)' }}>
                {isKhmer ? ' អនឡាញ · ឆ្លើយតបភ្លាមៗ' : ' Online · replies instantly'}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          }}>
            <FiX size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 20px 20px' }}>
          {/* Order info pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16,
            background: 'rgba(99,102,241,0.09)',
            border: '1px solid rgba(99,102,241,0.22)',
            borderRadius: 20, padding: '4px 12px 4px 8px',
            fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)',
          }}>
            <FiPackage size={12} />
            {isKhmer ? 'ការបញ្ជាទិញ #' : 'Order #'}{orderId}{productName ? ` · ${productName}` : ''}
          </div>

          {/* Message bubble from support */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '4px 16px 16px 16px',
            padding: '13px 16px',
            fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text)',
            marginBottom: 18,
          }}>
            <span style={{ fontWeight: 700, color: 'var(--primary)', display: 'block', marginBottom: 4, fontSize: '0.8rem' }}>
              {isKhmer ? 'ផ្នែកជំនួយ Saby' : 'Saby Support'}
            </span>
            {isKhmer 
              ? `ជម្រាបសួរ! តើអ្នកត្រូវការជំនួយជាមួយការបញ្ជាទិញ${productName ? ` ${productName}` : ''}មែនទេ? បើកការសន្ទនាជំនួយ ហើយយើងនឹងជួយសម្រួលជូនភ្លាមៗ។`
              : `Hi there! Need help with your${productName ? ` ${productName}` : ''} order? Open the support chat and we'll assist you right away.`}
          </div>

          {/* CTA button */}
          <button onClick={handleOpenChat} style={{
            width: '100%', padding: '13px 20px',
            background: 'linear-gradient(135deg, var(--primary), #6366f1)',
            color: '#fff', border: 'none', borderRadius: 14,
            fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            <FiMessageSquare size={18} />
            {isKhmer ? 'បើកការសន្ទនាជំនួយ' : 'Open Support Chat'}
            <FiArrowRight size={16} />
          </button>

          <p style={{
            textAlign: 'center', marginTop: 10, fontSize: '0.72rem',
            color: 'var(--text-lighter)',
          }}>
            {isKhmer ? 'រាល់ការបញ្ជាទិញទាំងអស់របស់អ្នកស្ថិតក្នុងប្រព័ន្ធសន្ទនាតែមួយ' : 'All your orders are in one chat thread'}
          </p>
        </div>
      </div>
    </>
  );
};

export default SupportChatModal;
