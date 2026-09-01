import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { seller as sellerApi, admin as adminApi, coupons as couponsApi, disputes as disputesApi, reviews as reviewsApi, wallet as walletApi, categories as categoriesApi } from '../api/client';
import toast from 'react-hot-toast';
import {
  FiPackage, FiDollarSign, FiShoppingBag, FiClock,
  FiEdit2, FiTrash2, FiPlus, FiCheck, FiX, FiUpload, FiUploadCloud, FiRefreshCw,
  FiExternalLink, FiChevronLeft, FiChevronRight, FiAlertTriangle, FiHome, FiStar, FiInfo, FiImage, FiMessageSquare, FiUser, FiLogOut,
  FiMenu, FiMonitor, FiSmartphone, FiDatabase, FiHeadphones, FiPercent, FiSettings, FiShield,
  FiTag, FiCopy, FiShare2, FiSend, FiCalendar, FiCheckCircle, FiEye, FiLayers, FiFilter, FiSearch, FiGlobe, FiCreditCard, FiList, FiLifeBuoy
} from 'react-icons/fi';
import { FaTelegram } from 'react-icons/fa';
import { MdStorefront, MdDashboard, MdVerified, MdAccountBalanceWallet } from 'react-icons/md';
import SellerWithdrawModal from '../components/SellerWithdrawModal';
import SellerStockModal from '../components/SellerStockModal';
import SellerSubscriptionModal from '../components/SellerSubscriptionModal';
import SellerSubscriptionRenewalModal from '../components/SellerSubscriptionRenewalModal';
import ConfirmModeSwitchModal from '../components/ConfirmModeSwitchModal';
import ConfirmDeleteCouponModal from '../components/ConfirmDeleteCouponModal';
import ConfirmCompleteDiscountModal from '../components/ConfirmCompleteDiscountModal';
import ConfirmRemoveDiscountModal from '../components/ConfirmRemoveDiscountModal';
import SellerPolicyWalkthroughModal from '../components/SellerPolicyWalkthroughModal';
import ContactAdminModal from '../components/ContactAdminModal';
import SellerTelegramBotModal from '../components/SellerTelegramBotModal';
import SellerDisputeModal from '../components/SellerDisputeModal';
import SellerCustomerInboxPage from './SellerCustomerInboxPage';
import SellerAdminChatPage from './SellerAdminChatPage';
import ChatHistoryPage from './ChatHistoryPage';
import { DIGITAL_PRODUCT_TYPES, PRODUCT_DURATIONS, PRODUCT_LABELS, getCategoryTypes, getDefaultTypeForCategory } from '../utils/productOptions';
import { normalizeImageUrl, extractDeliveryProofUrl } from '../utils/imageUrl';
import { useLanguage } from '../context/LanguageContext';
import { maskName } from '../utils/maskUtils';
import './admin/admin.css';

const TABS = ['overview', 'products', 'orders', 'wallet', 'chats', 'coupons', 'withdrawals'];
const TAB_LABELS = {
 overview: { label: 'Overview', icon: FiHome },
 products: { label: 'Products', icon: FiPackage },
 orders: { label: 'Sales Orders', icon: FiShoppingBag },
 wallet: { label: 'Wallet & Ledger', icon: MdAccountBalanceWallet },
 chats: { label: 'Customer Chats', icon: FiMessageSquare },
 coupons: { label: 'Coupons & Promo', icon: FiPercent },
 withdrawals: { label: 'Withdrawals', icon: FiDollarSign }
};

const StatusBadge = ({ status, isKhmer }) => {
  const labels = {
    PENDING: isKhmer ? 'មិនទាន់បានទូទាត់' : 'UNPAID / PENDING',
    PROCESSING: isKhmer ? 'បានទូទាត់ (ដំណើរការ)' : 'PAID / PROCESSING',
    DELIVERED: isKhmer ? 'បានប្រគល់' : 'DELIVERED',
    COMPLETED: isKhmer ? 'រួចរាល់' : 'COMPLETED',
    CANCELLED: isKhmer ? 'បានបោះបង់' : 'CANCELLED',
    WAITING_FOR_STOCK: isKhmer ? 'រង់ចាំស្តុក' : 'WAITING FOR STOCK',
    REFUNDED: isKhmer ? 'បានសងប្រាក់' : 'REFUNDED',
    ACTIVE: isKhmer ? 'សកម្ម' : 'ACTIVE',
    EXPIRED: isKhmer ? 'ផុតកំណត់' : 'EXPIRED',
  };
  const colors = {
    ACTIVE: { bg: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' },
    EXPIRED: { bg: 'rgba(239,68,68,0.12)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' },
    PENDING: { bg: 'rgba(245,158,11,0.14)', color: '#D97706', border: '1px solid rgba(245,158,11,0.3)' },
    PROCESSING: { bg: 'rgba(59,130,246,0.12)', color: '#2563EB', border: '1px solid rgba(59,130,246,0.25)' },
    DELIVERED: { bg: 'rgba(16,185,129,0.12)', color: '#059669', border: '1px solid rgba(16,185,129,0.25)' },
    COMPLETED: { bg: 'rgba(16,185,129,0.14)', color: '#059669', border: '1px solid rgba(16,185,129,0.3)' },
    WAITING_FOR_STOCK: { bg: 'rgba(245,158,11,0.18)', color: '#D97706', border: '1px solid rgba(245,158,11,0.3)' },
    REFUNDED: { bg: 'rgba(99,102,241,0.12)', color: '#6366F1', border: '1px solid rgba(99,102,241,0.25)' },
    CANCELLED: { bg: 'rgba(239,68,68,0.12)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)' },
    REJECTED: { bg: 'rgba(239,68,68,0.12)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)' },
  };
  const c = colors[status] || { bg: 'rgba(100,116,139,0.1)', color: '#64748B' };
  const text = (isKhmer ? labels[status] : null) || status;
  return (
    <span style={{
      padding: '4px 10px',
      borderRadius: 20,
      fontSize: '0.74rem',
      fontWeight: 800,
      background: c.bg,
      color: c.color,
      border: c.border || 'none',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4
    }}>
      {text}
    </span>
  );
};

const getBuyerDisplayName = (order) => {
  if (!order) return 'Customer';
  if (order.claimNote && order.claimNote.trim() !== '') {
    return order.claimNote.trim();
  }
  if (order.customerName && order.customerName !== 'Customer' && order.customerName !== 'Unknown User') {
    return order.customerName;
  }
  if (order.user?.name && order.user.name !== 'Customer') {
    return order.user.name;
  }
  if (order.buyerName && order.buyerName !== 'Customer') {
    return order.buyerName;
  }
  if (order.buyerInviteEmail) {
    return order.buyerInviteEmail.split('@')[0];
  }
  if (order.customerEmail && order.customerEmail !== 'Unknown User') {
    return order.customerEmail.split('@')[0];
  }
  if (order.userEmail) {
    return order.userEmail.split('@')[0];
  }
  if (order.user?.email) {
    return order.user.email.split('@')[0];
  }
  return 'Customer';
};

const getBuyerFullDisplay = (order) => {
  return getBuyerDisplayName(order);
};

export default function SellerDashboardPage() {
 const { user } = useAuth();
 const navigate = useNavigate();
 const [searchParams] = useSearchParams();
 const { lang, isKhmer, setLang, directSetLang } = useLanguage();
 const [tab, setTab] = useState('overview');
 const [profile, setProfile] = useState(null);
 const [products, setProducts] = useState([]);
 const [orders, setOrders] = useState([]);
 const [withdrawals, setWithdrawals] = useState([]);
 const [categories, setCategories] = useState([]);
 const [couponsList, setCouponsList] = useState([]);
 const [disputesList, setDisputesList] = useState([]);
 const [selectedDispute, setSelectedDispute] = useState(null);
 const [disputeFilter, setDisputeFilter] = useState('ALL');
 const [loading, setLoading] = useState(true);
 const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
 const [showRenewalModal, setShowRenewalModal] = useState(false);
 const [pendingPlanId, setPendingPlanId] = useState('PLAN_1');
 const [pendingPlanPrice, setPendingPlanPrice] = useState(2.50);
 const [showWithdrawModal, setShowWithdrawModal] = useState(false);
 const [editingProfile, setEditingProfile] = useState(false);
 const [profileForm, setProfileForm] = useState({ storeName: '', storeDescription: '', storeLogoUrl: '' });

 // Auto-handle query params (e.g. from Telegram bot renewal button: /seller?tab=overview&openRenewal=true)
 useEffect(() => {
   const requestedTab = searchParams.get('tab');
   if (requestedTab && TABS.includes(requestedTab.toLowerCase())) {
     setTab(requestedTab.toLowerCase());
   }
   const openRenewalParam = searchParams.get('openRenewal');
   if (openRenewalParam === 'true' || openRenewalParam === '1') {
     const plan = profile?.subscriptionPlan || 'PLAN_1';
     const price = (plan === 'PLAN_3' ? 6.00 : (plan === 'PLAN_2' ? 4.50 : 2.50));
     setPendingPlanId(plan);
     setPendingPlanPrice(price);
     setShowRenewalModal(true);
   }
 }, [searchParams, profile]);
 const [showAddProduct, setShowAddProduct] = useState(false);
 const [productForm, setProductForm] = useState({ name: '', description: '', basePrice: '', originalPrice: '', imageUrl: '', categoryId: '', productType: 'ACCOUNT', duration: '1 Month', productLabel: '' });
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingProductImg, setUploadingProductImg] = useState(false);
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [manageStockProduct, setManageStockProduct] = useState(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [isPolicyWalkthroughOpen, setIsPolicyWalkthroughOpen] = useState(false);
  const [showContactAdminModal, setShowContactAdminModal] = useState(false);
  const [showTelegramBotModal, setShowTelegramBotModal] = useState(false);

  // Auto-open Replace Policy walkthrough once for new sellers
  useEffect(() => {
    if (user?.id && user?.role === 'SELLER') {
      const key = `seller_policy_walkthrough_seen_${user.id}`;
      if (!localStorage.getItem(key)) {
        setIsPolicyWalkthroughOpen(true);
        localStorage.setItem(key, 'true');
      }
    }
  }, [user]);

  // Sync active seller tab with body attribute & custom event for floating widget
  useEffect(() => {
    document.body.setAttribute('data-seller-tab', tab);
    window.dispatchEvent(new CustomEvent('seller-tab-change', { detail: tab }));
    return () => {
      document.body.removeAttribute('data-seller-tab');
      window.dispatchEvent(new CustomEvent('seller-tab-change', { detail: null }));
    };
  }, [tab]);

  // Phone Drawer Navigation
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Promotions & Coupon state
  const [promoSubTab, setPromoSubTab] = useState('coupons'); // 'coupons' | 'product_discounts'
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [creatingCoupon, setCreatingCoupon] = useState(false);
  const [deleteConfirmCoupon, setDeleteConfirmCoupon] = useState(null);
  const [completeDiscountProduct, setCompleteDiscountProduct] = useState(null);
  const [completingDiscount, setCompletingDiscount] = useState(false);
  const [removeConfirmDiscountProduct, setRemoveConfirmDiscountProduct] = useState(null);
  const [removingDiscount, setRemovingDiscount] = useState(false);
  const [deletingCoupon, setDeletingCoupon] = useState(false);
  const [deletingCouponId, setDeletingCouponId] = useState(null);
  const [shareCoupon, setShareCoupon] = useState(null);
  const [couponForm, setCouponForm] = useState({
    code: '', discountType: 'PERCENTAGE', discountValue: '10',
    minSpend: '', maxDiscount: '', usageLimit: '100', daysValid: '30',
    applyScope: 'ALL', productId: ''
  });

  // Direct Product Discount Tool state
  const [quickDiscountProduct, setQuickDiscountProduct] = useState(null);
  const [quickDiscountForm, setQuickDiscountForm] = useState({
    originalPrice: '', salePrice: '', productLabel: 'PROMO'
  });
  const [discountHistory, setDiscountHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(`seller_discount_history_${user?.id || 'default'}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (user?.id) {
      try {
        const saved = localStorage.getItem(`seller_discount_history_${user.id}`);
        if (saved) {
          setDiscountHistory(JSON.parse(saved));
        }
      } catch (err) {
        console.error('Failed to load discount history', err);
      }
    }
  }, [user?.id]);

  const saveDiscountHistory = (newList) => {
    setDiscountHistory(newList);
    try {
      localStorage.setItem(`seller_discount_history_${user?.id || 'default'}`, JSON.stringify(newList));
    } catch (err) {
      console.error('Failed to save discount history', err);
    }
  };

  // Orders filter & View Product modal state
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const orderFilterScrollRef = useRef(null);
  const scrollOrderFilters = (direction) => {
    if (orderFilterScrollRef.current) {
      orderFilterScrollRef.current.scrollBy({
        left: direction === 'left' ? -200 : 200,
        behavior: 'smooth'
      });
    }
  };
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [selectedOrderForView, setSelectedOrderForView] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // Wallet & Financial Ledger states (Tables 24, 25, 31, 32)
  const [walletInfo, setWalletInfo] = useState(null);
  const [walletTxs, setWalletTxs] = useState([]);
  const [payoutMethods, setPayoutMethods] = useState([]);
  const [commissionsData, setCommissionsData] = useState([]);
  const [showAddPayoutModal, setShowAddPayoutModal] = useState(false);
  const [newPayoutForm, setNewPayoutForm] = useState({
    methodType: 'BAKONG_KHQR',
    accountName: '',
    accountNumber: '',
    bankName: 'ABA Bank KHQR',
    khqrData: '',
    khqrImageUrl: '',
    isDefault: true
  });
  const [savingPayout, setSavingPayout] = useState(false);

  // Reviews state & Star filter
  const [reviewStarFilter, setReviewStarFilter] = useState('ALL');
  const [reviewsList, setReviewsList] = useState([]);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      try {
        await sellerApi.updateOrderStatus(orderId, newStatus);
      } catch (e) {
        await adminApi.updateOrderStatus(orderId, newStatus);
      }
      toast.success(isKhmer ? `បានផ្លាស់ប្ដូរស្ថានភាពទៅ ${newStatus}!` : `Order status updated to ${newStatus}!`);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrderForView && selectedOrderForView.id === orderId) {
        setSelectedOrderForView(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || (isKhmer ? 'បរាជ័យក្នុងការប្ដូរស្ថានភាព' : 'Failed to update order status'));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Seller Deliver Order Modal state & Proof upload
  const [deliverModalOrder, setDeliverModalOrder] = useState(null);
  const [deliverForm, setDeliverForm] = useState({
    accountEmail: '',
    accountPassword: '',
    deliveryNote: '',
    proofImage: ''
  });
  const [uploadingDeliveryProof, setUploadingDeliveryProof] = useState(false);
  const [deliveringOrder, setDeliveringOrder] = useState(false);
  const [zoomProofImage, setZoomProofImage] = useState(null);

  const handleOpenDeliverModal = (order) => {
    if (!order || order.status === 'COMPLETED' || order.status === 'CANCELLED' || order.status === 'REFUNDED') {
      toast.error(isKhmer ? 'ការបញ្ជាទិញនេះបានបញ្ចប់រួចរាល់ មិនអាចកែប្រែភស្តុតាងបានទេ' : 'This order is already completed and cannot be modified.');
      return;
    }
    const firstItm = order.items?.[0] || order.product;
    const existingAcc = firstItm?.account || {};
    const existingNote = order.sellerDeliveryNote || existingAcc.note || '';
    const extractedProof = order.deliveryProofUrl || (existingNote.match(/\[PROOF_URL:(.*?)\]/)?.[1] || '');
    const cleanNote = existingNote.replace(/\[PROOF_URL:.*?\]/g, '').trim();

    setDeliverForm({
      accountEmail: order.manualAccountEmail || existingAcc.email || '',
      accountPassword: order.manualAccountPassword || existingAcc.password || '',
      deliveryNote: cleanNote,
      proofImage: extractedProof
    });
    setDeliverModalOrder(order);
  };

  const handleDeliveryProofUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDeliveryProof(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await sellerApi.uploadImage(formData);
      const url = res.data?.url || res.data;
      setDeliverForm(f => ({ ...f, proofImage: url }));
      toast.success(isKhmer ? 'បាន Upload រូបភាពភស្តុតាងជោគជ័យ!' : 'Proof image uploaded successfully!');
    } catch (err) {
      toast.error(err?.response?.data?.message || (isKhmer ? 'មិនអាច Upload រូបភាពបានទេ' : 'Failed to upload proof image'));
    } finally {
      setUploadingDeliveryProof(false);
    }
  };

  const handleConfirmDelivery = async (e) => {
    e.preventDefault();
    if (!deliverModalOrder) return;
    setDeliveringOrder(true);
    const orderId = deliverModalOrder.id;
    try {
      let finalNote = deliverForm.deliveryNote || '';
      if (deliverForm.proofImage) {
        finalNote = finalNote ? `${finalNote}\n[PROOF_URL:${deliverForm.proofImage}]` : `[PROOF_URL:${deliverForm.proofImage}]`;
      }

      // Deliver via orders delivery / updateOrderStatus
      try {
        const { orders: ordersApi } = await import('../api/client');
        await ordersApi.deliver(orderId, {
          accountEmail: deliverForm.accountEmail,
          accountPassword: deliverForm.accountPassword,
          deliveryNote: finalNote
        });
      } catch (_) {
        try {
          await sellerApi.updateOrderStatus(orderId, 'DELIVERED');
        } catch (e2) {
          await adminApi.updateOrderStatus(orderId, 'DELIVERED');
        }
      }

      toast.success(isKhmer ? 'បានប្រគល់ទំនិញជូនអតិថិជនរួចរាល់!' : 'Order marked as Delivered with proof!');
      setOrders(prev => prev.map(o => o.id === orderId ? {
        ...o,
        status: 'DELIVERED',
        manualAccountEmail: deliverForm.accountEmail,
        manualAccountPassword: deliverForm.accountPassword,
        sellerDeliveryNote: finalNote,
        deliveryProofUrl: deliverForm.proofImage
      } : o));

      if (selectedOrderForView && selectedOrderForView.id === orderId) {
        setSelectedOrderForView(prev => ({
          ...prev,
          status: 'DELIVERED',
          manualAccountEmail: deliverForm.accountEmail,
          manualAccountPassword: deliverForm.accountPassword,
          sellerDeliveryNote: finalNote,
          deliveryProofUrl: deliverForm.proofImage
        }));
      }

      setDeliverModalOrder(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || (isKhmer ? 'បរាជ័យក្នុងការប្រគល់ទំនិញ' : 'Failed to deliver order'));
    } finally {
      setDeliveringOrder(false);
    }
  };

  const handleLogoFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploadingLogo(true);
    try {
      const res = await sellerApi.uploadImage(formData);
      const url = res.data?.url || res.data;
      setProfileForm(f => ({ ...f, storeLogoUrl: url }));
      toast.success('Store logo uploaded!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Image upload failed');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleProductImageFileUpload = async (e) => {
    const file = e.target?.files?.[0] || e;
    if (!file) return;
    if (file.type && !file.type.startsWith('image/')) {
      toast.error(isKhmer ? 'សូមជ្រើសរើស File រូបភាពប៉ុណ្ណោះ' : 'Please select an image file');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    setUploadingProductImg(true);
    try {
      const res = await sellerApi.uploadImage(formData);
      const url = res.data?.data || res.data?.url || res.data || res;
      const cleanUrl = normalizeImageUrl(typeof url === 'string' ? url : '');
      setProductForm(f => ({ ...f, imageUrl: cleanUrl }));
      toast.success(isKhmer ? 'បាន Upload រូបភាពជោគជ័យ!' : 'Product image uploaded!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Image upload failed');
    } finally {
      setUploadingProductImg(false);
    }
  };

  useEffect(() => {
    if (!user || (user.role !== 'SELLER' && user.role !== 'ADMIN')) {
      navigate('/seller/onboard');
    }
  }, [user, navigate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, productsRes, withdrawRes, catsRes, ordersRes, couponsRes, disputesRes, reviewsRes, walletRes, txsRes, payoutRes, commRes] = await Promise.allSettled([
        sellerApi.getProfile(),
        sellerApi.getProducts(),
        sellerApi.getWithdrawHistory(),
        categoriesApi.getAll(),
        sellerApi.getOrders(),
        couponsApi.getSellerCoupons(),
        disputesApi.getSellerDisputes(),
        reviewsApi.getSellerReviews(),
        walletApi.getMyWallet(),
        walletApi.getTransactions(),
        walletApi.getPayoutMethods(),
        walletApi.getCommissions()
      ]);
      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data);
      if (productsRes.status === 'fulfilled') {
        const pList = Array.isArray(productsRes.value.data) ? productsRes.value.data : (productsRes.value.data?.data || []);
        const sortedNewest = [...pList].sort((a, b) => (b.id || 0) - (a.id || 0));
        setProducts(sortedNewest);
      }
      if (withdrawRes.status === 'fulfilled') setWithdrawals(withdrawRes.value.data || []);
      if (catsRes.status === 'fulfilled') {
        const cList = Array.isArray(catsRes.value.data) ? catsRes.value.data : (catsRes.value.data?.data || []);
        setCategories(cList);
      }
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data || []);
      if (couponsRes.status === 'fulfilled') setCouponsList(Array.isArray(couponsRes.value.data) ? couponsRes.value.data : []);
      if (disputesRes.status === 'fulfilled') setDisputesList(Array.isArray(disputesRes.value.data) ? disputesRes.value.data : []);
      if (reviewsRes.status === 'fulfilled') {
        const rData = reviewsRes.value.data;
        setReviewsList(Array.isArray(rData) ? rData : (rData?.content || []));
      }
      if (walletRes.status === 'fulfilled') {
        const w = walletRes.value.data?.data || walletRes.value.data;
        setWalletInfo(w);
      }
      if (txsRes.status === 'fulfilled') {
        const txs = Array.isArray(txsRes.value.data) ? txsRes.value.data : (txsRes.value.data?.data || []);
        setWalletTxs(txs);
      }
      if (payoutRes.status === 'fulfilled') {
        const pm = Array.isArray(payoutRes.value.data) ? payoutRes.value.data : (payoutRes.value.data?.data || []);
        setPayoutMethods(pm);
      }
      if (commRes.status === 'fulfilled') {
        const cm = Array.isArray(commRes.value.data) ? commRes.value.data : (commRes.value.data?.data || []);
        setCommissionsData(cm);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const balance = profile?.balance ?? 0;
  const hasDuplicateWarning = Boolean(profile?.duplicateWarning);
  const lastChangeDate = profile?.lastStoreNameChangedAt ? new Date(profile.lastStoreNameChangedAt) : null;
  const daysSinceNameChange = lastChangeDate ? (Date.now() - lastChangeDate.getTime()) / (1000 * 60 * 60 * 24) : 999;
  const isStoreNameLocked = Boolean(lastChangeDate && daysSinceNameChange < 30) && !hasDuplicateWarning;
  const daysRemaining = isStoreNameLocked ? Math.ceil(30 - daysSinceNameChange) : 0;
  const nextAllowedDate = lastChangeDate ? new Date(lastChangeDate.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString() : '';

  const handleSaveProfile = async () => {
    if (isStoreNameLocked && profileForm.storeName.trim() !== profile?.storeName) {
      return toast.error(`អ្នកអាចផ្លាស់ប្តូរឈ្មោះហាងបានតែ 1 ដងគត់ក្នុងរយៈពេល 1 ខែ! សូមរង់ចាំ ${daysRemaining} ថ្ងៃទៀត។`);
    }
    try {
      const res = await sellerApi.updateProfile(profileForm);
      setProfile(res.data);
      setEditingProfile(false);
      toast.success(isKhmer ? 'ព័ត៌មានអក្សរហាងត្រូវបានរក្សាទុកដោយជោគជ័យ!' : 'Store profile text updated successfully!');
    } catch (err) {
      toast.error(err?.response?.data?.message || (isKhmer ? 'បរាជ័យក្នុងការកែប្រែព័ត៌មានហាង' : 'Failed to update profile'));
    }
  };

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.basePrice) return toast.error(isKhmer ? 'សូមបញ្ចូលឈ្មោះ និងតម្លៃ' : 'Name and price are required');
    if (!productForm.productLabel) return toast.error(isKhmer ? 'សូមជ្រើសរើសស្លាកសញ្ញាទំនិញ!' : 'Please select a Product Badge / Label!');
    try {
      const payload = {
        ...productForm,
        basePrice: parseFloat(productForm.basePrice),
        originalPrice: productForm.originalPrice ? parseFloat(productForm.originalPrice) : null,
      };
      if (editingProduct) {
        await sellerApi.updateProduct(editingProduct.id, payload);
        toast.success('Product updated!');
      } else {
        await sellerApi.createProduct(payload);
        toast.success('Product created!');
      }
      setShowAddProduct(false);
      setEditingProduct(null);
      setProductForm({ name: '', description: '', basePrice: '', originalPrice: '', imageUrl: '', categoryId: '', productType: 'ACCOUNT', duration: '1 Month', productLabel: '' });
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save product');
    }
  };

  const handleDeleteProduct = (product) => {
    setDeleteConfirmProduct(product);
  };

  const confirmDeleteProduct = async () => {
    if (!deleteConfirmProduct) return;
    setDeletingProduct(true);
    try {
      await sellerApi.deleteProduct(deleteConfirmProduct.id);
      toast.success(`Product "${deleteConfirmProduct.name}" deleted successfully!`);
      setDeleteConfirmProduct(null);
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeletingProduct(false);
    }
  };

 const handleEditProduct = (product) => {
 setEditingProduct(product);
 setProductForm({
 name: product.name || '',
 description: product.description || '',
 basePrice: product.basePrice || product.price || '',
 originalPrice: product.originalPrice || '',
 imageUrl: product.imageUrl || '',
 categoryId: product.categoryId || '',
 productType: product.productType || 'ACCOUNT',
 duration: product.duration || '1 Month',
 productLabel: product.productLabel || '',
 });
 setShowAddProduct(true);
 };

 //  Apply Direct Discount to Product 
 const handleApplyProductDiscount = async () => {
 if (!quickDiscountProduct) return;
 const saleP = parseFloat(quickDiscountForm.salePrice);
 if (isNaN(saleP) || saleP <= 0) {
 return toast.error(isKhmer ? 'សូមបញ្ចូលតម្លៃបញ្ចុះត្រឹមត្រូវ' : 'Please enter a valid discounted price');
 }
 const origP = parseFloat(quickDiscountForm.originalPrice || quickDiscountProduct.originalPrice || quickDiscountProduct.basePrice || quickDiscountProduct.price || saleP);
 try {
 const payload = {
 ...quickDiscountProduct,
 basePrice: saleP,
 price: saleP,
 originalPrice: origP > saleP ? origP : origP,
 productLabel: quickDiscountForm.productLabel || 'PROMO'
 };
 await sellerApi.updateProduct(quickDiscountProduct.id, payload);
 toast.success(isKhmer ? 'បានកំណត់តម្លៃបញ្ចុះ និងស្លាកសញ្ញាជោគជ័យ!' : 'Discount Price & Promo Badge updated!');
 setQuickDiscountProduct(null);
 loadData();
 } catch (err) {
 toast.error(err?.response?.data?.message || (isKhmer ? 'បរាជ័យក្នុងការកំណត់តម្លៃបញ្ចុះ' : 'Failed to update product discount'));
 }
 };

 //  Complete Direct Discount (End Promo & Save to History with Selectable Reason Message) 
  const handleCompleteProductDiscount = (product) => {
    setCompleteDiscountProduct(product);
  };

  const confirmCompleteProductDiscount = async ({ reason, reasonId, customNote }) => {
    if (!completeDiscountProduct) return;
    const product = completeDiscountProduct;
    const origP = product.originalPrice ? parseFloat(product.originalPrice) : parseFloat(product.basePrice || product.price || 0);
    const currentP = parseFloat(product.basePrice || product.price || 0);
    const pct = origP > currentP ? Math.round(((origP - currentP) / origP) * 100) : 0;

    setCompletingDiscount(true);
    try {
      const payload = {
        ...product,
        basePrice: origP,
        price: origP,
        originalPrice: null,
        productLabel: 'NONE'
      };
      await sellerApi.updateProduct(product.id, payload);

      // Record to discount history with selected message/reason
      const historyItem = {
        id: 'dh_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        productId: product.id,
        productName: product.name,
        imageUrl: product.imageUrl,
        originalPrice: origP,
        salePrice: currentP,
        discountPercent: pct,
        productLabel: product.productLabel || 'PROMO',
        completedAt: new Date().toISOString(),
        status: 'COMPLETED',
        reason: reason || 'Promotion Ended',
        reasonId: reasonId || 'expired',
        customNote: customNote || ''
      };

      const updatedHistory = [historyItem, ...discountHistory.filter(h => h.id !== historyItem.id)];
      saveDiscountHistory(updatedHistory);

      toast.success(isKhmer
        ? 'ការបញ្ចុះតម្លៃត្រូវបានបញ្ចប់ដោយជោគជ័យ និងបានរក្សាទុកក្នុងប្រវត្តិ!'
        : 'Discount completed successfully and saved to history!'
      );
      setCompleteDiscountProduct(null);
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || (isKhmer ? 'បរាជ័យក្នុងការបញ្ចប់ការបញ្ចុះតម្លៃ' : 'Failed to complete discount'));
    } finally {
      setCompletingDiscount(false);
    }
  };

  //  Remove Direct Discount from Product 
  const handleRemoveProductDiscount = (product) => {
    setRemoveConfirmDiscountProduct(product);
  };

  const confirmRemoveProductDiscount = async () => {
    if (!removeConfirmDiscountProduct) return;
    const product = removeConfirmDiscountProduct;
    const origP = product.originalPrice ? parseFloat(product.originalPrice) : parseFloat(product.basePrice || product.price || 0);
    const currentP = parseFloat(product.basePrice || product.price || 0);
    const pct = origP > currentP ? Math.round(((origP - currentP) / origP) * 100) : 0;

    setRemovingDiscount(true);
    try {
      const payload = {
        ...product,
        basePrice: origP,
        price: origP,
        originalPrice: null,
        productLabel: 'NONE'
      };
      await sellerApi.updateProduct(product.id, payload);

      const historyItem = {
        id: 'dh_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        productId: product.id,
        productName: product.name,
        imageUrl: product.imageUrl,
        originalPrice: origP,
        salePrice: currentP,
        discountPercent: pct,
        productLabel: product.productLabel || 'PROMO',
        completedAt: new Date().toISOString(),
        status: 'REMOVED'
      };
      saveDiscountHistory([historyItem, ...discountHistory]);

      toast.success(isKhmer ? 'បានលុបការបញ្ចុះតម្លៃទំនិញ' : 'Product discount removed');
      setRemoveConfirmDiscountProduct(null);
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to remove discount');
    } finally {
      setRemovingDiscount(false);
    }
  };

  const handleReapplyDiscount = (historyItem) => {
 const foundProduct = products.find(p => String(p.id) === String(historyItem.productId));
 if (foundProduct) {
 setQuickDiscountProduct(foundProduct);
 setQuickDiscountForm({
 originalPrice: historyItem.originalPrice || foundProduct.originalPrice || foundProduct.basePrice || '',
 salePrice: historyItem.salePrice || '',
 productLabel: historyItem.productLabel || 'PROMO'
 });
 window.scrollTo({ top: 0, behavior: 'smooth' });
 toast.success(isKhmer
 ? `បានជ្រើសរើសទំនិញ "${foundProduct.name}" សូមពិនិត្យតម្លៃបញ្ចុះ រួចចុចអនុវត្ត!`
 : `Loaded discount template for "${foundProduct.name}". Review and apply!`
 );
 } else {
 toast.error(isKhmer ? 'មិនអាចស្វែងរកទំនិញនេះក្នុងបញ្ជីបានឡើយ (ប្រហែលត្រូវបានលុប)' : 'Product not found in current inventory');
 }
 };

 const handleDeleteHistoryItem = (id) => {
 const updated = discountHistory.filter(item => item.id !== id);
 saveDiscountHistory(updated);
 toast.success(isKhmer ? 'បានលុបចេញពីប្រវត្តិ' : 'Removed from history');
 };

 const handleClearAllHistory = () => {
 if (!window.confirm(isKhmer ? 'តើអ្នកប្រាកដជាចង់សម្អាតប្រវត្តិបញ្ចុះតម្លៃទាំងអស់?' : 'Clear all discount history?')) return;
 saveDiscountHistory([]);
 toast.success(isKhmer ? 'បានសម្អាតប្រវត្តិទាំងអស់' : 'All discount history cleared');
 };

 //  Auto-generate random coupon code 
 const generateCode = () => {
 const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
 const prefix = profile?.storeName ? profile.storeName.replace(/\s+/g, '').toUpperCase().slice(0, 4) : 'SHOP';
 const suffix = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
 setCouponForm(f => ({ ...f, code: `${prefix}-${suffix}` }));
 };

 //  Create coupon via API 
 const handleCreateCoupon = async () => {
 if (!couponForm.code.trim()) return toast.error(isKhmer ? 'សូមដាក់ឈ្មោះកូដ' : 'Coupon code is required');
 if (!couponForm.discountValue || Number(couponForm.discountValue) <= 0) return toast.error(isKhmer ? 'សូមដាក់តម្លៃបញ្ចុះ' : 'Discount value is required');
 if (couponForm.applyScope === 'SPECIFIC' && !couponForm.productId) {
 return toast.error(isKhmer ? 'សូមជ្រើសរើសទំនិញដែលត្រូវបញ្ចុះតម្លៃ' : 'Please select a specific product');
 }
 setCreatingCoupon(true);
 try {
 const payload = {
 code: couponForm.code.trim().toUpperCase(),
 discountType: couponForm.discountType,
 discountValue: parseFloat(couponForm.discountValue),
 minSpend: couponForm.minSpend ? parseFloat(couponForm.minSpend) : null,
 maxDiscount: couponForm.maxDiscount ? parseFloat(couponForm.maxDiscount) : null,
 usageLimit: couponForm.usageLimit ? parseInt(couponForm.usageLimit) : null,
 daysValid: couponForm.daysValid ? parseInt(couponForm.daysValid) : 30,
 productId: couponForm.applyScope === 'SPECIFIC' && couponForm.productId ? parseInt(couponForm.productId) : null
 };
 await couponsApi.create(payload);
 toast.success(isKhmer ? `បានបង្កើតកូដ ${payload.code} ជោគជ័យ!` : `Coupon ${payload.code} created!`);
 setShowCouponModal(false);
 setCouponForm({ code: '', discountType: 'PERCENTAGE', discountValue: '10', minSpend: '', maxDiscount: '', usageLimit: '100', daysValid: '30', applyScope: 'ALL', productId: '' });
 loadData();
 } catch (err) {
 toast.error(err?.response?.data?.message || (isKhmer ? 'បរាជ័យក្នុងការបង្កើតកូដ' : 'Failed to create coupon'));
 } finally {
 setCreatingCoupon(false);
 }
 };

 //  Delete coupon handlers 
  const handleDeleteCoupon = (couponOrId, code) => {
    if (couponOrId && typeof couponOrId === 'object') {
      const targetProduct = couponOrId.productId ? products.find(p => p.id === couponOrId.productId) : null;
      setDeleteConfirmCoupon({
        ...couponOrId,
        productName: targetProduct?.name || ''
      });
      return;
    }
    const existing = couponsList.find(c => c.id === couponOrId);
    const targetProduct = existing?.productId ? products.find(p => p.id === existing.productId) : null;
    setDeleteConfirmCoupon(existing ? { ...existing, productName: targetProduct?.name || '' } : { id: couponOrId, code: code || 'COUPON' });
  };

  const confirmDeleteCoupon = async () => {
    if (!deleteConfirmCoupon) return;
    setDeletingCoupon(true);
    setDeletingCouponId(deleteConfirmCoupon.id);
    try {
      await couponsApi.delete(deleteConfirmCoupon.id);
      toast.success(isKhmer ? `បានលុបកូដ ${deleteConfirmCoupon.code} ដោយជោគជ័យ!` : `Coupon "${deleteConfirmCoupon.code}" deleted successfully!`);
      setDeleteConfirmCoupon(null);
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || (isKhmer ? 'បរាជ័យក្នុងការលុបកូដ' : 'Failed to delete coupon'));
    } finally {
      setDeletingCoupon(false);
      setDeletingCouponId(null);
    }
  };

  //  Share coupon via platform 
 const handleShareCoupon = async (coupon) => {
 const discountText = coupon.discountType === 'PERCENTAGE'
 ? `${coupon.discountValue}%`
 : `$${coupon.discountValue}`;
 const storeName = profile?.storeName || 'Our Store';
 const storeUrl = `${window.location.origin}/store/${user?.id}`;
 const msg = isKhmer
 ? `ប្រូម៉ូសិនពិសេស! ប្រើកូដ *${coupon.code}* ទទួលបានការបញ្ចុះ ${discountText}${coupon.minSpend ? ` (ទិញអប្បបរមា $${coupon.minSpend})` : ''}!\nចូលទៅទិញ: ${storeUrl}`
 : `Special Promo! Use code *${coupon.code}* to get ${discountText} off${coupon.minSpend ? ` (min spend $${coupon.minSpend})` : ''}!\nShop now: ${storeUrl}`;
 setShareCoupon({ coupon, msg, storeUrl, discountText });
 };

 const handleCopyCode = (code) => {
 navigator.clipboard.writeText(code);
 toast.success(isKhmer ? `បានចម្លងកូដ "${code}"!` : `Copied code "${code}"!`);
 };

 const handleCopyText = (text) => {
 navigator.clipboard.writeText(text);
 toast.success(isKhmer ? `បានចម្លងសារប្រូម៉ូសិន!` : `Copied promo message!`);
 };

 if (loading) return (
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
 <div className="loading-spinner" />
 </div>
 );

 return (
 <div className="admin-root seller-light-root">
 {/* Mobile Drawer Backdrop Overlay */}
 {mobileMenuOpen && (
 <div
 className="admin-sidebar-backdrop"
 onClick={() => setMobileMenuOpen(false)}
 style={{
 position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99,
 backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)'
 }}
 />
 )}

 {/*  1. Left Vertical Sidebar (Matching Admin Portal Layout)  */}
 <aside className={`admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
 <div className="admin-sidebar-logo">
 <div className="admin-sidebar-logo-icon" style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)' }}>
 <MdStorefront size={20} color="#fff" />
 </div>
 <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
 <span className="admin-sidebar-logo-text" style={{ fontSize: '0.98rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 4 }}>
 {profile?.storeName || 'Seller Hub'}
 <MdVerified size={15} color="#1d9bf0" />
 </span>
 <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#10b981', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
 {isKhmer ? 'ផ្ទាំងគ្រប់គ្រងអ្នកលក់' : 'SELLER PORTAL'}
 </span>
 </div>
 </div>

 <nav className="admin-sidebar-nav">

 {/*  GROUP 1: ផ្សេងៗ  */}
 <div className="admin-nav-section">
 <div className="admin-nav-section-title">{isKhmer ? 'ផ្សេងៗ' : 'GENERAL'}</div>
 <button
 className={`admin-nav-item ${tab === 'overview' ? 'active' : ''}`}
 onClick={() => { setTab('overview'); setMobileMenuOpen(false); }}
 >
 <MdDashboard className="admin-nav-icon" />
 <span className="admin-nav-label">{isKhmer ? 'ផ្ទាំងគ្រប់គ្រង' : 'Dashboard'}</span>
 </button>
 </div>

 {/*  GROUP 2: ការលក់  */}
 <div className="admin-nav-section">
 <div className="admin-nav-section-title">{isKhmer ? 'ការលក់' : 'SALES'}</div>

 <button
 className={`admin-nav-item ${tab === 'coupons' ? 'active' : ''}`}
 onClick={() => { setTab('coupons'); setMobileMenuOpen(false); }}
 >
 <FiPercent className="admin-nav-icon" style={{ color: '#F59E0B' }} />
 <span className="admin-nav-label">{isKhmer ? 'ប្រូម៉ូសិន & គូប៉ុងបញ្ចុះតម្លៃ' : 'Coupons & Promo'}</span>
 {couponsList.length > 0 && <span className="admin-nav-badge">{couponsList.length}</span>}
 </button>

 <button
 className={`admin-nav-item ${tab === 'orders' ? 'active' : ''}`}
 onClick={() => { setTab('orders'); setMobileMenuOpen(false); }}
 >
 <FiShoppingBag className="admin-nav-icon" />
 <span className="admin-nav-label">{isKhmer ? 'ការបញ្ជាទិញ' : 'Sales Orders'}</span>
 {orders.length > 0 && <span className="admin-nav-badge">{orders.length}</span>}
 </button>

 <button
 className={`admin-nav-item ${tab === 'chats' ? 'active' : ''}`}
 onClick={() => { setTab('chats'); setMobileMenuOpen(false); }}
 >
 <FiMessageSquare className="admin-nav-icon" style={{ color: '#10B981' }} />
 <span className="admin-nav-label">{isKhmer ? 'សារ និងជំនួយ' : 'Chats & Support'}</span>
 </button>
 </div>

 {/*  GROUP 3: គ្រប់គ្រងហាង  */}
 <div className="admin-nav-section">
 <div className="admin-nav-section-title">{isKhmer ? 'គ្រប់គ្រងហាង' : 'STORE MANAGEMENT'}</div>

 <button
 className={`admin-nav-item ${tab === 'store' ? 'active' : ''}`}
 onClick={() => { setTab('store'); setMobileMenuOpen(false); }}
 >
 <MdStorefront className="admin-nav-icon" />
 <span className="admin-nav-label">{isKhmer ? 'ព័ត៌មានហាង' : 'Store Profile'}</span>
 </button>

 <button
 className={`admin-nav-item ${tab === 'products' ? 'active' : ''}`}
 onClick={() => { setTab('products'); setMobileMenuOpen(false); }}
 >
 <FiPackage className="admin-nav-icon" style={{ color: '#6366F1' }} />
 <span className="admin-nav-label">{isKhmer ? 'មុខទំនិញ' : 'My Products'}</span>
 {products.length > 0 && <span className="admin-nav-badge">{products.length}</span>}
 </button>

            <button
              className={`admin-nav-item ${tab === 'reviews' ? 'active' : ''}`}
              onClick={() => { setTab('reviews'); setMobileMenuOpen(false); }}
            >
              <FiStar className="admin-nav-icon" style={{ color: '#F59E0B' }} />
              <span className="admin-nav-label">{isKhmer ? 'ការវាយតម្លៃ' : 'Customer Reviews'}</span>
              <span className="admin-nav-badge" style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' }}>
                {reviewsList.length > 0 ? reviewsList.length : ' 5.0'}
              </span>
            </button>

 <button
 className={`admin-nav-item ${tab === 'disputes' ? 'active' : ''}`}
 onClick={() => { setTab('disputes'); setMobileMenuOpen(false); }}
 >
 <FiAlertTriangle className="admin-nav-icon" style={{ color: '#EF4444' }} />
 <span className="admin-nav-label">{isKhmer ? 'ទំនាស់/ដាក់ពាក្យ' : 'Disputes & Claims'}</span>
 {disputesList.filter(d => d.status === 'OPEN').length > 0 && (
 <span className="admin-nav-badge" style={{ background: '#EF4444', color: '#fff', border: 'none' }}>
 {disputesList.filter(d => d.status === 'OPEN').length}
 </span>
 )}
 </button>
 </div>

 {/*  GROUP 4: ហិរញ្ញវត្ថុ និងការកំណត់  */}
 <div className="admin-nav-section">
 <div className="admin-nav-section-title">{isKhmer ? 'ហិរញ្ញវត្ថុ និងការកំណត់' : 'FINANCE & SETTINGS'}</div>

            <button
              className={`admin-nav-item ${tab === 'withdrawals' ? 'active' : ''}`}
              onClick={() => { setTab('withdrawals'); setMobileMenuOpen(false); }}
            >
              <FiDollarSign className="admin-nav-icon" style={{ color: '#10B981' }} />
              <span className="admin-nav-label">{isKhmer ? 'ដកចំណូល' : 'Earnings & Payouts'}</span>
            </button>

            <button
              className={`admin-nav-item ${tab === 'settings' ? 'active' : ''}`}
              onClick={() => { setTab('settings'); setMobileMenuOpen(false); }}
            >
              <FiSettings className="admin-nav-icon" />
              <span className="admin-nav-label">{isKhmer ? 'ការកំណត់' : 'Settings'}</span>
            </button>
          </div>

          {/*  BOTTOM: Switch + View Profile  */}
          <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={() => setIsSwitchModalOpen(true)}
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 12,
                background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                color: '#fff', border: 'none', cursor: 'pointer',
                fontWeight: 800, fontSize: '0.85rem',
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 4px 12px rgba(99,102,241,0.35)'
              }}
            >
              <FiUser size={15} />
              <span>{isKhmer ? 'ប្ដូរទៅទម្រង់អ្នកទិញ' : 'Switch to User Mode'}</span>
            </button>

            <Link
              to={`/seller/profile/${user?.id}`}
              className="admin-nav-item"
              style={{ textDecoration: 'none' }}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FiExternalLink className="admin-nav-icon" />
              <span className="admin-nav-label">{isKhmer ? 'មើលប្រវត្តិរូបហាង' : 'View My Profile'}</span>
            </Link>
          </div>
        </nav>

        {/* User Card in Sidebar Bottom */}
        <div className="admin-sidebar-bottom">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: profile?.storeLogoUrl ? `url(${profile.storeLogoUrl}) center/cover` : 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
              border: '1px solid #BFDBFE',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#2563EB', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0,
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.12)', overflow: 'hidden'
            }}>
              {profile?.storeLogoUrl ? (
                <img src={profile.storeLogoUrl} alt="Store Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
              ) : (
                <MdStorefront size={20} color="#2563EB" />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 4 }}>
                {profile?.storeName || user?.name || 'Seller'}
                <MdVerified size={14} color="#1d9bf0" />
              </div>
              <div style={{ fontSize: '0.7rem', color: '#1d9bf0', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                {isKhmer ? 'អ្នកលក់បានផ្ទៀងផ្ទាត់' : 'Verified Seller'} <MdVerified size={11} color="#1d9bf0" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/*  2. Main Area (Matching Admin Header & Body)  */}
      <div className="admin-main">
        {/* Header Bar */}
        <header className="admin-header">
          <div className="admin-header-left" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-menu-btn"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: 10, border: '1px solid #CBD5E1',
                background: '#FFFFFF', color: '#0F172A', cursor: 'pointer'
              }}
              title="Toggle Menu"
            >
              <FiMenu size={18} />
            </button>
            <h1 className="admin-header-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', margin: 0 }}>
              <MdStorefront color="#10B981" size={22} /> Seller Portal — {tab.toUpperCase()}
            </h1>
          </div>

          <div className="admin-header-right" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={() => setLang(lang === 'km' ? 'en' : 'km')}
              style={{
                width: 36, height: 36, borderRadius: 10,
                border: '1px solid #CBD5E1', background: '#FFFFFF',
                color: '#4F46E5', display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.15s'
              }}
              title={isKhmer ? 'ប្ដូរទៅភាសាអង់គ្លេស' : 'Switch to Khmer'}
            >
              <FiGlobe size={18} />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="admin-content">
          {/* Hero Banner (Only shown on Overview and Settings / Store tabs) */}
          {(tab === 'overview' || tab === 'settings' || tab === 'store') && (
            <div className="seller-hero-card">
              <div className="seller-hero-inner">
                <div className="seller-hero-left">
                  <div className="seller-hero-logo">
                    {profile?.storeLogoUrl ? (
                      <img src={profile.storeLogoUrl} alt="Store Logo" />
                    ) : (
                      <MdStorefront size={22} color="#2563EB" />
                    )}
                  </div>
                  <div className="seller-hero-info">
                    <div className="seller-hero-heading">
                      <h2 className="seller-hero-name">
                        {profile?.storeName || 'My Digital Store'}
                        <MdVerified size={16} color="#1d9bf0" />
                      </h2>
                      <span className="seller-verified-badge">
                        {isKhmer ? 'អ្នកលក់បានផ្ទៀងផ្ទាត់' : 'Verified Seller'} <MdVerified size={11} color="#1d9bf0" />
                      </span>
                      <StatusBadge status={profile?.subscriptionStatus || 'ACTIVE'} />
                    </div>
                    <p className="seller-hero-desc">
                      {profile?.storeDescription || 'Seller Central Portal — Manage your products, sales orders, and balance payouts.'}
                    </p>
                  </div>
                </div>

                <div className="seller-hero-actions">
                  <button
                    onClick={() => setTab('chats')}
                    className="admin-btn seller-hero-btn chats"
                  >
                    <FiMessageSquare size={13} /> {isKhmer ? 'សារអតិថិជន' : 'Customer Chats'}
                  </button>
                  <Link
                    to={`/store/${user?.id}`}
                    className="admin-btn seller-hero-btn store"
                  >
                    <FiExternalLink size={13} /> {isKhmer ? 'មើលហាង' : 'View Store'}
                  </Link>
                  <button
                    onClick={() => setShowContactAdminModal(true)}
                    className="admin-btn seller-hero-btn admin"
                  >
                    <FiLifeBuoy size={13} /> {isKhmer ? 'ទាក់ទង Admin' : 'Contact Admin'}
                  </button>
                  <button
                    onClick={() => setShowTelegramBotModal(true)}
                    className="admin-btn seller-hero-btn"
                    style={{
                      background: Boolean(profile?.telegramConnected || profile?.telegramChatId) ? 'rgba(16,185,129,0.12)' : 'rgba(0,136,204,0.12)',
                      color: Boolean(profile?.telegramConnected || profile?.telegramChatId) ? '#10B981' : '#0088cc',
                      borderColor: Boolean(profile?.telegramConnected || profile?.telegramChatId) ? 'rgba(16,185,129,0.3)' : 'rgba(0,136,204,0.3)'
                    }}
                  >
                    <FaTelegram size={13} /> {Boolean(profile?.telegramConnected || profile?.telegramChatId) ? (isKhmer ? 'Telegram [បានតភ្ជាប់]' : 'Telegram [Connected]') : (isKhmer ? 'តភ្ជាប់ Telegram' : 'Connect Telegram')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Duplicate Store Name 7-Day Warning Banner */}
        {Boolean(profile?.duplicateWarning) && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(220, 38, 38, 0.06) 100%)',
            border: '2px solid #EF4444',
            borderRadius: 18,
            padding: '20px 24px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.12)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1, minWidth: 280 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: '#EF4444', color: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)'
              }}>
                <FiAlertTriangle size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                  <h4 style={{ margin: 0, color: '#DC2626', fontWeight: 900, fontSize: '1.05rem' }}>
                    {isKhmer ? 'ការព្រមាន៖ ឈ្មោះហាងរបស់អ្នកជាន់គ្នាជាមួយហាងដែលមានមុន!' : 'Duplicate Store Name Warning: 7-Day Grace Period'}
                  </h4>
                  <span style={{
                    background: '#EF4444', color: '#fff',
                    fontSize: '0.75rem', fontWeight: 900,
                    padding: '3px 10px', borderRadius: 20,
                    display: 'inline-flex', alignItems: 'center', gap: 4
                  }}>
                    <FiClock size={12} /> {isKhmer ? `នៅសល់ ${profile?.duplicateDaysRemaining ?? 7} ថ្ងៃ` : `${profile?.duplicateDaysRemaining ?? 7} Days Remaining`}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.86rem', color: '#7F1D1D', lineHeight: 1.5 }}>
                  {isKhmer
                    ? `ឈ្មោះហាង "${profile?.storeName}" ត្រូវបានចុះឈ្មោះដោយអ្នកលក់ម្នាក់ទៀតរួចហើយ។ សូមប្ដូរឈ្មោះហាងថ្មីរបស់អ្នកក្នុងរយៈពេល 7 ថ្ងៃ (កំណត់ត្រឹម ${profile?.nameChangeDeadline ? new Date(profile.nameChangeDeadline).toLocaleDateString() : '7 ថ្ងៃ'})។ ប្រសិនបើមិនប្ដូរទេ ប្រព័ន្ធនឹងលុបហាងដោយស្វ័យប្រវត្តិ។ (ប្រព័ន្ធបានដោះសោអនុញ្ញាតឱ្យប្តូរឈ្មោះហាងបានភ្លាមៗ)`
                    : `Your store name "${profile?.storeName}" duplicates an existing store registered earlier. Please change your store name within 7 days. If unchanged, the store will be automatically deleted upon deadline expiration.`}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setProfileForm({
                  storeName: profile?.storeName || '',
                  storeDescription: profile?.storeDescription || '',
                  storeLogoUrl: profile?.storeLogoUrl || ''
                });
                setEditingProfile(true);
                const el = document.getElementById('seller-edit-profile-btn');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="admin-btn"
              style={{
                background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
                color: '#ffffff',
                fontWeight: 900,
                padding: '10px 20px',
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.88rem'
              }}
            >
              <FiEdit2 size={15} />
              {isKhmer ? 'ប្ដូរឈ្មោះហាងឥឡូវនេះ' : 'Change Store Name Now'}
            </button>
          </div>
        )}

        {/* 7-Day Expiry Warning & KHQR Renewal Payment Generator Banner */}
 {(profile?.subscriptionStatus === 'EXPIRED' || (profile?.remainingDays !== undefined && profile.remainingDays <= 7) || (profile?.subscriptionExpiresAt && new Date(profile.subscriptionExpiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))) && (
 <div style={{
 background: profile?.subscriptionStatus === 'EXPIRED' ? 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)' : 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
 border: profile?.subscriptionStatus === 'EXPIRED' ? '1px solid #FCA5A5' : '1px solid #FDE68A',
 borderRadius: 16,
 padding: '16px 20px',
 marginBottom: 24,
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 flexWrap: 'wrap',
 gap: 16,
 boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)'
 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 280 }}>
 <div style={{
 width: 44, height: 44, borderRadius: 12,
 background: profile?.subscriptionStatus === 'EXPIRED' ? '#EF4444' : '#F59E0B',
 color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
 flexShrink: 0, boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
 }}>
 <FiAlertTriangle size={22} />
 </div>
 <div>
 <div style={{ fontSize: '0.95rem', fontWeight: 800, color: profile?.subscriptionStatus === 'EXPIRED' ? '#991B1B' : '#92400E', marginBottom: 2 }}>
 {profile?.subscriptionStatus === 'EXPIRED'
                    ? (isKhmer ? 'ហាងរបស់អ្នកបានផុតកំណត់!' : 'Store Subscription Expired!')
                    : (isKhmer ? `ហាងរបស់អ្នកជិតផុតកំណត់ក្នុងរយៈពេល ${profile?.remainingDays ?? 7} ថ្ងៃ!` : `Store subscription expires in ${profile?.remainingDays ?? 7} days!`)}
 </div>
 <div style={{ fontSize: '0.82rem', color: profile?.subscriptionStatus === 'EXPIRED' ? '#B91C1C' : '#B45309' }}>
 {profile?.subscriptionExpiresAt
                    ? (isKhmer ? `ថ្ងៃផុតកំណត់: ${new Date(profile.subscriptionExpiresAt).toLocaleDateString()} — បង្កើតកូដដើម្បីបន្តកញ្ចប់ហាង ៣០ ថ្ងៃ` : `Expires at: ${new Date(profile.subscriptionExpiresAt).toLocaleDateString()} — Generate KHQR to renew for 30 days`)
                    : (isKhmer ? 'សូមទូទាត់បន្តកញ្ចប់ហាងដើម្បីរក្សាដំណើរការលក់ទំនិញរបស់អ្នក។' : 'Please renew your store subscription to continue selling.')}
 </div>
 </div>
 </div>

 <button
 onClick={() => {
 const pId = profile?.subscriptionPlan || 'PLAN_1';
 const isDiscount = profile?.remainingDays !== undefined ? (profile.remainingDays > 0 && profile.remainingDays <= 7) : false;
 // Apply 70% off discount if renewing within 7 days
 let price = 0.00;
 if (pId === 'PLAN_3') price = isDiscount ? 1.80 : 6.00;
 else if (pId === 'PLAN_2') price = isDiscount ? 1.35 : 4.50;
 else price = 0.00; // PLAN_1 is FREE

 setPendingPlanId(pId);
 setPendingPlanPrice(price);
 setShowRenewalModal(true);
 }}
 style={{
 background: profile?.subscriptionStatus === 'EXPIRED' ? 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)' : 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
 color: '#FFFFFF',
 border: 'none',
 borderRadius: 12,
 padding: '10px 18px',
 fontSize: '0.88rem',
 fontWeight: 800,
 cursor: 'pointer',
 display: 'inline-flex',
 alignItems: 'center',
 gap: 8,
 boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)',
 whiteSpace: 'nowrap'
 }}
 >
 <FiRefreshCw size={16} /> {isKhmer ? 'បន្តកញ្ចប់សេវាកម្មហាង' : 'Renew Store Subscription'}
 </button>
 </div>
 )}

 {/*  OVERVIEW TAB  */}
 {tab === 'overview' && (
 <div>
 {/* Comprehensive Stats grid (Balance, Orders, Rate, Disputes, Products, Coupons, Chats, Subscription) */}
 {(() => {
 const revCount = reviewsList.length;
 const avgScore = revCount > 0
 ? (reviewsList.reduce((acc, r) => acc + (r.rating || 5), 0) / revCount).toFixed(1)
 : '5.0';
 const openDisputes = disputesList.filter(d => d.status === 'OPEN').length;
 const completedOrders = orders.filter(o => o.status === 'COMPLETED' || o.status === 'DELIVERED').length;
 const processingOrders = orders.filter(o => o.status === 'PROCESSING').length;
        const completedWithdrawals = withdrawals.filter(w => w.status === 'COMPLETED' || w.status === 'APPROVED');
        const totalWithdrawn = completedWithdrawals.reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0);

 const overviewCards = [
 {
 label: isKhmer ? 'សមតុល្យប្រាក់' : 'Available Balance',
 value: `${balance.toFixed(2)}`,
 subtitle: isKhmer ? 'ចំណូលក្នុងគណនី' : 'Ready to withdraw',
 icon: <FiDollarSign size={20} />,
 color: '#10B981',
 action: () => setShowWithdrawModal(true),
 actionLabel: isKhmer ? 'ដកប្រាក់' : 'Withdraw'
 },
 {
 label: isKhmer ? 'ការបញ្ជាទិញ' : 'Sales Orders',
 value: orders.length,
 subtitle: isKhmer ? `${completedOrders} បានប្រគល់, ${processingOrders} កំពុងដំណើរការ` : `${completedOrders} Completed, ${processingOrders} Processing`,
 icon: <FiShoppingBag size={20} />,
 color: '#3B82F6',
 action: () => setTab('orders'),
 actionLabel: isKhmer ? 'មើលការបញ្ជាទិញ' : 'View Orders'
 },
 {
 label: isKhmer ? 'ការវាយតម្លៃ' : 'Customer Reviews',
 value: `${avgScore} `,
 subtitle: isKhmer ? `ផ្អែកលើអតិថិជន ${revCount} នាក់ (ពេញចិត្ត ១០០%)` : `Based on ${revCount} reviews`,
 icon: <FiStar size={20} />,
 color: '#F59E0B',
 action: () => setTab('reviews'),
 actionLabel: isKhmer ? 'មើលការវាយតម្លៃ' : 'View Reviews'
 },
 {
 label: isKhmer ? 'ទំនាស់ និងពាក្យបណ្ដឹង' : 'Disputes & Claims',
 value: disputesList.length,
 subtitle: openDisputes > 0 ? (isKhmer ? `${openDisputes} ករណីកំពុងរង់ចាំ` : `${openDisputes} Open claim(s)`) : (isKhmer ? 'គ្មានទំនាស់' : '0 Open Claims'),
 icon: <FiAlertTriangle size={20} />,
 color: openDisputes > 0 ? '#EF4444' : '#64748B',
 action: () => setTab('disputes'),
 actionLabel: isKhmer ? 'មើលទំនាស់' : 'View Disputes'
 },
 {
 label: isKhmer ? 'មុខទំនិញ' : 'My Products',
 value: profile?.productCount ?? products.length,
 subtitle: isKhmer ? `${products.filter(p => p.inStock !== false).length} កំពុងដាក់លក់` : `${products.filter(p => p.inStock !== false).length} In Stock`,
 icon: <FiPackage size={20} />,
 color: '#6366F1',
 action: () => setTab('products'),
 actionLabel: isKhmer ? 'គ្រប់គ្រងទំនិញ' : 'Manage'
 },
 {
 label: isKhmer ? 'ប្រូម៉ូសិន និងគូប៉ុង' : 'Coupons & Promo',
 value: couponsList.length,
 subtitle: isKhmer ? `${couponsList.filter(c => c.isActive !== false).length} កំពុងដំណើរការ` : `${couponsList.filter(c => c.isActive !== false).length} Active`,
 icon: <FiPercent size={20} />,
 color: '#8B5CF6',
 action: () => setTab('coupons'),
 actionLabel: isKhmer ? 'គ្រប់គ្រងគូប៉ុង' : 'Manage Coupons'
 },
 {
 label: isKhmer ? 'សារអតិថិជន' : 'Customer Chats',
 value: orders.length > 0 ? orders.length : 0,
 subtitle: isKhmer ? 'សារផ្ទាល់ពីអតិថិជន' : 'Direct buyer chats',
 icon: <FiMessageSquare size={20} />,
 color: '#06B6D4',
 action: () => setTab('chats'),
 actionLabel: isKhmer ? 'បើកប្រអប់សារ' : 'Open Inbox'
 },
           {
            label: isKhmer ? 'កញ្ចប់សេវាកម្មហាង' : 'Store Plan',
            value: profile?.subscriptionPlan === 'PLAN_3' ? (isKhmer ? 'កញ្ចប់ VIP ($៦)' : 'VIP Plan ($6)') : profile?.subscriptionPlan === 'PLAN_2' ? (isKhmer ? 'កញ្ចប់ Pro ($៤.៥០)' : 'Pro Plan ($4.50)') : (isKhmer ? 'កញ្ចប់មូលដ្ឋាន (ឥតគិតថ្លៃ)' : 'Basic Plan (Free)'),
            subtitle: isKhmer ? `ស្ថានភាព: ${profile?.subscriptionStatus === 'ACTIVE' ? 'សកម្ម' : profile?.subscriptionStatus === 'EXPIRED' ? 'ផុតកំណត់' : 'សកម្ម'}` : `Status: ${profile?.subscriptionStatus || 'ACTIVE'}`,
            icon: <MdStorefront size={20} />,
            color: '#D97706',
            action: () => setShowSubscriptionModal(true),
            actionLabel: isKhmer ? 'ដំឡើងកញ្ចប់' : 'Upgrade Plan'
          },
          {
            label: isKhmer ? 'ប្រវត្តិដកប្រាក់' : 'Withdrawals History',
            value: `${totalWithdrawn.toFixed(2)}`,
            subtitle: isKhmer ? `${withdrawals.length} ប្រតិបត្តិការដកប្រាក់` : `${withdrawals.length} Payout requests`,
            icon: <FiDollarSign size={20} />,
            color: '#EC4899',
            action: () => setTab('withdrawals'),
            actionLabel: isKhmer ? 'មើលប្រវត្តិ' : 'View History'
          }
        ];

        return (
          <div className="seller-overview-grid">
            {overviewCards.map((stat, i) => (
              <div
                key={i}
                className="seller-overview-card"
                style={{
                  background: 'var(--admin-card-bg)',
                  borderRadius: 16,
                  border: '1px solid var(--admin-card-border)',
                  padding: '18px 20px',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
 boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
 transition: 'all 0.2s ease'
 }}
 >
 <div>
 <div className="seller-card-top-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
 <div className="seller-card-icon-box" style={{
 width: 40, height: 40, borderRadius: 12,
 background: `${stat.color}18`,
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 color: stat.color,
 flexShrink: 0
 }}>
 {stat.icon}
 </div>
 <span className="seller-card-badge" style={{
 fontSize: '0.7rem',
 fontWeight: 800,
 color: stat.color,
 background: `${stat.color}12`,
 padding: '2px 8px',
 borderRadius: 8,
 whiteSpace: 'nowrap'
 }}>
 {stat.label.split(' ')[0]}
 </span>
 </div>
 <div className="seller-card-label" style={{ fontSize: '0.74rem', color: 'var(--admin-text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>
 {stat.label}
 </div>
 <div className="seller-card-value" style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--admin-text)', lineHeight: 1.2, marginBottom: 4 }}>
 {stat.value}
 </div>
 {stat.subtitle && (
 <div className="seller-card-subtitle" style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)', marginBottom: 10, fontWeight: 500 }}>
 {stat.subtitle}
 </div>
 )}
 </div>
 {stat.action && (
 <button
 onClick={stat.action}
 className="seller-card-action"
 style={{
 fontSize: '0.78rem',
 color: stat.color,
 fontWeight: 800,
 background: 'none',
 border: 'none',
 cursor: 'pointer',
 padding: 0,
 display: 'inline-flex',
 alignItems: 'center',
 gap: 4,
 marginTop: 4
 }}
 >
 {stat.actionLabel} →
 </button>
 )}
 </div>
 ))}
 </div>
 );
 })()}

 {/* AI Auto-Reply Status Banner */}
 {(() => {
 const isAiPlan = profile?.subscriptionPlan === 'PLAN_2' || profile?.subscriptionPlan === 'PLAN_3';
 const isActive = profile?.subscriptionStatus === 'ACTIVE';
 const aiEnabled = isAiPlan && isActive;
 return (
 <div style={{
 background: aiEnabled
 ? 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.08) 100%)'
 : 'var(--admin-card-bg)',
 border: aiEnabled ? '1px solid rgba(99,102,241,0.3)' : '1px solid var(--admin-card-border)',
 borderRadius: 16,
 padding: '16px 20px',
 marginBottom: 20,
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 flexWrap: 'wrap',
 gap: 12
 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
 <div style={{
 width: 44, height: 44, borderRadius: 12,
 background: aiEnabled ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : '#94A3B8',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 color: '#fff', fontSize: '1.3rem', flexShrink: 0,
 boxShadow: aiEnabled ? '0 4px 14px rgba(99,102,241,0.4)' : 'none'
 }}>
 AI
 </div>
 <div>
 <div style={{ fontWeight: 800, fontSize: '0.95rem', color: aiEnabled ? '#4F46E5' : 'var(--admin-text)', marginBottom: 2 }}>
 {isKhmer ? (aiEnabled ? 'AI ឆ្លើយតបសារ — កំពុងដំណើរការ' : 'AI ឆ្លើយតបសារ — មិនទាន់ដំណើរការ') : (aiEnabled ? 'AI Auto-Reply — Active' : 'AI Auto-Reply — Inactive')}
 </div>
 <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
 {aiEnabled
 ? `ហាងរបស់អ្នកមាន AI ឆ្លើយតបសារអតិថិជនស្វ័យប្រវត្តិ 24/7 (${profile?.subscriptionPlan === 'PLAN_3' ? 'VIP Plan' : 'Pro Plan'})`
 : profile?.subscriptionStatus === 'EXPIRED' && isAiPlan
 ? 'AI Auto-Reply ត្រូវបានបិទ — សូមបន្តកញ្ចប់ហាងដើម្បីបើក AI ឡើងវិញ'
 : 'ដំឡើងទៅ Pro Plan ឬ VIP Plan ដើម្បីបើក AI ឆ្លើយតបសារអតិថិជន 24/7 ស្វ័យប្រវត្តិ'}
 </div>
 </div>
 </div>
 {aiEnabled ? (
 <div style={{
 display: 'inline-flex', alignItems: 'center', gap: 6,
 background: 'rgba(16,185,129,0.12)', color: '#059669',
 border: '1px solid rgba(16,185,129,0.3)',
 borderRadius: 20, padding: '4px 14px',
 fontSize: '0.78rem', fontWeight: 800
 }}>
 <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
 {isKhmer ? 'AI សកម្ម' : 'AI LIVE'}
 </div>
 ) : (
 <button
 onClick={() => setShowSubscriptionModal(true)}
 style={{
 background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
 color: '#fff', border: 'none', borderRadius: 10,
 padding: '8px 16px', fontSize: '0.8rem', fontWeight: 800,
 cursor: 'pointer', whiteSpace: 'nowrap',
 boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
 }}
 >
 {isKhmer ? (profile?.subscriptionStatus === 'EXPIRED' && isAiPlan ? 'បន្តកញ្ចប់ដើម្បីបើក AI' : 'ដំឡើងកញ្ចប់ដើម្បីបើក AI') : (profile?.subscriptionStatus === 'EXPIRED' && isAiPlan ? 'Renew to Restore AI' : 'Upgrade to Unlock AI')}
 </button>
 )}
 </div>
 );
 })()}

 {/* Profile edit */}
 <div style={{ background: 'var(--admin-card-bg)', borderRadius: 16, border: '1px solid var(--admin-card-border)', padding: 24, marginBottom: 20 }}>
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
 <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--admin-text)' }}>{isKhmer ? 'ព័ត៌មានហាង' : 'Store Profile'}</h3>
 <button className="admin-btn admin-btn-secondary" onClick={() => {
 setProfileForm({ storeName: profile?.storeName || '', storeDescription: profile?.storeDescription || '', storeLogoUrl: profile?.storeLogoUrl || '' });
 setEditingProfile(true);
 }} id="seller-edit-profile-btn" style={{ fontSize: '0.85rem', gap: 6, display: 'flex', alignItems: 'center' }}>
 <FiEdit2 size={14} /> {isKhmer ? 'កែប្រែ' : 'Edit'}
 </button>
 </div>
 {editingProfile ? (
 <div>
 <div style={{ marginBottom: 12 }}>
 <label style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, textTransform: 'uppercase' }}>
 <span>{isKhmer ? 'ឈ្មោះហាង' : 'STORE NAME'}</span>
 {hasDuplicateWarning ? <span style={{ color: '#EF4444', fontWeight: 800 }}>{isKhmer ? 'ដោះសោរសម្រាប់ការប្តូរឈ្មោះជាន់គ្នា (នៅសល់ ' + (profile?.duplicateDaysRemaining ?? 7) + ' ថ្ងៃ)' : 'Unlocked to resolve duplicate name (' + (profile?.duplicateDaysRemaining ?? 7) + 'd left)'}</span> : (isStoreNameLocked && <span style={{ color: '#EF4444', fontWeight: 800 }}>{isKhmer ? 'ចាក់សោ (កែបានតែ ១ ដង/ខែ)' : 'Locked (1 edit / month)'}</span>)}
 </label>
 <input
 className="admin-input"
 placeholder="Store Name"
 value={profileForm.storeName}
 disabled={isStoreNameLocked}
 onChange={e => setProfileForm(f => ({ ...f, storeName: e.target.value }))}
 style={{ background: isStoreNameLocked ? 'rgba(239, 68, 68, 0.04)' : undefined, opacity: isStoreNameLocked ? 0.8 : 1 }}
 id="seller-profile-name"
 />
 {isStoreNameLocked ? (
 <div style={{ fontSize: '0.78rem', color: '#EF4444', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239, 68, 68, 0.08)', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
 <FiAlertTriangle size={15} style={{ flexShrink: 0 }} />
 <span>
 អ្នកអាចផ្លាស់ប្តូរឈ្មោះហាងបានតែ <strong>1 ដងគត់ក្នុងរយៈពេល 1 ខែ (30 ថ្ងៃ)</strong>! ឈ្មោះហាងត្រូវបានកែប្រែចុងក្រោយនៅថ្ងៃទី {lastChangeDate?.toLocaleDateString()}។ អ្នកអាចកែប្រែឈ្មោះបានម្តងទៀតនៅថ្ងៃទី <strong>{nextAllowedDate}</strong> (រង់ចាំ {daysRemaining} ថ្ងៃទៀត)។
 </span>
 </div>
 ) : (
 <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-secondary)', marginTop: 4 }}>
 អ្នកអាចផ្លាស់ប្តូរឈ្មោះហាងបានតែ 1 ដងគត់ក្នុងរយៈពេល 1 ខែ (30 ថ្ងៃ)។
 </div>
 )}
 </div>

 <div style={{ marginBottom: 12 }}>
 <label style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)', fontWeight: 700, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
 {isKhmer ? 'ពិពណ៌នាអំពីហាង' : 'STORE DESCRIPTION / NOTE'}
 </label>
 <textarea className="admin-input" placeholder="Store Description / Note" value={profileForm.storeDescription} onChange={e => setProfileForm(f => ({ ...f, storeDescription: e.target.value }))} rows={3} style={{ resize: 'vertical' }} id="seller-profile-desc" />
 </div>

 {/* Store Logo Image File Upload & URL */}
 <div style={{ marginBottom: 16 }}>
 <label style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)', fontWeight: 700, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
 {isKhmer ? 'រូបភាពឡូហ្គោហាង' : 'STORE LOGO / PICTURE'}
 </label>
 <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
 <input className="admin-input" placeholder="Logo Image URL or upload file →" value={profileForm.storeLogoUrl} onChange={e => setProfileForm(f => ({ ...f, storeLogoUrl: e.target.value }))} id="seller-profile-logo" style={{ flex: 1 }} />
 <label className="admin-btn admin-btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.82rem', padding: '10px 14px' }}>
 <FiUpload size={14} /> {uploadingLogo ? (isKhmer ? 'កំពុងបញ្ចូល...' : 'Uploading...') : (isKhmer ? 'ជ្រើសរើសរូបភាព' : 'Upload Picture')}
 <input type="file" accept="image/*" onChange={handleLogoFileUpload} hidden disabled={uploadingLogo} />
 </label>
 </div>
 </div>

 <div style={{ display: 'flex', gap: 10 }}>
 <button className="admin-btn admin-btn-primary" onClick={handleSaveProfile} id="seller-save-profile"><FiCheck size={14} /> {isKhmer ? 'រក្សាទុកព័ត៌មាន' : 'Save Profile'}</button>
 <button className="admin-btn admin-btn-secondary" onClick={() => setEditingProfile(false)} id="seller-cancel-profile"><FiX size={14} /> {isKhmer ? 'បោះបង់' : 'Cancel'}</button>
 </div>
 </div>
 ) : (
 <div>
 <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--admin-text)', marginBottom: 6 }}>{profile?.storeName}</div>
 <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>{profile?.storeDescription || 'No description yet.'}</p>
 </div>
 )}
 </div>
 </div>
 )}

 {/*  PRODUCTS TAB  */}
 {tab === 'products' && (
 <div>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
 <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--admin-text)' }}>My Products ({products.length})</h3>
 <button className="admin-btn admin-btn-primary" onClick={() => {
 setEditingProduct(null);
 setProductForm({ name: '', description: '', basePrice: '', imageUrl: '', categoryId: categories[0]?.id || '', productType: 'ACCOUNT', duration: '1 Month', productLabel: '' });
 setShowAddProduct(true);
 }} id="seller-add-product-btn" style={{ gap: 6, display: 'flex', alignItems: 'center' }}>
 <FiPlus size={16} /> Add Product
 </button>
 </div>

 {/* Add/Edit Product Modal/Card Overlay (ឡូតមកមុខ + ពីក្រោយព្រឹលៗ) */}
 {showAddProduct && (
 <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddProduct(false)}>
 <div className="admin-modal" style={{ maxWidth: 640, width: '94%', maxHeight: '90vh', overflowY: 'auto', borderRadius: 24, padding: '28px 24px', position: 'relative' }}>
 <button className="admin-modal-close" onClick={() => setShowAddProduct(false)} id="seller-product-modal-close" style={{ top: 20, right: 20, cursor: 'pointer' }}>
 <FiX size={16} />
 </button>

 <h3 style={{ margin: '0 0 20px', fontWeight: 800, fontSize: '1.25rem', color: 'var(--admin-text)' }}>
 {editingProduct ? 'Edit Product' : 'Add Product'}
 </h3>

 <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
 {/* 1. Product Name (Full Width) */}
 <div>
 <label style={{ fontSize: '0.78rem', color: 'var(--admin-text)', fontWeight: 800, display: 'block', marginBottom: 6 }}>
 Product Name *
 </label>
 <input
 className="admin-input"
 placeholder="e.g. Netflix 1 Month"
 value={productForm.name}
 onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))}
 id="seller-product-name"
 style={{ width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: '0.88rem' }}
 />
 </div>

 {/* 2. Category & Digital Product Type (2 Column Row - Dependent Fields) */}
 {(() => {
 const selectedCatObj = categories.find(c => String(c.id) === String(productForm.categoryId));
 const catName = selectedCatObj?.name || '';
 const availableTypes = getCategoryTypes(catName);

 return (
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
 <div>
 <label style={{ fontSize: '0.78rem', color: 'var(--admin-text)', fontWeight: 800, display: 'block', marginBottom: 6 }}>
 Category (ប្រភេទទំនិញ) *
 </label>
 <select
 className="admin-input"
 value={productForm.categoryId}
 onChange={e => {
 const catId = e.target.value;
 const selCat = categories.find(c => String(c.id) === String(catId));
 const newCatName = selCat?.name || '';
 const autoType = getDefaultTypeForCategory(newCatName);
 setProductForm(f => ({ ...f, categoryId: catId, productType: autoType }));
 }}
 id="seller-product-category"
 style={{ width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: '0.85rem' }}
 >
 <option value="">Select Category First</option>
 {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
 </select>
 </div>

 <div>
 <label style={{ fontSize: '0.78rem', color: 'var(--admin-text)', fontWeight: 800, display: 'block', marginBottom: 6 }}>
 Digital Product Type (ប្រភេទឌីជីថល) *
 </label>
 <select
 className="admin-input"
 value={productForm.productType}
 onChange={e => setProductForm(f => ({ ...f, productType: e.target.value }))}
 id="seller-product-type"
 style={{ width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: '0.85rem' }}
 >
 {availableTypes.map(t => (
 <option key={t.value} value={t.value}>{t.label}</option>
 ))}
 </select>
 </div>
 </div>
 );
 })()}

 {/* 3. Pricing (Selling Price & Original Price) & Product Duration */}
 {(() => {
 const selectedCatObj = categories.find(c => String(c.id) === String(productForm.categoryId));
 const isGameCategory = (selectedCatObj?.name && (
 selectedCatObj.name.toLowerCase().includes('game') ||
 selectedCatObj.name.toLowerCase().includes('gaming') ||
 selectedCatObj.name.includes('ហ្គេម')
 )) || productForm.productType === 'ACCOUNT_GAME';

 const isDiscounted = productForm.originalPrice && productForm.basePrice && Number(productForm.originalPrice) > Number(productForm.basePrice);

 return (
 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
 <div style={{ display: 'grid', gridTemplateColumns: isGameCategory ? '1fr 1fr' : '1fr 1fr 1fr', gap: 14 }}>
 <div>
 <label style={{ fontSize: '0.78rem', color: isDiscounted ? '#DB2777' : 'var(--admin-text)', fontWeight: 800, display: 'block', marginBottom: 6 }}>
 {isDiscounted ? (isKhmer ? 'តម្លៃលក់បញ្ចុះ ($) *' : 'Sale Price ($) *') : (isKhmer ? 'តម្លៃទំនិញ ($) *' : 'Price / តម្លៃ ($) *')}
 </label>
 <input
 className="admin-input"
 type="number"
 step="0.01"
 placeholder="e.g. 3.99"
 value={productForm.basePrice}
 onChange={e => setProductForm(f => ({ ...f, basePrice: e.target.value }))}
 id="seller-product-price"
 style={{ width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: '0.88rem', fontWeight: 800, borderColor: isDiscounted ? '#EC4899' : undefined }}
 />
 </div>

 <div>
 <label style={{ fontSize: '0.78rem', color: 'var(--admin-text-secondary)', fontWeight: 800, display: 'block', marginBottom: 6 }}>
 {isKhmer ? 'តម្លៃដើម ($) (បើមានបញ្ចុះ)' : 'Original Price ($) (Optional)'}
 </label>
 <input
 className="admin-input"
 type="number"
 step="0.01"
 placeholder="e.g. 5.00"
 value={productForm.originalPrice}
 onChange={e => setProductForm(f => ({ ...f, originalPrice: e.target.value }))}
 style={{ width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: '0.88rem' }}
 />
 </div>

 {!isGameCategory && (
 <div>
 <label style={{ fontSize: '0.78rem', color: 'var(--admin-text)', fontWeight: 800, display: 'block', marginBottom: 6 }}>
 {isKhmer ? 'រយៈពេលកំណត់ *' : 'Product Duration *'}
 </label>
 <select
 className="admin-input"
 value={productForm.duration}
 onChange={e => setProductForm(f => ({ ...f, duration: e.target.value }))}
 id="seller-product-duration"
 style={{ width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: '0.85rem' }}
 >
 {PRODUCT_DURATIONS.map(d => (
 <option key={d.value} value={d.value}>{d.label}</option>
 ))}
 </select>
 </div>
 )}
 </div>

 {/* Live discount info pill */}
 {isDiscounted && (
 <div style={{
 padding: '8px 12px', borderRadius: 8,
 background: 'rgba(239, 68, 68, 0.08)',
 border: '1px solid rgba(239, 68, 68, 0.25)',
 display: 'flex', alignItems: 'center', justifyContent: 'space-between',
 fontSize: '0.78rem'
 }}>
 <span style={{ color: '#DC2626', fontWeight: 700 }}>
 {isKhmer ? 'តម្លៃលក់បញ្ចុះ:' : 'Discount Active:'} ${Number(productForm.basePrice).toFixed(2)} (Original: ${Number(productForm.originalPrice).toFixed(2)})
 </span>
 <span style={{ background: '#EF4444', color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 900 }}>
 -{Math.round(((Number(productForm.originalPrice) - Number(productForm.basePrice)) / Number(productForm.originalPrice)) * 100)}% OFF
 </span>
 </div>
 )}
 </div>
 );
 })()}

 {/* 4. Product Badge / Label */}
 <div>
 <label style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 900, display: 'block', marginBottom: 6 }}>
 {isKhmer ? 'ស្លាកសញ្ញាទំនិញ *' : 'Product Badge / Label *'}
 </label>
 <select
 className="admin-input"
 value={productForm.productLabel}
 onChange={e => setProductForm(f => ({ ...f, productLabel: e.target.value }))}
 id="seller-product-label"
 required
 style={{ width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: '0.85rem', borderColor: '#10B981', fontWeight: 700, color: '#0F172A' }}
 >
 <option value="">{isKhmer ? '-- សូមជ្រើសរើសស្លាកសញ្ញា --' : '-- Select Product Badge / Label * --'}</option>
 {PRODUCT_LABELS.map(l => (
 <option key={l.value} value={l.value}>{l.label}</option>
 ))}
 </select>
 </div>

 {/* 5. Product Image & Upload (No raw URL displayed) */}
 <div>
 <label style={{ fontSize: '0.78rem', color: 'var(--admin-text)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
 <FiImage size={14} /> {isKhmer ? 'រូបភាពផលិតផល (Product Image)' : 'Product Image'}
 </label>

 <input
 type="file"
 accept="image/*"
 id="seller-product-file-input"
 onChange={handleProductImageFileUpload}
 style={{ display: 'none' }}
 disabled={uploadingProductImg}
 />

 {productForm.imageUrl ? (
 /* When image exists: Show clean visual preview + Change / Remove buttons */
 <div style={{
 display: 'flex',
 alignItems: 'center',
 gap: 14,
 padding: '12px 14px',
 background: 'rgba(255, 255, 255, 0.04)',
 border: '1px solid rgba(255, 255, 255, 0.1)',
 borderRadius: 12,
 marginBottom: 10
 }}>
 <div style={{
 width: 64,
 height: 64,
 borderRadius: 10,
 overflow: 'hidden',
 background: 'rgba(0, 0, 0, 0.4)',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 flexShrink: 0,
 border: '1px solid rgba(255, 255, 255, 0.15)'
 }}>
 <img
 src={normalizeImageUrl(productForm.imageUrl)}
 alt="Product Preview"
 style={{ width: '100%', height: '100%', objectFit: 'cover' }}
 onError={e => { e.target.style.display = 'none'; }}
 />
 </div>

 <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
 <div style={{ fontSize: '0.82rem', color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
 <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
 {isKhmer ? 'រូបភាពរួចរាល់' : 'Image Ready'}
 </div>
 <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
 <button
 type="button"
 className="admin-btn admin-btn-secondary admin-btn-sm"
 onClick={() => document.getElementById('seller-product-file-input')?.click()}
 disabled={uploadingProductImg}
 style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.76rem', padding: '5px 10px', borderRadius: 8 }}
 >
 <FiUpload size={12} /> {uploadingProductImg ? (isKhmer ? 'កំពុង Upload...' : 'Uploading...') : (isKhmer ? 'ប្ដូររូបភាព' : 'Change Image')}
 </button>
 <button
 type="button"
 className="admin-btn admin-btn-danger admin-btn-sm"
 onClick={() => setProductForm(f => ({ ...f, imageUrl: '' }))}
 disabled={uploadingProductImg}
 style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.76rem', padding: '5px 10px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}
 >
 <FiTrash2 size={12} /> {isKhmer ? 'លុបរូបភាព' : 'Remove'}
 </button>
 </div>
 </div>
 </div>
 ) : (
 /* When no image: Show modern Drag & Drop / Click to Import Box */
 <div
 onClick={() => document.getElementById('seller-product-file-input')?.click()}
 style={{
 border: '2px dashed rgba(99, 102, 241, 0.4)',
 borderRadius: 12,
 padding: '18px 14px',
 textAlign: 'center',
 cursor: 'pointer',
 background: 'rgba(99, 102, 241, 0.04)',
 transition: 'all 0.2s ease',
 display: 'flex',
 flexDirection: 'column',
 alignItems: 'center',
 justifyContent: 'center',
 gap: 6,
 marginBottom: 10
 }}
 onDragOver={e => e.preventDefault()}
 onDrop={e => {
 e.preventDefault();
 if (e.dataTransfer.files?.[0]) {
 handleProductImageFileUpload(e.dataTransfer.files[0]);
 }
 }}
 >
 <div style={{
 width: 38,
 height: 38,
 borderRadius: '50%',
 background: 'rgba(99, 102, 241, 0.15)',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 color: '#818cf8'
 }}>
 <FiUploadCloud size={20} />
 </div>
 <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.84rem' }}>
 {uploadingProductImg ? (isKhmer ? 'កំពុង Upload រូបភាព...' : 'Uploading image...') : (isKhmer ? 'ចុចទីនេះដើម្បី Upload រូបភាពពីកុំព្យូទ័រ' : 'Click to import product image')}
 </div>
 <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>
 {isKhmer ? 'PNG, JPG, WEBP, GIF (រហូតដល់ 10MB)' : 'PNG, JPG, WEBP, GIF (up to 10MB)'}
 </div>
 </div>
 )}

 {/* Quick-pick Preset Images */}
 <div>
 <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', fontWeight: 700, marginBottom: 6 }}>
 {isKhmer ? 'ឬជ្រើសរើស Logo គំរូ (Quick-pick):' : 'Or quick-pick brand logo:'}
 </div>
 <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
 {[
    { name: 'Netflix', url: '/images/products/netflix.svg' },
    { name: 'Spotify', url: '/images/products/spotify.svg' },
    { name: 'ChatGPT', url: '/images/products/chatgpt.svg' },
    { name: 'Claude AI', url: '/images/products/claude.svg' },
    { name: 'Grok AI', url: '/images/products/grok.svg' },
    { name: 'Gemini Pro', url: '/images/products/gemini.svg' },
    { name: 'Antigravity', url: '/images/products/antigravity.svg' },
    { name: 'YouTube', url: '/images/products/youtube.svg' },
    { name: 'Discord', url: '/images/products/discord.svg' },
    { name: 'Canva Pro', url: '/images/products/canva.svg' },
    { name: 'CapCut Pro', url: '/images/products/capcut.svg' },
    { name: 'Alight Motion', url: '/images/products/alightmotion.svg' },
    { name: 'Steam', url: '/images/products/steam.svg' },
    { name: 'NordVPN', url: '/images/products/nordvpn.svg' },
    { name: 'ExpressVPN', url: '/images/products/expressvpn.svg' },
    { name: 'Surfshark', url: '/images/products/surfshark.svg' },
    { name: 'HMA VPN', url: '/images/products/hma.svg' },
    { name: 'Zoom', url: '/images/products/zoom.svg' },
    { name: 'Apple Music', url: '/images/products/apple.svg' },
    { name: 'Adobe CC', url: '/images/products/adobe.svg' },
    { name: 'Disney+', url: '/images/products/disney.svg' },
    { name: 'Prime Video', url: '/images/products/prime.svg' },
    { name: 'Telegram', url: '/images/products/telegram.svg' }
  ].map(img => (
 <button
 key={img.name}
 type="button"
 onClick={() => setProductForm(f => ({ ...f, imageUrl: img.url }))}
 style={{
 background: productForm.imageUrl === img.url ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)',
 border: productForm.imageUrl === img.url ? '1.5px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
 borderRadius: 8, padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700,
 color: productForm.imageUrl === img.url ? '#34D399' : 'var(--admin-text-secondary)', cursor: 'pointer',
 display: 'flex', alignItems: 'center', gap: 4
 }}
 >
 {img.name}
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* 6. Description */}
 <div>
 <label style={{ fontSize: '0.78rem', color: 'var(--admin-text)', fontWeight: 800, display: 'block', marginBottom: 6 }}>Description</label>
 <textarea className="admin-input" placeholder="Product details..." value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ resize: 'vertical', width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: '0.85rem' }} id="seller-product-desc" />
 </div>

 {/* 7. Action Buttons */}
 <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
 <button className="admin-btn admin-btn-primary" onClick={handleSaveProduct} id="seller-save-product" style={{ padding: '10px 20px', borderRadius: 10, fontWeight: 800 }}>
 <FiCheck size={15} /> Save Product
 </button>
 <button className="admin-btn admin-btn-secondary" onClick={() => setShowAddProduct(false)} id="seller-cancel-product" style={{ padding: '10px 20px', borderRadius: 10, fontWeight: 700 }}>
 <FiX size={15} /> Cancel
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Product list */}
 {products.length === 0 ? (
 <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--admin-text-secondary)' }}>
 <FiPackage size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
 <div style={{ fontWeight: 600 }}>No products listed yet</div>
 <div style={{ fontSize: '0.85rem', marginTop: 4 }}>Click Add Product to list your first item.</div>
 </div>
 ) : (
 <div style={{ display: 'grid', gap: 12 }}>
 {products.map(p => (
 <div key={p.id} style={{ background: 'var(--admin-card-bg)', borderRadius: 14, border: '1px solid var(--admin-card-border)', padding: '16px', display: 'flex', alignItems: 'center', gap: 14 }}>
 {p.imageUrl && (
 <img src={p.imageUrl} alt={p.name} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
 )}
 <div style={{ flex: 1, minWidth: 0 }}>
 <div style={{ fontWeight: 700, color: 'var(--admin-text)', marginBottom: 4 }}>{p.name}</div>
 <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
 <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700 }}>${(p.price || 0).toFixed(2)}</span>
 <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>Stock: {p.stockCount ?? 0}</span>
 </div>
 </div>
 <div style={{ display: 'flex', gap: 8 }}>
 <button
 className="admin-btn admin-btn-secondary"
 onClick={() => setManageStockProduct(p)}
 style={{ padding: '7px 12px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 700, fontSize: '0.8rem' }}
 id={`seller-manage-stock-${p.id}`}
 title="Manage digital accounts/stock items"
 >
 <FiDatabase size={14} /> Stock ({p.stockCount ?? 0})
 </button>
 <button className="admin-btn admin-btn-secondary" onClick={() => handleEditProduct(p)} style={{ padding: '7px 10px' }} id={`seller-edit-product-${p.id}`} title="Edit product"><FiEdit2 size={14} /></button>
 <button className="admin-btn admin-btn-secondary" onClick={() => handleDeleteProduct(p)} style={{ padding: '7px 10px', color: '#ef4444' }} id={`seller-delete-product-${p.id}`} title="Delete product"><FiTrash2 size={14} /></button>
 </div>
 </div>
 ))}
 </div>
 )}

 {/* Delete Product Confirmation Modal Overlay */}
 {deleteConfirmProduct && (
 <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteConfirmProduct(null)}>
 <div className="admin-modal" style={{ maxWidth: 440, width: '92%', padding: '28px 24px', textAlign: 'center', borderRadius: 24, position: 'relative' }}>
 <button className="admin-modal-close" onClick={() => setDeleteConfirmProduct(null)} style={{ top: 18, right: 18, cursor: 'pointer' }}>
 <FiX size={16} />
 </button>

 <div style={{
 width: 60, height: 60, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)',
 color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
 margin: '0 auto 16px', boxShadow: '0 8px 20px rgba(239,68,68,0.2)'
 }}>
 <FiAlertTriangle size={30} />
 </div>

 <h3 style={{ margin: '0 0 10px', fontSize: '1.2rem', fontWeight: 800, color: 'var(--admin-text)' }}>
 Delete Product?
 </h3>

 <p style={{ margin: '0 0 24px', fontSize: '0.88rem', color: 'var(--admin-text-secondary)', lineHeight: 1.6 }}>
 Are you sure you want to delete <strong style={{ color: 'var(--admin-text)' }}>"{deleteConfirmProduct.name}"</strong>? This action cannot be undone and will remove all inventory stock for this item.
 </p>

 <div style={{ display: 'flex', gap: 12 }}>
 <button
 type="button"
 className="admin-btn admin-btn-secondary"
 style={{ flex: 1, padding: '11px', borderRadius: 12, fontWeight: 700 }}
 onClick={() => setDeleteConfirmProduct(null)}
 disabled={deletingProduct}
 >
 <FiX size={15} /> Cancel
 </button>
 <button
 type="button"
 className="admin-btn"
 style={{
 flex: 1, padding: '11px', borderRadius: 12, fontWeight: 800,
 background: '#EF4444', color: '#FFFFFF', border: 'none',
 boxShadow: '0 4px 14px rgba(239,68,68,0.35)', cursor: deletingProduct ? 'wait' : 'pointer'
 }}
 onClick={confirmDeleteProduct}
 disabled={deletingProduct}
 >
 {deletingProduct ? 'Deleting...' : <><FiTrash2 size={15} /> Delete</>}
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 )}

 {/*  SALES ORDERS TAB  */}
 {tab === 'orders' && (
 <div>
 {/* Header with Title & Refresh */}
 <div style={{
 background: 'var(--admin-card-bg)',
 borderRadius: 20,
 border: '1px solid var(--admin-card-border)',
 padding: '20px 24px',
 marginBottom: 20,
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 flexWrap: 'wrap',
 gap: 16,
 boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
 <div style={{
 width: 40, height: 40, borderRadius: 12,
 background: 'linear-gradient(135deg, #10B981, #059669)',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 color: '#fff', boxShadow: '0 4px 12px rgba(16,185,129,0.35)'
 }}>
 <FiShoppingBag size={20} />
 </div>
 <div>
 <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--admin-text)' }}>
 {isKhmer ? 'ការបញ្ជាទិញរបស់អតិថិជន' : 'Customer Sales Orders'} ({orders.length})
 </h2>
 <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
 {isKhmer ? 'តាមដានការបញ្ជាទិញ ស្ថានភាពដឹកជញ្ជូន និងព័ត៌មានទំនិញ' : 'Track orders, delivery status, and ordered product details'}
 </span>
 </div>
 </div>

 <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
 <button
 className="admin-btn admin-btn-secondary"
 onClick={loadData}
 style={{ gap: 6, display: 'flex', alignItems: 'center', fontSize: '0.82rem' }}
 >
 <FiRefreshCw size={14} /> {isKhmer ? 'ផ្ទុកឡើងវិញ' : 'Refresh'}
 </button>
 </div>
 </div>

 {/* Search Bar & 1-Row Status Filter Tabs with Left/Right Scroll Controls */}
 <div style={{ marginBottom: 20 }}>
 {/* Search Bar on Top */}
 <div style={{ position: 'relative', width: '100%', maxWidth: 460, marginBottom: 12 }}>
 <FiSearch style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 14, color: 'var(--admin-text-secondary)' }} size={16} />
 <input
 type="text"
 className="admin-input"
 placeholder={isKhmer ? 'ស្វែងរកតាមលេខសម្គាល់ ឬអ៊ីមែល...' : 'Search by Order ID or email...'}
 value={orderSearchQuery}
 onChange={e => setOrderSearchQuery(e.target.value)}
 style={{ width: '100%', paddingLeft: 38, height: 40, fontSize: '0.85rem', borderRadius: 12 }}
 />
 </div>

 {/* Scrollable Single Row Status Filter Buttons */}
 <div
 style={{
 display: 'flex',
 gap: 8,
 overflowX: 'auto',
 paddingBottom: 4,
 paddingTop: 2,
 whiteSpace: 'nowrap',
 scrollbarWidth: 'none',
 msOverflowStyle: 'none',
 scrollBehavior: 'smooth',
 WebkitOverflowScrolling: 'touch'
 }}
 >
 {[
 { key: 'ALL', label: isKhmer ? 'ទាំងអស់' : 'All', count: orders.length, color: '#6366F1' },
 { key: 'PENDING', label: isKhmer ? 'រង់ចាំ' : 'Pending', count: orders.filter(o => o.status === 'PENDING').length, color: '#F59E0B' },
 { key: 'PROCESSING', label: isKhmer ? 'កំពុងដំណើរការ' : 'Processing', count: orders.filter(o => o.status === 'PROCESSING').length, color: '#3B82F6' },
 { key: 'COMPLETED', label: isKhmer ? 'បានប្រគល់រួចរាល់' : 'Completed', count: orders.filter(o => o.status === 'COMPLETED' || o.status === 'DELIVERED').length, color: '#10B981' },
 { key: 'CANCELLED', label: isKhmer ? 'បានបោះបង់' : 'Cancelled', count: orders.filter(o => o.status === 'CANCELLED').length, color: '#EF4444' }
 ].map(st => {
 const isSelected = orderStatusFilter === st.key;
 return (
 <button
 key={st.key}
 type="button"
 onClick={(e) => {
 setOrderStatusFilter(st.key);
 e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
 }}
 style={{
 padding: '7px 14px', borderRadius: 10,
 border: isSelected ? `2px solid ${st.color}` : '1px solid var(--admin-card-border)',
 background: isSelected ? `${st.color}15` : 'var(--admin-card-bg)',
 color: isSelected ? st.color : 'var(--admin-text-secondary)',
 fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer',
 display: 'inline-flex', alignItems: 'center', gap: 6,
 flexShrink: 0,
 transition: 'all 0.15s ease'
 }}
 >
 <span>{st.label}</span>
 <span style={{
 background: isSelected ? st.color : 'rgba(0,0,0,0.06)',
 color: isSelected ? '#fff' : 'var(--admin-text-secondary)',
 padding: '1px 6px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 800
 }}>
 {st.count}
 </span>
 </button>
 );
 })}
 </div>
 </div>

 {/* Orders List */}
 {(() => {
 const filteredOrders = orders.filter(o => {
 const matchesStatus = orderStatusFilter === 'ALL'
 ? true
 : orderStatusFilter === 'COMPLETED'
 ? (o.status === 'COMPLETED' || o.status === 'DELIVERED')
 : o.status === orderStatusFilter;

 const q = orderSearchQuery.toLowerCase().trim();
 const matchesSearch = !q
 ? true
 : String(o.id).includes(q) ||
 (o.userEmail && o.userEmail.toLowerCase().includes(q)) ||
 (o.user?.email && o.user.email.toLowerCase().includes(q)) ||
 (o.items && o.items.some(it => it.productName?.toLowerCase().includes(q)));

 return matchesStatus && matchesSearch;
 });

 if (filteredOrders.length === 0) {
 return (
 <div style={{
 textAlign: 'center', padding: '60px 20px',
 color: 'var(--admin-text-secondary)',
 background: 'var(--admin-card-bg)',
 borderRadius: 20,
 border: '1px dashed var(--admin-card-border)'
 }}>
 <FiShoppingBag size={44} style={{ opacity: 0.35, marginBottom: 12 }} />
 <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--admin-text)' }}>
 {isKhmer ? 'មិនមានការបញ្ជាទិញត្រូវនឹងលក្ខខណ្ឌឡើយ' : 'No sales orders found'}
 </div>
 <div style={{ fontSize: '0.84rem', marginTop: 4 }}>
 {orderStatusFilter !== 'ALL' || orderSearchQuery
 ? (isKhmer ? 'សូមសាកល្បងផ្លាស់ប្ដូរពាក្យស្វែងរក ឬ Filter ផ្សេង' : 'Try adjusting your search query or status filter.')
 : (isKhmer ? 'នៅពេលអតិថិជនបញ្ជាទិញ ការបញ្ជាទិញនឹងបង្ហាញនៅទីនេះ' : 'Orders will appear here once customers make a purchase.')}
 </div>
 </div>
 );
 }

 return (
 <div style={{ display: 'grid', gap: 14 }}>
 {filteredOrders.map(o => {
 const firstItem = o.items?.[0] || o.product;
 const matchedProduct = firstItem?.productId ? products.find(p => p.id === firstItem.productId) : null;
 const prodName = firstItem?.productName || firstItem?.name || matchedProduct?.name || (isKhmer ? 'ទំនិញឌីជីថល' : 'Digital Product');
 const prodImg = firstItem?.imageUrl || matchedProduct?.imageUrl;

 return (
 <div
 key={o.id}
 style={{
 background: 'var(--admin-card-bg)',
 borderRadius: 18,
 border: '1px solid var(--admin-card-border)',
 padding: '20px 22px',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 gap: 16,
 flexWrap: 'wrap',
 boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
 transition: 'all 0.2s ease'
 }}
 >
 {/* Order Overview & Product Preview */}
 <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: '1 1 300px', minWidth: 260 }}>
 <div style={{
 width: 52, height: 52, borderRadius: 12,
 background: prodImg ? `url(${prodImg}) center/cover` : 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
 border: '1px solid #CBD5E1',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 flexShrink: 0, color: '#4F46E5'
 }}>
 {!prodImg && <FiPackage size={24} />}
 </div>

 <div style={{ flex: 1, minWidth: 0 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
 <span style={{ fontWeight: 900, fontSize: '1.02rem', color: 'var(--admin-text)' }}>Order #{o.id}</span>
 <StatusBadge status={o.status} isKhmer={isKhmer} />
 </div>

 <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--admin-text)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
 {prodName} {o.items?.length > 1 ? `(+${o.items.length - 1} more)` : ''}
 </div>

 <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
 <span>{isKhmer ? 'អតិថិជន:' : 'Buyer:'} <strong style={{ color: 'var(--admin-text)' }}>{getBuyerDisplayName(o)}</strong></span>
 <span>{isKhmer ? 'ថ្ងៃ:' : 'Date:'} {o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}</span>
 {o.status === 'PROCESSING' && (
 <span style={{ background: '#ECFDF5', color: '#059669', padding: '2px 8px', borderRadius: 6, fontWeight: 800, fontSize: '0.72rem', border: '1px solid #A7F3D0' }}>
 {isKhmer ? ' អតិថិជនបានបង់ប្រាក់រួច' : ' Payment Completed'}
 </span>
 )}
 </div>
                      {/* Prominent Buyer Invite Email Badge for SHARING Accounts */}
                      {(() => {
                        const inviteEmail = o.buyerInviteEmail || o.items?.find(it => it.buyerInviteEmail)?.buyerInviteEmail;
                        if (!inviteEmail) return null;
                        return (
                          <div style={{
                            marginTop: 8,
                            padding: '6px 12px',
                            background: '#FEF3C7',
                            border: '1.5px solid #FCD34D',
                            borderRadius: 10,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            flexWrap: 'wrap'
                          }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#92400E' }}>
                              {isKhmer ? 'អ៊ីមែលត្រូវ Invite:' : 'Customer Invite Email:'}
                            </span>
                            <code style={{ fontSize: '0.86rem', fontWeight: 900, color: '#0F172A', background: '#FFF', padding: '2px 8px', borderRadius: 6, border: '1px solid #CBD5E1' }}>
                              {inviteEmail}
                            </code>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(inviteEmail);
                                toast.success(isKhmer ? 'បានចម្លងអ៊ីមែល!' : 'Invite email copied!');
                              }}
                              style={{
                                padding: '2px 8px',
                                borderRadius: 6,
                                background: '#D97706',
                                color: '#FFF',
                                border: 'none',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              {isKhmer ? 'ចម្លង' : 'Copy'}
                            </button>
                          </div>
                        );
                      })()}
 </div>
 </div>

 {/* Price & Action Buttons */}
 <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
 {/* Price */}
 <div style={{ textAlign: 'right', minWidth: 80 }}>
 <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
 {isKhmer ? 'សរុប' : 'Total'}
 </div>
 <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10B981' }}>
 ${Number(o.totalAmount || o.price || 0).toFixed(2)}
 </div>
 </div>

 {/* When PENDING: Awaiting Buyer Payment (No manual button for seller) */}
 {o.status === 'PENDING' && (
 <div
 style={{
 background: 'rgba(245,158,11,0.08)',
 color: '#D97706',
 border: '1px solid rgba(245,158,11,0.25)',
 borderRadius: 10,
 padding: '6px 12px',
 fontSize: '0.78rem',
 fontWeight: 700,
 display: 'inline-flex',
 alignItems: 'center',
 gap: 5
 }}
 title={isKhmer ? 'រង់ចាំអតិថិជនទូទាត់ប្រាក់' : 'Awaiting customer payment via KHQR/Bakong'}
 >
 <FiClock size={13} />
 <span>{isKhmer ? 'រង់ចាំការទូទាត់' : 'Awaiting Payment'}</span>
 </div>
 )}

 {/* When PROCESSING or WAITING_FOR_STOCK: Deliver to Customer Button */}
 {(o.status === 'PROCESSING' || o.status === 'WAITING_FOR_STOCK') && (
 <button
 type="button"
 onClick={() => handleOpenDeliverModal(o)}
 style={{
 background: 'linear-gradient(135deg, #10B981, #059669)',
 color: '#FFFFFF',
 border: 'none',
 borderRadius: 10,
 padding: '8px 14px',
 fontSize: '0.84rem',
 fontWeight: 800,
 cursor: 'pointer',
 display: 'inline-flex',
 alignItems: 'center',
 gap: 6,
 boxShadow: '0 3px 12px rgba(16,185,129,0.35)'
 }}
 title={isKhmer
 ? 'ចុចដើម្បីប្រគល់ទំនិញជូនអតិថិជន និង Upload ភស្តុតាង'
 : 'Click to deliver digital item to buyer and upload proof'}
 >
 <FiSend size={14} />
                        <span>{isKhmer ? 'ប្រគល់ទំនិញជូនអតិថិជន' : 'Deliver to Buyer'}</span>
                      </button>
                    )}

                    {/* If already delivered, allow editing delivery/proof */}
                    {o.status === 'DELIVERED' && (
                      <button
                        type="button"
                        onClick={() => handleOpenDeliverModal(o)}
                        style={{
                          background: 'rgba(59,130,246,0.08)',
                          color: '#2563EB',
                          border: '1px solid rgba(59,130,246,0.3)',
                          borderRadius: 10,
                          padding: '8px 12px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5
                        }}
                        title={isKhmer ? 'កែប្រែព័ត៌មានប្រគល់ ឬបន្ថែមរូបភាពភស្តុតាង' : 'Edit delivery details / proof'}
                      >
                        <FiShield size={14} />
                        <span>{isKhmer ? 'ភស្តុតាងប្រគល់' : 'Delivery Proof'}</span>
                      </button>
                    )}

                    {/* View Product Button (មើល Product) */}
                    <button
                      type="button"
                      onClick={() => setSelectedOrderForView(o)}
                      style={{
                        background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 10,
                        padding: '8px 16px',
                        fontSize: '0.84rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 2px 8px rgba(99,102,241,0.3)'
                      }}
                      title={isKhmer ? 'ចុចដើម្បីមើលព័ត៌មានលម្អិតទំនិញ និងទិន្នន័យប្រគល់' : 'View ordered product details and delivered credentials'}
                    >
                      <FiEye size={15} />
 <span>{isKhmer ? 'មើលទំនិញ' : 'View Product'}</span>
 </button>

 

 {/* Message Buyer */}
 <Link
 to={`/chat/seller-customers?order=${o.id}`}
 className="admin-btn admin-btn-secondary"
 style={{ fontSize: '0.8rem', gap: 6, display: 'inline-flex', alignItems: 'center', padding: '7px 12px', textDecoration: 'none', borderRadius: 10 }}
 title={isKhmer ? 'ផ្ញើសារទៅអតិថិជន' : 'Chat with Buyer'}
 >
 <FiMessageSquare size={14} />
 </Link>
 </div>
 </div>
 );
 })}
 </div>
 );
 })()}
 </div>
 )}

 {/*  CUSTOMER REVIEWS TAB  */}
      {tab === 'reviews' && (
        <div>
          {/* Header with Title & Stats */}
          <div style={{
            background: 'var(--admin-card-bg)',
            borderRadius: 20,
            border: '1px solid var(--admin-card-border)',
            padding: '24px',
            marginBottom: 20,
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', boxShadow: '0 4px 12px rgba(245,158,11,0.35)'
                }}>
                  <FiStar size={22} fill="#fff" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--admin-text)' }}>
                    {isKhmer ? 'ការវាយតម្លៃ & ពិន្ទុផ្កាយពីអតិថិជន' : 'Customer Reviews & Ratings'}
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
                    {isKhmer ? 'មតិកែលម្អ និងពិន្ទុផ្កាយដែលអតិថិជនបានផ្តល់ឱ្យផលិតផលរបស់អ្នក' : 'Feedback and star ratings submitted by verified buyers'}
                  </span>
                </div>
              </div>
            </div>

            {/* Rating Overview Grid */}
            {(() => {
              const totalRev = reviewsList.length;
              const avgScore = totalRev > 0 ? (reviewsList.reduce((acc, r) => acc + (r.rating || 5), 0) / totalRev).toFixed(1) : '5.0';
              const satisfactionPct = totalRev > 0 ? Math.round((reviewsList.filter(r => (r.rating || 5) >= 4).length / totalRev) * 100) : 100;
              const starCounts = [5, 4, 3, 2, 1].map(star => {
                const count = reviewsList.filter(r => Math.round(r.rating || 5) === star).length;
                const pct = totalRev > 0 ? Math.round((count / totalRev) * 100) : (star === 5 ? 100 : 0);
                return { star, count, pct };
              });

              return (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                    <div style={{ background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', borderRadius: 16, border: '1px solid #FDE68A', padding: '20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#B45309', lineHeight: 1 }}>{avgScore}</div>
                      <div>
                        <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                          {[1, 2, 3, 4, 5].map(s => (
                            <FiStar key={s} size={16} fill={s <= Math.round(Number(avgScore)) ? '#F59E0B' : '#E2E8F0'} color={s <= Math.round(Number(avgScore)) ? '#F59E0B' : '#CBD5E1'} />
                          ))}
                        </div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400E' }}>{isKhmer ? 'ផ្អែកលើការវាយតម្លៃ' : 'Based on'} {totalRev} {isKhmer ? 'នាក់' : 'reviews'}</div>
                      </div>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)', borderRadius: 16, border: '1px solid #A7F3D0', padding: '20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#047857', lineHeight: 1 }}>{satisfactionPct}%</div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#065F46', fontSize: '0.9rem' }}>{isKhmer ? 'អត្រាពេញចិត្តខ្ពស់' : 'Positive Rating'}</div>
                        <div style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 600 }}>{isKhmer ? 'អតិថិជនពេញចិត្តសេវាកម្ម' : 'Buyers loved your fast service'}</div>
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-secondary, #F8FAFC)', borderRadius: 16, border: '1px solid var(--admin-card-border)', padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
                      {starCounts.map(r => (
                        <div key={r.star} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem' }}>
                          <span style={{ width: 40, fontWeight: 700, color: 'var(--admin-text)' }}>{r.star} Stars</span>
                          <div style={{ flex: 1, height: 6, background: '#E2E8F0', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${r.pct}%`, height: '100%', background: '#F59E0B', borderRadius: 99 }} />
                          </div>
                          <span style={{ width: 28, textAlign: 'right', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>{r.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Star Filter Pills */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 18, marginBottom: 18, flexWrap: 'wrap' }}>
                    {[
                      { key: 'ALL', label: isKhmer ? 'ទាំងអស់' : 'All' },
                      { key: '5', label: '5 Stars' },
                      { key: '4', label: '4 Stars' },
                      { key: '3', label: '3 Stars' },
                      { key: '2', label: '2 Stars' },
                      { key: '1', label: '1 Star' },
                    ].map(f => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setReviewStarFilter(f.key)}
                        style={{
                          padding: '7px 14px', borderRadius: 10,
                          border: reviewStarFilter === f.key ? '2px solid #F59E0B' : '1px solid var(--admin-card-border)',
                          background: reviewStarFilter === f.key ? 'rgba(245,158,11,0.12)' : 'var(--admin-card-bg)',
                          color: reviewStarFilter === f.key ? '#B45309' : 'var(--admin-text-secondary)',
                          fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer'
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Reviews List */}
                  <div style={{ display: 'grid', gap: 14 }}>
                    {reviewsList.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--admin-text-secondary)', background: 'var(--admin-card-bg)', borderRadius: 18, border: '1px solid var(--admin-card-border)' }}>
                        <FiStar size={40} style={{ marginBottom: 12, opacity: 0.3, color: '#F59E0B' }} />
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--admin-text)', marginBottom: 4 }}>
                          {isKhmer ? 'មិនទាន់មានការវាយតម្លៃពីអតិថិជននៅឡើយទេ' : 'No customer reviews yet'}
                        </div>
                        <div style={{ fontSize: '0.82rem' }}>
                          {isKhmer ? 'នៅពេលអតិថិជនទិញ និងវាយតម្លៃទំនិញ វានឹងបង្ហាញនៅទីនេះ' : 'When buyers rate their completed orders, feedback will appear here.'}
                        </div>
                      </div>
                    ) : (
                      reviewsList
                        .filter(r => reviewStarFilter === 'ALL' || String(r.rating) === reviewStarFilter)
                        .map(r => {
                          const rawName = r.buyerName || r.buyer?.fullName || r.userName || (isKhmer ? 'អតិថិជន' : 'Verified Buyer');
                          const displayName = maskName(rawName);
                          const initial = (rawName || 'U')[0].toUpperCase();
                          const pName = r.productName || r.product?.name || (isKhmer ? 'ផលិតផល' : 'Digital Product');
                          return (
                            <div
                              key={r.id}
                              style={{
                                background: 'var(--admin-card-bg)',
                                borderRadius: 18,
                                border: '1px solid var(--admin-card-border)',
                                padding: '18px 22px',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <div style={{
                                    width: 40, height: 40, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                                    color: '#fff', fontWeight: 900, display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontSize: '1rem'
                                  }}>
                                    {initial}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 800, color: 'var(--admin-text)', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                      {displayName}
                                      <span style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '1px 6px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                        <FiCheckCircle size={10} /> {isKhmer ? 'ការទិញពិត' : 'Verified'}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)' }}>
                                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                                    </div>
                                  </div>
                                </div>

                                {/* Star Rating Badge */}
                                <div style={{ display: 'flex', gap: 2 }}>
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <FiStar
                                      key={star}
                                      size={14}
                                      fill={star <= (r.rating || 5) ? '#F59E0B' : 'transparent'}
                                      color={star <= (r.rating || 5) ? '#F59E0B' : '#CBD5E1'}
                                    />
                                  ))}
                                </div>
                              </div>

                              {/* Product Tag */}
                              <div style={{ marginBottom: 8 }}>
                                <span style={{
                                  background: 'rgba(99,102,241,0.08)',
                                  color: '#4F46E5',
                                  border: '1px solid rgba(99,102,241,0.2)',
                                  padding: '4px 10px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700
                                }}>
                                  {pName}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.9rem', color: 'var(--admin-text)', lineHeight: 1.6 }}>
                                {r.comment}
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/*  DISPUTES TAB  */}
      {tab === 'disputes' && (() => {
        const openDisputesCount = disputesList.filter(d => d.status === 'OPEN').length;
        const filteredDisputes = disputesList.filter(d => {
          if (disputeFilter === 'ALL') return true;
          if (disputeFilter === 'OPEN') return d.status === 'OPEN';
          if (disputeFilter === 'RESOLVED') return d.status === 'RESOLVED_REPLACED' || d.status === 'RESOLVED_REFUNDED' || d.status?.includes('RESOLVED');
          if (disputeFilter === 'ESCALATED') return d.status === 'ESCALATED_ADMIN';
          return true;
        });

        return (
          <div>
            {/* Header Hero */}
            <div style={{
              background: 'var(--admin-card-bg)',
              borderRadius: 20,
              border: '1px solid var(--admin-card-border)',
              padding: '20px 24px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: 'linear-gradient(135deg, #EF4444, #F59E0B)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', boxShadow: '0 4px 14px rgba(239,68,68,0.35)'
                }}>
                  <FiAlertTriangle size={22} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isKhmer ? 'មជ្ឈមណ្ឌលដោះស្រាយទំនាស់ & សំណើសុំប្តូរគណនី' : 'Disputes & Replacement Claims Center'}
                    {openDisputesCount > 0 && (
                      <span style={{
                        background: '#EF4444', color: '#fff', fontSize: '0.75rem', fontWeight: 900,
                        padding: '2px 8px', borderRadius: 99, lineHeight: 1
                      }}>
                        {openDisputesCount} {isKhmer ? 'ត្រូវការដោះស្រាយ' : 'Needs Action'}
                      </span>
                    )}
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
                    {isKhmer ? 'ពិនិត្យពាក្យបណ្ដឹងពីអតិថិជន ផ្តល់គណនីប្តូរថ្មី ផ្ញើកំណត់ចំណាំ និងពិនិត្យប្រវត្តិសកម្មភាព' : 'Review dispute claims, deliver replacement accounts with notes, and track seller-buyer resolution activity'}
                  </span>
                </div>
              </div>

              <button
                className="admin-btn admin-btn-secondary"
                onClick={loadData}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 700 }}
              >
                <FiRefreshCw size={14} className={loading ? 'spin' : ''} /> {isKhmer ? 'ផ្ទុកឡើងវិញ' : 'Refresh'}
              </button>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
              {[
                { key: 'ALL', label: isKhmer ? 'ទាំងអស់' : 'All', count: disputesList.length },
                { key: 'OPEN', label: isKhmer ? 'បើកចំហ (ត្រូវការដោះស្រាយ)' : 'Open (Action Needed)', count: openDisputesCount, color: '#EF4444' },
                { key: 'ESCALATED', label: isKhmer ? 'Admin សម្របសម្រួល' : 'Admin Mediation', count: disputesList.filter(d => d.status === 'ESCALATED_ADMIN').length, color: '#8B5CF6' },
                { key: 'RESOLVED', label: isKhmer ? 'ដោះស្រាយរួច' : 'Resolved', count: disputesList.filter(d => d.status?.includes('RESOLVED')).length, color: '#10B981' }
              ].map(f => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setDisputeFilter(f.key)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 12,
                    border: disputeFilter === f.key ? '2px solid #EF4444' : '1px solid var(--admin-card-border)',
                    background: disputeFilter === f.key ? 'rgba(239,68,68,0.1)' : 'var(--admin-card-bg)',
                    color: disputeFilter === f.key ? '#DC2626' : 'var(--admin-text-secondary)',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span>{f.label}</span>
                  <span style={{
                    background: f.color ? f.color : 'rgba(0,0,0,0.08)',
                    color: f.color ? '#fff' : 'inherit',
                    borderRadius: 99,
                    padding: '1px 6px',
                    fontSize: '0.7rem',
                    fontWeight: 900
                  }}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Empty State */}
            {filteredDisputes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '56px 20px', color: 'var(--admin-text-secondary)', background: 'var(--admin-card-bg)', borderRadius: 20, border: '1px solid var(--admin-card-border)' }}>
                <FiShield size={44} style={{ marginBottom: 12, opacity: 0.4, color: '#10B981' }} />
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--admin-text)' }}>
                  {isKhmer ? 'មិនមានបណ្តឹងតវ៉ាក្នុងបញ្ជីនេះទេ' : 'No dispute claims in this filter'}
                </div>
                <div style={{ fontSize: '0.85rem', marginTop: 4 }}>
                  {isKhmer ? 'ហាងរបស់អ្នកដំណើរការបានល្អ មិនមានបណ្តឹងតវ៉ាដែលត្រូវដោះស្រាយឡើយ។' : 'All clear! No claims matching the selected status.'}
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {filteredDisputes.map(d => {
                  const isOpen = d.status === 'OPEN';
                  const isEscalated = d.status === 'ESCALATED_ADMIN';
                  const isResolved = d.status?.includes('RESOLVED') || d.status === 'RESOLVED_REPLACED' || d.status === 'RESOLVED_REFUNDED' || d.status === 'RESOLVED_ADMIN_COMPLETED' || d.status === 'RESOLVED_ADMIN_REFUNDED';
                  const isCompleted = isResolved || d.status === 'CLOSED' || d.status === 'REJECTED' || d.status === 'COMPLETED';
                  const hasReplacementSent = Boolean(d.replacementAccountEmail || d.replacementNote);

                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDispute(d)}
                      style={{
                        background: 'var(--admin-card-bg)',
                        borderRadius: 12,
                        border: isOpen ? '1.5px solid rgba(239,68,68,0.5)' : '1px solid var(--admin-card-border)',
                        padding: '10px 14px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
                        transition: 'all 0.15s ease',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6
                      }}
                      title={isKhmer ? 'ចុចដើម្បីបើកផ្ទាំងដោះស្រាយ និងប្តូរទំនិញថ្មី' : 'Click to view & drop replacement'}
                    >
                      {/* Top Row: Product + Order ID + Badges + Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          {d.productImageUrl && (
                            <div style={{ width: 32, height: 32, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--admin-card-border)', flexShrink: 0 }}>
                              <img src={d.productImageUrl} alt={d.productName || 'Product'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--admin-text)' }}>
                              Dispute #{d.id} · {isKhmer ? 'ការបញ្ជាទិញ' : 'Order'} #{d.orderId}
                            </span>
                            {d.productName && (
                              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#3B82F6' }}>
                                ({d.productName})
                              </span>
                            )}
                            <span style={{
                              background: '#FEE2E2', color: '#DC2626',
                              fontWeight: 800, fontSize: '0.68rem',
                              padding: '1px 6px', borderRadius: 4
                            }}>
                              {d.issueType || d.reason || d.issueCategory || 'Defect'}
                            </span>
                            {d.preferredSolution && (
                              <span style={{
                                background: '#EFF6FF', color: '#2563EB',
                                fontWeight: 800, fontSize: '0.68rem',
                                padding: '1px 6px', borderRadius: 4
                              }}>
                                {isKhmer ? 'សំណើ:' : 'Wants:'} {d.preferredSolution === 'REPLACEMENT' ? (isKhmer ? 'ប្តូរថ្មី' : 'Replacement') : (isKhmer ? 'សងប្រាក់' : 'Refund')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        {(() => {
                          const statusConfig = {
                            OPEN: {
                              label: isKhmer ? 'រង់ចាំអ្នកលក់ (OPEN)' : 'Awaiting Seller',
                              bg: 'rgba(239,68,68,0.12)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)'
                            },
                            RESOLVED_REPLACED: {
                              label: isKhmer ? 'បានប្តូរថ្មីរួចរាល់' : 'Replacement Sent',
                              bg: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)'
                            },
                            RESOLVED_REFUNDED: {
                              label: isKhmer ? 'បានយល់ព្រមបង្វិលប្រាក់' : 'Refund Accepted',
                              bg: 'rgba(245,158,11,0.12)', color: '#D97706', border: '1px solid rgba(245,158,11,0.3)'
                            },
                            ESCALATED_ADMIN: {
                              label: isKhmer ? 'Admin សម្របសម្រួល' : 'Admin Mediation',
                              bg: 'rgba(139,92,246,0.12)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.3)'
                            },
                            RESOLVED_ADMIN_REFUNDED: {
                              label: isKhmer ? 'Admin បង្វិលប្រាក់' : 'Admin Refunded',
                              bg: 'rgba(99,102,241,0.12)', color: '#6366F1', border: '1px solid rgba(99,102,241,0.3)'
                            },
                            RESOLVED_ADMIN_COMPLETED: {
                              label: isKhmer ? 'Admin សម្រេចបញ្ចប់' : 'Admin Completed',
                              bg: 'rgba(59,130,246,0.12)', color: '#2563EB', border: '1px solid rgba(59,130,246,0.3)'
                            },
                            REJECTED: {
                              label: isKhmer ? 'បានបដិសេធ' : 'Rejected',
                              bg: 'rgba(100,116,139,0.12)', color: '#64748B', border: '1px solid rgba(100,116,139,0.3)'
                            }
                          };
                          const conf = statusConfig[d.status] || {
                            label: d.status?.replace(/_/g, ' '),
                            bg: 'rgba(100,116,139,0.12)', color: '#64748B', border: '1px solid rgba(100,116,139,0.3)'
                          };
                          return (
                            <span style={{
                              padding: '2px 8px', borderRadius: 5, fontSize: '0.7rem', fontWeight: 800,
                              background: conf.bg, color: conf.color, border: conf.border
                            }}>
                              {conf.label}
                            </span>
                          );
                        })()}
                      </div>

                      {/* Bottom Row: Buyer & Date Info + Actions in single clean row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, paddingTop: 4 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <span>
                            <strong style={{ color: 'var(--admin-text)' }}>{isKhmer ? 'អ្នកទិញ:' : 'Buyer:'}</strong> {d.buyerName || 'Customer'} <span style={{ opacity: 0.8 }}>({d.buyerEmail})</span>
                          </span>
                          <span>•</span>
                          <span>
                            <strong style={{ color: 'var(--admin-text)' }}>{isKhmer ? 'កាលបរិច្ឆេទ:' : 'Date:'}</strong> {d.createdAt ? new Date(d.createdAt).toLocaleString() : '—'}
                          </span>
                          {hasReplacementSent && (
                            <span style={{
                              background: '#DCFCE7', color: '#15803D',
                              padding: '1px 6px', borderRadius: 4, fontSize: '0.68rem', fontWeight: 800,
                              display: 'inline-flex', alignItems: 'center', gap: 3
                            }}>
                              <FiCheckCircle size={10} /> {isKhmer ? 'បានប្រគល់គណនីប្តូរថ្មី' : 'Replacement Sent'}
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                          {/* Button: Provide Replacement - Hide when completed/resolved or replacement already sent */}
                          {!isCompleted && !hasReplacementSent && (
                            <button
                              type="button"
                              onClick={() => setSelectedDispute(d)}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '5px 12px', borderRadius: 7,
                                background: 'linear-gradient(135deg, #10B981, #059669)',
                                color: '#fff', border: 'none',
                                fontWeight: 800, fontSize: '0.74rem', cursor: 'pointer',
                                boxShadow: '0 2px 6px rgba(16,185,129,0.3)'
                              }}
                            >
                              <FiRefreshCw size={12} />
                              {isKhmer ? 'ផ្តល់គណនីថ្មី (Add New Account)' : 'Add New Account'}
                            </button>
                          )}

                          {/* Button: Chat */}
                          <button
                            type="button"
                            onClick={() => {
                              setTab('chats');
                              setMobileMenuOpen(false);
                            }}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '5px 10px', borderRadius: 7,
                              background: 'rgba(99,102,241,0.08)',
                              color: '#4F46E5', border: '1px solid rgba(99,102,241,0.25)',
                              fontWeight: 800, fontSize: '0.74rem', cursor: 'pointer'
                            }}
                          >
                            <FiMessageSquare size={12} />
                            {isKhmer ? 'ជជែក' : 'Chat'}
                          </button>

                          {/* Button: View Order Details */}
                          {d.orderId && (
                            <Link
                              to={`/orders/${d.orderId}`}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '5px 9px', borderRadius: 7,
                                background: 'var(--bg-secondary)',
                                color: 'var(--admin-text)', border: '1px solid var(--admin-card-border)',
                                fontWeight: 700, fontSize: '0.72rem', textDecoration: 'none'
                              }}
                            >
                              <FiExternalLink size={11} />
                              {isKhmer ? `Order #${d.orderId}` : `Order #${d.orderId}`}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/*  WALLET & FINANCIAL LEDGER TAB (Tables 24, 25, 31, 32)  */}
      {tab === 'wallet' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header */}
          <div style={{
            background: 'var(--admin-card-bg)',
            borderRadius: 20,
            border: '1px solid var(--admin-card-border)',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: 'linear-gradient(135deg, #10B981, #059669)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', boxShadow: '0 4px 14px rgba(16,185,129,0.35)'
              }}>
                <MdAccountBalanceWallet size={24} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--admin-text)' }}>
                  {isKhmer ? 'កាបូប & កំណត់ត្រាហិរញ្ញវត្ថុ' : 'Seller Wallet & Financial Ledger'}
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
                  {isKhmer ? 'គ្រប់គ្រងសមតុល្យកាបូប, កំណត់ត្រាប្រតិបត្តិការ (Ledger), គណនីដកប្រាក់ និងកម្រៃជើងសារ' : 'Manage wallet balances, double-entry transaction ledger, payout destinations, and commission reports'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(true)}
                className="admin-btn admin-btn-primary"
                style={{ background: 'linear-gradient(135deg, #10B981, #059669)', border: 'none' }}
              >
                <FiDollarSign size={14} /> {isKhmer ? 'ស្នើសុំដកប្រាក់' : 'Request Payout'}
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={loadData}
              >
                <FiRefreshCw size={14} className={loading ? 'spin' : ''} /> {isKhmer ? 'ផ្ទុកឡើងវិញ' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* 4 Multi-Balance Cards (Table 24: seller_wallets) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div className="admin-card" style={{ padding: 20, borderLeft: '4px solid #10B981', background: 'var(--admin-card-bg)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--admin-text-secondary)', textTransform: 'uppercase' }}>{isKhmer ? 'សមតុល្យដែលអាចប្រើបាន' : 'AVAILABLE BALANCE'}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10B981', marginTop: 4 }}>
                ${(walletInfo?.balance ?? balance).toFixed(2)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-secondary)', marginTop: 2 }}>{isKhmer ? 'ត្រៀមដកប្រាក់បានភ្លាមៗ' : 'Ready for instant withdrawal'}</div>
            </div>

            <div className="admin-card" style={{ padding: 20, borderLeft: '4px solid #F59E0B', background: 'var(--admin-card-bg)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--admin-text-secondary)', textTransform: 'uppercase' }}>{isKhmer ? 'កំពុងកាន់កាប់ ESCROW' : 'PENDING ESCROW'}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#F59E0B', marginTop: 4 }}>
                ${(walletInfo?.pendingBalance ?? 0).toFixed(2)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-secondary)', marginTop: 2 }}>{isKhmer ? 'រង់ចាំអតិថិជនបញ្ជាក់ទទួល' : 'Held until delivery confirmed'}</div>
            </div>

            <div className="admin-card" style={{ padding: 20, borderLeft: '4px solid #6366F1', background: 'var(--admin-card-bg)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--admin-text-secondary)', textTransform: 'uppercase' }}>{isKhmer ? 'ចំណូលសរុបពេញមួយជីវិត' : 'LIFETIME EARNED'}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#818CF8', marginTop: 4 }}>
                ${(walletInfo?.totalEarned ?? (balance + withdrawals.reduce((s,w)=>s+(w.amount||0),0))).toFixed(2)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-secondary)', marginTop: 2 }}>{isKhmer ? 'ចំណូលលក់សរុបទាំងអស់' : 'Cumulative sales volume'}</div>
            </div>

            <div className="admin-card" style={{ padding: 20, borderLeft: '4px solid #38BDF8', background: 'var(--admin-card-bg)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--admin-text-secondary)', textTransform: 'uppercase' }}>{isKhmer ? 'បានដកប្រាក់សរុប' : 'TOTAL WITHDRAWN'}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#38BDF8', marginTop: 4 }}>
                ${(walletInfo?.totalWithdrawn ?? withdrawals.filter(w=>w.status==='COMPLETED').reduce((s,w)=>s+(w.amount||0),0)).toFixed(2)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-secondary)', marginTop: 2 }}>{isKhmer ? 'ការផ្ទេរប្រាក់បានជោគជ័យ' : 'Settled to your bank/KHQR'}</div>
            </div>
          </div>

          {/* Saved Payout Methods (Table 31: seller_payout_methods) */}
          <div style={{ background: 'var(--admin-card-bg)', borderRadius: 18, border: '1px solid var(--admin-card-border)', padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiCreditCard color="#10B981" /> {isKhmer ? 'វិធីសាស្ត្រ & គណនីដកប្រាក់' : 'Saved Payout Destinations (Table 31)'}
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-secondary)' }}>
                  {isKhmer ? 'គណនីធនាគារ ឬ Bakong KHQR ដែល Admin នឹងស្កេនផ្ទេរប្រាក់ចំណេញជូនលោកអ្នក' : 'Your linked Bank / Bakong KHQR accounts for receiving sales payouts'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowAddPayoutModal(true)}
                style={{
                  padding: '7px 14px', borderRadius: 10,
                  background: 'rgba(16,185,129,0.1)', color: '#10B981',
                  border: '1px solid rgba(16,185,129,0.3)',
                  fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6
                }}
              >
                <FiPlus size={14} /> {isKhmer ? 'បន្ថែមគណនីថ្មី' : 'Add Destination'}
              </button>
            </div>

            {payoutMethods.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--admin-text-secondary)', fontSize: '0.85rem' }}>
                {isKhmer ? 'មិនទាន់មានគណនីដកប្រាក់ត្រូវបានរក្សាទុកទេ។ សូមចុច "បន្ថែមគណនីថ្មី"។' : 'No payout methods saved yet. Click "Add Destination" to link your Bakong KHQR.'}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                {payoutMethods.map((pm) => (
                  <div key={pm.id} style={{
                    padding: 16, borderRadius: 14,
                    background: 'var(--bg-secondary)',
                    border: pm.isDefault ? '2px solid #10B981' : '1px solid var(--admin-card-border)',
                    position: 'relative'
                  }}>
                    {pm.isDefault && (
                      <span style={{
                        position: 'absolute', top: 12, right: 12,
                        background: '#10B981', color: '#fff', fontSize: '0.65rem',
                        fontWeight: 900, padding: '2px 8px', borderRadius: 99
                      }}>
                        DEFAULT
                      </span>
                    )}
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--admin-text)' }}>
                      {pm.bankName || pm.methodType}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--admin-text)', fontWeight: 700, marginTop: 4 }}>
                      {pm.accountName}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-secondary)', fontFamily: 'monospace', marginTop: 2 }}>
                      {pm.accountNumber}
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm('Delete this payout method?')) {
                            await walletApi.deletePayoutMethod(pm.id);
                            loadData();
                          }
                        }}
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                      >
                        {isKhmer ? 'លុបចេញ' : 'Remove'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Double-Entry Wallet Ledger Transactions (Table 25: wallet_transactions) */}
          <div style={{ background: 'var(--admin-card-bg)', borderRadius: 18, border: '1px solid var(--admin-card-border)', padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiList color="#38BDF8" /> {isKhmer ? 'កំណត់ត្រាប្រតិបត្តិការហិរញ្ញវត្ថុ (Wallet Ledger)' : 'Wallet Transaction Ledger (Table 25)'}
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-secondary)' }}>
                  {isKhmer ? 'កំណត់ត្រាចំណូលពីការលក់, ការកាត់កម្រៃជើងសារ 5%, និងការដកប្រាក់' : 'Audit logs of every credit, debit, fee deduction, and payout'}
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-text-secondary)' }}>
                {walletTxs.length} {isKhmer ? 'ប្រតិបត្តិការ' : 'Transactions'}
              </span>
            </div>

            {walletTxs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--admin-text-secondary)', fontSize: '0.85rem' }}>
                {isKhmer ? 'មិនទាន់មានកំណត់ត្រាប្រតិបត្តិការនៅឡើយទេ' : 'No ledger transactions recorded yet.'}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>{isKhmer ? 'កាលបរិច្ឆេទ' : 'Date & Time'}</th>
                      <th>{isKhmer ? 'ប្រភេទប្រតិបត្តិការ' : 'Type'}</th>
                      <th>{isKhmer ? 'ការពណ៌នា' : 'Description'}</th>
                      <th>{isKhmer ? 'ចំនួនទឹកប្រាក់' : 'Amount'}</th>
                      <th>{isKhmer ? 'សមតុល្យបន្ទាប់' : 'Balance After'}</th>
                      <th>{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {walletTxs.map((tx) => (
                      <tr key={tx.id}>
                        <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                        </td>
                        <td>
                          <span style={{
                            padding: '3px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 800,
                            background: tx.amount > 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                            color: tx.amount > 0 ? '#10B981' : '#EF4444'
                          }}>
                            {tx.type}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--admin-text)' }}>
                          {tx.description}
                        </td>
                        <td style={{ fontWeight: 800, fontSize: '0.86rem', color: tx.amount > 0 ? '#10B981' : '#EF4444' }}>
                          {tx.amount > 0 ? `+$${tx.amount.toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`}
                        </td>
                        <td style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--admin-text)' }}>
                          ${(tx.balanceAfter ?? 0).toFixed(2)}
                        </td>
                        <td>
                          <StatusBadge status={tx.status} isKhmer={isKhmer} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Commission Reports (Table 32: seller_commissions) */}
          {commissionsData.length > 0 && (
            <div style={{ background: 'var(--admin-card-bg)', borderRadius: 18, border: '1px solid var(--admin-card-border)', padding: 22 }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: 800, color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiPercent color="#8B5CF6" /> {isKhmer ? 'របាយការណ៍កម្រៃជើងសារវេទិកា' : 'Platform Commission Breakdown (Table 32)'}
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>{isKhmer ? 'Order ID' : 'Order ID'}</th>
                      <th>{isKhmer ? 'ចំណូលលក់សរុប (Gross)' : 'Gross Sale'}</th>
                      <th>{isKhmer ? 'កម្រៃវេទិកា (5%)' : 'Platform Cut'}</th>
                      <th>{isKhmer ? 'ចំណូលសុទ្ធរបស់អ្នកលក់ (Net)' : 'Seller Net'}</th>
                      <th>{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissionsData.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 700 }}>#{c.order?.id || c.orderId || '—'}</td>
                        <td style={{ fontWeight: 800 }}>${(c.grossAmount || 0).toFixed(2)}</td>
                        <td style={{ color: '#EF4444', fontWeight: 700 }}>-${(c.commissionAmount || 0).toFixed(2)} ({c.commissionRate}%)</td>
                        <td style={{ color: '#10B981', fontWeight: 900 }}>${(c.sellerNetAmount || 0).toFixed(2)}</td>
                        <td><StatusBadge status={c.status} isKhmer={isKhmer} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/*  MODAL: Add Payout Destination Modal  */}
      {showAddPayoutModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 16
        }}>
          <div style={{
            background: 'var(--admin-card-bg, #1e293b)',
            borderRadius: 20, padding: 24, width: '100%', maxWidth: 460,
            border: '1px solid var(--admin-card-border, rgba(255,255,255,0.1))',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0, color: 'var(--admin-text, #fff)', fontSize: '1.1rem', fontWeight: 800 }}>
                {isKhmer ? 'បន្ថែមគណនីដកប្រាក់ថ្មី' : 'Add Payout Destination'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddPayoutModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--admin-text-secondary)', cursor: 'pointer' }}
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setSavingPayout(true);
              try {
                await walletApi.savePayoutMethod(newPayoutForm);
                toast.success(isKhmer ? 'បានបន្ថែមគណនីដកប្រាក់ជោគជ័យ!' : 'Payout destination saved successfully!');
                setShowAddPayoutModal(false);
                setNewPayoutForm({
                  methodType: 'BAKONG_KHQR',
                  accountName: '',
                  accountNumber: '',
                  bankName: 'ABA Bank KHQR',
                  khqrData: '',
                  khqrImageUrl: '',
                  isDefault: true
                });
                loadData();
              } catch (err) {
                toast.error(err?.response?.data?.message || 'Failed to save payout method');
              } finally {
                setSavingPayout(false);
              }
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--admin-text-secondary)' }}>{isKhmer ? 'ប្រភេទគណនី' : 'DESTINATION TYPE'}</label>
                  <select
                    value={newPayoutForm.methodType}
                    onChange={e => setNewPayoutForm(f => ({ ...f, methodType: e.target.value }))}
                    className="admin-input"
                    style={{ width: '100%', marginTop: 4 }}
                  >
                    <option value="BAKONG_KHQR">Bakong KHQR (All Banks in Cambodia)</option>
                    <option value="ABA_BANK">ABA Bank (Direct Transfer)</option>
                    <option value="ACLEDA_BANK">ACLEDA Bank</option>
                    <option value="WING_BANK">Wing Bank</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--admin-text-secondary)' }}>{isKhmer ? 'ឈ្មោះម្ចាស់គណនី' : 'ACCOUNT HOLDER NAME'}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SAMETH KORB"
                    value={newPayoutForm.accountName}
                    onChange={e => setNewPayoutForm(f => ({ ...f, accountName: e.target.value.toUpperCase() }))}
                    className="admin-input"
                    style={{ width: '100%', marginTop: 4 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--admin-text-secondary)' }}>{isKhmer ? 'លេខគណនី ឬ Bakong ID' : 'ACCOUNT NUMBER / BAKONG ID'}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. korb_sameth@aba or 001 234 567"
                    value={newPayoutForm.accountNumber}
                    onChange={e => setNewPayoutForm(f => ({ ...f, accountNumber: e.target.value }))}
                    className="admin-input"
                    style={{ width: '100%', marginTop: 4 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--admin-text-secondary)' }}>{isKhmer ? 'ឈ្មោះធនាគារ' : 'BANK / INSTITUTION NAME'}</label>
                  <input
                    type="text"
                    placeholder="e.g. ABA Bank KHQR"
                    value={newPayoutForm.bankName}
                    onChange={e => setNewPayoutForm(f => ({ ...f, bankName: e.target.value }))}
                    className="admin-input"
                    style={{ width: '100%', marginTop: 4 }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowAddPayoutModal(false)}
                    className="admin-btn admin-btn-secondary"
                  >
                    {isKhmer ? 'បោះបង់' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={savingPayout}
                    className="admin-btn admin-btn-primary"
                    style={{ background: 'linear-gradient(135deg, #10B981, #059669)', border: 'none' }}
                  >
                    {savingPayout ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...') : (isKhmer ? 'រក្សាទុកគណនី' : 'Save Method')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*  CUSTOMER CHATS TAB  */}
      {tab === 'chats' && (
        <div style={{ background: 'var(--admin-card-bg)', borderRadius: 18, border: '1px solid var(--admin-card-border)', overflow: 'hidden', padding: 0, height: 'calc(100vh - 120px)', minHeight: 500, maxHeight: 820 }}>
          <SellerCustomerInboxPage height="100%" />
        </div>
      )}

 {/*  ADMIN SUPPORT CHAT TAB  */}
 {tab === 'admin-chat' && (
 <div style={{ background: 'var(--admin-card-bg)', borderRadius: 20, border: '1px solid var(--admin-card-border)', overflow: 'hidden', padding: 16 }}>
 <SellerAdminChatPage />
 </div>
 )}

 {/*  WITHDRAWALS TAB  */}
 {tab === 'withdrawals' && (
 <div>
 <div style={{ background: 'var(--admin-card-bg)', borderRadius: 16, border: '1px solid var(--admin-card-border)', padding: 24, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
 <div>
 <div style={{ fontSize: '0.82rem', color: 'var(--admin-text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>AVAILABLE BALANCE</div>
 <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>${balance.toFixed(2)}</div>
 </div>
 <button className="admin-btn admin-btn-primary" onClick={() => setShowWithdrawModal(true)} disabled={balance <= 0} style={{ gap: 6, display: 'flex', alignItems: 'center', fontSize: '0.85rem' }} id="seller-withdraw-btn">
 <FiDollarSign size={15} /> Withdraw
 </button>
 </div>

 {withdrawals.length === 0 ? (
 <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--admin-text-secondary)' }}>
 <FiDollarSign size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
 <div style={{ fontWeight: 600 }}>No withdrawals yet</div>
 </div>
 ) : (
 <div style={{ display: 'grid', gap: 12 }}>
 {withdrawals.map(w => (
 <div key={w.id} style={{ background: 'var(--admin-card-bg)', borderRadius: 14, border: '1px solid var(--admin-card-border)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
 <div style={{ flex: 1 }}>
 <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--admin-text)', marginBottom: 4 }}>${w.amount?.toFixed(2)}</div>
 <div style={{ fontSize: '0.82rem', color: 'var(--admin-text-secondary)' }}>
 Requested: {w.requestedAt ? new Date(w.requestedAt).toLocaleString() : '—'}
 </div>
 {w.adminNote && <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', marginTop: 4 }}>Note: {w.adminNote}</div>}
 </div>
 <StatusBadge status={w.status} />
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 {/*  PROMOTIONS & COUPONS TAB  */}
 {tab === 'coupons' && (
 <div>
 {/* Header with Title, Subtabs & Action Button */}
 <div style={{
 background: 'var(--admin-card-bg)',
 borderRadius: 20,
 border: '1px solid var(--admin-card-border)',
 padding: '20px 24px',
 marginBottom: 20,
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 flexWrap: 'wrap',
 gap: 16,
 boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
 }}>
 <div>
 <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
 <div style={{
 width: 40, height: 40, borderRadius: 12,
 background: 'linear-gradient(135deg, #EC4899, #F43F5E)',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 color: '#fff', boxShadow: '0 4px 12px rgba(236,72,153,0.35)'
 }}>
 <FiPercent size={20} />
 </div>
 <div>
 <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--admin-text)' }}>
 {isKhmer ? 'ប្រូម៉ូសិន & ការបញ្ចុះតម្លៃ' : 'Promotions & Discounts'}
 </h2>
 <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
 {isKhmer ? 'គ្រប់គ្រងកូដបញ្ចុះតម្លៃ និងការបញ្ចុះតម្លៃផ្ទាល់លើមុខទំនិញ' : 'Manage promo coupon codes and direct product sale discounts'}
 </span>
 </div>
 </div>

 {/* Sub-tab Switcher: Promo Codes vs Product Discounts */}
 <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
 <button
 type="button"
 onClick={() => setPromoSubTab('coupons')}
 style={{
 padding: '8px 16px', borderRadius: 10,
 border: promoSubTab === 'coupons' ? '2px solid #6366F1' : '1px solid var(--admin-card-border)',
 background: promoSubTab === 'coupons' ? 'rgba(99,102,241,0.12)' : 'var(--admin-card-bg)',
 color: promoSubTab === 'coupons' ? '#4F46E5' : 'var(--admin-text-secondary)',
 fontWeight: 800, fontSize: '0.84rem', cursor: 'pointer',
 display: 'inline-flex', alignItems: 'center', gap: 6
 }}
 >
 <FiTag size={15} />
 <span>{isKhmer ? 'កូដប្រូម៉ូសិន' : 'Promo Codes'}</span>
 <span style={{ background: '#6366F1', color: '#fff', padding: '1px 6px', borderRadius: 10, fontSize: '0.7rem' }}>
 {couponsList.length}
 </span>
 </button>

 <button
 type="button"
 onClick={() => setPromoSubTab('product_discounts')}
 style={{
 padding: '8px 16px', borderRadius: 10,
 border: promoSubTab === 'product_discounts' ? '2px solid #EC4899' : '1px solid var(--admin-card-border)',
 background: promoSubTab === 'product_discounts' ? 'rgba(236,72,153,0.12)' : 'var(--admin-card-bg)',
 color: promoSubTab === 'product_discounts' ? '#DB2777' : 'var(--admin-text-secondary)',
 fontWeight: 800, fontSize: '0.84rem', cursor: 'pointer',
 display: 'inline-flex', alignItems: 'center', gap: 6
 }}
 >
 <FiPercent size={15} />
 <span>{isKhmer ? 'បញ្ចុះតម្លៃលើទំនិញ' : 'Product Discounts & Badges'}</span>
 <span style={{ background: '#EC4899', color: '#fff', padding: '1px 6px', borderRadius: 10, fontSize: '0.7rem' }}>
 {products.filter(p => p.originalPrice && Number(p.originalPrice) > Number(p.basePrice || p.price || 0)).length}
 </span>
 </button>
 </div>
 </div>

 <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
 <button
 className="admin-btn admin-btn-secondary"
 onClick={loadData}
 style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
 title={isKhmer ? 'ផ្ទុកឡើងវិញ' : 'Refresh'}
 >
 <FiRefreshCw size={14} /> {isKhmer ? 'ផ្ទុកឡើងវិញ' : 'Refresh'}
 </button>
 {promoSubTab === 'coupons' ? (
 <button
 onClick={() => {
 generateCode();
 setShowCouponModal(true);
 }}
 style={{
 background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
 color: '#fff', border: 'none', borderRadius: 12,
 padding: '10px 20px', fontSize: '0.88rem', fontWeight: 800,
 cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
 boxShadow: '0 4px 14px rgba(99,102,241,0.35)'
 }}
 >
 <FiPlus size={16} />
 <span>{isKhmer ? '+ បង្កើតកូដថ្មី' : '+ Create Coupon'}</span>
 </button>
 ) : null}
 </div>
 </div>

 {/*  SUB-TAB 1: PROMO COUPON CODES  */}
 {promoSubTab === 'coupons' && (
 <div>
 {/* Stats Row */}
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
 <div style={{ background: 'var(--admin-card-bg)', borderRadius: 16, border: '1px solid var(--admin-card-border)', padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
 <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.12)', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
 <FiTag size={22} />
 </div>
 <div>
 <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-text-secondary)', textTransform: 'uppercase' }}>
 {isKhmer ? 'កូដសរុប' : 'Total Coupons'}
 </div>
 <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--admin-text)' }}>
 {couponsList.length}
 </div>
 </div>
 </div>

 <div style={{ background: 'var(--admin-card-bg)', borderRadius: 16, border: '1px solid var(--admin-card-border)', padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
 <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16,185,129,0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
 <FiCheckCircle size={22} />
 </div>
 <div>
 <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-text-secondary)', textTransform: 'uppercase' }}>
 {isKhmer ? 'កូដកំពុងដំណើរការ' : 'Active Coupons'}
 </div>
 <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#10B981' }}>
 {couponsList.filter(c => c.isActive !== false).length}
 </div>
 </div>
 </div>

 <div style={{ background: 'var(--admin-card-bg)', borderRadius: 16, border: '1px solid var(--admin-card-border)', padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
 <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.12)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
 <FiShoppingBag size={22} />
 </div>
 <div>
 <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-text-secondary)', textTransform: 'uppercase' }}>
 {isKhmer ? 'ចំនួនដងប្រើប្រាស់' : 'Times Redeemed'}
 </div>
 <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F59E0B' }}>
 {couponsList.reduce((acc, c) => acc + (c.usageCount || 0), 0)}
 </div>
 </div>
 </div>
 </div>

 {/* Coupons List / Empty State */}
 {couponsList.length === 0 ? (
 <div style={{
 textAlign: 'center', padding: '60px 20px',
 color: 'var(--admin-text-secondary)',
 background: 'var(--admin-card-bg)',
 borderRadius: 20,
 border: '1px dashed var(--admin-card-border)'
 }}>
 <div style={{
 width: 72, height: 72, borderRadius: '50%',
 background: 'rgba(236,72,153,0.1)', color: '#EC4899',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 margin: '0 auto 16px'
 }}>
 <FiPercent size={36} />
 </div>
 <h3 style={{ margin: '0 0 8px', fontWeight: 800, fontSize: '1.15rem', color: 'var(--admin-text)' }}>
 {isKhmer ? 'មិនទាន់មានកូដបញ្ចុះតម្លៃឡើយ' : 'No Discount Coupons Created Yet'}
 </h3>
 <p style={{ maxWidth: 440, margin: '0 auto 20px', fontSize: '0.88rem', lineHeight: 1.6 }}>
 {isKhmer
 ? 'បង្កើតកូដបញ្ចុះតម្លៃដំបូងរបស់អ្នក ដើម្បីទាក់ទាញអតិថិជន និងបង្កើនការបញ្ជាទិញក្នុងហាង!'
 : 'Create your first discount coupon to attract more buyers and increase sales!'}
 </p>
 <button
 onClick={() => {
 generateCode();
 setShowCouponModal(true);
 }}
 style={{
 background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
 color: '#fff', border: 'none', borderRadius: 12,
 padding: '11px 24px', fontSize: '0.9rem', fontWeight: 800,
 cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
 boxShadow: '0 4px 14px rgba(99,102,241,0.35)'
 }}
 >
 <FiPlus size={16} /> {isKhmer ? 'បង្កើតកូដដំបូង' : 'Create First Coupon'}
 </button>
 </div>
 ) : (
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
 {couponsList.map(c => {
 const isPercentage = c.discountType === 'PERCENTAGE';
 const discountDisplay = isPercentage ? `${c.discountValue}%` : `$${parseFloat(c.discountValue || 0).toFixed(2)}`;
 const isActive = c.isActive !== false;
 const targetProduct = c.productId ? products.find(p => p.id === c.productId) : null;

 return (
 <div
 key={c.id}
 style={{
 background: 'var(--admin-card-bg)',
 borderRadius: 18,
 border: '1px solid var(--admin-card-border)',
 overflow: 'hidden',
 display: 'flex',
 flexDirection: 'column',
 boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
 transition: 'all 0.2s ease',
 position: 'relative'
 }}
 >
 {/* Top banner / ticket style */}
 <div style={{
 background: isPercentage
 ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
 : 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
 color: '#fff',
 padding: '16px 18px',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between'
 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
 <div style={{
 width: 38, height: 38, borderRadius: 10,
 background: 'rgba(255,255,255,0.2)',
 backdropFilter: 'blur(4px)',
 display: 'flex', alignItems: 'center', justifyContent: 'center'
 }}>
 {isPercentage ? <FiPercent size={20} /> : <FiDollarSign size={20} />}
 </div>
 <div>
 <div style={{ fontSize: '1.45rem', fontWeight: 900, lineHeight: 1 }}>
 {discountDisplay} <span style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.9 }}>OFF</span>
 </div>
 <div style={{ fontSize: '0.72rem', opacity: 0.85, fontWeight: 600, marginTop: 2 }}>
 {isPercentage ? (isKhmer ? 'បញ្ចុះភាគរយ' : 'Percentage Discount') : (isKhmer ? 'បញ្ចុះសាច់ប្រាក់' : 'Fixed Amount')}
 </div>
 </div>
 </div>

 <span style={{
 padding: '3px 10px', borderRadius: 20,
 fontSize: '0.72rem', fontWeight: 800,
 background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)',
 color: '#fff', border: '1px solid rgba(255,255,255,0.4)'
 }}>
 {isActive ? (isKhmer ? 'សកម្ម' : 'ACTIVE') : (isKhmer ? 'ផុតកំណត់' : 'EXPIRED')}
 </span>
 </div>

 {/* Body details */}
 <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
 {/* Code Block with Click-to-copy */}
 <div style={{
 display: 'flex', alignItems: 'center', justifyContent: 'space-between',
 background: 'var(--bg-secondary, #F8FAFC)',
 border: '1px dashed #CBD5E1',
 borderRadius: 12,
 padding: '8px 12px'
 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
 <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>{isKhmer ? 'កូដ:' : 'CODE:'}</span>
 <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1.05rem', color: '#4F46E5', letterSpacing: '0.05em' }}>
 {c.code}
 </span>
 </div>
 <button
 onClick={() => handleCopyCode(c.code)}
 style={{
 background: 'rgba(99,102,241,0.1)', color: '#4F46E5',
 border: 'none', borderRadius: 8, padding: '5px 10px',
 fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
 display: 'inline-flex', alignItems: 'center', gap: 4
 }}
 title={isKhmer ? 'ចម្លងកូដ' : 'Copy Code'}
 >
 <FiCopy size={13} /> {isKhmer ? 'ចម្លង' : 'Copy'}
 </button>
 </div>

 {/* Applied Product Scope */}
 {targetProduct && (
 <div style={{ background: 'rgba(99,102,241,0.06)', borderRadius: 10, padding: '6px 10px', fontSize: '0.78rem', color: '#4F46E5', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
 <FiPackage size={14} />
 <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
 {isKhmer ? 'សម្រាប់ទំនិញ:' : 'For:'} {targetProduct.name}
 </span>
 </div>
 )}

 {/* Info Rows */}
 <div style={{ display: 'grid', gap: 6, fontSize: '0.8rem', color: 'var(--admin-text-secondary)', marginTop: 4 }}>
 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
 <span>{isKhmer ? 'ទិញអប្បបរមា:' : 'Min Spend:'}</span>
 <span style={{ fontWeight: 700, color: 'var(--admin-text)' }}>
 {c.minSpend ? `$${parseFloat(c.minSpend).toFixed(2)}` : (isKhmer ? 'គ្មានកម្រិត' : 'None')}
 </span>
 </div>
 {isPercentage && c.maxDiscount && (
 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
 <span>{isKhmer ? 'បញ្ចុះអតិបរមា:' : 'Max Discount:'}</span>
 <span style={{ fontWeight: 700, color: 'var(--admin-text)' }}>
 ${parseFloat(c.maxDiscount).toFixed(2)}
 </span>
 </div>
 )}
 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
 <span>{isKhmer ? 'ចំនួនដងប្រើប្រាស់:' : 'Usage Limit:'}</span>
 <span style={{ fontWeight: 700, color: 'var(--admin-text)' }}>
 {c.usageCount || 0} / {c.usageLimit || '∞'} {isKhmer ? 'ដង' : 'uses'}
 </span>
 </div>
 {c.expiresAt && (
 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
 <span>{isKhmer ? 'ផុតកំណត់:' : 'Expires:'}</span>
 <span style={{ fontWeight: 600, color: 'var(--admin-text-secondary)' }}>
 {new Date(c.expiresAt).toLocaleDateString()}
 </span>
 </div>
 )}
 </div>
 </div>

 {/* Action buttons footer */}
 <div style={{
 padding: '12px 18px',
 borderTop: '1px solid var(--admin-card-border)',
 background: 'rgba(0,0,0,0.01)',
 display: 'flex',
 alignItems: 'center',
 gap: 8
 }}>
 <button
 onClick={() => handleShareCoupon(c)}
 style={{
 flex: 1,
 background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
 color: '#fff', border: 'none', borderRadius: 10,
 padding: '8px 12px', fontSize: '0.82rem', fontWeight: 800,
 cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
 justifyContent: 'center', gap: 6,
 boxShadow: '0 2px 8px rgba(99,102,241,0.25)'
 }}
 >
 <FiShare2 size={14} />
 <span>{isKhmer ? 'ចែករំលែក' : 'Share'}</span>
 </button>

 <button
 onClick={() => handleDeleteCoupon(c)}
 disabled={deletingCoupon && deleteConfirmCoupon?.id === c.id}
 style={{
 background: 'rgba(239,68,68,0.08)',
 color: '#EF4444',
 border: '1px solid rgba(239,68,68,0.25)',
 borderRadius: 10,
 padding: '8px 12px', fontSize: '0.82rem', fontWeight: 700,
 cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
 justifyContent: 'center', gap: 4
 }}
 title={isKhmer ? 'លុបកូដ' : 'Delete Coupon'}
 >
 <FiTrash2 size={14} />
 </button>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 )}

 {/*  SUB-TAB 2: DIRECT PRODUCT DISCOUNTS & PROMO BADGES  */}
 {promoSubTab === 'product_discounts' && (
 <div>
 {/* Tool Explanation Box */}
 <div style={{
 background: 'linear-gradient(135deg, rgba(236,72,153,0.08), rgba(139,92,246,0.08))',
 border: '1px solid rgba(236,72,153,0.25)',
 borderRadius: 16,
 padding: '16px 20px',
 marginBottom: 20
 }}>
 <h4 style={{ margin: '0 0 6px', fontWeight: 800, color: 'var(--admin-text)', fontSize: '0.98rem' }}>
 {isKhmer ? 'បញ្ចុះតម្លៃផ្ទាល់លើមុខទំនិញ' : 'Direct Product Sale Prices & Promotional Badges'}
 </h4>
 <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--admin-text-secondary)', lineHeight: 1.5 }}>
 {isKhmer
 ? 'កំណត់តម្លៃបញ្ចុះផ្ទាល់លើមុខទំនិញនីមួយៗ (បង្ហាញតម្លៃដើមដែលគូសឆូត និងតម្លៃលក់ថ្មី) រួមជាមួយស្លាកសញ្ញាផ្សព្វផ្សាយ (PROMO, FLASH SALE, HOT DEAL, SPECIAL OFFER) លើទំព័រហាងរបស់អ្នក។'
 : 'Set direct promotional sale prices on specific products with strike-through original prices and custom eye-catching promotional badges.'}
 </p>
 </div>

 {/* Quick Product Discount Picker Tool */}
 <div style={{
 background: 'var(--admin-card-bg)',
 borderRadius: 18,
 border: '1px solid var(--admin-card-border)',
 padding: '20px 24px',
 marginBottom: 24,
 boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
 }}>
 <h4 style={{ margin: '0 0 14px', fontWeight: 800, color: 'var(--admin-text)', fontSize: '0.95rem' }}>
 {isKhmer ? 'ជ្រើសរើសទំនិញដើម្បីដាក់តម្លៃបញ្ចុះ & ស្លាកសញ្ញា' : 'Select Product to Apply Discount & Promo Badge'}
 </h4>

 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, alignItems: 'end' }}>
 {/* Product Selector */}
 <div>
 <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--admin-text-secondary)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
 {isKhmer ? 'ជ្រើសរើសទំនិញ *' : 'Choose Product *'}
 </label>
 <select
 className="admin-input"
 value={quickDiscountProduct?.id || ''}
 onChange={e => {
 const pId = e.target.value;
 const found = products.find(p => String(p.id) === String(pId));
 setQuickDiscountProduct(found || null);
 if (found) {
 const regularP = found.originalPrice || found.basePrice || found.price || 0;
 setQuickDiscountForm({
 originalPrice: regularP,
 salePrice: found.basePrice || found.price || '',
 productLabel: found.productLabel && found.productLabel !== 'NONE' ? found.productLabel : 'PROMO'
 });
 }
 }}
 >
 <option value="">{isKhmer ? '-- ជ្រើសរើសមុខទំនិញ --' : '-- Select a product --'}</option>
 {products.map(p => (
 <option key={p.id} value={p.id}>
 {p.name} — Current: ${(p.basePrice || p.price || 0).toFixed(2)}
 </option>
 ))}
 </select>
 </div>

 {/* Original Price */}
 <div>
 <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--admin-text-secondary)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
 {isKhmer ? 'តម្លៃដើម ($)' : 'Original Price ($)'}
 </label>
 <input
 type="number"
 step="0.01"
 className="admin-input"
 placeholder="e.g. 10.00"
 value={quickDiscountForm.originalPrice}
 onChange={e => setQuickDiscountForm(f => ({ ...f, originalPrice: e.target.value }))}
 disabled={!quickDiscountProduct}
 />
 </div>

 {/* Sale Discount Price */}
 <div>
 <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#DB2777', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
 {isKhmer ? 'តម្លៃបញ្ចុះថ្មី ($) *' : 'Discount / Sale Price ($) *'}
 </label>
 <input
 type="number"
 step="0.01"
 className="admin-input"
 placeholder="e.g. 7.50"
 value={quickDiscountForm.salePrice}
 onChange={e => setQuickDiscountForm(f => ({ ...f, salePrice: e.target.value }))}
 disabled={!quickDiscountProduct}
 style={{ borderColor: '#EC4899', fontWeight: 800 }}
 />
 </div>

 {/* Promo Label Badge Selector */}
 <div>
 <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--admin-text-secondary)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
 {isKhmer ? 'ស្លាកសញ្ញាផ្សព្វផ្សាយ' : 'Promotional Label / Badge'}
 </label>
 <select
 className="admin-input"
 value={quickDiscountForm.productLabel}
 onChange={e => setQuickDiscountForm(f => ({ ...f, productLabel: e.target.value }))}
 disabled={!quickDiscountProduct}
 style={{ fontWeight: 700 }}
 >
 {PRODUCT_LABELS.map(l => (
 <option key={l.value} value={l.value}>{l.label}</option>
 ))}
 </select>
 </div>

 {/* Apply Button */}
 <div>
 <button
 type="button"
 onClick={handleApplyProductDiscount}
 disabled={!quickDiscountProduct}
 style={{
 width: '100%',
 background: 'linear-gradient(135deg, #EC4899, #DB2777)',
 color: '#fff', border: 'none', borderRadius: 10,
 padding: '10px 16px', fontWeight: 800, fontSize: '0.85rem',
 cursor: quickDiscountProduct ? 'pointer' : 'not-allowed',
 display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
 opacity: quickDiscountProduct ? 1 : 0.6,
 boxShadow: quickDiscountProduct ? '0 4px 12px rgba(236,72,153,0.35)' : 'none'
 }}
 >
 <FiCheck size={15} />
 <span>{isKhmer ? 'អនុវត្តការបញ្ចុះតម្លៃ' : 'Apply Discount'}</span>
 </button>
 </div>
 </div>

 {/* Live Calculation Preview */}
 {quickDiscountProduct && quickDiscountForm.originalPrice && quickDiscountForm.salePrice && (
 <div style={{
 marginTop: 14, padding: '10px 14px', borderRadius: 10,
 background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
 display: 'flex', alignItems: 'center', justifyContent: 'space-between',
 fontSize: '0.82rem'
 }}>
 <span style={{ color: '#065F46', fontWeight: 700 }}>
 {isKhmer ? 'ការគណនា:' : 'Discount Calculation:'} Original ${parseFloat(quickDiscountForm.originalPrice).toFixed(2)} → Sale ${parseFloat(quickDiscountForm.salePrice).toFixed(2)}
 </span>
 <span style={{ background: '#10B981', color: '#fff', padding: '2px 8px', borderRadius: 6, fontWeight: 900 }}>
 -{Math.round(((parseFloat(quickDiscountForm.originalPrice) - parseFloat(quickDiscountForm.salePrice)) / parseFloat(quickDiscountForm.originalPrice)) * 100)}% OFF
 </span>
 </div>
 )}
 </div>

 {/* List of Products Currently with Active Discounts */}
 <h4 style={{ margin: '0 0 14px', fontWeight: 800, color: 'var(--admin-text)' }}>
 {isKhmer ? 'ទំនិញកំពុងបញ្ចុះតម្លៃក្នុងហាង' : 'Store Products Currently on Sale'}
 </h4>

 {products.filter(p => p.originalPrice && Number(p.originalPrice) > Number(p.basePrice || p.price || 0)).length === 0 ? (
 <div style={{
 textAlign: 'center', padding: '40px 20px',
 color: 'var(--admin-text-secondary)',
 background: 'var(--admin-card-bg)',
 borderRadius: 16,
 border: '1px dashed var(--admin-card-border)'
 }}>
 <FiPercent size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
 <div style={{ fontWeight: 700 }}>{isKhmer ? 'មិនទាន់មានទំនិញណាកំពុងបញ្ចុះតម្លៃឡើយ' : 'No products currently on sale'}</div>
 <div style={{ fontSize: '0.82rem', marginTop: 4 }}>{isKhmer ? 'ជ្រើសរើសមុខទំនិញខាងលើដើម្បីកំណត់តម្លៃបញ្ចុះដំបូង!' : 'Use the tool above to set your first product discount!'}</div>
 </div>
 ) : (
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
 {products.filter(p => p.originalPrice && Number(p.originalPrice) > Number(p.basePrice || p.price || 0)).map(p => {
 const currentP = parseFloat(p.basePrice || p.price || 0);
 const origP = parseFloat(p.originalPrice);
 const pct = Math.round(((origP - currentP) / origP) * 100);

 return (
 <div
 key={p.id}
 style={{
 background: 'var(--admin-card-bg)',
 borderRadius: 16,
 border: '1px solid var(--admin-card-border)',
 padding: 16,
 display: 'flex',
 flexDirection: 'column',
 gap: 10,
 boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
 }}
 >
 <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
  <div style={{
    width: 48, height: 48, borderRadius: 10, overflow: 'hidden',
    background: 'var(--admin-card-border, #E2E8F0)', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid var(--admin-card-border, #CBD5E1)'
  }}>
    {p.imageUrl ? (
      <img
        src={p.imageUrl}
        alt={p.name}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    ) : (
      <FiPackage size={22} color="#64748B" />
    )}
  </div>
  <div style={{ flex: 1, minWidth: 0 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
      <h4 style={{
        margin: '0 0 2px', fontWeight: 800, fontSize: '0.92rem',
        color: 'var(--admin-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
      }}>
        {p.name}
      </h4>
      <span style={{
        background: 'linear-gradient(135deg, #EC4899, #BE185D)',
        color: '#fff', padding: '2px 7px', borderRadius: 6,
        fontSize: '0.7rem', fontWeight: 900, flexShrink: 0
      }}>
        {p.productLabel || 'PROMO'}
      </span>
    </div>
    <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-secondary)' }}>ID: #{p.id}</span>
  </div>
 </div>

 {/* Price Comparison */}
 <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
 <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#DB2777' }}>
 ${currentP.toFixed(2)}
 </span>
 <span style={{ fontSize: '0.85rem', color: '#94A3B8', textDecoration: 'line-through', fontWeight: 600 }}>
 ${origP.toFixed(2)}
 </span>
 <span style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444', padding: '2px 6px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 900 }}>
 -{pct}% OFF
 </span>
 </div>

 {/* Action Buttons */}
 <div style={{ display: 'flex', gap: 6, marginTop: 4, paddingTop: 10, borderTop: '1px solid var(--admin-card-border)', flexWrap: 'wrap' }}>
 <button
 type="button"
 onClick={() => {
 setQuickDiscountProduct(p);
 setQuickDiscountForm({
 originalPrice: p.originalPrice || '',
 salePrice: p.basePrice || p.price || '',
 productLabel: p.productLabel || 'PROMO'
 });
 window.scrollTo({ top: 0, behavior: 'smooth' });
 }}
 style={{
 flex: 1, minWidth: 60, padding: '7px 8px', borderRadius: 8,
 background: 'rgba(99,102,241,0.1)', color: '#4F46E5',
 border: 'none', fontWeight: 800, fontSize: '0.78rem',
 cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
 }}
 >
 <FiEdit2 size={12} />
 <span>{isKhmer ? 'កែប្រែ' : 'Edit'}</span>
 </button>

 <button
 type="button"
 onClick={() => handleCompleteProductDiscount(p)}
 style={{
 flex: 1.2, minWidth: 80, padding: '7px 8px', borderRadius: 8,
 background: 'rgba(16,185,129,0.12)', color: '#059669',
 border: '1px solid rgba(16,185,129,0.25)', fontWeight: 800, fontSize: '0.78rem',
 cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
 }}
 title={isKhmer ? 'បញ្ចប់ការបញ្ចុះតម្លៃ និងស្ដារតម្លៃដើមវិញ' : 'Complete discount and restore original price'}
 >
 <FiCheckCircle size={12} />
 <span>{isKhmer ? 'បញ្ចប់ការបញ្ចុះ' : 'Complete'}</span>
 </button>

 <button
 type="button"
 onClick={() => handleRemoveProductDiscount(p)}
 style={{
 padding: '7px 10px', borderRadius: 8,
 background: 'rgba(239,68,68,0.08)', color: '#EF4444',
 border: '1px solid rgba(239,68,68,0.2)', fontWeight: 700, fontSize: '0.78rem',
 cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
 }}
 title={isKhmer ? 'លុបការបញ្ចុះតម្លៃ' : 'Remove Discount'}
 >
 <FiTrash2 size={12} />
 <span>{isKhmer ? 'លុប' : 'Remove'}</span>
 </button>
 </div>
 </div>
 );
 })}
 </div>
 )}

 {/*  COMPLETED DISCOUNT HISTORY SECTION  */}
 <div style={{ marginTop: 36, paddingTop: 24, borderTop: '1px solid var(--admin-card-border)' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
 <div style={{
 width: 36, height: 36, borderRadius: 10,
 background: 'rgba(99,102,241,0.12)', color: '#4F46E5',
 display: 'flex', alignItems: 'center', justifyContent: 'center'
 }}>
 <FiClock size={18} />
 </div>
 <div>
 <h4 style={{ margin: 0, fontWeight: 800, color: 'var(--admin-text)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
 {isKhmer ? 'ប្រវត្តិការបញ្ចុះតម្លៃដែលបានបញ្ចប់' : 'Completed Discount History'}
 <span style={{
 background: '#EEF2FF', color: '#4F46E5', fontSize: '0.72rem',
 fontWeight: 900, padding: '2px 8px', borderRadius: 999
 }}>
 {discountHistory.length}
 </span>
 </h4>
 <span style={{ fontSize: '0.76rem', color: 'var(--admin-text-secondary)' }}>
 {isKhmer ? 'កត់ត្រារាល់មុខទំនិញដែលបានបញ្ចប់ប្រូម៉ូសិន និងអាចដាក់បញ្ចុះម្ដងទៀតបានភ្លាមៗ' : 'Review ended discount campaigns & re-activate them anytime'}
 </span>
 </div>
 </div>

 {discountHistory.length > 0 && (
 <button
 type="button"
 onClick={handleClearAllHistory}
 style={{
 background: 'none', border: '1px solid var(--admin-card-border)',
 color: 'var(--admin-text-secondary)', borderRadius: 8,
 padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700,
 cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
 }}
 >
 <FiTrash2 size={12} />
 <span>{isKhmer ? 'សម្អាតប្រវត្តិទាំងអស់' : 'Clear All'}</span>
 </button>
 )}
 </div>

 {discountHistory.length === 0 ? (
 <div style={{
 textAlign: 'center', padding: '36px 20px',
 color: 'var(--admin-text-secondary)',
 background: 'var(--admin-card-bg)',
 borderRadius: 16,
 border: '1px dashed var(--admin-card-border)'
 }}>
 <FiClock size={28} style={{ opacity: 0.4, marginBottom: 8 }} />
 <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
 {isKhmer ? 'មិនទាន់មានប្រវត្តិបញ្ចុះតម្លៃដែលបានបញ្ចប់នៅឡើយទេ' : 'No completed discount history yet'}
 </div>
 <div style={{ fontSize: '0.78rem', marginTop: 4 }}>
 {isKhmer ? 'នៅពេលអ្នកបញ្ចប់ការបញ្ចុះតម្លៃមុខទំនិញ វានឹងបង្ហាញនៅត្រង់នេះ!' : 'When you complete or end a promotional sale, it will appear here!'}
 </div>
 </div>
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
 {discountHistory.map(item => {
 const dateStr = item.completedAt ? new Date(item.completedAt).toLocaleString('km-KH', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A';
 return (
 <div
 key={item.id}
 style={{
 background: 'var(--admin-card-bg)',
 borderRadius: 14,
 border: '1px solid var(--admin-card-border)',
 padding: '14px 18px',
 display: 'flex',
 flexWrap: 'wrap',
 alignItems: 'center',
 justifyContent: 'space-between',
 gap: 14,
 boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
 }}
 >
 <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 200 }}>
 {item.imageUrl ? (
 <img src={item.imageUrl} alt="" style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'cover' }} />
 ) : (
 <div style={{ width: 42, height: 42, borderRadius: 8, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontWeight: 800 }}>
 {(item.productName || '?')[0]}
 </div>
 )}
 <div>
 <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--admin-text)' }}>
 {item.productName}
 </div>
 <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
 <span>ID: #{item.productId}</span>
 <span>•</span>
 <span>{dateStr}</span>
 </div>
 </div>
 </div>

 {/* Promo Badge & Price */}
 <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
 {item.productLabel && item.productLabel !== 'NONE' && (
 <span style={{
 background: 'linear-gradient(135deg, #EC4899, #BE185D)',
 color: '#fff', padding: '3px 8px', borderRadius: 6,
 fontSize: '0.72rem', fontWeight: 900
 }}>
 {item.productLabel}
 </span>
 )}

 <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
 <span style={{ fontSize: '0.98rem', fontWeight: 900, color: '#DB2777' }}>
 ${Number(item.salePrice || 0).toFixed(2)}
 </span>
 <span style={{ fontSize: '0.78rem', color: '#94A3B8', textDecoration: 'line-through' }}>
 ${Number(item.originalPrice || 0).toFixed(2)}
 </span>
 {item.discountPercent > 0 && (
 <span style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', padding: '2px 5px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 800 }}>
 -{item.discountPercent}%
 </span>
 )}
 </div>

 <span style={{
 background: item.status === 'COMPLETED' ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)',
 color: item.status === 'COMPLETED' ? '#059669' : '#64748B',
 padding: '3px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4
 }}>
 {item.status === 'COMPLETED' ? (isKhmer ? ' បានបញ្ចប់' : ' Completed') : (isKhmer ? 'បានលុប' : 'Removed')}
 </span>
 </div>

 {/* Action Buttons */}
 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
 <button
 type="button"
 onClick={() => handleReapplyDiscount(item)}
 style={{
 padding: '6px 12px', borderRadius: 8,
 background: 'rgba(99,102,241,0.1)', color: '#4F46E5',
 border: 'none', fontWeight: 800, fontSize: '0.76rem',
 cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
 }}
 title={isKhmer ? 'ដាក់បញ្ចុះតម្លៃម្ដងទៀត' : 'Re-apply discount'}
 >
 <FiRefreshCw size={12} />
 <span>{isKhmer ? 'ដាក់បញ្ចុះម្ដងទៀត' : 'Re-apply'}</span>
 </button>

 <button
 type="button"
 onClick={() => handleDeleteHistoryItem(item.id)}
 style={{
 padding: '6px 8px', borderRadius: 8,
 background: 'transparent', color: 'var(--admin-text-secondary)',
 border: '1px solid var(--admin-card-border)', fontSize: '0.76rem',
 cursor: 'pointer', display: 'flex', alignItems: 'center'
 }}
 title={isKhmer ? 'លុបចេញពីប្រវត្តិ' : 'Delete item'}
 >
 <FiTrash2 size={12} />
 </button>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 )}

 {/*  STORE PROFILE TAB  */}
 {tab === 'store' && (
 <div>
 <div style={{ background: 'var(--admin-card-bg)', borderRadius: 16, border: '1px solid var(--admin-card-border)', padding: 24, marginBottom: 20 }}>
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
 <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--admin-text)' }}>{isKhmer ? 'ព័ត៌មានហាង & ការកំណត់' : 'Store Profile & Settings'}</h3>
 <button className="admin-btn admin-btn-secondary" onClick={() => { setProfileForm({ storeName: profile?.storeName || '', storeDescription: profile?.storeDescription || '', storeLogoUrl: profile?.storeLogoUrl || '' }); setEditingProfile(true); }} style={{ fontSize: '0.85rem', gap: 6, display: 'flex', alignItems: 'center' }}>
 <FiEdit2 size={14} /> {isKhmer ? 'កែប្រែព័ត៌មានហាង' : 'Edit Store Info'}
 </button>
 </div>
 {editingProfile ? (
 <div>
 <div style={{ marginBottom: 12 }}>
 <label style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)', fontWeight: 700, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
 {isKhmer ? 'ឈ្មោះហាង' : 'STORE NAME'}
 {isStoreNameLocked && <span style={{ color: '#EF4444', fontWeight: 800, marginLeft: 8 }}>{isKhmer ? 'ចាក់សោ' : 'Locked'}</span>}
 </label>
 <input className="admin-input" placeholder={isKhmer ? 'ឈ្មោះហាង' : 'Store Name'} value={profileForm.storeName} disabled={isStoreNameLocked} onChange={e => setProfileForm(f => ({ ...f, storeName: e.target.value }))} style={{ opacity: isStoreNameLocked ? 0.7 : 1 }} />
 {isStoreNameLocked && <div style={{ fontSize: '0.78rem', color: '#EF4444', marginTop: 4 }}>{isKhmer ? `អាចកែបាននៅ: ${nextAllowedDate} (រង់ចាំ ${daysRemaining} ថ្ងៃ)` : `Editable again: ${nextAllowedDate} (${daysRemaining} days)`}</div>}
 </div>
 <div style={{ marginBottom: 12 }}>
 <label style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)', fontWeight: 700, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>{isKhmer ? 'ការពិពណ៌នា' : 'DESCRIPTION'}</label>
 <textarea className="admin-input" placeholder={isKhmer ? 'ព័ត៌មានលម្អិតអំពីហាង...' : 'Store description...'} value={profileForm.storeDescription} onChange={e => setProfileForm(f => ({ ...f, storeDescription: e.target.value }))} rows={3} style={{ resize: 'vertical' }} />
 </div>
 <div style={{ marginBottom: 16 }}>
 <label style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)', fontWeight: 700, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>{isKhmer ? 'ឡូហ្គោហាង' : 'STORE LOGO'}</label>
 <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
 <input className="admin-input" placeholder={isKhmer ? 'តំណភ្ជាប់រូបភាពឡូហ្គោ' : 'Logo image URL'} value={profileForm.storeLogoUrl} onChange={e => setProfileForm(f => ({ ...f, storeLogoUrl: e.target.value }))} style={{ flex: 1 }} />
 <label className="admin-btn admin-btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.82rem', padding: '10px 14px' }}>
 <FiUpload size={14} /> {uploadingLogo ? (isKhmer ? 'កំពុងបញ្ចូល...' : 'Uploading...') : (isKhmer ? 'ជ្រើសរើស' : 'Upload')}
 <input type="file" accept="image/*" onChange={handleLogoFileUpload} hidden disabled={uploadingLogo} />
 </label>
 </div>
 </div>
 <div style={{ display: 'flex', gap: 10 }}>
 <button className="admin-btn admin-btn-primary" onClick={handleSaveProfile}><FiCheck size={14} /> {isKhmer ? 'រក្សាទុក' : 'Save'}</button>
 <button className="admin-btn admin-btn-secondary" onClick={() => setEditingProfile(false)}><FiX size={14} /> {isKhmer ? 'បោះបង់' : 'Cancel'}</button>
 </div>
 </div>
 ) : (
 <div>
 <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--admin-text)', marginBottom: 6 }}>{profile?.storeName}</div>
 <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>{profile?.storeDescription || (isKhmer ? 'មិនទាន់មានការពិពណ៌នាឡើយ' : 'No description yet.')}</p>
 {profile?.storeLogoUrl && <img src={profile.storeLogoUrl} alt="Logo" style={{ marginTop: 12, width: 80, height: 80, borderRadius: 12, objectFit: 'cover', border: '2px solid var(--admin-card-border)' }} />}
 </div>
 )}
 </div>

 {/* Subscription Info */}
 <div style={{ background: 'var(--admin-card-bg)', borderRadius: 16, border: '1px solid var(--admin-card-border)', padding: 24 }}>
 <h4 style={{ margin: '0 0 12px', fontWeight: 700, color: 'var(--admin-text)' }}>{isKhmer ? 'ការជាវ & គម្រោង' : 'Subscription & Plan'}</h4>
 <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
 <div style={{ flex: 1, minWidth: 160 }}>
 <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{isKhmer ? 'គម្រោង' : 'Plan'}</div>
 <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--admin-text)' }}>{profile?.subscriptionPlan === 'PLAN_3' ? 'VIP ($6/mo)' : profile?.subscriptionPlan === 'PLAN_2' ? 'Pro ($4.50/mo)' : 'Basic (Free)'}</div>
 </div>
 <div style={{ flex: 1, minWidth: 160 }}>
 <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{isKhmer ? 'ស្ថានភាព' : 'Status'}</div>
 <StatusBadge status={profile?.subscriptionStatus || 'ACTIVE'} />
 </div>
 <div style={{ flex: 1, minWidth: 160 }}>
 <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{isKhmer ? 'ថ្ងៃនៅសល់' : 'Days Left'}</div>
 <div style={{ fontWeight: 800, fontSize: '1rem', color: profile?.remainingDays <= 7 ? '#EF4444' : '#10B981' }}>{profile?.remainingDays ?? '—'} {isKhmer ? 'ថ្ងៃ' : 'days'}</div>
 </div>
 </div>
 <button onClick={() => setShowSubscriptionModal(true)} className="admin-btn admin-btn-primary" style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
 <FiChevronRight size={15} /> {isKhmer ? 'ដំឡើង / បន្ត គម្រោង' : 'Upgrade / Renew Plan'}
 </button>
 </div>
 </div>
 )}

 {/*  SETTINGS TAB  */}
 {tab === 'settings' && (
 <div style={{ display: 'grid', gap: 20 }}>
 {/* Quick Actions & Controls Hub (មួយដុំ) */}
 <div style={{ background: 'var(--admin-card-bg)', borderRadius: 20, border: '1px solid var(--admin-card-border)', padding: 24 }}>
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
 <div>
 <h3 style={{ margin: 0, fontWeight: 800, color: 'var(--admin-text)', fontSize: '1.15rem' }}>
 {isKhmer ? 'ផ្ទាំងគ្រប់គ្រង និងឧបករណ៍រហ័ស' : 'Seller Quick Control Center'}
 </h3>
 <p style={{ fontSize: '0.84rem', color: 'var(--admin-text-secondary)', margin: '4px 0 0' }}>
 {isKhmer ? 'គ្រប់គ្រងសមតុល្យប្រាក់ កញ្ចប់ហាង គោលការណ៍ប្តូរទំនិញ និងជំនួយ Admin' : 'Manage your earnings balance, subscription plan, replacement warranty, and support.'}
 </p>
 </div>
 </div>

 {/* Action Grid */}
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
 {/* 1. Earnings & Withdraw */}
 <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 16, padding: '16px' }}>
 <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
 {isKhmer ? 'ប្រាក់ចំណូលក្នុងគណនី' : 'Available Balance'}
 </div>
 <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981', marginBottom: 10 }}>
 ${balance.toFixed(2)}
 </div>
 <button
 type="button"
 onClick={() => setShowWithdrawModal(true)}
 style={{
 width: '100%', padding: '8px 12px', borderRadius: 10,
 background: '#10B981', color: '#fff', border: 'none',
 fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
 display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
 boxShadow: '0 2px 8px rgba(16,185,129,0.25)'
 }}
 >
 <FiDollarSign size={14} /> {isKhmer ? 'ដកប្រាក់ចំណូល' : 'Withdraw Earnings'}
 </button>
 </div>

 {/* 2. Subscription Plan */}
 <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 16, padding: '16px' }}>
 <div style={{ fontSize: '0.75rem', color: '#4F46E5', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
 {isKhmer ? 'កញ្ចប់សមាជិកភាព' : 'Current Plan'}
 </div>
 <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#4F46E5', marginBottom: 10 }}>
 {profile?.subscriptionPlan === 'PLAN_3' ? 'VIP ($6/mo)' : profile?.subscriptionPlan === 'PLAN_2' ? 'Pro ($4.50/mo)' : 'Basic (Free)'}
 </div>
 <button
 type="button"
 onClick={() => setShowSubscriptionModal(true)}
 style={{
 width: '100%', padding: '8px 12px', borderRadius: 10,
 background: '#6366F1', color: '#fff', border: 'none',
 fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
 display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
 boxShadow: '0 2px 8px rgba(99,102,241,0.25)'
 }}
 >
 <FiCheck size={14} /> {isKhmer ? 'ដំឡើង / បន្តកញ្ចប់' : 'Upgrade / Renew Plan'}
 </button>
 </div>

 {/* 3. Replace Policy Guide */}
 <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 16, padding: '16px' }}>
 <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
 {isKhmer ? 'គោលការណ៍អ្នកលក់' : 'Seller Warranty'}
 </div>
 <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A', marginBottom: 10 }}>
 {isKhmer ? 'ការធានាប្តូរទំនិញ' : 'Replacement Policy'}
 </div>
 <button
 type="button"
 onClick={() => setIsPolicyWalkthroughOpen(true)}
 style={{
 width: '100%', padding: '8px 12px', borderRadius: 10,
 background: '#FFFFFF', color: '#059669', border: '1px solid #10B981',
 fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
 display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
 }}
 >
 <FiRefreshCw size={14} /> {isKhmer ? 'មើលគោលការណ៍' : 'View Policy Guide'}
 </button>
 </div>

 {/* 4. Support & Mode Switch */}
 <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 16, padding: '16px' }}>
 <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
 {isKhmer ? 'ជំនួយ និងប្តូរទម្រង់' : 'Help & Mode'}
 </div>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
 <button
 type="button"
 onClick={() => setShowContactAdminModal(true)}
 style={{
 padding: '8px 6px', borderRadius: 10,
 background: 'linear-gradient(135deg, #0088cc 0%, #2AABEE 100%)',
 color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.75rem',
 cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
 }}
 >
 <FaTelegram size={13} /> {isKhmer ? 'Admin' : 'Support'}
 </button>
 <button
 type="button"
 onClick={() => setIsSwitchModalOpen(true)}
 style={{
 padding: '8px 6px', borderRadius: 10,
 background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE',
 fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer',
 display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
 }}
 >
 <FiUser size={13} /> {isKhmer ? 'អ្នកទិញ' : 'Buyer Mode'}
 </button>
 </div>
 </div>
 </div>
 </div>

 {/* Telegram Notification Bot Integration Card */}
 <div style={{
   background: 'var(--admin-card-bg)',
   borderRadius: 20,
   border: '1px solid var(--admin-card-border)',
   padding: 24
 }}>
   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
     <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
       <div style={{
         width: 40, height: 40, borderRadius: 12,
         background: 'linear-gradient(135deg, #0088cc 0%, #29b6f6 100%)',
         display: 'flex', alignItems: 'center', justifyContent: 'center',
         color: '#fff', boxShadow: '0 4px 12px rgba(0, 136, 204, 0.3)'
       }}>
         <FaTelegram size={22} />
       </div>
       <div>
         <h3 style={{ margin: 0, fontWeight: 800, color: 'var(--admin-text)', fontSize: '1.05rem' }}>
           {isKhmer ? 'Telegram Bot សម្រាប់ការជូនដំណឹងការបញ្ជាទិញ' : 'Telegram Order Notification Bot'}
         </h3>
         <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-secondary)' }}>
           Bot: @sabyshop_notication_bot
         </span>
       </div>
     </div>

     <span style={{
       padding: '4px 12px', borderRadius: 20, fontSize: '0.76rem', fontWeight: 800,
       background: Boolean(profile?.telegramConnected || profile?.telegramChatId) ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
       color: Boolean(profile?.telegramConnected || profile?.telegramChatId) ? '#10B981' : '#D97706',
       border: `1px solid ${Boolean(profile?.telegramConnected || profile?.telegramChatId) ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`
     }}>
       {Boolean(profile?.telegramConnected || profile?.telegramChatId)
         ? (isKhmer ? '[CONNECTED] បានតភ្ជាប់' : '[CONNECTED] Active')
         : (isKhmer ? '[NOT CONNECTED] មិនទាន់តភ្ជាប់' : '[NOT CONNECTED] Not Linked')}
     </span>
   </div>

   <p style={{ fontSize: '0.84rem', color: 'var(--admin-text-secondary)', margin: '0 0 16px', lineHeight: 1.5 }}>
     {isKhmer
       ? 'ទទួលបានការជូនដំណឹងភ្លាមៗតាម Telegram នៅពេលមានអតិថិជនទិញទំនិញពីហាងរបស់អ្នក (ឈ្មោះអតិថិជន, ផលិតផល, តម្លៃ, រយៈពេល, និងបរិមាណ)។'
       : 'Get instant real-time alerts on Telegram whenever customers place orders for your products with complete details (Customer Name, Product, Price, Duration, Quantity).'}
   </p>

   <div style={{
     background: 'var(--admin-input-bg, #F8FAFC)',
     border: '1px solid var(--admin-card-border)',
     borderRadius: 14,
     padding: '12px 16px',
     marginBottom: 16,
     display: 'grid',
     gap: 8,
     fontSize: '0.84rem'
   }}>
     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
       <span style={{ color: 'var(--admin-text-secondary)', fontWeight: 600 }}>{isKhmer ? 'លេខសម្គាល់ហាង (Store ID):' : 'Store ID:'}</span>
       <span style={{ fontWeight: 900, color: '#0088cc' }}>#{profile?.id || user?.id}</span>
     </div>
     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
       <span style={{ color: 'var(--admin-text-secondary)', fontWeight: 600 }}>{isKhmer ? 'អ៊ីមែលគណនី (Email):' : 'Email:'}</span>
       <span style={{ fontWeight: 800, color: 'var(--admin-text)' }}>{profile?.email || user?.email}</span>
     </div>
   </div>

   <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
     <button
       type="button"
       onClick={() => setShowTelegramBotModal(true)}
       className="admin-btn admin-btn-primary"
       style={{
         padding: '10px 18px', fontSize: '0.85rem', fontWeight: 800,
         display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 12
       }}
     >
       <FaTelegram size={16} />
       <span>{isKhmer ? 'តភ្ជាប់ / មើលព័ត៌មាន Bot' : 'Connect / View Bot Setup'}</span>
     </button>

     <a
       href="https://t.me/sabyshop_notication_bot"
       target="_blank"
       rel="noreferrer"
       className="admin-btn admin-btn-secondary"
       style={{
         padding: '10px 18px', fontSize: '0.85rem', fontWeight: 800,
         display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 12,
         textDecoration: 'none'
       }}
     >
       <FiExternalLink size={14} />
       <span>{isKhmer ? 'បើក Telegram Bot' : 'Open Telegram Bot'}</span>
     </a>
   </div>
 </div>

 {/* Language Card */}
 <div style={{ background: 'var(--admin-card-bg)', borderRadius: 20, border: '1px solid var(--admin-card-border)', padding: 24 }}>
 <h3 style={{ margin: '0 0 8px', fontWeight: 800, color: 'var(--admin-text)' }}>{isKhmer ? 'ការកំណត់ភាសា' : 'Language Settings'}</h3>
 <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', margin: '0 0 16px', lineHeight: 1.5 }}>
 {isKhmer ? 'ជ្រើសរើសភាសាដែលអ្នកចង់ប្រើប្រាស់ក្នុងផ្ទាំងគ្រប់គ្រងអ្នកលក់។' : 'Choose your preferred language for the Seller Portal.'}
 </p>
 <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
 {[
 { code: 'km', label: isKhmer ? 'ភាសាខ្មែរ (លំនាំដើម)' : 'Khmer (Default)' },
 { code: 'en', label: 'English (EN)' }
 ].map(l => (
 <button
 key={l.code}
 type="button"
 onClick={() => setLang(l.code)}
 style={{
 padding: '14px 22px',
 borderRadius: 14,
 border: lang === l.code ? '2px solid #10B981' : '1px solid #CBD5E1',
 background: lang === l.code ? '#ECFDF5' : '#FFFFFF',
 color: lang === l.code ? '#065F46' : '#334155',
 fontWeight: lang === l.code ? 800 : 600,
 fontSize: '0.9rem',
 cursor: 'pointer',
 display: 'inline-flex',
 alignItems: 'center',
 gap: 8,
 boxShadow: lang === l.code ? '0 4px 12px rgba(16,185,129,0.15)' : 'none',
 transition: 'all 0.15s ease'
 }}
 >
 <FiGlobe size={18} color={lang === l.code ? '#10B981' : '#64748B'} />
 <span>{l.label}</span>
 {lang === l.code && (
 <span style={{
 background: '#10B981', color: '#fff', borderRadius: '50%',
 width: 18, height: 18, display: 'inline-flex', alignItems: 'center',
 justifyContent: 'center', fontSize: '0.72rem', fontWeight: 900
 }}>
 
 </span>
 )}
 </button>
 ))}
 </div>
 </div>

 {/* Account Info Card */}
 <div style={{ background: 'var(--admin-card-bg)', borderRadius: 20, border: '1px solid var(--admin-card-border)', padding: 24 }}>
 <h3 style={{ margin: '0 0 16px', fontWeight: 800, color: 'var(--admin-text)' }}>{isKhmer ? 'ព័ត៌មានគណនី' : 'Account Info'}</h3>
 <div style={{ display: 'grid', gap: 10 }}>
 {[
 { label: isKhmer ? 'អ៊ីមែល' : 'Email', value: user?.email || '—' },
 { label: isKhmer ? 'តួនាទី' : 'Role', value: user?.role || '—' },
 { label: isKhmer ? 'លេខសម្គាល់' : 'User ID', value: `#${user?.id || '—'}` },
 ].map(row => (
 <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--admin-card-border)', fontSize: '0.88rem' }}>
 <span style={{ color: 'var(--admin-text-secondary)', fontWeight: 600 }}>{row.label}</span>
 <span style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{row.value}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 </div>
 </div>

 {/*  VIEW ORDERED PRODUCT MODAL (មើល Product)  */}
 {selectedOrderForView && (
 <div
 onClick={() => setSelectedOrderForView(null)}
 style={{
 position: 'fixed', inset: 0,
 background: 'rgba(15, 23, 42, 0.65)',
 backdropFilter: 'blur(4px)',
 zIndex: 9999,
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 padding: 16, overflowY: 'auto'
 }}
 >
 <div
 className="modal animate-slide-up"
 style={{
 maxWidth: 580, width: '100%',
 background: 'var(--admin-card-bg, #FFFFFF)',
 borderRadius: 22,
 padding: 24,
 boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
 border: '1px solid var(--admin-card-border, #E2E8F0)',
 maxHeight: '90vh',
 overflowY: 'auto'
 }}
 onClick={e => e.stopPropagation()}
 >
 {/* Header */}
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
 <div style={{
 width: 40, height: 40, borderRadius: 12,
 background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
 color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
 boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
 }}>
 <FiPackage size={20} />
 </div>
 <div>
 <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: 'var(--admin-text)' }}>
 {isKhmer ? 'ព័ត៌មានទំនិញបញ្ជាទិញ' : 'Ordered Product Details'}
 </h3>
 <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)' }}>
 Order #{selectedOrderForView.id} · {new Date(selectedOrderForView.createdAt || Date.now()).toLocaleDateString()}
 </span>
 </div>
 </div>

 <button
 onClick={() => setSelectedOrderForView(null)}
 style={{
 background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%',
 width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
 cursor: 'pointer', color: 'var(--admin-text-secondary)'
 }}
 >
 <FiX size={18} />
 </button>
 </div>

 {/* Product Card Box */}
 {(() => {
 const item = selectedOrderForView.items?.[0] || selectedOrderForView.product;
 const matchedProd = item?.productId ? products.find(p => p.id === item.productId) : null;
 const pName = item?.productName || item?.name || matchedProd?.name || (isKhmer ? 'ទំនិញឌីជីថល' : 'Digital Product');
 const pImg = item?.imageUrl || matchedProd?.imageUrl;
 const pPrice = item?.price || selectedOrderForView.price || selectedOrderForView.totalAmount || 0;
 const pQty = item?.quantity || 1;

 return (
 <div style={{
 background: 'var(--bg-secondary, #F8FAFC)',
 borderRadius: 16,
 border: '1px solid var(--admin-card-border)',
 padding: 16,
 marginBottom: 18,
 display: 'flex',
 gap: 14,
 alignItems: 'center'
 }}>
 <div style={{
 width: 64, height: 64, borderRadius: 12,
 background: pImg ? `url(${pImg}) center/cover` : 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
 border: '1px solid #CBD5E1',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 flexShrink: 0, color: '#4F46E5'
 }}>
 {!pImg && <FiPackage size={28} />}
 </div>

 <div style={{ flex: 1, minWidth: 0 }}>
 <h4 style={{ margin: '0 0 4px', fontWeight: 900, color: 'var(--admin-text)', fontSize: '1rem' }}>
 {pName}
 </h4>
 <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', fontSize: '0.82rem' }}>
 <span style={{ color: '#10B981', fontWeight: 800 }}>${Number(pPrice).toFixed(2)}</span>
 <span style={{ color: 'var(--admin-text-secondary)' }}>Qty: {pQty}</span>
 {matchedProd?.duration && (
 <span style={{ background: 'rgba(236,72,153,0.1)', color: '#DB2777', padding: '1px 6px', borderRadius: 6, fontWeight: 700, fontSize: '0.72rem' }}>
 {matchedProd.duration}
 </span>
 )}
 </div>
 </div>
 </div>
 );
 })()}

 {/* Buyer & Delivery Info */}
 <div style={{ background: 'var(--admin-card-bg)', borderRadius: 16, border: '1px solid var(--admin-card-border)', padding: '16px', marginBottom: 18 }}>
 <div style={{ display: 'grid', gap: 10, fontSize: '0.85rem' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--admin-card-border)' }}>
 <span style={{ color: 'var(--admin-text-secondary)', fontWeight: 600 }}>{isKhmer ? 'អតិថិជន:' : 'Buyer:'}</span>
 <span style={{ fontWeight: 800, color: 'var(--admin-text)' }}>{getBuyerFullDisplay(selectedOrderForView)}</span>
 </div>
 <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--admin-card-border)' }}>
 <span style={{ color: 'var(--admin-text-secondary)', fontWeight: 600 }}>{isKhmer ? 'ស្ថានភាពបច្ចុប្បន្ន:' : 'Status:'}</span>
 <StatusBadge status={selectedOrderForView.status} isKhmer={isKhmer} />
 </div>
 <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--admin-card-border)' }}>
 <span style={{ color: 'var(--admin-text-secondary)', fontWeight: 600 }}>{isKhmer ? 'ចំនួនទឹកប្រាក់សរុប:' : 'Total Amount:'}</span>
 <span style={{ fontWeight: 900, color: '#10B981', fontSize: '1rem' }}>${Number(selectedOrderForView.totalAmount || selectedOrderForView.price || 0).toFixed(2)}</span>
 </div>

 {/* Delivered credentials if present */}
 {(selectedOrderForView.manualAccountEmail || selectedOrderForView.items?.[0]?.account?.email) && (
 <div style={{ background: 'var(--bg-secondary, #F8FAFC)', borderRadius: 10, padding: '10px 12px', marginTop: 4 }}>
 <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#4F46E5', marginBottom: 4, textTransform: 'uppercase' }}>
 {isKhmer ? 'ព័ត៌មានគណនីបានប្រគល់' : 'Delivered Credentials'}
 </div>
 <div style={{ fontSize: '0.82rem', color: 'var(--admin-text)' }}>
 <strong>Email/User:</strong> {selectedOrderForView.manualAccountEmail || selectedOrderForView.items?.[0]?.account?.email}
 </div>
 {(selectedOrderForView.manualAccountPassword || selectedOrderForView.items?.[0]?.account?.password) && (
 <div style={{ fontSize: '0.82rem', color: 'var(--admin-text)', marginTop: 2 }}>
 <strong>Pass/PIN:</strong> {selectedOrderForView.manualAccountPassword || selectedOrderForView.items?.[0]?.account?.password}
 </div>
 )}
 </div>
 )}

 {/* Seller Proof Screenshot if uploaded */}
 {Boolean(extractDeliveryProofUrl(selectedOrderForView)) && (
 <div style={{ background: 'var(--bg-secondary, #F8FAFC)', borderRadius: 10, padding: '10px 12px', marginTop: 4 }}>
 <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#10B981', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
 <FiShield size={14} />
 <span>{isKhmer ? 'រូបភាពភស្តុតាងនៃការប្រគល់' : 'Proof of Delivery'}</span>
 </div>
 <div
 style={{ width: 120, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid #CBD5E1', cursor: 'pointer' }}
 onClick={() => setZoomProofImage(extractDeliveryProofUrl(selectedOrderForView))}
 >
 <img
 src={extractDeliveryProofUrl(selectedOrderForView)}
 alt="Proof"
 style={{ width: '100%', height: '100%', objectFit: 'cover' }}
 onError={(e) => {
   e.target.onerror = null;
   if (!e.target.src.includes('/api/admin/uploads/')) {
     const fname = e.target.src.split('/').pop();
     e.target.src = `/api/admin/uploads/${fname}`;
   } else {
     e.target.style.display = 'none';
   }
 }}
 />
 </div>
 </div>
 )}
 </div>
 </div>

 {/* Order Payment & Delivery Status Card */}
        {selectedOrderForView.status === 'PENDING' && (
          <div style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1.5px solid rgba(245,158,11,0.3)',
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 20,
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#D97706', fontWeight: 800, fontSize: '0.9rem', marginBottom: 4 }}>
              <FiClock size={16} />
              <span>{isKhmer ? 'ស្ថានភាពការទូទាត់: មិនទាន់បានទូទាត់ (PENDING)' : 'Payment Status: Unpaid (PENDING)'}</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--admin-text-secondary)', lineHeight: 1.5 }}>
              {isKhmer
                ? 'អតិថិជនមិនទាន់បានទូទាត់ប្រាក់នៅឡើយទេ។ ប្រព័ន្ធនឹងផ្លាស់ប្ដូរស្ថានភាពទៅ "ដំណើរការ" (PROCESSING) ដោយស្វ័យប្រវត្តិ នៅពេលអតិថិជនទូទាត់ប្រាក់ជោគជ័យតាម KHQR/Bakong ដើម្បីឱ្យអ្នកប្រគល់ទំនិញ។'
                : 'Customer has not completed payment yet. The system will automatically advance to "Processing" once paid via KHQR/Bakong so you can deliver.'}
            </p>
          </div>
        )}

        {(selectedOrderForView.status === 'PROCESSING' || selectedOrderForView.status === 'WAITING_FOR_STOCK') && (
          <div style={{
            background: 'rgba(16,185,129,0.08)',
            border: '1.5px solid rgba(16,185,129,0.3)',
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 20,
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#059669', fontWeight: 800, fontSize: '0.9rem', marginBottom: 4 }}>
                <FiCheckCircle size={16} />
                <span>{isKhmer ? 'អតិថិជនបានទូទាត់រួចរាល់ (PROCESSING)' : 'Payment Completed (PROCESSING)'}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--admin-text-secondary)', lineHeight: 1.5 }}>
                {isKhmer
                  ? 'ការទូទាត់បានផ្ទៀងផ្ទាត់ជោគជ័យ។ សូមចុចប្រគល់ទំនិញជូនអតិថិជន!'
                  : 'Payment is confirmed. Please deliver the digital account/credentials to the buyer!'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const target = selectedOrderForView;
                setSelectedOrderForView(null);
                handleOpenDeliverModal(target);
              }}
              style={{
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#fff', border: 'none', borderRadius: 10,
                padding: '9px 16px', fontSize: '0.84rem', fontWeight: 800,
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                boxShadow: '0 4px 14px rgba(16,185,129,0.35)'
              }}
            >
              <FiSend size={14} /> {isKhmer ? 'ប្រគល់ទំនិញជូនអតិថិជន' : 'Deliver to Buyer'}
            </button>
          </div>
        )}

        {selectedOrderForView.status === 'DELIVERED' && (
          <div style={{
            background: 'rgba(59,130,246,0.08)',
            border: '1.5px solid rgba(59,130,246,0.25)',
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 20,
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2563EB', fontWeight: 800, fontSize: '0.9rem', marginBottom: 4 }}>
                <FiCheckCircle size={16} />
                <span>{isKhmer ? 'ការបញ្ជាទិញបានប្រគល់រួចរាល់' : 'Order Delivered'}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--admin-text-secondary)', lineHeight: 1.5 }}>
                {isKhmer
                  ? 'ទិន្នន័យគណនី/ទំនិញត្រូវបានបញ្ជូនជូនអតិថិជនរួចរាល់។'
                  : 'Digital credentials / delivery proof have been dispatched to the customer.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const target = selectedOrderForView;
                setSelectedOrderForView(null);
                handleOpenDeliverModal(target);
              }}
              style={{
                background: 'rgba(59,130,246,0.12)',
                color: '#2563EB', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 10,
                padding: '8px 14px', fontSize: '0.82rem', fontWeight: 800,
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5
              }}
            >
              <FiShield size={14} /> {isKhmer ? 'កែប្រែភស្តុតាងប្រគល់' : 'Edit Delivery Proof'}
            </button>
          </div>
        )}

        {selectedOrderForView.status === 'COMPLETED' && (
          <div style={{
            background: 'rgba(16,185,129,0.08)',
            border: '1.5px solid rgba(16,185,129,0.25)',
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 20,
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#059669', fontWeight: 800, fontSize: '0.9rem', marginBottom: 4 }}>
              <FiCheckCircle size={16} />
              <span>{isKhmer ? 'ការបញ្ជាទិញបានបញ្ចប់ជោគជ័យ' : 'Order Completed'}</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--admin-text-secondary)', lineHeight: 1.5 }}>
              {isKhmer
                ? 'ការបញ្ជាទិញនេះត្រូវបានបញ្ចប់ជោគជ័យ។ ទឹកប្រាក់ត្រូវបានបញ្ចូលទៅក្នុងសមតុល្យហាងរបស់អ្នករួចរាល់ (មិនអនុញ្ញាតឱ្យកែប្រែភស្តុតាងទៀតឡើយ)។'
                : 'This order has been completed successfully and funds credited to your seller wallet. Delivery proof cannot be modified.'}
            </p>
          </div>
        )}

        {selectedOrderForView.status === 'CANCELLED' && (
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1.5px solid rgba(239,68,68,0.25)',
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 20,
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#EF4444', fontWeight: 800, fontSize: '0.9rem', marginBottom: 4 }}>
              <FiAlertTriangle size={16} />
              <span>{isKhmer ? 'ការបញ្ជាទិញត្រូវបានបោះបង់' : 'Order Cancelled'}</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--admin-text-secondary)', lineHeight: 1.5 }}>
              {isKhmer
                ? 'ការបញ្ជាទិញនេះត្រូវបានបោះបង់ចោល។ មិនចាំបាច់ប្រគល់ទំនិញទេ។'
                : 'This order was cancelled. No delivery required.'}
            </p>
          </div>
        )}
        
        {/* Actions */}
 <div style={{ display: 'flex', gap: 10 }}>
 <button
 type="button"
 className="admin-btn admin-btn-secondary"
 onClick={() => setSelectedOrderForView(null)}
 style={{ flex: 1, padding: '11px', borderRadius: 12, fontWeight: 700 }}
 >
 {isKhmer ? 'បិទ' : 'Close'}
 </button>
 <Link
 to={`/chat/seller-customers?order=${selectedOrderForView.id}`}
 onClick={() => setSelectedOrderForView(null)}
 className="admin-btn"
 style={{
 flex: 2, padding: '11px', borderRadius: 12, fontWeight: 800,
 background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff',
 display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
 textDecoration: 'none', boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
 }}
 >
 <FiMessageSquare size={16} /> {isKhmer ? 'ផ្ញើសារទៅអតិថិជន' : 'Chat with Buyer'}
 </Link>
 </div>
 </div>
 </div>
 )}

 {/*  SELLER DELIVER ORDER MODAL WITH PROOF UPLOAD  */}
 {deliverModalOrder && (
 <div
 onClick={() => setDeliverModalOrder(null)}
 style={{
 position: 'fixed', inset: 0, zIndex: 9999,
 background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)',
 display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
 }}
 >
 <div
 className="modal animate-slide-up"
 style={{
 background: 'var(--admin-card-bg, #ffffff)',
 borderRadius: 20,
 border: '1px solid var(--admin-card-border)',
 width: '100%',
 maxWidth: 500,
 padding: '24px 22px',
 position: 'relative',
 maxHeight: '90vh',
 overflowY: 'auto'
 }}
 onClick={e => e.stopPropagation()}
 >
 {/* Close button */}
 <button
 onClick={() => setDeliverModalOrder(null)}
 style={{
 position: 'absolute', top: 16, right: 16,
 background: 'none', border: 'none', cursor: 'pointer',
 color: 'var(--admin-text-secondary)'
 }}
 >
 <FiX size={20} />
 </button>

 {/* Header */}
 <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
 <div style={{
 width: 40, height: 40, borderRadius: 12,
 background: 'linear-gradient(135deg, #10B981, #059669)',
 color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
 boxShadow: '0 3px 10px rgba(16,185,129,0.3)'
 }}>
 <FiSend size={20} />
 </div>
 <div>
 <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: 'var(--admin-text)' }}>
 {isKhmer ? 'ប្រគល់ទំនិញជូនអតិថិជន' : 'Deliver Digital Order to Buyer'}
 </h3>
 <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 700 }}>
 Order #{deliverModalOrder.id} · {deliverModalOrder.userEmail || deliverModalOrder.user?.email || 'Customer'}
 </span>
 </div>
 </div>

 {/* Payment Completed Notice */}
 <div style={{
 background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.06))',
 border: '1.5px solid rgba(16,185,129,0.35)',
 borderRadius: 12,
 padding: '10px 14px',
 marginBottom: 16,
 display: 'flex',
 alignItems: 'center',
 gap: 8,
 fontSize: '0.82rem',
 color: '#065F46',
 fontWeight: 700
 }}>
 <FiCheckCircle size={16} color="#10B981" />
 <span>
 {isKhmer
 ? 'អតិថិជនបានបង់ប្រាក់រួចរាល់ហើយ! សូមប្រគល់គណនី/កូដ និង Upload ភស្តុតាង ដើម្បីបញ្ចប់ការបញ្ជាទិញ។'
 : 'Customer payment completed! Please provide credentials and upload proof to complete delivery.'}
 </span>
 </div>

 <form onSubmit={handleConfirmDelivery}>
 {/* Account Email / Key */}
 <div style={{ marginBottom: 12 }}>
 <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--admin-text)', marginBottom: 5 }}>
 {isKhmer ? 'អ៊ីមែល / ឈ្មោះគណនី / លេខកូដសម្ងាត់ *' : 'Account Email / Username / Key *'}
 </label>
 <input
 type="text"
 className="admin-input"
 placeholder={isKhmer ? 'ឧ. account@example.com' : 'e.g. account@example.com'}
 value={deliverForm.accountEmail}
 onChange={e => setDeliverForm(f => ({ ...f, accountEmail: e.target.value }))}
 required
 style={{ width: '100%', height: 40, borderRadius: 10 }}
 />
 </div>

 {/* Account Password / PIN */}
 <div style={{ marginBottom: 12 }}>
 <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--admin-text)', marginBottom: 5 }}>
 {isKhmer ? 'ពាក្យសម្ងាត់ ឬលេខសម្ងាត់' : 'Password / PIN / Secret'}
 </label>
 <input
 type="text"
 className="admin-input"
 placeholder={isKhmer ? 'ឧ. ១២៣៤៥ (អាចទុកទំនេរបាន)' : 'e.g. Pass12345 (optional)'}
 value={deliverForm.accountPassword}
 onChange={e => setDeliverForm(f => ({ ...f, accountPassword: e.target.value }))}
 style={{ width: '100%', height: 40, borderRadius: 10 }}
 />
 </div>

 {/* Delivery Note / Instructions */}
 <div style={{ marginBottom: 14 }}>
 <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--admin-text)', marginBottom: 5 }}>
 {isKhmer ? 'ចំណាំពីអ្នកលក់ / ការណែនាំប្រើប្រាស់' : 'Seller Note / Usage Instructions'}
 </label>
 <textarea
 className="admin-input"
 rows={2}
 placeholder={isKhmer ? 'ឧ. ហាមផ្លាស់ប្ដូរអ៊ីមែលក្នុងរយៈពេលធានា...' : 'e.g. Do not change email during warranty...'}
 value={deliverForm.deliveryNote}
 onChange={e => setDeliverForm(f => ({ ...f, deliveryNote: e.target.value }))}
 style={{ width: '100%', borderRadius: 10, padding: '8px 12px', fontSize: '0.85rem', resize: 'vertical' }}
 />
 </div>

 {/* Upload Proof of Delivery */}
 <div style={{ marginBottom: 16 }}>
 <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--admin-text)', marginBottom: 5 }}>
 {isKhmer ? 'រូបភាពភស្តុតាងនៃការប្រគល់' : 'Upload Proof of Delivery'}
 </label>
 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
 <label style={{
 padding: '8px 14px', borderRadius: 10,
 border: '1.5px dashed #10B981', background: 'rgba(16,185,129,0.06)',
 color: '#059669', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700,
 display: 'inline-flex', alignItems: 'center', gap: 6
 }}>
 <FiUpload size={14} />
 <span>{uploadingDeliveryProof ? (isKhmer ? 'កំពុងបញ្ចូលរូបភាព...' : 'Uploading...') : (isKhmer ? '+ ជ្រើសរើសរូបភាពភស្តុតាង' : '+ Upload Screenshot')}</span>
 <input type="file" accept="image/*" onChange={handleDeliveryProofUpload} disabled={uploadingDeliveryProof} style={{ display: 'none' }} />
 </label>
 </div>

 {/* Proof Image Preview */}
 {deliverForm.proofImage && (
 <div style={{ marginTop: 10, position: 'relative', width: 90, height: 75, borderRadius: 8, overflow: 'hidden', border: '1.5px solid #10B981' }}>
 <img src={deliverForm.proofImage} alt="Delivery Proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
 <button
 type="button"
 onClick={() => setDeliverForm(f => ({ ...f, proofImage: '' }))}
 style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
 >
 <FiX size={11} />
 </button>
 </div>
 )}
 </div>

 {/* Safe Trade Info Box */}
 <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, padding: '10px 12px', fontSize: '0.78rem', color: '#065F46', lineHeight: 1.5, marginBottom: 18 }}>
 <FiShield size={14} color="#10B981" style={{ verticalAlign: 'middle', marginRight: 4 }} />
 {isKhmer
 ? 'ប្រព័ន្ធសុវត្ថិភាព Safe Trade Protection: ការ Upload រូបភាពភស្តុតាង (ដូចជា screenshot នៃការបញ្ចូលពេជ្រ ឬការផ្ញើគណនី) នឹងការពារអ្នកលក់ 100% ករណីអតិថិជនមានចម្ងល់។'
 : 'Safe Trade Protection: Uploading proof screenshot protects you 100% in case the buyer raises an inquiry or dispute.'}
 </div>

 {/* Submit / Cancel Buttons */}
 <div style={{ display: 'flex', gap: 10 }}>
 <button
 type="button"
 className="admin-btn admin-btn-secondary"
 onClick={() => setDeliverModalOrder(null)}
 style={{ flex: 1, padding: '11px', borderRadius: 12, fontWeight: 700 }}
 >
 {isKhmer ? 'បោះបង់' : 'Cancel'}
 </button>
 <button
 type="submit"
 disabled={deliveringOrder || uploadingDeliveryProof}
 style={{
 flex: 2, padding: '11px', borderRadius: 12, border: 'none',
 background: 'linear-gradient(135deg, #10B981, #059669)',
 color: '#FFFFFF', fontWeight: 800, fontSize: '0.88rem',
 cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
 justifyContent: 'center', gap: 6,
 boxShadow: '0 3px 10px rgba(16,185,129,0.3)'
 }}
 >
 <FiSend size={15} />
 <span>{deliveringOrder ? (isKhmer ? 'កំពុងផ្ញើ...' : 'Delivering...') : (isKhmer ? 'ប្រគល់ទំនិញជូនអតិថិជន' : 'Confirm Delivery')}</span>
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/*  ZOOM PROOF IMAGE MODAL  */}
 {zoomProofImage && (
 <div
 onClick={() => setZoomProofImage(null)}
 style={{
 position: 'fixed', inset: 0, zIndex: 10000,
 background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
 display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
 }}
 >
 <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
 <button
 onClick={() => setZoomProofImage(null)}
 style={{ position: 'absolute', top: -36, right: 0, background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
 >
 <FiX size={28} />
 </button>
 <img
 src={zoomProofImage}
 alt="Zoomed Proof"
 style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.5)', objectFit: 'contain' }}
 />
 </div>
 </div>
 )}

 {/* Withdraw Modal */}
 {showWithdrawModal && (
 <SellerWithdrawModal
 balance={balance}
 onClose={() => setShowWithdrawModal(false)}
 onSuccess={() => { setShowWithdrawModal(false); loadData(); }}
 />
 )}

 {/* Stock Management Modal */}
 {manageStockProduct && (
 <SellerStockModal
 product={manageStockProduct}
 onClose={() => setManageStockProduct(null)}
 onSuccess={() => { loadData(); }}
 />
 )}

 {/* Confirm Switch to User Mode Modal */}
 <ConfirmModeSwitchModal
 isOpen={isSwitchModalOpen}
 targetMode="USER"
 onConfirm={() => navigate('/')}
 onClose={() => setIsSwitchModalOpen(false)}
 />

 {/* Seller Subscription Plans Upgrade Modal */}
 <SellerSubscriptionModal
 isOpen={showSubscriptionModal}
 onClose={() => setShowSubscriptionModal(false)}
 currentPlan={profile?.subscriptionPlan || 'PLAN_1'}
 remainingDays={profile?.remainingDays ?? 30}
 onSelectPlan={(planId, price) => {
 setShowSubscriptionModal(false);
 setPendingPlanId(planId);
 setPendingPlanPrice(price);
 setShowRenewalModal(true);
 }}
 />

 {/* KHQR Bakong Payment Renewal / Upgrade Modal */}
 <SellerSubscriptionRenewalModal
 isOpen={showRenewalModal}
 onClose={() => setShowRenewalModal(false)}
 storeName={profile?.storeName}
 planId={pendingPlanId}
 planPrice={pendingPlanPrice}
 remainingDays={profile?.remainingDays ?? 0}
 onSuccess={() => {
 setShowRenewalModal(false);
 toast.success(`ដំឡើងកញ្ចប់ ${pendingPlanId} ជោគជ័យ! មុខងារថ្មីដំណើរការភ្លាមៗ`);
 loadData();
 }}
 />

 {/*  CREATE COUPON MODAL  */}
 {showCouponModal && (
 <div
 onClick={() => setShowCouponModal(false)}
 style={{
 position: 'fixed', inset: 0,
 background: 'rgba(15, 23, 42, 0.65)',
 backdropFilter: 'blur(4px)',
 zIndex: 9999,
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 padding: 16, overflowY: 'auto'
 }}
 >
 <div
 className="modal animate-slide-up"
 style={{
 maxWidth: 540, width: '100%',
 background: 'var(--admin-card-bg, #FFFFFF)',
 borderRadius: 22,
 padding: 24,
 boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
 border: '1px solid var(--admin-card-border, #E2E8F0)',
 maxHeight: '90vh',
 overflowY: 'auto'
 }}
 onClick={e => e.stopPropagation()}
 >
 {/* Modal Header */}
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
 <div style={{
 width: 40, height: 40, borderRadius: 12,
 background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
 color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
 boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
 }}>
 <FiPercent size={20} />
 </div>
 <div>
 <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--admin-text)' }}>
 {isKhmer ? 'បង្កើតកូដបញ្ចុះតម្លៃថ្មី' : 'Create New Coupon'}
 </h3>
 <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)' }}>
 {isKhmer ? 'កំណត់ភាគរយ ឬចំនួនប្រាក់បញ្ចុះតម្លៃ' : 'Set discount percentage or fixed amount'}
 </span>
 </div>
 </div>

 <button
 onClick={() => setShowCouponModal(false)}
 style={{
 background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%',
 width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
 cursor: 'pointer', color: 'var(--admin-text-secondary)'
 }}
 >
 <FiX size={18} />
 </button>
 </div>

 {/* Coupon Code Input */}
 <div style={{ marginBottom: 16 }}>
 <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--admin-text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
 {isKhmer ? 'លេខកូដបញ្ចុះតម្លៃ' : 'Coupon Code'}
 </label>
 <div style={{ display: 'flex', gap: 8 }}>
 <input
 type="text"
 className="admin-input"
 placeholder="e.g. SUMMER20"
 value={couponForm.code}
 onChange={e => setCouponForm(f => ({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') }))}
 style={{ flex: 1, fontFamily: 'monospace', fontWeight: 800, fontSize: '1rem', letterSpacing: '0.08em' }}
 />
 <button
 type="button"
 onClick={generateCode}
 style={{
 background: 'rgba(99,102,241,0.1)', color: '#4F46E5',
 border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10,
 padding: '0 14px', fontSize: '0.8rem', fontWeight: 800,
 cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
 whiteSpace: 'nowrap'
 }}
 >
 <FiRefreshCw size={13} />
 <span>{isKhmer ? 'ចៃដន្យ' : 'Random'}</span>
 </button>
 </div>
 </div>

 {/* Discount Type Toggle */}
 <div style={{ marginBottom: 16 }}>
 <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--admin-text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
 {isKhmer ? 'ប្រភេទបញ្ចុះតម្លៃ' : 'Discount Type'}
 </label>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
 <button
 type="button"
 onClick={() => setCouponForm(f => ({ ...f, discountType: 'PERCENTAGE' }))}
 style={{
 padding: '12px 14px', borderRadius: 12,
 border: couponForm.discountType === 'PERCENTAGE' ? '2px solid #6366F1' : '1px solid var(--admin-card-border)',
 background: couponForm.discountType === 'PERCENTAGE' ? 'rgba(99,102,241,0.1)' : 'var(--admin-card-bg)',
 color: couponForm.discountType === 'PERCENTAGE' ? '#4F46E5' : 'var(--admin-text)',
 fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
 display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
 }}
 >
 <FiPercent size={16} />
 <span>{isKhmer ? 'ភាគរយ (%)' : 'Percentage (%)'}</span>
 </button>

 <button
 type="button"
 onClick={() => setCouponForm(f => ({ ...f, discountType: 'FIXED_AMOUNT' }))}
 style={{
 padding: '12px 14px', borderRadius: 12,
 border: couponForm.discountType === 'FIXED_AMOUNT' ? '2px solid #10B981' : '1px solid var(--admin-card-border)',
 background: couponForm.discountType === 'FIXED_AMOUNT' ? 'rgba(16,185,129,0.1)' : 'var(--admin-card-bg)',
 color: couponForm.discountType === 'FIXED_AMOUNT' ? '#059669' : 'var(--admin-text)',
 fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
 display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
 }}
 >
 <FiDollarSign size={16} />
 <span>{isKhmer ? 'សាច់ប្រាក់ ($)' : 'Fixed Amount ($)'}</span>
 </button>
 </div>
 </div>

 {/* Discount Value */}
 <div style={{ marginBottom: 16 }}>
 <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--admin-text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
 {couponForm.discountType === 'PERCENTAGE'
 ? (isKhmer ? 'អត្រាបញ្ចុះតម្លៃ (%)' : 'Discount Percentage (%)')
 : (isKhmer ? 'ចំនួនទឹកប្រាក់បញ្ចុះ ($)' : 'Discount Amount ($)')}
 </label>
 <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
 <div style={{ position: 'relative', flex: 1 }}>
 <input
 type="number"
 step={couponForm.discountType === 'PERCENTAGE' ? '1' : '0.5'}
 min="1"
 max={couponForm.discountType === 'PERCENTAGE' ? '100' : '9999'}
 className="admin-input"
 placeholder={couponForm.discountType === 'PERCENTAGE' ? '20' : '5.00'}
 value={couponForm.discountValue}
 onChange={e => setCouponForm(f => ({ ...f, discountValue: e.target.value }))}
 style={{ paddingRight: 36, fontWeight: 800, fontSize: '1.05rem' }}
 />
 <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--admin-text-secondary)' }}>
 {couponForm.discountType === 'PERCENTAGE' ? '%' : '$'}
 </span>
 </div>
 </div>

 {/* Quick Presets */}
 <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
 {(couponForm.discountType === 'PERCENTAGE' ? ['5', '10', '15', '20', '30', '50'] : ['1', '2', '3', '5', '10']).map(v => (
 <button
 key={v}
 type="button"
 onClick={() => setCouponForm(f => ({ ...f, discountValue: v }))}
 style={{
 background: couponForm.discountValue === v ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'rgba(0,0,0,0.05)',
 color: couponForm.discountValue === v ? '#fff' : 'var(--admin-text)',
 border: 'none', borderRadius: 8, padding: '4px 10px',
 fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
 }}
 >
 {couponForm.discountType === 'PERCENTAGE' ? `${v}%` : `$${v}`}
 </button>
 ))}
 </div>
 </div>

 {/* Apply To Scope: All Store Products vs Specific Product */}
 <div style={{ marginBottom: 16 }}>
 <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--admin-text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
 {isKhmer ? 'អនុវត្តចំពោះ' : 'Apply To Scope'}
 </label>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
 <button
 type="button"
 onClick={() => setCouponForm(f => ({ ...f, applyScope: 'ALL', productId: '' }))}
 style={{
 padding: '10px 12px', borderRadius: 10,
 border: couponForm.applyScope === 'ALL' ? '2px solid #6366F1' : '1px solid var(--admin-card-border)',
 background: couponForm.applyScope === 'ALL' ? 'rgba(99,102,241,0.1)' : 'var(--admin-card-bg)',
 color: couponForm.applyScope === 'ALL' ? '#4F46E5' : 'var(--admin-text)',
 fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer',
 display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
 }}
 >
 <FiLayers size={14} />
 <span>{isKhmer ? 'ទំនិញទាំងអស់ក្នុងហាង' : 'All Products'}</span>
 </button>
 <button
 type="button"
 onClick={() => setCouponForm(f => ({ ...f, applyScope: 'SPECIFIC', productId: products[0]?.id || '' }))}
 style={{
 padding: '10px 12px', borderRadius: 10,
 border: couponForm.applyScope === 'SPECIFIC' ? '2px solid #6366F1' : '1px solid var(--admin-card-border)',
 background: couponForm.applyScope === 'SPECIFIC' ? 'rgba(99,102,241,0.1)' : 'var(--admin-card-bg)',
 color: couponForm.applyScope === 'SPECIFIC' ? '#4F46E5' : 'var(--admin-text)',
 fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer',
 display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
 }}
 >
 <FiPackage size={14} />
 <span>{isKhmer ? 'ទំនិញជាក់លាក់' : 'Specific Product'}</span>
 </button>
 </div>

 {couponForm.applyScope === 'SPECIFIC' && (
 <div>
 <select
 className="admin-input"
 value={couponForm.productId}
 onChange={e => setCouponForm(f => ({ ...f, productId: e.target.value }))}
 style={{ width: '100%', fontSize: '0.85rem', fontWeight: 700 }}
 >
 <option value="">{isKhmer ? '-- ជ្រើសរើសទំនិញ --' : '-- Select Product --'}</option>
 {products.map(p => (
 <option key={p.id} value={p.id}>
 {p.name} — ${(p.basePrice || p.price || 0).toFixed(2)}
 </option>
 ))}
 </select>
 </div>
 )}
 </div>

 {/* Min Spend & Max Discount (2-column) */}
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
 <div>
 <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--admin-text-secondary)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
 {isKhmer ? 'ទិញអប្បបរមា ($)' : 'Min Order ($)'}
 </label>
 <input
 type="number"
 step="0.5"
 min="0"
 className="admin-input"
 placeholder="0.00 (Optional)"
 value={couponForm.minSpend}
 onChange={e => setCouponForm(f => ({ ...f, minSpend: e.target.value }))}
 />
 </div>

 {couponForm.discountType === 'PERCENTAGE' ? (
 <div>
 <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--admin-text-secondary)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
 {isKhmer ? 'បញ្ចុះអតិបរមា ($)' : 'Max Discount ($)'}
 </label>
 <input
 type="number"
 step="0.5"
 min="0"
 className="admin-input"
 placeholder="No limit"
 value={couponForm.maxDiscount}
 onChange={e => setCouponForm(f => ({ ...f, maxDiscount: e.target.value }))}
 />
 </div>
 ) : (
 <div>
 <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--admin-text-secondary)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
 {isKhmer ? 'កម្រិតប្រើប្រាស់ (ដង)' : 'Usage Limit'}
 </label>
 <input
 type="number"
 min="1"
 className="admin-input"
 placeholder="100"
 value={couponForm.usageLimit}
 onChange={e => setCouponForm(f => ({ ...f, usageLimit: e.target.value }))}
 />
 </div>
 )}
 </div>

 {/* Validity Days */}
 <div style={{ marginBottom: 20 }}>
 <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--admin-text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
 {isKhmer ? 'សុពលភាព' : 'Validity Period'}
 </label>
 <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
 {[
 { days: '7', label: isKhmer ? '7 ថ្ងៃ' : '7 Days' },
 { days: '14', label: isKhmer ? '14 ថ្ងៃ' : '14 Days' },
 { days: '30', label: isKhmer ? '30 ថ្ងៃ' : '30 Days' },
 { days: '60', label: isKhmer ? '60 ថ្ងៃ' : '60 Days' },
 { days: '90', label: isKhmer ? '90 ថ្ងៃ' : '90 Days' },
 ].map(item => (
 <button
 key={item.days}
 type="button"
 onClick={() => setCouponForm(f => ({ ...f, daysValid: item.days }))}
 style={{
 background: couponForm.daysValid === item.days ? '#4F46E5' : 'rgba(0,0,0,0.05)',
 color: couponForm.daysValid === item.days ? '#fff' : 'var(--admin-text)',
 border: 'none', borderRadius: 8, padding: '6px 12px',
 fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer'
 }}
 >
 {item.label}
 </button>
 ))}
 </div>
 </div>

 {/* Live Voucher Preview Card */}
 <div style={{
 background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
 color: '#fff',
 borderRadius: 16,
 padding: '16px 20px',
 marginBottom: 20,
 boxShadow: '0 8px 20px rgba(49,46,129,0.3)',
 position: 'relative',
 overflow: 'hidden'
 }}>
 <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7, marginBottom: 4 }}>
 {profile?.storeName || 'YOUR STORE'} · COUPON PREVIEW
 </div>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <div>
 <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#A5B4FC' }}>
 {couponForm.discountType === 'PERCENTAGE'
 ? `${couponForm.discountValue || 0}% OFF`
 : `$${parseFloat(couponForm.discountValue || 0).toFixed(2)} OFF`}
 </div>
 <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: 2 }}>
 {couponForm.minSpend ? `Min spend $${couponForm.minSpend}` : 'No minimum spend'} · {couponForm.daysValid || 30} days valid
 </div>
 </div>
 <div style={{
 background: 'rgba(255,255,255,0.15)',
 border: '1px dashed #A5B4FC',
 borderRadius: 10,
 padding: '6px 14px',
 fontFamily: 'monospace',
 fontWeight: 900,
 fontSize: '1rem',
 letterSpacing: '0.08em'
 }}>
 {couponForm.code || 'CODE'}
 </div>
 </div>
 </div>

 {/* Modal Actions */}
 <div style={{ display: 'flex', gap: 10 }}>
 <button
 type="button"
 className="admin-btn admin-btn-secondary"
 onClick={() => setShowCouponModal(false)}
 disabled={creatingCoupon}
 style={{ flex: 1, padding: '12px' }}
 >
 {isKhmer ? 'បោះបង់' : 'Cancel'}
 </button>
 <button
 type="button"
 onClick={handleCreateCoupon}
 disabled={creatingCoupon}
 style={{
 flex: 2,
 background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
 color: '#fff', border: 'none', borderRadius: 12,
 padding: '12px', fontWeight: 800, fontSize: '0.92rem',
 cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
 justifyContent: 'center', gap: 8,
 boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
 opacity: creatingCoupon ? 0.7 : 1
 }}
 >
 {creatingCoupon ? (
 <>
 <div className="loading-spinner" style={{ width: 16, height: 16 }} />
 <span>{isKhmer ? 'កំពុងបង្កើត...' : 'Creating...'}</span>
 </>
 ) : (
 <>
 <FiCheck size={16} />
 <span>{isKhmer ? 'បង្កើតកូដបញ្ចុះតម្លៃ' : 'Create Coupon'}</span>
 </>
 )}
 </button>
 </div>
 </div>
 </div>
 )}

 {/*  SHARE COUPON MODAL  */}
 {shareCoupon && (
 <div
 onClick={() => setShareCoupon(null)}
 style={{
 position: 'fixed', inset: 0,
 background: 'rgba(15, 23, 42, 0.65)',
 backdropFilter: 'blur(4px)',
 zIndex: 9999,
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 padding: 16
 }}
 >
 <div
 className="modal animate-slide-up"
 style={{
 maxWidth: 500, width: '100%',
 background: 'var(--admin-card-bg, #FFFFFF)',
 borderRadius: 22,
 padding: 24,
 boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
 border: '1px solid var(--admin-card-border, #E2E8F0)'
 }}
 onClick={e => e.stopPropagation()}
 >
 {/* Modal Header */}
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
 <div style={{
 width: 38, height: 38, borderRadius: 12,
 background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
 color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
 boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
 }}>
 <FiShare2 size={18} />
 </div>
 <div>
 <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--admin-text)' }}>
 {isKhmer ? 'ចែករំលែកកូដបញ្ចុះតម្លៃ' : 'Share Coupon Promo'}
 </h3>
 <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)' }}>
 {isKhmer ? 'ចែករំលែកទៅកាន់បណ្តាញសង្គម ឬផ្ញើផ្ទាល់' : 'Share to social platforms or copy message'}
 </span>
 </div>
 </div>

 <button
 onClick={() => setShareCoupon(null)}
 style={{
 background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%',
 width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
 cursor: 'pointer', color: 'var(--admin-text-secondary)'
 }}
 >
 <FiX size={18} />
 </button>
 </div>

 {/* Voucher Visual Ticket */}
 <div style={{
 background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
 color: '#fff',
 borderRadius: 18,
 padding: '20px',
 marginBottom: 16,
 boxShadow: '0 10px 24px rgba(79,70,229,0.3)',
 position: 'relative'
 }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
 <div>
 <span style={{ fontSize: '0.75rem', opacity: 0.85, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
 {profile?.storeName || 'SABY STORE'}
 </span>
 <div style={{ fontSize: '1.8rem', fontWeight: 900, lineHeight: 1.1 }}>
 {shareCoupon.discountText} <span style={{ fontSize: '1rem' }}>OFF</span>
 </div>
 </div>
 <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 800 }}>
 SPECIAL PROMO
 </span>
 </div>

 {/* Code Box */}
 <div style={{
 background: 'rgba(255,255,255,0.18)',
 backdropFilter: 'blur(4px)',
 border: '1px dashed rgba(255,255,255,0.5)',
 borderRadius: 12,
 padding: '10px 14px',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between'
 }}>
 <div>
 <span style={{ fontSize: '0.65rem', opacity: 0.8, display: 'block', textTransform: 'uppercase' }}>{isKhmer ? 'កូដប្រើប្រាស់:' : 'PROMO CODE:'}</span>
 <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1.25rem', letterSpacing: '0.08em' }}>
 {shareCoupon.coupon?.code}
 </span>
 </div>
 <button
 onClick={() => handleCopyCode(shareCoupon.coupon?.code)}
 style={{
 background: '#fff', color: '#4F46E5',
 border: 'none', borderRadius: 8, padding: '6px 12px',
 fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
 display: 'inline-flex', alignItems: 'center', gap: 4
 }}
 >
 <FiCopy size={13} /> {isKhmer ? 'ចម្លងកូដ' : 'Copy'}
 </button>
 </div>
 </div>

 {/* Promo Message Preview Box */}
 <div style={{
 background: 'var(--bg-secondary, #F8FAFC)',
 border: '1px solid var(--admin-card-border, #E2E8F0)',
 borderRadius: 12,
 padding: '10px 14px',
 fontSize: '0.8rem',
 color: 'var(--admin-text)',
 marginBottom: 18,
 whiteSpace: 'pre-line',
 lineHeight: 1.5
 }}>
 {shareCoupon.msg}
 </div>

 {/* Platform Share Buttons */}
 <div style={{ marginBottom: 18 }}>
 <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--admin-text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>
 {isKhmer ? 'ចែករំលែកទៅកាន់បណ្តាញ' : 'Share Via Platform'}
 </div>
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
 {/* Telegram */}
 <button
 type="button"
 onClick={() => {
 const url = `https://t.me/share/url?url=${encodeURIComponent(shareCoupon.storeUrl || window.location.href)}&text=${encodeURIComponent(shareCoupon.msg)}`;
 window.open(url, '_blank', 'noopener,noreferrer');
 }}
 style={{
 background: '#229ED9', color: '#fff',
 border: 'none', borderRadius: 12, padding: '10px 8px',
 fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer',
 display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
 boxShadow: '0 2px 8px rgba(34,158,217,0.3)'
 }}
 >
 <FiSend size={18} />
 <span>Telegram</span>
 </button>

 {/* Facebook */}
 <button
 type="button"
 onClick={() => {
 const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareCoupon.storeUrl || window.location.href)}&quote=${encodeURIComponent(shareCoupon.msg)}`;
 window.open(url, '_blank', 'noopener,noreferrer');
 }}
 style={{
 background: '#1877F2', color: '#fff',
 border: 'none', borderRadius: 12, padding: '10px 8px',
 fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer',
 display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
 boxShadow: '0 2px 8px rgba(24,119,242,0.3)'
 }}
 >
 <FiExternalLink size={18} />
 <span>Facebook</span>
 </button>

 {/* System / Mobile Share */}
 <button
 type="button"
 onClick={async () => {
 if (navigator.share) {
 try {
 await navigator.share({
 title: profile?.storeName || 'Saby Shop Store',
 text: shareCoupon.msg,
 url: shareCoupon.storeUrl || window.location.href
 });
 return;
 } catch (_) {}
 }
 handleCopyText(shareCoupon.msg);
 }}
 style={{
 background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff',
 border: 'none', borderRadius: 12, padding: '10px 8px',
 fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer',
 display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
 boxShadow: '0 2px 8px rgba(16,185,129,0.3)'
 }}
 >
 <FiShare2 size={18} />
 <span>{isKhmer ? 'កម្មវិធីផ្សេងៗ' : 'Other Apps'}</span>
 </button>
 </div>
 </div>

 {/* Copy Full Message / Copy Code Buttons */}
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
 <button
 type="button"
 onClick={() => handleCopyText(shareCoupon.msg)}
 style={{
 padding: '11px 14px', borderRadius: 12,
 background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
 color: '#fff', border: 'none',
 fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer',
 display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
 boxShadow: '0 2px 10px rgba(99,102,241,0.3)'
 }}
 >
 <FiCopy size={14} />
 <span>{isKhmer ? 'ចម្លងសារប្រូម៉ូសិន' : 'Copy Full Message'}</span>
 </button>

 <button
 type="button"
 onClick={() => handleCopyCode(shareCoupon.coupon?.code)}
 className="admin-btn admin-btn-secondary"
 style={{ padding: '11px 14px', borderRadius: 12, fontSize: '0.82rem', fontWeight: 800 }}
 >
 <FiTag size={14} />
 <span>{isKhmer ? 'ចម្លងតែលេខកូដ' : 'Copy Code Only'}</span>
 </button>
 </div>
 </div>
 </div>
 )}

       {/* Confirm Delete Coupon Modal */}
      <ConfirmDeleteCouponModal
        isOpen={Boolean(deleteConfirmCoupon)}
        coupon={deleteConfirmCoupon}
        onClose={() => !deletingCoupon && setDeleteConfirmCoupon(null)}
        onConfirm={confirmDeleteCoupon}
        loading={deletingCoupon}
      />

      {/* Confirm Remove Product Discount Modal */}
      <ConfirmCompleteDiscountModal
        isOpen={Boolean(completeDiscountProduct)}
        product={completeDiscountProduct}
        onClose={() => !completingDiscount && setCompleteDiscountProduct(null)}
        onConfirm={confirmCompleteProductDiscount}
        loading={completingDiscount}
      />

      <ConfirmRemoveDiscountModal
        isOpen={Boolean(removeConfirmDiscountProduct)}
        product={removeConfirmDiscountProduct}
        onClose={() => !removingDiscount && setRemoveConfirmDiscountProduct(null)}
        onConfirm={confirmRemoveProductDiscount}
        loading={removingDiscount}
      />

      {/* Seller Replace Policy Page-by-Page Walkthrough Modal */}
      <ContactAdminModal
        isOpen={showContactAdminModal}
        onClose={() => setShowContactAdminModal(false)}
      />

      <SellerTelegramBotModal
        isOpen={showTelegramBotModal}
        onClose={() => setShowTelegramBotModal(false)}
        profile={profile}
        user={user}
      />

      <SellerPolicyWalkthroughModal
        isOpen={isPolicyWalkthroughOpen}
        onClose={() => setIsPolicyWalkthroughOpen(false)}
      />

      {/* Seller Dispute Resolution & Drop Replacement Modal */}
      {selectedDispute && (
        <SellerDisputeModal
          isOpen={Boolean(selectedDispute)}
          dispute={selectedDispute}
          onClose={() => setSelectedDispute(null)}
          onSuccess={() => {
            loadData();
            setSelectedDispute(null);
          }}
        />
      )}

      {/* Automatic Mobile Bottom Navigation Bar */}
 <div className="seller-mobile-bottom-nav" style={{
 position: 'fixed', bottom: 0, left: 0, right: 0, height: 60,
 background: '#FFFFFF', borderTop: '1px solid #E2E8F0',
 display: 'flex', alignItems: 'center', justifyContent: 'space-around',
 zIndex: 90, boxShadow: '0 -4px 16px rgba(0,0,0,0.06)'
 }}>
 {[
 { key: 'overview', label: 'Dashboard', icon: MdDashboard },
 { key: 'products', label: 'Products', icon: FiPackage },
 { key: 'orders', label: 'Orders', icon: FiShoppingBag },
 { key: 'chats', label: 'Chats', icon: FiMessageSquare },
 { key: 'coupons', label: isKhmer ? 'គូប៉ុង' : 'Coupons', icon: FiPercent },
 { key: 'withdrawals', label: 'Payouts', icon: FiDollarSign }
 ].map(item => {
 const Icon = item.icon;
 const active = tab === item.key;
 return (
 <button
 key={item.key}
 onClick={() => { setTab(item.key); setMobileMenuOpen(false); }}
 style={{
 background: 'none', border: 'none', display: 'flex', flexDirection: 'column',
 alignItems: 'center', gap: 3, flex: 1, color: active ? '#10B981' : '#64748B',
 cursor: 'pointer', padding: '6px 0'
 }}
 >
 <Icon size={18} color={active ? '#10B981' : '#64748B'} />
 <span style={{ fontSize: '0.65rem', fontWeight: active ? 800 : 600 }}>{item.label}</span>
 </button>
 );
 })}
 </div>
 </div>
 );
}
