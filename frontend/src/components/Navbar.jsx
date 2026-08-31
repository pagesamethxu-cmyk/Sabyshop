import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { 
 FiShoppingCart, FiMenu, FiX, FiUser, FiChevronDown, 
 FiShoppingBag, FiShield, FiLogOut, FiZap, FiHome, FiGrid, FiInfo, FiMail, FiHelpCircle,
 FiMapPin, FiCheck, FiMessageSquare, FiGlobe, FiBell
} from 'react-icons/fi';
import { MdStorefront } from 'react-icons/md';
import { FaTelegram } from 'react-icons/fa';
import CartDrawer from './CartDrawer';
import ConfirmLogoutModal from './ConfirmLogoutModal';
import ConfirmModeSwitchModal from './ConfirmModeSwitchModal';
import UserHelpModal from './UserHelpModal';
import AnnouncementBar from './AnnouncementBar';
import { notifications as notifApi } from '../api/client';

const Navbar = () => {
 const { isAuthenticated, isAdmin, logout, user } = useAuth();
 const { totalItems } = useCart();
 const { lang, setLang, t, isKhmer } = useLanguage();
 const location = useLocation();
 const navigate = useNavigate();

 const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
 const [isCartOpen, setIsCartOpen] = useState(false);
 const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
 const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
 const [isProfileOpen, setIsProfileOpen] = useState(false);
 const [isSellerSwitchModalOpen, setIsSellerSwitchModalOpen] = useState(false);
 const [selectedLocation, setSelectedLocation] = useState('Phnom Penh');
 const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
 const [notificationsList, setNotificationsList] = useState([]);
 const [unreadNotifCount, setUnreadNotifCount] = useState(0);
 const [isNotifOpen, setIsNotifOpen] = useState(false);
 const profileRef = useRef(null);
 const notifRef = useRef(null);

 const telegramUsername = 'saby_shop_support';
 const telegramUrl = `https://t.me/${telegramUsername}`;

 const handleLogoutConfirm = () => {
 logout();
 setIsLogoutModalOpen(false);
 setIsMobileMenuOpen(false);
 setIsProfileOpen(false);
 };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  const loadNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const [listRes, countRes] = await Promise.all([
        notifApi.getAll().catch(() => ({ data: [] })),
        notifApi.getUnreadCount().catch(() => ({ data: { count: 0 } }))
      ]);
      const notifs = Array.isArray(listRes.data) ? listRes.data : (listRes.data?.data || []);
      setNotificationsList(notifs);
      setUnreadNotifCount(countRes.data?.count || countRes.data?.data?.count || 0);
    } catch (e) {
      console.warn("Error loading notifications:", e);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [isAuthenticated, location.pathname]);

  const handleMarkNotifRead = async (notifId, link) => {
    try {
      await notifApi.markAsRead(notifId);
      setNotificationsList(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n));
      setUnreadNotifCount(prev => Math.max(0, prev - 1));
      if (link) {
        setIsNotifOpen(false);
        navigate(link);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      await notifApi.markAllAsRead();
      setNotificationsList(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadNotifCount(0);
    } catch (e) {
      console.error(e);
    }
  };

 // Close mobile menu on route change
 useEffect(() => {
 setIsMobileMenuOpen(false);
 }, [location.pathname]);

 const getInitials = (name) => {
 if (!name) return 'U';
 return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
 };

 const navLinks = [
 { label: t('nav.home'), path: '/', icon: FiHome },
 { label: t('nav.store'), path: '/store', icon: FiGrid },
 { label: t('nav.howToBuy'), path: '/how-to-buy', icon: FiHelpCircle },
 { label: t('nav.about'), path: '/about', icon: FiInfo },
 { label: t('nav.contact'), path: '/contact', icon: FiMail },
 { label: t('nav.help'), path: '#help', icon: FiHelpCircle, isHelp: true },
 ];

 const isActive = (path) => {
 if (path === '/' && location.pathname === '/') return true;
 if (path !== '/' && path !== '#help' && location.pathname.startsWith(path)) return true;
 return false;
 };

 // Language toggle button with Icon and Language Word
 const LangToggle = ({ isMobile = false }) => (
 <button
 onClick={() => {
 if (isMobile) setIsMobileMenuOpen(false);
 setLang(lang === 'km' ? 'en' : 'km');
 }}
 title={lang === 'km' ? 'Switch to English' : 'ប្ដូរទៅភាសាខ្មែរ'}
 className="navbar-lang-toggle-btn"
 style={{
 display: 'inline-flex',
 alignItems: 'center',
 gap: '7px',
 background: 'var(--bg-secondary)',
 border: '1.5px solid var(--border)',
 borderRadius: '20px',
 padding: isMobile ? '10px 16px' : '6px 14px',
 cursor: 'pointer',
 fontSize: isMobile ? '0.92rem' : '0.82rem',
 fontWeight: 800,
 color: 'var(--text)',
 transition: 'var(--transition)',
 width: isMobile ? '100%' : 'auto',
 justifyContent: isMobile ? 'center' : 'flex-start',
 boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)'
 }}
 >
 <FiGlobe size={16} color="var(--primary, #FF4785)" />
 <span>{lang === 'km' ? 'ភាសាខ្មែរ' : 'English'}</span>
 </button>
 );

 return (
 <>
 <header className="navbar-header" style={{
 position: 'fixed',
 top: 0,
 left: 0,
 right: 0,
 width: '100%',
 zIndex: 1000,
 background: 'rgba(255, 255, 255, 0.95)',
 backdropFilter: 'blur(16px)',
 WebkitBackdropFilter: 'blur(16px)',
 borderBottom: '1px solid var(--border)',
 boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
 transition: 'var(--transition)'
 }}>
 <div className="container" style={{
 display: 'flex',
 justifyContent: 'space-between',
 alignItems: 'center',
 height: '70px'
 }}>
 {/* Brand Logo */}
 <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
   <span style={{
     fontSize: '1.4rem',
     fontWeight: 800,
     letterSpacing: '-0.02em',
     color: '#FF85AE',
     whiteSpace: 'nowrap'
   }} className="navbar-brand-text">
     Saby Shop
   </span>
 </Link>

 {/* Desktop Nav Links */}
 <nav className="desktop-nav-links">
 {navLinks.map((link) => {
 if (link.isHelp) {
 return (
 <button
 key={link.label}
 onClick={() => setIsHelpModalOpen(true)}
 className="nav-link-item"
 style={{ background: 'none', border: 'none', cursor: 'pointer' }}
 >
 {link.label}
 </button>
 );
 }

 const active = isActive(link.path);
 return (
 <Link
 key={link.path}
 to={link.path}
 className={`nav-link-item ${active ? 'active' : ''}`}
 >
 {link.label}
 </Link>
 );
 })}
 {isAuthenticated && (
 <Link
 to="/orders"
 className={`nav-link-item ${isActive('/orders') ? 'active' : ''}`}
 >
 {t('nav.orders')}
 </Link>
 )}
 {isAdmin && (
 <Link
 to="/admin"
 className={`nav-link-item admin-badge-link ${isActive('/admin') ? 'active' : ''}`}
 >
 {t('nav.admin')}
 </Link>
 )}
 </nav>

 {/* Action Buttons: Become Seller + Lang + Cart + Auth + Hamburger */}
 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>

 {/* Become a Seller Icon Link Pill */}
 <Link
 to={!user ? '/login?redirect=/seller/onboard' : (user.role === 'SELLER' ? '/seller' : '/seller/onboard')}
 onClick={(e) => {
 if (!user) {
 e.preventDefault();
 navigate('/login?redirect=/seller/onboard');
 return;
 }
 if (user.role === 'SELLER') {
 e.preventDefault();
 setIsSellerSwitchModalOpen(true);
 }
 }}
 title={user?.role === 'SELLER' ? 'My Store Dashboard' : 'Become a Seller'}
 className="navbar-become-seller-btn"
 id="navbar-become-seller-btn"
 >
 <MdStorefront size={19} color="#6366F1" style={{ flexShrink: 0 }} />
 <span className="navbar-seller-label">{user?.role === 'SELLER' ? 'Dashboard' : 'Become a Seller'}</span>
 </Link>

 {/* Language Switcher (Desktop) */}
 <div className="desktop-lang-toggle">
 <LangToggle />
 </div>

  {/* Notification Bell & Dropdown (Table 27: notifications) */}
  {isAuthenticated && (
    <div style={{ position: 'relative' }} ref={notifRef}>
      <button
        className="icon-button"
        onClick={() => setIsNotifOpen(!isNotifOpen)}
        aria-label="Notifications"
        title={lang === 'km' ? "ការជូនដំណឹង" : "Notifications"}
        style={{
          position: 'relative',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          width: '42px',
          height: '42px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: unreadNotifCount > 0 ? '#F59E0B' : 'var(--text)',
          transition: 'var(--transition)'
        }}
      >
        <FiBell size={19} />
        {unreadNotifCount > 0 && (
          <span className="cart-badge-count" style={{ background: '#F59E0B' }}>
            {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Window */}
      {isNotifOpen && (
        <div
          className="profile-dropdown-menu animate-slide-up"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 10px)',
            width: '340px',
            maxHeight: '420px',
            overflowY: 'auto',
            background: 'var(--card-bg, #1e293b)',
            border: '1px solid var(--border, rgba(255,255,255,0.1))',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            zIndex: 1000,
            padding: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--border-light, rgba(255,255,255,0.08))', marginBottom: '8px' }}>
            <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text, #fff)', display: 'inline-flex', alignItems: 'center' }}>
              <FiBell size={14} style={{ marginRight: 6 }} /> {lang === 'km' ? 'ការជូនដំណឹង' : 'Notifications'} ({unreadNotifCount})
            </span>
            {unreadNotifCount > 0 && (
              <button
                onClick={handleMarkAllNotifsRead}
                style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: '#38BDF8', cursor: 'pointer', fontWeight: 700 }}
              >
                {lang === 'km' ? 'សម្គាល់ថាបានអានទាំងអស់' : 'Mark all read'}
              </button>
            )}
          </div>

          {notificationsList.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-light, #94a3b8)', fontSize: '0.85rem' }}>
              {lang === 'km' ? 'មិនមានការជូនដំណឹងថ្មីទេ' : 'No notifications yet'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notificationsList.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkNotifRead(n.id, n.link)}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    background: n.isRead ? 'rgba(255,255,255,0.02)' : 'rgba(56, 189, 248, 0.08)',
                    borderLeft: n.isRead ? '3px solid transparent' : '3px solid #38BDF8',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text, #fff)', marginBottom: '2px' }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-light, #94a3b8)', lineHeight: 1.4 }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-lighter, #64748b)', marginTop: '4px' }}>
                    {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )}

 {/* Cart Icon */}
 <button
 className="icon-button cart-btn"
 onClick={() => setIsCartOpen(true)}
 aria-label="View Shopping Cart"
 style={{
 position: 'relative',
 background: 'var(--bg-secondary)',
 border: '1px solid var(--border)',
 borderRadius: '12px',
 width: '42px',
 height: '42px',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 cursor: 'pointer',
 color: 'var(--text)',
 transition: 'var(--transition)'
 }}
 >
 <FiShoppingCart size={19} />
 {totalItems > 0 && (
 <span className="cart-badge-count">
 {totalItems > 99 ? '99+' : totalItems}
 </span>
 )}
 </button>

 {/* Desktop Auth / Profile Dropdown */}
 <div className="desktop-profile-wrapper" ref={profileRef}>
 {isAuthenticated ? (
 <div style={{ position: 'relative' }}>
 <button
 onClick={() => setIsProfileOpen(!isProfileOpen)}
 style={{
 display: 'flex',
 alignItems: 'center',
 gap: '8px',
 background: 'var(--bg-secondary)',
 border: '1px solid var(--border)',
 padding: '5px 12px 5px 6px',
 borderRadius: 'var(--radius-full)',
 cursor: 'pointer',
 transition: 'var(--transition)'
 }}
 >
 <div style={{
 width: '32px',
 height: '32px',
 borderRadius: '50%',
 background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
 color: 'white',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 fontWeight: 800,
 fontSize: '0.85rem',
 overflow: 'hidden'
 }}>
 {(user?.avatar || user?.photo || user?.photoUrl || localStorage.getItem(`userPhoto_${user?.id || user?.email}`) || localStorage.getItem('userPhoto')) ? (
 <img
 src={user?.avatar || user?.photo || user?.photoUrl || localStorage.getItem(`userPhoto_${user?.id || user?.email}`) || localStorage.getItem('userPhoto')}
 alt="Profile"
 style={{ width: '100%', height: '100%', objectFit: 'cover' }}
 />
 ) : (
 getInitials(user?.name)
 )}
 </div>
 <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>
 {user?.name || t('nav.account')}
 </span>
 <FiChevronDown style={{
 transform: isProfileOpen ? 'rotate(180deg)' : 'rotate(0deg)',
 transition: 'transform 0.2s',
 color: 'var(--text-light)'
 }} />
 </button>

 {/* Profile Dropdown */}
 {isProfileOpen && (
 <div className="profile-dropdown-menu animate-slide-up">
 <Link
 to="/account"
 onClick={() => setIsProfileOpen(false)}
 style={{
 display: 'block',
 padding: '10px 12px',
 borderBottom: '1px solid var(--border-light)',
 textDecoration: 'none',
 borderRadius: '8px',
 transition: 'background 0.2s'
 }}
 >
 <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text)' }}>{user?.name || t('nav.account')}</div>
 <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', wordBreak: 'break-all' }}>{user?.email}</div>
 {isAdmin && (
 <span className="badge badge-info" style={{ marginTop: '6px', fontSize: '0.7rem' }}>
 <FiShield style={{ marginRight: '3px' }} /> {t('nav.adminAccess')}
 </span>
 )}
 </Link>

 <Link
 to="/account"
 onClick={() => setIsProfileOpen(false)}
 className="dropdown-link-item"
 >
 <FiUser color="var(--primary)" /> {lang === 'km' ? 'គណនីរបស់ខ្ញុំ' : 'My Profile'}
 </Link>

 {user?.role === 'SELLER' && (
 <button
 onClick={() => {
 setIsProfileOpen(false);
 setIsSellerSwitchModalOpen(true);
 }}
 className="dropdown-link-item"
 style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981', fontWeight: 800, border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
 >
 <MdStorefront color="#10b981" size={18} /> {lang === 'km' ? 'ផ្ទាំងគ្រប់គ្រងអ្នកលក់' : 'Seller Dashboard'}
 </button>
 )}

 <Link
 to="/orders"
 onClick={() => setIsProfileOpen(false)}
 className="dropdown-link-item"
 >
 <FiShoppingBag color="var(--text-light)" /> {t('nav.allMyOrders')}
 </Link>

 <Link
 to={
   isAdmin
     ? '/admin/chats'
     : user?.role === 'SELLER'
       ? '/chat/seller-admin'
       : '/chat/user-admin'
 }
 onClick={() => setIsProfileOpen(false)}
 className="dropdown-link-item"
 >
 <FiMessageSquare color="var(--primary)" /> {lang === 'km' ? 'ការសន្ទនាជំនួយ' : 'Support Chat'}
 </Link>


 {isAdmin && (
 <Link
 to="/admin"
 onClick={() => setIsProfileOpen(false)}
 className="dropdown-link-item"
 >
 <FiShield color="var(--secondary)" /> {t('nav.adminPanel')}
 </Link>
 )}

 <button
 onClick={() => {
 setIsProfileOpen(false);
 setIsHelpModalOpen(true);
 }}
 className="dropdown-link-item"
 style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
 >
 <FiHelpCircle color="var(--primary)" /> {t('nav.helpSupport')}
 </button>

 <a
 href={telegramUrl}
 target="_blank"
 rel="noopener noreferrer"
 onClick={() => setIsProfileOpen(false)}
 className="dropdown-link-item"
 style={{ color: '#0088cc' }}
 >
 <FaTelegram size={16} /> {t('nav.telegramSupport')}
 </a>

 <button
 onClick={() => setLang(lang === 'km' ? 'en' : 'km')}
 className="dropdown-link-item"
 style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
 >
 <span style={{ fontSize: '1rem', marginRight: 6 }}>{lang === 'km' ? '' : ''}</span>
 {lang === 'km' ? 'English (EN)' : 'ភាសាខ្មែរ'}
 </button>

 <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '4px 0' }} />

 <button
 onClick={() => {
 setIsProfileOpen(false);
 setIsLogoutModalOpen(true);
 }}
 className="dropdown-link-item"
 style={{ color: 'var(--danger)', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
 >
 <FiLogOut /> {t('nav.logout')}
 </button>
 </div>
 )}
 </div>
 ) : (
 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
 <Link to="/login" className="btn btn-outline btn-sm">
 <FiUser /> {t('nav.login')}
 </Link>
 <Link to="/register" className="btn btn-primary btn-sm">
 {t('nav.register')}
 </Link>
 </div>
 )}
 </div>

 {/* Mobile Hamburger Toggle Button */}
 <button
 className="mobile-hamburger-btn"
 onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
 aria-label={isMobileMenuOpen ? 'Close Menu' : 'Open Menu'}
 aria-expanded={isMobileMenuOpen}
 >
 {isMobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
 </button>
 </div>
 </div>
 {location.pathname === '/' && <AnnouncementBar />}
 </header>
 <div style={{ height: location.pathname === '/' ? '106px' : '70px', width: '100%' }} />

 {/* Mobile Drawer Menu */}
 {isMobileMenuOpen && (
 <div className="mobile-drawer-overlay animate-fade-in" onClick={() => setIsMobileMenuOpen(false)}>
 <div className="mobile-drawer-content animate-slide-in" onClick={(e) => e.stopPropagation()}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
 <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)' }}>{t('nav.navigation')}</span>
 <button
 onClick={() => setIsMobileMenuOpen(false)}
 style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
 >
 <FiX size={24} />
 </button>
 </div>

 <div className="mobile-nav-links">
 {navLinks.map((link) => {
 const IconComponent = link.icon;
 if (link.isHelp) {
 return (
 <button
 key={link.label}
 onClick={() => {
 setIsMobileMenuOpen(false);
 setIsHelpModalOpen(true);
 }}
 className="mobile-nav-item"
 style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
 >
 <IconComponent size={18} /> {link.label}
 </button>
 );
 }

 const active = isActive(link.path);
 return (
 <Link
 key={link.path}
 to={link.path}
 className={`mobile-nav-item ${active ? 'active' : ''}`}
 onClick={() => setIsMobileMenuOpen(false)}
 >
 <IconComponent size={18} /> {link.label}
 </Link>
 );
 })}

 {isAuthenticated && (
 <Link
 to="/orders"
 className={`mobile-nav-item ${isActive('/orders') ? 'active' : ''}`}
 onClick={() => setIsMobileMenuOpen(false)}
 >
 <FiShoppingBag size={18} /> {t('nav.myOrders')}
 </Link>
 )}

 <Link
 to={!user ? '/login?redirect=/seller/onboard' : (user.role === 'SELLER' ? '/seller' : '/seller/onboard')}
 className={`mobile-nav-item ${isActive('/seller') ? 'active' : ''}`}
 onClick={(e) => {
 setIsMobileMenuOpen(false);
 if (!user) {
 e.preventDefault();
 navigate('/login?redirect=/seller/onboard');
 return;
 }
 if (user?.role === 'SELLER') {
 e.preventDefault();
 setIsSellerSwitchModalOpen(true);
 }
 }}
 style={{ color: '#6366F1', fontWeight: 700 }}
 >
 <MdStorefront size={18} color="#6366F1" /> {user?.role === 'SELLER' ? 'My Store Dashboard' : 'Become a Seller'}
 </Link>

 {isAdmin && (
 <Link
 to="/admin"
 className={`mobile-nav-item ${isActive('/admin') ? 'active' : ''}`}
 onClick={() => setIsMobileMenuOpen(false)}
 >
 <FiShield size={18} /> {t('nav.adminPanel')}
 </Link>
 )}
 </div>

 <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '20px 0' }} />

 {/* Mobile Auth Actions */}
 {isAuthenticated ? (
 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
 <div style={{
 width: '36px', height: '36px', borderRadius: '50%',
 background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
 color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800,
 overflow: 'hidden', flexShrink: 0
 }}>
 {(user?.avatar || user?.photo || user?.photoUrl || localStorage.getItem(`userPhoto_${user?.email}`) || localStorage.getItem('userPhoto')) ? (
 <img
 src={user?.avatar || user?.photo || user?.photoUrl || localStorage.getItem(`userPhoto_${user?.email}`) || localStorage.getItem('userPhoto')}
 alt="Profile"
 style={{ width: '100%', height: '100%', objectFit: 'cover' }}
 />
 ) : (
 getInitials(user?.name)
 )}
 </div>
 <div>
 <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{user?.name || t('nav.account')}</div>
 <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{user?.email}</div>
 </div>
 </div>
 <button
 onClick={() => {
 setIsMobileMenuOpen(false);
 setIsLogoutModalOpen(true);
 }}
 className="btn btn-danger btn-sm"
 style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
 >
 <FiLogOut /> {t('nav.logout')}
 </button>
 </div>
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
 <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="btn btn-outline" style={{ width: '100%' }}>
 <FiUser /> {t('nav.login')}
 </Link>
 <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="btn btn-primary" style={{ width: '100%' }}>
 {t('nav.register')}
 </Link>
 </div>
 )}

 {/* Language Switcher (Mobile) */}
 <div style={{ marginTop: '16px' }}>
 <LangToggle isMobile />
 </div>
 </div>
 </div>
 )}

 {/* Styled Components for Navbar */}
 <style>{`
 .navbar-brand-logo {
 display: flex;
 align-items: center;
 text-decoration: none;
 flex-shrink: 0;
 }

 .navbar-brand-text {
 font-size: 1.4rem;
 font-weight: 800;
 letter-spacing: -0.02em;
 color: #FF85AE;
 white-space: nowrap;
 }

 .navbar-become-seller-btn {
 display: flex;
 align-items: center;
 gap: 6px;
 background: linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(124, 58, 237, 0.1) 100%);
 border: 1px solid rgba(99, 102, 241, 0.35);
 border-radius: 12px;
 padding: 0 12px;
 height: 42px;
 text-decoration: none;
 font-size: 0.82rem;
 font-weight: 800;
 color: #6366F1;
 transition: var(--transition);
 box-shadow: 0 2px 6px rgba(99, 102, 241, 0.08);
 white-space: nowrap;
 flex-shrink: 0;
 }

 .navbar-seller-label {
 white-space: nowrap;
 }

 .desktop-nav-links {
 display: flex;
 align-items: center;
 gap: 8px;
 }

 .nav-link-item {
 padding: 8px 14px;
 border-radius: var(--radius-sm);
 font-weight: 600;
 font-size: 0.92rem;
 color: var(--text-light);
 transition: var(--transition);
 white-space: nowrap;
 }

 .nav-link-item:hover {
 color: var(--primary);
 background-color: var(--primary-light);
 }

 .nav-link-item.active {
 color: var(--primary);
 background-color: var(--primary-light);
 font-weight: 700;
 }

 .admin-badge-link {
 color: var(--secondary) !important;
 }
 .admin-badge-link:hover, .admin-badge-link.active {
 background-color: var(--secondary-light) !important;
 }

 .cart-badge-count {
 position: absolute;
 top: -6px;
 right: -6px;
 background: var(--primary);
 color: white;
 border-radius: var(--radius-full);
 padding: 2px 6px;
 font-size: 0.7rem;
 font-weight: 800;
 line-height: 1;
 box-shadow: 0 2px 6px var(--primary-glow);
 animation: bounce 0.4s ease;
 }

 .mobile-hamburger-btn {
 display: none;
 background: var(--bg-secondary);
 border: 1px solid var(--border);
 border-radius: 10px;
 width: 42px;
 height: 42px;
 align-items: center;
 justify-content: center;
 cursor: pointer;
 color: var(--text);
 flex-shrink: 0;
 }

 .desktop-profile-wrapper {
 display: flex;
 }

 .desktop-lang-toggle {
 display: flex;
 }

 .profile-dropdown-menu {
 position: absolute;
 top: 46px;
 right: 0;
 width: 240px;
 background: var(--card-bg);
 border-radius: var(--radius);
 box-shadow: var(--shadow-lg);
 border: 1px solid var(--border);
 padding: 8px;
 z-index: 200;
 display: flex;
 flex-direction: column;
 gap: 4px;
 }

 .dropdown-link-item {
 display: flex;
 align-items: center;
 gap: 10px;
 padding: 9px 12px;
 border-radius: 8px;
 color: var(--text);
 font-weight: 600;
 font-size: 0.88rem;
 transition: var(--transition);
 }
 .dropdown-link-item:hover {
 background: var(--bg-secondary);
 }

 /* Mobile Responsive Drawer Styling */
 @media (max-width: 768px) {
 .desktop-nav-links {
 display: none !important;
 }
 .desktop-profile-wrapper {
 display: none !important;
 }
 .desktop-lang-toggle {
 display: none !important;
 }
 .mobile-hamburger-btn {
 display: flex !important;
 }
 .navbar-seller-label {
 display: none !important;
 }
 .navbar-become-seller-btn {
 padding: 0 !important;
 width: 42px !important;
 height: 42px !important;
 justify-content: center !important;
 border-radius: 12px !important;
 }
 .navbar-brand-text {
 font-size: 1.2rem !important;
 }
 }

 @media (max-width: 380px) {
 .navbar-brand-text {
 font-size: 1.1rem !important;
 }
 }

 .mobile-drawer-overlay {
 position: fixed;
 top: 0; left: 0; right: 0; bottom: 0;
 background: rgba(15, 23, 42, 0.5);
 backdrop-filter: blur(4px);
 z-index: 3000;
 display: flex;
 justify-content: flex-end;
 }

 .mobile-drawer-content {
 width: 280px;
 height: 100%;
 background: var(--card-bg);
 padding: 24px;
 display: flex;
 flex-direction: column;
 box-shadow: var(--shadow-lg);
 overflow-y: auto;
 }

 .mobile-nav-links {
 display: flex;
 flex-direction: column;
 gap: 8px;
 }

 .mobile-nav-item {
 display: flex;
 align-items: center;
 gap: 12px;
 padding: 12px 16px;
 border-radius: var(--radius-sm);
 font-weight: 600;
 font-size: 0.95rem;
 color: var(--text);
 transition: var(--transition);
 }

 .mobile-nav-item:hover, .mobile-nav-item.active {
 background: var(--primary-light);
 color: var(--primary);
 }
 `}</style>

 <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

 <ConfirmLogoutModal
 isOpen={isLogoutModalOpen}
 onClose={() => setIsLogoutModalOpen(false)}
 onConfirm={handleLogoutConfirm}
 />

 <ConfirmModeSwitchModal
 isOpen={isSellerSwitchModalOpen}
 targetMode="SELLER"
 onConfirm={() => navigate('/seller')}
 onClose={() => setIsSellerSwitchModalOpen(false)}
 />

 <UserHelpModal
 isOpen={isHelpModalOpen}
 onClose={() => setIsHelpModalOpen(false)}
 />
 </>
 );
};

export default Navbar;
