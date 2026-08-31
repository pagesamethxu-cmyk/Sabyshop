import ChatHistoryPage from './ChatHistoryPage';

/**
 * User ↔ Admin Chat Page
 * Route: /chat/user-admin
 * Channel: USER_ADMIN (indigo/purple header)
 */
const UserAdminChatPage = () => {
  return <ChatHistoryPage defaultChannel="USER_ADMIN" />;
};

export default UserAdminChatPage;
