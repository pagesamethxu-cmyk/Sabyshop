import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  FiShield, FiRefreshCw, FiClock, FiPackage,
  FiCheckCircle, FiChevronRight, FiChevronLeft, FiX,
  FiMessageSquare, FiCopy, FiCheck
} from 'react-icons/fi';
import { MdStorefront, MdVerified } from 'react-icons/md';
import toast from 'react-hot-toast';

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

const SellerPolicyWalkthroughModal = ({ isOpen, onClose, onComplete }) => {
  const { isKhmer } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    if (onComplete) onComplete();
    if (onClose) onClose();
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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '14px 10px 24px'
      }}
    >
      <div
        className="seller-walkthrough-card"
        style={{
          background: 'var(--card-bg, #FFFFFF)',
          color: 'var(--text, #0F172A)',
          borderRadius: 24,
          width: '100%',
          maxWidth: 620,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--border, #E2E8F0)',
          overflow: 'hidden',
          animation: 'modalSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          margin: 'auto'
        }}
      >
        <style>{`
          @keyframes modalSlideIn {
            0% { opacity: 0; transform: scale(0.96) translateY(12px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
          }
          .seller-policy-box {
            background: var(--bg-secondary, #F8FAFC);
            border: 1px solid var(--border, #E2E8F0);
            border-radius: 14px;
            padding: 16px;
            margin-bottom: 12px;
            word-break: break-word;
            overflow-wrap: break-word;
          }
          .step-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--border, #CBD5E1);
            transition: all 0.2s ease;
            cursor: pointer;
          }
          .step-dot.active {
            width: 24px;
            border-radius: 12px;
            background: #4F46E5;
          }
          @media (max-width: 640px) {
            .seller-walkthrough-card {
              max-height: 92vh !important;
              border-radius: 18px !important;
            }
            .seller-walkthrough-header {
              padding: 14px 16px !important;
            }
            .seller-walkthrough-content {
              padding: 16px 14px !important;
            }
            .seller-walkthrough-footer {
              padding: 12px 14px !important;
            }
            .seller-policy-box {
              padding: 12px !important;
            }
          }
        `}</style>

        {/* Header */}
        <div
          className="seller-walkthrough-header"
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(79,70,229,0.08), rgba(16,185,129,0.06))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #4F46E5, #06B6D4)',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
              flexShrink: 0
            }}>
              <MdStorefront size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{
                  background: '#4F46E5',
                  color: '#FFF',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 99,
                  letterSpacing: 0.3
                }}>
                  {isKhmer ? `ទំព័រ ${currentStep} នៃ ${totalSteps}` : `Step ${currentStep} of ${totalSteps}`}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <MdVerified size={13} />
                  {isKhmer ? 'សម្រាប់អ្នកលក់ (Seller Guide)' : 'Seller Replacement Guide'}
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text, #0F172A)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {isKhmer ? 'គោលការណ៍ប្តូរទំនិញសម្រាប់អ្នកលក់' : 'Seller 1-to-1 Replacement Policy'}
              </h3>
            </div>
          </div>
          <button
            type="button"
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

        {/* Progress Bar */}
        <div style={{ width: '100%', height: 3, background: 'var(--border, #E2E8F0)' }}>
          <div style={{
            width: `${(currentStep / totalSteps) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #4F46E5, #10B981)',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }} />
        </div>

        {/* Content Body */}
        <div
          className="seller-walkthrough-content"
          style={{
            padding: '20px 22px',
            overflowY: 'auto',
            flex: 1,
            fontSize: '0.88rem',
            lineHeight: 1.6
          }}
        >
          {/* PAGE 1: MANDATORY 1-TO-1 REPLACEMENT */}
          {currentStep === 1 && (
            <div>
              <div style={{
                background: 'linear-gradient(135deg, rgba(79,70,229,0.1), rgba(99,102,241,0.05))',
                border: '1px solid rgba(79,70,229,0.3)',
                borderRadius: 16,
                padding: '16px 18px',
                marginBottom: 16
              }}>
                <div style={{ fontWeight: 800, color: '#4338CA', fontSize: '0.98rem', display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <FiRefreshCw size={18} style={{ marginTop: 3, flexShrink: 0 }} />
                  <span style={{ lineHeight: 1.4 }}>
                    {isKhmer
                      ? '១. កាតព្វកិច្ចធានាប្តូរទំនិញថ្មី ១ ជំនួស ១ (1-to-1 Replacement)'
                      : '1. Mandatory 1-to-1 Replacement Guarantee'}
                  </span>
                </div>
                <p style={{ margin: 0, color: '#3730A3', fontSize: '0.84rem', lineHeight: 1.6 }}>
                  {isKhmer
                    ? 'ក្នុងនាមជាអ្នកលក់នៅលើ Saby Shop លោកអ្នកមានកាតព្វកិច្ចផ្តល់គណនី ឬ License Key ថ្មីដែលមានដំណើរការត្រឹមត្រូវជូនអតិថិជន ប្រសិនបើអតិថិជនរាយការណ៍បញ្ហាក្នុងអំឡុងពេលធានា។'
                    : 'As an authorized seller on Saby Shop, you are strictly obligated to deliver 100% working replacement credentials if a customer encounters issues during the active warranty period.'}
                </p>
              </div>

              <div className="seller-policy-box">
                <div style={{ fontWeight: 800, marginBottom: 8, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiShield size={16} color="#4F46E5" />
                  <span>{isKhmer ? 'ករណីដែលអ្នកលក់ត្រូវតែប្តូរថ្មីជូនអតិថិជន៖' : 'Mandatory Replacement Scenarios:'}</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-light, #475569)', fontSize: '0.84rem' }}>
                  <li style={{ marginBottom: 6 }}>
                    <strong>{isKhmer ? 'ខុស Password / Login Error:' : 'Wrong Password or Login Error:'}</strong> {isKhmer ? 'គណនីមិនអាចចូលប្រើប្រាស់បាន។' : 'Customer cannot log in with provided credentials.'}
                  </li>
                  <li style={{ marginBottom: 6 }}>
                    <strong>{isKhmer ? 'ផុតកំណត់ Subscription មុនកាលកំណត់:' : 'Early Subscription Expiry:'}</strong> {isKhmer ? 'កញ្ចប់សេវាផុតកំណត់មុនរយៈពេលដែលបានទិញ (ឧ. ទិញ 1 ខែ តែប្រើបាន 10 ថ្ងៃ)។' : 'Subscription expires before the warranty duration ends.'}
                  </li>
                  <li style={{ marginBottom: 6 }}>
                    <strong>{isKhmer ? 'ជាប់ Screen Limit / Family Invite Error:' : 'Screen Limit or Household Lock:'}</strong> {isKhmer ? 'ជាប់បញ្ហាកំណត់ចំនួនអេក្រង់ ឬ Invite link មិនដំណើរការ។' : 'Household location locks, screen limits, or broken invite links.'}
                  </li>
                  <li>
                    <strong>{isKhmer ? 'ផលិតផលខុសពីការបញ្ជាទិញ:' : 'Mismatched Variant:'}</strong> {isKhmer ? 'ប្រគល់ខុសកញ្ចប់ ឬខុសប្រភេទដែលបានបញ្ជាទិញ។' : 'Delivered credentials differ from the purchased plan variant.'}
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* PAGE 2: 24-HOUR SLA & ESCROW SAFETY */}
          {currentStep === 2 && (
            <div>
              <div style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.06))',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 16,
                padding: '16px 18px',
                marginBottom: 16
              }}>
                <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.98rem', display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <FiClock size={18} style={{ marginTop: 3, flexShrink: 0 }} />
                  <span style={{ lineHeight: 1.4 }}>
                    {isKhmer
                      ? '២. រយៈពេលឆ្លើយតប & ការទូទាត់ប្រព័ន្ធ Escrow សុវត្ថិភាព'
                      : '2. 24-Hour Response SLA & Safe Escrow Protection'}
                  </span>
                </div>
                <p style={{ margin: 0, color: '#065F46', fontSize: '0.84rem', lineHeight: 1.6 }}>
                  {isKhmer
                    ? 'រាល់ការបញ្ជាទិញ ប្រាក់ត្រូវបានរក្សាទុកដោយសុវត្ថិភាពក្នុងប្រព័ន្ធ Escrow។ ប្រាក់នឹងត្រូវបានផ្ទេរចូលកាបូបរបស់អ្នកលក់បន្ទាប់ពីអតិថិជនបានទទួលទំនិញដំណើរការត្រឹមត្រូវ ឬអស់រយៈពេល ៤៨ ម៉ោងដោយគ្មានបណ្ដឹង។'
                    : 'Customer payments are held safely in escrow. Funds are released to your seller balance once the customer confirms delivery or after 48 hours pass with no active disputes.'}
                </p>
              </div>

              <div className="seller-policy-box">
                <div style={{ fontWeight: 800, marginBottom: 8, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiCheckCircle size={16} color="#10B981" />
                  <span>{isKhmer ? 'ក្បួនរក្សា Rating ផ្កាយ ៥ និងទំនុកចិត្តខ្ពស់៖' : 'Best Practices for 5-Star Seller Rating:'}</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-light, #475569)', fontSize: '0.84rem' }}>
                  <li style={{ marginBottom: 6 }}>
                    <strong>{isKhmer ? 'ឆ្លើយតបលឿន (ក្រោម ២៤ ម៉ោង):' : 'Fast Response (Under 24 Hours):'}</strong> {isKhmer ? 'ជួយដោះស្រាយ និងប្តូរគណនីថ្មីជូនអតិថិជនឱ្យបានរហ័ស។' : 'Resolve replacement requests swiftly to maintain high store ratings.'}
                  </li>
                  <li style={{ marginBottom: 6 }}>
                    <strong>{isKhmer ? 'ពិនិត្យភស្តុតាង Screenshot:' : 'Verify Error Screenshots:'}</strong> {isKhmer ? 'ស្នើសុំអតិថិជនផ្ញើរូបភាពផ្ទាំង Error មុននឹងប្រគល់គណនីថ្មីជំនួស។' : 'Ask customers for clear login error screenshots before issuing replacement.'}
                  </li>
                  <li>
                    <strong>{isKhmer ? 'ជៀសវាងការ Dispute ទៅ Admin:' : 'Prevent Admin Disputes:'}</strong> {isKhmer ? 'ការដោះស្រាយដោយរួសរាយជាមួយអតិថិជននឹងជួយឱ្យហាងរបស់អ្នកទទួលបាន Review ល្អៗជានិច្ច។' : 'Friendly and prompt service guarantees positive customer reviews and prevents store penalties.'}
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* PAGE 3: DELIVERY & REFUND OBLIGATION */}
          {currentStep === 3 && (
            <div>
              <div style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(217,119,6,0.05))',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 16,
                padding: '16px 18px',
                marginBottom: 16
              }}>
                <div style={{ fontWeight: 800, color: '#B45309', fontSize: '0.98rem', display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <FiPackage size={18} style={{ marginTop: 3, flexShrink: 0 }} />
                  <span style={{ lineHeight: 1.4 }}>
                    {isKhmer
                      ? '៣. របៀបប្រគល់គណនីប្តូរថ្មី & ករណីគ្មានស្តុក'
                      : '3. Replacement Delivery & Out-of-Stock Refund Rules'}
                  </span>
                </div>
                <p style={{ margin: 0, color: '#92400E', fontSize: '0.84rem', lineHeight: 1.6 }}>
                  {isKhmer
                    ? 'លោកអ្នកអាចបញ្ជូនព័ត៌មានគណនីថ្មីដោយផ្ទាល់តាមរយៈផ្ទាំង Dispute Review ឬក្នុង Customer Chat Inbox ដោយសុវត្ថិភាព។'
                    : 'You can deliver new replacement credentials directly via the Dispute Review popup or inside the Customer Chat inbox.'}
                </p>
              </div>

              <div className="seller-policy-box">
                <div style={{ fontWeight: 800, marginBottom: 8, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiShield size={16} color="#F59E0B" />
                  <span>{isKhmer ? 'កាតព្វកិច្ចនៅពេលគ្មានស្តុកជំនួស (Out of Stock):' : 'Out of Replacement Stock Obligations:'}</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-light, #475569)', fontSize: '0.84rem' }}>
                  <li style={{ marginBottom: 6 }}>
                    {isKhmer
                      ? 'ប្រសិនបើហាងរបស់អ្នកអស់ស្តុក ឬមិនអាចរកគណនីជំនួសបាន អ្នកលក់ត្រូវចុចយល់ព្រមបង្វិលប្រាក់ (Agree Refund) ជូនអតិថិជនវិញពេញលេញ ១០០%។'
                      : 'If you run out of stock and cannot supply a working replacement, you must agree to a 100% full refund for the buyer.'}
                  </li>
                  <li style={{ marginBottom: 6 }}>
                    {isKhmer
                      ? 'ហាមដាច់ខាតមិនឱ្យគេចវេះ ឬមិនឆ្លើយតបសារអតិថិជន។'
                      : 'Never ignore customer complaints or leave issues unaddressed.'}
                  </li>
                  <li>
                    {isKhmer
                      ? 'ប្រសិនបើមានវិវាទមិនចុះសម្រុង Admin នឹងត្រួតពិនិត្យភស្តុតាង និងចេញសេចក្តីសម្រេចជាស្ថាពរ។'
                      : 'If a dispute cannot be resolved directly, Admin Mediation will investigate chat evidence and issue a final binding ruling.'}
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* PAGE 4: READY-MADE CANNED MESSAGES & AGREEMENT */}
          {currentStep === 4 && (
            <div>
              <div style={{ fontWeight: 800, marginBottom: 10, color: 'var(--text, #0F172A)', fontSize: '0.9rem', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <FiMessageSquare size={16} color="#4F46E5" style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ lineHeight: 1.4 }}>
                  {isKhmer
                    ? '៤. សារគំរូរួចជាស្រេចសម្រាប់អ្នកលក់ (1-Click Canned Replies):'
                    : '4. Ready-Made Seller Canned Message Templates:'}
                </span>
              </div>

              {sellerCannedMessages.map((tmpl, idx) => (
                <div key={idx} className="seller-policy-box" style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#059669' }}>{tmpl.title}</span>
                    <CopyBtn text={tmpl.text} />
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-light, #475569)', background: 'var(--card-bg, #FFFFFF)', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #E2E8F0)', lineHeight: 1.5 }}>
                    {tmpl.text}
                  </p>
                </div>
              ))}

              {/* Agreement Checkbox */}
              <div
                onClick={() => setAgreed(!agreed)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: agreed ? 'rgba(16,185,129,0.08)' : 'var(--bg-secondary, #F8FAFC)',
                  border: agreed ? '1.5px solid #10B981' : '1px solid var(--border, #E2E8F0)',
                  cursor: 'pointer',
                  marginTop: 14,
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  border: agreed ? '2px solid #10B981' : '2px solid var(--border, #94A3B8)',
                  background: agreed ? '#10B981' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFF',
                  flexShrink: 0
                }}>
                  {agreed && <FiCheck size={14} />}
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: agreed ? '#065F46' : 'var(--text, #1E293B)', lineHeight: 1.4 }}>
                  {isKhmer
                    ? 'ខ្ញុំបានយល់ច្បាស់ពីគោលការណ៍ប្តូរទំនិញ និងសន្យាថានឹងផ្តល់ការធានា ១ ជំនួស ១ ជូនអតិថិជនឱ្យបានត្រឹមត្រូវ។'
                    : 'I understand the Replace Policy and commit to honoring the 1-to-1 replacement guarantee for my customers.'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div
          className="seller-walkthrough-footer"
          style={{
            padding: '14px 22px',
            borderTop: '1px solid var(--border, #E2E8F0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-secondary, #F8FAFC)',
            gap: 10,
            flexWrap: 'wrap'
          }}
        >
          {/* Step Dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {[1, 2, 3, 4].map((stepNum) => (
              <div
                key={stepNum}
                onClick={() => setCurrentStep(stepNum)}
                className={`step-dot ${currentStep === stepNum ? 'active' : ''}`}
                title={`Go to step ${stepNum}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                style={{
                  padding: '9px 16px',
                  borderRadius: 12,
                  border: '1px solid var(--border, #CBD5E1)',
                  background: 'var(--card-bg, #FFFFFF)',
                  color: 'var(--text, #1E293B)',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <FiChevronLeft size={16} />
                <span>{isKhmer ? 'ថយក្រោយ' : 'Back'}</span>
              </button>
            )}

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
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
                <span>{isKhmer ? 'បន្តបន្ទាប់' : 'Next'}</span>
                <FiChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                style={{
                  padding: '9px 20px',
                  borderRadius: 12,
                  border: 'none',
                  background: agreed ? '#10B981' : '#4F46E5',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: agreed ? '0 4px 12px rgba(16,185,129,0.3)' : '0 4px 12px rgba(79,70,229,0.3)'
                }}
              >
                <FiCheckCircle size={16} />
                <span>{isKhmer ? 'យល់ព្រម & បញ្ចប់' : 'Accept & Complete'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerPolicyWalkthroughModal;
