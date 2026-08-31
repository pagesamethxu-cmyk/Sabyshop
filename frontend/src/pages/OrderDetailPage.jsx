import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { orders as ordersApi, disputes as disputesApi, chat as chatApi, reviews as reviewsApi, orderExtensions as orderExtApi } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import PaymentModal from '../components/PaymentModal';
import ConfirmCancelOrderModal from '../components/ConfirmCancelOrderModal';
import ReviewModal from '../components/ReviewModal';
import PolicyModal from '../components/PolicyModal';
import ReplacementRequestModal from '../components/ReplacementRequestModal';
import StatusDetailsModal from '../components/StatusDetailsModal';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  FiCheckCircle, FiKey, FiClock, FiCreditCard, FiTrash2,
  FiAlertCircle, FiArrowLeft, FiMessageSquare, FiPackage,
  FiRefreshCw, FiStar, FiCopy, FiCheck, FiChevronDown,
  FiChevronUp, FiZap, FiShoppingBag, FiSend, FiHeadphones, FiInfo,
  FiShield, FiUpload, FiX, FiAlertTriangle, FiUser
} from 'react-icons/fi';
import { MdStorefront, MdVerified } from 'react-icons/md';
import { normalizeImageUrl, isImageMedia, extractDeliveryProofUrl } from '../utils/imageUrl';

/*  Inline Copy Button  */
const CopyBtn = ({ text, label }) => {
  const [copied, setCopied] = useState(false);
  const { lang } = useLanguage();
  const isKhmer = lang === 'km';

  const handleCopy = (e) => {
    e?.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    toast.success(isKhmer ? `បានថតចម្លង ${label || ''}!` : `Copied ${label || ''}!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: copied ? '#10b981' : '#2563eb',
        fontWeight: 700,
        fontSize: '0.82rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 6px',
        borderRadius: 6,
        flexShrink: 0,
        transition: 'all 0.15s ease'
      }}
    >
      {copied ? <FiCheck size={13} /> : <FiCopy size={13} />}
      <span>{copied ? (isKhmer ? 'បានថតចម្លង' : 'Copied') : (isKhmer ? 'ថតចម្លង' : 'Copy')}</span>
    </button>
  );
};

/*  Account Data Row  */
const AccountRow = ({ label, value, isLong }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '95px 1fr auto',
      gap: 10,
      alignItems: isLong ? 'flex-start' : 'center',
      padding: '11px 0',
      borderBottom: '1px solid var(--border-light, #f1f5f9)'
    }}
  >
    <span style={{ fontSize: '0.82rem', color: 'var(--text-light, #64748b)', fontWeight: 600, paddingTop: isLong ? 2 : 0 }}>
      {label}
    </span>
    <span
      style={{
        fontSize: '0.84rem',
        fontWeight: 700,
        color: 'var(--text, #0f172a)',
        wordBreak: 'break-word',
        lineHeight: 1.5,
        whiteSpace: isLong ? 'pre-wrap' : 'normal'
      }}
    >
      {value || '—'}
    </span>
    {value && <CopyBtn text={value} label={label} />}
  </div>
);

/*  Media Attachment Renderer  */
const ChatMediaContent = ({ content, onImageClick }) => {
  if (!content) return null;
  const textContent = content.trim();

  if (isImageMedia(textContent)) {
    const finalUrl = normalizeImageUrl(textContent);
    return (
      <div
        style={{ marginTop: 2, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', maxWidth: 260 }}
        onClick={() => onImageClick && onImageClick(finalUrl)}
      >
        <img
          src={finalUrl}
          alt="Attachment"
          style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block', borderRadius: 10 }}
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
    );
  }

  return <span>{content}</span>;
};

/*  Instant Delivery Badge  */
const InstantBadge = () => {
  const { lang } = useLanguage();
  const isKhmer = lang === 'km';
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: 'linear-gradient(135deg,#22c55e,#16a34a)',
        color: '#fff',
        fontWeight: 800,
        fontSize: '0.72rem',
        padding: '3px 10px',
        borderRadius: 20,
        boxShadow: '0 2px 8px rgba(34,197,94,0.3)'
      }}
    >
      <FiZap size={11} /> {isKhmer ? 'ការដឹកជញ្ជូន ០ វិនាទី' : 'INSTANT Delivery'}
    </div>
  );
};

/*  Intelligent Account Rows Parser  */
const parseAccountRows = (acc, sellerNoteText, isKhmer) => {
  if (!acc && !sellerNoteText) return [];

  const isInvite = Boolean(
    acc?.email && (
      acc.email.startsWith('http://') ||
      acc.email.startsWith('https://') ||
      acc.email.startsWith('t.me/') ||
      acc.password === 'N/A'
    )
  );

  if (isInvite) {
    return [
      { label: isKhmer ? 'តំណ Invite' : 'Invite Link', value: acc.email, copyable: true },
      ...(sellerNoteText ? [{ label: isKhmer ? 'ចំណាំ' : 'Note', value: sellerNoteText, copyable: true, isLong: true }] : [])
    ];
  }

  const rows = [];
  if (acc?.email) {
    rows.push({ label: isKhmer ? 'អ៊ីមែល' : 'Email', value: acc.email, copyable: true });
  }
  if (acc?.password && acc.password !== 'N/A') {
    rows.push({ label: isKhmer ? 'ពាក្យសម្ងាត់' : 'Password', value: acc.password, copyable: true });
  }

  // Parse seller note for Profile, PIN Profile, Note
  if (sellerNoteText) {
    const lines = sellerNoteText.split(/\r?\n|;/).map(l => l.trim()).filter(Boolean);
    const remainingNote = [];

    lines.forEach(line => {
      const lower = line.toLowerCase();
      if (lower.startsWith('profile:') || lower.startsWith('profile :')) {
        const val = line.substring(line.indexOf(':') + 1).trim();
        if (val) rows.push({ label: isKhmer ? 'Profile' : 'Profile', value: val, copyable: true });
      } else if (lower.startsWith('pin profile:') || lower.startsWith('pin profile :') || lower.startsWith('pin:') || lower.startsWith('pin :')) {
        const val = line.substring(line.indexOf(':') + 1).trim();
        if (val) rows.push({ label: isKhmer ? 'PIN Profile' : 'PIN Profile', value: val, copyable: true });
      } else if (lower.startsWith('note:') || lower.startsWith('note :')) {
        const val = line.substring(line.indexOf(':') + 1).trim();
        if (val) remainingNote.push(val);
      } else {
        remainingNote.push(line);
      }
    });

    if (remainingNote.length > 0) {
      const finalNote = remainingNote.join('\n');
      rows.push({
        label: isKhmer ? 'ចំណាំ' : 'Note',
        value: finalNote,
        copyable: true,
        isLong: finalNote.length > 40
      });
    }
  }

  return rows;
};

const OrderDetailPage = () => {
  const { t, lang } = useLanguage();
  const isKhmer = lang === 'km';
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pollingRef = useRef(null);

  const [showOrderInfo, setShowOrderInfo] = useState(true);
  const [showInlineChat, setShowInlineChat] = useState(false);
  const [inlineMsgs, setInlineMsgs] = useState([]);
  const [inlineMsgsLoading, setInlineMsgsLoading] = useState(false);
  const [inlineInput, setInlineInput] = useState('');
  const [inlineSending, setInlineSending] = useState(false);
  const inlineChatEndRef = useRef(null);
  const inlineInputRef = useRef(null);

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showStatusDetailsModal, setShowStatusDetailsModal] = useState(false);

  // Review Flow
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewedItems, setReviewedItems] = useState(new Set());
  const [hasReviewed, setHasReviewed] = useState(false);
  const [submittedReviewToast, setSubmittedReviewToast] = useState(false);

  // Delivery confirmation & Dispute proof state
  const [isConfirmingReceived, setIsConfirmingReceived] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [statusHistoryList, setStatusHistoryList] = useState([]);
  const [deliveriesList, setDeliveriesList] = useState([]);
  const [refundsList, setRefundsList] = useState([]);
  const [disputeForm, setDisputeForm] = useState({
    issueType: 'ORDER_NOT_RECEIVED',
    description: '',
    evidenceImages: []
  });
  const [uploadingDisputeProof, setUploadingDisputeProof] = useState(false);
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [zoomProofImage, setZoomProofImage] = useState(null);

  const handleConfirmReceived = async () => {
    setIsConfirmingReceived(true);
    try {
      await ordersApi.confirm(order.id);
      setOrder(prev => ({ ...prev, status: 'COMPLETED', sellerCredited: true }));
      
      const firstItem = order.items?.[0] || order.product;
      const targetProdId = firstItem?.product?.id || firstItem?.productId || order.productId;
      const targetProdName = firstItem?.product?.name || firstItem?.productName || order.productName || (isKhmer ? 'ផលិតផល' : 'Product');
      const targetProdImg = firstItem?.product?.imageUrl || firstItem?.productImageUrl || '';
      const targetCatName = firstItem?.product?.categoryName || firstItem?.product?.category?.name || 'Netflix';

      // Automatically launch Give Review flow (matches video frame 00:02 -> 00:03)
      setReviewTarget({
        productId: targetProdId,
        productName: targetProdName,
        productImage: targetProdImg,
        categoryName: targetCatName
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || (isKhmer ? 'បរាជ័យក្នុងការបញ្ជាក់' : 'Failed to confirm received'));
    } finally {
      setIsConfirmingReceived(false);
    }
  };

  const handleReviewSuccess = (reviewData) => {
    setHasReviewed(true);
    if (reviewTarget?.productId) {
      setReviewedItems(prev => new Set([...prev, reviewTarget.productId]));
    }
    setOrder(prev => ({ ...prev, status: 'COMPLETED', hasReviewed: true }));
    setReviewTarget(null);

    // Show custom snackbar toast matching video frame 00:12 - 00:16
    setSubmittedReviewToast(true);
    setTimeout(() => {
      setSubmittedReviewToast(false);
    }, 6500);
  };

  const handleBuyerDisputeSubmit = async (e) => {
    e.preventDefault();
    if (!disputeForm.description.trim()) {
      return toast.error(isKhmer ? 'សូមសរសេររៀបរាប់ពីបញ្ហាដែលអ្នកជួបប្រទះ' : 'Please describe the issue');
    }
    setSubmittingDispute(true);
    try {
      await disputesApi.create(order.id, {
        issueType: disputeForm.issueType,
        description: disputeForm.description,
        evidenceImages: disputeForm.evidenceImages,
        preferredSolution: 'REFUND'
      });
      setOrder(prev => ({ ...prev, status: 'DISPUTED' }));
      setShowDisputeModal(false);
      toast.success(isKhmer ? 'បានដាក់ពាក្យបណ្ដឹង និងភស្តុតាងជោគជ័យ! ក្រុមការងារនឹងដោះស្រាយជូន' : 'Dispute and proof submitted successfully! Safe Trade is investigating');
    } catch (err) {
      toast.error(err?.response?.data?.message || (isKhmer ? 'បរាជ័យក្នុងការដាក់ពាក្យបណ្ដឹង' : 'Failed to submit dispute'));
    } finally {
      setSubmittingDispute(false);
    }
  };

  const handleDisputeProofUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDisputeProof(true);
    try {
      const res = await chatApi.uploadMedia(file);
      const url = res.data?.url || res.data;
      setDisputeForm(f => ({ ...f, evidenceImages: [...f.evidenceImages, url] }));
      toast.success(isKhmer ? 'បាន Upload រូបភាពភស្តុតាងជោគជ័យ!' : 'Proof image uploaded!');
    } catch (err) {
      toast.error(err?.response?.data?.message || (isKhmer ? 'មិនអាច Upload រូបភាពបានទេ' : 'Image upload failed'));
    } finally {
      setUploadingDisputeProof(false);
    }
  };

  const handleReplacementSuccess = () => {
    fetchOrder(true);
  };

  const fetchOrder = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    try {
      const res = await ordersApi.getById(id);
      if (res.data) {
        setOrder(res.data);
        if (res.data.hasReviewed) {
          setHasReviewed(true);
        } else if (res.data.status === 'COMPLETED') {
          const firstItm = res.data.items?.[0] || res.data.product;
          const targetPId = firstItm?.productId || firstItm?.product?.id || res.data.productId;
          if (targetPId) {
            try {
              const chk = await reviewsApi.checkReviewed(targetPId, res.data.id);
              const isRev = chk?.data?.reviewed || chk?.data?.data?.reviewed;
              if (isRev) setHasReviewed(true);
            } catch (_) {}
          }
        }
        try {
          localStorage.setItem(`cached_order_${id}`, JSON.stringify(res.data));
        } catch (_) {}

        // Fetch Table 28, 29, 30 data
        try {
          const [histRes, delivRes, refRes] = await Promise.all([
            orderExtApi.getHistory(id).catch(() => ({ data: [] })),
            orderExtApi.getDeliveries(id).catch(() => ({ data: [] })),
            orderExtApi.getRefunds(id).catch(() => ({ data: [] }))
          ]);
          setStatusHistoryList(Array.isArray(histRes.data) ? histRes.data : (histRes.data?.data || []));
          setDeliveriesList(Array.isArray(delivRes.data) ? delivRes.data : (delivRes.data?.data || []));
          setRefundsList(Array.isArray(refRes.data) ? refRes.data : (refRes.data?.data || []));
        } catch (_) {}
      }
    } catch (err) {
      try {
        const cached = localStorage.getItem(`cached_order_${id}`);
        if (cached) {
          setOrder(JSON.parse(cached));
          return;
        }
      } catch (_) {}

      if (!silent) {
        toast.error(isKhmer ? 'មិនអាចទាញយកព័ត៌មានការបញ្ជាទិញបានទេ' : 'Failed to load order.');
        setOrder(null);
      }
    } finally {
      if (!silent) setLoading(false);
      else setIsRefreshing(false);
    }
  };

  // Load inline chat messages for this order
  const loadInlineChat = async () => {
    setInlineMsgsLoading(true);
    try {
      const res = await chatApi.getMessages(id);
      const msgs = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      const sellerMsgs = msgs.filter(m => !m.channel || m.channel === 'USER_SELLER');
      setInlineMsgs(sellerMsgs.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)));
    } catch { /* silent */ }
    finally { setInlineMsgsLoading(false); }
  };

  const handleInlineSend = async () => {
    const content = inlineInput.trim();
    if (!content || inlineSending) return;
    setInlineSending(true);
    setInlineInput('');
    const temp = { id: 'tmp-' + Date.now(), senderRole: 'USER', content, createdAt: new Date().toISOString(), _temp: true };
    setInlineMsgs(prev => [...prev, temp]);
    setTimeout(() => inlineChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    try {
      await chatApi.sendMessage(id, content, null, 'km', 'USER_SELLER');
      await loadInlineChat();
    } catch {
      toast.error(isKhmer ? 'មិនអាចផ្ញើសារបានទេ' : 'Failed to send');
      setInlineMsgs(prev => prev.filter(m => m.id !== temp.id));
    } finally {
      setInlineSending(false);
      inlineInputRef.current?.focus();
    }
  };

  useEffect(() => { fetchOrder(); }, [id]);

  useEffect(() => {
    if (order?.status === 'PROCESSING') {
      pollingRef.current = setInterval(() => fetchOrder(true), 10000);
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [order?.status]);

  const handleConfirmCancel = async () => {
    setCancelling(true);
    try {
      await ordersApi.cancel(id).catch(() => null);
      toast.success(isKhmer ? `បានលុបការបញ្ជាទិញ #${id} ជោគជ័យ` : `Order #${id} deleted successfully`);
      navigate('/orders');
    } catch {
      toast.error(isKhmer ? 'មិនអាចលុបការបញ្ជាទិញបានទេ' : 'Failed to delete order');
    } finally {
      setCancelling(false);
      setIsCancelModalOpen(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!order) return <EmptyState title={t('orders.noOrdersTitle')} actionText={t('orders.backToOrders')} actionLink="/orders" />;

  const isPending = order.status === 'PENDING';
  const isProcessing = order.status === 'PROCESSING';
  const isDelivered = order.status === 'DELIVERED';
  const isCompleted = order.status === 'COMPLETED';
  const isDisputed = order.status === 'DISPUTED';
  const isCancelled = order.status === 'CANCELLED';
  const isWaiting = order.status === 'WAITING_FOR_STOCK';

  // Role detection
  const isBuyer = Boolean(
    user && order && (
      (order.userId && user.id === order.userId) ||
      (order.user?.id && user.id === order.user.id) ||
      (user.email && order.customerEmail && user.email.toLowerCase() === order.customerEmail.toLowerCase()) ||
      (user.email && order.user?.email && user.email.toLowerCase() === order.user.email.toLowerCase())
    )
  );
  const isSeller = Boolean(
    user && order && !isBuyer && (
      user.role === 'SELLER' ||
      (order.sellerId && user.id === order.sellerId) ||
      order.items?.some(it => it.product?.seller?.id === user.id || it.sellerId === user.id)
    )
  );
  const isAdmin = Boolean(user?.role === 'ADMIN');

  const chatUrl = isSeller
    ? `/chat/seller-customers?order=${order?.id}`
    : `/chat/user-seller?order=${order?.id}`;

  const totalQty = order.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 1;
  const firstItem = order.items?.[0];
  const product = firstItem?.product || {};
  const productId = product.id || firstItem?.productId || firstItem?.product?.id || order?.productId;
  const productName = product.name || firstItem?.productName || (isKhmer ? 'ផលិតផល' : 'Product');
  const productImg = product.imageUrl || firstItem?.productImageUrl || '';
  const categoryName = product.categoryName || product.category?.name || 'Netflix';
  const totalAmount = Number(order.totalAmount || 0);
  const storeName = order.sellerStoreName || product.sellerStoreName || 'Saby Shop Store';
  const effectiveSellerId = order.sellerId || product.sellerId || product.seller?.id || firstItem?.product?.sellerId || firstItem?.product?.seller?.id || order.items?.[0]?.sellerId;
  const rawPaymentMethod = order.paymentMethod || 'Paypal';

  // Formatted 17-digit Order Number (e.g. 00000000164727165)
  const formattedOrderNumber = String(order.id).padStart(17, '0');

  // Status display properties
  const statusConfig = {
    COMPLETED: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: isKhmer ? 'បានបញ្ចប់' : 'Completed' },
    DELIVERED: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: isKhmer ? 'អ្នកលក់បានប្រគល់' : 'Delivered' },
    PENDING: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: isKhmer ? 'រង់ចាំទូទាត់' : 'Pending' },
    PROCESSING: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', label: isKhmer ? 'កំពុងដំណើរការ' : 'Processing' },
    DISPUTED: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: isKhmer ? 'មានទំនាស់/បណ្ដឹង' : 'Disputed' },
    CANCELLED: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: isKhmer ? 'បានបោះបង់' : 'Cancelled' },
    WAITING_FOR_STOCK: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: isKhmer ? 'រង់ចាំស្តុក' : 'Waiting Stock' },
  };
  const sc = statusConfig[order.status] || { color: 'var(--text)', bg: 'var(--bg-secondary)', label: order.status };

  return (
    <div style={{ padding: '24px 16px 120px', maxWidth: 640, margin: '0 auto' }}>
      <style>{`
        @keyframes shimmer { 0%{left:-100%} 100%{left:100%} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes slideUp { from{transform:translate(-50%, 20px); opacity:0} to{transform:translate(-50%, 0); opacity:1} }
        .od-card { background:var(--card-bg,#fff); border:1px solid var(--border,#e2e8f0); border-radius:14px; overflow:hidden; margin-bottom:14px; box-shadow:0 2px 8px rgba(0,0,0,0.03); }
        .od-card-header { display:flex; justify-content:space-between; align-items:center; padding:12px 18px; border-bottom:1px solid var(--border,#e2e8f0); }
        .od-card-header h3 { margin:0; font-size:0.92rem; font-weight:800; color:var(--text); }
        .od-card-body { padding:4px 18px 12px; }
        .od-contact-btn { display:inline-flex;align-items:center;gap:6px;padding:6px 16px;border-radius:8px;border:1.5px solid #2563eb;color:#2563eb;background:transparent;font-weight:700;font-size:0.82rem;cursor:pointer;transition:all .18s; }
        .od-contact-btn:hover { background:#2563eb;color:#fff; }
        .od-buy-btn { width:100%;padding:14px;border:none;background:linear-gradient(135deg,#ea580c,#f97316);color:#fff;font-weight:800;font-size:0.96rem;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 16px rgba(234,88,12,.3);transition:all .2s; }
        .od-buy-btn:hover { transform:translateY(-1px);box-shadow:0 6px 20px rgba(234,88,12,.4); }
      `}</style>

      {/*  SELLER MODE BANNER (When Seller views Customer's Order)  */}
      {isSeller && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
          border: '1.5px solid rgba(99,102,241,0.35)',
          borderRadius: 14,
          padding: '14px 18px',
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#6366F1', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <MdStorefront size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#4338CA' }}>
                {isKhmer ? 'ផ្ទាំងអ្នកលក់ • ព័ត៌មានការបញ្ជាទិញ' : 'Seller View • Customer Order Details'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#6366F1', fontWeight: 600 }}>
                {isKhmer ? `អតិថិជន៖ ${order.customerName || order.user?.name || order.customerEmail || 'Customer'}` : `Customer: ${order.customerName || order.user?.name || order.customerEmail || 'Customer'}`}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => navigate(`/chat/seller-customers?order=${order.id}`)}
              style={{
                background: '#6366F1', color: '#fff', border: 'none', borderRadius: 8,
                padding: '6px 12px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6
              }}
            >
              <FiMessageSquare size={13} /> {isKhmer ? 'ជជែក' : 'Chat'}
            </button>
            <button
              onClick={() => navigate('/seller-dashboard')}
              style={{
                background: 'rgba(99,102,241,0.1)', color: '#4338CA', border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 8, padding: '6px 12px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer'
              }}
            >
              {isKhmer ? 'ផ្ទាំងគ្រប់គ្រង' : 'Dashboard'}
            </button>
          </div>
        </div>
      )}

      {/*  TOP APP BAR: ← Order Details  */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button
          onClick={() => {
            if (isSeller) {
              navigate('/seller-dashboard');
            } else if (isAdmin) {
              navigate('/admin/orders');
            } else {
              navigate(isCompleted ? '/orders?tab=COMPLETED' : isCancelled ? '/orders?tab=CANCELLED' : '/orders?tab=PENDING');
            }
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 800,
            fontSize: '1.05rem',
            padding: 0
          }}
        >
          <FiArrowLeft size={18} /> {isSeller ? (isKhmer ? 'ត្រឡប់ទៅផ្ទាំងអ្នកលក់' : 'Back') : isAdmin ? (isKhmer ? 'ត្រឡប់ទៅ Admin' : 'Back') : (isKhmer ? 'ព័ត៌មានការបញ្ជាទិញ' : 'Order Details')}
        </button>
      </div>

      {/*  ORDER STATUS CARD (matches video frame 00:00)  */}
      <div className="od-card" style={{ padding: '16px 20px', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-light, #64748b)', fontWeight: 600 }}>
              {isKhmer ? 'ស្ថានភាពការបញ្ជាទិញ' : 'Order Status'}
            </div>
            <div style={{ fontSize: '1.02rem', fontWeight: 900, color: isCompleted ? '#10b981' : isDelivered ? 'var(--text, #0f172a)' : sc.color, marginTop: 2 }}>
              {sc.label}
            </div>
          </div>

          <button
            onClick={() => setShowStatusDetailsModal(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#2563eb',
              fontWeight: 700,
              fontSize: '0.82rem',
              padding: 0
            }}
          >
            {isKhmer ? 'ព័ត៌មានស្ថានភាព' : 'Status Details'}
          </button>
        </div>

        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-light, #f1f5f9)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-light, #64748b)', fontWeight: 600 }}>
            {isKhmer ? 'លេខបញ្ជាទិញ' : 'Order Number'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text, #0f172a)', letterSpacing: '0.02em' }}>
              {formattedOrderNumber}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(formattedOrderNumber);
                toast.success(isKhmer ? 'បានថតចម្លងលេខបញ្ជាទិញ!' : 'Order Number copied!');
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-light, #64748b)',
                padding: 2,
                display: 'flex',
                alignItems: 'center'
              }}
              title="Copy Order Number"
            >
              <FiCopy size={14} />
            </button>
          </div>
        </div>
      </div>

      {/*  SELLER DELIVERY PROOF SCREENSHOT IF AVAILABLE  */}
      {Boolean(extractDeliveryProofUrl(order)) && (
        <div className="od-card" style={{ padding: '14px 18px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <FiShield size={16} color="#10B981" />
            <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: 'var(--text)' }}>
              {isKhmer ? 'ភស្តុតាងនៃការប្រគល់ពីអ្នកលក់' : 'Seller Proof of Delivery'}
            </h4>
            <span style={{ marginLeft: 'auto', background: '#ECFDF5', color: '#059669', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: 6, border: '1px solid #A7F3D0' }}>
              Safe Trade Verified
            </span>
          </div>
          <div
            style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', maxWidth: 360, cursor: 'pointer' }}
            onClick={() => setZoomProofImage(extractDeliveryProofUrl(order))}
          >
            <img
              src={extractDeliveryProofUrl(order)}
              alt="Delivery Proof"
              style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }}
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

      {/*  ACCOUNT DATA CARDS (matches video frame 00:00)  */}
      {order.items?.map((item, idx) => {
        const acc = item.account || (order.manualAccountEmail ? { email: order.manualAccountEmail, password: order.manualAccountPassword, note: order.sellerDeliveryNote } : null);
        const sellerNoteText = acc?.note || acc?.userNote || acc?.label || acc?.instructions || acc?.sellerNote || acc?.additionalInfo || item?.product?.sellerNote || item?.product?.usageInstructions || item?.sellerNote || order?.sellerNote || '';
        const parsedRows = parseAccountRows(acc, sellerNoteText, isKhmer);

        return (
          <div key={item.id || idx} className="od-card">
            {/* Header */}
            <div className="od-card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {isKhmer ? 'ព័ត៌មានគណនី' : 'Account Data'}
              </h3>
              {acc && (
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#2563eb',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                  onClick={() => {
                    const allText = parsedRows.map(r => `${r.label}: ${r.value}`).join('\n');
                    navigator.clipboard.writeText(allText).catch(() => {});
                    toast.success(isKhmer ? 'បានចម្លងព័ត៌មានគណនីទាំងអស់!' : 'All credentials copied!');
                  }}
                >
                  <FiCopy size={13} /> {isKhmer ? 'ចម្លងទាំងអស់' : 'Copy All'}
                </button>
              )}
            </div>

            <div className="od-card-body">
              {parsedRows.length > 0 ? (
                parsedRows.map((row, rIdx) => (
                  <AccountRow
                    key={rIdx}
                    label={row.label}
                    value={row.value}
                    isLong={row.isLong}
                  />
                ))
              ) : (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-light)' }}>
                  {isProcessing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <FiPackage size={26} color="#FBBF24" />
                      <span style={{ fontWeight: 700, color: '#FBBF24' }}>{productName} — {t('orders.deliveryInProgress')}</span>
                      <span style={{ fontSize: '0.8rem', color: 'rgba(251,191,36,0.7)' }}>{t('orders.adminAssigning')}</span>
                    </div>
                  ) : isPending ? (
                    <span style={{ fontSize: '0.85rem' }}>{t('orders.accountsLocked')}</span>
                  ) : (
                    <span style={{ fontSize: '0.85rem' }}>{t('orders.processingAccounts')}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/*  ORDER INFORMATION CARD (matches video frame 00:00)  */}
      <div className="od-card">
        <div className="od-card-header">
          <h3>{isKhmer ? 'ព័ត៌មានការបញ្ជាទិញ' : 'Order Information'}</h3>
          <button
            onClick={() => setShowOrderInfo(v => !v)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.82rem',
              fontWeight: 700
            }}
          >
            {isKhmer ? 'ព័ត៌មានលម្អិត' : 'View Order Details'} {showOrderInfo ? <FiChevronUp size={15}/> : <FiChevronDown size={15}/>}
          </button>
        </div>

        {showOrderInfo && (
          <div className="od-card-body" style={{ padding: '14px 18px' }}>
            {/* Product Item Row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 10,
                  background: 'var(--bg-secondary, #f8fafc)',
                  border: '1px solid var(--border, #e2e8f0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  overflow: 'hidden'
                }}
              >
                {productImg ? (
                  <img src={productImg} alt={productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <FiPackage size={22} color="#4f46e5" />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text)' }}>{productName}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: 2 }}>{categoryName}</div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ea580c', marginTop: 4 }}>
                  USD {totalAmount.toFixed(2)}
                </div>
                <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <InstantBadge />
                </div>
              </div>
            </div>

            {/* Seller Store + Contact Seller */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-light, #f1f5f9)', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.84rem', fontWeight: 700 }}>
                {isSeller ? (
                  <>
                    <FiUser size={16} color="var(--primary)" />
                    <span style={{ color: 'var(--text)' }}>
                      <span style={{ color: 'var(--text-light)', fontWeight: 600 }}>{isKhmer ? 'អតិថិជន៖ ' : 'Customer: '}</span>
                      <strong>{order.customerName || order.user?.name || order.customerEmail || 'Customer'}</strong>
                    </span>
                  </>
                ) : (
                  <Link
                    to={effectiveSellerId ? `/store/${effectiveSellerId}` : '/store'}
                    style={{
                      color: 'var(--text)',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 10px',
                      borderRadius: '8px',
                      background: 'rgba(37, 99, 235, 0.07)',
                      border: '1px solid rgba(37, 99, 235, 0.2)',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    className="od-seller-store-badge"
                    title={isKhmer ? `ចុចដើម្បីមើលហាង ${storeName}` : `Click to view ${storeName} store`}
                  >
                    <MdStorefront size={17} color="#2563eb" />
                    <span style={{ color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 800 }}>
                      <span>{storeName}</span>
                      <MdVerified size={15} color="#1d9bf0" />
                    </span>
                  </Link>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  className="od-contact-btn"
                  onClick={() => {
                    if (isSeller) {
                      navigate(`/chat/seller-customers?order=${order.id}`);
                    } else {
                      setShowInlineChat(v => {
                        if (!v) { loadInlineChat(); setTimeout(() => inlineChatEndRef.current?.scrollIntoView({ behavior: 'auto' }), 200); }
                        return !v;
                      });
                    }
                  }}
                >
                  <FiMessageSquare size={14} /> {isSeller ? (isKhmer ? 'ជជែក' : 'Chat') : (showInlineChat ? (isKhmer ? 'បិទការជជែក' : 'Close Chat') : (isKhmer ? 'ទាក់ទងអ្នកលក់' : 'Contact Seller'))}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Inline Chat Panel */}
        {showInlineChat && (
          <div style={{ borderTop: '1px solid var(--border-light,#f1f5f9)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flex: 1,
                  minWidth: 0,
                  cursor: effectiveSellerId ? 'pointer' : 'default'
                }}
                onClick={() => {
                  if (effectiveSellerId) navigate(`/store/${effectiveSellerId}`);
                }}
                title={effectiveSellerId ? (isKhmer ? `ចុចដើម្បីមើលហាង ${storeName}` : `Click to view ${storeName} store`) : undefined}
              >
                <MdStorefront size={20} color="#2563EB" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#2563EB', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {storeName} <MdVerified size={14} color="#1d9bf0" />
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                    {isKhmer ? 'កំពុងដំណើរការ • ចុចមើលហាង' : 'Active • Click to view store'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate(chatUrl)}
                style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 700, background: 'none', border: '1px solid #2563eb', borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}
              >
                {isKhmer ? 'បើកពេញ' : 'Open Full Chat'}
              </button>
            </div>

            <div style={{ minHeight: 80, maxHeight: 220, overflowY: 'auto', padding: '8px 18px', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {inlineMsgsLoading ? (
                <div style={{ textAlign: 'center', padding: 12, color: 'var(--text-lighter)', fontSize: '0.8rem' }}>{isKhmer ? 'កំពុងទាញយក...' : 'Loading...'}</div>
              ) : inlineMsgs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 12, color: 'var(--text-lighter)', fontSize: '0.78rem' }}>{isKhmer ? 'មិនទាន់មានសារនៅឡើយទេ' : 'No messages yet — say hello!'}</div>
              ) : inlineMsgs.map((msg, i) => {
                const isSent = msg.senderRole === 'USER';
                const timeStr = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                return (
                  <div key={msg.id || i} style={{ display: 'flex', flexDirection: isSent ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 6 }}>
                    <div style={{
                      padding: '7px 11px', borderRadius: isSent ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
                      background: isSent ? '#2563eb' : 'var(--card-bg)',
                      color: isSent ? '#fff' : 'var(--text)',
                      fontSize: '0.82rem', lineHeight: 1.45, maxWidth: '80%', wordBreak: 'break-word'
                    }}>
                      <ChatMediaContent content={msg.content} onImageClick={url => setZoomProofImage(url)} />
                      <div style={{ fontSize: '0.6rem', opacity: .7, marginTop: 2, textAlign: isSent ? 'right' : 'left' }}>{timeStr}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={inlineChatEndRef} style={{ height: 1 }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderTop: '1px solid var(--border)', background: 'var(--card-bg)' }}>
              <input
                ref={inlineInputRef}
                value={inlineInput}
                onChange={e => setInlineInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleInlineSend(); } }}
                placeholder={isKhmer ? 'សរសេរសាររបស់អ្នក...' : 'Write your message...'}
                style={{ flex: 1, height: 36, borderRadius: 18, border: '1px solid var(--border)', padding: '0 12px', background: 'var(--bg-secondary)', fontSize: '0.82rem', outline: 'none', color: 'var(--text)' }}
              />
              <button
                onClick={handleInlineSend}
                disabled={inlineSending || !inlineInput.trim()}
                style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: (inlineInput.trim() && !inlineSending) ? '#2563eb' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (inlineInput.trim() && !inlineSending) ? 'pointer' : 'default', flexShrink: 0 }}
              >
                <FiSend size={13} color="#fff" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/*  PURCHASE INFORMATION CARD (matches video frame 00:00)  */}
      <div className="od-card">
        <div className="od-card-header">
          <h3>{isKhmer ? 'ព័ត៌មានការទូទាត់' : 'Purchase Information'}</h3>
          <button
            onClick={() => setShowStatusDetailsModal(true)}
            style={{ color: '#2563eb', fontWeight: 700, fontSize: '0.82rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {isKhmer ? 'ព័ត៌មានលម្អិត' : 'View Details'}
          </button>
        </div>
        <div className="od-card-body" style={{ padding: '10px 18px 14px' }}>
          {/* Payment Method */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-light,#f1f5f9)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-light, #64748b)', fontWeight: 600 }}>{isKhmer ? 'វិធីបង់ប្រាក់' : 'Payment Method'}</span>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text)' }}>
              {rawPaymentMethod}
            </span>
          </div>
          {/* Total Purchase */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0' }}>
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text)' }}>{isKhmer ? 'ការទូទាត់សរុប' : 'Total Purchase'}</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-light, #64748b)', marginTop: 2 }}>
                {productName}
              </div>
            </div>
            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text)' }}>
              USD {totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/*  ORDER STATUS HISTORY TIMELINE (Table 28: order_status_history)  */}
      {statusHistoryList.length > 0 && (
        <div className="od-card">
          <div className="od-card-header">
            <h3><FiClock style={{ marginRight: 6, color: '#38BDF8' }} /> {isKhmer ? 'ប្រវត្តិនៃស្ថានភាពបញ្ជាទិញ' : 'Order Lifecycle Timeline'}</h3>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-light, #94a3b8)' }}>
              {statusHistoryList.length} {isKhmer ? 'ដំណាក់កាល' : 'Events'}
            </span>
          </div>
          <div className="od-card-body" style={{ padding: '14px 18px' }}>
            <div style={{ position: 'relative', paddingLeft: 18, borderLeft: '2px solid rgba(56, 189, 248, 0.3)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {statusHistoryList.map((hist, idx) => (
                <div key={hist.id || idx} style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: -24,
                    top: 2,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: idx === statusHistoryList.length - 1 ? '#10B981' : '#38BDF8',
                    border: '2px solid var(--card-bg, #fff)'
                  }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text)' }}>
                      {hist.fromStatus !== 'NONE' ? `${hist.fromStatus} -> ` : ''}{hist.toStatus}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-lighter, #64748b)' }}>
                      {hist.createdAt ? new Date(hist.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ''}
                    </span>
                  </div>
                  {hist.notes && (
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-light, #94a3b8)', marginTop: 2 }}>
                      {hist.notes}
                    </div>
                  )}
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-lighter, #64748b)', marginTop: 2, fontStyle: 'italic' }}>
                    {isKhmer ? 'កត់ត្រាដោយ៖ ' : 'Logged by: '} {hist.actorRole}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/*  DELIVERY DISPATCH & CREDENTIALS LOG (Table 29: order_deliveries)  */}
      {deliveriesList.length > 0 && (
        <div className="od-card">
          <div className="od-card-header">
            <h3><FiKey style={{ marginRight: 6, color: '#10B981' }} /> {isKhmer ? 'កំណត់ហេតុការប្រគល់គណនី/កូដ' : 'Fulfillment & Delivery Dispatch'}</h3>
            <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', fontSize: '0.72rem', fontWeight: 800 }}>
              VERIFIED
            </span>
          </div>
          <div className="od-card-body" style={{ padding: '12px 18px' }}>
            {deliveriesList.map((deliv, idx) => (
              <div key={deliv.id || idx} style={{ padding: '10px 0', borderBottom: idx < deliveriesList.length - 1 ? '1px solid var(--border-light, #f1f5f9)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text)' }}>
                    {deliv.deliveryType === 'AUTOMATED_STOCK' ? 'Automated Stock Dispatch' : deliv.deliveryType === 'MANUAL_SELLER' ? 'Manual Seller Delivery' : 'Replacement Fulfillment'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-lighter)' }}>
                    {deliv.deliveredAt ? new Date(deliv.deliveredAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ''}
                  </span>
                </div>
                {deliv.secretPayload && (
                  <div style={{ background: 'var(--bg-secondary, #f8fafc)', padding: '8px 12px', borderRadius: 8, fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--text)', marginBottom: 6, wordBreak: 'break-all' }}>
                    {deliv.secretPayload}
                  </div>
                )}
                {deliv.instructions && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                    <strong>{isKhmer ? 'ការណែនាំ៖' : 'Instructions:'}</strong> {deliv.instructions}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/*  REFUND LEDGER (Table 30: order_refunds)  */}
      {refundsList.length > 0 && (
        <div className="od-card" style={{ borderLeft: '4px solid #8B5CF6' }}>
          <div className="od-card-header">
            <h3 style={{ color: '#8B5CF6', display: 'flex', alignItems: 'center' }}><FiCreditCard style={{ marginRight: 6 }} /> {isKhmer ? 'កំណត់ត្រាសងប្រាក់ត្រឡប់' : 'Refund Processed Ledger'}</h3>
            <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#8B5CF6' }}>
              ${refundsList.reduce((sum, r) => sum + (r.amount || 0), 0).toFixed(2)}
            </span>
          </div>
          <div className="od-card-body" style={{ padding: '12px 18px' }}>
            {refundsList.map((ref, idx) => (
              <div key={ref.id || idx} style={{ fontSize: '0.8rem', color: 'var(--text)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span><strong>{isKhmer ? 'ប្រភេទ៖' : 'Type:'}</strong> {ref.refundType}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-lighter)' }}>{ref.processedAt ? new Date(ref.processedAt).toLocaleDateString() : ''}</span>
                </div>
                <div style={{ color: 'var(--text-light)', fontSize: '0.76rem' }}>{ref.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/*  ACTIVE DISPUTE / REPLACEMENT REQUEST IN PROGRESS CARD  */}
      {order.status === 'DISPUTED' && (
        <div style={{
          margin: '16px 0',
          padding: '16px',
          borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(245,158,11,0.06))',
          border: '1.5px solid rgba(239,68,68,0.35)',
          boxShadow: '0 4px 16px rgba(239,68,68,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #EF4444, #DC2626)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', boxShadow: '0 2px 8px rgba(239,68,68,0.4)', flexShrink: 0
            }}>
              <FiShield size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#991B1B' }}>
                {isKhmer ? 'ការបញ្ជាទិញនេះស្ថិតក្នុងដំណើរការដោះស្រាយក្នុង DISPUTES' : 'Order Under Review in DISPUTES'}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#B91C1C' }}>
                {isKhmer ? 'Safe Trade Protection កំពុងដំណើរការ' : 'Safe Trade Protection Active'}
              </div>
            </div>
          </div>
          <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: 'var(--text-light, #475569)', lineHeight: 1.5 }}>
            {isKhmer
              ? 'សំណើសុំប្តូរទំនិញ/វិវាទរបស់អ្នកត្រូវបានបញ្ជូនទៅកាន់ប្រព័ន្ធ DISPUTES រួចរាល់ហើយ។ អ្នកលក់ និង Admin កំពុងពិនិត្យ និងប្រគល់គណនីប្តូរថ្មីជូន។ ប្រាក់របស់អ្នកត្រូវបានការពារដោយប្រព័ន្ធ Safe Trade រហូតដល់អ្នកទទួលបានគណនីត្រឹមត្រូវ។'
              : 'Your replacement request/dispute has been logged into DISPUTES. The seller is reviewing and preparing the replacement account. Safe Trade holds funds safely until resolved.'}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/chat?mode=user&tab=support')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 8,
                background: '#fff', color: '#1e293b', border: '1px solid #cbd5e1',
                fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              <FiMessageSquare size={13} />
              {isKhmer ? 'ទាក់ទង Admin Support' : 'Contact Support'}
            </button>
          </div>
        </div>
      )}

      {/*  HAVING ORDER ISSUE? REPLACEMENT & DISPUTE ACTIONS  */}
      {order.status !== 'DISPUTED' && (isDelivered || isCompleted) && isBuyer && (
        <div style={{ margin: '14px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Primary 1-to-1 Replacement Button */}
          <button
            onClick={() => setShowReplacementModal(true)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: '1.5px solid #10B981',
              background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.04))',
              color: '#047857',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 2px 8px rgba(16,185,129,0.15)',
              transition: 'all 0.15s ease'
            }}
          >
            <FiRefreshCw size={15} color="#059669" />
            <span>{isKhmer ? 'ស្នើសុំប្តូរគណនីថ្មី (1-to-1 Replace)' : 'Request Replacement (1-to-1 Replace)'}</span>
          </button>

          {/* Secondary Report Issue Button */}
          <button
            onClick={() => setShowDisputeModal(true)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid var(--border, #cbd5e1)',
              background: 'var(--card-bg, #ffffff)',
              color: 'var(--text-light, #64748b)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
              transition: 'all 0.15s ease'
            }}
          >
            <span>{isKhmer ? 'មានបញ្ហាផ្សេងៗ? រាយការណ៍នៅទីនេះ (Disputes)' : 'Other Issue? Report to Disputes'}</span>
          </button>
        </div>
      )}

      {/*  BOTTOM ACTION BAR (matches video frame 00:00 - 00:02 and 00:13 - 00:16)  */}
      {isDelivered && isBuyer && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--card-bg, #ffffff)',
          borderTop: '1px solid var(--border, #e2e8f0)',
          padding: '12px 16px 16px',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
          zIndex: 100
        }}>
          <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.78rem', color: '#059669', fontWeight: 700 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiCheck size={11} />
              </div>
              <span>{isKhmer ? 'ចុចបញ្ចប់ ដើម្បីឱ្យអ្នកលក់ទទួលបានប្រាក់' : 'Press Completed so the seller receives the funds'}</span>
            </div>
            <button
              onClick={handleConfirmReceived}
              disabled={isConfirmingReceived}
              style={{
                width: '100%',
                padding: '13px',
                border: 'none',
                background: '#2563eb',
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.96rem',
                borderRadius: 10,
                cursor: isConfirmingReceived ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                transition: 'all 0.15s ease'
              }}
            >
              {isConfirmingReceived ? (isKhmer ? 'កំពុងបញ្ចប់...' : 'Processing...') : (isKhmer ? 'បានបញ្ចប់' : 'Completed')}
            </button>
          </div>
        </div>
      )}

      {/* COMPLETED STATUS: BUY AGAIN BUTTON & RATE SELLER BUTTON */}
      {isCompleted && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            className="od-buy-btn"
            onClick={() => navigate(productId ? `/product/${productId}` : '/store')}
          >
            <FiShoppingBag size={18} /> {isKhmer ? 'ទិញម្ដងទៀត' : 'Buy Again'}
          </button>

          {isBuyer && !hasReviewed && (
            <button
              onClick={() => {
                setReviewTarget({
                  productId,
                  productName,
                  productImage: productImg,
                  categoryName
                });
              }}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: 10,
                border: '1px solid #f59e0b',
                background: '#fffbeb',
                color: '#d97706',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <FiStar size={16} fill="#f59e0b" color="#f59e0b" />
              <span>{isKhmer ? 'វាយតម្លៃអ្នកលក់' : 'Rate Seller (5 Stars)'}</span>
            </button>
          )}
        </div>
      )}

      {/*  FLOATING SNACKBAR TOAST (matches video frame 00:12 - 00:16)  */}
      {submittedReviewToast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            background: '#1e293b',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
            width: 'calc(100% - 32px)',
            maxWidth: 480,
            animation: 'slideUp 0.25s ease-out'
          }}
        >
          <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>
            {isKhmer ? 'ការវាយតម្លៃរបស់អ្នកត្រូវបានបញ្ជូនដោយជោគជ័យ' : 'Your review was successfully submitted'}
          </span>
          <button
            onClick={() => setSubmittedReviewToast(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#38bdf8',
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: 'pointer',
              padding: '2px 6px'
            }}
          >
            OK
          </button>
        </div>
      )}

      {/*  MODALS  */}
      {isPending && (
        <>
          <PaymentModal
            isOpen={isPaymentModalOpen}
            order={order}
            onClose={() => setIsPaymentModalOpen(false)}
            onPaymentSuccess={fetchOrder}
          />
          <ConfirmCancelOrderModal
            isOpen={isCancelModalOpen}
            orderId={order.id}
            loading={cancelling}
            onClose={() => setIsCancelModalOpen(false)}
            onConfirm={handleConfirmCancel}
          />
        </>
      )}

      {/*  GIVE REVIEW MODAL  */}
      {reviewTarget && (
        <ReviewModal
          productId={reviewTarget.productId}
          orderId={order.id}
          productName={reviewTarget.productName}
          productImage={reviewTarget.productImage}
          categoryName={reviewTarget.categoryName}
          onClose={() => setReviewTarget(null)}
          onSuccess={handleReviewSuccess}
        />
      )}

      {/*  STATUS DETAILS MODAL  */}
      <StatusDetailsModal
        isOpen={showStatusDetailsModal}
        onClose={() => setShowStatusDetailsModal(false)}
        order={order}
      />

      {/*  BUYER DISPUTE MODAL  */}
      {showDisputeModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: 'var(--card-bg, #ffffff)', borderRadius: 20,
            border: '1px solid var(--border)', width: '100%', maxWidth: 480,
            padding: '26px 22px', position: 'relative', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <button
              onClick={() => setShowDisputeModal(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-lighter)' }}
            >
              <FiX size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiAlertTriangle size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: 'var(--text)' }}>
                  {isKhmer ? 'ដាក់ពាក្យបណ្ដឹង និងភស្តុតាង' : 'Open Dispute & Submit Proof'}
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#EF4444', fontWeight: 700 }}>
                  Order #{formattedOrderNumber} · Safe Trade Protection
                </span>
              </div>
            </div>

            <form onSubmit={handleBuyerDisputeSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                  {isKhmer ? 'ប្រភេទបញ្ហា *' : 'Issue Type *'}
                </label>
                <select
                  value={disputeForm.issueType}
                  onChange={e => setDisputeForm(f => ({ ...f, issueType: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: '0.88rem', fontWeight: 600, outline: 'none' }}
                >
                  <option value="ORDER_NOT_RECEIVED">{isKhmer ? 'មិនទាន់ទទួលបានទំនិញ' : 'Order Not Received'}</option>
                  <option value="ACCOUNT_VOUCHER_PROBLEM">{isKhmer ? 'គណនីខុសពាក្យសម្ងាត់ ឬមិនអាចចូលបាន' : 'Invalid Credentials / Account Issue'}</option>
                  <option value="WRONG_INCOMPLETE_PRODUCT">{isKhmer ? 'ខ្វះចំនួន ឬមិនដូចការពិពណ៌នា' : 'Wrong / Incomplete Product'}</option>
                  <option value="OTHER">{isKhmer ? 'បញ្ហាផ្សេងៗ' : 'Other Issue'}</option>
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                  {isKhmer ? 'រៀបរាប់ពីបញ្ហាដែលអ្នកជួបប្រទះ *' : 'Describe the Issue *'}
                </label>
                <textarea
                  rows={3}
                  value={disputeForm.description}
                  onChange={e => setDisputeForm(f => ({ ...f, description: e.target.value }))}
                  placeholder={isKhmer ? 'សូមបញ្ជាក់លម្អិតពីបញ្ហា...' : 'Provide specific details about what is wrong...'}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: '0.85rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                  {isKhmer ? 'បញ្ចូលរូបភាពភស្តុតាង' : 'Upload Proof Screenshots'}
                </label>
                <label style={{
                  padding: '8px 14px', borderRadius: 10, border: '1.5px dashed #2563eb',
                  background: 'rgba(37,99,235,0.06)', color: '#2563eb',
                  cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6
                }}>
                  <FiUpload size={14} />
                  <span>{uploadingDisputeProof ? (isKhmer ? 'កំពុងបញ្ចូលរូបភាព...' : 'Uploading...') : (isKhmer ? '+ ជ្រើសរើសរូបភាពភស្តុតាង' : '+ Upload Screenshot')}</span>
                  <input type="file" accept="image/*" onChange={handleDisputeProofUpload} disabled={uploadingDisputeProof} style={{ display: 'none' }} />
                </label>

                {disputeForm.evidenceImages?.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    {disputeForm.evidenceImages.map((imgUrl, i) => (
                      <div key={i} style={{ position: 'relative', width: 70, height: 70, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <img src={imgUrl} alt="Proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => setDisputeForm(f => ({ ...f, evidenceImages: f.evidenceImages.filter((_, idx) => idx !== i) }))}
                          style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                          <FiX size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  {isKhmer ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submittingDispute || uploadingDisputeProof}
                  style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #EF4444, #DC2626)', color: '#FFFFFF', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 3px 10px rgba(239,68,68,0.3)' }}
                >
                  {submittingDispute ? (isKhmer ? 'កំពុងបញ្ជូន...' : 'Submitting...') : (isKhmer ? 'បញ្ជូនពាក្យបណ្ដឹង' : 'Submit Dispute')}
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

      <PolicyModal
        isOpen={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        initialTab="replacement"
      />
      <ReplacementRequestModal
        isOpen={showReplacementModal}
        onClose={() => setShowReplacementModal(false)}
        order={order}
        onSuccess={handleReplacementSuccess}
      />
    </div>
  );
};

export default OrderDetailPage;
