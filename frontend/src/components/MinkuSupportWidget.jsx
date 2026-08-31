import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { FiX, FiMinus, FiSend, FiPaperclip, FiHeadphones, FiCheck } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { chat as chatApi } from '../api/client';

const SAKU_AVATAR = '/assets/saku-avatar.png';

const SAKUSupportWidget = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { isKhmer } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Active Mode: Seller Mode ONLY when inside seller dashboard/portal routes
  const isSellerMode = location.pathname.startsWith('/seller');
  const storageKey = isSellerMode ? 'saku_chat_messages_seller' : 'saku_chat_messages_user';

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [
      {
        id: 'welcome-1',
        sender: 'SAKU',
        content: isSellerMode
          ? (isKhmer
              ? 'សួស្តីលោកអ្នកលក់! SAKU នៅទីនេះដើម្បីជួយសម្រួលរាល់កិច្ចការហាងរបស់អ្នក (Store Plans, ការដកប្រាក់, បញ្ចូលស្តុក)។ តើខ្ញុំអាចជួយអ្វីបានខ្លះ?'
              : "Hello Seller! SAKU is here to help with your store plans, payouts, stock, or questions. How can I assist you today?")
          : (isKhmer
              ? 'សួស្តី! SAKU រីករាយណាស់ដែលបានជួបអ្នកនៅ SABY SHOP! តើខ្ញុំអាចជួយអ្វីដល់អ្នកថ្ងៃនេះបានខ្លះ?'
              : "Hello! SAKU is here to help with any questions you may have about SABY SHOP. Is there anything you'd like to ask?"),
        time: isKhmer ? 'ថ្ងៃនេះ' : 'Today'
      }
    ];
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Track active seller tab for exact visibility control
  const [sellerTab, setSellerTab] = useState(() => {
    return (typeof document !== 'undefined' && document.body.getAttribute('data-seller-tab')) || 'overview';
  });

  useEffect(() => {
    const handleTabChange = (e) => {
      setSellerTab(e.detail || (typeof document !== 'undefined' && document.body.getAttribute('data-seller-tab')) || 'overview');
    };
    window.addEventListener('seller-tab-change', handleTabChange);
    return () => window.removeEventListener('seller-tab-change', handleTabChange);
  }, []);

  // Show floating support headset icon ONLY on Home (/) and Store (/store) pages
  const pathname = location.pathname.toLowerCase();
  const isHomePage = pathname === '/' || pathname === '/home';
  const isStorePage = pathname === '/store' || pathname.startsWith('/store');

  const isAllowedPage = isHomePage || isStorePage;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        setMessages([
          {
            id: 'welcome-1',
            sender: 'SAKU',
            content: isSellerMode
              ? (isKhmer
                  ? 'សួស្តីលោកអ្នកលក់! SAKU នៅទីនេះដើម្បីជួយសម្រួលរាល់កិច្ចការហាងរបស់អ្នក (Store Plans, ការដកប្រាក់, បញ្ចូលស្តុក)។ តើខ្ញុំអាចជួយអ្វីបានខ្លះ?'
                  : "Hello Seller! SAKU is here to help with your store plans, payouts, stock, or questions. How can I assist you today?")
              : (isKhmer
                  ? 'សួស្តី! SAKU រីករាយណាស់ដែលបានជួបអ្នកនៅ SABY SHOP! តើខ្ញុំអាចជួយអ្វីដល់អ្នកថ្ងៃនេះបានខ្លះ?'
                  : "Hello! SAKU is here to help with any questions you may have about SABY SHOP. Is there anything you'd like to ask?"),
            time: isKhmer ? 'ថ្ងៃនេះ' : 'Today'
          }
        ]);
      }
    } catch (_) {}
  }, [storageKey, isSellerMode, isKhmer]);

  useEffect(() => {
    const handleOpenSAKU = () => {
      setIsOpen(true);
    };
    window.addEventListener('open_saku_support', handleOpenSAKU);
    return () => window.removeEventListener('open_saku_support', handleOpenSAKU);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (_) {}
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, storageKey]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const getTimeString = () => {
    const now = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const day = days[now.getDay()];
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day} ${hours}:${minutes} ${ampm}`;
  };

  const generateLocalReply = (query) => {
    const rawLower = query.toLowerCase().trim();

    // 1. GREETING
    if (rawLower.match(/^(hello|hi|hey|helo|holla|good morning|good afternoon|good evening|alo|សួស្ដី|ជំរាបសួរ|សួស្តី)[!?. ]*$/) ||
        rawLower === 'hello' || rawLower === 'hi' || rawLower === 'សួស្ដី' || rawLower === 'សួស្តី' || rawLower === 'ជម្រាបសួរ') {
      return 'សួស្តី! SAKU រីករាយណាស់ដែលបានជួបបងនៅ SABY SHOP! តើខ្ញុំអាចជួយអ្វីដល់បងថ្ងៃនេះបានខ្លះ?';
    }

    // 2. PROBLEM WITH SELLER / DISPUTE / COMPLAINT / REPLACEMENT
    if ((rawLower.includes('seller') && (rawLower.includes('problem') || rawLower.includes('issue') || rawLower.includes('wrong') || rawLower.includes('defect') || rawLower.includes('fake') || rawLower.includes('scam') || rawLower.includes('help') || rawLower.includes('contact') || rawLower.includes('what') || rawLower.includes('need') || rawLower.includes('report') || rawLower.includes('dispute') || rawLower.includes('replace') || rawLower.includes('not working') || rawLower.includes('not reply'))) ||
        rawLower.includes('dispute') || rawLower.includes('report issue') || rawLower.includes('complain') || rawLower.includes('replacement') || rawLower.includes('refund') ||
        rawLower.includes('បញ្ហាអ្នកលក់') || rawLower.includes('មានបញ្ហាជាមួយអ្នកលក់') || rawLower.includes('អ្នកលក់មិនឆ្លើយ') ||
        rawLower.includes('ខូច') || rawLower.includes('វិវាទ') || rawLower.includes('ប្តឹង') || rawLower.includes('ប្ដឹង') || rawLower.includes('ប្តូរ') || rawLower.includes('សងលុយ')) {
      return 'ប្រសិនបើបងមានបញ្ហាជាមួយអ្នកលក់ (គណនីខុស, ខូច, ឬផុតកំណត់មុនថ្ងៃ) សូមអនុវត្តតាមជំហាន 4 ដូចខាងក្រោម ៖\n\n' +
        '1. ពិនិត្យទំព័រ Order ៖ ចូលទៅកាន់ Orders រួចពិនិត្យមើល Email និងលេខសម្ងាត់ដែលទទួលបាន\n' +
        '2. Chat ផ្ទាល់ជាមួយអ្នកលក់ ៖ ចុចប៊ូតុង "Chat with Seller" លើ Order ដើម្បីស្នើសុំប្ដូរ Account ថ្មីភ្លាមៗ\n' +
        '3. បើកពាក្យបណ្ដឹងវិវាទ (Open Dispute) ៖ ប្រសិនបើអ្នកលក់មិនឆ្លើយតបលើសពី 24 ម៉ោង សូមចុច "Open Dispute" ឬ "Report Issue"\n' +
        '4. ការការពារពី Saby Shop ៖ Admin នឹងពិនិត្យ System Logs ដើម្បីកាត់ក្ដីយុត្តិធម៌ និងប្ដូរទំនិញថ្មី ឬសងប្រាក់ជូនបងវិញ ១០០%!\n\n' +
        'ប្រសិនបើត្រូវការជំនួយបន្ទាន់ សូមទាក់ទងមកកាន់ Telegram Support @saby_shop_support!';
    }

    // 3. CANVA INVITE LINK ISSUE
    if (rawLower.includes('canva') || (rawLower.includes('invite') && rawLower.includes('link')) || rawLower.includes('កានវ៉ា')) {
      return 'បញ្ហា Canva Pro (Link Invite ផុតកំណត់) ៖\n\n' +
        '1. មូលហេតុ ៖ Link Invite របស់ Canva ផុតកំណត់ស្វ័យប្រវត្តក្នុងរយៈពេល 7 ថ្ងៃ (ជាប្រព័ន្ធរបស់ Canva Platform)\n' +
        '2. ដំណោះស្រាយ ៖ សូមផ្ញើ Email Canva របស់បងទៅកាន់អ្នកលក់តាមរយៈ Order Chat ឬផ្ញើមក Telegram @saby_shop_support ដើម្បីទទួល Invite Link ថ្មីភ្លាមៗ!';
    }

    // 4. NETFLIX & SPOTIFY TROUBLESHOOTING
    if (rawLower.includes('netflix') || rawLower.includes('spotify') || rawLower.includes('chatgpt') || rawLower.includes('youtube') || rawLower.includes('capcut')) {
      return 'ការណែនាំដោះស្រាយបញ្ហាគណនីឌីជីថល ៖\n\n' +
        '1. ពិនិត្យការ Login ៖ សាកល្បង Login លើផ្ទាំង Incognito / Private Window\n' +
        '2. Clear Cache ៖ សម្អាត Cache Browser ឬ App រួច Sign In ឡើងវិញ\n' +
        '3. ការធានា 100% ៖ ប្រសិនបើ Account ពិតជាខូច សូមចុច Chat with Seller ឬ Open Dispute ដើម្បីទទួល Account ថ្មីភ្លាមៗ!';
    }

    // 5. HOW TO SELL & ONBOARDING
    if (rawLower.includes('how do i sell') || rawLower.includes('how to sell') ||
        rawLower.includes('start sell') || rawLower.includes('become seller') || rawLower.includes('open store') ||
        rawLower.includes('onboard') || rawLower.includes('របៀបលក់') || rawLower.includes('ចង់លក់') || rawLower.includes('បើកហាង') ||
        rawLower.includes('ចុះឈ្មោះលក់') || rawLower.includes('របៀបបង្កើតហាង')) {
      return 'ដើម្បីលក់នៅលើ SABY SHOP សូមអនុវត្តតាម 6 ជំហានដូចខាងក្រោម ៖\n\n' +
        '1. ចុះឈ្មោះគណនី (Register Account) ៖ ចុះឈ្មោះគណនី SABY SHOP ជាមួយអ៊ីមែល ឬលេខទូរស័ព្ទ\n' +
        '2. ចូលទៅកាន់ Seller Onboarding ៖ ចូលទៅកាន់ផ្ទាំង "Become a Seller" ឬផ្ទាំង Dashboard\n' +
        '3. បំពេញព័ត៌មានហាង ៖ បំពេញឈ្មោះហាង, ឡូហ្គោ, និងការពិពណ៌នាពីហាងរបស់អ្នក\n' +
        '4. ភ្ជាប់គណនីទទួលប្រាក់ ៖ ភ្ជាប់គណនី Bakong KHQR / ABA Bank ដើម្បីដកប្រាក់ចំណូល\n' +
        '5. ជ្រើសរើសគម្រោងហាង ៖ ជ្រើសរើសគម្រោង (Starter $2.50, Pro $4.50, VIP $6.00/ខែ)\n' +
        '6. បញ្ចូលស្តុកឌីជីថល ៖ ដាក់ស្តុកជាទម្រង់ email:password នោះប្រព័ន្ធនឹង Auto-Delivery ជូនអតិថិជនភ្លាមៗពេលទូទាត់រួច!\n\n' +
        'ប្រសិនបើត្រូវការជំនួយបន្ថែម សូមទាក់ទងមកកាន់ Telegram Support @saby_shop_support!';
    }

    // 6. HOW TO BUY & PAYMENT
    if (rawLower.includes('how to buy') || rawLower.includes('how to pay') || rawLower.includes('how to order') ||
        rawLower.includes('buy') || rawLower.includes('pay') || rawLower.includes('order') ||
        rawLower.includes('khqr') || rawLower.includes('bakong') || rawLower.includes('ទិញ') || rawLower.includes('ទូទាត់') ||
        rawLower.includes('របៀបទិញ') || rawLower.includes('បង់ប្រាក់')) {
      return 'របៀបទិញ និងទូទាត់នៅលើ SABY SHOP ៖\n\n' +
        '1. ជ្រើសរើសផលិតផលឌីជីថលដែលបងត្រូវការ (Canva, CapCut, Spotify, Netflix, ChatGPT, YouTube)\n' +
        '2. ចុចប៊ូតុង "Buy Now" ឬ "Add to Cart" រួចបន្តទៅ Checkout\n' +
        '3. ស្កេនទូទាត់តាម Bakong KHQR (ជាមួយ App ធនាគារណាក៏បាន ABA, ACLEDA, Wing)\n' +
        '4. ទទួលបានលេខសម្ងាត់គណនី (Email និង Password) ភ្លាមៗ 100% Instant Delivery ក្នុងទំព័រ Order!\n\n' +
        'តើបងត្រូវការជំនួយលើការបញ្ជាទិញណាមួយជាក់លាក់ដែរទេ?';
    }

    // 7. STORE PLANS & PRICING
    if (rawLower.includes('plan') || rawLower.includes('pricing') || rawLower.includes('price') ||
        rawLower.includes('fee') || rawLower.includes('subscription') || rawLower.includes('គម្រោង') || rawLower.includes('តម្លៃ')) {
      return 'គម្រោងហាង (Store Subscription Plans) នៅលើ SABY SHOP ៖\n\n' +
        '- Starter ($2.50/ខែ) ៖ ដាក់លក់បាន 10 មុខទំនិញ, ប្រព័ន្ធ Auto-Delivery ស្តង់ដារ\n' +
        '- Pro ($4.50/ខែ) ៖ ដាក់លក់បានមិនកំណត់, Priority Auto-Delivery, Analytics Dashboard, Verified Badge\n' +
        '- VIP ($6.00/ខែ) ៖ ដកប្រាក់ចំណូលបានភ្លាមៗ Instant, ដាក់ហាងលេចធ្លោលើគេ, ជំនួយពិសេស 24/7\n\n' +
        'ចូលទៅកាន់ Seller Dashboard > Store Settings ដើម្បី Upgrade គម្រោង!';
    }

    // 8. WITHDRAWALS & PAYOUTS
    if (rawLower.includes('withdraw') || rawLower.includes('payout') || rawLower.includes('balance') ||
        rawLower.includes('ដកប្រាក់') || rawLower.includes('ដកលុយ') || rawLower.includes('ចំណូល')) {
      return 'ព័ត៌មានស្ដីពីការដកប្រាក់ចំណូល (Withdrawal/Payout) ៖\n\n' +
        '- ចំនួនទឹកប្រាក់ដកអប្បបរមា ៖ $5.00\n' +
        '- វិធីសាស្រ្តទូទាត់ ៖ ផ្ទេរផ្ទាល់តាមរយៈ Bakong KHQR / ABA Bank\n' +
        '- រយៈពេលដំណើរការ ៖ ក្រោម 24 ម៉ោង (VIP ដកបានភ្លាមៗ Instant)\n\n' +
        'របៀបស្នើសុំ ៖ ចូលទៅកាន់ Seller Dashboard > Withdrawals រួចបញ្ចូលចំនួនទឹកប្រាក់ និងរូប QR KHQR របស់អ្នក!';
    }

    // 9. PURE CONFIRMATION ONLY
    const isPureConfirm = rawLower === 'yes' || rawLower === 'ok' || rawLower === 'okay' ||
                          rawLower === 'done' || rawLower === 'resolved' || rawLower === 'good' ||
                          rawLower === 'បាទ' || rawLower === 'ចាស' || rawLower === 'រួចរាល់' ||
                          rawLower === 'អរគុណ' || rawLower === 'បានហើយ' ||
                          rawLower === 'ok thanks' || rawLower === 'yes thanks' || rawLower === 'ok thank you' ||
                          (rawLower.length <= 8 && (rawLower.includes('អរគុណ') || rawLower.includes('thank')));

    if (isPureConfirm) {
      return 'សូមអរគុណសម្រាប់ការបញ្ជាក់, បង! ប្រសិនបើបងមានសំណួរផ្សេងទៀត ឬត្រូវការជំនួយបន្ថែមទាក់ទងនឹងការលក់ ឬការទិញនៅលើ SABY SHOP សូមកុំស្ទាក់ស្ទើរក្នុងការសួរ។ ពួកយើងនៅទីនេះដើម្បីជួយបងជានិច្ច!';
    }

    // Fallback friendly reply
    return 'SAKU បានទទួលសំណួររបស់បងហើយ! ពួកយើងរីករាយនឹងជួយសម្រួលជូនរាល់ការទិញ និងការលក់នៅលើ SABY SHOP។ បើបងជួបបញ្ហាលើការបញ្ជាទិញណាមួយ សូមផ្តល់លេខ Order ID ឬចុច "Chat with Seller" / "Open Dispute" ក្នុងទំព័រ Orders ឬទាក់ទង Telegram @saby_shop_support!';
  };

  const handleSend = async (textToSend) => {
    if (isTyping || isSending) return;
    const query = (textToSend || inputText).trim();
    if (!query) return;

    setIsSending(true);
    setIsTyping(true);
    setInputText('');

    const userMsg = {
      id: 'msg-' + Date.now(),
      sender: 'USER',
      content: query,
      time: getTimeString()
    };

    setMessages(prev => [...prev, userMsg]);

    let replyContent = null;

    // 1. If logged in, call backend AI chat service
    if (user) {
      try {
        const activeLang = isKhmer ? 'km' : 'en';
        const activeChannel = isSellerMode ? 'SELLER_ADMIN' : 'USER_ADMIN';
        const res = await chatApi.sendMessage(0, query, null, activeLang, activeChannel);
        const payload = res.data?.data || res.data;
        if (payload?.autoReply?.content) {
          replyContent = payload.autoReply.content;
        } else if (payload?.content) {
          replyContent = payload.content;
        }
      } catch (err) {
        console.warn("Backend chat API error, fallback to local reply:", err);
      }
    }

    // 2. Fallback to smart local reply if backend AI was offline
    if (!replyContent) {
      replyContent = generateLocalReply(query);
    }

    setTimeout(() => {
      const botMsg = {
        id: 'reply-' + Date.now(),
        sender: 'SAKU',
        content: replyContent,
        time: getTimeString()
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
      setIsSending(false);
    }, 80);
  };

  if (!isAllowedPage && !isOpen) {
    return null;
  }

  return (
    <>
      {/* Floating Headset Button (matches video bottom right) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="saku-floating-fab"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: '#fff',
            border: 'none',
            boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          aria-label="Open SAKU AI Support"
        >
          <FiHeadphones size={22} />
          {/* Online green dot */}
          <span style={{
            position: 'absolute',
            top: 2,
            right: 2,
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#22c55e',
            border: '2px solid #ffffff'
          }} />
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div
          className="saku-chat-window animate-slide-up"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 10000,
            width: 'min(360px, calc(100vw - 20px))',
            height: 'min(520px, calc(100vh - 90px))',
            borderRadius: '18px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'inherit'
          }}
        >
          {/* Header (SAKU, AI Support, -, x) */}
          <div style={{
            padding: '10px 14px',
            background: '#ffffff',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: '#fef08a',
                overflow: 'hidden',
                border: '1.5px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <img src={SAKU_AVATAR} alt="SAKU" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', lineHeight: 1.2 }}>
                  {isSellerMode ? 'SAKU (Seller Support)' : 'SAKU'}
                </div>
                <div style={{ fontSize: '0.70rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                  {isSellerMode ? (isKhmer ? 'ផ្នែកជំនួយអ្នកលក់ (VIP)' : 'Seller VIP Support') : 'AI Support'}
                </div>
              </div>
            </div>

            {/* Header Control Buttons (- and x) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: '#f8fafc',
                  border: 'none',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
                aria-label="Minimize"
              >
                <FiMinus size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#DC2626',
                  cursor: 'pointer'
                }}
                aria-label="Close"
              >
                <FiX size={15} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 14px',
            background: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}>
            {messages.map((m) => {
              const isBot = m.sender === 'SAKU';

              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: isBot ? 'row' : 'row-reverse',
                    alignItems: 'flex-start',
                    gap: 8
                  }}
                >
                  {isBot && (
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: '#fef08a',
                      overflow: 'hidden',
                      border: '1px solid #e2e8f0',
                      flexShrink: 0,
                      marginTop: 2
                    }}>
                      <img src={SAKU_AVATAR} alt="SAKU" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isBot ? 'flex-start' : 'flex-end',
                    maxWidth: '85%'
                  }}>
                    <div style={{
                      padding: '9px 13px',
                      borderRadius: isBot ? '14px 14px 14px 4px' : '14px 14px 4px 14px',
                      background: isBot ? '#ffffff' : '#2563eb',
                      color: isBot ? '#1e293b' : '#ffffff',
                      border: isBot ? '1px solid #e2e8f0' : 'none',
                      boxShadow: isBot ? '0 1px 4px rgba(0,0,0,0.03)' : '0 2px 8px rgba(37,99,235,0.25)',
                      fontSize: '0.82rem',
                      lineHeight: 1.45,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {m.content}
                    </div>

                    <div style={{
                      fontSize: '0.64rem',
                      color: '#94a3b8',
                      marginTop: 3,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      {m.time}
                      {!isBot && <FiCheck size={10} color="#2563eb" />}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 3-dots typing indicator */}
            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#fef08a',
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                  flexShrink: 0
                }}>
                  <img src={SAKU_AVATAR} alt="SAKU" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{
                  padding: '8px 14px',
                  borderRadius: '14px 14px 14px 4px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <span className="typing-dot" style={{ background: '#2563eb', width: 5, height: 5, borderRadius: '50%' }} />
                  <span className="typing-dot" style={{ background: '#3b82f6', width: 5, height: 5, borderRadius: '50%' }} />
                  <span className="typing-dot" style={{ background: '#60a5fa', width: 5, height: 5, borderRadius: '50%' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar & Saby AI footer */}
          <div style={{
            padding: '8px 12px 6px',
            background: '#ffffff',
            borderTop: '1px solid #f1f5f9',
            flexShrink: 0
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f8fafc',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              padding: '3px 6px 3px 12px'
            }}>
              <input
                ref={inputRef}
                type="text"
                disabled={isSending || isTyping}
                placeholder={isSending || isTyping ? (isKhmer ? 'កំពុងឆ្លើយតប...' : 'Replying...') : (isKhmer ? 'វាយសាររបស់អ្នក...' : 'Type your message')}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.82rem',
                  color: '#0f172a',
                  opacity: (isSending || isTyping) ? 0.6 : 1
                }}
              />
              <button
                type="button"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  padding: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                aria-label="Attach file"
              >
                <FiPaperclip size={16} />
              </button>
              <button
                onClick={() => handleSend()}
                disabled={!inputText.trim() || isSending || isTyping}
                style={{
                  background: (inputText.trim() && !isSending && !isTyping) ? '#2563eb' : '#cbd5e1',
                  border: 'none',
                  borderRadius: '50%',
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor: (inputText.trim() && !isSending && !isTyping) ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s',
                  marginLeft: 4
                }}
                aria-label="Send message"
              >
                <FiSend size={13} />
              </button>
            </div>

            {/* Powered by Saby AI */}
            <div style={{
              textAlign: 'center',
              marginTop: 4,
              fontSize: '0.64rem',
              color: '#94a3b8',
              fontWeight: 600
            }}>
              {isKhmer ? 'ដំណើរការដោយ ' : 'Powered by '}<span style={{ color: '#2563eb', fontWeight: 800 }}>Saby AI</span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Elevated position so it floats above mobile & seller bottom bars without blocking icons */
        .saku-floating-fab {
          bottom: 84px !important;
          right: 20px !important;
        }
        @media (max-width: 768px) {
          .saku-floating-fab {
            bottom: 84px !important;
            right: 14px !important;
            width: 44px !important;
            height: 44px !important;
          }
          .saku-chat-window {
            bottom: 74px !important;
            right: 10px !important;
            max-height: calc(100vh - 84px) !important;
          }
        }
      `}</style>
    </>
  );
};

export default SAKUSupportWidget;
