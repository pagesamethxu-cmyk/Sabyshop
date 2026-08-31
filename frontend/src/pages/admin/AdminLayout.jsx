import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiPackage, FiTag, FiShoppingBag,
  FiSettings, FiHelpCircle, FiLogOut, FiSearch, FiBell,
  FiX, FiUser, FiUsers, FiCreditCard, FiShield, FiChevronRight, FiCheck, FiMessageSquare,
  FiVolume2, FiRefreshCw, FiExternalLink, FiBookOpen, FiPercent, FiAlertTriangle, FiMonitor,
  FiGlobe, FiMenu
} from 'react-icons/fi';
import { FaTelegram } from 'react-icons/fa';
import { MdDashboard, MdStorefront } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { admin as adminApi, products as productsApi, chat as chatApi, disputes as disputesApi } from '../../api/client';
import toast from 'react-hot-toast';
import './admin.css';

/*  Close dropdown when clicking outside  */
const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (e) => { if (!ref.current || ref.current.contains(e.target)) return; handler(); };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
};

const AdminLayout = () => {
  const location  = useLocation();
  const { user, logout } = useAuth();
  const { lang, setLang, directSetLang, isKhmer, t } = useLanguage();
  const navigate  = useNavigate();

  /*  panel open states  */
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen]   = useState(false);
  const [notifOpen,  setNotifOpen]    = useState(false);
  const [langOpen,   setLangOpen]     = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  /*  Modals for Settings & Help  */
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  /*  Settings Form State  */
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(() => localStorage.getItem('admin_refresh_interval') || '5');
  const [soundAlerts, setSoundAlerts] = useState(() => localStorage.getItem('admin_sound_alerts') !== 'false');
  const [exportFormat, setExportFormat] = useState(() => localStorage.getItem('admin_export_format') || 'CSV');

  /*  search  */
  const [searchQuery, setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState({ products: [], orders: [] });
  const [searching, setSearching]       = useState(false);

  /*  notifications  */
  const [notifications, setNotifications] = useState([]);
  const [notifLoaded,   setNotifLoaded]   = useState(false);
  const [unreadCount,   setUnreadCount]   = useState(0);

  /*  refs for click-outside  */
  const searchRef  = useRef(null);
  const notifRef   = useRef(null);
  const langRef    = useRef(null);
  const profileRef = useRef(null);
  const searchInputRef = useRef(null);

  useClickOutside(searchRef,  () => { setSearchOpen(false); setSearchQuery(''); setSearchResults({ products: [], orders: [] }); });
  useClickOutside(notifRef,   () => setNotifOpen(false));
  useClickOutside(langRef,    () => setLangOpen(false));
  useClickOutside(profileRef, () => setProfileOpen(false));

  /*  focus search input when panel opens  */
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  /*  live search  */
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults({ products: [], orders: [] }); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const [prodRes, ordRes] = await Promise.allSettled([
          productsApi.getAll(),
          adminApi.getAllOrders(),
        ]);
        const q = searchQuery.toLowerCase();
        const prods = prodRes.status === 'fulfilled' && Array.isArray(prodRes.value.data)
          ? prodRes.value.data.filter(p => p.name?.toLowerCase().includes(q)).slice(0, 4)
          : [];
        const ords = ordRes.status === 'fulfilled' && Array.isArray(ordRes.value.data)
          ? ordRes.value.data.filter(o =>
              String(o.id).includes(q) ||
              (o.customerEmail || '').toLowerCase().includes(q) ||
              (o.status || '').toLowerCase().includes(q)
            ).slice(0, 4)
          : [];
        setSearchResults({ products: prods, orders: ords });
      } catch { /* silent */ }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  /*  load notifications when panel opens  */
  useEffect(() => {
    if (!notifOpen || notifLoaded) return;
    (async () => {
      try {
        const res = await adminApi.getAllOrders();
        const orders = Array.isArray(res.data) ? res.data : [];
        const items = orders.slice(0, 6).map(o => ({
          id: o.id,
          type: o.status === 'PENDING' ? 'order_pending' : 'order_update',
          title: o.status === 'PENDING' ? 'New order pending payment' : `Order ${o.status.toLowerCase()}`,
          sub: `#${o.id} · ${o.customerEmail?.split('@')[0] || 'Customer'} · $${Number(o.totalAmount || 0).toFixed(2)}`,
          time: new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          link: '/admin/orders',
          read: false,
        }));
        setNotifications(items);
        setUnreadCount(items.filter(i => !i.read).length);
        setNotifLoaded(true);
      } catch { /* silent */ }
    })();
  }, [notifOpen, notifLoaded]);

  /*  reset dropdowns on route change  */
  useEffect(() => {
    setSidebarMobileOpen(false);
    setSearchOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
    setSearchQuery('');
  }, [location.pathname]);

  /*  sidebar helpers  */
  const navItems = [
    { path: '/admin',               name: isKhmer ? 'ផ្ទាំងគ្រប់គ្រង' : 'Dashboard',         icon: <MdDashboard size={20} /> },
    { path: '/admin/products',      name: isKhmer ? 'ស្តុកទំនិញ' : 'Inventory',               icon: <FiPackage size={18} /> },
    { path: '/admin/categories',    name: isKhmer ? 'ប្រភេទផលិតផល' : 'Categories',            icon: <FiTag size={18} /> },
    { path: '/admin/orders',        name: isKhmer ? 'ការបញ្ជាទិញ' : 'Orders',                icon: <FiShoppingBag size={18} /> },
    { path: '/admin/chats',         name: isKhmer ? 'សារជំនួយ & ជជែក' : 'Support Chats',      icon: <FiMessageSquare size={18} /> },
    { path: '/admin/sellers',       name: isKhmer ? 'គ្រប់គ្រងអ្នកលក់' : 'Sellers',           icon: <MdStorefront size={18} /> },
    { path: '/admin/users',         name: isKhmer ? 'អ្នកប្រើប្រាស់' : 'Users',               icon: <FiUsers size={18} /> },
    { path: '/admin/payments',      name: isKhmer ? 'ប្រតិបត្តិការទូទាត់' : 'Payments',        icon: <FiCreditCard size={18} /> },
    { path: '/admin/withdrawals',   name: isKhmer ? 'ការដកប្រាក់' : 'Withdrawals',           icon: <FiBookOpen size={18} /> },
    { path: '/admin/disputes',      name: isKhmer ? 'ជម្លោះ & ការទាមទារ' : 'Disputes & Claims', icon: <FiShield size={18} /> },
    { path: '/admin/promotions',    name: isKhmer ? 'គូប៉ុង & ប្រូម៉ូសិន' : 'Coupons & Promo',  icon: <FiPercent size={18} /> },
    { path: '/admin/reports',       name: isKhmer ? 'របាយការណ៍ផលិតផល' : 'Product Reports',    icon: <FiAlertTriangle size={18} /> },
    { path: '/admin/notifications', name: isKhmer ? 'ការជូនដំណឹង' : 'Notifications',          icon: <FiBell size={18} /> },
    { path: '/admin/devices',       name: isKhmer ? 'សុវត្ថិភាពឧបករណ៍' : 'Device Security',   icon: <FiMonitor size={18} /> },
    { path: '/admin/settings',      name: isKhmer ? 'ការកំណត់ប្រព័ន្ធ' : 'System Settings',   icon: <FiSettings size={18} /> },
  ];

  const isActive = (path) =>
    path === '/admin'
      ? location.pathname === '/admin'
      : location.pathname.startsWith(path);

  const handleOpenLogoutModal = () => {
    setProfileOpen(false);
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    navigate('/login');
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('admin_refresh_interval', autoRefreshInterval);
    localStorage.setItem('admin_sound_alerts', String(soundAlerts));
    localStorage.setItem('admin_export_format', exportFormat);
    toast.success(isKhmer ? 'បានរក្សាទុកការកំណត់ Admin ជោគជ័យ!' : 'Admin settings saved successfully!');
    setSettingsOpen(false);
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const pageTitle = () => {
    if (location.pathname === '/admin')                       return <>{isKhmer ? 'សូមស្វាគមន៍មកកាន់, ' : 'Welcome Back, '}<span>{user?.name?.split(' ')[0] || 'Admin'}</span></>;
    if (location.pathname.startsWith('/admin/products'))      return <>{isKhmer ? 'ស្តុកទំនិញ & ផលិតផល' : 'Inventory & Products'}</>;
    if (location.pathname.startsWith('/admin/categories'))    return <>{isKhmer ? 'ប្រភេទផលិតផល' : 'Categories'}</>;
    if (location.pathname.startsWith('/admin/orders'))        return <>{isKhmer ? 'ការគ្រប់គ្រងការបញ្ជាទិញ' : 'Orders Management'}</>;
    if (location.pathname.startsWith('/admin/chats'))         return <>{isKhmer ? 'សារជំនួយ & ជជែកផ្ទាល់' : 'Support Chats'}</>;
    if (location.pathname.startsWith('/admin/sellers'))       return <>{isKhmer ? 'ការគ្រប់គ្រងអ្នកលក់' : 'Sellers Management'}</>;
    if (location.pathname.startsWith('/admin/users'))         return <>{isKhmer ? 'ការគ្រប់គ្រងអ្នកប្រើប្រាស់' : 'Users Management'}</>;
    if (location.pathname.startsWith('/admin/payments'))      return <>{isKhmer ? 'ប្រតិបត្តិការទូទាត់ប្រាក់' : 'Payment Transactions'}</>;
    if (location.pathname.startsWith('/admin/withdrawals'))   return <>{isKhmer ? 'ការដកប្រាក់របស់អ្នកលក់' : 'Seller Withdrawals'}</>;
    if (location.pathname.startsWith('/admin/disputes'))      return <>{isKhmer ? 'ជម្លោះ & ការទាមទារធានា' : 'Disputes & Warranty Claims'}</>;
    if (location.pathname.startsWith('/admin/promotions'))    return <>{isKhmer ? 'គូប៉ុង & ប្រូម៉ូសិន' : 'Coupons & Promotions'}</>;
    if (location.pathname.startsWith('/admin/reports'))       return <>{isKhmer ? 'របាយការណ៍គុណភាពផលិតផល' : 'Product Reports'}</>;
    if (location.pathname.startsWith('/admin/notifications')) return <>{isKhmer ? 'មជ្ឈមណ្ឌលការជូនដំណឹង' : 'System Notifications'}</>;
    if (location.pathname.startsWith('/admin/devices'))       return <>{isKhmer ? 'សុវត្ថិភាពឧបករណ៍ & កំណត់ហេតុ' : 'Device Security & Live Logs'}</>;
    if (location.pathname.startsWith('/admin/settings'))      return <>{isKhmer ? 'ការកំណត់ប្រព័ន្ធទូទៅ' : 'System Settings'}</>;
    return <>{isKhmer ? 'ផ្ទាំងគ្រប់គ្រង Admin' : 'Admin Panel'}</>;
  };

  const initials = (user?.name || 'A').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const notifColors = {
    order_pending: '#FBBF24',
    order_update:  '#7B6FFF',
  };

  /*  Unread Customer Profiles Count for Sidebar Badge  */
  const [adminUnreadChatsCount, setAdminUnreadChatsCount] = useState(0);

  useEffect(() => {
    const checkAdminUnread = async () => {
      try {
        const readMap = JSON.parse(localStorage.getItem('admin_chat_read_map') || '{}');

        // Fetch orders map to resolve customer email for any order message
        const ordersMap = {};
        try {
          const ordersRes = await adminApi.getAllOrders();
          if (Array.isArray(ordersRes.data)) {
            ordersRes.data.forEach(o => { if (o && o.id) ordersMap[String(o.id)] = o; });
          }
        } catch (_) {}

        let all = [];
        try {
          const res = await chatApi.adminGetAll();
          if (Array.isArray(res.data)) all = res.data;
        } catch (_) {}

        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('chat_messages_order_') || k.startsWith('chat_messages_user_') || k.startsWith('chat_messages_') || k.startsWith('support_messages_'))) {
            try {
              const parsed = JSON.parse(localStorage.getItem(k));
              if (Array.isArray(parsed)) {
                parsed.forEach(m => { if (m) all.push(m); });
              }
            } catch (_) {}
          }
        }

        const getCustomerKey = (m) => {
          if (!m) return null;
          if (m.orderId && ordersMap[String(m.orderId)]?.customerEmail) {
            return ordersMap[String(m.orderId)].customerEmail.toLowerCase().trim();
          }
          if (m.senderRole === 'USER' && m.senderEmail && !m.senderEmail.includes('admin')) {
            return m.senderEmail.toLowerCase().trim();
          }
          if (m.targetEmail && !m.targetEmail.includes('admin')) {
            return m.targetEmail.toLowerCase().trim();
          }
          if (m.userEmail && !m.userEmail.includes('admin')) {
            return m.userEmail.toLowerCase().trim();
          }
          if (m.senderEmail && !m.senderEmail.includes('admin')) {
            return m.senderEmail.toLowerCase().trim();
          }
          return null;
        };

        const grouped = {};
        all.forEach(m => {
          const key = getCustomerKey(m);
          if (key && !key.startsWith('+') && !key.startsWith('order_') && key !== 'general') {
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(m);
          }
        });

        let unreadProfilesCount = 0;
        Object.keys(grouped).forEach(profileKey => {
          const cleanKey = profileKey.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
          // Skip if thread was deleted by admin
          if (localStorage.getItem(`deleted_chat_thread_${cleanKey}`) === 'true') return;

          const msgs = grouped[profileKey].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          const last = msgs.at(-1);
          if (last && last.senderRole === 'USER') {
            const marker = last.id || last.createdAt;
            const isRead = readMap[profileKey] === marker || readMap[cleanKey] === marker || (last.orderId && readMap[String(last.orderId)] === marker);
            if (!isRead) {
              unreadProfilesCount++;
            }
          }
        });

        setAdminUnreadChatsCount(unreadProfilesCount);
      } catch (_) {}
    };

    checkAdminUnread();
    const interval = setInterval(checkAdminUnread, 3000);
    window.addEventListener('storage', checkAdminUnread);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkAdminUnread);
    };
  }, []);

  /*  Open Disputes Count for Sidebar Badge  */
  const [adminOpenDisputesCount, setAdminOpenDisputesCount] = useState(0);

  useEffect(() => {
    const fetchOpenDisputes = async () => {
      try {
        const res = await disputesApi.adminGetAll();
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        // Count only open or escalated disputes that need admin attention
        const openCount = list.filter(d =>
          d.status === 'OPEN' ||
          d.status === 'ESCALATED_ADMIN' ||
          d.status === 'DISPUTED'
        ).length;
        setAdminOpenDisputesCount(openCount);
      } catch (_) {}
    };

    fetchOpenDisputes();
    const interval = setInterval(fetchOpenDisputes, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="admin-root">

      {/*  Mobile Sidebar Backdrop Overlay  */}
      {sidebarMobileOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setSidebarMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 999
          }}
        />
      )}

      {/*  Sidebar  */}
      <aside className={`admin-sidebar ${sidebarMobileOpen ? 'mobile-open' : ''}`}>
        <div className="admin-sidebar-logo">
          <div className="admin-sidebar-logo-icon" style={{
            background: 'linear-gradient(135deg,#7B6FFF,#EC4899)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FiShoppingBag size={20} color="#ffffff" />
          </div>
          <span className="admin-sidebar-logo-text">Saby Shop</span>
        </div>

        <nav className="admin-sidebar-nav">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`admin-nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setSidebarMobileOpen(false)}
            >
              {item.icon}
              <span>{item.name}</span>
              {/* Unread chats badge */}
              {item.path === '/admin/chats' && adminUnreadChatsCount > 0 && (
                <span style={{
                  background: '#EF4444', color: '#ffffff', fontSize: '0.72rem', fontWeight: 900,
                  borderRadius: '9999px', padding: '2px 7px', marginLeft: 'auto', lineHeight: 1,
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
                }}>
                  {adminUnreadChatsCount}
                </span>
              )}
              {/* Open disputes badge */}
              {item.path === '/admin/disputes' && adminOpenDisputesCount > 0 && (
                <span style={{
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  color: '#ffffff', fontSize: '0.72rem', fontWeight: 900,
                  borderRadius: '9999px', padding: '2px 7px', marginLeft: 'auto', lineHeight: 1,
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.45)',
                  animation: 'adminPulse 2s infinite'
                }}>
                  {adminOpenDisputesCount}
                </span>
              )}
            </Link>
          ))}
        </nav>


        {/* Sidebar Footer — Quick Info & Help */}
        <div style={{ marginTop: 'auto', padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div
            onClick={() => { setSidebarMobileOpen(false); setHelpOpen(true); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              borderRadius: 12, background: 'rgba(255,255,255,0.04)', cursor: 'pointer',
              color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', fontWeight: 600,
              transition: 'background 0.2s'
            }}
          >
            <FiHelpCircle size={18} color="#7B6FFF" />
            <span>Admin Help & Support</span>
          </div>
        </div>
      </aside>

      {/*  Main Area  */}
      <div className="admin-main">

        {/* Header */}
        <header className="admin-header">
          <div className="admin-header-left" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              className="admin-mobile-menu-btn"
              onClick={() => setSidebarMobileOpen(prev => !prev)}
              aria-label="Toggle Navigation Menu"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                width: 38,
                height: 38,
                borderRadius: 10,
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <FiMenu size={20} />
            </button>
            <h1 className="admin-header-title">{pageTitle()}</h1>
          </div>

          <div className="admin-header-right">

            {/*  Search Button & Panel  */}
            <div ref={searchRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className={`admin-icon-btn ${searchOpen ? 'active' : ''}`}
                onClick={() => setSearchOpen(prev => !prev)}
                title="Search Products & Orders"
              >
                <FiSearch size={18} />
              </button>

              {searchOpen && (
                <div className="admin-search-dropdown">
                  <div className="admin-search-input-wrap">
                    <FiSearch size={16} className="admin-search-icon" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search products or order #..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        className="admin-search-clear"
                        onClick={() => setSearchQuery('')}
                      >
                        <FiX size={14} />
                      </button>
                    )}
                  </div>

                  {searching && (
                    <div className="admin-search-loading">Searching...</div>
                  )}

                  {!searching && searchQuery && (
                    <div className="admin-search-results">
                      {searchResults.products.length > 0 && (
                        <div className="admin-search-group">
                          <div className="admin-search-group-title">Products</div>
                          {searchResults.products.map(p => (
                            <Link
                              key={p.id}
                              to="/admin/products"
                              className="admin-search-item"
                              onClick={() => setSearchOpen(false)}
                            >
                              <FiPackage size={14} />
                              <span>{p.name}</span>
                              <span className="admin-search-tag">${Number(p.price || 0).toFixed(2)}</span>
                            </Link>
                          ))}
                        </div>
                      )}

                      {searchResults.orders.length > 0 && (
                        <div className="admin-search-group">
                          <div className="admin-search-group-title">Orders</div>
                          {searchResults.orders.map(o => (
                            <Link
                              key={o.id}
                              to="/admin/orders"
                              className="admin-search-item"
                              onClick={() => setSearchOpen(false)}
                            >
                              <FiShoppingBag size={14} />
                              <span>Order #{o.id} ({o.customerEmail?.split('@')[0] || 'Customer'})</span>
                              <span className="admin-search-tag">{o.status}</span>
                            </Link>
                          ))}
                        </div>
                      )}

                      {searchResults.products.length === 0 && searchResults.orders.length === 0 && (
                        <div className="admin-search-empty">No results found for "{searchQuery}"</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/*  Notification Bell & Panel  */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className={`admin-icon-btn ${notifOpen ? 'active' : ''}`}
                onClick={() => setNotifOpen(prev => !prev)}
                title="Notifications"
              >
                <FiBell size={18} />
                {unreadCount > 0 && (
                  <span className="admin-unread-badge">{unreadCount}</span>
                )}
              </button>

              {notifOpen && (
                <div className="admin-notif-dropdown">
                  <div className="admin-notif-header">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <button type="button" onClick={markAllRead} className="admin-notif-mark-read">
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="admin-notif-list">
                    {notifications.length === 0 ? (
                      <div className="admin-notif-empty">No recent notifications</div>
                    ) : (
                      notifications.map(n => (
                        <Link
                          key={n.id}
                          to={n.link}
                          className={`admin-notif-item ${!n.read ? 'unread' : ''}`}
                          onClick={() => setNotifOpen(false)}
                        >
                          <div
                            className="admin-notif-dot"
                            style={{ background: notifColors[n.type] || '#7B6FFF' }}
                          />
                          <div className="admin-notif-content">
                            <div className="admin-notif-item-title">{n.title}</div>
                            <div className="admin-notif-item-sub">{n.sub}</div>
                            <div className="admin-notif-item-time">{n.time}</div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/*  Language Switcher Button  */}
            <div ref={langRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className={`admin-icon-btn ${langOpen ? 'active' : ''}`}
                onClick={() => setLangOpen(prev => !prev)}
                title={isKhmer ? 'ប្តូរភាសា (Change Language)' : 'Change Language'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '0 10px',
                  width: 'auto',
                  minWidth: 44,
                  height: 38,
                  borderRadius: 10,
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  background: 'rgba(139, 92, 246, 0.12)'
                }}
              >
                <FiGlobe size={16} color="#A78BFA" />
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#F1F5F9' }}>
                  {lang === 'km' ? 'ខ្មែរ' : 'EN'}
                </span>
              </button>

              {langOpen && (
                <div className="admin-profile-dropdown" style={{ minWidth: 170, right: 0, top: 'calc(100% + 8px)' }}>
                  <div style={{ padding: '8px 12px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--admin-text-muted)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {isKhmer ? 'ជ្រើសរើសភាសា' : 'Select Language'}
                  </div>
                  <div className="admin-profile-menu">
                    <button
                      type="button"
                      onClick={() => { setLangOpen(false); setLang('km'); }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: lang === 'km' ? 800 : 500, color: lang === 'km' ? '#A78BFA' : '#fff' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>ភាសាខ្មែរ</span>
                      </span>
                      {lang === 'km' && <FiCheck size={14} color="#8B5CF6" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLangOpen(false); setLang('en'); }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: lang === 'en' ? 800 : 500, color: lang === 'en' ? '#A78BFA' : '#fff' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>English</span>
                      </span>
                      {lang === 'en' && <FiCheck size={14} color="#8B5CF6" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/*  Settings Cog  */}
            <button
              type="button"
              className="admin-icon-btn"
              onClick={() => setSettingsOpen(true)}
              title={isKhmer ? 'ការកំណត់ Admin' : 'Admin Settings'}
            >
              <FiSettings size={18} />
            </button>

            {/*  User Avatar & Dropdown  */}
            <div ref={profileRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className="admin-profile-btn"
                onClick={() => setProfileOpen(prev => !prev)}
              >
                <div className="admin-avatar">{initials}</div>
                <div className="admin-user-info">
                  <span className="admin-user-name">{user?.name || 'Admin'}</span>
                  <span className="admin-user-role">{isKhmer ? 'អ្នកគ្រប់គ្រងជាន់ខ្ពស់' : 'Super Admin'}</span>
                </div>
              </button>

              {profileOpen && (
                <div className="admin-profile-dropdown">
                  <div className="admin-profile-header">
                    <div className="admin-avatar lg">{initials}</div>
                    <div>
                      <div className="admin-profile-name">{user?.name || 'Admin'}</div>
                      <div className="admin-profile-email">{user?.email || 'admin@sabyshop.com'}</div>
                    </div>
                  </div>
                  <div className="admin-profile-menu">
                    <button type="button" onClick={() => { setProfileOpen(false); setLang(lang === 'km' ? 'en' : 'km'); }}>
                      <FiGlobe size={16} color="#A78BFA" /> <span>{isKhmer ? 'ប្តូរទៅជាភាសាអង់គ្លេស (EN)' : 'Switch to Khmer (ខ្មែរ)'}</span>
                    </button>
                    <button type="button" onClick={() => { setProfileOpen(false); setSettingsOpen(true); }}>
                      <FiSettings size={16} /> <span>{isKhmer ? 'ការកំណត់' : 'Settings'}</span>
                    </button>
                    <button type="button" onClick={() => { setProfileOpen(false); setHelpOpen(true); }}>
                      <FiHelpCircle size={16} /> <span>{isKhmer ? 'ជំនួយ & ឯកសារណែនាំ' : 'Help & Docs'}</span>
                    </button>
                    <button type="button" onClick={handleOpenLogoutModal} className="danger">
                      <FiLogOut size={16} /> <span>{isKhmer ? 'ចាកចេញ' : 'Log Out'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Content Viewport */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>

      {/*  Settings Modal  */}
      {settingsOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <h3><FiSettings style={{ marginRight: 8 }} /> {isKhmer ? 'ការកំណត់ប្រព័ន្ធ' : 'System Settings'}</h3>
              <button onClick={() => setSettingsOpen(false)}><FiX size={20} /></button>
            </div>
            <form onSubmit={handleSaveSettings} className="admin-modal-body">
              {/* Language Selection */}
              <div className="admin-form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiGlobe size={15} color="#8B5CF6" />
                  <span>{isKhmer ? 'ភាសាប្រព័ន្ធ (System Language)' : 'System Language'}</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => { setSettingsOpen(false); setLang('km'); }}
                    style={{
                      padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                      border: lang === 'km' ? '2px solid #8B5CF6' : '1px solid rgba(255,255,255,0.12)',
                      background: lang === 'km' ? 'rgba(139,92,246,0.2)' : 'rgba(15,23,42,0.6)',
                      color: '#fff', fontWeight: lang === 'km' ? 800 : 600,
                      display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center'
                    }}
                  >
                    <span>ភាសាខ្មែរ</span>
                    {lang === 'km' && <FiCheck size={16} color="#8B5CF6" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSettingsOpen(false); setLang('en'); }}
                    style={{
                      padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                      border: lang === 'en' ? '2px solid #8B5CF6' : '1px solid rgba(255,255,255,0.12)',
                      background: lang === 'en' ? 'rgba(139,92,246,0.2)' : 'rgba(15,23,42,0.6)',
                      color: '#fff', fontWeight: lang === 'en' ? 800 : 600,
                      display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center'
                    }}
                  >
                    <span>English</span>
                    {lang === 'en' && <FiCheck size={16} color="#8B5CF6" />}
                  </button>
                </div>
              </div>

              <div className="admin-form-group">
                <label>{isKhmer ? 'ចន្លោះពេល Refresh ដោយស្វ័យប្រវត្តិ (វិនាទី)' : 'Auto-Refresh Interval (seconds)'}</label>
                <select
                  value={autoRefreshInterval}
                  onChange={e => setAutoRefreshInterval(e.target.value)}
                  className="admin-input"
                >
                  <option value="3">3 {isKhmer ? 'វិនាទី' : 'seconds'}</option>
                  <option value="5">5 {isKhmer ? 'វិនាទី' : 'seconds'}</option>
                  <option value="10">10 {isKhmer ? 'វិនាទី' : 'seconds'}</option>
                  <option value="30">30 {isKhmer ? 'វិនាទី' : 'seconds'}</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label>{isKhmer ? 'ទម្រង់ Export ទិន្នន័យ' : 'Export Format'}</label>
                <select
                  value={exportFormat}
                  onChange={e => setExportFormat(e.target.value)}
                  className="admin-input"
                >
                  <option value="CSV">CSV (.csv)</option>
                  <option value="JSON">JSON (.json)</option>
                  <option value="EXCEL">Excel (.xlsx)</option>
                </select>
              </div>

              <div className="admin-form-group checkbox-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={soundAlerts}
                    onChange={e => setSoundAlerts(e.target.checked)}
                  />
                  <span>{isKhmer ? 'បើកសំឡេងជូនដំណឹងសម្រាប់ការបញ្ជាទិញ & សារថ្មី' : 'Enable Sound Notifications for New Orders & Messages'}</span>
                </label>
              </div>

              <div className="admin-modal-footer">
                <button type="button" onClick={() => setSettingsOpen(false)} className="admin-btn admin-btn-secondary">
                  {isKhmer ? 'បោះបង់' : 'Cancel'}
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  {isKhmer ? 'រក្សាទុកការផ្លាស់ប្តូរ' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*  Help Modal  */}
      {helpOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <h3><FiHelpCircle style={{ marginRight: 8 }} /> {isKhmer ? 'ចំណេះដឹង & ការគាំទ្រ Admin' : 'Admin Knowledge & Support'}</h3>
              <button onClick={() => setHelpOpen(false)}><FiX size={20} /></button>
            </div>
            <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'rgba(123, 111, 255, 0.1)', padding: 16, borderRadius: 12, border: '1px solid rgba(123, 111, 255, 0.2)' }}>
                <h4 style={{ color: '#7B6FFF', margin: '0 0 6px 0', fontSize: '0.95rem' }}>Digital Store Admin Portal v2.0</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                  {isKhmer 
                    ? 'គ្រប់គ្រងស្តុកទំនិញ គណនីឌីជីថល ការបំពេញការបញ្ជាទិញ និងការជជែកផ្ទាល់ជាមួយអតិថិជន។'
                    : 'Manage store inventory, digital account stock, order fulfillments, and customer support live chats.'}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{isKhmer ? 'ឯកសារណែនាំសង្ខេប:' : 'Quick Documentation:'}</div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.83rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.8 }}>
                  <li><strong>{isKhmer ? 'ស្តុកទំនិញ:' : 'Inventory:'}</strong> {isKhmer ? 'បន្ថែម ឬកែប្រែចំណងជើងផលិតផល ការពិពណ៌នា និងតម្លៃ។' : 'Add or edit product titles, descriptions, and base prices.'}</li>
                  <li><strong>{isKhmer ? 'ប្រភេទ:' : 'Categories:'}</strong> {isKhmer ? 'រៀបចំផលិតផលឌីជីថលទៅតាមប្រភេទ។' : 'Organize digital items into categories.'}</li>
                  <li><strong>{isKhmer ? 'ការបញ្ជាទិញ:' : 'Orders:'}</strong> {isKhmer ? 'មើលការទិញរបស់អតិថិជន និងផ្ទៀងផ្ទាត់ការទូទាត់ប្រាក់។' : 'View customer purchases and verify payments.'}</li>
                  <li><strong>{isKhmer ? 'សារជំនួយ:' : 'Support Chats:'}</strong> {isKhmer ? 'ជជែកភ្លាមៗ និងផ្ញើសារជាសំឡេងជាមួយអតិថិជន។' : 'Instant chat and voice notes with customers.'}</li>
                </ul>
              </div>

              <div className="admin-modal-footer">
                <button type="button" onClick={() => setHelpOpen(false)} className="admin-btn admin-btn-primary">
                  {isKhmer ? 'យល់ព្រម' : 'Got It'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: 380 }}>
            <div className="admin-modal-header">
              <h3 style={{ color: '#EF4444' }}><FiLogOut style={{ marginRight: 8 }} /> {isKhmer ? 'ចាកចេញពីគណនី' : 'Log Out'}</h3>
              <button onClick={() => setShowLogoutModal(false)}><FiX size={20} /></button>
            </div>
            <div className="admin-modal-body">
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                {isKhmer ? 'តើអ្នកពិតជាចង់ចាកចេញពីផ្ទាំងគ្រប់គ្រង Admin មែនទេ?' : 'Are you sure you want to log out of the admin panel?'}
              </p>
              <div className="admin-modal-footer" style={{ marginTop: 20 }}>
                <button type="button" onClick={() => setShowLogoutModal(false)} className="admin-btn admin-btn-secondary">
                  {isKhmer ? 'បោះបង់' : 'Cancel'}
                </button>
                <button type="button" onClick={handleConfirmLogout} className="admin-btn" style={{ background: '#EF4444', color: '#fff' }}>
                  {isKhmer ? 'ចាកចេញ' : 'Log Out'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminLayout;
