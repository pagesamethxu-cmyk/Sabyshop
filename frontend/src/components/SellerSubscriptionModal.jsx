import React, { useState } from 'react';
import { FiCheckCircle, FiStar, FiZap, FiX, FiShield, FiPercent } from 'react-icons/fi';
import { MdStorefront, MdAutoAwesome } from 'react-icons/md';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';

export default function SellerSubscriptionModal({ isOpen, onClose, currentPlan = 'PLAN_1', remainingDays = 30, onSelectPlan }) {
  const { isKhmer } = useLanguage();
  const [selectedPlanKey, setSelectedPlanKey] = useState(currentPlan || 'PLAN_1');

  if (!isOpen) return null;

  const isDiscountEligible = remainingDays > 0 && remainingDays <= 7;

  const plans = [
    {
      id: 'PLAN_1',
      name: isKhmer ? 'កញ្ចប់ Starter' : 'Starter Plan',
      regularPrice: 2.50,
      discountPrice: 0.75,
      popular: false,
      badge: isKhmer ? 'កញ្ចប់សន្សំសំចៃ' : 'STARTER',
      color: '#10B981',
      fees: isKhmer ? [
        'ទាបជាង $15: +$0.25',
        'ចាប់ពី $30 ឡើង: +$2.00',
      ] : [
        'Under $15: +$0.25 fee',
        '$30 and above: +$2.00 fee',
      ],
      features: isKhmer ? [
        'ដាក់លក់បានរហូតដល់ 10 មុខទំនិញ',
        'ប្រព័ន្ធផ្ញើទំនិញស្វ័យប្រវត្តិ (Auto-Delivery)',
        'ផ្ញើសារផ្ទាល់ជាមួយអតិថិជន',
        'ផ្ទាំងគ្រប់គ្រងការលក់ស្តង់ដារ'
      ] : [
        'Up to 10 Active Product Listings',
        'Standard Auto-Delivery System',
        'Customer Chat Direct Messaging',
        'Standard Seller Dashboard'
      ]
    },
    {
      id: 'PLAN_2',
      name: isKhmer ? 'កញ្ចប់អាជីព + AI ជំនួយការ' : 'Pro Plan + AI Assistant',
      regularPrice: 4.50,
      discountPrice: 1.35,
      popular: true,
      badge: isKhmer ? 'ពេញនិយម' : 'Popular',
      color: '#EC4899',
      fees: isKhmer ? [
        'ទាបជាង $15: +$0.25',
        'ចាប់ពី $30 ឡើង: +$2.00',
      ] : [
        'Under $15: +$0.25 fee',
        '$30 and above: +$2.00 fee',
      ],
      features: isKhmer ? [
        'រួមបញ្ចូលលក្ខណៈសម្បត្តិទាំងអស់នៃកញ្ចប់មូលដ្ឋាន',
        'AI ឆ្លើយតបសារអតិថិជន 24/7 ស្វ័យប្រវត្តិ',
        'AI ណែនាំផលិតផល និងផ្ញើសារជូនដំណឹងពេលមានស្តុកថ្មី'
      ] : [
        'Everything in Basic Plan',
        'AI 24/7 Customer Auto-Reply',
        'AI Smart Stock & New Product Alert Suggestions'
      ]
    },
    {
      id: 'PLAN_3',
      name: isKhmer ? 'កញ្ចប់ VIP + ជម្រុញហាងលើគេ 7ថ្ងៃ' : 'VIP Plan + Top Store Boost 7D',
      regularPrice: 6.00,
      discountPrice: 1.80,
      popular: false,
      badge: isKhmer ? 'VIP លើគេ' : 'VIP Top Boost',
      color: '#8B5CF6',
      fees: isKhmer ? [
        'ទាបជាង $15: +$0.25',
        'ចាប់ពី $30 ឡើង: +$2.00',
      ] : [
        'Under $15: +$0.25 fee',
        '$30 and above: +$2.00 fee',
      ],
      features: isKhmer ? [
        'រួមបញ្ចូលលក្ខណៈសម្បត្តិទាំងអស់នៃកញ្ចប់ Pro',
        'AI ណែនាំផលិតផលស្វ័យប្រវត្តិពេលអតិថិជនស្វែងរក',
        'ជម្រុញទីតាំងហាង និងបង្ហាញផលិតផលនៅផ្នែកខាងលើគេរយៈពេល 7 ថ្ងៃ',
        'ការណែនាំបង្ហាញនៅផ្នែកខាងលើនៃហាងសម្រាប់រយៈពេល 7 ថ្ងៃ'
      ] : [
        'Everything in Pro Plan',
        'AI Search & Product Recommendation Engine',
        'Top Store Priority Position (7-Day Boost)',
        'Featured at the top of the store directory for 7 days'
      ]
    }
  ];

  const handleConfirmPlan = (p) => {
    const finalPrice = isDiscountEligible ? p.discountPrice : p.regularPrice;
    if (onSelectPlan) {
      onSelectPlan(p.id, finalPrice);
    } else {
      toast.success(isKhmer ? `បានជ្រើសរើស ${p.name} ($${finalPrice.toFixed(2)}/ខែ)` : `Selected ${p.name} ($${finalPrice.toFixed(2)}/mo)`);
      onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(6px)',
      zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        background: 'var(--card-bg, #ffffff)',
        border: '1px solid var(--border)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '920px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        position: 'relative',
        padding: '24px',
        fontFamily: "'Battambang', 'Kantumruy Pro', 'Inter', sans-serif"
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 18, right: 18,
            background: 'var(--bg-secondary)', border: 'none',
            borderRadius: '50%', width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-light)'
          }}
        >
          <FiX size={20} />
        </button>

        {/* Title & Subtitle */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99, 102, 241, 0.1)', color: '#6366F1', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '4px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 800, marginBottom: 8 }}>
            <MdStorefront size={16} /> {isKhmer ? 'កញ្ចប់សមាជិកភាពហាង' : 'SELLER MEMBERSHIP PLANS'}
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: '1.4rem', fontWeight: 900, color: 'var(--text)' }}>
            {isKhmer ? 'ជ្រើសរើសកញ្ចប់សមាជិកភាពហាង' : 'Seller Subscription Plans'}
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-light)' }}>
            {isKhmer ? 'ដំឡើងកញ្ចប់ដើម្បីទទួលបានមុខងារ AI ឆ្លើយតប និងជម្រុញការលក់នៅលើហាង' : 'Upgrade your plan to unlock AI auto-response and boost store traffic'}
          </p>
        </div>

        {/* 70% Loyalty Discount Alert Banner */}
        {isDiscountEligible ? (
          <div style={{
            background: remainingDays <= 0 ? 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)' : 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
            border: remainingDays <= 0 ? '2px dashed #EF4444' : '2px dashed #F59E0B',
            borderRadius: '16px',
            padding: '14px 18px',
            marginBottom: '22px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: remainingDays <= 0 ? '#991B1B' : '#78350F'
          }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: remainingDays <= 0 ? '#EF4444' : '#F59E0B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 900 }}>
              <FiPercent size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>
                {remainingDays <= 0
                  ? (isKhmer ? 'កញ្ចប់ហាងរបស់អ្នកបានផុតកំណត់ហើយ!' : 'Store Subscription Expired!')
                  : (isKhmer ? 'ទទួលបានការបញ្ចុះតម្លៃពិសេស 70% លើគ្រប់កញ្ចប់!' : '70% Loyalty Upgrade Discount Active!')}
              </div>
              <div style={{ fontSize: '0.8rem', marginTop: 2 }}>
                {remainingDays <= 0
                  ? (isKhmer ? 'សូមជ្រើសរើស ឬទូទាត់បន្តកញ្ចប់សមាជិកភាពហាងខាងក្រោម ដើម្បីបើកដំណើរការហាង និងលក់ទំនិញឡើងវិញ' : 'Please select or renew your store subscription below to reopen your store and resume selling.')
                  : (isKhmer 
                      ? `ដោយសារកញ្ចប់ចាស់របស់អ្នកនៅសល់ត្រឹមតែ ${remainingDays} ថ្ងៃ អ្នកទទួលបានការបញ្ចុះតម្លៃ 70% លើគ្រប់កញ្ចប់ + បូកបន្ថែម ${remainingDays} ថ្ងៃដែលនៅសល់ទៅកញ្ចប់ថ្មី!`
                      : `Since your current plan has ${remainingDays} days remaining, you get 70% OFF all plans + your remaining ${remainingDays} days rollover!`)}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '10px 14px',
            marginBottom: '20px',
            fontSize: '0.8rem',
            color: 'var(--text-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>{isKhmer ? `កញ្ចប់បច្ចុប្បន្ននៅសល់: ` : `Current plan remaining: `}<strong>{remainingDays} {isKhmer ? 'ថ្ងៃ' : 'days'}</strong></span>
            <span style={{ color: '#6366F1', fontWeight: 700 }}>{isKhmer ? 'ទទួលបានបញ្ចុះតម្លៃ 70% ពេលនៅសល់ 7 ថ្ងៃ ឬតិចជាងនេះ' : 'Get 70% discount when 7 days or fewer remaining'}</span>
          </div>
        )}

        {/* Plan Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          marginBottom: '20px'
        }}>
          {plans.map(p => {
            const isCurrent = currentPlan === p.id;
            const activePrice = (isDiscountEligible && p.regularPrice > 0) ? p.discountPrice : p.regularPrice;

            return (
              <div
                key={p.id}
                style={{
                  background: 'var(--card-bg)',
                  border: p.popular ? `2px solid ${p.color}` : '1px solid var(--border)',
                  borderRadius: '20px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  position: 'relative',
                  boxShadow: p.popular ? `0 12px 24px ${p.color}22` : 'var(--shadow-sm)'
                }}
              >
                {isCurrent && (
                  <div style={{
                    position: 'absolute', top: -12, left: 20,
                    background: '#10B981', color: '#fff',
                    padding: '3px 12px', borderRadius: '12px',
                    fontSize: '0.72rem', fontWeight: 900,
                    boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)',
                    display: 'inline-flex', alignItems: 'center', gap: '4px'
                  }}>
                    <FiCheckCircle size={13} /> {isKhmer ? 'កញ្ចប់កំពុងប្រើប្រាស់' : 'Current Plan'}
                  </div>
                )}

                {p.popular && (
                  <div style={{
                    position: 'absolute', top: -12, right: 20,
                    background: p.color, color: '#fff',
                    padding: '2px 12px', borderRadius: '12px',
                    fontSize: '0.72rem', fontWeight: 900,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                  }}>
                    {p.badge}
                  </div>
                )}

                <div>
                  <h3 style={{ margin: '0 0 12px', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>
                    {p.name}
                  </h3>

                  {/* Price Block */}
                  <div style={{ marginBottom: 16 }}>
                    {p.regularPrice === 0 ? (
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ fontSize: '1.75rem', fontWeight: 900, color: p.color }}>
                          $0.00
                        </span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-light)' }}>
                          {isKhmer ? '/ 1 ខែដំបូង' : '/ 1st month'}
                        </span>
                      </div>
                    ) : isDiscountEligible && p.regularPrice > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontSize: '1.75rem', fontWeight: 900, color: p.color }}>
                          ${activePrice.toFixed(2)}
                        </span>
                        <span style={{ fontSize: '0.85rem', textDecoration: 'line-through', color: 'var(--text-lighter)' }}>
                          ${p.regularPrice.toFixed(2)}
                        </span>
                        <span style={{ fontSize: '0.72rem', background: '#DC2626', color: '#fff', padding: '1px 6px', borderRadius: 6, fontWeight: 900 }}>
                          70% OFF
                        </span>
                      </div>
                    ) : (
                      <div style={{ fontSize: '1.75rem', fontWeight: 900, color: p.color }}>
                        ${p.regularPrice.toFixed(2)} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-light)' }}>{isKhmer ? '/ខែ' : '/mo'}</span>
                      </div>
                    )}
                  </div>

                  {/* Transaction Fee Note */}
                  <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', padding: '8px 10px', borderRadius: '10px', fontSize: '0.75rem', marginBottom: 14, color: 'var(--text)' }}>
                    <div style={{ fontWeight: 800, color: '#4F46E5', marginBottom: 2 }}>{isKhmer ? 'កម្រៃសេវាប្រតិបត្តិការ:' : 'Transaction Fees:'}</div>
                    {p.fees.map((f, i) => (
                      <div key={i} style={{ color: 'var(--text-light)' }}>• {f}</div>
                    ))}
                  </div>

                  {/* Feature Checklist */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.78rem', marginBottom: 16 }}>
                    {p.features.map((feat, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, color: 'var(--text)' }}>
                        <FiCheckCircle size={14} color={p.color} style={{ marginTop: 2, flexShrink: 0 }} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  disabled={isCurrent}
                  onClick={() => !isCurrent && handleConfirmPlan(p)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '12px',
                    border: 'none',
                    background: isCurrent ? '#94A3B8' : p.color,
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: isCurrent ? 'not-allowed' : 'pointer',
                    boxShadow: isCurrent ? 'none' : `0 6px 16px ${p.color}40`,
                    transition: 'transform 0.15s ease',
                    opacity: isCurrent ? 0.75 : 1
                  }}
                >
                  {isCurrent
                    ? (isKhmer ? 'កញ្ចប់កំពុងប្រើប្រាស់' : 'Current Plan')
                    : p.regularPrice === 0
                      ? (isKhmer ? 'ចាប់ផ្ដើមឥតគិតថ្លៃ 1 ខែ' : 'Start 1-Month Free')
                      : (isKhmer ? 'ដំឡើងកញ្ចប់នេះ' : 'Upgrade Plan')}
                </button>

                {/* Remaining days continue notice */}
                {!isCurrent && remainingDays > 0 && p.regularPrice > 0 && (
                  <div style={{
                    marginTop: '10px',
                    background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                    border: '1.5px solid #BFDBFE',
                    borderRadius: '10px',
                    padding: '9px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.76rem',
                  }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#1D4ED8', marginBottom: '1px' }}>
                        {isKhmer ? `អ្នកនៅមាន ${remainingDays} ថ្ងៃ — មុខងារថ្មីនឹងដំណើរការភ្លាមៗ!` : `You have ${remainingDays} days left — features unlock instantly!`}
                      </div>
                      <div style={{ color: '#3B82F6', fontWeight: 600 }}>
                        {isKhmer ? `ការរាប់ ${remainingDays} ថ្ងៃដែលនៅសល់នឹងបន្តរហូតដល់ 0 បន្ទាប់មកបន្ត` : `Your ${remainingDays} days will rollover automatically`}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div style={{ textAlign: 'center', fontSize: '0.76rem', color: 'var(--text-lighter)', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          {isKhmer ? '* គ្រប់កញ្ចប់ទាំងអស់រួមបញ្ចូលការទូទាត់តាម ABA PayWay KHQR និងការគាំទ្រ 24/7 ពីក្រុមការងារ Saby Shop' : '* All plans include ABA PayWay KHQR payments and 24/7 support from Saby Shop'}
        </div>
      </div>
    </div>
  );
}

