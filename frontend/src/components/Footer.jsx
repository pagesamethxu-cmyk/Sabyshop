import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiGithub, FiTwitter, FiInstagram, FiMail, FiShield, FiLock, FiX, FiChevronRight, FiMessageSquare } from 'react-icons/fi';
import { FaTelegram, FaFacebook } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const telegramUsername = 'saby_shop_support';
  const telegramUrl = `https://t.me/${telegramUsername}`;
  const supportEmail = 'korbsameth.dev@gmail.com';

  return (
    <footer style={{
      backgroundColor: 'var(--card-bg)',
      padding: '50px 0 80px',
      marginTop: 'auto',
      borderTop: '1px solid var(--border)'
    }}>
      <div className="container">
        {/* Multicolumn Grid */}
        <div className="footer-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '36px',
          marginBottom: '40px'
        }}>
          
          {/* Col 1: Brand Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text)' }}>
                Saby Shop
              </span>
            </Link>

            <p style={{ color: 'var(--text-light)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
              {t('footer.description')}
            </p>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '6px' }}>
              <a
                href="https://web.facebook.com/profile.php?id=61589969357567"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-btn"
                title="Facebook Page"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(24, 119, 242, 0.1)', border: '1px solid rgba(24, 119, 242, 0.25)' }}
              >
                <FaFacebook size={18} color="#1877F2" />
              </a>
              <button
                type="button"
                onClick={() => setIsTelegramModalOpen(true)}
                className="social-icon-btn"
                title="Telegram Options"
                style={{ border: 'none', cursor: 'pointer', background: 'rgba(0, 136, 204, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <FaTelegram size={18} color="#0088cc" />
              </button>
              <a href={`mailto:${supportEmail}`} className="social-icon-btn" title={`Email Support: ${supportEmail}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiMail size={18} color="var(--primary)" />
              </a>
              <a href="https://web.facebook.com/profile.php?id=61589969357567" target="_blank" rel="noopener noreferrer" className="social-icon-btn" title="Instagram" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiInstagram size={18} color="var(--text-light)" />
              </a>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text)', marginBottom: '16px' }}>
              {t('footer.quickNav')}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
              <li><Link to="/" className="footer-link">{t('footer.homePage')}</Link></li>
              <li><Link to="/how-to-buy" className="footer-link">{t('nav.howToBuy')}</Link></li>
              <li><Link to="/about" className="footer-link">{t('footer.aboutUs')}</Link></li>
              <li><Link to="/contact" className="footer-link">{t('footer.contactSupport')}</Link></li>
            </ul>
          </div>

          {/* Col 3: Legal & Trust */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text)', marginBottom: '16px' }}>
              {t('footer.legalTrust')}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
              <li><Link to="/privacy" className="footer-link">{t('footer.privacyPolicy')}</Link></li>
              <li><Link to="/terms" className="footer-link">{t('footer.termsOfService')}</Link></li>
              <li><span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-light)' }}><FiShield size={14} color="var(--success)" /> {t('footer.verifiedSecurity')}</span></li>
              <li><span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-light)' }}><FiLock size={14} color="var(--secondary)" /> {t('footer.encryptedSSL')}</span></li>
            </ul>
          </div>

          {/* Col 4: Support */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text)', marginBottom: '16px' }}>
              {t('footer.officialTelegram')}
            </h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-light)', lineHeight: 1.6, marginBottom: '12px' }}>
              {t('footer.telegramDesc')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a
                href="https://t.me/saby_shop_ceo"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', gap: '6px', justifyContent: 'center' }}
              >
                <FaTelegram size={16} /> {t('footer.telegramChannel')}
              </a>
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm"
                style={{ display: 'inline-flex', gap: '6px', color: '#0088cc', borderColor: '#0088cc', justifyContent: 'center' }}
              >
                <FaTelegram size={16} /> {t('nav.telegramSupport')}
              </a>
            </div>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div style={{
          borderTop: '1px solid var(--border-light)',
          paddingTop: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '0.85rem',
          color: 'var(--text-lighter)'
        }}>
          <div>
            © {new Date().getFullYear()} SABY SHOP. {t('footer.copyright').replace('© {year} SABY SHOP. ', '')}
          </div>
          <div>
            {t('footer.builtWith')} {t('footer.forShopping')}
          </div>
        </div>

      </div>

      {/* Telegram Options Selection Modal */}
      {isTelegramModalOpen && (
        <div
          onClick={() => setIsTelegramModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.68)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '420px',
              backgroundColor: 'var(--card-bg, #ffffff)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              border: '1px solid var(--border)'
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsTelegramModalOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'var(--bg-secondary, #f1f5f9)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-light)',
                transition: 'all 0.2s ease'
              }}
              aria-label="Close"
            >
              <FiX size={18} />
            </button>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2AABEE 0%, #229ED9 100%)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                marginBottom: '12px',
                boxShadow: '0 6px 16px rgba(42, 171, 238, 0.35)'
              }}>
                <FaTelegram size={30} />
              </div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)' }}>
                {t('telegramModal.title')}
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-light)' }}>
                {t('telegramModal.subtitle')}
              </p>
            </div>

            {/* Options List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Option 1: Channel */}
              <a
                href="https://t.me/saby_shop_ceo"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsTelegramModalOpen(false)}
                className="telegram-option-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: 'var(--bg-secondary, #f8fafc)',
                  border: '1px solid var(--border-light, #e2e8f0)',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: '42px', height: '42px', borderRadius: '12px',
                  background: 'rgba(0, 136, 204, 0.12)', color: '#0088cc',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <FaTelegram size={22} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text)' }}>
                    {t('telegramModal.channelTitle')}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '2px' }}>
                    {t('telegramModal.channelDesc')}
                  </div>
                </div>
                <FiChevronRight size={18} color="var(--text-light)" />
              </a>

              {/* Option 2: Support Bot */}
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsTelegramModalOpen(false)}
                className="telegram-option-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: 'var(--bg-secondary, #f8fafc)',
                  border: '1px solid var(--border-light, #e2e8f0)',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: '42px', height: '42px', borderRadius: '12px',
                  background: 'rgba(34, 158, 217, 0.12)', color: '#229ED9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <FiMessageSquare size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text)' }}>
                    {t('telegramModal.supportTitle')}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '2px' }}>
                    {t('telegramModal.supportDesc')}
                  </div>
                </div>
                <FiChevronRight size={18} color="var(--text-light)" />
              </a>
            </div>

          </div>
        </div>
      )}

      <style>{`
        .footer-link {
          color: var(--text-light);
          transition: var(--transition);
          font-weight: 500;
        }
        .footer-link:hover {
          color: var(--primary);
        }
        .social-icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: var(--bg-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition);
          border: 1px solid var(--border);
        }
        .social-icon-btn:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-sm);
          background: var(--card-bg) !important;
        }
        .telegram-option-card:hover {
          border-color: #0088cc !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 136, 204, 0.12);
        }
        @media (max-width: 768px) {
          .footer-grid {
            gap: 24px !important;
            grid-template-columns: 1fr !important;
            margin-bottom: 24px !important;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;
