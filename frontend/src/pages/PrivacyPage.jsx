import React from 'react';
import { FiLock } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';

const PrivacyPage = () => {
  const { t } = useLanguage();

  return (
    <div className="animate-fade-in" style={{ padding: '40px 0 60px' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%', background: 'var(--primary-light)',
            color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', margin: '0 auto 15px'
          }}>
            <FiLock />
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text)', marginBottom: '10px' }}>
            {t('privacyPage.title')}
          </h1>
          <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>
            {t('privacyPage.lastUpdated')}
          </p>
        </div>

        {/* Content Card */}
        <div className="card" style={{ padding: '40px', borderRadius: 'var(--radius-lg)', lineHeight: 1.8, color: 'var(--text)' }}>
          
          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '12px' }}>
              {t('privacyPage.sec1Title')}
            </h2>
            <p style={{ color: 'var(--text-light)', fontSize: '1rem' }}>
              {t('privacyPage.sec1Desc')}
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '12px' }}>
              {t('privacyPage.sec2Title')}
            </h2>
            <p style={{ color: 'var(--text-light)', fontSize: '1rem', marginBottom: '10px' }}>
              {t('privacyPage.sec2Desc')}
            </p>
            <ul style={{ paddingLeft: '20px', color: 'var(--text-light)' }}>
              <li><strong>{t('privacyPage.sec2Item1Title')}</strong>{t('privacyPage.sec2Item1Desc')}</li>
              <li><strong>{t('privacyPage.sec2Item2Title')}</strong>{t('privacyPage.sec2Item2Desc')}</li>
              <li><strong>{t('privacyPage.sec2Item3Title')}</strong>{t('privacyPage.sec2Item3Desc')}</li>
            </ul>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '12px' }}>
              {t('privacyPage.sec3Title')}
            </h2>
            <p style={{ color: 'var(--text-light)', fontSize: '1rem', marginBottom: '10px' }}>
              {t('privacyPage.sec3Desc')}
            </p>
            <ul style={{ paddingLeft: '20px', color: 'var(--text-light)' }}>
              <li>{t('privacyPage.sec3Item1')}</li>
              <li>{t('privacyPage.sec3Item2')}</li>
              <li>{t('privacyPage.sec3Item3')}</li>
              <li>{t('privacyPage.sec3Item4')}</li>
            </ul>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '12px' }}>
              {t('privacyPage.sec4Title')}
            </h2>
            <p style={{ color: 'var(--text-light)', fontSize: '1rem' }}>
              {t('privacyPage.sec4Desc')}
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '12px' }}>
              {t('privacyPage.sec5Title')}
            </h2>
            <p style={{ color: 'var(--text-light)', fontSize: '1rem' }}>
              {t('privacyPage.sec5Desc')}
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '12px' }}>
              {t('privacyPage.sec6Title')}
            </h2>
            <p style={{ color: 'var(--text-light)', fontSize: '1rem', marginBottom: '10px' }}>
              {t('privacyPage.sec6Desc')}
            </p>
            <ul style={{ paddingLeft: '20px', color: 'var(--text-light)', marginBottom: '10px' }}>
              <li>{t('privacyPage.sec6Item1')}</li>
              <li>{t('privacyPage.sec6Item2')}</li>
              <li>{t('privacyPage.sec6Item3')}</li>
              <li>{t('privacyPage.sec6Item4')}</li>
            </ul>
            <p style={{ color: 'var(--text-light)', fontSize: '1rem' }}>
              {t('privacyPage.sec6Footer')}
            </p>
          </section>

          <section style={{ marginBottom: '10px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '12px' }}>
              {t('privacyPage.sec7Title')}
            </h2>
            <p style={{ color: 'var(--text-light)', fontSize: '1rem' }}>
              {t('privacyPage.sec7Desc')} <strong>@saby_shop_support</strong>.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
};

export default PrivacyPage;
