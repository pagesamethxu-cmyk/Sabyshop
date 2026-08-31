import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaTelegram } from 'react-icons/fa';
import { FiMessageSquare, FiX, FiExternalLink, FiHeadphones, FiRadio, FiShield, FiChevronRight } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const TelegramSupportButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isKhmer, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const widgetRef = useRef(null);

  const isSellerUser = user?.role === 'SELLER' || location.pathname.startsWith('/seller');

  const telegramUsername = 'saby_shop_support';
  const telegramUrl = `https://t.me/${telegramUsername}`;
  const telegramChannelUrl = 'https://t.me/saby_shop_ceo';

  // Show only on Home page ('/') and Profile / Account pages ('/account', '/profile', '/seller/profile/*')
  const isHomePage = location.pathname === '/';
  const isProfilePage = location.pathname === '/account' || location.pathname === '/profile' || location.pathname.startsWith('/seller/profile');

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleWebsiteLiveChat = () => {
    setIsOpen(false);
    if (isSellerUser) {
      navigate('/chat/seller-admin');
    } else {
      navigate('/chat/user-admin');
    }
  };

  // Do not render anything if not on Home or Profile/Account page
  if (!isHomePage && !isProfilePage) {
    return null;
  }

  return (
    <div
      ref={widgetRef}
      className="telegram-fab-container"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px'
      }}
    >
      {/*  Contact / Support Options Menu  */}
      {isOpen && (
        <div
          className="animate-slide-up"
          style={{
            width: '320px',
            background: 'var(--card-bg, #ffffff)',
            borderRadius: '20px',
            boxShadow: '0 15px 40px rgba(0, 0, 0, 0.22)',
            border: '1px solid var(--border)',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            marginBottom: '4px'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light, #f1f5f9)', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366F1, #4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <FiHeadphones size={17} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text)' }}>
                  {isKhmer ? 'ជំនួយពី Admin' : 'Admin Support'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                  {isKhmer ? 'អនឡាញ ២៤/៧' : 'Online 24/7'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'var(--bg-secondary, #f8fafc)',
                border: 'none',
                borderRadius: '50%',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-light)'
              }}
              title="Close"
            >
              <FiX size={14} />
            </button>
          </div>

          {/* Option 1: Live Chat on Website */}
          <button
            type="button"
            onClick={handleWebsiteLiveChat}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '14px',
              background: 'rgba(99, 102, 241, 0.06)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.18s ease'
            }}
            className="support-popup-item"
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FiMessageSquare size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--text)' }}>
                {isKhmer ? 'ជជែកក្នុងវេបសាយ' : 'Chat on Website'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: '1px' }}>
                {isKhmer ? 'ជំនួយផ្ទាល់លើវេបសាយ (Live Help)' : 'In-app support desk'}
              </div>
            </div>
            <FiChevronRight size={16} color="#6366F1" />
          </button>

          {/* Option 2: Telegram Support Account */}
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '14px',
              background: 'rgba(0, 136, 204, 0.06)',
              border: '1px solid rgba(0, 136, 204, 0.25)',
              textDecoration: 'none',
              transition: 'all 0.18s ease'
            }}
            className="support-popup-item"
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #2AABEE, #229ED9)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FaTelegram size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--text)' }}>
                {isKhmer ? 'គណនី Telegram ជំនួយ' : 'Telegram Support'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#0088cc', fontWeight: 700, marginTop: '1px' }}>
                @{telegramUsername}
              </div>
            </div>
            <FiExternalLink size={15} color="#0088cc" />
          </a>

          {/* Option 3: Official Telegram Channel */}
          <a
            href={telegramChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '14px',
              background: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              textDecoration: 'none',
              transition: 'all 0.18s ease'
            }}
            className="support-popup-item"
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FiRadio size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--text)' }}>
                {isKhmer ? 'ឆានែល Telegram ផ្លូវការ' : 'Official Telegram Channel'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, marginTop: '1px' }}>
                @saby_shop_ceo
              </div>
            </div>
            <FiExternalLink size={15} color="#10B981" />
          </a>
        </div>
      )}

      {/* Helper tooltip badge (when menu is closed) */}
      {showTooltip && !isOpen && (
        <div
          className="animate-slide-up"
          style={{
            background: 'var(--card-bg, #ffffff)',
            color: 'var(--text)',
            padding: '8px 12px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            border: '1px solid var(--border-light, #e2e8f0)',
            fontSize: '0.82rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            maxWidth: '240px'
          }}
        >
          <span>{isKhmer ? 'ត្រូវការជំនួយ? ទាក់ទងយើង!' : 'Need help? Contact Admin!'}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-light)',
              display: 'flex',
              alignItems: 'center',
              padding: '2px'
            }}
            title="Dismiss"
          >
            <FiX size={13} />
          </button>
        </div>
      )}

      {/* Main Floating Action Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setShowTooltip(false);
        }}
        className="telegram-fab"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 20px',
          borderRadius: '50px',
          background: isOpen ? 'linear-gradient(135deg, #1E293B, #0F172A)' : 'linear-gradient(135deg, #2AABEE 0%, #229ED9 100%)',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(42, 171, 238, 0.45)',
          fontWeight: 800,
          fontSize: '0.95rem',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {isOpen ? (
          <>
            <FiX size={22} style={{ flexShrink: 0 }} />
            <span>{isKhmer ? 'បិទ' : 'Close'}</span>
          </>
        ) : (
          <>
            <FaTelegram size={24} style={{ flexShrink: 0 }} />
            <span>{isKhmer ? 'ជំនួយ Admin' : 'Contact'}</span>
          </>
        )}
      </button>

      <style>{`
        .telegram-fab:hover {
          transform: translateY(-3px) scale(1.03);
          box-shadow: 0 12px 28px rgba(42, 171, 238, 0.55) !important;
        }
        .support-popup-item:hover {
          transform: translateX(-3px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        @media (max-width: 768px) {
          .telegram-fab-container {
            bottom: 74px !important;
            right: 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default TelegramSupportButton;
