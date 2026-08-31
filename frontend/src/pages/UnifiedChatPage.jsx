import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserSellerChatPage from './UserSellerChatPage';
import SellerCustomerInboxPage from './SellerCustomerInboxPage';
import AdminChatPage from './admin/AdminChatPage';

/**
 * UnifiedChatPage
 * Direct clean chat interface without switcher buttons on page.
 * Admin support is accessed via the floating headset icon on Home and Profile pages.
 */
const UnifiedChatPage = ({ initialMode, initialTab }) => {
  const { user, isAdmin } = useAuth();
  const [searchParams] = useSearchParams();

  const getMode = () => {
    const urlMode = (searchParams.get('mode') || initialMode || '').toUpperCase();
    const urlTab = (searchParams.get('tab') || searchParams.get('channel') || initialTab || '').toUpperCase();
    if (isAdmin && (urlMode === 'ADMIN' || urlTab === 'ADMIN')) return 'ADMIN';
    if (urlMode === 'SELLER' || urlTab === 'CUSTOMERS' || urlTab === 'SELLER_ADMIN' || urlTab === 'SELLER-ADMIN') return 'SELLER';
    return 'USER';
  };

  const mode = getMode();

  return (
    <div className="unified-chat-wrapper" style={{ width: '100%', minHeight: 'calc(100vh - 70px)', padding: '16px 20px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Mode 1: Personal Buyer Profile - Direct store chat without switcher */}
      {mode === 'USER' && (
        <div style={{ width: '100%', height: 'calc(100vh - 110px)', minHeight: 600, overflow: 'hidden', borderRadius: 16 }}>
          <UserSellerChatPage />
        </div>
      )}

      {/* Mode 2: Official Store Page Profile - Direct customer inbox without switcher */}
      {mode === 'SELLER' && (
        <div style={{ width: '100%', height: 'calc(100vh - 110px)', minHeight: 600, overflow: 'hidden', borderRadius: 16 }}>
          <SellerCustomerInboxPage height="100%" />
        </div>
      )}

      {/* Mode 3: Platform Admin Profile */}
      {mode === 'ADMIN' && (
        <div style={{ width: '100%', height: 'calc(100vh - 110px)', minHeight: 600, overflow: 'hidden', borderRadius: 16 }}>
          <AdminChatPage />
        </div>
      )}
    </div>
  );
};

export default UnifiedChatPage;
