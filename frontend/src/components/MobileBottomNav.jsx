import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiUser, FiGrid, FiMessageSquare } from 'react-icons/fi';
import { HiOutlineSwitchHorizontal } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const MobileBottomNav = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    // Treat all /chat/* sub-paths as active for the chat button
    if (path.startsWith('/chat') && location.pathname.startsWith('/chat')) return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    {
      label: t('mobileNav.home'),
      path: '/',
      icon: FiHome,
    },
    {
      label: t('mobileNav.store'),
      path: '/store',
      icon: FiGrid,
    },
    {
      label: t('mobileNav.orders'),
      // N-3 fix: badge was showing cart count on 'Orders' tab — misleading.
      // Cart items belong to the main nav cart icon. Orders tab has no natural badge.
      path: isAuthenticated ? '/orders' : '/login',
      icon: HiOutlineSwitchHorizontal,
    },
    {
      label: t('mobileNav.chat'),
      // Route by role: SELLER → customer sales inbox, USER → seller chat inbox
      path: isAuthenticated
        ? (user?.role === 'SELLER' ? '/chat/seller-customers' : '/chat/user-seller')
        : '/login',
      icon: FiMessageSquare,
    },
    {
      label: t('mobileNav.account'),
      path: isAuthenticated ? '/account' : '/login',
      icon: FiUser,
    },
  ];

  return (
    <>
      {/* Spacer so page content doesn't hide behind the bar */}
      <div className="mobile-bottom-nav-spacer" />

      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path.split('?')[0]);

          return (
            <Link
              key={item.label}
              to={item.path}
              className={`mobile-bottom-nav-item ${active ? 'active' : ''}`}
              aria-label={item.label}
            >
              <span className="mobile-bottom-nav-icon-wrap">
                <Icon size={22} />
                {item.badge && (
                  <span className="mobile-bottom-nav-badge">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </span>
              <span className="mobile-bottom-nav-label">{item.label}</span>
              {active && <span className="mobile-bottom-nav-indicator" />}
            </Link>
          );
        })}
      </nav>

      <style>{`
        /* Only shown on mobile */
        .mobile-bottom-nav-spacer {
          display: none;
        }

        .mobile-bottom-nav {
          display: none;
        }

        @media (max-width: 768px) {
          .mobile-bottom-nav-spacer {
            display: block;
            height: 68px;
          }

          .mobile-bottom-nav {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 64px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-top: 1px solid var(--border);
            box-shadow: 0 -4px 24px rgba(15, 23, 42, 0.08);
            z-index: 500;
            align-items: stretch;
          }

          .mobile-bottom-nav-item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            color: #94A3B8;
            text-decoration: none;
            position: relative;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            padding: 8px 0 6px;
            -webkit-tap-highlight-color: transparent;
          }

          .mobile-bottom-nav-item:active {
            transform: scale(0.9);
          }

          .mobile-bottom-nav-item.active {
            color: var(--primary);
          }

          .mobile-bottom-nav-icon-wrap {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 10px;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .mobile-bottom-nav-item.active .mobile-bottom-nav-icon-wrap {
            background: var(--primary-light);
          }

          .mobile-bottom-nav-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            background: var(--primary);
            color: white;
            border-radius: 9999px;
            padding: 1px 5px;
            font-size: 0.62rem;
            font-weight: 800;
            line-height: 1.4;
            box-shadow: 0 2px 6px var(--primary-glow);
          }

          .mobile-bottom-nav-label {
            font-size: 0.65rem;
            font-weight: 600;
            white-space: nowrap;
            letter-spacing: -0.01em;
            transition: color 0.2s;
          }

          .mobile-bottom-nav-item.active .mobile-bottom-nav-label {
            font-weight: 700;
          }

          .mobile-bottom-nav-indicator {
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 28px;
            height: 3px;
            background: var(--primary);
            border-radius: 0 0 4px 4px;
            animation: slideDown 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          }

          @keyframes slideDown {
            from { transform: translateX(-50%) scaleX(0); opacity: 0; }
            to   { transform: translateX(-50%) scaleX(1); opacity: 1; }
          }
        }
      `}</style>
    </>
  );
};

export default MobileBottomNav;
