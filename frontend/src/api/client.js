import axios from 'axios';
import { getDeviceId, getDeviceName } from '../utils/deviceInfo';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-Device-Id'] = getDeviceId();
  config.headers['X-Device-Name'] = getDeviceName();
  const activeMode = localStorage.getItem('saby_active_chat_mode') || localStorage.getItem('saby_user_mode') || 'buyer';
  config.headers['X-User-Mode'] = activeMode;
  return config;
});

client.interceptors.response.use(
  (response) => {
    let payload = response.data;
    if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
      payload = payload.data;
    }
    
    const mapOrder = (ord) => {
      if (ord && ord.items && Array.isArray(ord.items)) {
        ord.items = ord.items.map(item => {
          const mappedItem = { ...item };
          const imgUrl = mappedItem.productImageUrl || mappedItem.imageUrl || mappedItem.productImage || mappedItem.product?.imageUrl || mappedItem.product?.image;
          if (!mappedItem.product) {
            mappedItem.product = {
              name: mappedItem.productName || 'Digital Product',
              imageUrl: imgUrl || null
            };
          } else {
            mappedItem.product = {
              ...mappedItem.product,
              imageUrl: mappedItem.product.imageUrl || imgUrl || null
            };
          }
          if (!mappedItem.account && mappedItem.deliveredAccounts && mappedItem.deliveredAccounts.length > 0) {
            mappedItem.account = {
              email: mappedItem.deliveredAccounts[0].accountEmail || mappedItem.deliveredAccounts[0].email,
              password: mappedItem.deliveredAccounts[0].accountPassword || mappedItem.deliveredAccounts[0].password
            };
          }
          return mappedItem;
        });
      }
      return ord; // Bug #1 fix: was missing return — caused undefined if used as transform
    };

    const mapProduct = (prod) => {
      if (prod && typeof prod === 'object' && 'categoryId' in prod) {
        prod.category = {
          id: prod.categoryId,
          name: prod.categoryName || 'Uncategorized',
        };
      }
      return prod; // Bug #13 fix: was missing return
    };

    if (payload) {
      if (Array.isArray(payload)) {
        payload = payload.map(item => {
          let mapped = mapOrder(item);
          mapped = mapProduct(mapped);
          return mapped;
        });
      } else if (typeof payload === 'object') {
        payload = mapOrder(payload);  // C-3 fix: capture return value
        payload = mapProduct(payload); // C-3 fix: capture return value
        if ('token' in payload && 'email' in payload) {
          payload.user = {
            email: payload.email,
            name: payload.name,
            role: payload.role
          };
        }
      }
    }
    response.data = payload;
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.warn("API request unauthenticated (401):", error.config?.url);
      // M-6 fix: auto-logout and redirect to login on 401
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      // Avoid redirect loop if already on login/register page
      const isAuthPage = ['/login', '/register', '/forgot-password'].some(p => window.location.pathname.startsWith(p));
      if (!isAuthPage) {
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      console.warn("API request forbidden (403):", error.config?.url);
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: (email, password) => client.post('/auth/login', { email, password }),
  /** Step 1 – sends 4-digit OTP to the user's email */
  sendVerificationCode: (email, password, name) => client.post('/auth/register', { email, password, name }),
  /** Step 2 – validates OTP and returns JWT */
  verifyEmail: (email, code) => client.post('/auth/verify-email', { email, code }),
  googleLogin: (idToken) => client.post('/auth/google', { idToken }),
  // [Fix-3] No email param — backend reads it from the JWT token (authenticated endpoint)
  logout: (config) => client.post('/auth/logout', null, config),
  getProfile: (config) => client.get('/auth/profile', config),
  updateProfile: (data, config) => client.patch('/auth/profile', data, config),
  forgotPassword: (email) => client.post('/auth/forgot-password', { email }),
  resetPassword: (email, code, newPassword) => client.post('/auth/reset-password', { email, code, newPassword }),
  changePassword: (data) => client.post('/auth/change-password', data),
  sendChangePasswordOtp: (currentPassword, newPassword) => client.post('/auth/send-change-password-otp', { currentPassword, newPassword }),
  confirmChangePassword: (code) => client.post('/auth/confirm-change-password', { code }),
};

export const products = {
  getAll: (params, config) => client.get('/products/', { params, ...config }),
  getById: (id, config) => client.get(`/products/${id}`, config),
};

export const categories = {
  getAll: (config) => client.get('/categories/', config),
};

export const orders = {
  create: (data, config) => client.post('/orders/', data, config),
  getAll: (config) => client.get('/orders/', config),
  getById: (id, config) => client.get(`/orders/${id}`, config),
  verify: (id, config) => client.post(`/orders/${id}/verify`, null, config),
  deliver: (id, data, config) => client.post(`/orders/${id}/deliver`, data, config),
  confirm: (id, config) => client.post(`/orders/${id}/confirm`, null, config),
  confirmDelivery: (id, config) => client.post(`/orders/${id}/confirm-delivery`, null, config),
  cancel: (id, config) => client.delete(`/orders/${id}`, config),
  /** Re-links a new KHQR MD5 to an existing PENDING order (when QR expires). */
  updatePaymentId: (id, newMd5, config) => client.patch(`/orders/${id}/payment-id`, { paymentId: newMd5 }, config),
};

export const admin = {
  getDashboard: () => client.get('/admin/dashboard'),
  createProduct: (data) => client.post('/admin/products', data),
  updateProduct: (id, data) => client.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => client.delete(`/admin/products/${id}`),
  addStock: (productId, items) => client.post(`/admin/products/${productId}/stock`, { items }),
  getStock: (productId) => client.get(`/admin/products/${productId}/stock`),
  getAllOrders: () => client.get('/admin/orders'),
  updateOrderStatus: (id, status) => client.patch(`/admin/orders/${id}/status`, { status }),
  createCategory: (data) => client.post('/admin/categories', data),
  updateCategory: (id, data) => client.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => client.delete(`/admin/categories/${id}`),
  uploadImage: (formData) => client.post('/admin/upload', formData),
  // Sellers
  getAllSellers: () => client.get('/admin/sellers'),
  getSellerById: (id) => client.get(`/admin/sellers/${id}`),
  updateSellerStatus: (id, status) => client.put(`/admin/sellers/${id}/status`, { status }),
  updateSellerExpiration: (id, data) => client.put(`/admin/sellers/${id}/expiration`, data),
  updateSellerBalance: (id, data) => client.put(`/admin/sellers/${id}/balance`, data),
  deleteSeller: (id) => client.delete(`/admin/sellers/${id}`),
  scanDuplicateSellers: () => client.post('/admin/sellers/scan-duplicates'),
  flagDuplicateSeller: (id) => client.post(`/admin/sellers/${id}/flag-duplicate`),
  cleanupDuplicateSellers: () => client.post('/admin/sellers/cleanup-duplicates'),
  // Withdrawals
  getAllWithdrawals: (pendingOnly = false) => client.get('/admin/withdrawals', { params: { pendingOnly } }),
  completeWithdrawal: (id, note) => client.put(`/admin/withdrawals/${id}/complete`, { note }),
  rejectWithdrawal: (id, note) => client.put(`/admin/withdrawals/${id}/reject`, { note }),
};

export const contact = {
  send: (data) => client.post('/contact', data),
};

export const chat = {
  getConversation: (mode, config) => client.get('/chat/conversation', { headers: mode ? { 'X-User-Mode': mode } : {}, ...config }),
  sendConversationMessage: (content, lang, mode, config) => client.post('/chat/conversation/messages', { content, lang: lang || localStorage.getItem('saby_lang') || 'km' }, { headers: mode ? { 'X-User-Mode': mode } : {}, ...config }),
  getAdminConversations: (mode, config) => client.get('/chat/admin/conversations', { params: { mode: mode || 'buyer' }, ...config }),
  getAdminConversationById: (id, config) => client.get(`/chat/admin/conversations/${id}`, config),
  replyAdminConversation: (id, content, config) => client.post(`/chat/admin/conversations/${id}/messages`, { content }, config),
  getMessages: (orderId, config) => client.get(`/chat/orders/${orderId}`, config),
  sendMessage: (orderId, content, targetEmail, lang, channel, config) => client.post(`/chat/orders/${orderId}`, { content, targetEmail, channel, lang: lang || localStorage.getItem('saby_lang') || 'km' }, config),
  getUserMessages: (config) => client.get('/chat/my-chats', config),
  getSellerCustomerChats: (config) => client.get('/chat/seller/customer-chats', config),
  adminGetAll: (config) => client.get('/chat/admin/all', config),
  editMessage: (messageId, content, config) => client.put(`/chat/messages/${messageId}`, { content }, config),
  deleteMessage: (messageId, config) => client.delete(`/chat/messages/${messageId}`, { params: { hardDelete: true }, ...config }),
  deleteOrderChat: (orderId, config) => client.delete(`/chat/admin/orders/${orderId}`, config),
  uploadMedia: (file, config) => {
    const formData = new FormData();
    formData.append('file', file);
    return client.post('/chat/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...config
    });
  },
};

export const devices = {
  getUserDevices: (config) => client.get('/devices', config),
  revokeDevice: (id) => client.post(`/devices/${id}/revoke`),
  revokeOtherDevices: () => client.post('/devices/revoke-others'),
  getAdminLoginLogs: () => client.get('/admin/devices/logs'),
  getAdminActiveDevices: () => client.get('/admin/devices/active'),
  adminRevokeDevice: (id) => client.post(`/admin/devices/${id}/revoke`),
  adminRevokeAllSystemDevices: () => client.post('/admin/devices/revoke-all-system'),
};

export const seller = {
  // Onboarding & Subscription Renewal
  apply: (data) => client.post('/seller/apply', data),
  verifySubscription: () => client.post('/seller/verify-subscription'),
  renewSubscription: (paymentId, planId) => client.post('/seller/renew-subscription', { paymentId, planId }),
  checkStoreName: (name) => client.get('/seller/check-store-name', { params: { name } }),
  // File Upload
  uploadImage: (formData) => client.post('/seller/upload', formData),
  // Profile
  getProfile: () => client.get('/seller/profile'),
  updateProfile: (data) => client.put('/seller/profile', data),
  getPublicProfile: (sellerId) => client.get(`/seller/public/${sellerId}`),
  getPublicProducts: (sellerId) => client.get(`/seller/public/${sellerId}/products`),
  // Products
  getProducts: () => client.get('/seller/products'),
  createProduct: (data) => client.post('/seller/products', data),
  updateProduct: (id, data) => client.put(`/seller/products/${id}`, data),
  deleteProduct: (id) => client.delete(`/seller/products/${id}`),
  addStock: (productId, items) => client.post(`/seller/products/${productId}/stock`, { items }),
  getStock: (productId) => client.get(`/seller/products/${productId}/stock`),
  // Orders
  getOrders: () => client.get('/seller/orders'),
  updateOrderStatus: (id, status) => client.patch(`/seller/orders/${id}/status`, { status }),
  // Balance & Withdrawals
  getBalance: () => client.get('/seller/balance'),
  requestWithdrawal: (data) => client.post('/seller/withdraw', data),
  getWithdrawHistory: () => client.get('/seller/withdraw/history'),
  // Reviews
  getReviews: () => client.get('/reviews/seller'),
};

export const reviews = {
  submit: (data) => client.post('/reviews', data),
  getByProduct: (productId) => client.get(`/reviews/product/${productId}`),
  getSellerReviews: () => client.get('/reviews/seller'),
  getPublicSellerReviews: (sellerId) => client.get(`/reviews/seller/${sellerId}`),
  checkReviewed: (productId, orderId) => client.get('/reviews/check', { params: { productId, orderId } }),
  getAverageRating: (productId) => client.get(`/reviews/product/${productId}/rating`),
};

export const disputes = {
  create: (orderId, data) => client.post(`/disputes/orders/${orderId}`, data),
  getByOrderId: (orderId) => client.get(`/disputes/orders/${orderId}`),
  getBuyerDisputes: () => client.get('/disputes/my-disputes'),
  getSellerDisputes: () => client.get('/disputes/seller'),
  sellerRespond: (id, data) => client.post(`/disputes/${id}/seller-respond`, data),
  adminGetAll: () => client.get('/disputes/admin/all'),
  adminResolve: (id, data) => client.post(`/disputes/${id}/admin-resolve`, data),
};

export const coupons = {
  create: (data) => client.post('/seller/coupons', data),
  getSellerCoupons: () => client.get('/seller/coupons'),
  update: (id, data) => client.put(`/seller/coupons/${id}`, data),
  delete: (id) => client.delete(`/seller/coupons/${id}`),
  validate: (data) => client.post('/coupons/validate', data),
  adminGetAll: () => client.get('/admin/coupons'),
  adminDelete: (id) => client.delete(`/admin/coupons/${id}`),
};

export const payments = {
  getAll: () => client.get('/admin/payments'),
  getMyPayments: () => client.get('/payments/my-payments'),
  getAdminCommissions: () => client.get('/admin/commissions'),
  getAdminRefunds: () => client.get('/admin/refunds'),
};

export const wallet = {
  getMyWallet: () => client.get('/seller/wallet'),
  getTransactions: () => client.get('/seller/wallet/transactions'),
  getPayoutMethods: () => client.get('/seller/payout-methods'),
  savePayoutMethod: (data) => client.post('/seller/payout-methods', data),
  deletePayoutMethod: (id) => client.delete(`/seller/payout-methods/${id}`),
  getCommissions: () => client.get('/seller/commissions'),
};

export const support = {
  getMyTickets: () => client.get('/support/threads/my-tickets'),
  createTicket: (data) => client.post('/support/threads', data),
  replyTicket: (id, message) => client.post(`/support/threads/${id}/reply`, { message }),
  updateTicketStatus: (id, status) => client.patch(`/support/threads/${id}/status`, { status }),
  adminGetAllTickets: () => client.get('/support/threads/admin/all'),
};

export const notifications = {
  getAll: () => client.get('/notifications'),
  getUnreadCount: () => client.get('/notifications/unread-count'),
  markAsRead: (id) => client.patch(`/notifications/${id}/read`),
  markAllAsRead: () => client.post('/notifications/read-all'),
  broadcast: (data) => client.post('/notifications/broadcast', data),
};

export const favorites = {
  getAll: () => client.get('/favorites'),
  toggle: (productId) => client.post(`/favorites/${productId}/toggle`),
  check: (productId) => client.get(`/favorites/${productId}/check`),
};

export const orderExtensions = {
  getHistory: (orderId) => client.get(`/orders/${orderId}/history`),
  getDeliveries: (orderId) => client.get(`/orders/${orderId}/deliveries`),
  getRefunds: (orderId) => client.get(`/orders/${orderId}/refunds`),
};

export const disputeExtensions = {
  getMessages: (disputeId) => client.get(`/disputes/${disputeId}/messages`),
  sendMessage: (disputeId, data) => client.post(`/disputes/${disputeId}/messages`, data),
  getEvidence: (disputeId) => client.get(`/disputes/${disputeId}/evidence`),
  addEvidence: (disputeId, data) => client.post(`/disputes/${disputeId}/evidence`, data),
};

export const adminAudit = {
  getAuditActions: () => client.get('/admin/audit-actions'),
  getActiveSessions: () => client.get('/admin/sessions'),
};

export default client;
