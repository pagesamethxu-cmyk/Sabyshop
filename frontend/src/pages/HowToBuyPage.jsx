import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  FiZap, FiShield, FiDollarSign, FiUser, FiShoppingBag, 
  FiFileText, FiCreditCard, FiCheckCircle, FiChevronRight, FiChevronDown, FiHelpCircle
} from 'react-icons/fi';
import { FaTelegram } from 'react-icons/fa';

const HowToBuyPage = () => {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [openFaq, setOpenFaq] = useState(null);

  const telegramUsername = 'saby_shop_support';
  const telegramUrl = `https://t.me/${telegramUsername}`;

  const faqs = [
    { id: 1, q: t('howToBuy.faqQ1'), a: t('howToBuy.faqA1') },
    { id: 2, q: t('howToBuy.faqQ2'), a: t('howToBuy.faqA2') },
    { id: 3, q: t('howToBuy.faqQ3'), a: t('howToBuy.faqA3') },
  ];

  const toggleFaq = (id) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  const pinkPurpleGradient = 'linear-gradient(135deg, #FF2B6D 0%, #7C3AED 100%)';

  return (
    <div className="animate-fade-in how-to-buy-wrap" style={{ padding: '36px 0 60px', background: 'var(--bg, #F8FAFC)', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '960px', margin: '0 auto', padding: '0 16px' }}>

        {/* Page Title & Subtitle */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            {t('howToBuy.title')}
          </h1>
          <p style={{ color: '#64748B', fontSize: '1rem', fontWeight: 500, margin: 0 }}>
            {t('howToBuy.subtitle')}
          </p>
        </div>

        {/* 1. Top Feature Cards (3 Grid with Pink+Purple accents) */}
        <div 
          className="how-feature-grid"
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
            gap: '16px', 
            marginBottom: '28px' 
          }}
        >
          {/* Fast Delivery */}
          <div className="card" style={{ padding: '24px 20px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#FFFFFF', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: pinkPurpleGradient, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: '16px', boxShadow: '0 4px 12px rgba(255, 43, 109, 0.25)' }}>
              <FiZap />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              {t('howToBuy.fastDelivery')}
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
              {t('howToBuy.fastDeliveryDesc')}
            </p>
          </div>

          {/* 100% Warranty */}
          <div className="card" style={{ padding: '24px 20px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#FFFFFF', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: pinkPurpleGradient, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: '16px', boxShadow: '0 4px 12px rgba(255, 43, 109, 0.25)' }}>
              <FiCheckCircle />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              {t('howToBuy.warranty')}
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
              {t('howToBuy.warrantyDesc')}
            </p>
          </div>

          {/* Best Value */}
          <div className="card" style={{ padding: '24px 20px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#FFFFFF', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: pinkPurpleGradient, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: '16px', boxShadow: '0 4px 12px rgba(255, 43, 109, 0.25)' }}>
              <FiDollarSign />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              {t('howToBuy.bestPrice')}
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
              {t('howToBuy.bestPriceDesc')}
            </p>
          </div>
        </div>

        {/* 2. Step Cards List (1 to 5 with Pink+Purple Badges & Buttons) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>

          {/* Step 1 */}
          <div className="card" style={{ padding: '20px 24px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', gap: '16px', alignItems: 'flex-start', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: pinkPurpleGradient, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.95rem', flexShrink: 0, boxShadow: '0 3px 10px rgba(255, 43, 109, 0.25)' }}>
              1
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                {t('howToBuy.step1Title')}
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.6, margin: '0 0 10px 0' }}>
                {t('howToBuy.step1Desc')}
              </p>
              {isAuthenticated ? (
                <div style={{ color: '#16A34A', fontWeight: 800, fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <FiCheckCircle size={16} /> {t('howToBuy.alreadyJoined')}
                </div>
              ) : (
                <Link to="/register" className="btn btn-sm" style={{ background: pinkPurpleGradient, color: '#FFFFFF', fontWeight: 700, borderRadius: '8px', padding: '6px 14px', fontSize: '0.85rem', border: 'none' }}>
                  {t('nav.register')}
                </Link>
              )}
            </div>
          </div>

          {/* Step 2 */}
          <div className="card" style={{ padding: '20px 24px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', gap: '16px', alignItems: 'flex-start', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: pinkPurpleGradient, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.95rem', flexShrink: 0, boxShadow: '0 3px 10px rgba(255, 43, 109, 0.25)' }}>
              2
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                {t('howToBuy.step2Title')}
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.6, margin: '0 0 12px 0' }}>
                {t('howToBuy.step2Desc')}
              </p>
              <Link to="/store" className="btn" style={{ background: pinkPurpleGradient, color: '#FFFFFF', fontWeight: 800, borderRadius: '8px', padding: '8px 18px', fontSize: '0.88rem', border: 'none', boxShadow: '0 4px 14px rgba(255, 43, 109, 0.25)' }}>
                {t('howToBuy.viewProducts')}
              </Link>
            </div>
          </div>

          {/* Step 3 */}
          <div className="card" style={{ padding: '20px 24px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', gap: '16px', alignItems: 'flex-start', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: pinkPurpleGradient, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.95rem', flexShrink: 0, boxShadow: '0 3px 10px rgba(255, 43, 109, 0.25)' }}>
              3
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                {t('howToBuy.step3Title')}
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                {t('howToBuy.step3Desc')}
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="card" style={{ padding: '20px 24px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', gap: '16px', alignItems: 'flex-start', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: pinkPurpleGradient, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.95rem', flexShrink: 0, boxShadow: '0 3px 10px rgba(255, 43, 109, 0.25)' }}>
              4
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                {t('howToBuy.step4Title')}
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                {t('howToBuy.step4Desc')}
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="card" style={{ padding: '20px 24px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', gap: '16px', alignItems: 'flex-start', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: pinkPurpleGradient, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.95rem', flexShrink: 0, boxShadow: '0 3px 10px rgba(255, 43, 109, 0.25)' }}>
              5
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                {t('howToBuy.step5Title')}
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.6, margin: '0 0 12px 0' }}>
                {t('howToBuy.step5Desc')}
              </p>
              <Link to="/orders" className="btn" style={{ background: pinkPurpleGradient, color: '#FFFFFF', fontWeight: 800, borderRadius: '8px', padding: '8px 18px', fontSize: '0.88rem', border: 'none', boxShadow: '0 4px 14px rgba(255, 43, 109, 0.25)' }}>
                {t('howToBuy.orderHistory')}
              </Link>
            </div>
          </div>

        </div>

        {/* 3. FAQ Accordion Section */}
        <div className="card" style={{ padding: '24px 28px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#FFFFFF', marginBottom: '32px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', marginBottom: '18px' }}>
            {t('howToBuy.faqTitle')}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faqs.map(faq => {
              const isOpen = openFaq === faq.id;
              return (
                <div 
                  key={faq.id}
                  style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 0',
                      color: '#FF2B6D',
                      fontWeight: 700,
                      fontSize: '0.95rem'
                    }}
                  >
                    <FiChevronRight size={16} style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0, color: '#7C3AED' }} />
                    <span>{faq.q}</span>
                  </button>

                  {isOpen && (
                    <div style={{ padding: '8px 0 4px 22px', fontSize: '0.88rem', color: '#475569', lineHeight: 1.6 }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Ready to Buy Call to Action Banner (Pink + Purple Gradient) */}
        <div 
          style={{
            background: pinkPurpleGradient,
            borderRadius: '20px',
            padding: '36px 24px',
            textAlign: 'center',
            color: '#FFFFFF',
            boxShadow: '0 8px 30px rgba(255, 43, 109, 0.35)'
          }}
        >
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '20px', letterSpacing: '-0.01em' }}>
            {t('howToBuy.readyTitle')}
          </h2>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link 
              to="/store" 
              className="btn" 
              style={{ background: '#FFFFFF', color: '#FF2B6D', fontWeight: 800, padding: '10px 24px', borderRadius: '12px', fontSize: '0.92rem', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}
            >
              {t('howToBuy.viewProducts')}
            </Link>
            <a 
              href={telegramUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn" 
              style={{ background: '#FFFFFF', color: '#7C3AED', fontWeight: 800, padding: '10px 24px', borderRadius: '12px', fontSize: '0.92rem', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}
            >
              {t('howToBuy.contactSupport')}
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HowToBuyPage;
