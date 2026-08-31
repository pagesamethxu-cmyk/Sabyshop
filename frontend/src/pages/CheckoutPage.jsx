import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { orders as ordersApi, products as productsApi, coupons as couponsApi } from '../api/client';
import { generateKHQR, generateMD5 } from '../utils/khqr';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import ConfettiEffect from '../components/ConfettiEffect';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { getProductImageUrl } from '../utils/productImages';
import { getProductTypeInfo } from '../utils/productOptions';
import { FiDownload, FiClock, FiShield, FiCheckCircle, FiRefreshCw, FiArrowRight, FiArrowLeft, FiPercent, FiTag, FiCheck, FiX, FiMail } from 'react-icons/fi';
import PaymentModal from '../components/PaymentModal';

const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS  = 4 * 60 * 1000; // 4 minutes timeout

// ABA PayWay merchant Bakong acquiring ID (used as KHQR accountId for ABA PayWay transactions)
const ACCOUNT_ID = import.meta.env.VITE_ABA_ACCOUNT_ID || import.meta.env.VITE_BAKONG_ACCOUNT_ID || 'ec477571@abaa';
const BANK_PHONE  = import.meta.env.VITE_ABA_PHONE || import.meta.env.VITE_BAKONG_PHONE || '0972089305';
const DOLLAR_LOGO_SVG  = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="49" fill="%23ffffff"/><circle cx="50" cy="50" r="40" fill="%23000000"/><text x="50" y="66" font-size="54" font-weight="900" font-family="Arial, sans-serif" fill="%23ffffff" text-anchor="middle">$</text></svg>';


export default function CheckoutPage() {
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();

  // All state at top
  const [checkoutItems,  setCheckoutItems]  = useState(() => items);
  const [dbProducts,     setDbProducts]     = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [isPreparingQR,  setIsPreparingQR]  = useState(false);
  const [preparingSecondsLeft, setPreparingSecondsLeft] = useState(6);
  const [preparingProgress, setPreparingProgress] = useState(0);
  const preparationProgressRef = useRef(null);
  const autoCheckoutStartedRef = useRef(false);

  const [showConfetti,   setShowConfetti]   = useState(false);
  const [qrCodeData,     setQrCodeData]     = useState(null);
  const [md5Hash,        setMd5Hash]        = useState(null);
  const [orderId,        setOrderId]        = useState(null);
  const [paymentStatus,  setPaymentStatus]  = useState('idle'); // idle | waiting | paid | expired | failed
  const [timeLeft,       setTimeLeft]       = useState(POLL_TIMEOUT_MS);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cardStyle, setCardStyle] = useState(() => {
    return localStorage.getItem('khqr_card_style') || 'aba';
  });

  const toggleCardStyle = (style) => {
    setCardStyle(style);
    localStorage.setItem('khqr_card_style', style);
  };

  const pollingRef   = useRef(null);
  const timeoutRef   = useRef(null);
  const countdownRef = useRef(null);

  const stopPolling = () => {
    clearInterval(pollingRef.current);
    clearTimeout(timeoutRef.current);
    clearInterval(countdownRef.current);
    if (preparationProgressRef.current) clearInterval(preparationProgressRef.current);
  };

  const startPollingForOrder = (targetOrderId, remainingTime = POLL_TIMEOUT_MS) => {
    stopPolling();
    setTimeLeft(remainingTime);

    let rem = remainingTime;
    countdownRef.current = setInterval(() => {
      rem -= 1000;
      setTimeLeft(rem);
      if (rem <= 0) clearInterval(countdownRef.current);
    }, 1000);

    const verifyNow = async () => {
      try {
        const res = await ordersApi.verify(targetOrderId);
        const status = res.data?.status ?? res.status;
        if (status === 'COMPLETED') {
          stopPolling();
          setPaymentStatus('paid');
          setShowConfetti(true);
          try {
            localStorage.removeItem('active_khqr_session');
            sessionStorage.removeItem('checkout_session');
          } catch (_) {}
          toast.success('Payment verified successfully!');
          setTimeout(() => navigate('/orders/' + targetOrderId), 6000);
        }
      } catch (_) {}
    };

    // Immediate check
    verifyNow();

    pollingRef.current = setInterval(verifyNow, POLL_INTERVAL_MS);

    timeoutRef.current = setTimeout(() => {
      stopPolling();
      setPaymentStatus('expired');
      try { localStorage.removeItem('active_khqr_session'); } catch (_) {}
      toast.error('Payment session expired.');
    }, remainingTime);
  };

  // Restore active payment session from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('active_khqr_session') || sessionStorage.getItem('checkout_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        const createdAt = parsed.createdAt || Date.now();
        const elapsed = Date.now() - createdAt;

        if (parsed.orderId && parsed.paymentStatus === 'waiting' && elapsed < POLL_TIMEOUT_MS) {
          if (parsed.items?.length > 0) setCheckoutItems(parsed.items);
          setOrderId(parsed.orderId);
          setQrCodeData(parsed.qrCodeData);
          setMd5Hash(parsed.md5Hash);
          setPaymentStatus('waiting');
          startPollingForOrder(parsed.orderId, POLL_TIMEOUT_MS - elapsed);
        } else if (parsed.items?.length > 0) {
          setCheckoutItems(parsed.items);
          if (parsed.orderId) setOrderId(parsed.orderId);
        }
      }
    } catch (_) {}
  }, []);

  // Fetch available products from database
  useEffect(() => {
    productsApi.getAll()
      .then(res => {
        const fetched = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setDbProducts(fetched);
      })
      .catch(err => console.warn('Could not fetch DB products for quick selector:', err));
  }, []);

  // Auto-verify immediately when user switches back from Banking App to Browser (VisibilityChange / Focus)
  useEffect(() => {
    const handleAppSwitchBack = async () => {
      if (document.visibilityState === 'visible') {
        try {
          const saved = localStorage.getItem('active_khqr_session');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.orderId && parsed.paymentStatus === 'waiting') {
              const res = await ordersApi.verify(parsed.orderId);
              const status = res.data?.status ?? res.status;
              if (status === 'COMPLETED') {
                stopPolling();
                setPaymentStatus('paid');
                setShowConfetti(true);
                localStorage.removeItem('active_khqr_session');
                toast.success('Payment verified!');
                setTimeout(() => navigate('/orders/' + parsed.orderId), 6000);
              }
            }
          }
        } catch (_) {}
      }
    };

    document.addEventListener('visibilitychange', handleAppSwitchBack);
    window.addEventListener('focus', handleAppSwitchBack);

    return () => {
      document.removeEventListener('visibilitychange', handleAppSwitchBack);
      window.removeEventListener('focus', handleAppSwitchBack);
    };
  }, [navigate]);

  // Keep checkoutItems in sync with cart when no order created yet
  useEffect(() => {
    if (!orderId && paymentStatus === 'idle') {
      setCheckoutItems(items);
    }
  }, [items, orderId, paymentStatus]);

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [globalInviteEmail, setGlobalInviteEmail] = useState(() => {
    const fromItem = items.find(i => i.buyerInviteEmail)?.buyerInviteEmail;
    return fromItem || user?.email || '';
  });

  useEffect(() => {
    if (user?.email && !globalInviteEmail) {
      setGlobalInviteEmail(user.email);
    }
  }, [user]);

  // Derive displayItems BEFORE any useEffect that references it
  const displayItems = checkoutItems.length > 0 ? checkoutItems : items;

  // Subtotal, Discount & Final Total Calculations
  const displaySubtotalPrice = displayItems.reduce((s, i) => s + (i.product?.price ?? 0) * (i.quantity ?? 1), 0);

  const couponDiscountAmount = appliedCoupon
    ? Math.min(appliedCoupon.discount || 0, displaySubtotalPrice)
    : 0;

  const displayTotalPrice = Math.max(0.01, Math.round((displaySubtotalPrice - couponDiscountAmount) * 100) / 100);

  // QR is generated manually when user clicks the button — no auto-start

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
      // Bug #8 fix: clear the session only if payment is NOT actively waiting
      // (if waiting, we want the session to persist for tab/app switching)
      setPaymentStatus(prev => {
        if (prev !== 'waiting') {
          try {
            localStorage.removeItem('active_khqr_session');
            sessionStorage.removeItem('checkout_session');
          } catch (_) {}
        }
        return prev;
      });
    };
  }, []);

  // Empty cart guard
  if (displayItems.length === 0 && !qrCodeData && !orderId && paymentStatus === 'idle') {
    return (
      <div className="container" style={{ padding: '60px 20px' }}>
        <EmptyState
          title={lang === 'km' ? 'កន្ត្រកទំនិញរបស់អ្នកទទេ!' : 'Your cart is empty!'}
          description={lang === 'km' ? 'សូមជ្រើសរើសទំនិញដើម្បីបន្តការទូទាត់។' : 'Add some items to checkout.'}
          actionText={lang === 'km' ? 'ទៅកាន់ហាង' : 'Go to Store'}
          actionLink="/store"
        />
      </div>
    );
  }

  //  Handlers 

  const handleApplyCoupon = async (e) => {
    if (e) e.preventDefault();
    const code = couponCodeInput.trim().toUpperCase();
    if (!code) {
      toast.error(lang === 'km' ? 'សូមបញ្ចូលកូដបញ្ចុះតម្លៃ' : 'Please enter a coupon code');
      return;
    }
    setValidatingCoupon(true);
    try {
      const firstItem = displayItems[0]?.product;
      const sellerId = firstItem?.sellerId || firstItem?.seller?.id || null;
      const payload = {
        code: code,
        orderAmount: displaySubtotalPrice,
        sellerId: sellerId,
        productId: firstItem?.id || null,
        items: displayItems.map(i => ({
          productId: i.product?.id,
          sellerId: i.product?.sellerId || i.product?.seller?.id || null,
          quantity: i.quantity,
          price: i.product?.price
        })),
      };
      const res = await couponsApi.validate(payload);
      const val = res.data?.data || res.data;
      if (val && (val.valid || val.isValid)) {
        const discountVal = Number(val.discountAmount || val.discount || 0);
        setAppliedCoupon({
          code: code,
          discount: discountVal,
          discountType: val.discountType,
          message: val.message || `ទទួលបានការបញ្ចុះតម្លៃ $${discountVal.toFixed(2)}`
        });
        toast.success(lang === 'km' ? `បានអនុវត្តកូដ "${code}" ជោគជ័យ! បញ្ចុះតម្លៃ -$${discountVal.toFixed(2)}` : `Coupon "${code}" applied! Saved -$${discountVal.toFixed(2)}`);
      } else {
        toast.error(val?.message || (lang === 'km' ? 'កូដបញ្ចុះតម្លៃមិនត្រឹមត្រូវ ឬផុតកំណត់' : 'Invalid or expired coupon code'));
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || (lang === 'km' ? 'កូដបញ្ចុះតម្លៃមិនត្រឹមត្រូវ' : 'Invalid coupon code'));
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    toast(lang === 'km' ? 'បានលុបកូដបញ្ចុះតម្លៃចេញ' : 'Coupon removed');
  };

  const getCheckoutMerchantName = () => {
    if (!displayItems || displayItems.length === 0) return 'Saby Shop';
    const firstProduct = displayItems[0]?.product;
    const sellerStoreName = firstProduct?.sellerStoreName || firstProduct?.sellerProfile?.storeName || firstProduct?.seller?.name;
    if (sellerStoreName && sellerStoreName.trim()) {
      return sellerStoreName.trim();
    }
    return 'Saby Shop';
  };

  const startCheckout = async () => {
    const hasSharing = displayItems.some(i => i.product?.productType === 'SHARING');
    const emailToUse = (globalInviteEmail || user?.email || '').trim();

    if (hasSharing) {
      if (!emailToUse || !emailToUse.includes('@')) {
        toast.error(lang === 'km' ? 'សូមបញ្ចូលអ៊ីមែលសម្រាប់ទទួល Invite ជាមុនសិន' : 'Please enter your invite email to continue');
        return;
      }
    }

    // Begin 3s preparation countdown animation
    setIsPreparingQR(true);
    setLoading(true);
    setPreparingSecondsLeft(3);
    setPreparingProgress(0);

    const PREPARATION_DURATION_MS = 3000;
    const startTime = Date.now();

    if (preparationProgressRef.current) clearInterval(preparationProgressRef.current);
    preparationProgressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / PREPARATION_DURATION_MS) * 100);
      const remainingSecs = Math.max(0, Math.ceil((PREPARATION_DURATION_MS - elapsed) / 1000));
      setPreparingProgress(progress);
      setPreparingSecondsLeft(remainingSecs);
      if (elapsed >= PREPARATION_DURATION_MS) {
        clearInterval(preparationProgressRef.current);
      }
    }, 50);

    // Wait 3 seconds for preparation
    await new Promise(resolve => setTimeout(resolve, PREPARATION_DURATION_MS));

    setTimeLeft(POLL_TIMEOUT_MS);
    try {
      const merchantLabel = getCheckoutMerchantName();

      // Step 1: Create the order first to get orderId
      // ABA PayWay tranId = "ORD-{orderId}" — need orderId before generating KHQR
      let newOrderId;
      try {
        const res = await ordersApi.create({
          items:     displayItems.map(i => ({
            productId: i.product.id,
            quantity: i.quantity,
            buyerInviteEmail: i.buyerInviteEmail || emailToUse || null,
            claimNote: i.claimNote || null
          })),
          buyerInviteEmail: emailToUse || null,
          couponCode: appliedCoupon?.code || null,
          discountAmount: couponDiscountAmount > 0 ? couponDiscountAmount : null,
        });
        newOrderId = res.data?.id ?? res.data?.data?.id;
      } catch (err) {
        console.error('Order creation failed:', err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          toast.error('Session expired or unauthorized. Please log in again.');
          navigate('/login', { state: { from: '/checkout' } });
          setPaymentStatus('failed');
          return;
        }
        const errMsg = err.response?.data?.message || err.message || 'Failed to create order on server';
        toast.error(`Order Creation Failed: ${errMsg}`);
        setPaymentStatus('failed');
        return;
      }

      if (!newOrderId) {
        toast.error('Order Creation Failed: No order ID returned from server');
        setPaymentStatus('failed');
        return;
      }

      // Step 2: Generate ABA PayWay KHQR with tranId = "ORD-{orderId}"
      // Backend verifies payment by calling ABA PayWay check-transaction-2 with this same tranId
      const abaTransId = 'ORD-' + newOrderId;
      const qr = generateKHQR({
        amount:       displayTotalPrice,
        billNumber:   abaTransId,
        accountId:    ACCOUNT_ID,
        merchantName: merchantLabel,
        merchantCity: 'Phnom Penh',
        storeLabel:   merchantLabel,
        phoneNumber:  BANK_PHONE,
        terminalLabel:'webqr',
      });

      setQrCodeData(qr);
      setMd5Hash(abaTransId); // reuse md5Hash state to hold tranId for reference
      setPaymentStatus('waiting');
      setOrderId(newOrderId);
      setIsPaymentModalOpen(true);

      // Save persistent active session to localStorage (preserves QR across app-switch / tab reload)
      const sessionData = {
        items: displayItems,
        orderId: newOrderId,
        qrCodeData: qr,
        md5Hash: abaTransId,
        paymentStatus: 'waiting',
        createdAt: Date.now()
      };
      try {
        localStorage.setItem('active_khqr_session', JSON.stringify(sessionData));
        sessionStorage.setItem('checkout_session', JSON.stringify(sessionData));
      } catch (_) {}

      clearCart();
      setIsPaymentModalOpen(true);
      toast.success(lang === 'km' ? 'បានបង្កើតការបញ្ជាទិញ! សូមស្កែន ABA QR ដើម្បីទូទាត់' : 'Order created — scan the ABA QR to pay!');

      // Start Polling & Verification (backend checks ABA PayWay by tranId = ORD-{orderId})
      startPollingForOrder(newOrderId, POLL_TIMEOUT_MS);

    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Failed to generate QR: ' + (err.message ?? 'Unknown error'));
      setPaymentStatus('failed');
    } finally {
      setIsPreparingQR(false);
      setLoading(false);
      if (preparationProgressRef.current) clearInterval(preparationProgressRef.current);
    }
  };

  // Auto-start checkout preparation if ?auto=1 was passed from ProductPage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isAuto = params.get('auto') === '1' || params.get('auto') === 'true';
    if (isAuto && !autoCheckoutStartedRef.current && paymentStatus === 'idle' && !orderId && displayItems.length > 0) {
      autoCheckoutStartedRef.current = true;
      startCheckout();
    }
  }, [displayItems, paymentStatus, orderId]);

  const resetCheckout = async () => {
    const currentOrderId = orderId;
    stopPolling();
    if (preparationProgressRef.current) clearInterval(preparationProgressRef.current);
    setIsPreparingQR(false);
    setIsPaymentModalOpen(false);
    setPaymentStatus('idle');
    setQrCodeData(null);
    setMd5Hash(null);
    setOrderId(null);
    setTimeLeft(POLL_TIMEOUT_MS);
    try {
      localStorage.removeItem('active_khqr_session');
      sessionStorage.removeItem('checkout_session');
    } catch (_) {}

    if (currentOrderId) {
      try {
        await ordersApi.cancel(currentOrderId);
      } catch (err) {
        console.warn('Backend order cancel notification:', err);
      }
    }
  };

  const downloadQR = () => {
    const svgEl = document.getElementById('khqr-svg');
    if (!svgEl) return;
    const data  = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    canvas.width = 600; canvas.height = 600;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, 600, 600);
      ctx.drawImage(img, 0, 0, 600, 600);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'khqr.png';
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(data)));
  };

  const formatTime = (ms) => {
    const t = Math.max(0, Math.floor(ms / 1000));
    return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
  };

  return (
    <div className="container checkout-page-container" style={{ padding: '24px 16px 60px' }}>
      {showConfetti && <ConfettiEffect />}

      {/* Top Back Navigation Button */}
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-outline"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '8px',
            fontSize: '0.78rem',
            fontWeight: 700,
            background: 'var(--card-bg, #ffffff)',
            borderColor: 'var(--border, #e2e8f0)',
            color: 'var(--text, #0f172a)',
            cursor: 'pointer',
            boxShadow: 'none',
            transition: 'var(--transition)'
          }}
        >
          <FiArrowLeft size={14} />
          <span>{lang === 'km' ? 'ត្រឡប់ទៅវិញ' : 'Back'}</span>
        </button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 className="checkout-title" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, marginBottom: '6px' }}>ការទូទាត់ប្រាក់</h1>
        <p className="checkout-subtitle" style={{ color: 'var(--text-light)', margin: 0 }}>សូមទូទាត់ប្រាក់ដើម្បីទទួលបានគណនីភ្លាមៗ។</p>
      </div>

      <div className="grid grid-2 checkout-grid" style={{ alignItems: 'start', gap: '32px' }}>

        {/*  Left: KHQR Payment Area  */}
        <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

            {/* PREPARING QR (5-7 seconds countdown) */}
            {isPreparingQR && (
              <div className="card" style={{
                width: '100%',
                padding: '36px 20px',
                textAlign: 'center',
                background: 'var(--bg-secondary)',
                border: '1.5px solid var(--border)',
                borderRadius: '20px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.06)'
              }}>
                <style>{`
                  @keyframes pulseRing {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4); }
                    70% { transform: scale(1.03); box-shadow: 0 0 0 16px rgba(79, 70, 229, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
                  }
                `}</style>

                {/* Animated QR icon container */}
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                  border: '2.5px solid #4F46E5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 18px',
                  animation: 'pulseRing 2s infinite ease-in-out',
                  color: '#4F46E5'
                }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                    <path d="M14 14h3v3h-3z"></path>
                    <path d="M18 18h3v3h-3z"></path>
                    <path d="M14 18h3v3h-3z"></path>
                  </svg>
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
                  {lang === 'km' ? 'កំពុងរៀបចំការទូទាត់ KHQR...' : 'Preparing Your KHQR Payment...'}
                </h3>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-light)', lineHeight: 1.5, marginBottom: '20px', maxWidth: '340px', margin: '0 auto 20px' }}>
                  {lang === 'km'
                    ? (preparingSecondsLeft > 4
                        ? 'កំពុងផ្ទៀងផ្ទាត់ព័ត៌មានទំនិញ...'
                        : preparingSecondsLeft > 2
                        ? 'កំពុងបង្កើតវិក្កយបត្រ និងភ្ជាប់ទៅប្រព័ន្ធ KHQR...'
                        : 'កំពុងរៀបចំកូដទូទាត់ប្រាក់សម្រាប់ស្កែន...')
                    : (preparingSecondsLeft > 4
                        ? 'Verifying product and order details...'
                        : preparingSecondsLeft > 2
                        ? 'Creating invoice & connecting to KHQR network...'
                        : 'Finalizing secure payment QR code...')}
                </p>

                {/* Countdown & Percentage Badge */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 18px',
                  borderRadius: 20,
                  background: 'rgba(79, 70, 229, 0.1)',
                  color: '#4F46E5',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  marginBottom: '16px'
                }}>
                  <FiClock size={14} />
                  <span>{lang === 'km' ? `សូមរង់ចាំ ${preparingSecondsLeft} វិនាទី` : `Please wait ${preparingSecondsLeft}s`}</span>
                  <span>&bull;</span>
                  <span style={{ fontFamily: 'monospace' }}>{Math.round(preparingProgress)}%</span>
                </div>

                {/* Smooth Progress Bar */}
                <div style={{
                  width: '100%',
                  maxWidth: '360px',
                  height: '10px',
                  borderRadius: '10px',
                  background: '#E2E8F0',
                  margin: '0 auto 16px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${preparingProgress}%`,
                    background: 'linear-gradient(90deg, #4F46E5 0%, #06B6D4 100%)',
                    borderRadius: '10px',
                    transition: 'width 0.1s linear'
                  }} />
                </div>

                <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                  {lang === 'km' ? 'ប្រព័ន្ធនឹងបើកផ្ទាំង QR Code ស្កែនទូទាត់ប្រាក់ដោយស្វ័យប្រវត្តិ' : 'QR code will automatically open when ready'}
                </div>
              </div>
            )}

            {/* IDLE */}
            {paymentStatus === 'idle' && !isPreparingQR && (() => {
              const firstProduct = displayItems[0]?.product;
              const firstProductImg = firstProduct ? getProductImageUrl(firstProduct.name, firstProduct.imageUrl) : null;
              return (
                <div style={{ width: '100%' }}>
                  <div style={{
                    border: '2px dashed var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '24px 20px',
                    marginBottom: '20px',
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    textAlign: 'center'
                  }}>
                    {firstProductImg ? (
                      <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
                        border: '2px solid #ffffff',
                        flexShrink: 0
                      }}>
                        <img src={firstProductImg} alt={firstProduct?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8">
                        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                        <rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 18h3v3h-3z"/>
                      </svg>
                    )}

                    {firstProduct && (
                      <div style={{ fontWeight: 800, fontSize: '1.02rem', color: 'var(--text)' }}>
                        {firstProduct.name} {displayItems.length > 1 && `+ ${displayItems.length - 1} ផ្សេងទៀត`}
                      </div>
                    )}

                    <span style={{ fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 600 }}>
                      ចុចខាងក្រោមដើម្បីបង្កើត QR Code ទូទាត់ប្រាក់ចំនួន <strong>${displayTotalPrice.toFixed(2)} USD</strong>
                    </span>
                  </div>

                  <button
                    id="btn-generate-khqr"
                    onClick={startCheckout}
                    className="btn btn-primary btn-lg"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      fontWeight: 800
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <LoadingSpinner />
                    ) : (
                      <>
                        {firstProductImg && (
                          <img
                            src={firstProductImg}
                            alt={firstProduct?.name}
                            style={{ width: '26px', height: '26px', borderRadius: '7px', objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.4)' }}
                          />
                        )}
                        <span>បង្កើត QR Code ទូទាត់ប្រាក់</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })()}

            {/* WAITING: Clean Card on Page (NO inline QR code behind modal) */}
            {paymentStatus === 'waiting' && (
              <div className="card" style={{ width: '100%', padding: '28px', textAlign: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '20px' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: '#EFF6FF', border: '2px solid #2563EB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 8px 20px rgba(37, 99, 235, 0.15)'
                }}>
                  <FiClock size={30} color="#2563EB" />
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
                  QR Code របស់អ្នកត្រៀមរួចរាល់ហើយ!
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-light)', lineHeight: 1.5, marginBottom: '20px' }}>
                  សូមចុចប៊ូតុងខាងក្រោមដើម្បីបើក QR Code KHQR
                  រួចស្កែន និងទូទាត់ប្រាក់ចំនួន <strong>${displayTotalPrice.toFixed(2)} USD</strong> តាមរយៈ ABA / ACLEDA / Bakong ។
                </p>

                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', marginBottom: '12px', background: '#D12027', borderColor: '#D12027', borderRadius: '12px', fontWeight: 800 }}
                >
                  បើកផ្ទាំង Pop-up KHQR
                </button>

                <button
                  onClick={() => setShowCancelModal(true)}
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', borderRadius: '12px', padding: '10px', color: '#64748B', fontWeight: 700 }}
                >
                  បោះបង់ និងត្រឡប់ក្រោយ
                </button>
              </div>
            )}

            {/* PAID */}
            {paymentStatus === 'paid' && (
              <div style={{ padding: '30px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: '76px', height: '76px', borderRadius: '50%',
                  background: '#EFF6FF', border: '3px solid #2563EB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 8px 24px rgba(37, 99, 235, 0.25)'
                }}>
                  <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 style={{ color: '#2563EB', marginBottom: '8px', fontSize: '1.4rem', fontWeight: 800 }}>ការទូទាត់ប្រាក់ទទួលបានជោគជ័យ!</h3>
                <p style={{ color: 'var(--text-light)', margin: '0 0 20px 0', fontSize: '0.92rem' }}>ប្រព័ន្ធកំពុងបញ្ជូនទៅកាន់ទំព័រទទួលគណនីក្នុងរយៈពេល ៦វិនាទី...</p>
                <button
                  onClick={() => navigate('/orders/' + (orderId || ''))}
                  className="btn btn-primary"
                  style={{ padding: '10px 24px', fontWeight: 800 }}
                >
                  មើលព័ត៌មានគណនីឥឡូវនេះ
                </button>
              </div>
            )}

            {/* EXPIRED */}
            {paymentStatus === 'expired' && (() => {
              const firstProduct = displayItems[0]?.product;
              return (
                <div className="card" style={{ width: '100%', padding: '28px 20px', textAlign: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '20px' }}>
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    background: '#FEF2F2', border: '2px solid #EF4444',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: '0 8px 20px rgba(239, 68, 68, 0.15)'
                  }}>
                    <FiClock size={30} color="#EF4444" />
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#DC2626', marginBottom: '8px' }}>
                    {lang === 'km' ? 'ការទូទាត់ប្រាក់ត្រូវបានផុតកំណត់' : 'Payment Session Expired'}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-light)', lineHeight: 1.5, marginBottom: '22px' }}>
                    {lang === 'km'
                      ? 'រយៈពេលទូទាត់ត្រូវបានផុតកំណត់ (មិនមានការទូទាត់ប្រាក់ចូលឡើយ)។ សូមត្រឡប់ទៅកាន់ទំព័រផលិតផលដើម្បីធ្វើការបញ្ជាទិញម្តងទៀត។'
                      : 'The payment time limit has expired without payment received. Please return to the product details page to purchase again.'}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {firstProduct?.id ? (
                      <button
                        type="button"
                        onClick={() => {
                          const pid = firstProduct.id;
                          resetCheckout();
                          navigate(`/product/${pid}`);
                        }}
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%', borderRadius: '12px', fontWeight: 800 }}
                      >
                        {lang === 'km' ? 'ត្រឡប់ទៅមើលទំនិញ (ទិញម្តងទៀត)' : 'View Product Details (Buy Again)'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          resetCheckout();
                          navigate('/store');
                        }}
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%', borderRadius: '12px', fontWeight: 800 }}
                      >
                        {lang === 'km' ? 'ត្រឡប់ទៅហាងទំនិញ (ទិញម្តងទៀត)' : 'Browse Store (Buy Again)'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        resetCheckout();
                        navigate('/store');
                      }}
                      className="btn btn-outline btn-sm"
                      style={{ width: '100%', borderRadius: '12px', padding: '10px', color: '#64748B', fontWeight: 700 }}
                    >
                      {lang === 'km' ? 'ហាងទំនិញទាំងអស់' : 'Browse All Products'}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* FAILED */}
            {paymentStatus === 'failed' && (() => {
              const firstProduct = displayItems[0]?.product;
              return (
                <div className="card" style={{ width: '100%', padding: '28px 20px', textAlign: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '20px' }}>
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    background: '#FEF2F2', border: '2px solid #EF4444',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: '0 8px 20px rgba(239, 68, 68, 0.15)'
                  }}>
                    <FiX size={32} color="#EF4444" />
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#DC2626', marginBottom: '8px' }}>
                    {lang === 'km' ? 'ការទូទាត់ប្រាក់មិនបានសម្រេច' : 'Payment Incomplete or Cancelled'}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-light)', lineHeight: 1.5, marginBottom: '22px' }}>
                    {lang === 'km'
                      ? 'មិនមានការទូទាត់ប្រាក់ ឬការទូទាត់ត្រូវបានបោះបង់។ សូមត្រឡប់ទៅមើលផលិតផលដើម្បីធ្វើការបញ្ជាទិញម្តងទៀត។'
                      : 'Payment was not completed or was cancelled. Please view product details to start a new purchase.'}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {firstProduct?.id ? (
                      <button
                        type="button"
                        onClick={() => {
                          const pid = firstProduct.id;
                          resetCheckout();
                          navigate(`/product/${pid}`);
                        }}
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%', borderRadius: '12px', fontWeight: 800 }}
                      >
                        {lang === 'km' ? 'ត្រឡប់ទៅមើលទំនិញ (ទិញម្តងទៀត)' : 'View Product Details (Buy Again)'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          resetCheckout();
                          navigate('/store');
                        }}
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%', borderRadius: '12px', fontWeight: 800 }}
                      >
                        {lang === 'km' ? 'ត្រឡប់ទៅហាងទំនិញ (ទិញម្តងទៀត)' : 'Browse Store (Buy Again)'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        resetCheckout();
                        navigate('/store');
                      }}
                      className="btn btn-outline btn-sm"
                      style={{ width: '100%', borderRadius: '12px', padding: '10px', color: '#64748B', fontWeight: 700 }}
                    >
                      {lang === 'km' ? 'ហាងទំនិញទាំងអស់' : 'Browse All Products'}
                    </button>
                  </div>
                </div>
              );
            })()}

        </div>

        {/*  Right: Order Summary  */}
        <div className="card animate-fade-in checkout-card" style={{ padding: '28px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <h2 style={{ marginBottom: '20px', fontSize: '1.25rem', fontWeight: 800 }}>សរុបការបញ្ជាទិញ</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            {displayItems.map((item, idx) => (
              <div key={item.product?.id ?? `cart-item-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    background: 'var(--card-bg)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    color: 'var(--primary)',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '1px solid var(--border)'
                  }}>
                    {item.product?.imageUrl ? (
                      <img src={item.product.imageUrl} alt={item.product?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      (item.product?.name ?? '?')[0]
                    )}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product?.name}</div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginTop: '4px' }}>
                      {(() => {
                        const typeInfo = getProductTypeInfo(item.product?.productType || 'ACCOUNT');
                        return (
                          <span style={{
                            background: typeInfo?.badgeBg || '#EEF2FF',
                            color: typeInfo?.badgeColor || '#4F46E5',
                            border: `1px solid ${typeInfo?.borderColor || '#C7D2FE'}`,
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '6px'
                          }}>
                            {typeInfo?.label || 'គណនីពេញលេញ'}
                          </span>
                        );
                      })()}
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 600 }}>
                        ចំនួន: {item.quantity} &bull; រយៈពេល: {item.product?.duration || '1 ខែ'}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)', flexShrink: 0 }}>
                  ${((item.product?.price ?? 0) * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/*  If order contains SHARING account product, show required invite email field  */}
          {displayItems.some(i => i.product?.productType === 'SHARING') && (
            <div style={{
              margin: '0 0 16px 0',
              padding: '14px',
              background: '#EFF6FF',
              borderRadius: '12px',
              border: '1.5px solid #BFDBFE'
            }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#1D4ED8', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiMail size={16} color="#1D4ED8" />
                <span>{lang === 'km' ? 'អ៊ីមែលសម្រាប់ទទួល Invite (ចាំបាច់) *' : 'Target Email for Invitation (Required) *'}</span>
              </div>
              <input
                type="email"
                required
                disabled={Boolean(orderId)}
                value={globalInviteEmail}
                onChange={e => setGlobalInviteEmail(e.target.value)}
                placeholder={lang === 'km' ? 'បញ្ចូលអ៊ីមែលសម្រាប់អ្នកលក់ Invite...' : 'e.g. yourname@gmail.com'}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #3B82F6',
                  background: '#FFFFFF',
                  color: 'var(--text)',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  outline: 'none',
                  boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.12)'
                }}
              />
              <span style={{ fontSize: '0.75rem', color: '#475569', marginTop: '5px', display: 'block', lineHeight: 1.3 }}>
                {lang === 'km' 
                  ? 'ទំនិញនេះជាប្រភេទគណនីចែករំលែក (Sharing Account)។ អ្នកលក់នឹងផ្ញើការអញ្ជើញ (Invite) ទៅកាន់អ៊ីមែលនេះ។' 
                  : 'This is a Sharing Account. The seller will send an invitation to this email address.'}
              </span>
            </div>
          )}

          {/*  Coupon / Promo Code Input Box  */}
          <div style={{ margin: '16px 0', padding: '14px', background: 'var(--card-bg, #FFFFFF)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiPercent size={14} color="#10B981" />
              <span>{lang === 'km' ? 'កូដបញ្ចុះតម្លៃ' : 'Store Coupon / Promo Code'}</span>
            </div>

            {appliedCoupon ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 900, color: '#059669', fontSize: '0.92rem', letterSpacing: '0.04em' }}>{appliedCoupon.code}</span>
                  <span style={{ background: '#059669', color: '#fff', fontSize: '0.72rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                    -${couponDiscountAmount.toFixed(2)} OFF
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.78rem', fontWeight: 700 }}
                  title="Remove coupon"
                >
                  <FiX size={14} /> {lang === 'km' ? 'លុប' : 'Remove'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder={lang === 'km' ? 'បញ្ចូលកូដបញ្ចុះតម្លៃ...' : 'Enter promo code...'}
                  value={couponCodeInput}
                  onChange={e => setCouponCodeInput(e.target.value.toUpperCase())}
                  disabled={validatingCoupon || Boolean(orderId)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}
                />
                <button
                  type="submit"
                  disabled={validatingCoupon || !couponCodeInput.trim() || Boolean(orderId)}
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.82rem', fontWeight: 800, whiteSpace: 'nowrap' }}
                >
                  {validatingCoupon ? '...' : (lang === 'km' ? 'ប្រើប្រាស់' : 'Apply')}
                </button>
              </form>
            )}
          </div>

          {/* Subtotal & Discount rows */}
          {appliedCoupon && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-light)' }}>
                <span>{lang === 'km' ? 'តម្លៃដើមសរុប' : 'Subtotal'}</span>
                <span>${displaySubtotalPrice.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 700 }}>
                <span>{lang === 'km' ? `ការបញ្ចុះតម្លៃ (${appliedCoupon.code})` : `Coupon Discount (${appliedCoupon.code})`}</span>
                <span>-${couponDiscountAmount.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div style={{ borderTop: '2px dashed var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800 }}>
            <span>{lang === 'km' ? 'តម្លៃសរុបត្រូវបង់' : 'Total Amount'}</span>
            <span style={{ color: 'var(--primary)' }}>${displayTotalPrice.toFixed(2)}</span>
          </div>

          {/*  Add Other Products Quick Selector  */}
          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, marginBottom: '12px' }}>
              បន្ថែមទំនិញផ្សេងទៀត
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(dbProducts.length > 0 ? dbProducts : []).filter(p => !displayItems.some(i => i.product?.id === p.id)).map(prod => {
                const imgUrl = getProductImageUrl(prod.name, prod.imageUrl);
                return (
                  <div
                    key={prod.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--card-bg)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      fontSize: '0.88rem',
                      gap: '12px',
                      minWidth: 0
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {imgUrl ? (
                          <img src={imgUrl} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.85rem' }}>
                            {(prod.name || '?')[0]}
                          </span>
                        )}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prod.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 800 }}>${prod.price.toFixed(2)}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (orderId) {
                          toast.error('ការបញ្ជាទិញត្រូវបង្កើតរួចហើយ។ សូមចាប់ផ្តើមការទូទាត់ថ្មីដើម្បីបន្ថែមទំនិញ។', { id: 'order-locked' });
                          return;
                        }
                        const fullProduct = { ...prod, imageUrl: imgUrl, stockCount: 10 };
                        const updated = [...displayItems, { product: fullProduct, quantity: 1 }];
                        setCheckoutItems(updated);
                        toast.success(`បានបន្ថែម ${prod.name}!`);
                      }}
                      className="btn btn-outline btn-sm"
                      style={{ padding: '6px 12px', fontSize: '0.78rem', flexShrink: 0, opacity: orderId ? 0.45 : 1 }}
                    >
                      {orderId ? 'បានទូទាត់' : '+ បន្ថែម'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Confirmation Modal for Cancel & Return */}
      {showCancelModal && (
        <div 
          onClick={() => setShowCancelModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '420px',
              backgroundColor: 'var(--card-bg, #ffffff)',
              borderRadius: '20px',
              padding: '28px 24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid var(--border)',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '1.5rem',
              fontWeight: 900
            }}>
              !
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
              បញ្ជាក់ការបោះបង់
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-light)', lineHeight: 1.5, marginBottom: '24px' }}>
              តើអ្នកពិតជាចង់បោះបង់ការទូទាត់នេះមែនទេ? ប្រសិនបើអ្នកបានស្កែនទូទាត់រួចហើយ សូមកុំចុចបោះបង់។
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowCancelModal(false)}
                className="btn btn-outline"
                style={{ flex: 1, padding: '11px', fontWeight: 700, borderRadius: '12px' }}
              >
                ទេ រក្សាការទូទាត់
              </button>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  const pid = displayItems[0]?.product?.id;
                  resetCheckout();
                  if (pid) {
                    navigate(`/product/${pid}`);
                  } else {
                    navigate('/store');
                  }
                }}
                className="btn"
                style={{
                  flex: 1,
                  padding: '11px',
                  fontWeight: 800,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#ffffff',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)'
                }}
              >
                យល់ព្រម បោះបង់
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE-ONLY STYLING OVERRIDES */}
      <style>{`
        @media (max-width: 768px) {
          .checkout-page-container {
            padding: 16px 12px 90px !important;
          }
          .checkout-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .checkout-card {
            padding: 18px 14px !important;
            border-radius: 14px !important;
          }
          .checkout-title {
            font-size: 1.6rem !important;
            margin-bottom: 4px !important;
          }
          .checkout-subtitle {
            font-size: 0.85rem !important;
          }
          #khqr-svg {
            width: 100% !important;
            max-width: 200px !important;
            height: auto !important;
          }
        }
      `}</style>
      {/* KHQR POPUP MODAL WITH BLURRED BACKGROUND OVERLAY */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        order={{
          id: orderId,
          totalAmount: displayTotalPrice,
          merchantName: 'SABY SHOP',
          items: checkoutItems
        }}
        onPaymentSuccess={() => {
          setIsPaymentModalOpen(false);
          setPaymentStatus('paid');
          setShowConfetti(true);
          if (orderId) navigate('/orders/' + orderId);
        }}
        onPaymentExpired={() => {
          setIsPaymentModalOpen(false);
          setPaymentStatus('expired');
        }}
      />
    </div>
  );
}


