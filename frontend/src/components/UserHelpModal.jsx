import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHelpCircle, FiX, FiChevronDown, FiMessageSquare, FiPackage, FiCreditCard, FiShield, FiCheckCircle } from 'react-icons/fi';
import { FaTelegram } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const UserHelpModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const { t, isKhmer } = useLanguage();

  if (!isOpen) return null;

  const isSeller = user?.role === 'SELLER';

  const faqs = [
    {
      question: t('helpCenter.q1'),
      answer: t('helpCenter.a1'),
      icon: FiPackage,
      color: '#10B981'
    },
    {
      question: t('helpCenter.q2'),
      answer: t('helpCenter.a2'),
      icon: FiCreditCard,
      color: '#3B82F6'
    },
    {
      question: t('helpCenter.q3'),
      answer: t('helpCenter.a3'),
      icon: FiShield,
      color: '#EC4899'
    },
    {
      question: t('helpCenter.q4'),
      answer: t('helpCenter.a4'),
      icon: FiCheckCircle,
      color: '#8B5CF6'
    }
  ];

  return (
    <div 
      className="modal-overlay animate-fade-in" 
      onClick={onClose}
      style={{ 
        zIndex: 9999, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '12px'
      }}
    >
      <div 
        className="modal animate-slide-up" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '500px',
          width: '100%',
          maxHeight: '88vh',
          overflowY: 'auto',
          position: 'relative',
          padding: '24px 18px',
          borderRadius: '20px',
          background: '#ffffff',
          boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
          margin: 'auto'
        }}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            background: 'var(--bg-secondary, #F1F5F9)',
            border: 'none',
            fontSize: '1.1rem',
            color: 'var(--text-light, #64748B)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            zIndex: 5
          }}
        >
          <FiX />
        </button>

        {/* Centered Header */}
        <div style={{ textAlign: 'center', marginBottom: '18px', paddingRight: '20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255,133,174,0.15), rgba(99,102,241,0.15))',
            color: '#FF4785',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            margin: '0 auto 10px auto',
            boxShadow: '0 4px 14px rgba(255,71,133,0.15)'
          }}>
            <FiHelpCircle />
          </div>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text, #0F172A)', margin: 0, lineHeight: 1.3 }}>
            {t('helpCenter.title')}
          </h3>
          <p style={{ color: 'var(--text-light, #64748B)', fontSize: '0.8rem', margin: '4px 0 0 0' }}>
            {t('helpCenter.subtitle')}
          </p>
        </div>

        {/* Quick Contact Buttons (3 Options: Website Chat, Telegram Account, Telegram Channel) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate(isSeller ? '/chat/seller-admin' : '/chat/user-admin');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '9px 8px',
              borderRadius: '12px',
              border: '1.5px solid #6366F1',
              color: '#4F46E5',
              fontSize: '0.78rem',
              fontWeight: 800,
              background: 'rgba(99, 102, 241, 0.08)',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <FiMessageSquare size={14} /> {isKhmer ? 'ជជែកវេបសាយ' : 'Live Chat'}
          </button>

          <a
            href="https://t.me/saby_shop_support"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '9px 8px',
              borderRadius: '12px',
              border: '1.5px solid #0088cc',
              color: '#0088cc',
              fontSize: '0.78rem',
              fontWeight: 800,
              textDecoration: 'none',
              background: 'rgba(0, 136, 204, 0.08)',
              whiteSpace: 'nowrap'
            }}
          >
            <FaTelegram size={14} /> {isKhmer ? 'Telegram ជំនួយ' : 'Telegram Bot'}
          </a>

          <a
            href="https://t.me/saby_shop_ceo"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '9px 8px',
              borderRadius: '12px',
              border: '1.5px solid #10B981',
              color: '#059669',
              fontSize: '0.78rem',
              fontWeight: 800,
              textDecoration: 'none',
              background: 'rgba(16, 185, 129, 0.08)',
              whiteSpace: 'nowrap'
            }}
          >
            <FaTelegram size={14} /> {isKhmer ? 'ឆានែលផ្លូវការ' : 'Channel'}
          </a>
        </div>

        {/* FAQs Accordion */}
        <div style={{ textAlign: 'left' }}>
          <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text, #0F172A)', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t('helpCenter.faqTitle')}
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {faqs.map((faq, idx) => {
              const IconComp = faq.icon;
              const isOpen = openFaqIndex === idx;

              return (
                <div
                  key={idx}
                  style={{
                    border: '1px solid var(--border-light, #E2E8F0)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                    background: '#ffffff'
                  }}
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: isOpen ? 'var(--primary-light, rgba(255,71,133,0.06))' : '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                      <IconComp size={15} style={{ color: faq.color, flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text, #0F172A)', lineHeight: 1.35, wordBreak: 'break-word' }}>
                        {faq.question}
                      </span>
                    </div>
                    <FiChevronDown 
                      size={16} 
                      style={{ 
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        color: 'var(--text-light, #64748B)',
                        flexShrink: 0
                      }} 
                    />
                  </button>

                  {isOpen && (
                    <div style={{ padding: '4px 12px 10px 12px', fontSize: '0.78rem', color: 'var(--text-light, #475569)', lineHeight: 1.5, borderTop: '1px solid var(--border-light, #F1F5F9)' }}>
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Action */}
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-light, #E2E8F0)', textAlign: 'center' }}>
          <button
            onClick={onClose}
            className="btn btn-outline btn-sm"
            style={{ padding: '9px 24px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, width: '100%', maxWidth: '240px' }}
          >
            {t('helpCenter.closeHelp')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserHelpModal;
