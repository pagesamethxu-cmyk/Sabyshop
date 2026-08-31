import React, { useState, useEffect, useRef } from 'react';
import { generateKHQR, generateMD5 } from '../utils/khqr';
import { orders as ordersApi } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { FiX, FiCheckCircle, FiDownload, FiClock, FiRotateCw, FiZap, FiSliders, FiAlertTriangle } from 'react-icons/fi';

const POLL_INTERVAL_MS = 5000;       // Check ABA PayWay transaction every 5 seconds
const POLL_TIMEOUT_MS  = 3 * 60 * 1000; // 3-minute timeout loop (180 seconds)
const MAX_CHECKS        = 36;           // Max 36 loop checks

// ABA PayWay merchant Bakong acquiring ID (used as KHQR accountId for ABA PayWay transactions)
const ACCOUNT_ID = import.meta.env.VITE_ABA_ACCOUNT_ID || import.meta.env.VITE_BAKONG_ACCOUNT_ID || 'ec477571@abaa';
const BANK_PHONE  = import.meta.env.VITE_ABA_PHONE || import.meta.env.VITE_BAKONG_PHONE || '0972089305';

// SVG Dollar badge ($) overlay for the center of KHQR code (clean white ring + solid black circle + centered white $ text)
const DOLLAR_LOGO_SVG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="49" fill="%23ffffff"/><circle cx="50" cy="50" r="40" fill="%23000000"/><text x="50" y="66" font-size="54" font-weight="900" font-family="Arial, sans-serif" fill="%23ffffff" text-anchor="middle">$</text></svg>';

const PaymentModal = ({ order, isOpen, onClose, onPaymentSuccess, onPaymentExpired }) => {
  const { isKhmer } = useLanguage();
  const [qrCodeData, setQrCodeData] = useState(null);
  const [md5Hash, setMd5Hash] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('waiting'); // 'waiting' | 'paid' | 'expired' | 'failed'
  const [qrType, setQrType] = useState('dynamic'); // 'dynamic' | 'static'
  const [checkCount, setCheckCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(POLL_TIMEOUT_MS);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
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

  const handleRequestClose = () => {
    if (paymentStatus === 'waiting') {
      setShowCancelConfirm(true);
    } else {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen && order?.id) {
      startPayment(qrType);
    } else if (!isOpen) {
      stopPolling();
    }
    return () => stopPolling();
  }, [isOpen, order?.id, qrType]);

  const stopPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  const startPayment = async (type = qrType) => {
    if (!order || !order.totalAmount || Number(order.totalAmount) <= 0) return;
    stopPolling();
    setPaymentStatus('waiting');
    setCheckCount(0);
    setTimeLeft(POLL_TIMEOUT_MS);

    try {
      // ABA PayWay tran_id format: ORD-{orderId}
      const billNo = 'ORD-' + order.id;
      const isDynamic = type === 'dynamic';
      const targetAmount = isDynamic ? (order.totalAmount || 0) : 0;

      const targetMerchantName = order.sellerStoreName || order.items?.[0]?.product?.sellerStoreName || order.merchantName || 'Saby Shop';

      const qr = generateKHQR({
        amount: targetAmount,
        billNumber: billNo,
        accountId: ACCOUNT_ID,
        merchantName: targetMerchantName,
        merchantCity: 'Phnom Penh',
        storeLabel: targetMerchantName,
        phoneNumber: BANK_PHONE,
        terminalLabel: 'webqr'
      });

      setQrCodeData(qr);
      setMd5Hash(billNo);

      // Start 3-minute countdown timer (180s)
      let remaining = POLL_TIMEOUT_MS;
      countdownRef.current = setInterval(() => {
        remaining -= 1000;
        setTimeLeft(Math.max(0, remaining));
        if (remaining <= 0) clearInterval(countdownRef.current);
      }, 1000);

      // Polling loop checking ABA PayWay transaction (Every 5s)
      pollingRef.current = setInterval(async () => {
        try {
          setCheckCount(prev => {
            const next = prev + 1;
            if (next >= MAX_CHECKS) {
              stopPolling();
            }
            return Math.min(next, MAX_CHECKS);
          });
          const verifyRes = await ordersApi.verify(order.id);
          const status = verifyRes.data?.status || verifyRes.status;
          if (status === 'COMPLETED' || status === 'PROCESSING') {
            handleSuccess(verifyRes.data || { ...order, status });
          }
        } catch (e) {
          console.warn('Checking ABA PayWay transaction status...', e);
        }
      }, POLL_INTERVAL_MS);

      // 3-minute timeout limit (3 * 60 * 1000 ms) -> Auto close modal
      timeoutRef.current = setTimeout(() => {
        stopPolling();
        setPaymentStatus('expired');
        toast.error(isKhmer ? 'ការទូទាត់ប្រាក់ត្រូវបានផុតកំណត់ (៣នាទី)។' : 'Payment session expired (3 minutes).');
        if (onPaymentExpired) {
          onPaymentExpired();
        } else if (onClose) {
          onClose();
        }
      }, POLL_TIMEOUT_MS);

    } catch (err) {
      console.error('QR generation error:', err);
      toast.error(isKhmer ? 'មិនអាចបង្កើតកូដ KHQR បានទេ' : 'Failed to generate KHQR code');
      setPaymentStatus('failed');
    }
  };

  const handleSuccess = (updatedOrder) => {
    stopPolling();
    setPaymentStatus('paid');
    const isProcessing = updatedOrder?.status === 'PROCESSING';
    if (isProcessing) {
      toast.success(isKhmer ? 'ការទូទាត់ប្រាក់ទទួលបានជោគជ័យ! ការបញ្ជាទិញកំពុងដំណើរការ' : 'Payment received! Order is set to PROCESSING');
    } else {
      toast.success(isKhmer ? 'ការទូទាត់ប្រាក់ទទួលបានជោគជ័យ!' : 'Payment verified via ABA PayWay!');
    }
    setTimeout(() => {
      if (onPaymentSuccess) onPaymentSuccess(updatedOrder || { ...order, status: updatedOrder?.status || 'COMPLETED' });
      onClose();
    }, 1500);
  };

  const formatTime = (ms) => {
    const t = Math.max(0, Math.floor(ms / 1000));
    const mins = String(Math.floor(t / 60)).padStart(2, '0');
    const secs = String(t % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const downloadQR = () => {
    if (!qrCodeData) return;
    const svgElement = document.getElementById('khqr-modal-svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 700;
      canvas.height = 700;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 700, 700);
        ctx.drawImage(img, 0, 0, 700, 700);
      }
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `khqr-payway-${order?.id || 'payment'}.png`;
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (!isOpen || !order || !order.totalAmount || Number(order.totalAmount) <= 0) return null;

  return (
    <div
      className="modal-overlay animate-fade-in"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: 'rgba(11, 23, 38, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={handleRequestClose}
    >
      <style>{`
        @keyframes pulseGreen {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
        }
        @keyframes scanLine {
          0% { top: 4px; opacity: 0; }
          15% { opacity: 0.9; }
          85% { opacity: 0.9; }
          100% { top: calc(100% - 4px); opacity: 0; }
        }
        .payway-qr-scan-beam {
          position: absolute;
          left: 4px;
          right: 4px;
          height: 2.5px;
          background: linear-gradient(90deg, transparent, #10B981 30%, #3B82F6 70%, transparent);
          box-shadow: 0 0 10px #10B981, 0 0 4px #3B82F6;
          animation: scanLine 2.2s ease-in-out infinite;
          pointer-events: none;
          z-index: 10;
        }
        .payway-modal-card {
          width: 100%;
          max-width: 460px;
          background: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.35);
          position: relative;
        }
        .payway-dark-header {
          background: #ffffff;
          padding: 18px 24px 10px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #0F2942;
          border-top-left-radius: 20px;
          border-top-right-radius: 20px;
        }
        .payway-close-btn-top {
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          color: #334155;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .payway-close-btn-top:hover {
          background: #E2E8F0;
          color: #0F172A;
        }
        .payway-white-body {
          padding: 24px 28px 28px;
          background: #ffffff;
        }
        .payway-khqr-ticket {
          width: 100%;
          max-width: 320px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04);
        }
        .payway-red-banner {
          background: #D12027;
          height: 54px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          color: #ffffff;
          /* Folded notch clip-path */
          clip-path: polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 0 100%);
        }
        .payway-khqr-logo-text {
          font-weight: 900;
          font-size: 1.55rem;
          letter-spacing: 3px;
          color: #ffffff;
          font-family: 'Chakra Petch', 'Plus Jakarta Sans', 'Inter', sans-serif;
        }
        .payway-ticket-body {
          padding: 20px 24px 22px;
          background: #ffffff;
        }
        .payway-merchant-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 4px;
          text-align: left;
        }
        .payway-amount-row {
          display: flex;
          align-items: baseline;
          gap: 6px;
          text-align: left;
          margin-bottom: 4px;
        }
        .payway-amount {
          font-size: 2.2rem;
          font-weight: 900;
          color: #0F172A;
          line-height: 1;
          font-family: 'Chakra Petch', 'Plus Jakarta Sans', 'Inter', sans-serif;
        }
        .payway-currency {
          font-size: 0.95rem;
          font-weight: 700;
          color: #1E40AF;
        }
        .payway-dashed-divider {
          border-top: 1.5px dashed #CBD5E1;
          margin: 16px 0 18px;
        }
        .payway-qr-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2px;
          background: #ffffff;
        }
        .payway-download-btn {
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          color: #0284C7;
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .payway-download-btn:hover {
          background: #E0F2FE;
          border-color: #BAE6FD;
        }
        @media (max-width: 480px) {
          .payway-dark-header {
            padding: 14px 16px 8px !important;
          }
          .payway-white-body {
            padding: 14px 12px 20px !important;
          }
          .payway-khqr-ticket {
            max-width: 100% !important;
            border-radius: 16px !important;
          }
          .payway-ticket-body {
            padding: 14px 14px 16px !important;
          }
          .payway-amount {
            font-size: 1.8rem !important;
          }
          .payway-qr-container svg {
            max-width: 100% !important;
            height: auto !important;
          }
        }
      `}</style>

      <div className="payway-modal-card animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Cancel Confirmation Modal Overlay */}
        {showCancelConfirm && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(6px)',
            borderRadius: '20px',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '18px',
              padding: '24px 20px',
              maxWidth: '360px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              border: '1px solid #E2E8F0'
            }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: '#FEF2F2', border: '1px solid #FCA5A5',
                color: '#DC2626', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 14px'
              }}>
                <FiAlertTriangle size={28} />
              </div>
              <h4 style={{ margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                {isKhmer ? 'បញ្ជាក់ការបោះបង់ទូទាត់?' : 'Confirm Payment Cancellation?'}
              </h4>
              <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: '#64748B', lineHeight: 1.45 }}>
                {isKhmer
                  ? 'តើអ្នកប្រាកដជាចង់បោះបង់ការទូទាត់នេះមែនទេ? ប្រតិបត្តិការដែលមិនទាន់ទូទាត់នឹងត្រូវលុបចោល។'
                  : 'Are you sure you want to cancel this payment? The unpaid transaction will be discarded.'}
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(false)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '10px',
                    border: '1px solid #CBD5E1', background: '#F8FAFC',
                    color: '#334155', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
                  }}
                >
                  {isKhmer ? 'បន្តទូទាត់' : 'Continue'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelConfirm(false);
                    stopPolling();
                    toast.error(isKhmer ? 'បានបោះបង់ការទូទាត់' : 'Payment cancelled');
                    onClose();
                  }}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '10px',
                    border: 'none', background: '#DC2626',
                    color: '#ffffff', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer'
                  }}
                >
                  {isKhmer ? 'បោះបង់ទូទាត់' : 'Cancel Payment'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dark Header Top Bar */}
        <div className="payway-dark-header">
          <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0F2942' }}>
            {isKhmer ? 'ទូទាត់ប្រាក់' : 'Payment'}
          </span>
          <button
            id="payment-modal-close"
            className="payway-close-btn-top"
            onClick={handleRequestClose}
            aria-label={isKhmer ? 'បិទផ្ទាំង' : 'Close modal'}
          >
            <FiX size={18} />
          </button>
        </div>

        {/* White Inner Body */}
        <div className="payway-white-body">
          {/* Section Subtitle */}
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0F2942', margin: '0 0 20px 0', textAlign: 'left' }}>
            ABA KHQR
          </h3>

          {paymentStatus === 'waiting' && qrCodeData && (
            <>
              {/* KHQR Red Ticket Card */}
              <div className="payway-khqr-ticket">
                <div className="payway-red-banner">
                  <div className="payway-khqr-logo-text">KHQR</div>
                </div>

                <div className="payway-ticket-body">
                  {/* Merchant Store Name */}
                  <div className="payway-merchant-name">
                    {order.merchantName || 'SABY SHOP'}
                  </div>

                  {/* Price Amount & Currency */}
                  <div className="payway-amount-row">
                    <span className="payway-amount">
                      {Number(order.totalAmount || 0).toFixed(2)}
                    </span>
                    <span className="payway-currency">USD</span>
                  </div>

                  {/* Dashed Line Divider */}
                  <div className="payway-dashed-divider" />

                  {/* KHQR Code with Center Dollar ($) Badge */}
                  <div className="payway-qr-container">
                    <QRCodeSVG
                      id="khqr-modal-svg"
                      value={qrCodeData}
                      size={215}
                      level="H"
                      includeMargin={false}
                      fgColor="#000000"
                      bgColor="#ffffff"
                      imageSettings={{
                        src: DOLLAR_LOGO_SVG,
                        height: 44,
                        width: 44,
                        excavate: true,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Subtext below card */}
              <p style={{
                textAlign: 'center',
                color: '#64748B',
                fontSize: '0.82rem',
                margin: '18px auto 0 auto',
                lineHeight: 1.45,
                maxWidth: '280px',
                fontWeight: 500
              }}>
                {isKhmer ? 'ស្កែនជាមួយ ABA Mobile ឬ App ធនាគារផ្សេងទៀតដែលមាន KHQR' : 'Scan with ABA Mobile or any banking app supporting KHQR'}
              </p>

              {/* Live 3-minute Countdown polling status */}
              <div style={{
                background: '#F8FAFC', borderRadius: '12px',
                padding: '10px 14px', marginTop: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                border: '1px solid #E2E8F0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: '#10B981',
                    animation: 'pulseGreen 1.5s infinite',
                  }} />
                  <span style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 600 }}>
                    {isKhmer ? `កំពុងពិនិត្យស្ថានភាពទូទាត់ (#${checkCount})...` : `Checking payment status (#${checkCount})...`}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'monospace', fontWeight: 800, color: timeLeft < 30000 ? '#EF4444' : '#D12027', fontSize: '0.88rem' }}>
                  <FiClock size={12} />
                  {formatTime(timeLeft)}
                </div>
              </div>
            </>
          )}

          {/* EXPIRED State */}
          {paymentStatus === 'expired' && (() => {
            const firstItem = order?.items?.[0] || order?.product;
            const targetProductId = firstItem?.product?.id || firstItem?.productId || order?.productId || order?.product?.id;
            return (
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: '#FEF2F2', border: '1px solid #FCA5A5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px', color: '#EF4444',
                }}>
                  <FiClock size={28} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '6px', color: '#DC2626' }}>
                  {isKhmer ? 'ការទូទាត់ប្រាក់ផុតកំណត់ (៣ នាទី)' : 'Payment Session Expired (3 mins)'}
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.84rem', marginBottom: '20px', lineHeight: 1.5 }}>
                  {isKhmer
                    ? 'រយៈពេល ៣នាទីត្រូវបានផុតកំណត់ (មិនមានការទូទាត់ប្រាក់ឡើយ)។ សូមត្រឡប់ទៅកាន់ទំព័រផលិតផលដើម្បីធ្វើការបញ្ជាទិញម្តងទៀត។'
                    : 'The 3-minute payment window has expired without payment. Please return to view product details to place a new order.'}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {targetProductId ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (onClose) onClose();
                        window.location.href = `/product/${targetProductId}`;
                      }}
                      className="btn btn-primary"
                      style={{ width: '100%', fontWeight: 800, padding: '10px 16px', borderRadius: '10px' }}
                    >
                      {isKhmer ? 'ត្រឡប់ទៅមើលទំនិញ (ទិញម្តងទៀត)' : 'View Product Details (Buy Again)'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (onClose) onClose();
                        window.location.href = '/store';
                      }}
                      className="btn btn-primary"
                      style={{ width: '100%', fontWeight: 800, padding: '10px 16px', borderRadius: '10px' }}
                    >
                      {isKhmer ? 'ត្រឡប់ទៅហាងទំនិញ' : 'Browse Store'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (onClose) onClose();
                    }}
                    className="btn btn-outline"
                    style={{ width: '100%', color: '#64748B', fontWeight: 700, padding: '9px 16px', borderRadius: '10px' }}
                  >
                    {isKhmer ? 'បិទផ្ទាំងនេះ' : 'Close'}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* PAID State — Completed Payment */}
          {paymentStatus === 'paid' && (
            <div style={{ padding: '24px 0', textAlign: 'center' }}>
              <div style={{
                width: '76px', height: '76px', borderRadius: '50%',
                background: '#EFF6FF', border: '3px solid #2563EB',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.25)'
              }}>
                <FiCheckCircle size={42} color="#2563EB" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px', color: '#2563EB' }}>
                {isKhmer ? 'ការទូទាត់ប្រាក់ទទួលបានជោគជ័យ!' : 'Payment Completed Successfully!'}
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
                {isKhmer ? 'ការទូទាត់ត្រូវបានបញ្ជាក់សម្រាប់ SABY SHOP។ គណនីរបស់អ្នកត្រូវបានបើក។' : 'Payment confirmed for SABY SHOP. Your digital account is unlocked.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
