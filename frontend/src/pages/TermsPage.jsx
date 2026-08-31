import React, { useState } from 'react';
import { FiFileText, FiShield } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import PolicyModal from '../components/PolicyModal';

const TermsPage = () => {
  const { t, lang, isKhmer: ctxIsKhmer } = useLanguage();
  const isKhmer = ctxIsKhmer ?? (lang === 'km');
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  return (
    <div className="animate-fade-in" style={{ padding: 'clamp(20px, 4vw, 40px) 0 60px' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(20px, 4vw, 40px)' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%', background: 'var(--secondary-light)',
            color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', margin: '0 auto 15px'
          }}>
            <FiFileText />
          </div>
          <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2.2rem)', fontWeight: 800, color: 'var(--text)', marginBottom: '10px' }}>
            {t('termsPage.title')}
          </h1>
          <p style={{ color: 'var(--text-light)', fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)' }}>
            {t('termsPage.lastUpdated')}
          </p>
        </div>

        {/* Content Card */}
        <div className="card" style={{ padding: 'clamp(16px, 4vw, 40px)', borderRadius: 'var(--radius-lg)', lineHeight: 1.8, color: 'var(--text)' }}>
          
          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--secondary)', marginBottom: '12px' }}>
              {t('termsPage.sec1Title')}
            </h2>
            <p style={{ color: 'var(--text-light)', fontSize: '1rem' }}>
              {t('termsPage.sec1Desc')}
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--secondary)', marginBottom: '12px' }}>
              {t('termsPage.sec2Title')}
            </h2>
            <p style={{ color: 'var(--text-light)', fontSize: '1rem', marginBottom: '10px' }}>
              {t('termsPage.sec2Desc')}
            </p>
            <ul style={{ paddingLeft: '20px', color: 'var(--text-light)' }}>
              <li>{t('termsPage.sec2Item1')}</li>
              <li>{t('termsPage.sec2Item2')}</li>
              <li>{t('termsPage.sec2Item3')}</li>
            </ul>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: '12px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--secondary)', margin: 0 }}>
                {t('termsPage.sec3Title')}
              </h2>
              <button
                type="button"
                onClick={() => setShowPolicyModal(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 12px', borderRadius: 10,
                  border: '1px solid #4F46E5', background: 'rgba(79,70,229,0.08)',
                  color: '#4F46E5', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
                  maxWidth: '100%', lineHeight: 1.35, wordBreak: 'break-word', textAlign: 'center'
                }}
              >
                <FiShield size={14} style={{ flexShrink: 0 }} />
                <span>{isKhmer ? 'បើកផ្ទាំងគោលការណ៍ប្តូរទំនិញពេញលេញ' : 'Open Complete Replace Policy Modal'}</span>
              </button>
            </div>
            <p style={{ color: 'var(--text-light)', fontSize: '1rem', marginBottom: '10px' }}>
              {t('termsPage.sec3Desc')}
            </p>
            <ul style={{ paddingLeft: '20px', color: 'var(--text-light)' }}>
              <li>
                {t('termsPage.sec3Item1Prefix')}<strong>@saby_shop_support</strong>{t('termsPage.sec3Item1Suffix')}
              </li>
              <li>{t('termsPage.sec3Item2')}</li>
              <li>{t('termsPage.sec3Item3')}</li>
            </ul>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--secondary)', marginBottom: '12px' }}>
              {t('termsPage.sec4Title')}
            </h2>
            <p style={{ color: 'var(--text-light)', fontSize: '1rem' }}>
              {t('termsPage.sec4Desc')}
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--secondary)', marginBottom: '12px' }}>
              {t('termsPage.sec5Title')}
            </h2>
            <p style={{ color: 'var(--text-light)', fontSize: '1rem' }}>
              {t('termsPage.sec5Desc')}
            </p>
          </section>

          <section style={{ marginBottom: '10px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--secondary)', marginBottom: '12px' }}>
              {t('termsPage.sec6Title')}
            </h2>
            <p style={{ color: 'var(--text-light)', fontSize: '1rem' }}>
              {t('termsPage.sec6Desc')} <strong>@saby_shop_support</strong>.
            </p>
          </section>

        </div>

      </div>

      {/* Policy Modal */}
      <PolicyModal
        isOpen={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        initialTab="replacement"
      />
    </div>
  );
};

export default TermsPage;
