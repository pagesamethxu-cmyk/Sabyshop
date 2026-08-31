import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { chat as chatApi, seller as sellerApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import PolicyModal from '../components/PolicyModal';
import { normalizeImageUrl, isImageMedia, isVideoMedia } from '../utils/imageUrl';
import {
  FiSend, FiArrowLeft, FiRefreshCw, FiPackage,
  FiMessageSquare, FiSearch, FiPaperclip,
  FiChevronRight, FiCheck, FiUser, FiShoppingBag, FiClock, FiX, FiShield,
  FiAlertTriangle, FiCheckCircle, FiExternalLink
} from 'react-icons/fi';

/*  Helpers  */
const formatTime = (dateStr, isKhmer = false) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const diff = Math.floor((Date.now() - d) / 86400000);
  if (diff < 1) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff < 7) return isKhmer ? d.toLocaleDateString('km-KH', { weekday: 'short' }) : d.toLocaleDateString('en-US', { weekday: 'short' });
  return isKhmer ? d.toLocaleDateString('km-KH', { month: 'short', day: 'numeric' }) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatMsgDate = (dateStr, isKhmer = false) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return isKhmer ? 'ថ្ងៃនេះ' : 'Today';
  if (d.toDateString() === yesterday.toDateString()) return isKhmer ? 'ម្សិលមិញ' : 'Yesterday';
  return isKhmer
    ? d.toLocaleDateString('km-KH', { weekday: 'short', month: 'short', day: 'numeric' })
    : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

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

const SELLER_QUICK_REPLIES_KH = [
  'សួស្តី! ត្រូវការជំនួយអ្វីដែរ?',
  'ធានាប្តូរថ្មី ១០០% ពេលមានបញ្ហា',
  'បានផ្ញើគណនីប្តូរថ្មីជូនរួចរាល់!',
  'សូមផ្ញើរូប Screenshot បង្ហាញ Error',
  'គណនីបានប្រគល់ជូនរួចរាល់',
  'អរគុណសម្រាប់ការទិញទំនិញ!'
];

const SELLER_QUICK_REPLIES_EN = [
  'Hello! How can I assist you?',
  '100% Replacement Warranty',
  'Replacement credentials sent!',
  'Please share error screenshot',
  'Credentials delivered, please check',
  'Thank you for shopping with us!'
];

const UserAvatar = ({ name, email, avatarUrl, size = 42 }) => {
  const [imgError, setImgError] = useState(false);
  const display = name || email || '?';
  const initials = display.slice(0, 2).toUpperCase();
  const hue = display.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: (!imgError && avatarUrl) ? '#F8FAFC' : `hsl(${hue}, 60%, 48%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, color: '#fff', fontSize: size * 0.36,
      overflow: 'hidden', border: '2px solid #E2E8F0',
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

const StoreAvatar = ({ name, logoUrl, size = 32, borderRadius = 10 }) => {
  const [imgError, setImgError] = useState(false);
  return (
    <div style={{
      width: size, height: size, borderRadius: borderRadius, flexShrink: 0,
      background: (!imgError && logoUrl) ? '#F8FAFC' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      border: '1px solid #E2E8F0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', fontWeight: 800, color: '#ffffff',
      fontSize: size * 0.36, boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
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
        (name || 'S').slice(0, 1).toUpperCase()
      )}
    </div>
  );
};

/*  Media Attachment Renderer  */
const ChatMediaContent = ({ content, onImageClick, isKhmer = false }) => {
  if (!content) return null;
  const textContent = content.trim();

  if (isVideoMedia(textContent)) {
    const finalUrl = normalizeImageUrl(textContent);
    return (
      <div style={{ marginTop: 4, borderRadius: 12, overflow: 'hidden', maxWidth: 280 }}>
        <video controls style={{ width: '100%', maxHeight: 240, borderRadius: 12, background: '#000', display: 'block' }}>
          <source src={finalUrl} />
          {isKhmer ? 'មិនគាំទ្រការចាក់វីដេអូទេ' : 'Video not supported'}
        </video>
      </div>
    );
  }

  if (isImageMedia(textContent)) {
    const finalUrl = normalizeImageUrl(textContent);
    return (
      <div style={{ marginTop: 4, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', maxWidth: 280 }} onClick={() => onImageClick && onImageClick(finalUrl)}>
        <img
          src={finalUrl}
          alt="Attachment"
          style={{ width: '100%', maxHeight: 260, objectFit: 'cover', display: 'block', borderRadius: 12 }}
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
const SellerCustomerInboxPage = ({ height }) => {
  const { user } = useAuth();
  const { isKhmer } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const [ordersMap, setOrdersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [inputText, setInputText] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);


  /*  Refs & Scroll  */
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollingRef = useRef(null);
  const allMsgsRef = useRef([]);

  /*  Load Data  */
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // 1. Seller orders
      const oRes = await sellerApi.getOrders().catch(() => ({ data: [] }));
      const sellerOrders = Array.isArray(oRes.data) ? oRes.data : (oRes.data?.data || []);
      const map = {};
      sellerOrders.forEach(o => { if (o?.id) map[String(o.id)] = o; });
      setOrdersMap(map);

      // 2. Customer messages
      const mRes = await chatApi.getSellerCustomerChats().catch(() => ({ data: [] }));
      const msgs = Array.isArray(mRes.data) ? mRes.data : (mRes.data?.data || []);
      const sorted = [...msgs].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

      if (silent && allMsgsRef.current.length > 0 && sorted.length > allMsgsRef.current.length) {
        const newest = sorted[sorted.length - 1];
        if (newest && newest.senderRole === 'USER') {
          playNotificationChime();
        }
      }

      allMsgsRef.current = sorted;
      setAllMessages(sorted);

      // 3. Group by buyer email
      const convMap = {};
      sellerOrders.forEach(ord => {
        const bEmail = ord?.user?.email || ord?.customerEmail;
        if (!bEmail) return;
        if (!convMap[bEmail]) {
          convMap[bEmail] = {
            buyerEmail: bEmail,
            buyerName: ord?.user?.name || bEmail.split('@')[0],
            buyerAvatarUrl: ord?.user?.avatarUrl || ord?.user?.avatar || '',
            orders: [],
            lastMsg: null,
            lastTime: null
          };
        }
        if (!convMap[bEmail].orders.find(o => String(o.id) === String(ord.id))) {
          convMap[bEmail].orders.push(ord);
        }
      });

      sorted.forEach(msg => {
        const ord = map[String(msg.orderId)];
        const bEmail = msg.senderRole === 'USER'
          ? msg.senderEmail
          : (ord?.user?.email || ord?.customerEmail || msg.targetEmail);
        if (!bEmail) return;

        if (!convMap[bEmail]) {
          convMap[bEmail] = {
            buyerEmail: bEmail,
            buyerName: msg.senderName || (ord?.user?.name || bEmail.split('@')[0]),
            buyerAvatarUrl: (msg.senderRole === 'USER' ? msg.senderAvatarUrl : '') || ord?.user?.avatarUrl || '',
            orders: [],
            lastMsg: null,
            lastTime: null
          };
        }
        if (msg.senderRole === 'USER' && msg.senderAvatarUrl && !convMap[bEmail].buyerAvatarUrl) {
          convMap[bEmail].buyerAvatarUrl = msg.senderAvatarUrl;
        }
        if (ord && !convMap[bEmail].orders.find(o => String(o.id) === String(msg.orderId))) {
          convMap[bEmail].orders.push(ord);
        }
        const t = new Date(msg.createdAt || 0);
        if (!convMap[bEmail].lastTime || t > new Date(convMap[bEmail].lastTime)) {
          convMap[bEmail].lastMsg = msg.content;
          convMap[bEmail].lastTime = msg.createdAt;
        }
      });

      const convList = Object.values(convMap).sort((a, b) => new Date(b.lastTime || 0) - new Date(a.lastTime || 0));
      setConversations(convList);

      if (!selectedBuyer && convList.length > 0) {
        setSelectedBuyer(convList[0].buyerEmail);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [selectedBuyer]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 60);
  };

  useEffect(() => {
    loadData(false).then(() => scrollToBottom());
    pollingRef.current = setInterval(() => loadData(true), 3000);
    return () => clearInterval(pollingRef.current);
  }, [loadData]);

  useEffect(() => {
    scrollToBottom();
  }, [allMessages.length, selectedBuyer]);

  /*  Derived State  */
  const selectedConv = conversations.find(c => c.buyerEmail === selectedBuyer) || null;
  const selectedOrderIds = new Set((selectedConv?.orders || []).map(o => String(o.id)));
  const currentMessages = allMessages.filter(m => selectedOrderIds.has(String(m.orderId)));
  const defaultOrder = selectedConv?.orders?.sort((a, b) => Number(b.id) - Number(a.id))[0] || null;

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

  /*  Send Message  */
  const handleSend = async (customText) => {
    const content = (typeof customText === 'string' ? customText : inputText).trim();
    if (!content || sending || !defaultOrder) return;
    setSending(true);
    if (typeof customText !== 'string') setInputText('');

    const tempMsg = {
      id: 'tmp-' + Date.now(),
      orderId: defaultOrder.id,
      senderRole: 'SELLER',
      senderEmail: user?.email,
      content,
      channel: 'USER_SELLER',
      createdAt: new Date().toISOString(),
      _temp: true
    };
    setAllMessages(prev => [...prev, tempMsg]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);

    try {
      const lang = isKhmer ? 'km' : 'en';
      await chatApi.sendMessage(defaultOrder.id, content, selectedBuyer, lang, 'USER_SELLER');
      await loadData(true);
    } catch {
      toast.error(isKhmer ? 'មិនអាចផ្ញើសារបានទេ' : 'Failed to send message');
      setAllMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const filteredConvs = filterQuery.trim()
    ? conversations.filter(c => (c.buyerName || c.buyerEmail).toLowerCase().includes(filterQuery.toLowerCase()))
    : conversations;

  /*  Render  */
  return (
    <div className="sci-wrapper" style={{ height: height || 'calc(100vh - 140px)', minHeight: 520 }}>
      <style>{`
        .sci-wrapper {
          display: flex;
          width: 100%;
          background: var(--admin-card-bg, #ffffff);
          border: 1px solid var(--admin-card-border, #e2e8f0);
          border-radius: 18px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
        }
        .sci-sidebar {
          width: 320px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          background: var(--admin-card-bg, #ffffff);
          border-right: 1px solid var(--admin-card-border, #e2e8f0);
          height: 100%;
          min-width: 280px;
        }
        .sci-conv-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          cursor: pointer;
          border-bottom: 1px solid var(--admin-card-border, #f1f5f9);
          transition: all .15s ease;
        }
        .sci-conv-item:hover {
          background: var(--bg-secondary, #f8fafc);
        }
        .sci-conv-item.active {
          background: rgba(16,185,129,0.08);
          border-left: 3px solid #10B981;
        }
        .sci-chat {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          background: var(--bg-secondary, #f8fafc);
          height: 100%;
        }
        .sci-bubble-buyer {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #0f172a;
          border-radius: 16px 16px 16px 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        }
        .sci-bubble-seller {
          background: linear-gradient(135deg, #10B981, #059669);
          color: #ffffff;
          border-radius: 16px 16px 4px 16px;
          box-shadow: 0 4px 14px rgba(16,185,129,0.25);
        }
        @keyframes sci-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: none; }
        }
        .sci-msg { animation: sci-in .15s ease both; }
        .sci-quick-btn {
          padding: 6px 12px;
          border-radius: 18px;
          border: 1px solid var(--admin-card-border, #cbd5e1);
          background: #ffffff;
          color: var(--admin-text, #334155);
          font-size: 0.76rem;
          font-weight: 700;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .sci-quick-btn:hover {
          border-color: #10B981;
          color: #059669;
          background: #ECFDF5;
          transform: translateY(-1px);
        }
        @media(max-width: 768px){
          .sci-wrapper { height: calc(100dvh - 60px - 64px) !important; min-height: unset !important; }
          .sci-sidebar {
            width: 100%;
            border-right: none;
          }
          .sci-sidebar.mhide { display: none !important; }
          .sci-chat.mhide { display: none !important; }
          .sci-back { display: flex !important; }
          .sci-btn-text { display: none !important; }
          .sci-action-btn { padding: 6px 8px !important; min-width: 34px !important; height: 34px !important; }
        }
      `}</style>

      {/*  LEFT SIDEBAR: Conversation List  */}
      <div className={`sci-sidebar${mobileView === 'chat' ? ' mhide' : ''}`}>
        {/* Sidebar Header */}
        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--admin-card-border, #e2e8f0)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'linear-gradient(135deg, #10B981, #059669)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', boxShadow: '0 2px 8px rgba(16,185,129,0.3)'
              }}>
                <FiMessageSquare size={16} />
              </div>
              <h2 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: 'var(--admin-text, #0F172A)' }}>
                {isKhmer ? 'សារអតិថិជន' : 'Customer Messages'}
              </h2>
            </div>
            <button
              onClick={() => loadData(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-secondary, #64748B)', padding: 6, display: 'flex' }}
              title={isKhmer ? 'ផ្ទុកឡើងវិញ' : 'Refresh'}
            >
              <FiRefreshCw size={14} />
            </button>
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-secondary, #94A3B8)' }} />
            <input
              placeholder={isKhmer ? 'ស្វែងរកអតិថិជន...' : 'Search customers...'}
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              style={{
                width: '100%', paddingLeft: 30, paddingRight: 10, height: 36,
                borderRadius: 12, border: '1px solid var(--admin-card-border, #CBD5E1)',
                background: 'var(--bg-secondary, #F8FAFC)', fontSize: '0.82rem',
                outline: 'none', boxSizing: 'border-box', color: 'var(--admin-text, #0F172A)'
              }}
            />
          </div>
        </div>

        {/* History indicator bar */}
        <div style={{
          padding: '6px 14px', fontSize: '0.72rem', color: 'var(--admin-text-secondary, #64748B)',
          background: 'var(--bg-secondary, #F8FAFC)', borderBottom: '1px solid var(--admin-card-border, #e2e8f0)',
          display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600
        }}>
          <FiClock size={12} /> {isKhmer ? 'ប្រវត្តិការសន្ទនាទាំងអស់' : 'All customer chat threads'}
        </div>

        {/* Conversations List Scrollable */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: `sci-in 1.2s ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          ) : filteredConvs.length === 0 ? (
            <div style={{ padding: 36, textAlign: 'center', color: 'var(--admin-text-secondary, #94A3B8)' }}>
              <FiUser size={36} style={{ opacity: 0.35, marginBottom: 8 }} />
              <div style={{ fontSize: '0.86rem', fontWeight: 700 }}>
                {isKhmer ? 'មិនទាន់មានការសន្ទនាឡើយ' : 'No customer conversations'}
              </div>
            </div>
          ) : filteredConvs.map(conv => {
            const hasDispute = (conv.orders || []).some(o => o.status === 'DISPUTED');

            return (
            <div
              key={conv.buyerEmail}
              className={`sci-conv-item${selectedBuyer === conv.buyerEmail ? ' active' : ''}`}
              onClick={() => { setSelectedBuyer(conv.buyerEmail); setMobileView('chat'); }}
              style={hasDispute ? { borderLeft: '3px solid #EF4444', background: 'rgba(239,68,68,0.03)' } : {}}
            >
              {/* Avatar with dispute badge overlay */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <UserAvatar name={conv.buyerName} email={conv.buyerEmail} avatarUrl={conv.buyerAvatarUrl} size={42} />
                {hasDispute && (
                  <div style={{
                    position: 'absolute', bottom: -2, right: -2,
                    width: 18, height: 18, borderRadius: '50%',
                    background: '#EF4444', border: '2px solid #fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 1px 4px rgba(239,68,68,0.5)'
                  }} title={isKhmer ? 'មានវិវាទក្នុង Disputes' : 'Active Dispute in Disputes'}>
                    <FiShield size={9} color="#fff" />
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--admin-text, #0F172A)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conv.buyerName !== conv.buyerEmail ? conv.buyerName : conv.buyerEmail.split('@')[0]}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-secondary, #94A3B8)', flexShrink: 0 }}>
                    {formatTime(conv.lastTime, isKhmer)}
                  </span>
                </div>
                {hasDispute ? (
                  <div style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 800, marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <FiShield size={11} />
                    {isKhmer ? 'មានបណ្តឹងក្នុង DISPUTES' : 'Has Claim in DISPUTES'}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-secondary, #64748B)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                    {conv.lastMsg || (isKhmer ? 'មិនទាន់មានសារ' : 'No messages yet')}
                  </div>
                )}
                <div style={{ fontSize: '0.68rem', color: '#10B981', marginTop: 3, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <FiShoppingBag size={11} />
                  <span>{conv.orders.length} {isKhmer ? 'ការបញ្ជាទិញ' : conv.orders.length === 1 ? 'order' : 'orders'}</span>
                </div>
              </div>
            </div>
            );
          })}

        </div>
      </div>

      {/*  RIGHT PANE: Active Chat  */}
      <div className={`sci-chat${mobileView === 'list' ? ' mhide' : ''}`}>
        {!selectedConv ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-secondary, #94A3B8)', gap: 12, padding: 20 }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(16,185,129,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiMessageSquare size={32} color="#10B981" style={{ opacity: 0.6 }} />
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--admin-text, #0F172A)' }}>
              {isKhmer ? 'សូមជ្រើសរើសការសន្ទនាអតិថិជន' : 'Select a customer conversation'}
            </div>
          </div>
        ) : (
          <>
            {/*  Active Chat Header  */}
            <div style={{
              padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--admin-card-bg, #ffffff)', borderBottom: '1px solid var(--admin-card-border, #e2e8f0)',
              flexShrink: 0, gap: 10, flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                <button
                  onClick={() => setMobileView('list')}
                  className="sci-back"
                  style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text, #0F172A)', padding: 4 }}
                >
                  <FiArrowLeft size={20} />
                </button>
                <UserAvatar name={selectedConv.buyerName} email={selectedConv.buyerEmail} avatarUrl={selectedConv.buyerAvatarUrl} size={38} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--admin-text, #0F172A)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedConv.buyerName !== selectedConv.buyerEmail ? selectedConv.buyerName : selectedConv.buyerEmail.split('@')[0]}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-secondary, #64748B)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedConv.buyerEmail} · {selectedConv.orders.length} {isKhmer ? 'ការបញ្ជាទិញ' : 'order(s)'}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Policy & Orders */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowPolicyModal(true)}
                  className="sci-action-btn"
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 12px',
                    borderRadius: 10, border: '1px solid #A7F3D0', background: '#ECFDF5',
                    color: '#059669', fontWeight: 800, fontSize: '0.76rem', cursor: 'pointer', flexShrink: 0
                  }}
                  title={isKhmer ? 'មើលគោលការណ៍ប្តូរទំនិញ' : 'View Replacement Policy'}
                >
                  <FiShield size={13} style={{ flexShrink: 0 }} />
                  <span className="sci-btn-text">{isKhmer ? 'គោលការណ៍ប្តូរថ្មី' : 'Replace Policy'}</span>
                </button>
                {defaultOrder?.id && (
                  <button
                    type="button"
                    onClick={() => navigate(`/orders/${defaultOrder.id}`)}
                    className="sci-action-btn"
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 12px',
                      borderRadius: 10, border: '1px solid var(--admin-card-border, #CBD5E1)',
                      background: 'var(--bg-secondary, #F8FAFC)', color: 'var(--admin-text, #0F172A)',
                      fontWeight: 700, fontSize: '0.76rem', cursor: 'pointer', flexShrink: 0
                    }}
                    title={isKhmer ? 'មើលព័ត៌មានការបញ្ជាទិញ' : 'View Order Details'}
                  >
                    <FiShoppingBag size={13} style={{ flexShrink: 0 }} />
                    <span className="sci-btn-text">{isKhmer ? `ការបញ្ជាទិញ #${defaultOrder.id}` : `Order #${defaultOrder.id}`}</span>
                    <FiChevronRight size={12} className="sci-btn-text" style={{ opacity: 0.6 }} />
                  </button>
                )}
              </div>
            </div>

            {/* Escrow Seller Reminder Banner */}
            <div style={{
              padding: '6px 14px', background: 'linear-gradient(135deg, rgba(16,185,129,0.07), rgba(99,102,241,0.07))',
              borderBottom: '1px solid var(--admin-card-border, #e2e8f0)', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px 10px', fontSize: '0.73rem',
              color: '#065F46', fontWeight: 700
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 200, lineHeight: 1.4 }}>
                <FiShield size={13} color="#10B981" style={{ flexShrink: 0 }} />
                <span>
                  {isKhmer
                    ? 'ការពារដោយ Escrow៖ សូមឆ្លើយតប និងប្តូរគណនីជូនអតិថិជនឱ្យបានលឿន ប្រសិនបើមានបញ្ហា Login ឬផុតកំណត់មុនពេល។'
                    : 'Escrow Protected: Promptly replace credentials if buyer experiences login issues.'}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setShowPolicyModal(true)}
                style={{ background: 'none', border: 'none', color: '#059669', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              >
                {isKhmer ? 'គោលការណ៍សម្រាប់អ្នកលក់' : 'Seller Rules'}
              </button>
            </div>

            {/* Active Dispute Information Banner */}
            {selectedConv?.orders?.some(o => o.status === 'DISPUTED') && (
              <div style={{
                margin: '0',
                padding: '10px 16px',
                background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(245,158,11,0.06))',
                borderBottom: '1px solid rgba(239,68,68,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', boxShadow: '0 2px 6px rgba(239,68,68,0.3)', flexShrink: 0
                  }}>
                    <FiShield size={14} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#991B1B' }}>
                      {isKhmer ? 'អតិថិជនបានដាក់ពាក្យស្នើសុំប្តូរទំនិញក្នុង DISPUTES' : 'Customer has an active dispute/replacement in DISPUTES'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#B91C1C' }}>
                      {isKhmer ? 'សូមចូលទៅកាន់ផ្ទាំងគ្រប់គ្រង > DISPUTES ដើម្បីពិនិត្យ និងប្រគល់គណនីថ្មី' : 'Please review and fulfill replacement in Seller Dashboard > DISPUTES'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/seller-dashboard')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px', borderRadius: 8,
                    background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                    color: '#fff', border: 'none',
                    fontWeight: 800, fontSize: '0.76rem', cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(239,68,68,0.3)'
                  }}
                >
                  <FiExternalLink size={12} />
                  {isKhmer ? 'ចូលទៅកាន់ DISPUTES' : 'Go to DISPUTES'}
                </button>
              </div>
            )}

            {/*  Message Thread Body  */}
            <div
              ref={messagesContainerRef}
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                background: 'var(--bg-secondary, #F8FAFC)'
              }}
            >
              {currentMessages.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-secondary, #94A3B8)', gap: 8 }}>
                  <FiMessageSquare size={26} style={{ opacity: 0.35 }} />
                  <div style={{ fontSize: '0.84rem' }}>{isKhmer ? 'មិនទាន់មានសារនៅឡើយទេ' : 'No messages yet'}</div>
                </div>
              ) : (() => {
                const items = [];
                let lastDate = null;
                currentMessages.forEach((msg, idx) => {
                  const msgDate = formatMsgDate(msg.createdAt, isKhmer);
                  if (msgDate && msgDate !== lastDate) {
                    lastDate = msgDate;
                    items.push(
                      <div key={`d-${idx}`} style={{ textAlign: 'center', margin: '12px 0 6px' }}>
                        <span style={{ fontSize: '0.68rem', color: 'var(--admin-text-secondary, #64748B)', background: '#FFFFFF', padding: '3px 12px', borderRadius: 14, border: '1px solid #E2E8F0', fontWeight: 600 }}>
                          {msgDate}
                        </span>
                      </div>
                    );
                  }

                  const isSeller = msg.senderRole === 'SELLER' || msg.senderEmail === user?.email;
                  const prev = currentMessages[idx - 1];
                  const samePrev = prev && prev.senderRole === msg.senderRole;
                  const timeStr = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                  items.push(
                    <div
                      key={msg.id || idx}
                      className="sci-msg"
                      style={{
                        display: 'flex',
                        flexDirection: isSeller ? 'row-reverse' : 'row',
                        alignItems: 'flex-start',
                        gap: 10,
                        marginTop: samePrev ? 2 : 12,
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                    >
                      {samePrev ? (
                        <div style={{ width: 32, flexShrink: 0 }} />
                      ) : isSeller ? (
                        <StoreAvatar name={user?.name} logoUrl={msg.senderAvatarUrl || user?.sellerProfile?.storeLogoUrl || user?.avatarUrl || user?.avatar} size={32} />
                      ) : (
                        <UserAvatar name={selectedConv.buyerName} email={selectedConv.buyerEmail} avatarUrl={msg.senderAvatarUrl || selectedConv.buyerAvatarUrl} size={32} />
                      )}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isSeller ? 'flex-end' : 'flex-start',
                        maxWidth: 'min(76%, 560px)',
                        minWidth: 0
                      }}>
                        {!msg.deleted ? (
                          <div
                            className={isSeller ? 'sci-bubble-seller' : 'sci-bubble-buyer'}
                            style={{
                              padding: '11px 16px',
                              fontSize: '0.88rem',
                              lineHeight: 1.55,
                              wordBreak: 'break-word',
                              overflowWrap: 'anywhere',
                              whiteSpace: 'pre-wrap',
                              boxSizing: 'border-box'
                            }}
                          >
                            <ChatMediaContent content={msg.content} onImageClick={url => setPreviewImage(url)} isKhmer={isKhmer} />
                          </div>
                        ) : (
                          <div style={{ padding: '6px 12px', fontSize: '0.78rem', color: '#94A3B8', fontStyle: 'italic', border: '1px dashed #CBD5E1', borderRadius: 10 }}>
                            {isKhmer ? 'សារត្រូវបានលុប' : 'Message deleted'}
                          </div>
                        )}
                        <div style={{ fontSize: '0.66rem', color: 'var(--admin-text-secondary, #94A3B8)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                          <span>{timeStr}</span>
                          {isSeller && <FiCheck size={12} color="#10B981" />}
                        </div>
                      </div>
                    </div>
                  );
                });
                return items;
              })()}
              <div ref={messagesEndRef} style={{ height: 1 }} />
            </div>

            {/*  Canned Fast Replies Bar  */}
            <div style={{
              padding: '6px 12px',
              background: 'var(--admin-card-bg, #ffffff)',
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              borderTop: '1px solid var(--admin-card-border, #f1f5f9)',
              scrollbarWidth: 'none'
            }}>
              {(isKhmer ? SELLER_QUICK_REPLIES_KH : SELLER_QUICK_REPLIES_EN).map((r, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="sci-quick-btn"
                  onClick={() => handleSend(r)}
                  disabled={sending}
                >
                  {r}
                </button>
              ))}
            </div>

            {/*  Chat Input Footer  */}
            <div style={{
              padding: '10px 14px', background: 'var(--admin-card-bg, #ffffff)',
              borderTop: '1px solid var(--admin-card-border, #e2e8f0)',
              display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0
            }}>
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
                style={{
                  width: 38, height: 38, borderRadius: 10, border: '1px solid var(--admin-card-border, #CBD5E1)',
                  background: 'var(--bg-secondary, #F8FAFC)', cursor: uploadingMedia ? 'wait' : 'pointer',
                  color: uploadingMedia ? '#10B981' : 'var(--admin-text-secondary, #64748B)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}
                title={isKhmer ? 'ផ្ញើរូបភាព ឬវីដេអូ' : 'Send Image or Video'}
              >
                <FiPaperclip size={17} />
              </button>
              <input
                ref={inputRef}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={isKhmer ? 'វាយសារទៅអតិថិជន...' : 'Type your message here...'}
                style={{
                  flex: 1, height: 40, borderRadius: 20,
                  border: '1px solid var(--admin-card-border, #CBD5E1)',
                  padding: '0 16px', background: 'var(--bg-secondary, #F8FAFC)',
                  fontSize: '0.86rem', outline: 'none', color: 'var(--admin-text, #0F172A)'
                }}
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={sending || !inputText.trim()}
                style={{
                  width: 40, height: 40, borderRadius: '50%', border: 'none', flexShrink: 0,
                  background: (inputText.trim() && !sending) ? 'linear-gradient(135deg, #10B981, #059669)' : 'var(--admin-card-border, #CBD5E1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: (inputText.trim() && !sending) ? 'pointer' : 'default',
                  boxShadow: (inputText.trim() && !sending) ? '0 3px 12px rgba(16,185,129,0.35)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <FiSend size={16} color={(inputText.trim() && !sending) ? '#fff' : '#94A3B8'} />
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
    </div>
  );
};

export default SellerCustomerInboxPage;
