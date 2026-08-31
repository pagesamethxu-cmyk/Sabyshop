import ChatHistoryPage from './ChatHistoryPage';

/**
 * Seller ↔ Admin Chat Page
 * Route: /chat/seller-admin
 * Channel: SELLER_ADMIN (teal/emerald header)
 */
const SellerAdminChatPage = () => {
  return <ChatHistoryPage defaultChannel="SELLER_ADMIN" />;
};

export default SellerAdminChatPage;
