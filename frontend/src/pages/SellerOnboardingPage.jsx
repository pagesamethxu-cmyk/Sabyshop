import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { seller as sellerApi } from '../api/client';
import { generateKHQR, generateMD5 } from '../utils/khqr';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import {
  FiCheckCircle, FiClock, FiArrowRight, FiArrowLeft,
  FiX, FiLoader, FiShield, FiRefreshCw, FiPackage,
  FiChevronRight, FiChevronLeft, FiMessageSquare, FiCopy, FiCheck, FiExternalLink
} from 'react-icons/fi';
import { FaTelegram } from 'react-icons/fa';
import { MdStorefront, MdVerified } from 'react-icons/md';

const DOLLAR_LOGO_SVG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="49" fill="%23ffffff"/><circle cx="50" cy="50" r="40" fill="%23000000"/><text x="50" y="66" font-size="54" font-weight="900" font-family="Arial, sans-serif" fill="%23ffffff" text-anchor="middle">$</text></svg>';

const POLL_INTERVAL = 8000;  // 8 seconds per check
const MAX_POLLS     = 23;    // 23 checks (3-minute loop)
const POLL_TIMEOUT_MS = 3 * 60 * 1000; // 180,000 ms

const steps = ['details', 'policy', 'plan', 'building'];

const CopyBtn = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        borderRadius: 8,
        border: '1px solid #4F46E5',
        background: copied ? '#ECFDF5' : 'rgba(79, 70, 229, 0.08)',
        color: copied ? '#059669' : '#4F46E5',
        fontSize: '0.74rem',
        fontWeight: 700,
        cursor: 'pointer'
      }}
    >
      {copied ? <FiCheck size={12} /> : <FiCopy size={12} />}
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
};

export default function SellerOnboardingPage() {
  const { user, updateUser } = useAuth();
  const { isKhmer } = useLanguage();
  const navigate = useNavigate();

  const [step, setStep] = useState('details'); // 'details' | 'policy' | 'plan' | 'building' | 'success'
  const [form, setForm] = useState({ storeName: '', storeDescription: '' });
  const [selectedPlan, setSelectedPlan] = useState({ id: 'PLAN_1', price: 2.50, name: 'កញ្ចប់ Starter' });
  const [createdStoreProfile, setCreatedStoreProfile] = useState(null);

  // Floating KHQR Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [md5Hash, setMd5Hash] = useState('');
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(POLL_TIMEOUT_MS);

  // Policy walkthrough page state (within Step 2)
  const [policyPage, setPolicyPage] = useState(1);
  const [policyAgreed, setPolicyAgreed] = useState(false);
  const totalPolicyPages = 4;

  // Real-time store name availability state
  const [storeNameStatus, setStoreNameStatus] = useState(null); // null | 'checking' | 'available' | 'taken'
  const [storeNameMsg, setStoreNameMsg] = useState('');

  const normalizeStoreName = (name) => (name || '').trim().replace(/\s+/g, ' ');

  // Auth Guard: User must be logged in to access seller onboarding
  const [hasUsedFreeTrial, setHasUsedFreeTrial] = useState(Boolean(user?.hasUsedFreeTrial));

  useEffect(() => {
    if (user?.hasUsedFreeTrial !== undefined) {
      setHasUsedFreeTrial(Boolean(user.hasUsedFreeTrial));
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      toast.error(isKhmer ? 'សូមចូលគណនី (Login) ជាមុនសិនដើម្បីបង្កើតហាងលក់!' : 'Please login first to create a seller store!');
      navigate('/login?redirect=/seller-onboarding');
    }
  }, [user, navigate, isKhmer]);

  // Debounced check: call sellerApi.checkStoreName when storeName changes
  useEffect(() => {
    const name = normalizeStoreName(form.storeName);
    if (!name) { setStoreNameStatus(null); setStoreNameMsg(''); return; }
    setStoreNameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await sellerApi.checkStoreName(name);
        const data = res.data;
        const available = data?.data?.available ?? data?.available;
        setStoreNameStatus(available ? 'available' : 'taken');
        setStoreNameMsg(data?.data?.message || data?.message || '');
      } catch {
        setStoreNameStatus(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.storeName]);

  // 3-minute countdown timer effect
  useEffect(() => {
    if (!isPaymentModalOpen || !polling) return;
    setTimeLeft(POLL_TIMEOUT_MS);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1000) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaymentModalOpen, polling]);

  const formatTime = (ms) => {
    const t = Math.max(0, Math.floor(ms / 1000));
    const m = String(Math.floor(t / 60)).padStart(2, '0');
    const s = String(t % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  // 15-Second Store Building State
  const [buildingProgress, setBuildingProgress] = useState(0);
  const [buildingSecondsLeft, setBuildingSecondsLeft] = useState(15);
  const buildingTimerRef = useRef(null);

  // Auto-detect existing active seller profile or redirect existing sellers
  useEffect(() => {
    let isMounted = true;
    if (user?.role === 'SELLER' && step !== 'building' && step !== 'success') {
      navigate('/seller');
      return;
    }
    if (user) {
      sellerApi.getProfile()
        .then(res => {
          if (!isMounted) return;
          const prof = res.data;
          if (prof && prof.subscriptionStatus === 'ACTIVE') {
            updateUser({ role: 'SELLER' });
            navigate('/seller');
          } else if (prof && prof.storeName) {
            setForm(f => ({
              ...f,
              storeName: prof.storeName || '',
              storeDescription: prof.storeDescription || ''
            }));
          }
        })
        .catch(() => {
          // No profile yet, proceed with onboarding
        });
    }
    return () => { isMounted = false; };
  }, [user, navigate, step]);

  // Clean timers on unmount
  useEffect(() => {
    return () => {
      if (buildingTimerRef.current) clearInterval(buildingTimerRef.current);
    };
  }, []);

  //  Start 15-Second Store Building Sequence 
  const start15sStoreBuilding = () => {
    setIsPaymentModalOpen(false);
    setPolling(false);
    setStep('building');
    setBuildingProgress(0);
    setBuildingSecondsLeft(15);

    if (buildingTimerRef.current) clearInterval(buildingTimerRef.current);

    const startTime = Date.now();
    const DURATION_MS = 15000; // 15 seconds

    buildingTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.floor((elapsed / DURATION_MS) * 100));
      const remainingSecs = Math.max(0, Math.ceil((DURATION_MS - elapsed) / 1000));

      setBuildingProgress(progress);
      setBuildingSecondsLeft(remainingSecs);

      if (elapsed >= DURATION_MS) {
        clearInterval(buildingTimerRef.current);
        updateUser({ role: 'SELLER' });
        sellerApi.getProfile()
          .then(res => {
            if (res.data) setCreatedStoreProfile(res.data);
          })
          .catch(() => {});
        setStep('success');
        toast.success(isKhmer ? 'ហាងរបស់អ្នករៀបចំរួចរាល់ 100%! សូមស្វាគមន៍' : 'Your store setup is 100% complete! Welcome!');
      }
    }, 100);
  };

  //  Poll Bakong payment verification 
  useEffect(() => {
    if (!isPaymentModalOpen || !polling) return;
    if (pollCount >= MAX_POLLS) {
      setPolling(false);
      toast.error(isKhmer ? 'ផុតកំណត់វេលាទូទាត់។ សូមព្យាយាមម្ដងទៀត' : 'Payment timeout. Please try again or contact support.');
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await sellerApi.verifySubscription();
        if (res.data?.subscriptionStatus === 'ACTIVE') {
          setPolling(false);
          toast.success(isKhmer ? 'ការទូទាត់ជោគជ័យ! ប្រព័ន្ធកំពុងរៀបចំបង្កើតហាង...' : 'Payment verified! System is building your store...');
          start15sStoreBuilding();
        } else {
          setPollCount(c => c + 1);
        }
      } catch {
        setPollCount(c => c + 1);
      }
    }, POLL_INTERVAL);
    return () => clearTimeout(timer);
  }, [isPaymentModalOpen, polling, pollCount, isKhmer]);

  //  Step 1 Submit: Store details → Validate & Move to Policy Walkthrough 
  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error(isKhmer ? 'សូមចូលគណនី (Login) ជាមុនសិនដើម្បីបង្កើតហាង!' : 'Please login first to create a seller store!');
      navigate('/login?redirect=/seller-onboarding');
      return;
    }
    const name = normalizeStoreName(form.storeName);
    if (!name) {
      return toast.error(isKhmer ? 'សូមបញ្ចូលឈ្មោះហាងរបស់អ្នក' : 'Store name is required');
    }
    if (storeNameStatus === 'checking') {
      return toast.error(isKhmer ? 'សូមរង់ចាំការពិនិត្យឈ្មោះហាង...' : 'Please wait, checking store name...');
    }
    if (storeNameStatus === 'taken') {
      return toast.error(isKhmer
        ? 'ឈ្មោះហាងនេះត្រូវបានប្រើប្រាស់ដោយអ្នកលក់ម្នាក់ទៀតហើយ! សូមជ្រើសរើសឈ្មោះដទៃ។'
        : 'This store name is already taken! Please choose a different name.');
    }

    // Synchronous backend check to guarantee name is available
    try {
      const res = await sellerApi.checkStoreName(name);
      const data = res.data;
      const available = data?.data?.available ?? data?.available;
      if (!available) {
        setStoreNameStatus('taken');
        return toast.error(isKhmer
          ? 'ឈ្មោះហាងនេះត្រូវបានប្រើប្រាស់ដោយអ្នកលក់ម្នាក់ទៀតហើយ! សូមជ្រើសរើសឈ្មោះដទៃ។'
          : 'This store name is already taken! Please choose a different name.');
      }
      setStoreNameStatus('available');
    } catch {
      // Proceed if network check previously resolved
    }

    toast.success(isKhmer ? 'ឈ្មោះហាងត្រូវបានអនុម័ត! សូមអានគោលការណ៍ប្តូរទំនិញ' : 'Store name approved! Please review the replace policy');
    setStep('policy');
    setPolicyPage(1);
  };

  //  Step 2 Policy Acceptance → Move to Plan Selection 
  const handlePolicyComplete = () => {
    if (!user) {
      toast.error(isKhmer ? 'សូមចូលគណនី (Login) ជាមុនសិន!' : 'Please login first!');
      navigate('/login?redirect=/seller-onboarding');
      return;
    }
    if (!policyAgreed && policyPage === totalPolicyPages) {
      return toast.error(isKhmer
        ? 'សូមចុចធីកយល់ព្រមលើគោលការណ៍ប្តូរទំនិញជាមុនសិន'
        : 'Please agree to the Replace Policy before proceeding');
    }
    setStep('plan');
  };

  //  Step 3 Free Basic Plan Select (7 Days Free Trial $0.00) 
  const handleSelectFreeBasicPlan = async () => {
    if (!user) {
      toast.error(isKhmer ? 'សូមចូលគណនី (Login) ជាមុនសិន!' : 'Please login first!');
      navigate('/login?redirect=/seller-onboarding');
      return;
    }
    setLoading(true);
    try {
      await sellerApi.apply({
        storeName: normalizeStoreName(form.storeName),
        storeDescription: form.storeDescription,
        subscriptionPlan: 'PLAN_1'
      });
      toast.success(isKhmer ? 'ហាងសាកល្បង ៧ ថ្ងៃឥតគិតថ្លៃត្រូវបានបង្កើតជោគជ័យ!' : '7-Day Free Trial store created successfully!');
      start15sStoreBuilding();
    } catch (err) {
      const msg = err?.response?.data?.message || '';
      if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('active')) {
        updateUser({ role: 'SELLER' });
        toast.success(isKhmer ? 'ហាងរបស់អ្នកដំណើរការហើយ!' : 'Your store is active!');
        navigate('/seller');
      } else {
        toast.error(msg || (isKhmer ? 'មានបញ្ហាក្នុងការបង្កើតហាង' : 'Error creating seller account'));
      }
    } finally {
      setLoading(false);
    }
  };

  //  Step 3 Paid Plan Select (Pro $4.50 / VIP $6.00) 
  const handleSelectPaidPlan = async (planId, planName, price) => {
    if (!user) {
      toast.error(isKhmer ? 'សូមចូលគណនី (Login) ជាមុនសិន!' : 'Please login first!');
      navigate('/login?redirect=/seller-onboarding');
      return;
    }
    setSelectedPlan({ id: planId, name: planName, price });

    // Generate KHQR Code with Merchant Name = 'Saby Shop' (Platform Store Name)
    const billNo = 'STORE-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900);
    const abaAccountId = import.meta.env.VITE_ABA_ACCOUNT_ID || import.meta.env.VITE_BAKONG_ACCOUNT_ID || 'ec477571@abaa';
    const abaPhone = import.meta.env.VITE_ABA_PHONE || import.meta.env.VITE_BAKONG_PHONE || '0972089305';
    const qr = generateKHQR({
      amount: price,
      billNumber: billNo,
      accountId: abaAccountId,
      merchantName: 'Saby Shop',
      merchantCity: 'Phnom Penh',
      storeLabel: 'Saby Shop',
      phoneNumber: abaPhone,
      terminalLabel: 'webqr'
    });
    const md5 = generateMD5(qr);

    setQrCodeData(qr);
    setMd5Hash(billNo);

    // Open Floating KHQR Payment Modal
    setIsPaymentModalOpen(true);

    // Register tran_id (billNo) on backend so ABA PayWay polling verification checks this tranId!
    try {
      await sellerApi.apply({
        storeName: normalizeStoreName(form.storeName),
        storeDescription: form.storeDescription,
        paymentId: billNo,
        subscriptionPlan: planId
      });
    } catch (err) {
      console.warn('Initial seller paymentId registration notice:', err);
    }

    setPolling(true);
    setPollCount(0);
  };

  const sellerCannedMessages = [
    {
      title: isKhmer ? 'សារបញ្ជាក់ការធានាជូនអតិថិជន' : 'Replacement Policy Assurance Notice',
      text: isKhmer
        ? 'ជម្រាបសួរអតិថិជនជាទីគោរព! រាល់ការបញ្ជាទិញពីហាងយើងខ្ញុំទទួលបានការធានាប្តូរថ្មី ១ ជំនួស ១ (1-to-1 Replacement Guarantee) ១០០% ពេញលេញតាមរយៈពេលដែលបានទិញ។ ប្រសិនបើមានបញ្ហា សូមផ្ញើរូបភាព Error មកកាន់ Chat នេះ យើងខ្ញុំនឹងដោះស្រាយជូនភ្លាមៗ!'
        : 'Hello! Thank you for purchasing from our store. All items are backed by our 100% 1-to-1 Replacement Guarantee throughout the entire purchased duration. If you encounter any login error, please send a screenshot here and we will immediately resolve it for you!'
    },
    {
      title: isKhmer ? 'សារប្រគល់គណនីថ្មីជំនួស' : 'Replacement Delivery Message',
      text: isKhmer
        ? 'ជម្រាបសួរ! ខ្ញុំបានពិនិត្យ និងរៀបចំគណនីថ្មីជំនួសជូនបងរួចរាល់ហើយ។ សូមបងចូលពិនិត្យ និងសាកល្បង Login មើល។ ប្រសិនបើដំណើរការត្រឹមត្រូវ សូមជួយបញ្ជាក់ការទទួលផង។ អរគុណ!'
        : 'Hello! I have verified your report and delivered a new replacement account. Please test the new credentials and let me know if everything is working smoothly. Thank you!'
    },
    {
      title: isKhmer ? 'ស្នើសុំរូបភាព Screenshot ពិនិត្យកំហុស' : 'Request Error Proof Screenshot',
      text: isKhmer
        ? 'ជម្រាបសួរ! ដើម្បីខ្ញុំអាចប្តូរគណនីថ្មីជូនបងបានលឿន សូមបងមេត្តាផ្ញើរូបភាព Screenshot បង្ហាញពីផ្ទាំង Error ឬសារកំហុសមកកាន់ខ្ញុំបាទ។ សូមអរគុណ!'
        : 'Hello! To process your replacement swiftly, could you please send a screenshot of the login screen or error message you are seeing? Thank you for your cooperation!'
    }
  ];

  const StepIndicator = () => {
    const stepList = [
      { key: 'details', label: isKhmer ? '១. ព័ត៌មានហាង' : '1. Store Info' },
      { key: 'policy', label: isKhmer ? '២. គោលការណ៍ប្តូរទំនិញ' : '2. Replace Policy' },
      { key: 'plan', label: isKhmer ? '៣. ជ្រើសរើសកញ្ចប់' : '3. Choose Plan' },
    ];
    const currentIdx = steps.indexOf(step);

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        {stepList.map((s, i) => {
          const sIdx = steps.indexOf(s.key);
          const done = sIdx < currentIdx;
          const active = sIdx === currentIdx;
          return (
            <React.Fragment key={s.key}>
              {i > 0 && (
                <div style={{
                  flex: 1, height: 2,
                  background: done ? 'var(--primary, #4F46E5)' : 'var(--border, #E2E8F0)',
                  transition: 'all 0.3s ease'
                }} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: done || active ? 'var(--primary, #4F46E5)' : 'var(--border, #E2E8F0)',
                  color: done || active ? '#fff' : 'var(--text-lighter, #94A3B8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.82rem', transition: 'all 0.3s'
                }}>
                  {done ? <FiCheckCircle size={15} /> : i + 1}
                </div>
                <span style={{
                  fontSize: '0.74rem',
                  color: active ? 'var(--primary, #4F46E5)' : 'var(--text-lighter, #94A3B8)',
                  fontWeight: active ? 800 : 600,
                  textAlign: 'center',
                  whiteSpace: 'nowrap'
                }}>
                  {s.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 12px' }}>
      <div style={{ width: '100%', maxWidth: step === 'plan' ? 920 : step === 'policy' ? 700 : 540 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, margin: '0 auto 12px',
            background: 'linear-gradient(135deg, var(--primary, #4F46E5), #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(99,102,241,0.3)'
          }}>
            <MdStorefront size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, color: 'var(--text, #0F172A)' }}>
            {isKhmer ? 'បើកហាងលក់ទំនិញឌីជីថល' : 'Become a Seller Store'}
          </h1>
          <p style={{ color: 'var(--text-lighter, #64748B)', marginTop: 6, fontSize: '0.9rem' }}>
            {step === 'details' && (isKhmer ? 'បញ្ចូលឈ្មោះហាងរបស់អ្នកដើម្បីចាប់ផ្ដើម' : 'Enter your store name to begin')}
            {step === 'policy' && (isKhmer ? 'ស្វែងយល់ និងយល់ព្រមលើគោលការណ៍ធានាប្តូរទំនិញ' : 'Review & accept the seller replacement guarantee')}
            {step === 'plan' && (isKhmer ? 'ជ្រើសរើសកញ្ចប់សមាជិកដើម្បីចាប់ផ្ដើមលក់' : 'Choose a membership plan to activate your store')}
          </p>
        </div>

        {/* Main Card */}
        <div style={{
          background: 'var(--card-bg, #ffffff)', borderRadius: 24, border: '1px solid var(--border, #E2E8F0)',
          padding: 'clamp(18px, 4vw, 28px)', boxShadow: 'var(--shadow-md, 0 10px 25px rgba(0,0,0,0.05))', width: '100%'
        }}>
          {step !== 'building' && step !== 'success' && <StepIndicator />}

          {/*  STEP 1: Store Name Details  */}
          {step === 'details' && (
            <form onSubmit={handleDetailsSubmit}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16, color: 'var(--text, #0F172A)' }}>
                {isKhmer ? 'ព័ត៌មានហាងរបស់អ្នក' : 'Your Store Details'}
              </h2>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-lighter, #64748B)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                  {isKhmer ? 'ឈ្មោះហាងរបស់អ្នក *' : 'Store Name *'}
                </label>
                <input
                  className="input"
                  placeholder={isKhmer ? 'ឧទាហរណ៍: ហាង ឌីជីថល សាប៊ី' : 'e.g. Saby Digital Store'}
                  value={form.storeName}
                  onChange={e => setForm(f => ({ ...f, storeName: e.target.value }))}
                  maxLength={60}
                  required
                  autoFocus
                  id="seller-store-name"
                  style={{
                    height: 44, fontSize: '0.95rem',
                    borderColor: storeNameStatus === 'taken' ? '#EF4444' : storeNameStatus === 'available' ? '#10B981' : undefined
                  }}
                />
                {/* Real-time availability indicator */}
                {storeNameStatus === 'checking' && (
                  <div style={{ marginTop: 6, fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <FiLoader size={13} style={{ animation: 'spin 1s linear infinite' }} />
                    {isKhmer ? 'កំពុងពិនិត្យឈ្មោះហាង...' : 'Checking availability...'}
                  </div>
                )}
                {storeNameStatus === 'available' && (
                  <div style={{ marginTop: 6, fontSize: '0.8rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700 }}>
                    <FiCheckCircle size={13} />
                    {isKhmer ? 'ឈ្មោះហាងនេះអាចប្រើបាន (អនុម័ត)!' : 'Store name is available and approved!'}
                  </div>
                )}
                {storeNameStatus === 'taken' && (
                  <div style={{ marginTop: 6, fontSize: '0.82rem', color: '#EF4444', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, background: '#FEF2F2', padding: '8px 12px', borderRadius: 8, border: '1px solid #FCA5A5' }}>
                    <FiX size={15} style={{ flexShrink: 0 }} />
                    <span>{isKhmer ? 'ឈ្មោះហាងនេះត្រូវបានប្រើប្រាស់ដោយអ្នកលក់ម្នាក់ទៀតហើយ! សូមជ្រើសរើសឈ្មោះដទៃ។' : 'This store name is already taken! Please choose a different name.'}</span>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-lighter, #64748B)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                  {isKhmer ? 'ការពិពណ៌នាអំពីហាង (ជម្រើស)' : 'Store Description (Optional)'}
                </label>
                <textarea
                  className="input"
                  placeholder={isKhmer ? 'ប្រាប់អតិថិជនអំពីផលិតផលដែលអ្នកលក់...' : 'Tell customers what products you sell...'}
                  value={form.storeDescription}
                  onChange={e => setForm(f => ({ ...f, storeDescription: e.target.value }))}
                  rows={3}
                  maxLength={300}
                  id="seller-store-description"
                  style={{ resize: 'vertical', minHeight: 80 }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={storeNameStatus === 'taken' || storeNameStatus === 'checking'}
                style={{
                  width: '100%', height: 46, borderRadius: 14, gap: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: '0.95rem',
                  opacity: (storeNameStatus === 'taken' || storeNameStatus === 'checking') ? 0.6 : 1,
                  cursor: (storeNameStatus === 'taken' || storeNameStatus === 'checking') ? 'not-allowed' : 'pointer'
                }}
                id="seller-next-step-1"
              >
                {isKhmer ? 'បន្តទៅគោលការណ៍ប្តូរទំនិញ' : 'Continue to Replace Policy'} <FiArrowRight size={18} />
              </button>
            </form>
          )}

          {/*  STEP 2: Page-by-Page Replace Policy Walkthrough  */}
          {step === 'policy' && (
            <div>
              {/* Top Banner with Store Name Verification Confirmation */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(79,70,229,0.06))',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 16,
                padding: '12px 16px',
                marginBottom: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MdVerified size={20} color="#10B981" />
                  <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#065F46' }}>
                    {isKhmer ? `ឈ្មោះហាង "${form.storeName}" បានអនុម័ត!` : `Store Name "${form.storeName}" Approved!`}
                  </span>
                </div>
                <span style={{
                  background: '#4F46E5', color: '#fff', fontSize: '0.72rem',
                  fontWeight: 800, padding: '3px 10px', borderRadius: 99
                }}>
                  {isKhmer ? `ទំព័រ ${policyPage} នៃ ${totalPolicyPages}` : `Page ${policyPage} of ${totalPolicyPages}`}
                </span>
              </div>

              {/* Policy Body Pages */}
              <div style={{ minHeight: 310, marginBottom: 20 }}>
                {/* PAGE 1: 1-TO-1 REPLACEMENT GUARANTEE */}
                {policyPage === 1 && (
                  <div className="animate-fade-in">
                    <div style={{
                      background: 'rgba(79, 70, 229, 0.06)',
                      border: '1px solid rgba(79, 70, 229, 0.25)',
                      borderRadius: 16, padding: '16px', marginBottom: 14
                    }}>
                      <div style={{ fontWeight: 800, color: '#4338CA', fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <FiRefreshCw size={18} />
                        <span>{isKhmer ? '១. កាតព្វកិច្ចធានាប្តូរទំនិញថ្មី ១ ជំនួស ១ (1-to-1 Replacement)' : '1. Mandatory 1-to-1 Replacement Guarantee'}</span>
                      </div>
                      <p style={{ margin: 0, color: '#3730A3', fontSize: '0.84rem', lineHeight: 1.6 }}>
                        {isKhmer
                          ? 'ក្នុងនាមជាអ្នកលក់នៅលើ Saby Shop លោកអ្នកមានកាតព្វកិច្ចផ្តល់គណនី ឬ License Key ថ្មីដែលមានដំណើរការត្រឹមត្រូវជូនអតិថិជន ប្រសិនបើអតិថិជនរាយការណ៍បញ្ហាក្នុងអំឡុងពេលធានា។'
                          : 'As an authorized seller on Saby Shop, you are strictly obligated to deliver 100% working replacement credentials if a customer encounters issues during the active warranty period.'}
                      </p>
                    </div>

                    <div style={{ background: 'var(--bg-secondary, #F8FAFC)', border: '1px solid var(--border, #E2E8F0)', borderRadius: 14, padding: '14px 16px' }}>
                      <div style={{ fontWeight: 800, marginBottom: 8, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.86rem' }}>
                        <FiShield size={16} color="#4F46E5" />
                        <span>{isKhmer ? 'ករណីដែលអ្នកលក់ត្រូវតែប្តូរថ្មីជូនអតិថិជន៖' : 'Mandatory Replacement Scenarios:'}</span>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-light, #475569)', fontSize: '0.83rem', lineHeight: 1.6 }}>
                        <li><strong>{isKhmer ? 'ខុស Password / Login Error:' : 'Wrong Password or Login Error:'}</strong> {isKhmer ? 'គណនីមិនអាចចូលប្រើប្រាស់បាន។' : 'Customer cannot log in with provided credentials.'}</li>
                        <li><strong>{isKhmer ? 'ផុតកំណត់ Subscription មុនកាលកំណត់:' : 'Early Subscription Expiry:'}</strong> {isKhmer ? 'កញ្ចប់សេវាផុតកំណត់មុនរយៈពេលដែលបានទិញ។' : 'Subscription expires before the warranty duration ends.'}</li>
                        <li><strong>{isKhmer ? 'ជាប់ Screen Limit / Family Invite Error:' : 'Screen Limit or Household Lock:'}</strong> {isKhmer ? 'ជាប់បញ្ហាកំណត់ចំនួនអេក្រង់ ឬ Invite link មិនដំណើរការ។' : 'Household location locks or broken invite links.'}</li>
                        <li><strong>{isKhmer ? 'ផលិតផលខុសពីការបញ្ជាទិញ:' : 'Mismatched Variant:'}</strong> {isKhmer ? 'ប្រគល់ខុសកញ្ចប់ ឬខុសប្រភេទដែលបានបញ្ជាទិញ។' : 'Delivered credentials differ from the purchased plan variant.'}</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* PAGE 2: 24-HOUR SLA & ESCROW SAFETY */}
                {policyPage === 2 && (
                  <div className="animate-fade-in">
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      borderRadius: 16, padding: '16px', marginBottom: 14
                    }}>
                      <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <FiClock size={18} />
                        <span>{isKhmer ? '២. រយៈពេលឆ្លើយតប & ការទូទាត់ប្រព័ន្ធ Escrow សុវត្ថិភាព' : '2. 24-Hour Response SLA & Safe Escrow Protection'}</span>
                      </div>
                      <p style={{ margin: 0, color: '#065F46', fontSize: '0.84rem', lineHeight: 1.6 }}>
                        {isKhmer
                          ? 'រាល់ការបញ្ជាទិញ ប្រាក់ត្រូវបានរក្សាទុកដោយសុវត្ថិភាពក្នុងប្រព័ន្ធ Escrow។ ប្រាក់នឹងត្រូវបានផ្ទេរចូលកាបូបរបស់អ្នកលក់បន្ទាប់ពីអតិថិជនបានទទួលទំនិញដំណើរការត្រឹមត្រូវ ឬអស់រយៈពេល ៤៨ ម៉ោងដោយគ្មានបណ្ដឹង។'
                          : 'Customer payments are held safely in escrow. Funds are released to your seller balance once the customer confirms delivery or after 48 hours pass with no active disputes.'}
                      </p>
                    </div>

                    <div style={{ background: 'var(--bg-secondary, #F8FAFC)', border: '1px solid var(--border, #E2E8F0)', borderRadius: 14, padding: '14px 16px' }}>
                      <div style={{ fontWeight: 800, marginBottom: 8, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.86rem' }}>
                        <FiCheckCircle size={16} color="#10B981" />
                        <span>{isKhmer ? 'ក្បួនរក្សា Rating ផ្កាយ ៥ និងទំនុកចិត្តខ្ពស់៖' : 'Best Practices for 5-Star Seller Rating:'}</span>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-light, #475569)', fontSize: '0.83rem', lineHeight: 1.6 }}>
                        <li><strong>{isKhmer ? 'ឆ្លើយតបលឿន (ក្រោម ២៤ ម៉ោង):' : 'Fast Response (Under 24 Hours):'}</strong> {isKhmer ? 'ជួយដោះស្រាយ និងប្តូរគណនីថ្មីជូនអតិថិជនឱ្យបានរហ័ស។' : 'Resolve replacement requests swiftly to maintain high store ratings.'}</li>
                        <li><strong>{isKhmer ? 'ពិនិត្យភស្តុតាង Screenshot:' : 'Verify Error Screenshots:'}</strong> {isKhmer ? 'ស្នើសុំអតិថិជនផ្ញើរូបភាពផ្ទាំង Error មុននឹងប្រគល់គណនីថ្មីជំនួស។' : 'Ask customers for clear login error screenshots before issuing replacement.'}</li>
                        <li><strong>{isKhmer ? 'ជៀសវាងការ Dispute ទៅ Admin:' : 'Prevent Admin Disputes:'}</strong> {isKhmer ? 'ការដោះស្រាយដោយរួសរាយជាមួយអតិថិជននឹងជួយឱ្យហាងរបស់អ្នកទទួលបាន Review ល្អៗជានិច្ច។' : 'Friendly service guarantees positive reviews and prevents store penalties.'}</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* PAGE 3: DELIVERY & REFUND OBLIGATION */}
                {policyPage === 3 && (
                  <div className="animate-fade-in">
                    <div style={{
                      background: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      borderRadius: 16, padding: '16px', marginBottom: 14
                    }}>
                      <div style={{ fontWeight: 800, color: '#B45309', fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <FiPackage size={18} />
                        <span>{isKhmer ? '៣. របៀបប្រគល់គណនីប្តូរថ្មី & ករណីគ្មានស្តុក' : '3. Replacement Delivery & Out-of-Stock Refund Rules'}</span>
                      </div>
                      <p style={{ margin: 0, color: '#92400E', fontSize: '0.84rem', lineHeight: 1.6 }}>
                        {isKhmer
                          ? 'លោកអ្នកអាចបញ្ជូនព័ត៌មានគណនីថ្មីដោយផ្ទាល់តាមរយៈផ្ទាំង Dispute Review ឬក្នុង Customer Chat Inbox ដោយសុវត្ថិភាព។'
                          : 'You can deliver new replacement credentials directly via the Dispute Review popup or inside the Customer Chat inbox.'}
                      </p>
                    </div>

                    <div style={{ background: 'var(--bg-secondary, #F8FAFC)', border: '1px solid var(--border, #E2E8F0)', borderRadius: 14, padding: '14px 16px' }}>
                      <div style={{ fontWeight: 800, marginBottom: 8, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.86rem' }}>
                        <FiShield size={16} color="#F59E0B" />
                        <span>{isKhmer ? 'កាតព្វកិច្ចនៅពេលគ្មានស្តុកជំនួស (Out of Stock):' : 'Out of Replacement Stock Obligations:'}</span>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-light, #475569)', fontSize: '0.83rem', lineHeight: 1.6 }}>
                        <li>{isKhmer ? 'ប្រសិនបើហាងរបស់អ្នកអស់ស្តុក ឬមិនអាចរកគណនីជំនួសបាន អ្នកលក់ត្រូវចុចយល់ព្រមបង្វិលប្រាក់ (Agree Refund) ជូនអតិថិជនវិញពេញលេញ ១០០%។' : 'If you run out of stock and cannot supply a working replacement, you must agree to a 100% full refund for the buyer.'}</li>
                        <li>{isKhmer ? 'ហាមដាច់ខាតមិនឱ្យគេចវេះ ឬមិនឆ្លើយតបសារអតិថិជន។' : 'Never ignore customer complaints or leave issues unaddressed.'}</li>
                        <li>{isKhmer ? 'ប្រសិនបើមានវិវាទមិនចុះសម្រុង Admin នឹងត្រួតពិនិត្យភស្តុតាង និងចេញសេចក្តីសម្រេចជាស្ថាពរ។' : 'If a dispute cannot be resolved directly, Admin Mediation will investigate chat evidence and issue a final ruling.'}</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* PAGE 4: CANNED MESSAGES & SELLER AGREEMENT */}
                {policyPage === 4 && (
                  <div className="animate-fade-in">
                    <div style={{ fontWeight: 800, marginBottom: 10, color: 'var(--text, #0F172A)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FiMessageSquare size={16} color="#4F46E5" />
                      <span>{isKhmer ? '៤. សារគំរូរួចជាស្រេចសម្រាប់អ្នកលក់ (1-Click Canned Replies):' : '4. Ready-Made Seller Canned Message Templates:'}</span>
                    </div>

                    {sellerCannedMessages.map((tmpl, idx) => (
                      <div key={idx} style={{ background: 'var(--bg-secondary, #F8FAFC)', border: '1px solid var(--border, #E2E8F0)', borderRadius: 12, padding: '12px', marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#059669' }}>{tmpl.title}</span>
                          <CopyBtn text={tmpl.text} />
                        </div>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-light, #475569)', background: '#ffffff', padding: '6px 10px', borderRadius: 8, border: '1px solid #E2E8F0', lineHeight: 1.4 }}>
                          {tmpl.text}
                        </p>
                      </div>
                    ))}

                    {/* Agreement Checkbox */}
                    <div
                      onClick={() => setPolicyAgreed(!policyAgreed)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '12px 14px',
                        borderRadius: 14,
                        background: policyAgreed ? 'rgba(16,185,129,0.08)' : 'var(--bg-secondary, #F8FAFC)',
                        border: policyAgreed ? '2px solid #10B981' : '1.5px solid var(--border, #CBD5E1)',
                        cursor: 'pointer',
                        marginTop: 12,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        border: policyAgreed ? '2px solid #10B981' : '2px solid var(--border, #94A3B8)',
                        background: policyAgreed ? '#10B981' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFF',
                        flexShrink: 0
                      }}>
                        {policyAgreed && <FiCheck size={15} />}
                      </div>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: policyAgreed ? '#065F46' : 'var(--text, #1E293B)', lineHeight: 1.4 }}>
                        {isKhmer
                          ? 'ខ្ញុំបានយល់ច្បាស់ពីគោលការណ៍ប្តូរទំនិញ និងសន្យាថានឹងផ្តល់ការធានា ១ ជំនួស ១ ជូនអតិថិជនឱ្យបានត្រឹមត្រូវ។'
                          : 'I understand the Replace Policy and commit to honoring the 1-to-1 replacement guarantee for my customers.'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Policy Footer Navigation */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid var(--border, #E2E8F0)',
                paddingTop: 16,
                gap: 10,
                flexWrap: 'wrap'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    if (policyPage > 1) {
                      setPolicyPage(p => p - 1);
                    } else {
                      setStep('details');
                    }
                  }}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 12,
                    border: '1px solid var(--border, #CBD5E1)',
                    background: 'var(--bg-secondary, #F8FAFC)',
                    color: 'var(--text, #1E293B)',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <FiChevronLeft size={16} />
                  <span>{policyPage > 1 ? (isKhmer ? 'ថយក្រោយ' : 'Back') : (isKhmer ? 'កែឈ្មោះហាង' : 'Edit Store Info')}</span>
                </button>

                {/* Page Dots */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {[1, 2, 3, 4].map(pNum => (
                    <div
                      key={pNum}
                      onClick={() => setPolicyPage(pNum)}
                      style={{
                        width: policyPage === pNum ? 22 : 8,
                        height: 8,
                        borderRadius: 4,
                        background: policyPage === pNum ? '#4F46E5' : 'var(--border, #CBD5E1)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    />
                  ))}
                </div>

                {policyPage < totalPolicyPages ? (
                  <button
                    type="button"
                    onClick={() => setPolicyPage(p => p + 1)}
                    style={{
                      padding: '9px 20px',
                      borderRadius: 12,
                      border: 'none',
                      background: '#4F46E5',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 4px 12px rgba(79,70,229,0.3)'
                    }}
                  >
                    <span>{isKhmer ? 'ទំព័របន្ទាប់' : 'Next Page'}</span>
                    <FiChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePolicyComplete}
                    disabled={!policyAgreed}
                    style={{
                      padding: '9px 20px',
                      borderRadius: 12,
                      border: 'none',
                      background: policyAgreed ? 'linear-gradient(135deg, #10B981, #059669)' : '#94A3B8',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.84rem',
                      cursor: policyAgreed ? 'pointer' : 'not-allowed',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: policyAgreed ? '0 4px 12px rgba(16,185,129,0.3)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <FiCheckCircle size={16} />
                    <span>{isKhmer ? 'យល់ព្រម & ជ្រើសរើសកញ្ចប់' : 'Accept & Choose Plan'}</span>
                    <FiArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/*  STEP 3: Choose Plan  */}
          {step === 'plan' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, color: 'var(--text, #0F172A)' }}>
                    {isKhmer ? 'ជ្រើសរើសកញ្ចប់សមាជិកហាង' : 'Select Your Store Plan'}
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-lighter, #64748B)' }}>
                    {isKhmer ? 'ជ្រើសរើសគម្រោងហាងរបស់អ្នកដើម្បីចាប់ផ្តើមលក់ (Starter $2.50, Pro $4.50, VIP $6.00)' : 'Select your store subscription plan to start selling (Starter $2.50, Pro $4.50, VIP $6.00)'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('policy')}
                  style={{ background: 'var(--bg-secondary, #F8FAFC)', border: '1px solid var(--border, #CBD5E1)', borderRadius: 10, padding: '6px 12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', color: 'var(--text, #1E293B)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <FiArrowLeft size={14} />
                  {isKhmer ? 'មើលគោលការណ៍ឡើងវិញ' : 'Back to Policy'}
                </button>
              </div>

              {/* Plan Cards Grid — Fully Responsive on Phone & PC */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                {/* 1. Starter / Free Trial Plan */}
                <div style={{
                  background: 'var(--card-bg, #ffffff)', border: '2px solid #10B981', borderRadius: 20, padding: '20px',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative',
                  boxShadow: '0 8px 20px rgba(16, 185, 129, 0.15)'
                }}>
                  <div style={{ position: 'absolute', top: -12, right: 16, background: '#10B981', color: '#fff', padding: '2px 10px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 900 }}>
                    {hasUsedFreeTrial
                      ? (isKhmer ? 'កញ្ចប់សន្សំសំចៃ' : 'STARTER')
                      : (isKhmer ? 'សាកល្បង 7 ថ្ងៃឥតគិតថ្លៃ (1 គណនីបានម្តង)' : '7-DAY FREE TRIAL (1-TIME)')}
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 900, color: 'var(--text, #0F172A)' }}>
                      {hasUsedFreeTrial
                        ? (isKhmer ? 'កញ្ចប់ Starter' : 'Starter Plan')
                        : (isKhmer ? 'កញ្ចប់សាកល្បង (ឥតគិតថ្លៃ 7 ថ្ងៃ)' : 'Basic Plan (7 Days Free)')}
                    </h3>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10B981', marginBottom: 12 }}>
                      {hasUsedFreeTrial ? (
                        <>
                          $2.50 <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-lighter, #64748B)' }}>/ {isKhmer ? 'ខែ' : 'mo'}</span>
                        </>
                      ) : (
                        <>
                          $0.00 <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-lighter, #64748B)' }}>/ {isKhmer ? '៧ ថ្ងៃដំបូង (បន្ទាប់មក $2.50/ខែ)' : '1st 7 Days (then $2.50/mo)'}</span>
                        </>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-light, #475569)', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiCheckCircle color="#10B981" size={14} />
                        <span>{isKhmer ? 'ដាក់លក់បានរហូតដល់ 10 មុខទំនិញ' : 'Up to 10 Product Listings'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiCheckCircle color="#10B981" size={14} />
                        <span>{isKhmer ? 'ប្រព័ន្ធផ្ញើទំនិញស្វ័យប្រវត្តិ (Auto-Delivery)' : 'Standard Auto-Delivery'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiCheckCircle color="#10B981" size={14} />
                        <span>{isKhmer ? 'ផ្ញើសារផ្ទាល់ជាមួយអតិថិជន' : 'Customer Direct Chat'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiCheckCircle color="#10B981" size={14} />
                        <span>
                          {hasUsedFreeTrial
                            ? (isKhmer ? 'ផ្ទាំងគ្រប់គ្រងការលក់ស្តង់ដារ' : 'Standard Seller Dashboard')
                            : (isKhmer ? 'សាកល្បងឥតគិតថ្លៃ ៧ ថ្ងៃពេញ (១ គណនីបានម្ដង)' : '100% Free 7 Days (1x per account)')}
                        </span>
                      </div>
                    </div>
                  </div>
                  {hasUsedFreeTrial ? (
                    <button
                      onClick={() => handleSelectPaidPlan('PLAN_1', 'Starter Plan', 2.50)}
                      disabled={loading}
                      style={{
                        width: '100%', padding: '11px', borderRadius: 12, border: 'none',
                        background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff',
                        fontWeight: 900, fontSize: '0.88rem', cursor: loading ? 'wait' : 'pointer',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      {isKhmer ? 'ជ្រើសរើសកញ្ចប់ Starter ($២.៥០)' : 'Select Starter Plan ($2.50)'}
                    </button>
                  ) : (
                    <button
                      onClick={handleSelectFreeBasicPlan}
                      disabled={loading}
                      style={{
                        width: '100%', padding: '11px', borderRadius: 12, border: 'none',
                        background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff',
                        fontWeight: 900, fontSize: '0.88rem', cursor: loading ? 'wait' : 'pointer',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      {loading ? (isKhmer ? 'កំពុងបើកហាង...' : 'Activating...') : (isKhmer ? 'ចាប់ផ្ដើមឥតគិតថ្លៃ 7 ថ្ងៃ ($0.00)' : 'Start 7-Day Free Trial ($0.00)')}
                    </button>
                  )}
                </div>

                {/* 2. Pro Plan ($4.50/mo) */}
                <div style={{
                  background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border, #E2E8F0)', borderRadius: 20, padding: '20px',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative'
                }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 900, color: 'var(--text, #0F172A)' }}>
                      {isKhmer ? 'កញ្ចប់ Pro និង AI' : 'Pro Plan + AI'}
                    </h3>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#EC4899', marginBottom: 12 }}>
                      $4.50 <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-lighter, #64748B)' }}>/ {isKhmer ? 'ខែ' : 'mo'}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-light, #475569)', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiCheckCircle color="#EC4899" size={14} />
                        <span>{isKhmer ? 'រាប់បញ្ចូលមុខងារកញ្ចប់មូលដ្ឋានទាំងអស់' : 'Everything in Basic'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiCheckCircle color="#EC4899" size={14} />
                        <span>{isKhmer ? 'AI ឆ្លើយតបសារអតិថិជន 24/7' : 'AI 24/7 Customer Auto-Reply'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiCheckCircle color="#EC4899" size={14} />
                        <span>{isKhmer ? 'AI ណែនាំផលិតផល និងស្តុក' : 'AI Product Suggestions'}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelectPaidPlan('PLAN_2', 'Pro Plan + AI', 4.50)}
                    style={{
                      width: '100%', padding: '11px', borderRadius: 12, border: 'none',
                      background: '#EC4899', color: '#fff',
                      fontWeight: 900, fontSize: '0.88rem', cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(236, 72, 153, 0.25)'
                    }}
                  >
                    {isKhmer ? 'ជ្រើសរើសកញ្ចប់ Pro ($៤.៥០)' : 'Select Pro Plan ($4.50)'}
                  </button>
                </div>

                {/* 3. VIP Plan ($6.00/mo) */}
                <div style={{
                  background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border, #E2E8F0)', borderRadius: 20, padding: '20px',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative'
                }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 900, color: 'var(--text, #0F172A)' }}>
                      {isKhmer ? 'កញ្ចប់ VIP និងជម្រុញហាង' : 'VIP Plan + Boost'}
                    </h3>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#8B5CF6', marginBottom: 12 }}>
                      $6.00 <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-lighter, #64748B)' }}>/ {isKhmer ? 'ខែ' : 'mo'}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-light, #475569)', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiCheckCircle color="#8B5CF6" size={14} />
                        <span>{isKhmer ? 'រាប់បញ្ចូលមុខងារកញ្ចប់ Pro ទាំងអស់' : 'Everything in Pro Plan'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiCheckCircle color="#8B5CF6" size={14} />
                        <span>{isKhmer ? 'ជម្រុញបង្ហាញហាងលើគេ 7 ថ្ងៃ' : 'Top Store 7-Day Priority Boost'}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelectPaidPlan('PLAN_3', 'VIP Plan + Boost', 6.00)}
                    style={{
                      width: '100%', padding: '11px', borderRadius: 12, border: 'none',
                      background: '#8B5CF6', color: '#fff',
                      fontWeight: 900, fontSize: '0.88rem', cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(139, 92, 246, 0.25)'
                    }}
                  >
                    {isKhmer ? 'ជ្រើសរើសកញ្ចប់ VIP ($៦.០០)' : 'Select VIP Plan ($6.00)'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/*  STEP 4: 15-Second Store Building Screen  */}
          {step === 'building' && (
            <div style={{ textAlign: 'center', padding: '36px 12px' }}>
              {/* Pulsing Store Launcher Icon */}
              <div style={{
                width: 88, height: 88, borderRadius: 28, margin: '0 auto 24px',
                background: 'linear-gradient(135deg, #10B981, #6366F1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 12px 36px rgba(16, 185, 129, 0.4)',
                animation: 'pulse 2s infinite'
              }}>
                <MdStorefront size={46} color="#fff" />
              </div>

              <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text, #0F172A)', marginBottom: 8 }}>
                {isKhmer ? 'កំពុងរៀបចំបង្កើតហាងរបស់អ្នក...' : 'We are building your store...'}
              </h2>
              <p style={{ color: 'var(--text-lighter, #64748B)', fontSize: '0.88rem', marginBottom: 18 }}>
                {isKhmer ? 'សូមរង់ចាំ 15 វិនាទី ប្រព័ន្ធកំពុងរៀបចំប្រវត្តិរូបហាង និងឧបករណ៍លក់ទំនិញ' : 'Please wait 15 seconds. Setting up your store profile and seller tools.'}
              </p>

              {/* Countdown & Percentage Badge */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '6px 16px', borderRadius: 20, background: 'var(--primary-subtle, rgba(99, 102, 241, 0.1))', color: 'var(--primary, #4F46E5)', fontWeight: 800, fontSize: '0.92rem', marginBottom: 16 }}>
                <span>{isKhmer ? `នៅសល់ ${buildingSecondsLeft} វិនាទី` : `${buildingSecondsLeft}s remaining`}</span>
                <span>•</span>
                <span style={{ fontFamily: 'monospace' }}>{buildingProgress}%</span>
              </div>

              {/* Smooth Progress Bar */}
              <div style={{
                width: '100%', maxWidth: 420, height: 12, borderRadius: 10,
                background: 'var(--bg-secondary, #F1F5F9)', border: '1px solid var(--border, #CBD5E1)',
                margin: '0 auto 20px', overflow: 'hidden', padding: 2
              }}>
                <div style={{
                  width: `${buildingProgress}%`, height: '100%', borderRadius: 8,
                  background: 'linear-gradient(90deg, #10B981 0%, #6366F1 50%, #EC4899 100%)',
                  transition: 'width 0.15s ease-out'
                }} />
              </div>

              {/* Dynamic Animated Status Messages */}
              <div style={{ fontSize: '0.84rem', color: 'var(--text, #0F172A)', fontWeight: 700, minHeight: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <FiLoader size={16} style={{ animation: 'spin 1.5s linear infinite' }} color="var(--primary, #4F46E5)" />
                {buildingProgress < 25 && (isKhmer ? 'កំពុងបង្កើតទិន្នន័យ និងព័ត៌មានហាង...' : 'Setting up store profile & database...')}
                {buildingProgress >= 25 && buildingProgress < 50 && (isKhmer ? 'កំពុងកំណត់រចនាសម្ព័ន្ធ Server និងសុវត្ថិភាព...' : 'Configuring store security & seller channel...')}
                {buildingProgress >= 50 && buildingProgress < 75 && (isKhmer ? 'កំពុងបើកដំណើរការ AI ជំនួយការ និងឧបករណ៍គ្រប់គ្រង...' : 'Activating AI Assistant & Product Tools...')}
                {buildingProgress >= 75 && (isKhmer ? 'កំពុងរៀបចំផ្ទាំងគ្រប់គ្រងហាងរបស់អ្នក...' : 'Finalizing store launch & dashboard access...')}
              </div>
            </div>
          )}

          {/*  STEP 5: Success & Telegram Bot Connection Prompt  */}
          {step === 'success' && (
            <div style={{ padding: '8px 0' }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', margin: '0 auto 12px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)'
                }}>
                  <FiCheckCircle size={34} color="#fff" />
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text, #0F172A)', margin: '0 0 6px' }}>
                  {isKhmer ? 'ហាងរបស់អ្នកត្រូវបានបង្កើតជោគជ័យ!' : 'Store Created Successfully!'}
                </h2>
                <p style={{ color: 'var(--text-lighter, #64748B)', fontSize: '0.85rem', margin: 0 }}>
                  {isKhmer
                    ? 'សូមតភ្ជាប់ Telegram Bot ដើម្បីទទួលបានការជូនដំណឹងការបញ្ជាទិញភ្លាមៗពីអតិថិជន'
                    : 'Connect your store with our Telegram Bot to receive instant real-time order alerts.'}
                </p>
              </div>

              {/* Telegram Connection Card */}
              <div style={{
                background: 'rgba(0, 136, 204, 0.04)',
                border: '1.5px solid rgba(0, 136, 204, 0.3)',
                borderRadius: 20,
                padding: '20px',
                marginBottom: 20
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: 'linear-gradient(135deg, #0088cc, #29b6f6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', boxShadow: '0 4px 12px rgba(0, 136, 204, 0.3)'
                  }}>
                    <FaTelegram size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#0088cc' }}>
                      {isKhmer ? 'តភ្ជាប់ Telegram Bot សម្រាប់ការជូនដំណឹង' : 'Connect Telegram Notification Bot'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-light, #64748B)' }}>
                      Bot: @sabyshop_notication_bot
                    </div>
                  </div>
                </div>

                {/* Verification Credentials to Input in Bot */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid var(--border, #CBD5E1)',
                  borderRadius: 14,
                  padding: '14px 16px',
                  display: 'grid',
                  gap: 10,
                  marginBottom: 16
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
                    <span style={{ color: 'var(--text-lighter, #64748B)', fontWeight: 700 }}>
                      {isKhmer ? 'លេខសម្គាល់ហាង (Store ID):' : 'Store ID (ID):'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 900, color: '#0088cc', fontSize: '0.95rem' }}>
                        #{createdStoreProfile?.id || user?.id || '—'}
                      </span>
                      <CopyBtn text={String(createdStoreProfile?.id || user?.id || '')} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
                    <span style={{ color: 'var(--text-lighter, #64748B)', fontWeight: 700 }}>
                      {isKhmer ? 'អ៊ីមែលគណនី (Email):' : 'Account Email:'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 800, color: 'var(--text, #0F172A)' }}>
                        {user?.email || '—'}
                      </span>
                      <CopyBtn text={user?.email || ''} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '0.84rem' }}>
                    <span style={{ color: 'var(--text-lighter, #64748B)', fontWeight: 700 }}>
                      {isKhmer ? 'ពាក្យសម្ងាត់ (Password):' : 'Account Password:'}
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 800, color: '#10B981', fontStyle: 'italic' }}>
                        {isKhmer ? 'បញ្ចូលពាក្យសម្ងាត់របស់អ្នក' : 'Input your password'}
                      </span>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-lighter, #94A3B8)', marginTop: 2 }}>
                        {isKhmer ? '(ពាក្យសម្ងាត់ដែលបានចុះឈ្មោះក្នុងគេហទំព័រ)' : '(The password used to register your account)'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3 Steps Guide */}
                <div style={{
                  background: 'var(--bg-secondary, #F8FAFC)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  fontSize: '0.8rem',
                  color: 'var(--text, #1E293B)',
                  lineHeight: 1.5
                }}>
                  <div style={{ fontWeight: 800, color: '#0088cc', marginBottom: 6 }}>
                    {isKhmer ? 'ជំហានតភ្ជាប់ក្នុង Telegram Bot (៣ ជំហាន):' : '3-Step Verification in Telegram Bot:'}
                  </div>
                  <div style={{ marginBottom: 4 }}>
                    <strong>1.</strong> {isKhmer ? 'បើក Bot ហើយចុច Start (/start)' : 'Open @sabyshop_notication_bot and click Start (/start)'}
                  </div>
                  <div style={{ marginBottom: 4 }}>
                    <strong>2.</strong> {isKhmer ? 'ជ្រើសរើស "[2] Connect Notification Website to Bot"' : 'Select "[2] Connect Notification Website to Bot"'}
                  </div>
                  <div>
                    <strong>3.</strong> {isKhmer ? `បញ្ចូល Email, Password និង Store ID (#${createdStoreProfile?.id || user?.id || ''})` : `Enter your Email, Password, and Store ID (#${createdStoreProfile?.id || user?.id || ''})`}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <a
                  href="https://t.me/sabyshop_notication_bot"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px 16px', borderRadius: 14,
                    background: 'linear-gradient(135deg, #0088cc 0%, #29b6f6 100%)',
                    color: '#fff', textDecoration: 'none',
                    fontWeight: 900, fontSize: '0.88rem',
                    boxShadow: '0 4px 14px rgba(0, 136, 204, 0.3)'
                  }}
                >
                  <FaTelegram size={18} />
                  <span>{isKhmer ? 'តភ្ជាប់ Telegram ឥឡូវនេះ' : 'Connect with Telegram'}</span>
                </a>

                <button
                  type="button"
                  onClick={() => navigate('/seller')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '12px 16px', borderRadius: 14,
                    background: 'var(--bg-secondary, #F1F5F9)',
                    border: '1px solid var(--border, #CBD5E1)',
                    color: 'var(--text, #334155)',
                    fontWeight: 800, fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  <span>{isKhmer ? 'រំលងសិន / ចូលផ្ទាំងគ្រប់គ្រង' : 'Skip for Now / Dashboard'}</span>
                  <FiArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/*  FLOATING KHQR PAYMENT POP-UP MODAL OVERLAY (Responsive Phone & Computer)  */}
      {isPaymentModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '24px', maxWidth: '400px', width: '95%',
            maxHeight: 'min(92vh, 680px)', overflowY: 'auto', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)', color: '#0f172a',
            border: '1px solid #E2E8F0', animation: 'fadeInScale 0.3s ease-out'
          }}>
            {/* Clean White Header Top Bar */}
            <div style={{
              background: '#ffffff', padding: '14px 20px', display: 'flex',
              alignItems: 'center', justifyContent: 'space-between', color: '#0F2942',
              borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 50
            }}>
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F2942' }}>
                {isKhmer ? `ទូទាត់ប្រាក់សម្រាប់កញ្ចប់ ${selectedPlan.name}` : `Payment for ${selectedPlan.name}`}
              </span>
              <button
                onClick={() => { setIsPaymentModalOpen(false); setPolling(false); }}
                style={{
                  background: '#FEE2E2', border: '1.5px solid #FCA5A5', borderRadius: '50%',
                  width: '36px', height: '36px', color: '#DC2626', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(220, 38, 38, 0.15)', flexShrink: 0
                }}
                aria-label={isKhmer ? 'បិទផ្ទាំង' : 'Close'}
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 16px 24px', textAlign: 'center' }}>
              {/* KHQR Ticket Container */}
              <div style={{
                maxWidth: '300px', margin: '0 auto', background: '#ffffff',
                borderRadius: '20px', border: '1px solid #E2E8F0', overflow: 'hidden',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)'
              }}>
                {/* Red KHQR Banner */}
                <div style={{
                  background: '#D12027', height: '50px', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: '#ffffff'
                }}>
                  <span style={{ fontWeight: 900, fontSize: '1.45rem', letterSpacing: '3px' }}>KHQR</span>
                </div>

                {/* Ticket Details */}
                <div style={{ padding: '16px 18px 18px', textAlign: 'left' }}>
                  {/* Merchant Name MUST be Saby Shop for seller plan registration */}
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Saby Shop
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '2.0rem', fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>
                      {selectedPlan.price.toFixed(2)}
                    </span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1E40AF' }}>USD</span>
                  </div>

                  <div style={{ borderTop: '1.5px dashed #CBD5E1', margin: '12px 0 14px' }} />

                  {/* QR Code SVG */}
                  {qrCodeData && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '2px' }}>
                      <QRCodeSVG
                        value={qrCodeData}
                        size={180}
                        level="H"
                        imageSettings={{
                          src: DOLLAR_LOGO_SVG,
                          x: undefined, y: undefined,
                          height: 34, width: 34,
                          excavate: true
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Subtext */}
              <p style={{ color: '#64748B', fontSize: '0.8rem', margin: '14px auto 0', maxWidth: '280px', lineHeight: 1.4 }}>
                {isKhmer ? 'ស្កេនជាមួយ ABA Mobile ឬកម្មវិធីធនាគារផ្សេងទៀត' : 'Scan with ABA Mobile or any banking app via KHQR'}
              </p>

              {/* Live Polling Status & 3-Min Timer */}
              <div style={{
                background: '#F8FAFC', borderRadius: '12px', padding: '10px 14px', marginTop: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #E2E8F0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                  <span style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 600 }}>
                    {isKhmer ? `កំពុងពិនិត្យស្ថានភាពទូទាត់ (${pollCount}/២៣)...` : `Checking payment status (${pollCount}/23)...`}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'monospace', fontWeight: 800, color: '#D12027', fontSize: '0.88rem' }}>
                  <FiClock size={14} />
                  {formatTime(timeLeft)}
                </div>
              </div>

              {/* Bottom Cancel & Close Button */}
              <button
                type="button"
                onClick={() => { setIsPaymentModalOpen(false); setPolling(false); }}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
