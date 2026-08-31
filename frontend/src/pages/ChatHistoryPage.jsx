import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { chat as chatApi, orders as ordersApi, products as productsApi, seller as sellerApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FaTelegram } from 'react-icons/fa';
import { MdStorefront } from 'react-icons/md';
import {
  FiMessageSquare, FiSend, FiShield, FiUser,
  FiArrowLeft, FiRefreshCw, FiPackage,
  FiCopy, FiEdit2, FiTrash2, FiCheck, FiMail,
  FiChevronLeft, FiChevronRight,
} from 'react-icons/fi';

/*  Static Fallback Products (Matching screenshot layout)  */
const FALLBACK_PRODUCTS = [
  { id: 1, name: 'CapCut Pro 1 Month', categoryName: 'CapCut', price: 1.50, imageUrl: 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png', keywords: ['capcut'] },
  { id: 2, name: 'Spotify Premium 1 Month', categoryName: 'Spotify', price: 0.87, imageUrl: 'https://cdn-icons-png.flaticon.com/512/174/174872.png', keywords: ['spotify'] },
  { id: 3, name: 'Netflix 4K Ultra HD 1 Month', categoryName: 'Netflix', price: 2.50, imageUrl: 'https://cdn-icons-png.flaticon.com/512/732/732228.png', keywords: ['netflix'] },
  { id: 4, name: 'ChatGPT Plus 1 Month', categoryName: 'AI Tools', price: 4.99, imageUrl: 'https://cdn-icons-png.flaticon.com/512/12222/12222588.png', keywords: ['chatgpt', 'gpt', 'openai'] },
  { id: 5, name: 'YouTube Premium 1 Month', categoryName: 'YouTube', price: 1.20, imageUrl: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png', keywords: ['youtube'] },
  { id: 6, name: 'Canva Pro Team 1 Year', categoryName: 'Canva', price: 1.99, imageUrl: 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png', keywords: ['canva', 'design'] },
];

/*  Message Content Renderer (Support Links + Product Buy Cards)  */
const RenderMessageContent = ({ msg, isKhmer, navigate, storeProducts = [] }) => {
  if (!msg) return null;
  if (msg.deleted) return <span>{isKhmer ? 'សារត្រូវបានលុប' : 'Message deleted'}</span>;
  const content = msg.content || '';
  const isAdmin = msg.senderRole === 'ADMIN' || msg.senderRole === 'BOT';

  // 1. Detect Support / Contact request
  const isSupportReq = content.includes('t.me/') || content.includes('korbsameth.dev@gmail.com') ||
    content.toLowerCase().includes('telegram') || content.toLowerCase().includes('email') ||
    content.includes('ទាក់ទង') || content.includes('ជំនួយ');

  // 2. Dynamically fetch store product for buy recommendation (Matching real database products)
  let matchedProduct = null;
  if (isAdmin) {
    const lowerContent = content.toLowerCase();
    
    // 1. Check real store products fetched from database first (by full name or category)
    if (storeProducts && storeProducts.length > 0) {
      matchedProduct = storeProducts.find(p => {
        if (!p.name) return false;
        const pName = p.name.toLowerCase();
        const catName = (p.categoryName || p.category?.name || '').toLowerCase();
        return lowerContent.includes(pName) || (catName && catName.length > 2 && lowerContent.includes(catName));
      });

      if (!matchedProduct) {
        matchedProduct = storeProducts.find(p => {
          if (!p.name) return false;
          const words = p.name.toLowerCase().split(/\s+/);
          return words.some(w => w.length > 2 && lowerContent.includes(w));
        });
      }
    }

    // 2. Fallback matching for popular digital products (CapCut, Spotify, Netflix, ChatGPT, YouTube, Canva)
    if (!matchedProduct) {
      const fallback = FALLBACK_PRODUCTS.find(f => f.keywords.some(k => lowerContent.includes(k)));
      if (fallback) matchedProduct = fallback;
    }
  }

  return (
    <div>
      <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{content}</div>

      {/* Interactive Support Action Buttons */}
      {isAdmin && isSupportReq && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          <a
            href="https://t.me/saby_shop_support"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 20,
              background: 'linear-gradient(135deg, #2AABEE 0%, #229ED9 100%)',
              color: '#fff', fontSize: '0.78rem', fontWeight: 800,
              textDecoration: 'none', boxShadow: '0 3px 10px rgba(42,171,238,0.35)',
              transition: 'transform 0.18s'
            }}
          >
            <FaTelegram size={14} />
            <span>{isKhmer ? 'Telegram Support' : 'Telegram Support'}</span>
          </a>

          <a
            href="mailto:korbsameth.dev@gmail.com"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 20,
              background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
              color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 800,
              textDecoration: 'none', transition: 'transform 0.18s'
            }}
          >
            <FiMail size={14} />
            <span>{isKhmer ? 'Email Support' : 'Email Support'}</span>
          </a>
        </div>
      )}

      {/* Interactive Product Mini Card (full-width responsive stacked layout) */}
      {isAdmin && matchedProduct && (
        <div style={{
          marginTop: 10,
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
            {/* Product Image Thumbnail */}
            <div style={{
              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
              background: 'rgba(99,102,241,0.08)', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--border)'
            }}>
              {matchedProduct.imageUrl ? (
                <img src={matchedProduct.imageUrl} alt={matchedProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <FiPackage size={22} color="var(--primary)" />
              )}
            </div>

            {/* Product Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 800, fontSize: '0.86rem', color: 'var(--text)',
                wordBreak: 'break-word', lineHeight: 1.3
              }}>
                {matchedProduct.name}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-lighter)', marginTop: 2 }}>
                {matchedProduct.categoryName || matchedProduct.category?.name || 'Digital Product'}
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#ea580c', marginTop: 2 }}>
                USD {(matchedProduct.price || 0.87).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Full-Width Action Button: 'Buy Now' / 'ទិញឥឡូវ' */}
          <button
            onClick={() => navigate(matchedProduct.id ? `/product/${matchedProduct.id}` : '/store')}
            style={{
              width: '100%',
              border: 'none',
              background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
              color: '#fff',
              borderRadius: 10,
              padding: '8px 14px',
              fontWeight: 800,
              fontSize: '0.84rem',
              fontFamily: 'inherit',
              cursor: 'pointer',
              textAlign: 'center',
              boxShadow: '0 3px 10px rgba(234, 88, 12, 0.3)',
              transition: 'all 0.18s'
            }}
          >
            {isKhmer ? 'ទិញឥឡូវ' : 'Buy Now'}
          </button>
        </div>
      )}
    </div>
  );
};

/*  Product quick-prompt config  */
export const getProductWelcomeConfig = (prodName, orderId, isKhmer = false) => {
 const name = (prodName || '').toLowerCase();
 if (isKhmer) {
 if (name.includes('netflix')) return {
 quickPrompts: ['ពាក្យសម្ងាត់ Netflix មិនត្រឹមត្រូវ', 'ទីតាំងគ្រួសារ / កូដ TV', 'ពេញចំនួនអេក្រង់កំណត់', 'ត្រូវការដូរគណនីថ្មី'],
 };
 if (name.includes('youtube')) return {
 quickPrompts: ['តំណអញ្ជើញក្រុមគ្រួសារមិនដំណើរការ', 'អាសយដ្ឋានអ៊ីមែល Google ខុស', 'ការជាវផុតកំណត់មុនកាលកំណត់', 'របៀបចូលរួមក្រុមគ្រួសារ?'],
 };
 if (name.includes('spotify')) return {
 quickPrompts: ['តំណអញ្ជើញ Spotify ផុតកំណត់', 'ប្រទេស / តំបន់មិនត្រូវគ្នា', 'ត្រូវការតំណសកម្មភាពថ្មី', 'របៀបផ្ទេរបញ្ជីចម្រៀង?'],
 };
 if (name.includes('canva') || name.includes('design')) return {
 quickPrompts: ['កំហុសតំណក្រុម Canva', 'លក្ខណៈពិសេស Pro មិនទាន់បើក', 'ត្រូវការអញ្ជើញចូលក្រុមឡើងវិញ', 'ជំនួយការដំឡើងគណនី'],
 };
 if (name.includes('chatgpt') || name.includes('gpt') || name.includes('ai') || name.includes('claude')) return {
 quickPrompts: ['ត្រូវការលេខកូដផ្ទៀងផ្ទាត់ការចូល', 'ពាក្យសម្ងាត់មិនដំណើរការ', 'ស្ថានភាពការជាវ Plus', 'ត្រូវការដូរគណនីថ្មី'],
 };
 return {
 quickPrompts: ['ព័ត៌មានសម្ងាត់គណនីមិនដំណើរការ', 'ត្រូវការដូរកូនសោថ្មី', 'របៀបបើកដំណើរការគណនីនេះ?', 'បញ្ហាផលិតផលផ្សេងទៀត'],
 };
 }

 if (name.includes('netflix')) return {
 quickPrompts: ['Incorrect Netflix Password', 'Household location / TV code', 'Screen limit reached', 'Need replacement account'],
 };
 if (name.includes('youtube')) return {
 quickPrompts: ['Family invite link not working', 'Wrong Google email address', 'Subscription expired early', 'How to join family group?'],
 };
 if (name.includes('spotify')) return {
 quickPrompts: ['Spotify invite link expired', 'Country / Region mismatch', 'Need new activation link', 'How to transfer playlists?'],
 };
 if (name.includes('canva') || name.includes('design')) return {
 quickPrompts: ['Canva team link error', 'Pro features not unlocked', 'Need team re-invitation', 'Account upgrade help'],
 };
 if (name.includes('chatgpt') || name.includes('gpt') || name.includes('ai') || name.includes('claude')) return {
 quickPrompts: ['Login verification code required', "Password doesn't work", 'Plus subscription status', 'Need replacement account'],
 };
 return {
 quickPrompts: ["Account credentials don't work", 'Need replacement key', 'How to activate this account?', 'Other product issue'],
 };
};

/*  Date label  */
const getDateLabel = (dateStr) => {
 if (!dateStr) return '';
 const d = new Date(dateStr);
 const today = new Date();
 const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
 if (d.toDateString() === today.toDateString()) return 'Today';
 if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
 return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
};

/*  Inline CSS  */
/*  Checkmark Icons for Message Status  */
const DoubleCheckIcon = ({ color = '#3b82f6' }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', color, marginLeft: 2, marginRight: 2 }} title="បានមើលឃើញ · Seen">
    <svg width="15" height="11" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 6.5L4.5 10L11 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 6.5L8.5 10L15 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </span>
);

const SingleCheckIcon = ({ color = 'var(--text-lighter)' }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', color, marginLeft: 2, marginRight: 2 }} title="បានផ្ញើ · Sent">
    <svg width="11" height="9" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 5L4 8L11 1" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </span>
);

/*  Inline CSS  */
const CHAT_CSS = `
  @keyframes msgSlideRight { from{opacity:0;transform:translateX(14px) scale(0.97)} to{opacity:1;transform:none} }
  @keyframes msgSlideLeft { from{opacity:0;transform:translateX(-14px) scale(0.97)} to{opacity:1;transform:none} }
  @keyframes typingDot { 0%,60%,100%{transform:translateY(0);opacity:.4} 30%{transform:translateY(-5px);opacity:1} }
  @keyframes onlinePulse { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.5)} 50%{box-shadow:0 0 0 5px rgba(34,197,94,0)} }
  @keyframes ctxFadeIn { from{opacity:0;transform:scale(0.9) translateY(-6px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes statusPopIn { from{opacity:0;transform:translateY(6px) scale(0.92)} to{opacity:1;transform:none} }
  .msg-user { animation: msgSlideRight 0.22s ease both; }
  .msg-admin { animation: msgSlideLeft 0.22s ease both; }
  .online-dot { width:9px;height:9px;border-radius:50%;background:#22c55e;display:inline-block;flex-shrink:0;animation:onlinePulse 2s infinite; }
  .typing-dot { width:7px;height:7px;border-radius:50%;background:#6366f1;display:inline-block; }
  .typing-dot:nth-child(1){animation:typingDot 1.2s 0.0s infinite}
  .typing-dot:nth-child(2){animation:typingDot 1.2s 0.2s infinite}
  .typing-dot:nth-child(3){animation:typingDot 1.2s 0.4s infinite}
  .order-ctx-chip { transition:all .18s; cursor:pointer; }
  .order-ctx-chip:hover { transform:translateY(-1px); }
  .quick-chip:hover { background:var(--primary)!important;color:#fff!important;transform:translateY(-1px); }
  .send-btn:hover:not(:disabled) { transform:scale(1.08); }
  .ctx-menu-item:hover { background:rgba(99,102,241,0.08)!important; }
  .ctx-menu-item.danger:hover { background:rgba(239,68,68,0.08)!important; color:#ef4444!important; }
  @media(max-width:768px){
  .unified-chat-root { padding:10px 10px 85px!important; }
  .unified-chat-card { height:calc(100vh - 130px)!important; border-radius:14px!important; }
  }
`;

/*  */
const ChatHistoryPage = ({ defaultChannel }) => {
  const { user } = useAuth();
  const { isKhmer, t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  /*  Core state  */
  const [ordersMap, setOrdersMap] = useState({});
  const ordersMapRef = useRef({});
  const [allMessages, setAllMessages] = useState([]);
  const allMsgsRef = useRef([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [storeProducts, setStoreProducts] = useState([]);
  const [chatChannel, setChatChannel] = useState(() => {
    if (defaultChannel) return defaultChannel;
    const urlChannel = searchParams.get('channel') || searchParams.get('mode');
    if (urlChannel === 'USER_ADMIN' || urlChannel === 'user') return 'USER_ADMIN';
    if (urlChannel === 'USER_SELLER' || urlChannel === 'seller') return 'USER_SELLER';
    if (urlChannel === 'SELLER_ADMIN') return 'SELLER_ADMIN';
    return user?.role === 'SELLER' ? 'USER_SELLER' : 'USER_ADMIN';
  });

  const chatChannelRef = useRef(chatChannel);
  useEffect(() => {
    chatChannelRef.current = chatChannel;
  }, [chatChannel]);

  useEffect(() => {
    const urlChannel = searchParams.get('channel') || searchParams.get('mode');
    if (urlChannel === 'USER_ADMIN' || urlChannel === 'user' || urlChannel === 'buyer') {
      setChatChannel('USER_ADMIN');
    } else if (urlChannel === 'USER_SELLER') {
      setChatChannel('USER_SELLER');
    } else if (urlChannel === 'SELLER_ADMIN' || urlChannel === 'seller') {
      setChatChannel('SELLER_ADMIN');
    }
  }, [searchParams]);

  /*  Fetch products for buy recommendation mini cards  */
  useEffect(() => {
    productsApi.getAll()
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        if (Array.isArray(list)) setStoreProducts(list);
      })
      .catch(() => {});
  }, []);

  /*  AI Status state (Seen & Replying indicators)  */
  const [aiStatus, setAiStatus] = useState(null); // null | 'seen' | 'typing'
  const [seenMsgId, setSeenMsgId] = useState(null);

 /*  Context menu state  */
 const [ctxMenu, setCtxMenu] = useState(null); // { msgId, content, x, y }
 const [editingId, setEditingId] = useState(null);
 const [editText, setEditText] = useState('');
 const [copiedId, setCopiedId] = useState(null);
 const ctxRef = useRef(null);
 const longPressTimer = useRef(null);

 const messagesContainerRef = useRef(null);
 const inputRef = useRef(null);
 const orderScrollRef = useRef(null);
 const prevMsgCount = useRef(0);
 const pollingRef = useRef(null);

 /*  Scroll Left (ឆ្វេង) & Right (ស្តាំ) for Order chips  */
 const scrollOrdersLeft = () => {
   if (orderScrollRef.current) {
     orderScrollRef.current.scrollBy({ left: -220, behavior: 'smooth' });
   }
 };

 const scrollOrdersRight = () => {
   if (orderScrollRef.current) {
     orderScrollRef.current.scrollBy({ left: 220, behavior: 'smooth' });
   }
 };

 /*  Mark all read  */
 const markAllRead = useCallback(() => {
 const ts = new Date().toISOString();
 localStorage.setItem('user_chat_last_read', ts);
 setHasUnread(false);
 window.dispatchEvent(new Event('user_chat_read_updated'));
 }, []);

 /*  Close context menu on outside click  */
 useEffect(() => {
 const close = (e) => {
 if (ctxRef.current && !ctxRef.current.contains(e.target)) setCtxMenu(null);
 };
 document.addEventListener('mousedown', close);
 document.addEventListener('touchstart', close);
 return () => { document.removeEventListener('mousedown', close); document.removeEventListener('touchstart', close); };
 }, []);

  const messagesEndRef = useRef(null);

  /*  Scroll helper (Scrolls ONLY internal chat box, never the whole page)  */
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior
      });
    }
  }, []);

 /*  Dedup  */
 const isDup = (list, msg) => list.some(ex => {
   if (ex.id && msg.id && String(ex.id) === String(msg.id)) return true;
   return false;
 });

 /*  Get product name for an order  */
 const getOrderName = useCallback((orderId) => {
    const ord = ordersMapRef.current[String(orderId)];
    return ord?.items?.[0]?.product?.name || ord?.productName || null;
  }, []);

  /*  Load & merge all messages from all orders  */
  const loadAllMessages = useCallback(async (silent = false, signal) => {
    if (!silent) setLoading(true);

    // 1. Fetch strictly mode-scoped orders
    const activeChannel = chatChannelRef.current;
    const activeMode = (activeChannel === 'SELLER_ADMIN' || activeChannel === 'seller') ? 'seller' : 'buyer';

    let map = {};
    if (activeMode === 'seller') {
      try {
        const sRes = await sellerApi.getOrders({ signal });
        const sList = Array.isArray(sRes.data) ? sRes.data : (sRes.data?.data || []);
        sList.forEach(ord => {
          if (ord?.id) {
            map[String(ord.id)] = { ...ord, _isSellerOrder: true };
          }
        });
      } catch (_) {
        if (signal?.aborted) return;
      }
    }
    
    if (signal?.aborted) return;
    ordersMapRef.current = map;
    setOrdersMap(map);

    // Auto-select first order or URL param
    const urlOrder = searchParams.get('order');
    setSelectedOrderId(prev => {
      if (urlOrder && map[String(urlOrder)]) return String(urlOrder);
      if (prev && map[String(prev)]) return prev;
      const keys = Object.keys(map);
      return keys.length > 0 ? keys[0] : null;
    });

    // 2. Fetch mode-scoped conversation messages from API
    const merged = [];
    try {
      const res = await chatApi.getConversation(activeMode, { signal });
      if (signal?.aborted) return;

      // Discard stale in-flight response if mode switched while request was in-flight
      const currentChannel = chatChannelRef.current;
      const currentMode = (currentChannel === 'SELLER_ADMIN' || currentChannel === 'seller') ? 'seller' : 'buyer';
      if (activeMode !== currentMode) {
        return;
      }

      const convData = res.data?.data || res.data;
      if (convData?.mode && convData.mode !== currentMode) {
        return;
      }

      const list = Array.isArray(convData?.messages) ? convData.messages : (Array.isArray(res.data) ? res.data : []);
      list.forEach(m => { if (m && !isDup(merged, m)) merged.push(m); });
    } catch (_) {
      if (signal?.aborted) return;
    }

    try {
      const res = await chatApi.getUserMessages({ signal });
      if (signal?.aborted) return;
      const currentChannel = chatChannelRef.current;
      const currentMode = (currentChannel === 'SELLER_ADMIN' || currentChannel === 'seller') ? 'seller' : 'buyer';
      if (activeMode !== currentMode) return;

      const list = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
      list.forEach(m => { if (m && !isDup(merged, m)) merged.push(m); });
    } catch (_) {
      if (signal?.aborted) return;
    }

    if (signal?.aborted) return;

    // 3. Merge from localStorage (catches pending/temp messages)
    // FIX: Always include orderId=0 (SELLER_ADMIN channel) so AI auto-replies survive polling.
    const localOids = [...new Set([...Object.keys(map), '0'])];
    localOids.forEach(oid => {
      try {
        const local = JSON.parse(localStorage.getItem(`chat_messages_order_${oid}`) || '[]');
        local.forEach(m => { if (m && !isDup(merged, m)) merged.push(m); });
      } catch (_) {}
    });

    // 4. Seed welcome message for orders with zero messages
    const covered = new Set(merged.map(m => String(m.orderId)));
    Object.keys(map).forEach(oid => {
      if (!covered.has(oid)) {
        const ord = map[oid];
        const name = ord?.items?.[0]?.product?.name || ord?.productName || 'Digital Product';
        if (ord._isSellerOrder) {
          merged.push({
            id: 'init-seller-' + oid, orderId: oid, channel: 'USER_SELLER',
            senderEmail: user?.email || 'seller@sabyshop.com', senderName: user?.name || 'Seller', senderRole: 'SELLER',
            content: `ជម្រាបសួរអតិថិជន! សូមអរគុណសម្រាប់ការបញ្ជាទិញទំនិញ ${name} (Order #${oid})។ តើបងមានសំណួរ ឬត្រូវការជំនួយអ្វីខ្លះ?`,
            createdAt: ord?.createdAt || new Date().toISOString(),
            edited: false, deleted: false,
          });
        } else {
          merged.push({
            id: 'init-' + oid, orderId: oid, channel: 'USER_ADMIN',
            senderEmail: 'admin@sabyshop.com', senderName: 'Saby Support', senderRole: 'ADMIN',
            content: isKhmer
              ? `ជម្រាបសួរ! តើយើងអាចជួយសម្រួលអ្វីខ្លះដល់បងទាក់ទងនឹង ${name} (ការបញ្ជាទិញ #${oid})? សូមប្រាប់ពីបញ្ហារបស់បងបាន។`
              : `Hello! How can we help you with ${name} (Order #${oid})? Feel free to describe your issue.`,
            createdAt: ord?.createdAt || new Date().toISOString(),
            edited: false, deleted: false,
          });
        }
      }
    });

    // 5. Sort by time
    merged.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    allMsgsRef.current = merged;
    setAllMessages(merged);

    // 6. Check unread
    const lastRead = localStorage.getItem('user_chat_last_read') || '';
    const hasNew = merged.some(m => m.senderRole === 'ADMIN' && (!lastRead || (m.createdAt || '') > lastRead));
    setHasUnread(hasNew);

    if (!silent) setLoading(false);
  }, [searchParams]);

  /*  Initial load + polling every 2s per active channel  */
  useEffect(() => {
    const controller = new AbortController();

    // Immediately clear messages and status on channel change to avoid any stale data display
    setAllMessages([]);
    allMsgsRef.current = [];
    setAiStatus(null);

    loadAllMessages(false, controller.signal).then(() => {
      if (!controller.signal.aborted) {
        setTimeout(() => scrollToBottom('auto'), 80);
      }
    });

    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => {
      if (!controller.signal.aborted) {
        loadAllMessages(true, controller.signal);
      }
    }, 2000);

    return () => {
      controller.abort();
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [chatChannel]);

  /*  Auto-select first order of the correct channel  */
  /* Runs when chatChannel or ordersMap changes — ensures selectedOrderId  */
  /* always points to an order that belongs to the current channel.        */
  useEffect(() => {
    const currentMap = ordersMapRef.current;
    const validOrders = Object.values(currentMap)
      .filter(ord => {
        if (chatChannel === 'USER_SELLER')  return ord._isSellerOrder === true;
        if (chatChannel === 'USER_ADMIN')   return ord._isSellerOrder !== true;
        if (chatChannel === 'SELLER_ADMIN') return ord._isSellerOrder === true;
        return true;
      })
      .sort((a, b) => Number(b.id) - Number(a.id));

    setSelectedOrderId(prev => {
      // Keep current selection only if it belongs to this channel
      if (prev && validOrders.some(o => String(o.id) === String(prev))) return prev;
      // Otherwise pick the first valid order for this channel
      return validOrders.length > 0 ? String(validOrders[0].id) : null;
    });
  }, [chatChannel, ordersMap]);

  /*  Auto scroll when messages or order changes  */
  useEffect(() => {
    if (allMessages.length > 0) {
      scrollToBottom('smooth');
    }
  }, [allMessages.length, selectedOrderId, scrollToBottom]);

  /*  Send message  */
  const handleSendMessage = async (textToSend) => {
    const content = (textToSend || inputText).trim();
    const isSellerAdminCh = chatChannel === 'SELLER_ADMIN';
    const isUserAdminCh = chatChannel === 'USER_ADMIN';
    const isGeneralAdminCh = isSellerAdminCh || isUserAdminCh;

    // Allow sending general support queries in both SELLER_ADMIN and USER_ADMIN without requiring an active order
    if (!content || sending || (!selectedOrderId && !isGeneralAdminCh)) return;

    setSending(true);
    setAiStatus(null);
    const targetOrderId = (!selectedOrderId && isGeneralAdminCh)
      ? 0
      : (selectedOrderId && !isNaN(Number(selectedOrderId)) ? Number(selectedOrderId) : (selectedOrderId || 0));
    const tempId = 'msg-' + Date.now();
    const optimistic = {
      id: tempId, orderId: targetOrderId,
      channel: isSellerAdminCh ? 'SELLER_ADMIN' : (chatChannel || 'USER_ADMIN'),
      senderEmail: user?.email || 'customer@store.com',
      senderName: user?.name || user?.email || 'You',
      senderRole: user?.role === 'SELLER' ? 'SELLER' : (user?.role === 'ADMIN' ? 'ADMIN' : 'USER'), content,
      createdAt: new Date().toISOString(),
      edited: false, deleted: false,
      status: 'sent',
    };

    setAllMessages(prev => { const n = [...prev, optimistic]; allMsgsRef.current = n; return n; });
    setInputText('');
    inputRef.current?.focus();
    setTimeout(() => scrollToBottom('smooth'), 40);

    const localKey = `chat_messages_order_${targetOrderId}`;
    try {
      const ex = JSON.parse(localStorage.getItem(localKey) || '[]');
      localStorage.setItem(localKey, JSON.stringify([...ex, optimistic]));
    } catch (_) {}

    // Stage 1: AI Seen status ("បានមើលឃើញ") after 80ms
    const timerSeen = setTimeout(() => {
      setAiStatus('seen');
      setSeenMsgId(tempId);
      setTimeout(() => scrollToBottom('smooth'), 20);
    }, 80);

    // Stage 2: AI Replying status ("កំពុងឆ្លើយតប...") after 200ms
    const timerTyping = setTimeout(() => {
      setAiStatus('typing');
      setTimeout(() => scrollToBottom('smooth'), 20);
    }, 200);

    try {
      const currentLang = isKhmer ? 'km' : 'en';
      // FIX: Pass channel so backend knows this is SELLER_ADMIN (generates seller-specific AI reply)
      const currentChannel = isSellerAdminCh ? 'SELLER_ADMIN' : (chatChannel || 'USER_ADMIN');
      const res = await chatApi.sendMessage(targetOrderId, content, null, currentLang, currentChannel);
      const payload = res.data?.data || res.data;

      clearTimeout(timerSeen);
      clearTimeout(timerTyping);

      if (payload) {
        const userMsg = payload.userMessage || (payload.id ? payload : null);
        const autoReplyMsg = payload.autoReply;
        setAllMessages(prev => {
          let next = prev.map(m => m.id === tempId ? { ...(userMsg || m), status: 'seen' } : m);
          if (autoReplyMsg) {
            const isBotDup = next.some(m => m.id && autoReplyMsg.id && String(m.id) === String(autoReplyMsg.id));
            if (!isBotDup) next.push(autoReplyMsg);
          }
          allMsgsRef.current = next;
          // FIX: Also save the auto-reply to the correct localStorage key so it survives polling
          try { localStorage.setItem(localKey, JSON.stringify(next.filter(m => m.orderId == targetOrderId || isSellerAdminCh))); } catch (_) {}
          return next;
        });
        setTimeout(() => scrollToBottom('smooth'), 80);
      } else {
        loadAllMessages(true);
      }
    } catch (err) {
      console.error("Error sending chat message:", err);
      clearTimeout(timerSeen);
      clearTimeout(timerTyping);
    } finally {
      setAiStatus(null);
      setSending(false);
      setTimeout(() => scrollToBottom('smooth'), 80);
    }
  };

  /*  Click order chip -> Switch Order & Auto Scroll Into Center View (No auto-send)  */
  const handleOrderChipClick = (oid, e) => {
    setSelectedOrderId(oid);

    // Smoothly scroll clicked chip into center view (matching category bar behavior)
    if (e && e.currentTarget) {
      e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

 /*  Context menu handlers  */
 const openCtxMenu = (e, msg) => {
 if (msg.senderRole !== 'USER') return;
 if (String(msg.senderEmail || '') !== String(user?.email || '')) return;
 e.preventDefault();
 const x = e.clientX ?? 0;
 const y = e.clientY ?? 0;
 setCtxMenu({ msgId: msg.id, content: msg.content, x, y });
 setEditingId(null);
 };

 const handleCopy = (content) => {
 navigator.clipboard?.writeText(content || '').catch(() => {});
 const id = ctxMenu?.msgId;
 setCtxMenu(null);
 setCopiedId(String(id));
 setTimeout(() => setCopiedId(null), 2000);
 };

 const handleStartEdit = () => {
 const msg = allMessages.find(m => String(m.id) === String(ctxMenu?.msgId));
 if (!msg || msg.deleted) return;
 setEditText(msg.content || '');
 setEditingId(String(msg.id));
 setCtxMenu(null);
 };

 const handleConfirmEdit = async (msgId) => {
 const trimmed = editText.trim();
 if (!trimmed) return;
 const orig = allMessages.find(m => String(m.id) === String(msgId));
 if (orig && trimmed === orig.content) { setEditingId(null); return; }

 // Optimistic
 setAllMessages(prev => prev.map(m => String(m.id) === String(msgId) ? { ...m, content: trimmed, edited: true } : m));
 setEditingId(null);
try {
 await chatApi.editMessage(msgId, trimmed);
 } catch (_) {
 // Silently revert (3-min window expired or other error)
 setAllMessages(prev => prev.map(m => String(m.id) === String(msgId)
 ? { ...m, content: orig?.content ?? m.content, edited: orig?.edited ?? m.edited }
 : m));
 }
 };

 const handleDelete = async () => {
 const msgId = ctxMenu?.msgId;
 setCtxMenu(null);
 if (!msgId) return;

 // Optimistic soft-delete
 setAllMessages(prev => prev.map(m => String(m.id) === String(msgId)
 ? { ...m, deleted: true, content: null } : m));

 try {
 await chatApi.deleteMessage(msgId);
 } catch (_) {
 loadAllMessages(true);
 }
 };

  /*  Derived  */
  const orderList = Object.values(ordersMap)
    .filter(ord => {
      if (chatChannel === 'USER_SELLER') {
        return ord._isSellerOrder === true;
      } else if (chatChannel === 'USER_ADMIN') {
        return ord._isSellerOrder !== true;
      } else if (chatChannel === 'SELLER_ADMIN') {
        return ord._isSellerOrder === true;
      }
      return true;
    })
    .sort((a, b) => Number(b.id) - Number(a.id));

  /*  Filter messages strictly by current channel  */
  /* This ensures USER mode sees ONLY user↔admin messages and        */
  /* SELLER mode sees ONLY seller-related messages — no mixing.      */
  const filteredMessages = allMessages.filter(msg => {
    if (!msg || !msg.orderId) return false;
    const ord = ordersMap[String(msg.orderId)];
    // 1. Use explicit channel field when present (most reliable)
    if (msg.channel) {
      if (chatChannel === 'USER_SELLER')  return msg.channel === 'USER_SELLER';
      if (chatChannel === 'USER_ADMIN')   return msg.channel === 'USER_ADMIN';
      if (chatChannel === 'SELLER_ADMIN') return msg.channel === 'SELLER_ADMIN';
    }
    // 2. Fallback: derive from order type flag
    if (!ord) return false;
    if (chatChannel === 'USER_SELLER')  return ord._isSellerOrder === true;
    if (chatChannel === 'USER_ADMIN')   return ord._isSellerOrder !== true;
    if (chatChannel === 'SELLER_ADMIN') return ord._isSellerOrder === true;
    return true;
  });

  /*  Auto-select first valid order when channel changes  */
  /* Prevents a selected order from the wrong channel bleeding in. */
  // (This runs after orderList is computed — placed here as an effect trigger)

 const selectedOrder = selectedOrderId ? ordersMap[String(selectedOrderId)] : null;
 const selectedProdName = selectedOrder?.items?.[0]?.product?.name || selectedOrder?.productName || '';
 const quickPrompts = getProductWelcomeConfig(selectedProdName, selectedOrderId, isKhmer).quickPrompts;

 /*  */
 return (
 <div className="unified-chat-root" style={{ padding: '20px 20px 80px', maxWidth: 800, margin: '0 auto' }}>
 <style>{CHAT_CSS}</style>

 {/*  Page header  */}
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
 <button onClick={() => navigate('/orders')} className="btn btn-outline btn-sm"
 style={{ borderRadius: '50%', width: 34, height: 34, padding: 0, flexShrink: 0 }}>
 <FiArrowLeft size={16} />
 </button>
 <div>
 <h1 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
 <FiMessageSquare style={{ color: 'var(--primary)' }} size={18} />
 {isKhmer ? 'ការសន្ទនាជំនួយ' : 'Support Chat'}
 {hasUnread && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 0 3px rgba(239,68,68,0.25)' }} />}
 </h1>
 <p style={{ margin: 0, fontSize: '0.73rem', color: 'var(--text-light)' }}>
 {isKhmer ? 'រាល់ជំនួយការបញ្ជាទិញទាំងអស់នៅកន្លែងតែមួយ' : 'All your order support in one place'}
 </p>
 </div>
 </div>
 <button onClick={() => loadAllMessages(false)} className="btn btn-outline btn-sm"
 style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem' }}>
 <FiRefreshCw size={13} /> {t('orders.refresh')}
 </button>
 </div>

 {/*  Chat card  */}
 <div className="unified-chat-card" style={{
 height: 'min(700px, calc(100vh - 185px))', minHeight: 460,
 background: 'var(--card-bg)', borderRadius: 20,
 border: '1px solid var(--border)', boxShadow: 'var(--shadow)',
 overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative',
 }}>
  {/*  Header  */}
  <div style={{
    padding: '13px 18px', flexShrink: 0,
    background: chatChannel === 'USER_SELLER'
      ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
      : chatChannel === 'SELLER_ADMIN'
        ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
        : 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
        {chatChannel === 'USER_SELLER' ? <MdStorefront size={22} color="#fff" /> : <FiShield size={20} color="#fff" />}
        <span className="online-dot" style={{ position: 'absolute', bottom: -2, right: -2, border: '2px solid #6366f1' }} />
      </div>
      <div>
        <div style={{ fontWeight: 800, fontSize: '0.97rem', color: '#fff' }}>
          {chatChannel === 'USER_SELLER'
            ? (isKhmer ? 'ឆាតជាមួយអតិថិជន (Customer Sales Chat)' : 'Customer Sales Chat')
            : chatChannel === 'SELLER_ADMIN'
              ? (isKhmer ? 'ផ្នែកជំនួយ Saby Seller VIP Support (AI)' : 'Saby Seller VIP Support (AI)')
              : (isKhmer ? 'ផ្នែកជំនួយ Saby AI Support' : 'Saby AI Support')
          }
        </div>
        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.88)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span className="online-dot" style={{ width: 7, height: 7, border: 'none' }} />
          {isKhmer ? 'AI Support · អនឡាញឆ្លើយតបភ្លាមៗ' : 'AI Support · Replies instantly'}
        </div>
      </div>
    </div>
    <div style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.75)', textAlign: 'right' }}>
      {orderList.length} {isKhmer ? 'ការបញ្ជាទិញ' : `order${orderList.length !== 1 ? 's' : ''}`}
    </div>
  </div>

  {/*  Channel Mode Tabs (User ↔ Seller, User ↔ Admin, Seller ↔ Admin)  */}
  {!defaultChannel && (
    <div style={{ display: 'flex', gap: 8, padding: '10px 16px', background: 'var(--card-bg)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
      {user?.role !== 'ADMIN' && (
        <button
          onClick={() => setChatChannel('USER_SELLER')}
          style={{
            padding: '6px 14px',
            borderRadius: 99,
            fontSize: '0.78rem',
            fontWeight: 700,
            border: chatChannel === 'USER_SELLER' ? '1px solid var(--primary)' : '1px solid var(--border)',
            background: chatChannel === 'USER_SELLER' ? 'var(--primary)' : 'var(--bg-secondary)',
            color: chatChannel === 'USER_SELLER' ? '#fff' : 'var(--text-light)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.18s ease'
          }}
        >
          <FiUser size={13} /> {isKhmer ? 'អតិថិជន ↔ អ្នកលក់' : 'User ↔ Seller'}
        </button>
      )}

      {user?.role !== 'SELLER' && (
        <button
          onClick={() => setChatChannel('USER_ADMIN')}
          style={{
            padding: '6px 14px',
            borderRadius: 99,
            fontSize: '0.78rem',
            fontWeight: 700,
            border: chatChannel === 'USER_ADMIN' ? '1px solid #6366f1' : '1px solid var(--border)',
            background: chatChannel === 'USER_ADMIN' ? '#6366f1' : 'var(--bg-secondary)',
            color: chatChannel === 'USER_ADMIN' ? '#fff' : 'var(--text-light)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.18s ease'
          }}
        >
          <FiShield size={13} /> {isKhmer ? 'អតិថិជន ↔ Admin' : 'User ↔ Admin'}
        </button>
      )}

      {(user?.role === 'SELLER' || user?.role === 'ADMIN') && (
        <button
          onClick={() => setChatChannel('SELLER_ADMIN')}
          style={{
            padding: '6px 14px',
            borderRadius: 99,
            fontSize: '0.78rem',
            fontWeight: 700,
            border: chatChannel === 'SELLER_ADMIN' ? '1px solid #10b981' : '1px solid var(--border)',
            background: chatChannel === 'SELLER_ADMIN' ? '#10b981' : 'var(--bg-secondary)',
            color: chatChannel === 'SELLER_ADMIN' ? '#fff' : 'var(--text-light)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.18s ease'
          }}
        >
          <MdStorefront size={14} /> {isKhmer ? 'អ្នកលក់ ↔ Admin' : 'Seller ↔ Admin'}
        </button>
      )}
    </div>
  )}

  {/*  Messages area  */}
 <div ref={messagesContainerRef} style={{
 flex: 1, overflowY: 'auto', padding: '16px 16px',
 display: 'flex', flexDirection: 'column', gap: 2,
 background: 'var(--bg-secondary)',
 }}>
 {loading ? (
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 8 }}>
 <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
 </div>
 ) : (filteredMessages.length === 0 || orderList.length === 0) ? (
 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', textAlign: 'center', gap: 12 }}>
 <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(99,102,241,0.08)', border: '2px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
 <FiMessageSquare size={28} color="var(--primary)" />
 </div>
 <div>
 <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
  {chatChannel === 'USER_SELLER' ? (isKhmer ? 'មិនទាន់មានការសន្ទនាជាមួយអតិថិជននៅឡើយទេ' : 'No Customer Chats Yet') : (isKhmer ? 'មិនទាន់មានសារនៅឡើយទេ' : 'No messages yet')}
 </div>
 <div style={{ fontSize: '0.8rem', marginTop: 4 }}>
  {chatChannel === 'USER_SELLER' ? (isKhmer ? 'នៅពេលអតិថិជនទិញទំនិញពីហាងរបស់អ្នក សារសាកសួរ ឬការសន្ទនាជាមួយអតិថិជននឹងបង្ហាញនៅទីនេះ។' : 'When customers purchase products from your store, their order inquiries will appear here.') : (isKhmer ? 'ជ្រើសរើសការបញ្ជាទិញខាងក្រោម ហើយវាយសំណួររបស់អ្នក!' : 'Select an order below and type your question!')}
 </div>
 </div>
 </div>
 ) : filteredMessages.map((msg, index) => {
  if (!msg) return null;
  const isAdmin = msg.senderRole === 'ADMIN' || msg.senderRole === 'BOT';
  const prev = filteredMessages[index - 1];
  const next = filteredMessages[index + 1];
  const msgDate = msg.createdAt ? new Date(msg.createdAt) : null;
  const prevDate = prev?.createdAt ? new Date(prev.createdAt) : null;
  const isValidMsgDate = msgDate && !isNaN(msgDate.getTime());
  const isValidPrevDate = prevDate && !isNaN(prevDate.getTime());
  const showDate = !prev || !isValidMsgDate || !isValidPrevDate || msgDate.toDateString() !== prevDate.toDateString();
  const sameSenderAsPrev = prev?.senderRole === msg.senderRole && String(prev?.orderId) === String(msg.orderId);
  const sameSenderAsNext = next?.senderRole === msg.senderRole && String(next?.orderId) === String(msg.orderId);
  // Show avatar only on last message of a group (no double profile)
  const showAvatar = !sameSenderAsNext;
  const orderName = getOrderName(msg.orderId);
  const timeStr = isValidMsgDate ? msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  const getDateLabel = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return isKhmer ? 'ថ្ងៃនេះ' : 'Today';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

 return (
 <React.Fragment key={msg.id || index}>
 {/* Date separator */}
 {showDate && (
 <div style={{ textAlign: 'center', margin: '12px 0 8px' }}>
 <span style={{ fontSize: '0.7rem', color: 'var(--text-lighter)', background: 'var(--card-bg)', borderRadius: 20, padding: '4px 14px', border: '1px solid var(--border)', display: 'inline-block' }}>
 {getDateLabel(msg.createdAt)}
 </span>
 </div>
 )}

  <div className={isAdmin ? 'msg-admin' : 'msg-user'}
  style={{ display: 'flex', flexDirection: isAdmin ? 'row' : 'row-reverse', alignItems: 'flex-end', gap: 8, marginTop: sameSenderAsPrev ? 3 : 12 }}>

  {/* Left avatar for Received (Admin) messages — only on last message of group */}
  {isAdmin && (
    showAvatar
      ? (
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 6px rgba(79,70,229,0.3)' }}>
          <FiShield size={13} color="#fff" />
        </div>
      )
      : <div style={{ width: 28, flexShrink: 0 }} />
  )}

  {/* Right mini avatar indicator for Sent (User) messages — only on last message of group */}
  {!isAdmin && (
    showAvatar
      ? (
        <div title="Sent & Delivered" style={{
          width: 15, height: 15, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--primary), #6366f1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.5rem', fontWeight: 900, color: '#fff',
          marginBottom: 2
        }}>
          {(msg.senderName || user?.name || 'U').charAt(0).toUpperCase()}
        </div>
      )
      : <div style={{ width: 15, flexShrink: 0 }} />
  )}

  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-start' : 'flex-end', maxWidth: isAdmin ? '88%' : '82%', width: '100%' }} >

 {/* Order tag chip — shown on first of each order group */}
 {(!prev || String(prev.orderId) !== String(msg.orderId) || !sameSenderAsPrev) && msg.orderId && (
 <div onClick={() => { if (!isAdmin) setSelectedOrderId(String(msg.orderId)); }}
 style={{
 display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 5,
 background: isAdmin ? 'rgba(99,102,241,0.09)' : 'rgba(255,255,255,0.18)',
 border: `1px solid ${isAdmin ? 'rgba(99,102,241,0.22)' : 'rgba(255,255,255,0.28)'}`,
 borderRadius: 20, padding: '3px 10px 3px 7px',
 fontSize: '0.67rem', fontWeight: 800,
 color: isAdmin ? 'var(--primary)' : 'rgba(255,255,255,0.9)',
 cursor: isAdmin ? 'default' : 'pointer',
 }}>
 <FiPackage size={10} />
 {isKhmer ? `ការបញ្ជាទិញ #${msg.orderId}` : `Order #${msg.orderId}`}{orderName ? ` · ${orderName}` : ''}
 </div>
 )}

 {/* Bubble — edit mode or normal */}
 {editingId === String(msg.id) ? (
 <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
 <input
 autoFocus
 value={editText}
 onChange={e => setEditText(e.target.value)}
 onKeyDown={e => {
 if (e.key === 'Enter' && !e.shiftKey) handleConfirmEdit(msg.id);
 if (e.key === 'Escape') setEditingId(null);
 }}
 style={{ flex: 1, borderRadius: 12, padding: '9px 13px', background: 'linear-gradient(135deg,var(--primary),#6366f1)', color: '#fff', border: '2px solid rgba(255,255,255,0.35)', fontSize: '0.88rem', outline: 'none', minWidth: 120 }}
 />
 <button onClick={() => handleConfirmEdit(msg.id)}
 style={{ width: 32, height: 32, borderRadius: '50%', background: '#22c55e', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
 <FiCheck size={14} color="#fff" />
 </button>
 <button onClick={() => setEditingId(null)}
 style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(100,116,139,0.2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', color: 'var(--text)' }}>
 
 </button>
 </div>
 ) : (
 <div
 onContextMenu={e => !isAdmin && !msg.deleted && openCtxMenu(e, msg)}
 onTouchStart={e => {
 if (!isAdmin && !msg.deleted) {
 longPressTimer.current = setTimeout(() => openCtxMenu(e.touches[0], msg), 600);
 }
 }}
 onTouchEnd={() => clearTimeout(longPressTimer.current)}
 onTouchMove={() => clearTimeout(longPressTimer.current)}
 style={{
 padding: '10px 14px',
 borderRadius: isAdmin
    ? (sameSenderAsPrev && sameSenderAsNext ? '4px 12px 12px 4px'
      : sameSenderAsPrev ? '4px 12px 16px 16px'
      : sameSenderAsNext ? '4px 16px 12px 4px'
      : '4px 16px 16px 16px')
    : (sameSenderAsPrev && sameSenderAsNext ? '12px 4px 4px 12px'
      : sameSenderAsPrev ? '12px 4px 16px 16px'
      : sameSenderAsNext ? '16px 4px 4px 12px'
      : '16px 4px 16px 16px'),
 background: msg.deleted ? 'transparent'
 : isAdmin ? 'var(--card-bg)'
 : 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)',
 color: msg.deleted ? 'var(--text-lighter)' : isAdmin ? 'var(--text)' : '#fff',
 border: msg.deleted ? '1.5px dashed var(--border)'
 : isAdmin ? '1px solid var(--border)' : 'none',
 boxShadow: msg.deleted ? 'none'
 : isAdmin ? '0 1px 6px rgba(0,0,0,0.06)' : '0 2px 10px rgba(99,102,241,0.28)',
 fontSize: msg.deleted ? '0.82rem' : '0.9rem',
 fontStyle: msg.deleted ? 'italic' : 'normal',
 lineHeight: 1.55, wordBreak: 'break-word', whiteSpace: 'pre-wrap',
 userSelect: 'text', cursor: (!isAdmin && !msg.deleted) ? 'context-menu' : 'default',
 }}>
 <RenderMessageContent msg={msg} isKhmer={isKhmer} navigate={navigate} storeProducts={storeProducts} />
 </div>
 )}

 {/* Timestamp + edited label */}
 <div style={{ fontSize: '0.63rem', color: 'var(--text-lighter)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
 {copiedId === String(msg.id) && <span style={{ color: '#22c55e', fontWeight: 700 }}> {isKhmer ? 'បានចម្លង' : 'Copied'}</span>}
 {!msg.deleted && msg.edited && <span style={{ opacity: 0.65 }}>{isKhmer ? 'បានកែសម្រួល ·' : 'edited ·'}</span>}
 {timeStr}
 {!isAdmin && !msg.deleted && ' '}
 </div>
 </div>
</div>
 </React.Fragment>
 );
 })}

  {/* AI Read & Replying Status Indicators (Stage 2 & Stage 3) */}
  {sending && aiStatus === 'seen' && (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8, marginBottom: 4 }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '5px 13px', borderRadius: 20,
        background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)',
        color: '#2563eb', fontSize: '0.74rem', fontWeight: 800
      }}>
        <DoubleCheckIcon color="#2563eb" />
        {isKhmer ? 'បានមើលឃើញ' : 'Seen'}
      </div>
    </div>
  )}

  {sending && aiStatus === 'typing' && (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 8, marginBottom: 4, alignItems: 'center', gap: 9 }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, var(--primary), #6366f1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: '0.85rem'
      }}>
        <FiShield size={16} color="#fff" />
      </div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '8px 16px', borderRadius: '18px 18px 18px 4px',
        background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.06)', color: 'var(--text)',
        fontSize: '0.78rem', fontWeight: 700
      }}>
        <span className="typing-dot" style={{ background: 'var(--primary)' }} />
        <span className="typing-dot" style={{ background: '#6366f1' }} />
        <span className="typing-dot" style={{ background: '#ec4899' }} />
        <span style={{ marginLeft: 3, color: 'var(--primary)', fontWeight: 800 }}>
          {isKhmer ? 'SAKU AI កំពុងឆ្លើយតប...' : 'SAKU AI is typing...'}
        </span>
      </div>
    </div>
  )}

  {sending && !aiStatus && (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6, gap: 4, alignItems: 'center' }}>
      <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
      <span style={{ fontSize: '0.68rem', color: 'var(--text-lighter)' }}>
        {isKhmer ? 'បានផ្ញើ…' : 'Sent…'}
      </span>
    </div>
  )}
 <div ref={messagesEndRef} style={{ height: 1, float: 'left', clear: 'both' }} />
 </div>

 {/*  Context menu (right-click / long-press on own messages)  */}
 {ctxMenu && (
 <div ref={ctxRef} style={{
 position: 'fixed',
 top: Math.min(ctxMenu.y + 4, window.innerHeight - 180),
 left: Math.min(ctxMenu.x, window.innerWidth - 190),
 zIndex: 9999,
 background: 'var(--card-bg)',
 border: '1px solid var(--border)',
 borderRadius: 14,
 boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
 overflow: 'hidden',
 minWidth: 175,
 animation: 'ctxFadeIn 0.15s ease both',
 }}>
 {[
 { icon: <FiCopy size={14} />, label: isKhmer ? 'ថតចម្លងអត្ថបទ' : 'Copy text', action: () => handleCopy(ctxMenu.content) },
 { icon: <FiEdit2 size={14} />, label: isKhmer ? 'កែប្រែសារ' : 'Edit message', action: handleStartEdit },
 { icon: <FiTrash2 size={14} />, label: isKhmer ? 'លុបសារ' : 'Delete message', action: handleDelete, danger: true },
 ].map((item, i) => (
 <button key={i} className={`ctx-menu-item${item.danger ? ' danger' : ''}`}
 onClick={item.action}
 style={{
 width: '100%', display: 'flex', alignItems: 'center', gap: 10,
 padding: '11px 16px', background: 'transparent', border: 'none',
 borderTop: i > 0 ? '1px solid var(--border)' : 'none',
 cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem',
 fontWeight: 600, color: item.danger ? '#ef4444' : 'var(--text)',
 transition: 'background 0.12s',
 }}>
 {item.icon} {item.label}
 </button>
 ))}
 </div>
 )}

 {/*  Order context picker  */}
  <div style={{ background: 'var(--card-bg)', borderTop: '1px solid var(--border)', padding: '8px 14px 6px', flexShrink: 0 }}>
    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-lighter)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
      <FiPackage size={11} /> {chatChannel === 'USER_SELLER' ? (isKhmer ? 'ការបញ្ជាទិញពីអតិថិជន:' : 'Customer Sales Orders:') : (isKhmer ? 'កំពុងសាកសួរអំពី:' : 'Asking about:')}
    </div>
    <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 2 }}>
      {orderList.length === 0 ? null : orderList.map(ord => {
        const oid = String(ord.id);
        const prodName = ord.items?.[0]?.product?.name || ord.productName || `Order #${oid}`;
        const isSel = String(selectedOrderId) === oid;
        return (
          <button key={oid}
            className={`order-ctx-chip${isSel ? ' selected' : ''}`}
            onClick={(e) => handleOrderChipClick(oid, e)}
            style={{
              padding: '7px 18px', borderRadius: 24, whiteSpace: 'nowrap', flexShrink: 0,
              border: isSel ? 'none' : '1.5px solid var(--border)',
              background: isSel 
                ? 'linear-gradient(135deg, #ff2a5f 0%, #ff6b8b 100%)' 
                : 'var(--card-bg, #ffffff)',
              color: isSel ? '#ffffff' : 'var(--text, #1e293b)',
              fontSize: '0.78rem', fontWeight: isSel ? 800 : 600,
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: isSel ? '0 4px 14px rgba(255, 42, 95, 0.38)' : '0 2px 5px rgba(0,0,0,0.03)',
              cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
            <FiPackage size={11} />
            #{oid} · {prodName}
            {ord.status === 'CANCELLED' && <span style={{ fontSize: '0.6rem', background: '#ef4444', color: '#fff', borderRadius: 8, padding: '1px 5px', fontWeight: 800 }}>{isKhmer ? 'បានបោះបង់' : 'CANCELLED'}</span>}
            {ord.status === 'COMPLETED' && <span style={{ fontSize: '0.6rem', background: '#22c55e', color: '#fff', borderRadius: 8, padding: '1px 5px', fontWeight: 800 }}>{isKhmer ? 'បានទូទាត់' : 'PAID'}</span>}
          </button>
        );
      })}
    </div>
  </div>

  {/*  Quick prompts (Smart follow-up and action chips for AI Chat)  */}
  {chatChannel !== 'USER_SELLER' && (
    <div style={{ padding: '8px 14px', background: 'var(--card-bg)', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, overflowX: 'auto', flexShrink: 0 }}>
      {(() => {
        const generalSellerPrompts = isKhmer
          ? ['បាទ/ចាស ', 'ត្រូវការជំនួយបន្ថែម ', 'របៀបលក់នៅលើ SABY SHOP ', 'គម្រោងហាង និងតម្លៃ ', 'ការដកប្រាក់ចំណូល ', 'ទម្រង់បញ្ចូលស្តុក ']
          : ['Yes ', 'Still need help ', 'How to Sell on SABY SHOP ', 'Store Plans & Pricing ', 'How to Withdraw ', 'Stock Upload Format '];

        const generalUserPrompts = isKhmer
          ? ['បាទ/ចាស ', 'ត្រូវការជំនួយបន្ថែម ', 'របៀបលក់នៅលើ SABY SHOP ', 'របៀបទិញ និងទូទាត់ ', 'ពិនិត្យគណនី និងលេខសម្ងាត់ ']
          : ['Yes ', 'Still need help ', 'How to Sell on SABY SHOP ', 'How to Buy / Payment ', 'Check Order Credentials '];

        const activeQuickPrompts = chatChannel === 'SELLER_ADMIN'
          ? generalSellerPrompts
          : (selectedOrderId && quickPrompts.length > 0 ? [...quickPrompts, isKhmer ? 'បាទ/ចាស ' : 'Yes ', isKhmer ? 'ត្រូវការជំនួយបន្ថែម ' : 'Still need help '] : generalUserPrompts);

        return activeQuickPrompts.map((prompt, idx) => {
          const isAffirmative = prompt.includes('Yes') || prompt.includes('បាទ/ចាស');
          return (
            <button key={idx} className="quick-chip"
              onClick={() => handleSendMessage(prompt)}
              style={{
                padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0,
                background: isAffirmative ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.15))' : 'var(--bg-secondary)',
                color: isAffirmative ? '#15803d' : 'var(--primary)',
                border: isAffirmative ? '1.5px solid rgba(34, 197, 94, 0.4)' : '1.5px solid rgba(99,102,241,0.28)',
                fontSize: '0.76rem', fontWeight: 800, cursor: 'pointer', transition: 'all .18s',
                display: 'inline-flex', alignItems: 'center', gap: 5
              }}>
              {prompt}
            </button>
          );
        });
      })()}
    </div>
  )}

  {/*  Input bar  */}
  <div style={{ padding: '10px 14px', background: 'var(--card-bg)', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
    <input ref={inputRef} className="input"
      placeholder={chatChannel === 'SELLER_ADMIN'
        ? (isKhmer ? 'សរសេរសំណួររបស់អ្នកទៅកាន់ Seller Support…' : 'Type your question to Seller Support…')
        : selectedOrderId
          ? (isKhmer 
             ? `សួរអំពីការបញ្ជាទិញ #${selectedOrderId}${selectedProdName ? ` · ${selectedProdName}` : ''}…`
             : `Ask about Order #${selectedOrderId}${selectedProdName ? ` · ${selectedProdName}` : ''}…`)
          : (isKhmer ? 'វាយសាររបស់អ្នកទៅកាន់ AI Support…' : 'Type your message to AI Support…')}
      value={inputText}
      onChange={e => setInputText(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
      style={{ flex: 1, borderRadius: 24, paddingLeft: 18, paddingRight: 18, minWidth: 0, height: 44, fontSize: '0.9rem' }}
    />
    <button className="send-btn"
      onClick={() => handleSendMessage()}
      disabled={sending || !inputText.trim() || (!selectedOrderId && chatChannel === 'USER_SELLER')}
      style={{
        width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: (inputText.trim() && (selectedOrderId || chatChannel !== 'USER_SELLER')) ? 'linear-gradient(135deg,var(--primary),#6366f1)' : 'var(--border)',
        transition: 'all .2s', opacity: sending ? 0.6 : 1,
        boxShadow: (inputText.trim() && (selectedOrderId || chatChannel !== 'USER_SELLER')) ? '0 4px 14px rgba(99,102,241,.35)' : 'none',
      }}>
      <FiSend size={17} color={(inputText.trim() && (selectedOrderId || chatChannel !== 'USER_SELLER')) ? '#fff' : 'var(--text-lighter)'} />
    </button>
  </div>
  </div>
  </div>
  );
};

export default ChatHistoryPage;
