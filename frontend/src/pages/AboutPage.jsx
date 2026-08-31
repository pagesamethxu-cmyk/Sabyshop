import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { FiZap, FiShield, FiHeart, FiHeadphones, FiCheckCircle, FiSmile } from 'react-icons/fi';
import { FaTelegram } from 'react-icons/fa';

const AboutPage = () => {
  const { t } = useLanguage();
  const telegramUsername = 'saby_shop_support';
  const telegramUrl = `https://t.me/${telegramUsername}`;

  // Phone-only responsive styles (≤639px), desktop is untouched
  const mobileStyles = `
    @media (max-width: 639px) {
      .about-page-wrap {
        padding: 24px 0 40px !important;
      }
      .about-hero {
        padding: 36px 20px !important;
        margin-bottom: 32px !important;
      }
      .about-hero h1 {
        font-size: 1.7rem !important;
        margin-bottom: 12px !important;
      }
      .about-hero p {
        font-size: 0.95rem !important;
        margin-bottom: 18px !important;
      }
      .about-why {
        margin-bottom: 32px !important;
      }
      .about-why h2 {
        font-size: 1.35rem !important;
        margin-bottom: 20px !important;
      }
      .about-features-grid {
        grid-template-columns: 1fr !important;
        gap: 14px !important;
      }
      .about-features-grid .card {
        padding: 22px !important;
      }
      .about-mission {
        padding: 24px !important;
      }
      .about-mission h2 {
        font-size: 1.2rem !important;
      }
      .about-mission > p {
        font-size: 0.95rem !important;
      }
      .about-mission ul {
        grid-template-columns: 1fr !important;
      }
    }
  `;

  return (
    <>
      <style>{mobileStyles}</style>
      <div className="animate-fade-in about-page-wrap" style={{ padding: '40px 0 60px' }}>
      <div className="container">
        
        {/* Hero Section */}
        <div className="about-hero" style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '60px 30px',
          color: 'white',
          textAlign: 'center',
          marginBottom: '50px',
          boxShadow: 'var(--shadow-hover)'
        }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '15px' }}>
            {t('about.title')}
          </h1>
          <p style={{ fontSize: '1.15rem', maxWidth: '700px', margin: '0 auto 25px', opacity: 0.95, lineHeight: 1.6 }}>
            {t('about.desc')}
          </p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/store" className="btn" style={{ background: 'white', color: 'var(--primary)', fontWeight: 800 }}>
              {t('about.exploreProducts')}
            </Link>
            <a 
              href={telegramUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn" 
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', fontWeight: 700 }}
            >
              <FaTelegram size={18} /> {t('about.telegramSupport')}
            </a>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="about-why" style={{ marginBottom: '60px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text)', marginBottom: '35px' }}>
            {t('about.whyChoose')}
          </h2>

          <div className="grid grid-3 about-features-grid" style={{ gap: '25px' }}>
            
            <div className="card" style={{ padding: '30px', textAlign: 'center', borderRadius: 'var(--radius)' }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '50%', background: 'var(--primary-light)',
                color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.8rem', margin: '0 auto 20px'
              }}>
                <FiZap />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '10px' }}>{t('about.instantTitle')}</h3>
              <p style={{ color: 'var(--text-light)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                {t('about.instantDesc')}
              </p>
            </div>

            <div className="card" style={{ padding: '30px', textAlign: 'center', borderRadius: 'var(--radius)' }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '50%', background: 'var(--secondary-light)',
                color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.8rem', margin: '0 auto 20px'
              }}>
                <FiShield />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '10px' }}>{t('about.verifiedTitle')}</h3>
              <p style={{ color: 'var(--text-light)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                {t('about.verifiedDesc')}
              </p>
            </div>

            <div className="card" style={{ padding: '30px', textAlign: 'center', borderRadius: 'var(--radius)' }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '50%', background: '#E0F2FE',
                color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.8rem', margin: '0 auto 20px'
              }}>
                <FiHeadphones />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '10px' }}>{t('about.telegramTitle')}</h3>
              <p style={{ color: 'var(--text-light)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '16px' }}>
                {t('about.telegramDesc')}
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <a
                  href="https://t.me/saby_shop_ceo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}
                >
                  <FaTelegram size={16} /> {t('about.joinChannel')}
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* Mission Statement */}
        <div className="card about-mission" style={{ padding: '40px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
            <FiSmile size={32} color="var(--primary)" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>{t('about.missionTitle')}</h2>
          </div>
          <p style={{ color: 'var(--text-light)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '15px' }}>
            {t('about.missionDesc')}
          </p>
          <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', listStyle: 'none', padding: 0 }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)', fontWeight: 600 }}>
              <FiCheckCircle color="var(--success)" /> {t('about.missionPoint1')}
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)', fontWeight: 600 }}>
              <FiCheckCircle color="var(--success)" /> {t('about.missionPoint2')}
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)', fontWeight: 600 }}>
              <FiCheckCircle color="var(--success)" /> {t('about.missionPoint3')}
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)', fontWeight: 600 }}>
              <FiCheckCircle color="var(--success)" /> {t('about.missionPoint4')}
            </li>
          </ul>
        </div>

      </div>
    </div>
    </>
  );
};

export default AboutPage;
