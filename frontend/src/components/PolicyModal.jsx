import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  FiShield, FiRefreshCw, FiDollarSign, FiX, FiCheckCircle,
  FiAlertCircle, FiHelpCircle, FiClock, FiFileText, FiUser,
  FiShoppingBag, FiMessageSquare, FiCopy, FiCheck,
  FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import { MdStorefront, MdVerified } from 'react-icons/md';
import toast from 'react-hot-toast';

const CopyMessageBtn = ({ text, label }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(label ? `Copied: ${label}` : 'Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 12px',
        borderRadius: 8,
        border: '1px solid #4F46E5',
        background: copied ? '#ECFDF5' : 'rgba(79, 70, 229, 0.08)',
        color: copied ? '#059669' : '#4F46E5',
        fontWeight: 700,
        fontSize: '0.78rem',
        cursor: 'pointer',
        transition: 'all 0.15s ease'
      }}
    >
      {copied ? <FiCheck size={13} /> : <FiCopy size={13} />}
      <span>{copied ? 'Copied!' : 'Copy Message'}</span>
    </button>
  );
};

const PolicyModal = ({ isOpen, onClose, initialTab = 'overview' }) => {
  const { lang } = useLanguage();
  const isKhmer = lang === 'km';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [replaceSubTab, setReplaceSubTab] = useState('user'); // 'user' | 'seller' | 'templates'

  const tabsContainerRef = useRef(null);
  const tabRefs = useRef({});
  const subTabsContainerRef = useRef(null);
  const subTabRefs = useRef({});

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkTabScroll = () => {
    if (tabsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
      setCanScrollLeft(scrollLeft > 6);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
    }
  };

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setTimeout(() => {
      const el = tabRefs.current[tabKey];
      if (el) {
        el.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
      checkTabScroll();
    }, 60);
  };

  const handleSubTabChange = (subKey) => {
    setReplaceSubTab(subKey);
    setTimeout(() => {
      const el = subTabRefs.current[subKey];
      if (el) {
        el.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }, 60);
  };

  const scrollTabs = (direction) => {
    if (tabsContainerRef.current) {
      const amount = direction === 'left' ? -160 : 160;
      tabsContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
      setTimeout(checkTabScroll, 250);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setTimeout(() => {
        const el = tabRefs.current[initialTab];
        if (el) {
          el.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
          });
        }
        checkTabScroll();
      }, 100);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (isOpen) {
      checkTabScroll();
      window.addEventListener('resize', checkTabScroll);
      return () => window.removeEventListener('resize', checkTabScroll);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const buyerTemplates = [
    {
      title: isKhmer ? 'ស្នើសុំប្តូរគណនី (ខុស Password)' : 'Wrong Password Replacement Request',
      text: isKhmer
        ? 'ជម្រាបសួរអ្នកលក់! ខ្ញុំបានបញ្ជាទិញគណនីនេះ ប៉ុន្តែមិនអាច Login បានទេ (Wrong password / Invalid credentials)។ ខ្ញុំបានភ្ជាប់រូបភាព Error ខាងក្រោម សូមជួយពិនិត្យ និងប្តូរគណនីថ្មីជូនខ្ញុំផង។ អរគុណ!'
        : 'Hello seller! I received the account for this order, but login failed due to invalid credentials / wrong password. I have attached the error screenshot below. Please provide a working replacement as per the replacement policy. Thank you!'
    },
    {
      title: isKhmer ? 'ស្នើសុំប្តូរគណនី (ផុតកំណត់មុនកាលកំណត់)' : 'Early Expiration Replacement Request',
      text: isKhmer
        ? 'ជម្រាបសួរ! គណនីរបស់ខ្ញុំបានផុតកំណត់ subscription មុនកាលបរិច្ឆេទធានា។ សូមអ្នកលក់ជួយប្តូរគណនីថ្មី ឬ renew កញ្ចប់សេវាកម្មជូនខ្ញុំផង។'
        : 'Hello! My subscription has expired prematurely before the end of the guaranteed duration. Please provide a new replacement account or renew the plan under the active warranty policy.'
    },
    {
      title: isKhmer ? 'សួរនាំពីគោលការណ៍ប្តូរទំនិញ' : 'Inquiry on Replacement Policy',
      text: isKhmer
        ? 'ជម្រាបសួរ! តើផលិតផលនេះមានការធានាប្តូរថ្មី (1-to-1 Replacement) រយៈពេលប៉ុន្មានដែរ? ប្រសិនបើមានបញ្ហា តើខ្ញុំត្រូវផ្ញើភស្តុតាងអ្វីខ្លះ?'
        : 'Hello! Could you please clarify the replacement policy and warranty duration for this product? What proof is needed if any login issue happens?'
    }
  ];

  const sellerTemplates = [
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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 10px 24px'
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="policy-modal-card"
        style={{
          background: 'var(--card-bg, #FFFFFF)',
          color: 'var(--text, #0F172A)',
          borderRadius: 24,
          width: '100%',
          maxWidth: 720,
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--border, #E2E8F0)',
          overflow: 'hidden',
          animation: 'modalPop 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          margin: 'auto'
        }}
      >
        <style>{`
          @keyframes modalPop {
            0% { opacity: 0; transform: scale(0.95) translateY(10px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
          }
          .policy-tabs-wrapper {
            position: relative;
            border-bottom: 1px solid var(--border, #E2E8F0);
            background: var(--bg-secondary, #F8FAFC);
          }
          .policy-tabs-bar {
            display: flex;
            background: transparent;
            overflow-x: auto;
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
            -webkit-overflow-scrolling: touch;
            padding: 0 4px;
          }
          .policy-tabs-bar::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          .tab-scroll-arrow {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            z-index: 10;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background: var(--card-bg, #FFFFFF);
            border: 1px solid var(--border, #CBD5E1);
            color: #4F46E5;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
            transition: all 0.15s ease;
          }
          .tab-scroll-arrow:hover {
            background: #4F46E5;
            color: #FFFFFF;
          }
          .tab-scroll-arrow.left {
            left: 6px;
          }
          .tab-scroll-arrow.right {
            right: 6px;
          }
          .policy-tab-btn {
            flex: 1;
            padding: 12px 12px;
            font-size: 0.82rem;
            font-weight: 700;
            border: none;
            background: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            color: var(--text-light, #64748B);
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
            white-space: nowrap;
            flex-shrink: 0;
          }
          .policy-tab-btn.active {
            color: #4F46E5;
            border-bottom-color: #4F46E5;
            background: rgba(79, 70, 229, 0.05);
          }
          .policy-box {
            background: var(--bg-secondary, #F8FAFC);
            border: 1px solid var(--border, #E2E8F0);
            border-radius: 14px;
            padding: 16px;
            margin-bottom: 14px;
            word-break: break-word;
            overflow-wrap: break-word;
          }
          .policy-subtab-btn {
            padding: 7px 14px;
            border-radius: 10px;
            border: 1px solid var(--border, #E2E8F0);
            background: var(--card-bg, #FFFFFF);
            font-size: 0.8rem;
            font-weight: 700;
            color: var(--text-light, #64748B);
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all 0.15s;
            flex-shrink: 0;
          }
          .policy-subtab-btn.active {
            background: #4F46E5;
            color: #FFFFFF;
            border-color: #4F46E5;
            box-shadow: 0 2px 8px rgba(79, 70, 229, 0.25);
          }
          .template-card {
            background: var(--card-bg, #FFFFFF);
            border: 1px solid var(--border, #E2E8F0);
            border-radius: 12px;
            padding: 14px;
            margin-bottom: 12px;
            word-break: break-word;
            overflow-wrap: break-word;
          }
          .template-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            flex-wrap: wrap;
            gap: 6px;
          }
          @media (max-width: 640px) {
            .policy-modal-card {
              max-height: 86vh !important;
              border-radius: 18px !important;
            }
            .policy-modal-header {
              padding: 12px 14px !important;
            }
            .policy-modal-content {
              padding: 14px 12px !important;
            }
            .policy-tab-btn {
              padding: 10px 10px !important;
              font-size: 0.76rem !important;
            }
            .policy-subtab-btn {
              padding: 6px 10px !important;
              font-size: 0.74rem !important;
            }
            .policy-box {
              padding: 12px !important;
            }
            .template-card {
              padding: 10px !important;
            }
            .template-card-header {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 6px !important;
            }
            .policy-modal-footer {
              padding: 10px 14px !important;
            }
            .policy-modal-footer button {
              width: 100% !important;
            }
          }
        `}</style>

        {/* Header */}
        <div
          className="policy-modal-header"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(79,70,229,0.06), rgba(16,185,129,0.06))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #4F46E5, #06B6D4)',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
              flexShrink: 0
            }}>
              <FiShield size={19} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text, #0F172A)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {isKhmer ? 'គោលការណ៍ប្តូរ & សងប្រាក់វិញ' : 'Return & Replacement Policy'}
              </h3>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-light, #64748B)', display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <MdVerified size={13} color="#10B981" style={{ flexShrink: 0 }} />
                <span>{isKhmer ? 'ការធានាការពារអ្នកទិញ និងអ្នកលក់ ១០០%' : '100% Buyer & Seller Protection Guarantee'}</span>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-light, #94A3B8)',
              padding: 6,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Navigation Tabs with Auto-scroll and Edge Arrows */}
        <div className="policy-tabs-wrapper">
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollTabs('left')}
              className="tab-scroll-arrow left"
              aria-label="Scroll left"
            >
              <FiChevronLeft size={16} />
            </button>
          )}

          <div
            ref={tabsContainerRef}
            onScroll={checkTabScroll}
            className="policy-tabs-bar"
          >
            {[
              { key: 'overview', icon: FiShield, label: isKhmer ? 'ទិដ្ឋភាពទូទៅ' : 'Overview' },
              { key: 'replacement', icon: FiRefreshCw, label: isKhmer ? 'គោលការណ៍ប្តូរទំនិញ' : 'Replacement Policy' },
              { key: 'refund', icon: FiDollarSign, label: isKhmer ? 'គោលការណ៍សងប្រាក់' : 'Return & Refund' },
              { key: 'dispute', icon: FiHelpCircle, label: isKhmer ? 'ដំណើរការវិវាទ' : 'Dispute Process' }
            ].map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  ref={(el) => (tabRefs.current[t.key] = el)}
                  className={`policy-tab-btn ${activeTab === t.key ? 'active' : ''}`}
                  onClick={() => handleTabChange(t.key)}
                >
                  <Icon size={14} style={{ flexShrink: 0 }} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollTabs('right')}
              className="tab-scroll-arrow right"
              aria-label="Scroll right"
            >
              <FiChevronRight size={16} />
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="policy-modal-content" style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, fontSize: '0.88rem', lineHeight: 1.6 }}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              <div style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.06))',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 16,
                padding: '16px 18px',
                marginBottom: 16
              }}>
                <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.98rem', display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <FiCheckCircle size={18} style={{ marginTop: 3, flexShrink: 0 }} />
                  <span style={{ lineHeight: 1.4 }}>{isKhmer ? 'ប្រព័ន្ធការពារ និងទូទាត់ Escrow សុវត្ថិភាព' : 'Escrow Payment & Protection for Both Sides'}</span>
                </div>
                <p style={{ margin: 0, color: '#065F46', fontSize: '0.84rem', lineHeight: 1.6 }}>
                  {isKhmer
                    ? 'រាល់ការទិញនៅលើវេទិការបស់យើង ប្រាក់របស់អ្នកនឹងត្រូវបានរក្សាទុកដោយសុវត្ថិភាពក្នុងប្រព័ន្ធ Escrow។ ប្រាក់នឹងមិនត្រូវបានផ្ទេរទៅកាន់អ្នកលក់ឡើយ រហូតទាល់តែអ្នកបានទទួលគណនី និងចុចបញ្ជាក់ថាទំនិញដំណើរការត្រឹមត្រូវ ឬអស់រយៈពេល ៤៨ ម៉ោងដោយគ្មានបណ្ដឹង។'
                    : 'All payments on our platform are held safely in escrow. The seller only receives payment after you have received your product and confirmed that everything works, or after the 48-hour auto-release timer expires with no disputes.'}
                </p>
              </div>

              <div className="policy-box">
                <div style={{ fontWeight: 800, marginBottom: 8, color: 'var(--text, #0F172A)' }}>
                  {isKhmer ? 'តើអ្នកគួរធ្វើដូចម្តេចនៅពេលជួបបញ្ហា?' : 'What should you do if there is an issue?'}
                </div>
                <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-light, #475569)', fontSize: '0.84rem' }}>
                  <li style={{ marginBottom: 6 }}>
                    {isKhmer
                      ? 'កុំទាន់ចុច "Confirm Received" ប្រសិនបើទំនិញមិនទាន់ដំណើរការ។'
                      : 'Do not click "Confirm Received" if the product is not working properly.'}
                  </li>
                  <li style={{ marginBottom: 6 }}>
                    {isKhmer
                      ? 'ទាក់ទងអ្នកលក់ក្នុង Chat ឬចុចប៊ូតុង "Report Issue" (រាយការណ៍បញ្ហា) លើទំព័រ Order Details របស់អ្នក។'
                      : 'Message seller in chat or click "Report Issue" on your Order Details page.'}
                  </li>
                  <li style={{ marginBottom: 6 }}>
                    {isKhmer
                      ? 'ជ្រើសរើសប្រភេទបញ្ហា ថតរូបភស្តុតាង និងជ្រើសរើសប្តូរទំនិញថ្មី (Replacement) ឬសងប្រាក់ (Refund)។'
                      : 'Select issue category, upload evidence screenshots, and choose Replacement or Refund.'}
                  </li>
                  <li>
                    {isKhmer
                      ? 'អ្នកលក់មានកាតព្វកិច្ចផ្តល់ទំនិញប្តូរថ្មីភ្លាមៗ។ ប្រសិនបើមិនចុះសម្រុង Admin នឹងធ្វើអន្តរាគមន៍ដោះស្រាយភ្លាមៗ។'
                      : 'Seller is obligated to deliver a replacement. If unresolved, Admin will mediate and issue a decision.'}
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: REPLACEMENT POLICY (ENHANCED FOR USER & SELLER) */}
          {activeTab === 'replacement' && (
            <div>
              {/* Replace Policy Highlight Banner */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(79,70,229,0.1), rgba(99,102,241,0.05))',
                border: '1px solid rgba(79,70,229,0.3)',
                borderRadius: 16,
                padding: '16px 18px',
                marginBottom: 16
              }}>
                <div style={{ fontWeight: 800, color: '#4338CA', fontSize: '0.98rem', display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <FiRefreshCw size={17} style={{ marginTop: 3, flexShrink: 0 }} />
                  <span style={{ lineHeight: 1.4 }}>{isKhmer ? 'គោលការណ៍ធានាប្តូរទំនិញថ្មី ១ ជំនួស ១ (1-to-1 Replacement Policy)' : '100% 1-to-1 Replacement Policy (Fast Exchange)'}</span>
                </div>
                <p style={{ margin: 0, color: '#3730A3', fontSize: '0.84rem', lineHeight: 1.6 }}>
                  {isKhmer
                    ? 'ប្រសិនបើគណនី ឬលេខកូដដែលបានទទួលមិនអាចចូលបាន ខុស Password, ជាប់លេខកូដ 2FA ឬផុតកំណត់មុនកាលកំណត់ អ្នកលក់ត្រូវតែផ្តល់គណនីថ្មីជំនួសវិញដោយឥតគិតថ្លៃ ១០០% ស្របតាមកញ្ចប់រយៈពេលដែលបានបញ្ជាទិញ។'
                    : 'If the digital account or voucher delivered is invalid, wrong password, locked, or expires prematurely, the seller is obligated to provide a 100% free 1-to-1 working replacement within the active warranty duration.'}
                </p>
              </div>

              {/* Sub-Tabs: For User vs For Seller vs Message Templates */}
              <div
                ref={subTabsContainerRef}
                style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', overflowX: 'auto', scrollbarWidth: 'none' }}
              >
                <button
                  ref={(el) => (subTabRefs.current['user'] = el)}
                  className={`policy-subtab-btn ${replaceSubTab === 'user' ? 'active' : ''}`}
                  onClick={() => handleSubTabChange('user')}
                >
                  <FiUser size={13} />
                  <span>{isKhmer ? 'សម្រាប់អ្នកទិញ (User)' : 'For Buyers (Users)'}</span>
                </button>
                <button
                  ref={(el) => (subTabRefs.current['seller'] = el)}
                  className={`policy-subtab-btn ${replaceSubTab === 'seller' ? 'active' : ''}`}
                  onClick={() => handleSubTabChange('seller')}
                >
                  <MdStorefront size={14} />
                  <span>{isKhmer ? 'សម្រាប់អ្នកលក់ (Seller)' : 'For Sellers'}</span>
                </button>
                <button
                  ref={(el) => (subTabRefs.current['templates'] = el)}
                  className={`policy-subtab-btn ${replaceSubTab === 'templates' ? 'active' : ''}`}
                  onClick={() => handleSubTabChange('templates')}
                >
                  <FiMessageSquare size={13} />
                  <span>{isKhmer ? 'សារគំរូទាក់ទង (Templates)' : 'Message Templates'}</span>
                </button>
              </div>

              {/* SUBTAB: FOR USER / BUYER */}
              {replaceSubTab === 'user' && (
                <div className="policy-box">
                  <div style={{ fontWeight: 800, marginBottom: 8, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FiCheckCircle size={16} color="#10B981" />
                    <span>{isKhmer ? 'សិទ្ធិ & លក្ខខណ្ឌប្តូរទំនិញរបស់អ្នកទិញ:' : 'Buyer Rights & Replacement Conditions:'}</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-light, #475569)', fontSize: '0.84rem' }}>
                    <li style={{ marginBottom: 8 }}>
                      <strong>{isKhmer ? 'រយៈពេលធានា (Warranty Duration):' : 'Warranty Duration:'}</strong> {isKhmer ? 'មានសុពលភាពពេញលេញតាមកញ្ចប់ដែលបានទិញ (ឧ. 1 ខែ, 3 ខែ, 6 ខែ, 1 ឆ្នាំ)។' : 'Matches the full duration of your purchased plan variant (e.g. 1 Month, 3 Months, 1 Year).'}
                    </li>
                    <li style={{ marginBottom: 8 }}>
                      <strong>{isKhmer ? 'ករណីទទួលបានការប្តូរថ្មី:' : 'Eligible Replacement Scenarios:'}</strong>
                      <ul style={{ paddingLeft: 18, marginTop: 4 }}>
                        <li>{isKhmer ? 'ពាក្យសម្ងាត់ខុស ឬមិនអាច Login ចូលបាន។' : 'Wrong password or invalid credentials.'}</li>
                        <li>{isKhmer ? 'គណនីផុតកំណត់ Subscription មុនកាលកំណត់។' : 'Account subscription expired before warranty duration.'}</li>
                        <li>{isKhmer ? 'គណនីជាប់ Screen limit / Family group error។' : 'Screen limit reached, household location lock, or invalid invite link.'}</li>
                        <li>{isKhmer ? 'ទទួលបានផលិតផលខុសពីអ្វីដែលបានកុម្ម៉ង់។' : 'Delivered variant differs from purchased order.'}</li>
                      </ul>
                    </li>
                    <li style={{ marginBottom: 8 }}>
                      <strong>{isKhmer ? 'របៀបស្នើសុំប្តូរទំនិញ:' : 'How to Request a Replacement:'}</strong>
                      <ol style={{ paddingLeft: 18, marginTop: 4 }}>
                        <li>{isKhmer ? 'ថតរូប Screenshot បង្ហាញផ្ទាំង Error ឬសារកំហុស។' : 'Take a screenshot of the login error message.'}</li>
                        <li>{isKhmer ? 'ផ្ញើសារទៅកាន់អ្នកលក់ក្នុង Chat ឬចុច "Report Issue" លើទំព័រ Order Details។' : 'Send message to seller in Chat or click "Report Issue" in Order Details.'}</li>
                        <li>{isKhmer ? 'អ្នកលក់នឹងបញ្ជូនគណនីថ្មីមកជំនួសភ្លាមៗ។' : 'Seller delivers the new replacement credentials directly.'}</li>
                      </ol>
                    </li>
                  </ul>
                </div>
              )}

              {/* SUBTAB: FOR SELLER */}
              {replaceSubTab === 'seller' && (
                <div className="policy-box">
                  <div style={{ fontWeight: 800, marginBottom: 8, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FiShield size={16} color="#4F46E5" />
                    <span>{isKhmer ? 'កាតព្វកិច្ច & ទំនួលខុសត្រូវរបស់អ្នកលក់:' : 'Seller Obligations & Replacement Rules:'}</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-light, #475569)', fontSize: '0.84rem' }}>
                    <li style={{ marginBottom: 8 }}>
                      <strong>{isKhmer ? 'កាតព្វកិច្ចធានា (Replacement Obligation):' : 'Mandatory Replacement Guarantee:'}</strong> {isKhmer ? 'អ្នកលក់ត្រូវតែផ្តល់គណនី ឬ License Key ថ្មីដែលមានដំណើរការត្រឹមត្រូវជូនអតិថិជន ប្រសិនបើអតិថិជនរាយការណ៍បញ្ហាក្នុងអំឡុងពេលធានា។' : 'Sellers must provide working replacement credentials or vouchers if buyer reports a valid issue within the warranty timeframe.'}
                    </li>
                    <li style={{ marginBottom: 8 }}>
                      <strong>{isKhmer ? 'រយៈពេលឆ្លើយតប (SLA Response):' : 'SLA & Response Speed:'}</strong> {isKhmer ? 'អ្នកលក់គួរឆ្លើយតប និងដោះស្រាយប្តូរថ្មីក្នុងរយៈពេលលឿនបំផុត (ក្រោម ២៤ ម៉ោង) ដើម្បីរក្សា Rating ផ្កាយ ៥ និងទំនុកចិត្ត។' : 'Sellers should resolve replacement requests promptly (within 24 hours) to maintain top store rating and prevent dispute penalties.'}
                    </li>
                    <li style={{ marginBottom: 8 }}>
                      <strong>{isKhmer ? 'ការបញ្ជូនគណនីថ្មី (Delivery):' : 'Replacement Delivery:'}</strong> {isKhmer ? 'អ្នកលក់អាចបញ្ជូនគណនីថ្មីដោយផ្ទាល់ក្នុងផ្ទាំង Dispute ឬក្នុង Chat ប្រព័ន្ធ។' : 'Replacement accounts can be delivered directly via the Dispute Review modal or in the customer order chat.'}
                    </li>
                    <li>
                      <strong>{isKhmer ? 'ករណីគ្មានស្តុកជំនួស:' : 'Out of Replacement Stock:'}</strong> {isKhmer ? 'ប្រសិនបើអ្នកលក់គ្មានគណនីជំនួស អ្នកលក់ត្រូវយល់ព្រមបង្វិលប្រាក់ (Agree Refund) ជូនអតិថិជនវិញពេញលេញ ១០០%។' : 'If seller runs out of stock, seller must agree to a 100% full refund.'}
                    </li>
                  </ul>
                </div>
              )}

              {/* SUBTAB: MESSAGE TEMPLATES */}
              {replaceSubTab === 'templates' && (
                <div>
                  <div style={{ fontWeight: 800, marginBottom: 12, color: 'var(--text, #0F172A)', fontSize: '0.9rem', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <FiMessageSquare size={16} color="#4F46E5" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ lineHeight: 1.4 }}>{isKhmer ? 'សារគំរូសម្រាប់អ្នកទិញ (Buyer Message Templates):' : 'Buyer Message Templates (1-Click Copy):'}</span>
                  </div>
                  {buyerTemplates.map((tmpl, idx) => (
                    <div key={idx} className="template-card">
                      <div className="template-card-header">
                        <span style={{ fontWeight: 800, fontSize: '0.84rem', color: '#4F46E5', flex: 1, minWidth: 0, lineHeight: 1.4 }}>{tmpl.title}</span>
                        <CopyMessageBtn text={tmpl.text} label={tmpl.title} />
                      </div>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-light, #475569)', background: 'var(--bg-secondary, #F8FAFC)', padding: '10px 12px', borderRadius: 8, lineHeight: 1.5 }}>
                        {tmpl.text}
                      </p>
                    </div>
                  ))}

                  <div style={{ fontWeight: 800, margin: '18px 0 12px', color: 'var(--text, #0F172A)', fontSize: '0.9rem', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <MdStorefront size={18} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ lineHeight: 1.4 }}>{isKhmer ? 'សារគំរូសម្រាប់អ្នកលក់ (Seller Message Templates):' : 'Seller Message Templates (1-Click Copy):'}</span>
                  </div>
                  {sellerTemplates.map((tmpl, idx) => (
                    <div key={idx} className="template-card">
                      <div className="template-card-header">
                        <span style={{ fontWeight: 800, fontSize: '0.84rem', color: '#059669', flex: 1, minWidth: 0, lineHeight: 1.4 }}>{tmpl.title}</span>
                        <CopyMessageBtn text={tmpl.text} label={tmpl.title} />
                      </div>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-light, #475569)', background: 'var(--bg-secondary, #F8FAFC)', padding: '10px 12px', borderRadius: 8, lineHeight: 1.5 }}>
                        {tmpl.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RETURN & REFUND POLICY */}
          {activeTab === 'refund' && (
            <div>
              <div style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(217,119,6,0.05))',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 16,
                padding: '16px 18px',
                marginBottom: 16
              }}>
                <div style={{ fontWeight: 800, color: '#B45309', fontSize: '0.98rem', display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <FiDollarSign size={18} style={{ marginTop: 3, flexShrink: 0 }} />
                  <span style={{ lineHeight: 1.4 }}>{isKhmer ? 'គោលការណ៍សងប្រាក់វិញ' : 'Return & 100% Refund Policy'}</span>
                </div>
                <p style={{ margin: 0, color: '#92400E', fontSize: '0.84rem' }}>
                  {isKhmer
                    ? 'អ្នកមានសិទ្ធិទទួលបានការសងប្រាក់វិញ ១០០% ពេញលេញ ប្រសិនបើអ្នកលក់មិនអាចផ្តល់ទំនិញ ឬមិនមានទំនិញជំនួសជូនអ្នកបាន។'
                    : 'You are entitled to a full 100% refund if the seller is unable to deliver your product or lacks replacement stock.'}
                </p>
              </div>

              <div className="policy-box">
                <div style={{ fontWeight: 800, marginBottom: 8, color: 'var(--text, #0F172A)' }}>
                  {isKhmer ? 'ករណីដែលអ្នកទទួលបានការសងប្រាក់វិញ:' : 'When You Are Eligible for a Full Refund:'}
                </div>
                <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-light, #475569)', fontSize: '0.84rem' }}>
                  <li style={{ marginBottom: 6 }}>
                    {isKhmer ? 'អ្នកលក់មិនបានដឹកជញ្ជូនទំនិញ។' : 'Order not delivered or received from the seller.'}
                  </li>
                  <li style={{ marginBottom: 6 }}>
                    {isKhmer ? 'ទំនិញខុសពីការបញ្ជាទិញ ហើយអ្នកលក់គ្មានទំនិញត្រូវជំនួស។' : 'Wrong product delivered and seller has no matching replacement.'}
                  </li>
                  <li style={{ marginBottom: 6 }}>
                    {isKhmer ? 'គណនីមានបញ្ហា ហើយអ្នកលក់មិនឆ្លើយតប ឬមិនអាចដោះស្រាយបាន។' : 'Account has issues and seller does not respond or cannot fix it.'}
                  </li>
                  <li>
                    {isKhmer ? 'ការសម្រេចពី Admin Mediation គាំទ្រអ្នកទិញ។' : 'Admin Mediation investigation concludes in buyer\'s favor.'}
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: DISPUTE & MEDIATION PROCESS */}
          {activeTab === 'dispute' && (
            <div>
              <div style={{ fontWeight: 800, marginBottom: 14, color: 'var(--text, #0F172A)' }}>
                {isKhmer ? 'ដំណាក់កាលនៃដំណើរការដោះស្រាយវិវាទ:' : 'Dispute & Mediation Steps:'}
              </div>

              {[
                {
                  step: '1',
                  title: isKhmer ? 'រាយការណ៍បញ្ហា' : 'Buyer Reports Issue',
                  desc: isKhmer ? 'អ្នកទិញជ្រើសរើសប្រភេទបញ្ហា ភ្ជាប់រូបភាពភស្តុតាង និងបញ្ជាក់ដំណោះស្រាយដែលចង់បាន។' : 'Buyer selects issue type, attaches evidence screenshots, and states desired resolution.'
                },
                {
                  step: '2',
                  title: isKhmer ? 'ការឆ្លើយតបរបស់អ្នកលក់' : 'Seller Reviews & Responds',
                  desc: isKhmer ? 'អ្នកលក់អាចយល់ព្រមប្តូរទំនិញថ្មី, យល់ព្រមសងប្រាក់ ឬបដិសេធដើម្បីបញ្ជូនទៅ Admin។' : 'Seller can agree to provide Replacement, agree to Refund, or escalate to Admin Mediation.'
                },
                {
                  step: '3',
                  title: isKhmer ? 'អន្តរាគមន៍ពី Admin' : 'Admin Mediation & Investigation',
                  desc: isKhmer ? 'ប្រសិនបើមិនមានការព្រមព្រៀង Admin នឹងពិនិត្យភស្តុតាងទាំងសងខាង និងចេញសេចក្តីសម្រេចជាស្ថាពរ (Refund ឬ Complete)។' : 'If disputed, Admin investigates chat logs and screenshots to make a final binding decision.'
                }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 14, marginBottom: 14, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#4F46E5',
                    color: '#FFF',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2
                  }}>
                    {item.step}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--text, #0F172A)', marginBottom: 2 }}>{item.title}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-light, #64748B)' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="policy-modal-footer"
          style={{
            padding: '14px 22px',
            borderTop: '1px solid var(--border, #E2E8F0)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'var(--bg-secondary, #F8FAFC)'
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '9px 24px',
              borderRadius: 12,
              border: 'none',
              background: '#4F46E5',
              color: '#FFF',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(79,70,229,0.3)'
            }}
          >
            {isKhmer ? 'យល់ព្រម' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicyModal;
