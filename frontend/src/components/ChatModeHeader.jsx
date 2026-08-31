import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  FiUser, FiShield, FiMessageSquare, FiHeadphones,
  FiInbox, FiTool, FiChevronDown, FiRefreshCw, FiZap,
  FiArrowRight, FiCheckCircle, FiCheck
} from 'react-icons/fi';
import { MdStorefront, MdVerified } from 'react-icons/md';

/**
 * Meta-Style Profile & Context Switcher Header for Chat
 * 
 * Inspired by Facebook / Meta Messenger & Meta Business Suite:
 * 1. Personal Account (Messenger Mode)
 *    - Chat with Stores you bought from & Saby Support
 *    - Strictly personal buyer identity
 * 2. Store Page (Page Inbox Mode)
 *    - Manage customer messages for your store's products
 *    - Reply as the Store Name & Store Logo
 */
const ChatModeHeader = ({
  activeMode = 'USER', // 'USER' (Personal) | 'SELLER' (Store Page) | 'ADMIN' (Admin Hub)
  activeSubTab = 'STORE', // 'STORE' | 'SUPPORT' | 'CUSTOMERS' | 'ADMIN_ALL'
  onModeChange,
  onSubTabChange,
  unreadUserSupport = 0,
  unreadSellerCustomers = 0,
  unreadSellerSupport = 0,
}) => {
  const { user, isAdmin } = useAuth();
  const { lang } = useLanguage();
  const isKhmer = lang === 'km';
  const navigate = useNavigate();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const sellerProfile = user?.sellerProfile;
  const isSeller = user?.role === 'SELLER' || Boolean(sellerProfile);
  const storeName = sellerProfile?.storeName || (user?.role === 'SELLER' ? `${user?.name}'s Store` : 'My Store');
  const storeLogo = sellerProfile?.storeLogoUrl || '';

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitchProfile = (newMode) => {
    setIsDropdownOpen(false);
    if (newMode === 'SELLER' && !isSeller) {
      navigate('/seller/onboard');
      return;
    }
    const modeKey = newMode === 'SELLER' ? 'seller' : newMode === 'ADMIN' ? 'admin' : 'buyer';
    localStorage.setItem('saby_active_chat_mode', modeKey);
    localStorage.setItem('saby_user_mode', modeKey);
    if (onModeChange) {
      onModeChange(newMode);
    }
  };

  const handleSubTab = (newTab) => {
    if (onSubTabChange) {
      onSubTabChange(newTab);
    }
  };

  const isPersonal = activeMode === 'USER';
  const isPage = activeMode === 'SELLER';
  const isAdminMode = activeMode === 'ADMIN';

  return (
    <div className="meta-chat-switcher-container" style={{
      background: 'var(--card-bg, #FFFFFF)',
      border: '1px solid var(--border, #E2E8F0)',
      borderRadius: '20px',
      padding: '18px 22px',
      marginBottom: '18px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }}>
      {/*  Top Bar: Meta-Style Active Identity Banner & Switch Button  */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 14,
        borderBottom: '1px solid var(--border-light, #F1F5F9)',
        paddingBottom: 14
      }}>
        {/* Active Profile Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Avatar */}
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: isPage ? '14px' : '50%',
              background: isPage
                ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                : isAdminMode
                ? 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)'
                : 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '1.1rem',
              boxShadow: isPage
                ? '0 4px 12px rgba(16, 185, 129, 0.35)'
                : isAdminMode
                ? '0 4px 12px rgba(99, 102, 241, 0.35)'
                : '0 4px 12px rgba(37, 99, 235, 0.35)',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              {isPage ? (
                storeLogo ? (
                  <img src={storeLogo} alt="Store Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                ) : (
                  <MdStorefront size={26} />
                )
              ) : isAdminMode ? (
                <FiShield size={24} />
              ) : (
                user?.avatar || user?.photoUrl ? (
                  <img src={user?.avatar || user?.photoUrl} alt="User Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                ) : (
                  (user?.name || user?.email || 'U').slice(0, 2).toUpperCase()
                )
              )}
            </div>
            {/* Small Badge overlay */}
            <div style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: isPage ? '#10B981' : isAdminMode ? '#6366F1' : '#3B82F6',
              border: '2px solid #FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 9
            }}>
              {isPage ? <MdStorefront size={11} /> : isAdminMode ? <FiShield size={10} /> : <FiUser size={10} />}
            </div>
          </div>

          {/* Profile Name & Current Context */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 900, fontSize: '1.02rem', color: 'var(--text, #0F172A)' }}>
                {isPage ? storeName : isAdminMode ? 'Platform Administration' : (user?.name || 'Personal Account')}
              </span>
              {isPage && <MdVerified size={16} color="#1d9bf0" title="Verified Store" />}
              <span style={{
                background: isPage ? '#ECFDF5' : isAdminMode ? '#EEF2FF' : '#EFF6FF',
                color: isPage ? '#059669' : isAdminMode ? '#4F46E5' : '#1D4ED8',
                border: isPage ? '1px solid #A7F3D0' : isAdminMode ? '1px solid #C7D2FE' : '1px solid #BFDBFE',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}>
                {isPage
                  ? (isKhmer ? 'ផេកហាងផ្លូវការ (Page Mode)' : 'Page Mode')
                  : isAdminMode
                  ? (isKhmer ? 'Admin Platform' : 'Admin Platform')
                  : (isKhmer ? 'គណនីផ្ទាល់ខ្លួន (Personal)' : 'Personal Profile')}
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-light, #64748B)', marginTop: 2 }}>
              {isPage
                ? (isKhmer ? `គ្រប់គ្រងសារពីអតិថិជនរបស់ហាង ${storeName}` : `Replying to customer inquiries as ${storeName}`)
                : isAdminMode
                ? (isKhmer ? 'គ្រប់គ្រងសារសំបុត្រទាំងអស់ និងដោះស្រាយវិវាទ' : 'Managing customer support tickets & order mediation')
                : (isKhmer ? 'ជជែកជាមួយហាងដែលអ្នកបានទិញ និងសុំជំនួយពី Admin' : 'Messaging stores you purchased from & Saby Support')}
            </div>
          </div>
        </div>

        {/* Profile Switcher Dropdown (Like Facebook "Switch Profile") */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(prev => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: '12px',
              border: '1.5px solid var(--border, #E2E8F0)',
              background: 'var(--bg-secondary, #F8FAFC)',
              color: 'var(--text, #0F172A)',
              fontSize: '0.84rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              transition: 'all 0.18s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#3B82F6'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border, #E2E8F0)'; }}
          >
            <FiRefreshCw size={14} color="#6366F1" />
            <span>{isKhmer ? 'ប្តូរ Profile / Switch' : 'Switch Profile'}</span>
            <FiChevronDown size={14} style={{ opacity: 0.6, transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
          </button>

          {/* Switcher Dropdown Menu */}
          {isDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 290,
              background: 'var(--card-bg, #FFFFFF)',
              border: '1px solid var(--border, #E2E8F0)',
              borderRadius: '16px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
              padding: '8px',
              zIndex: 9999,
              animation: 'adminMsgSlideRight 0.2s ease both'
            }}>
              <div style={{ padding: '6px 10px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light, #64748B)', textTransform: 'uppercase' }}>
                {isKhmer ? 'ជ្រើសរើសអត្តសញ្ញាណជជែក' : 'Select Chat Identity'}
              </div>

              {/* Option 1: Personal Account */}
              <div
                onClick={() => handleSwitchProfile('USER')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: isPersonal ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                  border: isPersonal ? '1px solid #BFDBFE' : '1px solid transparent',
                  marginBottom: 4,
                  transition: 'background .15s'
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', background: '#3B82F6', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0
                }}>
                  <FiUser size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.84rem', color: 'var(--text, #0F172A)' }}>
                    {user?.name || 'Personal Account'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                    {isKhmer ? 'គណនីផ្ទាល់ខ្លួន (ទិញទំនិញ)' : 'Personal (Buyer chats)'}
                  </div>
                </div>
                {isPersonal && <FiCheck size={16} color="#3B82F6" />}
              </div>

              {/* Option 2: Store Page Profile */}
              <div
                onClick={() => handleSwitchProfile('SELLER')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: isPage ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                  border: isPage ? '1px solid #A7F3D0' : '1px solid transparent',
                  marginBottom: 4,
                  transition: 'background .15s'
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: '10px', background: '#10B981', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0
                }}>
                  <MdStorefront size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.84rem', color: 'var(--text, #0F172A)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {storeName}
                    <MdVerified size={13} color="#1d9bf0" />
                  </div>
                  <div style={{ fontSize: '0.7rem', color: isSeller ? '#059669' : '#D97706' }}>
                    {isSeller
                      ? (isKhmer ? 'ផេកហាង (ឆ្លើយតបអតិថិជន)' : 'Store Page (Customer inbox)')
                      : (isKhmer ? 'បើកហាង ($2.50/ខែ)' : 'Open store ($2.50/mo)')}
                  </div>
                </div>
                {isPage && <FiCheck size={16} color="#10B981" />}
              </div>

              {/* Option 3: Admin Hub (Only if admin) */}
              {isAdmin && (
                <div
                  onClick={() => handleSwitchProfile('ADMIN')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: isAdminMode ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                    border: isAdminMode ? '1px solid #C7D2FE' : '1px solid transparent',
                    transition: 'background .15s'
                  }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', background: '#6366F1', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0
                  }}>
                    <FiShield size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.84rem', color: 'var(--text, #0F172A)' }}>
                      Platform Admin
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#6366F1' }}>
                      {isKhmer ? 'ផ្ទាំងគ្រប់គ្រងសំបុត្រទាំងអស់' : 'All support & disputes'}
                    </div>
                  </div>
                  {isAdminMode && <FiCheck size={16} color="#6366F1" />}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/*  Sub-Tabs based on Current Active Profile  */}

      {/* 1. PERSONAL MESSENGER TABS */}
      {isPersonal && (
        <div style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {/* Purchases with stores */}
            <button
              type="button"
              onClick={() => handleSubTab('STORE')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 18px',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: 800,
                cursor: 'pointer',
                border: activeSubTab === 'STORE' ? '1.5px solid #2563EB' : '1px solid var(--border, #E2E8F0)',
                background: activeSubTab === 'STORE' ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : 'var(--card-bg, #FFFFFF)',
                color: activeSubTab === 'STORE' ? '#FFFFFF' : 'var(--text, #334155)',
                boxShadow: activeSubTab === 'STORE' ? '0 3px 12px rgba(37, 99, 235, 0.28)' : 'none',
                transition: 'all 0.18s ease'
              }}
            >
              <MdStorefront size={16} />
              <span>{isKhmer ? 'ហាងដែលបានទិញ (Store Chats)' : 'Store Purchases'}</span>
            </button>

            {/* Saby Support */}
            <button
              type="button"
              onClick={() => handleSubTab('SUPPORT')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 18px',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: 800,
                cursor: 'pointer',
                border: activeSubTab === 'SUPPORT' ? '1.5px solid #6366F1' : '1px solid var(--border, #E2E8F0)',
                background: activeSubTab === 'SUPPORT' ? 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' : 'var(--card-bg, #FFFFFF)',
                color: activeSubTab === 'SUPPORT' ? '#FFFFFF' : 'var(--text, #334155)',
                boxShadow: activeSubTab === 'SUPPORT' ? '0 3px 12px rgba(99, 102, 241, 0.28)' : 'none',
                transition: 'all 0.18s ease'
              }}
            >
              <FiHeadphones size={16} />
              <span>{isKhmer ? 'ជំនួយពី Admin (Saby Helpdesk)' : 'Saby Helpdesk'}</span>
              {unreadUserSupport > 0 && (
                <span style={{ background: '#EF4444', color: '#fff', fontSize: '0.68rem', padding: '1px 6px', borderRadius: 99, fontWeight: 900 }}>
                  {unreadUserSupport}
                </span>
              )}
            </button>
          </div>

          <span style={{ fontSize: '0.74rem', color: 'var(--text-light, #64748B)', fontWeight: 600 }}>
            {isKhmer ? 'ជជែកក្នុងនាមជាអ្នកទិញផ្ទាល់ខ្លួន' : 'Messaging as a Personal Buyer'}
          </span>
        </div>
      )}

      {/* 2. STORE PAGE INBOX TABS */}
      {isPage && (
        <div style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'space-between'
        }}>
          {isSeller ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {/* Customer Sales Inbox */}
              <button
                type="button"
                onClick={() => handleSubTab('CUSTOMERS')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '8px 18px',
                  borderRadius: '12px',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: activeSubTab === 'CUSTOMERS' ? '1.5px solid #10B981' : '1px solid var(--border, #E2E8F0)',
                  background: activeSubTab === 'CUSTOMERS' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'var(--card-bg, #FFFFFF)',
                  color: activeSubTab === 'CUSTOMERS' ? '#FFFFFF' : 'var(--text, #334155)',
                  boxShadow: activeSubTab === 'CUSTOMERS' ? '0 3px 12px rgba(16, 185, 129, 0.28)' : 'none',
                  transition: 'all 0.18s ease'
                }}
              >
                <FiInbox size={16} />
                <span>{isKhmer ? 'សារពីអតិថិជន (Customer Inbox)' : 'Customer Inquiries'}</span>
                {unreadSellerCustomers > 0 && (
                  <span style={{ background: '#EF4444', color: '#fff', fontSize: '0.68rem', padding: '1px 6px', borderRadius: 99, fontWeight: 900 }}>
                    {unreadSellerCustomers}
                  </span>
                )}
              </button>

              {/* Seller Support */}
              <button
                type="button"
                onClick={() => handleSubTab('SUPPORT')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '8px 18px',
                  borderRadius: '12px',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: activeSubTab === 'SUPPORT' ? '1.5px solid #0EA5E9' : '1px solid var(--border, #E2E8F0)',
                  background: activeSubTab === 'SUPPORT' ? 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)' : 'var(--card-bg, #FFFFFF)',
                  color: activeSubTab === 'SUPPORT' ? '#FFFFFF' : 'var(--text, #334155)',
                  boxShadow: activeSubTab === 'SUPPORT' ? '0 3px 12px rgba(14, 165, 233, 0.28)' : 'none',
                  transition: 'all 0.18s ease'
                }}
              >
                <FiTool size={16} />
                <span>{isKhmer ? 'ជំនួយហាងពី Admin (Seller VIP Line)' : 'Seller Support'}</span>
                {unreadSellerSupport > 0 && (
                  <span style={{ background: '#EF4444', color: '#fff', fontSize: '0.68rem', padding: '1px 6px', borderRadius: 99, fontWeight: 900 }}>
                    {unreadSellerSupport}
                  </span>
                )}
              </button>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              background: '#FFFBEB',
              border: '1px solid #FCD34D',
              padding: '10px 16px',
              borderRadius: '12px',
              gap: 10,
              flexWrap: 'wrap'
            }}>
              <div style={{ fontSize: '0.84rem', color: '#92400E', fontWeight: 700 }}>
                {isKhmer ? 'គណនីរបស់អ្នកមិនទាន់បានបើកផេកហាងលក់នៅឡើយទេ។ ចុះឈ្មោះបើកហាងឥឡូវនេះដើម្បីទទួលបាន Customer Inbox!' : 'You do not have a Store Page registered yet. Open your store to access customer messages!'}
              </div>
              <button
                type="button"
                onClick={() => navigate('/seller/onboard')}
                style={{
                  background: '#D97706',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  padding: '8px 16px',
                  cursor: 'pointer'
                }}
              >
                {isKhmer ? 'ចុះឈ្មោះបើកហាង $2.50/ខែ' : 'Open Store Page'}
              </button>
            </div>
          )}

          {isSeller && (
            <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700 }}>
              {isKhmer ? `ឆ្លើយតបក្នុងនាមជាហាង ${storeName}` : `Acting as official merchant`}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatModeHeader;
