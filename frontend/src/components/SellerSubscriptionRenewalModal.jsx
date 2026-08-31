import React, { useState, useEffect, useRef } from 'react';
import { generateKHQR, generateMD5 } from '../utils/khqr';
import { seller as sellerApi } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { FiX, FiCheckCircle, FiClock, FiRotateCw, FiAlertTriangle, FiDownload } from 'react-icons/fi';

const POLL_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes timeout (180s)
const DOLLAR_LOGO_SVG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="49" fill="%23ffffff"/><circle cx="50" cy="50" r="40" fill="%23000000"/><text x="50" y="66" font-size="54" font-weight="900" font-family="Arial, sans-serif" fill="%23ffffff" text-anchor="middle">$</text></svg>';

export default function SellerSubscriptionRenewalModal({ isOpen, onClose, onSuccess, storeName, planId = 'PLAN_1', planPrice = 2.50, remainingDays = 0 }) {
  const { isKhmer } = useLanguage();
  const [qrCodeData, setQrCodeData] = useState(null);
  const [md5Hash, setMd5Hash] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('waiting'); // 'waiting' | 'paid' | 'expired'
  const [checkCount, setCheckCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(POLL_TIMEOUT_MS);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const pollingRef = useRef(null);
  const timeoutRef = useRef(null);
  const countdownRef = useRef(null);

  const downloadQR = () => {
    if (!qrCodeData) return;
    const svgElement = document.getElementById('khqr-renewal-modal-svg');
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
      a.download = `khqr-store-renewal-${planId || 'subscription'}.png`;
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleRequestClose = () => {
    if (paymentStatus === 'waiting') {
      setShowCancelConfirm(true);
    } else {
      onClose();
    }
  };

  const stopPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  const startRenewalPayment = () => {
    stopPolling();
    setPaymentStatus('waiting');
    setCheckCount(0);
    setTimeLeft(POLL_TIMEOUT_MS);

    const activePrice = Number(planPrice || 2.50);
    const billNo = 'SUB-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900);
    const abaAccountId = import.meta.env.VITE_ABA_ACCOUNT_ID || import.meta.env.VITE_BAKONG_ACCOUNT_ID || 'ec477571@abaa';
    const abaPhone = import.meta.env.VITE_ABA_PHONE || import.meta.env.VITE_BAKONG_PHONE || '0972089305';
    const qr = generateKHQR({
      amount: activePrice,
      billNumber: billNo,
      accountId: abaAccountId,
      merchantName: 'Saby Shop',
      merchantCity: 'Phnom Penh',
      storeLabel: `SUBSCRIPTION ${planId}`,
      phoneNumber: abaPhone,
      terminalLabel: 'webqr'
    });
    const md5 = generateMD5(qr);

    setQrCodeData(qr);
    setMd5Hash(billNo);

    // 3-minute countdown timer
    let remaining = POLL_TIMEOUT_MS;
    countdownRef.current = setInterval(() => {
      remaining -= 1000;
      setTimeLeft(Math.max(0, remaining));
      if (remaining <= 0) clearInterval(countdownRef.current);
    }, 1000);

    // Auto-polling loop: Check ABA PayWay transaction every 5 seconds
    pollingRef.current = setInterval(async () => {
      try {
        setCheckCount(prev => prev + 1);
        const res = await sellerApi.renewSubscription(billNo, planId);
        if (res && res.data) {
          stopPolling();
          setPaymentStatus('paid');
          toast.success(isKhmer ? `ដំឡើងកញ្ចប់ ${planId} ជោគជ័យ! មុខងារថ្មីដំណើរការភ្លាមៗ` : `Plan ${planId} renewed successfully!`);
          setTimeout(() => {
            if (onSuccess) onSuccess(res.data);
            onClose();
          }, 1500);
        }
      } catch (err) {
        // Silent catch during automated loop checking until payment is confirmed
      }
    }, 5000);

    // 3-minute timeout
    timeoutRef.current = setTimeout(() => {
      stopPolling();
      setPaymentStatus('expired');
      toast.error(isKhmer ? 'ការទូទាត់ប្រាក់ត្រូវបានផុតកំណត់ (៣នាទី)។' : 'Payment session expired (3 minutes).');
    }, POLL_TIMEOUT_MS);
  };

  useEffect(() => {
    if (isOpen) {
      startRenewalPayment();
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [isOpen, storeName]);

  const formatTime = (ms) => {
    const t = Math.max(0, Math.floor(ms / 1000));
    const mins = String(Math.floor(t / 60)).padStart(2, '0');
    const secs = String(t % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  if (!isOpen) return null;

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
          max-width: 440px;
          max-height: min(92vh, 680px);
          background: #ffffff;
          border-radius: 20px;
          overflow-y: auto;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.35);
          position: relative;
          display: flex;
          flex-direction: column;
        }
        .payway-dark-header {
          background: #ffffff;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #0F2942;
          border-bottom: 1px solid #E2E8F0;
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .payway-close-btn-top {
          background: #FEE2E2;
          border: 1.5px solid #FCA5A5;
          color: #DC2626;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(220, 38, 38, 0.15);
          flex-shrink: 0;
        }
        .payway-close-btn-top:hover {
          background: #FCA5A5;
          color: #991B1B;
          transform: scale(1.05);
        }
        .payway-white-body {
          padding: 18px 22px 24px;
          background: #ffffff;
          flex: 1;
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
            {isKhmer ? 'ទូទាត់ប្រាក់បន្តសុពលភាពហាង' : 'Renew Store Subscription'}
          </span>
          <button
            id="subscription-renewal-modal-close"
            className="payway-close-btn-top"
            onClick={handleRequestClose}
            aria-label={isKhmer ? 'បិទផ្ទាំង' : 'Close modal'}
          >
            <FiX size={18} />
          </button>
        </div>

        {/* White Inner Body */}
        <div className="payway-white-body">
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0F2942', margin: '0 0 20px 0', textAlign: 'left' }}>
            KHQR Store Subscription (${Number(planPrice || 2.50).toFixed(2)})
          </h3>

          {paymentStatus === 'waiting' && qrCodeData && (
            <>
              {/* KHQR Red Ticket Card */}
              <div className="payway-khqr-ticket">
                <div className="payway-red-banner">
                  <div className="payway-khqr-logo-text">KHQR</div>
                </div>

                <div className="payway-ticket-body">
                  {/* Merchant / Store Name */}
                  <div className="payway-merchant-name">
                    {storeName || 'SABY SHOP SELLER HUB'}
                  </div>

                  {/* Price Amount & Currency */}
                  <div className="payway-amount-row">
                    <span className="payway-amount">
                      {Number(planPrice || 2.50).toFixed(2)}
                    </span>
                    <span className="payway-currency">USD</span>
                  </div>

                  {/* Dashed Line Divider */}
                  <div className="payway-dashed-divider" />

                  {/* KHQR Code with Center Dollar ($) Badge */}
                  <div className="payway-qr-container">
                    <QRCodeSVG
                      id="khqr-renewal-modal-svg"
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
                margin: '14px auto 0 auto',
                lineHeight: 1.45,
                maxWidth: '280px',
                fontWeight: 500
              }}>
                {isKhmer ? 'ស្កែនជាមួយ ABA Mobile ឬ App ធនាគារផ្សេងទៀតដែលមាន KHQR' : 'Scan with ABA Mobile or any banking app supporting KHQR'}
              </p>

              {/* Remaining days continue notice */}
              {remainingDays > 0 && (
                <div style={{
                  background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                  border: '1.5px solid #BFDBFE',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  marginTop: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textAlign: 'left'
                }}>
                   <div>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1D4ED8', marginBottom: '2px' }}>
                      {isKhmer ? `អ្នកនៅមាន ${remainingDays} ថ្ងៃដែលនៅសល់` : `You have ${remainingDays} days remaining`}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#3B82F6', fontWeight: 600 }}>
                      {isKhmer
                        ? `មុខងារកញ្ចប់ថ្មីនឹងដំណើរការភ្លាមៗ • ${remainingDays} ថ្ងៃបន្តរាប់ដល់ 0 ទើបបន្ត`
                        : `New features activate immediately • ${remainingDays} days continue countdown`}
                    </div>
                  </div>
                </div>
              )}

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
                    {isKhmer ? `កំពុងពិនិត្យទូទាត់ស្វ័យប្រវត្តិ (#${checkCount})...` : `Checking payment status (#${checkCount})...`}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'monospace', fontWeight: 800, color: timeLeft < 30000 ? '#EF4444' : '#D12027', fontSize: '0.88rem' }}>
                  <FiClock size={12} />
                  {formatTime(timeLeft)}
                </div>
              </div>

              {/* Bottom Cancel & Close Button */}
              <button
                type="button"
                onClick={handleRequestClose}
                style={{
                  width: '100%',
                  marginTop: '14px',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  background: '#F8FAFC',
                  color: '#475569',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  padding: '9px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <FiX size={15} />
                <span>{isKhmer ? 'បោះបង់ និងបិទផ្ទាំង (Cancel & Close)' : 'Cancel & Close'}</span>
              </button>
            </>
          )}

          {/* EXPIRED State */}
          {paymentStatus === 'expired' && (
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
              <p style={{ color: '#64748b', fontSize: '0.84rem', marginBottom: '18px', lineHeight: 1.5 }}>
                {isKhmer ? 'រយៈពេល ៣នាទីត្រូវបានផុតកំណត់ (មិនមានការទូទាត់ប្រាក់ឡើយ)។ សូមសាកល្បងបន្តគម្រោងម្តងទៀត។' : 'The 3-minute payment window has expired. Please try starting the renewal again.'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={startRenewalPayment}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '10px 16px', borderRadius: '10px', fontWeight: 800 }}
                >
                  {isKhmer ? 'សាកល្បងបន្តគម្រោងម្តងទៀត' : 'Try Renewal Again'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-outline"
                  style={{ width: '100%', color: '#64748B', fontWeight: 700, padding: '9px 16px', borderRadius: '10px' }}
                >
                  {isKhmer ? 'បិទ' : 'Close'}
                </button>
              </div>
            </div>
          )}

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
              <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: remainingDays > 0 ? '12px' : '0' }}>
                {isKhmer
                  ? <>កញ្ចប់ <strong>{planId}</strong> ដែលអ្នកបានជ្រើសរើស នឹងដំណើរការភ្លាមៗ។</>
                  : <>Your selected <strong>{planId}</strong> plan is activated immediately.</>}
              </p>
              {remainingDays > 0 && (
                <div style={{
                  background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                  border: '1.5px solid #BFDBFE',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                   <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1D4ED8', marginBottom: '3px' }}>
                      {isKhmer ? `អ្នកនៅមាន ${remainingDays} ថ្ងៃដែលនៅសល់` : `You have ${remainingDays} days remaining`}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#3B82F6', fontWeight: 600 }}>
                      {isKhmer
                        ? `${remainingDays} ថ្ងៃដែលនៅសល់នឹងបន្តរាប់ចុះដល់ 0 — មុខងារកញ្ចប់ថ្មីដំណើរការភ្លាមៗ។`
                        : `${remainingDays} days remaining will continue countdown — new features active now.`}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
