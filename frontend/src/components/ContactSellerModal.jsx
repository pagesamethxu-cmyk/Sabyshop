import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMessageSquare, FiX, FiExternalLink, FiCheckCircle, FiShield } from 'react-icons/fi';
import { FaTelegram } from 'react-icons/fa';
import { MdStorefront, MdVerified } from 'react-icons/md';
import { useLanguage } from '../context/LanguageContext';

/**
 * ContactSellerModal
 * Allows buyers to choose how they wish to contact a seller:
 * 1. Website In-app Chat (Direct thread)
 * 2. Telegram Personal Account
 * 3. Telegram Channel / Community Group
 */
const ContactSellerModal = ({
  isOpen,
  onClose,
  seller,
  productId,
  productName
}) => {
  const navigate = useNavigate();
  const { isKhmer } = useLanguage();

  if (!isOpen) return null;

  const storeName = seller?.storeName || seller?.sellerStoreName || seller?.name || 'Seller Store';
  const storeLogo = seller?.storeLogoUrl || seller?.sellerStoreLogoUrl || seller?.avatarUrl || '';
  const rawTelegramUser = seller?.telegramUsername || seller?.sellerTelegramUsername || '';
  const cleanTelegramUser = rawTelegramUser.replace(/^@/, '').trim();
  const telegramPersonalUrl = cleanTelegramUser
    ? `https://t.me/${cleanTelegramUser}`
    : 'https://t.me/saby_shop_support';

  const rawTelegramChannel = seller?.telegramChannel || seller?.sellerTelegramChannel || '';
  let telegramChannelUrl = 'https://t.me/saby_shop_ceo';
  if (rawTelegramChannel) {
    const trimmed = rawTelegramChannel.trim();
    telegramChannelUrl = trimmed.startsWith('http') ? trimmed : `https://t.me/${trimmed.replace(/^@/, '')}`;
  }

  const preferredMethod = (seller?.preferredContactMethod || seller?.sellerPreferredContactMethod || 'ALL').toUpperCase();

  const handleWebsiteChat = () => {
    onClose();
    if (seller?.id || seller?.sellerId) {
      const sellerId = seller.id || seller.sellerId;
      const query = productId ? `?sellerId=${sellerId}&productId=${productId}` : `?sellerId=${sellerId}`;
      navigate(`/chat/user-seller${query}`);
    } else {
      navigate('/chat/user-seller');
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal animate-slide-up"
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'var(--card-bg, #ffffff)',
          borderRadius: '24px',
          padding: '24px 20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          border: '1px solid var(--border)',
          overflow: 'hidden'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
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

        {/* Store Header Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', paddingRight: '28px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: storeLogo ? `url(${storeLogo}) center/cover` : 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0,
              border: '1.5px solid var(--border)',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
            }}
          >
            {!storeLogo && <MdStorefront size={28} />}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {storeName}
              </h3>
              <MdVerified size={17} color="#38bdf8" />
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: 700 }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                {isKhmer ? 'អនឡាញ · ឆ្លើយតបរហ័ស' : 'Online · Fast Response'}
              </span>
              {productName && (
                <span style={{ color: 'var(--text-lighter)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                  • {productName}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {isKhmer ? 'ជ្រើសរើសវិធីទាក់ទងអ្នកលក់' : 'Choose Contact Method'}
        </div>

        {/* Contact Options List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
          
          {/* OPTION 1: Website In-App Chat */}
          <button
            type="button"
            onClick={handleWebsiteChat}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px 16px',
              borderRadius: '16px',
              background: preferredMethod === 'WEBSITE' ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-secondary, #f8fafc)',
              border: preferredMethod === 'WEBSITE' ? '1.5px solid #6366F1' : '1px solid var(--border-light, #e2e8f0)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
            className="contact-method-card"
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}
            >
              <FiMessageSquare size={22} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text)' }}>
                  {isKhmer ? 'ជជែកក្នុងវេបសាយ (In-App Chat)' : 'Chat on Website (In-App)'}
                </span>
                {preferredMethod === 'WEBSITE' && (
                  <span style={{ background: '#EEF2FF', color: '#4F46E5', fontSize: '0.68rem', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', border: '1px solid #C7D2FE' }}>
                    {isKhmer ? 'ណែនាំ' : 'Recommended'}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-light)', marginTop: '2px' }}>
                {isKhmer ? 'ជជែកផ្ទាល់ក្នុងប្រព័ន្ធ Saby Shop ដោយសុវត្ថិភាព' : 'Direct, safe messaging within Saby Shop'}
              </div>
            </div>
            <FiExternalLink size={16} color="var(--text-light)" />
          </button>

          {/* OPTION 2: Telegram Personal Account */}
          <a
            href={telegramPersonalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px 16px',
              borderRadius: '16px',
              background: preferredMethod === 'TELEGRAM_PERSONAL' ? 'rgba(0, 136, 204, 0.08)' : 'var(--bg-secondary, #f8fafc)',
              border: preferredMethod === 'TELEGRAM_PERSONAL' ? '1.5px solid #0088cc' : '1px solid var(--border-light, #e2e8f0)',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
            className="contact-method-card"
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2AABEE 0%, #229ED9 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(42, 171, 238, 0.3)'
              }}
            >
              <FaTelegram size={24} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text)' }}>
                  {isKhmer ? 'គណនី Telegram ផ្ទាល់ខ្លួន' : 'Telegram Personal Chat'}
                </span>
                {preferredMethod === 'TELEGRAM_PERSONAL' && (
                  <span style={{ background: 'rgba(0,136,204,0.1)', color: '#0088cc', fontSize: '0.68rem', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(0,136,204,0.3)' }}>
                    {isKhmer ? 'ណែនាំ' : 'Recommended'}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#0088cc', marginTop: '2px', fontWeight: 700 }}>
                {cleanTelegramUser ? `@${cleanTelegramUser}` : '@saby_shop_support'}
              </div>
            </div>
            <FiExternalLink size={16} color="#0088cc" />
          </a>

          {/* OPTION 3: Telegram Channel / Group */}
          <a
            href={telegramChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px 16px',
              borderRadius: '16px',
              background: preferredMethod === 'TELEGRAM_CHANNEL' ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-secondary, #f8fafc)',
              border: preferredMethod === 'TELEGRAM_CHANNEL' ? '1.5px solid #10B981' : '1px solid var(--border-light, #e2e8f0)',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
            className="contact-method-card"
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              <FaTelegram size={24} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text)' }}>
                  {isKhmer ? 'ឆានែល Telegram របស់ហាង' : 'Store Telegram Channel'}
                </span>
                {preferredMethod === 'TELEGRAM_CHANNEL' && (
                  <span style={{ background: '#ECFDF5', color: '#059669', fontSize: '0.68rem', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', border: '1px solid #A7F3D0' }}>
                    {isKhmer ? 'ណែនាំ' : 'Recommended'}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-light)', marginTop: '2px' }}>
                {isKhmer ? 'ទទួលដំណឹងប្រូម៉ូសិន និងការបញ្ចូលស្តុករបស់ហាង' : 'Stock drops, discounts, & store updates'}
              </div>
            </div>
            <FiExternalLink size={16} color="var(--text-light)" />
          </a>

        </div>

        {/* Footer Guarantee Note */}
        <div
          style={{
            padding: '10px 14px',
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.74rem',
            color: 'var(--text-light)'
          }}
        >
          <FiShield size={16} color="#10b981" style={{ flexShrink: 0 }} />
          <span>
            {isKhmer
              ? 'រាល់ការទិញ និងជជែកទាំងអស់ត្រូវបានការពារដោយការធានារបស់ Saby Shop'
              : 'All transactions and chats are protected by Saby Shop Warranty'}
          </span>
        </div>

        <style>{`
          .contact-method-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
            border-color: #6366f1 !important;
          }
        `}</style>
      </div>
    </div>
  );
};

export default ContactSellerModal;
