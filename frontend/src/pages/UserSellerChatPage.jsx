import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { chat as chatApi, orders as ordersApi, seller as sellerApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getProductWelcomeConfig } from './ChatHistoryPage';
import toast from 'react-hot-toast';
import PolicyModal from '../components/PolicyModal';
import ReplacementRequestModal from '../components/ReplacementRequestModal';
import { normalizeImageUrl, isImageMedia, isVideoMedia } from '../utils/imageUrl';
import {
  FiSend, FiArrowLeft, FiRefreshCw, FiPackage,
  FiMessageSquare, FiSearch, FiPaperclip,
  FiChevronRight, FiCheck, FiCheckCircle,
  FiCopy, FiEdit2, FiTrash2, FiX, FiClock, FiShield
} from 'react-icons/fi';

const playNotificationChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (_) {}
};
import { MdStorefront, MdVerified } from 'react-icons/md';

/*  helpers  */
const timeAgo = (dateStr, isKhmer = false) => {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return isKhmer ? 'ទើបតែឥឡូវ' : 'just now';
  if (diff < 3600) return isKhmer ? `${Math.floor(diff / 60)} នាទីមុន` : `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return isKhmer ? `${Math.floor(diff / 3600)} ម៉ោងមុន` : `${Math.floor(diff / 3600)} hr ago`;
  return isKhmer ? `${Math.floor(diff / 86400)} ថ្ងៃមុន` : `${Math.floor(diff / 86400)} days ago`;
};

const formatMsgDate = (dateStr, isKhmer = false) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return isKhmer ? 'ថ្ងៃនេះ' : 'Today';
  if (d.toDateString() === yesterday.toDateString()) return isKhmer ? 'ម្សិលមិញ' : 'Yesterday';
  return isKhmer
    ? d.toLocaleDateString('km-KH', { weekday: 'long', month: 'short', day: 'numeric' })
    : d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
};

const formatTime = (dateStr, isKhmer = false) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff < 1) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff < 7) return isKhmer ? d.toLocaleDateString('km-KH', { weekday: 'short' }) : d.toLocaleDateString('en-US', { weekday: 'short' });
  return isKhmer ? d.toLocaleDateString('km-KH', { month: 'short', day: 'numeric' }) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/*  Store Avatar  */
const StoreAvatar = ({ name, logoUrl, size = 44, borderRadius = 14 }) => {
  const [imgError, setImgError] = useState(false);
  return (
    <div style={{
      width: size, height: size, borderRadius: borderRadius, flexShrink: 0,
      background: (!imgError && logoUrl) ? '#F8FAFC' : 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
      border: '1px solid #E2E8F0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', fontWeight: 800, color: '#2563EB',
      fontSize: size * 0.36, boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    }}>
      {(!imgError && logoUrl) ? (
        <img
          src={logoUrl}
          alt={name}
          referrerPolicy="no-referrer"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setImgError(true)}
        />
      ) : (
        <MdStorefront size={size * 0.52} color="#2563EB" />
      )}
    </div>
  );
};

/*  User Avatar  */
const UserAvatar = ({ name, email, avatarUrl, size = 32 }) => {
  const [imgError, setImgError] = useState(false);
  const display = name || email || '?';
  const initials = display.slice(0, 2).toUpperCase();
  const hue = display.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: (!imgError && avatarUrl) ? '#F8FAFC' : `hsl(${hue},55%,52%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, color: '#fff', fontSize: size * 0.36,
      overflow: 'hidden', border: '1px solid #E2E8F0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    }}>
      {(!imgError && avatarUrl) ? (
        <img
          src={avatarUrl}
          alt={display}
          referrerPolicy="no-referrer"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setImgError(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
};

/*  Order mini-card embedded in chat  */
const OrderCard = ({ orderId, productName, productImg, status, price, navigate, isKhmer = false }) => {
  const statusColor = status === 'COMPLETED' ? '#10b981' : status === 'PENDING' ? '#f59e0b' : '#6366f1';
  return (
    <div style={{
      background: 'var(--card-bg)', border: '1px solid var(--border)',
      borderRadius: 14, padding: 12, marginTop: 8, minWidth: 220, maxWidth: 280,
      boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-secondary)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {productImg
            ? <img src={productImg} alt={productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <FiPackage size={18} color="var(--primary)" />
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{productName || 'Product'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '2px 7px', borderRadius: 99, background: `${statusColor}18`, color: statusColor }}>{status}</span>
            {price ? <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ea580c' }}>USD {Number(price).toFixed(2)}</span> : null}
          </div>
        </div>
      </div>
      <button
        onClick={() => navigate(`/orders/${orderId}`)}
        style={{ marginTop: 10, width: '100%', border: '1.5px solid #6366f1', background: 'transparent', borderRadius: 9, padding: '6px 0', color: '#6366f1', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', transition: 'all .15s' }}
        onMouseEnter={e => { e.target.style.background = '#6366f1'; e.target.style.color = '#fff'; }}
        onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = '#6366f1'; }}
      >
        {isKhmer ? 'មើលការបញ្ជាទិញ' : 'View Order'}
      </button>
    </div>
  );
};

/*  Media attachment content renderer  */
const ChatMediaContent = ({ content, onImageClick, isKhmer = false }) => {
  if (!content) return null;
  const textContent = content.trim();

  if (isVideoMedia(textContent)) {
    const finalUrl = normalizeImageUrl(textContent);
    return (
      <div style={{ marginTop: 2, borderRadius: 12, overflow: 'hidden', maxWidth: 300 }}>
        <video controls style={{ width: '100%', maxHeight: 260, borderRadius: 12, background: '#000', display: 'block' }}>
          <source src={finalUrl} />
          {isKhmer ? 'កម្មវិធីរុករកមិនគាំទ្រការចាក់វីដេអូទេ' : 'Browser does not support video playback.'}
        </video>
      </div>
    );
  }

  if (isImageMedia(textContent)) {
    const finalUrl = normalizeImageUrl(textContent);
    return (
      <div style={{ marginTop: 2, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', maxWidth: 280 }} onClick={() => onImageClick && onImageClick(finalUrl)}>
        <img
          src={finalUrl}
          alt="Attachment"
          style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block', borderRadius: 12 }}
          onError={(e) => {
            e.target.onerror = null;
            if (!e.target.src.includes('/uploads/')) {
              const fname = e.target.src.split('/').pop();
              e.target.src = `/uploads/${fname}`;
            } else if (!e.target.src.includes('/api/admin/uploads/')) {
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

  return <div>{content}</div>;
};

/*  */
const UserSellerChatPage = () => {
  const { user } = useAuth();
  const { isKhmer } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  /*  Data  */
  const [conversations, setConversations] = useState([]); // [{sellerId, storeName, logoUrl, lastMsg, lastTime, orders:[]}]
  const [allMessages, setAllMessages] = useState([]);
  const [ordersMap, setOrdersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [inputText, setInputText] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'
  const [selectedConvId, setSelectedConvId] = useState(null); // sellerId or 'no-seller'
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showReplacementModal, setShowReplacementModal] = useState(false);

  /*  Refs  */
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollingRef = useRef(null);
  const allMsgsRef = useRef([]);

  const initialSelectionDoneRef = useRef(false);

  useEffect(() => {
    // Reset initialSelectionDone flag when query parameter changes
    initialSelectionDoneRef.current = false;
  }, [searchParams]);

  /*  Load data  */
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // 1. Fetch buyer orders (orders placed by this user as a customer)
      const bRes = await ordersApi.getAll().catch(() => ({ data: [] }));
      const buyerOrders = Array.isArray(bRes.data) ? bRes.data : (bRes.data?.data || []);

      // Build ordersMap
      const map = {};
      buyerOrders.forEach(o => { if (o?.id) map[String(o.id)] = o; });
      setOrdersMap(map);

      // 2. Fetch messages
      const mRes = await chatApi.getUserMessages().catch(() => ({ data: [] }));
      const msgs = Array.isArray(mRes.data) ? mRes.data : (mRes.data?.data || []);

      // Filter only USER_SELLER channel for buyer orders
      const sellerMsgs = msgs.filter(m => {
        if (!m) return false;
        if (m.channel === 'USER_SELLER') return true;
        if (m.orderId && map[String(m.orderId)] != null) return true;
        return false;
      });

      // Sort
      sellerMsgs.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

      if (silent && allMsgsRef.current.length > 0 && sellerMsgs.length > allMsgsRef.current.length) {
        const newest = sellerMsgs[sellerMsgs.length - 1];
        if (newest && (newest.senderRole === 'SELLER' || newest.senderRole === 'ADMIN')) {
          playNotificationChime();
        }
      }

      allMsgsRef.current = sellerMsgs;
      setAllMessages(sellerMsgs);

      // 3. Build conversation list grouped by seller store (always buyerOrders in User Mode)
      const convMap = {};
      const ordersForConv = buyerOrders;
      ordersForConv.forEach(ord => {
        const sellerId = ord.sellerId || ord.seller?.id || `order-${ord.id}`;
        const storeName = ord.sellerStoreName
          || ord.seller?.sellerProfile?.storeName
          || ord.seller?.name
          || `Order #${ord.id}`;
        const logoUrl = ord.sellerStoreLogoUrl
          || ord.seller?.sellerProfile?.storeLogoUrl
          || ord.seller?.avatarUrl
          || ord.items?.[0]?.product?.sellerStoreLogoUrl
          || '';
        const key = String(sellerId);
        if (!convMap[key]) {
          convMap[key] = { sellerId: key, storeName, logoUrl, orders: [], lastMsg: null, lastTime: null };
        } else if (!convMap[key].logoUrl && logoUrl) {
          convMap[key].logoUrl = logoUrl;
        }
        convMap[key].orders.push(ord);
      });

      // Attach last message & seller logo from messages
      sellerMsgs.forEach(msg => {
        const ord = map[String(msg.orderId)];
        const sellerId = ord?.sellerId || ord?.seller?.id || (msg.orderId ? `order-${msg.orderId}` : 'default');
        const key = String(sellerId);
        if (convMap[key]) {
          if (!convMap[key].logoUrl && msg.senderRole === 'SELLER' && msg.senderAvatarUrl) {
            convMap[key].logoUrl = msg.senderAvatarUrl;
          }
          const msgTime = new Date(msg.createdAt || 0);
          if (!convMap[key].lastTime || msgTime > new Date(convMap[key].lastTime)) {
            convMap[key].lastMsg = msg.content || (msg.deleted ? '[deleted]' : '');
            convMap[key].lastTime = msg.createdAt;
          }
        }
      });

      // Sort conversations by last activity
      const convList = Object.values(convMap).sort((a, b) =>
        new Date(b.lastTime || 0) - new Date(a.lastTime || 0)
      );
      setConversations(convList);

      // Auto-select ONLY on initial load or if no conversation is currently selected
      if (!initialSelectionDoneRef.current) {
        const urlOrder = searchParams.get('order');
        if (urlOrder && map[urlOrder]) {
          const ord = map[urlOrder];
          const sid = String(ord.seller?.id || ord.sellerId || `order-${ord.id}`);
          setSelectedConvId(sid);
          setMobileView('chat');
          initialSelectionDoneRef.current = true;
        } else if (urlOrder && convList.length > 0) {
          for (const conv of convList) {
            if (conv.orders.some(o => String(o.id) === String(urlOrder))) {
              setSelectedConvId(conv.sellerId);
              setMobileView('chat');
              initialSelectionDoneRef.current = true;
              break;
            }
          }
        } else if (convList.length > 0) {
          setSelectedConvId(prev => prev || convList[0].sellerId);
          initialSelectionDoneRef.current = true;
        }
      } else {
        // Safe background update: preserve existing selection
        setSelectedConvId(prev => prev || (convList.length > 0 ? convList[0].sellerId : null));
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadData(false).then(() => scrollToBottom('auto'));
    pollingRef.current = setInterval(() => loadData(true), 3000);
    return () => clearInterval(pollingRef.current);
  }, []);

  /*  Scroll  */
  const scrollToBottom = (behavior = 'smooth') => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 60);
  };

  useEffect(() => { scrollToBottom('smooth'); }, [allMessages.length, selectedConvId]);

  /*  Derived: current conversation & active order  */
  const selectedConv = conversations.find(c => c.sellerId === selectedConvId) || null;
  const selectedOrderIds = new Set((selectedConv?.orders || []).map(o => String(o.id)));
  const currentMessages = allMessages.filter(m => selectedOrderIds.has(String(m.orderId)));

  // Pick active order (selected or most recent)
  const activeOrder = selectedConv?.orders?.find(o => String(o.id) === String(selectedOrderId))
    || selectedConv?.orders?.sort((a, b) => Number(b.id) - Number(a.id))[0]
    || null;

  const activeProdName = activeOrder?.items?.[0]?.product?.name || activeOrder?.productName || '';
  const welcomeCfg = getProductWelcomeConfig(activeProdName, activeOrder?.id, isKhmer);
  const claimPrompts = welcomeCfg?.quickPrompts || [];

  /*  Media Attachment Upload  */
  const handleMediaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) {
      toast.error(isKhmer ? 'ទំហំឯកសារធំពេក (អតិបរមា 30MB)' : 'File size too large (max 30MB)');
      return;
    }

    setUploadingMedia(true);
    const toastId = toast.loading(isKhmer ? 'កំពុងផ្ទុកឡើងឯកសារ...' : 'Uploading file...');

    try {
      const res = await chatApi.uploadMedia(file);
      const mediaUrl = res.data?.data || res.data;
      if (mediaUrl) {
        toast.success(isKhmer ? 'បានផ្ញើឯកសារជោគជ័យ!' : 'File uploaded!', { id: toastId });
        await handleSend(mediaUrl);
      } else {
        toast.error(isKhmer ? 'មិនអាចផ្ទុកឡើងឯកសារបានទេ' : 'Upload failed', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error(isKhmer ? 'មិនអាចផ្ទុកឡើងឯកសារបានទេ' : 'Failed to upload file', { id: toastId });
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /*  Send  */
  const handleSend = async (text, targetOrderObj) => {
    const content = (text || inputText).trim();
    const orderToUse = targetOrderObj || activeOrder;
    if (!content || sending || !orderToUse) return;
    setSending(true);
    setInputText('');

    const tempMsg = {
      id: 'tmp-' + Date.now(), orderId: orderToUse.id,
      senderRole: 'USER', senderEmail: user?.email,
      content, channel: 'USER_SELLER',
      createdAt: new Date().toISOString(), _temp: true
    };
    setAllMessages(prev => { const n = [...prev, tempMsg]; allMsgsRef.current = n; return n; });
    scrollToBottom('smooth');

    try {
      const lang = isKhmer ? 'km' : 'en';
      await chatApi.sendMessage(orderToUse.id, content, null, lang, 'USER_SELLER');
      await loadData(true);
    } catch {
      toast.error(isKhmer ? 'មិនអាចផ្ញើសារបានទេ' : 'Failed to send message');
      setAllMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  /*  Filtered conversation list  */
  const filteredConvs = filterQuery.trim()
    ? conversations.filter(c => c.storeName.toLowerCase().includes(filterQuery.toLowerCase()))
    : conversations;

  /*  */
  return (
    <div className="usc-container" style={{ display: 'flex', height: 'calc(100vh - 70px)', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
      <style>{`
        .usc-container { height: calc(100vh - 70px); }
        .usc-sidebar { width: 340px; flex-shrink: 0; display: flex; flex-direction: column; background: var(--card-bg); border-right: 1px solid var(--border); }
        .usc-conv-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; cursor: pointer; border-bottom: 1px solid var(--border-light, #f8fafc); transition: background .15s; }
        .usc-conv-item:hover { background: var(--bg-secondary); }
        .usc-conv-item.active { background: rgba(99,102,241,0.07); border-left: 3px solid var(--primary); }
        .usc-chat-area { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .usc-msg-bubble-received { background: var(--card-bg); border: 1px solid var(--border); color: var(--text); border-radius: 4px 16px 16px 16px; }
        .usc-msg-bubble-sent { background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; border-radius: 16px 4px 16px 16px; }
        @keyframes usc-fade { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        .usc-msg-in { animation: usc-fade .2s ease both; }
        .usc-mobile-back { display: none; }
        @media (max-width: 768px) {
          .usc-container { height: calc(100dvh - 60px - 64px) !important; }
        }
        @media (max-width: 640px) {
          .usc-sidebar { width: 100%; position: absolute; z-index: 10; height: 100%; }
          .usc-sidebar.mobile-hidden { display: none; }
          .usc-chat-area.mobile-hidden { display: none; }
          .usc-mobile-back { display: flex !important; align-items: center; justify-content: center; }
          .usc-header-actions { gap: 4px !important; }
          .usc-action-btn {
            padding: 6px 8px !important;
            min-width: 34px !important;
            height: 34px !important;
            border-radius: 9px !important;
          }
          .usc-btn-text {
            display: none !important;
          }
        }
      `}</style>

      {/*  LEFT SIDEBAR  */}
      <div className={`usc-sidebar${mobileView === 'chat' ? ' mobile-hidden' : ''}`}>
        {/* Header */}
        <div style={{ padding: '16px 16px 10px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <button onClick={() => navigate('/orders')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', display: 'flex', alignItems: 'center' }}>
              <FiArrowLeft size={18} />
            </button>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>
              {isKhmer ? 'ប្រអប់សារ' : 'Inbox'}
            </h2>
            <button onClick={() => loadData(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
              <FiRefreshCw size={15} />
            </button>
          </div>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-lighter)' }} />
            <input
              placeholder={isKhmer ? 'ស្វែងរកហាង...' : 'Search stores...'}
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: 30, paddingRight: 10, height: 34, borderRadius: 20, border: '1px solid var(--border)', background: 'var(--bg-secondary)', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box', color: 'var(--text)' }}
            />
          </div>
        </div>

        {/* History notice */}
        <div style={{ padding: '6px 16px', fontSize: '0.73rem', color: 'var(--text-lighter)', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <FiClock size={11} /> {isKhmer ? 'ប្រវត្តិការសន្ទនាចាស់ទាំងអស់នៅទីនេះ' : 'Check old message history here.'}
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-lighter)' }}>
              <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                {[0,1,2].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', display: 'inline-block', animation: `usc-fade 1.2s ${i*0.2}s infinite` }} />)}
              </div>
            </div>
          ) : filteredConvs.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-lighter)' }}>
              <MdStorefront size={36} style={{ opacity: .3, marginBottom: 8 }} />
              <div style={{ fontSize: '0.85rem' }}>{isKhmer ? 'គ្មានការសន្ទនានៅឡើយ' : 'No conversations yet'}</div>
            </div>
          ) : filteredConvs.map(conv => (
            <div
              key={conv.sellerId}
              className={`usc-conv-item${selectedConvId === conv.sellerId ? ' active' : ''}`}
              onClick={() => { setSelectedConvId(conv.sellerId); setMobileView('chat'); }}
            >
              <StoreAvatar name={conv.storeName} logoUrl={conv.logoUrl} size={46} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {conv.storeName}
                    <MdVerified size={14} color="#1d9bf0" />
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-lighter)', flexShrink: 0 }}>{formatTime(conv.lastTime, isKhmer)}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                  {conv.lastMsg || (isKhmer ? 'មិនទាន់មានសារ' : 'No messages yet')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/*  RIGHT CHAT PANEL  */}
      <div className={`usc-chat-area${mobileView === 'list' ? ' mobile-hidden' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
        {!selectedConv ? (
          /* Empty state */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-lighter)', gap: 14 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiMessageSquare size={32} color="var(--primary)" style={{ opacity: .5 }} />
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{isKhmer ? 'ជ្រើសរើសការសន្ទនា' : 'Select a conversation'}</div>
          </div>
        ) : (
          <>
            {/*  Chat Header  */}
            <div style={{
              padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--card-bg)', borderBottom: '1px solid var(--border)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)', flexShrink: 0, minWidth: 0
            }}>
              {/* Mobile back button */}
              <button
                type="button"
                onClick={() => setMobileView('list')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: 4, flexShrink: 0 }}
                className="usc-mobile-back"
                title={isKhmer ? 'ត្រឡប់ក្រោយ' : 'Back'}
              >
                <FiArrowLeft size={18} />
              </button>

              <StoreAvatar
                name={selectedConv.storeName}
                logoUrl={selectedConv.logoUrl || currentMessages.find(m => m.senderRole === 'SELLER' && m.senderAvatarUrl)?.senderAvatarUrl || activeOrder?.sellerStoreLogoUrl}
                size={40}
              />

              {/* Store Title & Online Status */}
              <div 
                style={{ flex: 1, minWidth: 0, overflow: 'hidden', cursor: selectedConv.sellerId ? 'pointer' : 'default' }}
                onClick={() => {
                  if (selectedConv.sellerId) {
                    navigate(`/store/${selectedConv.sellerId}`);
                  }
                }}
                title={selectedConv.sellerId ? (isKhmer ? `ចុចដើម្បីមើលហាង ${selectedConv.storeName}` : `Click to view ${selectedConv.storeName} store`) : undefined}
              >
                <div style={{
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  color: 'var(--text)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#2563EB' }}>
                    {selectedConv.storeName}
                  </span>
                  <MdVerified size={15} color="#1d9bf0" style={{ flexShrink: 0 }} />
                </div>
                <div style={{
                  fontSize: '0.72rem',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  marginTop: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {isKhmer ? 'អនឡាញ · ឆ្លើយតបភ្លាមៗ' : 'Online · replies instantly'}
                  </span>
                </div>
              </div>

              {/* Order List & Admin Support Action buttons */}
              <div className="usc-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => {
                    if (activeOrder) {
                      setShowReplacementModal(true);
                    } else {
                      setShowPolicyModal(true);
                    }
                  }}
                  className="usc-action-btn"
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    padding: '7px 12px', borderRadius: 10, border: '1px solid #A7F3D0',
                    background: '#ECFDF5', color: '#059669', fontWeight: 800,
                    fontSize: '0.78rem', cursor: 'pointer', transition: 'all .15s', flexShrink: 0
                  }}
                  title={isKhmer ? 'ស្នើសុំប្តូរគណនីថ្មីក្នុង DISPUTES' : 'Request Replacement in DISPUTES'}
                >
                  <FiRefreshCw size={13} style={{ flexShrink: 0 }} />
                  <span className="usc-btn-text">{isKhmer ? 'ស្នើសុំប្តូរថ្មី' : '1-to-1 Replace'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/chat?mode=user&tab=support')}
                  className="usc-action-btn"
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    padding: '7px 12px', borderRadius: 10, border: '1px solid #C7D2FE',
                    background: 'rgba(99, 102, 241, 0.08)', color: '#4F46E5', fontWeight: 700,
                    fontSize: '0.78rem', cursor: 'pointer', transition: 'all .15s', flexShrink: 0
                  }}
                  title={isKhmer ? 'ប្តឹង ឬទាក់ទងមកកាន់ Admin Support' : 'Contact Admin Support'}
                >
                  <FiShield size={13} style={{ flexShrink: 0 }} />
                  <span className="usc-btn-text">{isKhmer ? 'ជំនួយ Admin' : 'Admin Support'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const firstOrder = activeOrder || selectedConv?.orders?.[0];
                    if (firstOrder?.id) {
                      navigate(`/orders/${firstOrder.id}`);
                    } else {
                      navigate('/orders');
                    }
                  }}
                  className="usc-action-btn"
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    padding: '7px 12px', borderRadius: 10, border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)', color: 'var(--text)', fontWeight: 700,
                    fontSize: '0.78rem', cursor: 'pointer', transition: 'all .15s', flexShrink: 0
                  }}
                  title={isKhmer ? 'មើលការបញ្ជាទិញ' : 'Order List'}
                >
                  <FiPackage size={13} style={{ flexShrink: 0 }} />
                  <span className="usc-btn-text">{isKhmer ? 'ការបញ្ជាទិញ' : 'Order List'}</span>
                  <FiChevronRight size={12} className="usc-btn-text" style={{ opacity: .6 }} />
                </button>
              </div>
            </div>

            {/* Replace Policy Banner */}
            <div style={{
              padding: '8px 14px', background: 'linear-gradient(135deg, rgba(79,70,229,0.06), rgba(16,185,129,0.06))',
              borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: '6px 10px',
              fontSize: '0.75rem', color: '#4338CA', fontWeight: 700
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 200, lineHeight: 1.4 }}>
                <FiShield size={14} color="#4F46E5" style={{ flexShrink: 0 }} />
                <span style={{ wordBreak: 'break-word' }}>
                  {isKhmer ? 'ការបញ្ជាទិញនេះទទួលបានការធានាប្តូរថ្មី ១ ជំនួស ១ ប្រសិនបើខុស Password ឬផុតកំណត់មុនពេល។' : 'Protected by 100% 1-to-1 Replacement Policy throughout your warranty duration.'}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setShowPolicyModal(true)}
                style={{ background: 'none', border: 'none', color: '#4F46E5', fontWeight: 800, fontSize: '0.74rem', cursor: 'pointer', textDecoration: 'underline', padding: 0, whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                {isKhmer ? 'មើលលម្អិត' : 'View Policy'}
              </button>
            </div>

            {/*  Messages  */}
            <div ref={messagesContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--bg-secondary)' }}>
              {currentMessages.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-lighter)', gap: 10 }}>
                  <FiMessageSquare size={28} style={{ opacity: .3 }} />
                  <div style={{ fontSize: '0.85rem' }}>{isKhmer ? 'មិនទាន់មានសារ — ចាប់ផ្ដើមការសន្ទនា!' : 'No messages yet — start the conversation!'}</div>
                </div>
              ) : (() => {
                const items = [];
                let lastDate = null;
                currentMessages.forEach((msg, idx) => {
                  const msgDate = formatMsgDate(msg.createdAt, isKhmer);
                  if (msgDate && msgDate !== lastDate) {
                    lastDate = msgDate;
                    items.push(
                      <div key={`date-${idx}`} style={{ textAlign: 'center', margin: '16px 0 8px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-lighter)', background: 'var(--card-bg)', padding: '4px 14px', borderRadius: 20, border: '1px solid var(--border)' }}>
                          {msgDate}
                        </span>
                      </div>
                    );
                  }

                  const isSent = msg.senderRole === 'USER' || msg.senderEmail === user?.email;
                  const prev = currentMessages[idx - 1];
                  const samePrev = prev && prev.senderRole === msg.senderRole;
                  const timeStr = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                  // Check if msg references an order
                  const refOrder = msg.orderId ? ordersMap[String(msg.orderId)] : null;
                  const showOrderCard = refOrder && (msg.content || '').toLowerCase().includes('order');

                  items.push(
                    <div key={msg.id || idx} className="usc-msg-in"
                      style={{ display: 'flex', flexDirection: isSent ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, marginTop: samePrev ? 3 : 14 }}
                    >
                      {/* Avatar — only on first of group */}
                      {samePrev ? (
                        <div style={{ width: 32, flexShrink: 0 }} />
                      ) : isSent ? (
                        <UserAvatar name={user?.name} email={user?.email} avatarUrl={msg.senderAvatarUrl || user?.avatarUrl || user?.avatar} size={32} />
                      ) : (
                        <StoreAvatar name={selectedConv.storeName} logoUrl={msg.senderAvatarUrl || selectedConv.logoUrl} size={32} />
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isSent ? 'flex-end' : 'flex-start', maxWidth: '72%' }}>
                        {/* Bubble */}
                        {!msg.deleted ? (
                          <div className={isSent ? 'usc-msg-bubble-sent' : 'usc-msg-bubble-received'}
                            style={{ padding: '10px 14px', fontSize: '0.88rem', lineHeight: 1.55, wordBreak: 'break-word', whiteSpace: 'pre-wrap', boxShadow: isSent ? '0 2px 10px rgba(99,102,241,.2)' : '0 1px 4px rgba(0,0,0,.06)' }}
                          >
                            <ChatMediaContent content={msg.content} onImageClick={url => setPreviewImage(url)} isKhmer={isKhmer} />
                          </div>
                        ) : (
                          <div style={{ padding: '8px 12px', fontSize: '0.82rem', color: 'var(--text-lighter)', fontStyle: 'italic', border: '1px dashed var(--border)', borderRadius: 12 }}>
                            {isKhmer ? 'សារត្រូវបានលុប' : 'Message deleted'}
                          </div>
                        )}

                        {/* Embedded order card */}
                        {refOrder && idx === 0 && (
                          <OrderCard
                            orderId={refOrder.id}
                            productName={refOrder.items?.[0]?.product?.name || refOrder.items?.[0]?.productName}
                            productImg={refOrder.items?.[0]?.product?.imageUrl || refOrder.items?.[0]?.productImageUrl}
                            status={refOrder.status}
                            price={refOrder.totalAmount}
                            navigate={navigate}
                            isKhmer={isKhmer}
                          />
                        )}

                        {/* Timestamp */}
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-lighter)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          {timeStr}
                          {isSent && <FiCheck size={11} color="#a5b4fc" />}
                        </div>
                      </div>
                    </div>
                  );
                });
                return items;
              })()}
              <div ref={messagesEndRef} style={{ height: 1 }} />
            </div>



            {/*  Quick Prompt Chips & Replace Policy Chips  */}
            <div style={{
              padding: '8px 14px 6px',
              background: 'var(--card-bg)',
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              borderTop: '1px solid var(--border-light, #f1f5f9)',
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch'
            }}>
              {/* Direct Request Replacement in Disputes action */}
              <button
                type="button"
                onClick={() => {
                  if (activeOrder) {
                    setShowReplacementModal(true);
                  } else {
                    navigate('/orders');
                  }
                }}
                style={{ padding: '5px 12px', borderRadius: 16, border: '1px solid #C7D2FE', background: 'rgba(99,102,241,0.08)', color: '#4F46E5', fontSize: '0.76rem', fontWeight: 800, cursor: 'pointer', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <FiRefreshCw size={11} color="#4F46E5" />
                <span>{isKhmer ? 'ស្នើសុំប្តូរគណនីថ្មី (ការធានា ១ ជំនួស ១)' : 'Request Replacement (1-to-1 Replace)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPolicyModal(true)}
                style={{ padding: '5px 12px', borderRadius: 16, border: '1px solid #A7F3D0', background: '#ECFDF5', color: '#059669', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <FiShield size={11} color="#10B981" />
                <span>{isKhmer ? 'គោលការណ៍ធានាប្តូរថ្មី' : 'Replacement Policy'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSend(isKhmer ? 'ជម្រាបសួរ! ខ្ញុំត្រូវការជំនួយបន្ថែមលើការប្រើប្រាស់ផលិតផលនេះ។' : 'Hello! I need some assistance with using this product.')}
                disabled={sending}
                style={{ padding: '5px 12px', borderRadius: 16, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <FiMessageSquare size={11} color="var(--primary)" />
                <span>{isKhmer ? 'ជំនួយការប្រើប្រាស់' : 'Usage Assistance'}</span>
              </button>

              {claimPrompts && claimPrompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(p)}
                  disabled={sending}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 16,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text)',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.color = '#6366F1'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}
                >
                  {p}
                </button>
              ))}
            </div>

            {/*  Input bar  */}
            <div style={{
              padding: '10px 16px', background: 'var(--card-bg)',
              borderTop: '1px solid var(--border)', display: 'flex',
              alignItems: 'center', gap: 10, flexShrink: 0
            }}>
              {/* Hidden Media Input */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,video/*"
                style={{ display: 'none' }}
                onChange={handleMediaUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingMedia}
                style={{ background: 'none', border: 'none', cursor: uploadingMedia ? 'wait' : 'pointer', color: uploadingMedia ? '#6366F1' : 'var(--text-lighter)', display: 'flex', alignItems: 'center', padding: 4 }}
                title={isKhmer ? 'ផ្ញើរូបភាព ឬវីដេអូ' : 'Send Image or Video'}
              >
                <FiPaperclip size={18} />
              </button>

              <input
                ref={inputRef}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={isKhmer ? 'វាយសារនៅទីនេះ...' : 'Type your message here'}
                style={{
                  flex: 1, height: 42, borderRadius: 22, border: '1px solid var(--border)',
                  padding: '0 16px', background: 'var(--bg-secondary)',
                  fontSize: '0.88rem', outline: 'none', color: 'var(--text)'
                }}
              />

              <button
                onClick={() => handleSend()}
                disabled={sending || !inputText.trim()}
                style={{
                  width: 42, height: 42, borderRadius: '50%', border: 'none',
                  background: (inputText.trim() && !sending) ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: (inputText.trim() && !sending) ? 'pointer' : 'default',
                  flexShrink: 0, transition: 'all .2s',
                  boxShadow: (inputText.trim() && !sending) ? '0 3px 12px rgba(99,102,241,.35)' : 'none'
                }}
              >
                <FiSend size={16} color={(inputText.trim() && !sending) ? '#fff' : 'var(--text-lighter)'} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Lightbox Modal for Image Preview */}
      {previewImage && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <FiX size={24} />
          </button>
          <img src={previewImage} alt="Preview" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 12, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} />
        </div>
      )}


      {/* Policy Modal for Replacement Policy */}
      <PolicyModal
        isOpen={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        initialTab="replacement"
      />

      {/* Replacement Request Modal (Disputes) */}
      <ReplacementRequestModal
        isOpen={showReplacementModal}
        onClose={() => setShowReplacementModal(false)}
        order={activeOrder}
        onSuccess={() => {
          loadData(true);
        }}
      />
    </div>
  );
};

export default UserSellerChatPage;
