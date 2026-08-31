import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiMessageSquare, FiX, FiExternalLink, FiHeadphones, FiRadio, FiShield, FiChevronRight } from 'react-icons/fi';
import { FaTelegram } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

/**
 * ContactAdminModal
 * Allows sellers & buyers to choose how they wish to contact Admin:
 * 1. Website Live Support Chat (User Support or Seller VIP Support)
 * 2. Telegram Support Account (@saby_shop_support)
 * 3. Official Telegram Channel (@saby_shop_ceo)
 */
const ContactAdminModal = ({ isOpen, onClose, mode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isKhmer } = useLanguage();

  if (!isOpen) return null;

  const isSellerContext = mode === 'seller' || user?.role === 'SELLER' || location.pathname.startsWith('/seller');

  const telegramUsername = 'saby_shop_support';
  const telegramUrl = `https://t.me/${telegramUsername}`;
  const telegramChannelUrl = 'https://t.me/saby_shop_ceo';

  const handleWebsiteLiveChat = () => {
    onClose();
    if (isSellerContext) {
      navigate('/chat/seller-admin');
    } else {
      navigate('/chat/user-admin');
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal animate-slide-up"
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'var(--card-bg, #ffffff)',
          borderRadius: '24px',
          padding: '24px 20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          border: '1px solid var(--border)',
          overflow: 'hidden'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'var(--bg-secondary, #f1f5f9)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-light)',
            transition: 'all 0.2s ease'
          }}
          aria-label="Close"
        >
          <FiX size={18} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', paddingRight: '28px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)'
            }}
          >
            <FiHeadphones size={26} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)' }}>
              {isKhmer ? 'ទាក់ទងទៅកាន់ Admin' : 'Contact Admin Support'}
            </h3>
            <div style={{ fontSize: '0.78rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', fontWeight: 700 }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
              {isKhmer ? 'ជំនួយអនឡាញ ២៤/៧ · ឆ្លើយតបរហ័ស' : 'Online 24/7 · Fast Assistance'}
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {isKhmer ? 'សូមជ្រើសរើសមធ្យោបាយទំនាក់ទំនង' : 'Select Contact Channel'}
        </div>

        {/* Channels List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
          
          {/* OPTION 1: Website Live Support Chat */}
          <button
            type="button"
            onClick={handleWebsiteLiveChat}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px 16px',
              borderRadius: '16px',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1.5px solid #6366F1',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
            className="contact-channel-card"
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}
            >
              <FiMessageSquare size={22} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text)' }}>
                  {isKhmer ? 'ជជែកលើវេបសាយ (Live Chat)' : 'Live Chat on Website'}
                </span>
                <span style={{ background: '#EEF2FF', color: '#4F46E5', fontSize: '0.68rem', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', border: '1px solid #C7D2FE' }}>
                  {isKhmer ? 'ណែនាំ' : 'Recommended'}
                </span>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-light)', marginTop: '2px' }}>
                {isKhmer ? 'ជជែកផ្ទាល់ជាមួយ Admin ក្នុងប្រព័ន្ធ Saby Shop' : 'Instant in-app messaging with Admin'}
              </div>
            </div>
            <FiChevronRight size={18} color="#6366F1" />
          </button>

          {/* OPTION 2: Telegram Personal Account / Admin Support */}
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px 16px',
              borderRadius: '16px',
              background: 'rgba(42, 171, 238, 0.08)',
              border: '1.5px solid rgba(42, 171, 238, 0.35)',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
            className="contact-channel-card"
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2AABEE 0%, #229ED9 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(42, 171, 238, 0.3)'
              }}
            >
              <FaTelegram size={24} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text, #0F172A)' }}>
                {isKhmer ? 'គណនី Telegram ផ្ទាល់ខ្លួន Admin (Personal Chat)' : 'Admin Personal Telegram Support'}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#0088cc', marginTop: '2px', fontWeight: 700 }}>
                @{telegramUsername} — {isKhmer ? 'ផ្ញើសារផ្ទាល់ជាមួយ Admin' : 'Direct Message Admin'}
              </div>
            </div>
            <FiExternalLink size={16} color="#0088cc" />
          </a>

          {/* OPTION 3: Official Telegram Channel */}
          <a
            href={telegramChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px 16px',
              borderRadius: '16px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1.5px solid rgba(16, 185, 129, 0.35)',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
            className="contact-channel-card"
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              <FiRadio size={22} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text, #0F172A)' }}>
                {isKhmer ? 'ចូលរួមឆានែល Telegram ផ្លូវការ (Join Channel)' : 'Official Telegram Channel'}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#059669', marginTop: '2px', fontWeight: 700 }}>
                @saby_shop_ceo — {isKhmer ? 'ទទួលព័ត៌មាន & ប្រូម៉ូសិនថ្មីៗ' : 'News, Announcements & Promos'}
              </div>
            </div>
            <FiExternalLink size={16} color="#10B981" />
          </a>

        </div>

        {/* Footer Guarantee Note */}
        <div
          style={{
            padding: '10px 14px',
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.74rem',
            color: 'var(--text-light)'
          }}
        >
          <FiShield size={16} color="#10b981" style={{ flexShrink: 0 }} />
          <span>
            {isKhmer
              ? 'ជំនួយអ្នកលក់ និងដំណោះស្រាយបញ្ហាត្រូវបានធានាដោយ Saby Shop'
              : 'Seller support & dispute solutions are guaranteed by Saby Shop'}
          </span>
        </div>

        <style>{`
          .contact-channel-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
            border-color: #6366f1 !important;
          }
        `}</style>
      </div>
    </div>
  );
};

export default ContactAdminModal;
