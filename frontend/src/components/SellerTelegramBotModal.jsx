import React, { useState } from 'react';
import { FiX, FiCopy, FiCheck, FiCheckCircle, FiExternalLink, FiInfo, FiShield } from 'react-icons/fi';
import { FaTelegram } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';

export default function SellerTelegramBotModal({ isOpen, onClose, profile, user }) {
  const { isKhmer } = useLanguage();
  const [copiedField, setCopiedField] = useState(null);

  if (!isOpen) return null;

  const storeId = profile?.id || user?.id || '';
  const email = profile?.email || user?.email || '';
  const isConnected = Boolean(profile?.telegramConnected || profile?.telegramChatId);

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedField(fieldName);
    toast.success(isKhmer ? 'បានចម្លងជោគជ័យ!' : 'Copied to clipboard!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--border, #CBD5E1)',
          borderRadius: 24,
          maxWidth: 540,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          padding: '24px',
          fontFamily: "'Battambang', 'Kantumruy Pro', 'Inter', sans-serif"
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #0088cc 0%, #29b6f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 14px rgba(0, 136, 204, 0.35)'
            }}>
              <FaTelegram size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: 'var(--text, #0F172A)' }}>
                {isKhmer ? 'តភ្ជាប់ Telegram Bot សម្រាប់ការជូនដំណឹង' : 'Telegram Order Notification Bot'}
              </h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-lighter, #64748B)' }}>
                Bot: @sabyshop_notication_bot
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-secondary, #F1F5F9)',
              border: 'none',
              borderRadius: '50%',
              width: 34,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-light, #64748B)'
            }}
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Status Badge Banner */}
        <div style={{
          background: isConnected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
          border: isConnected ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 14,
          padding: '10px 14px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: isConnected ? '#10B981' : '#F59E0B',
              display: 'inline-block'
            }} />
            <span style={{ fontSize: '0.84rem', fontWeight: 800, color: isConnected ? '#065F46' : '#B45309' }}>
              {isConnected
                ? (isKhmer ? '[CONNECTED] បានតភ្ជាប់ជាមួយ Telegram រួចរាល់' : '[CONNECTED] Linked & Active')
                : (isKhmer ? '[NOT CONNECTED] មិនទាន់បានតភ្ជាប់' : '[NOT CONNECTED] Pending Connection')}
            </span>
          </div>
          {isConnected && (
            <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700 }}>
              {isKhmer ? 'ជូនដំណឹងស្វ័យប្រវត្តិ' : 'Auto Notifications ON'}
            </span>
          )}
        </div>

        {/* Credentials Box */}
        <div style={{
          background: 'var(--bg-secondary, #F8FAFC)',
          border: '1px solid var(--border, #E2E8F0)',
          borderRadius: 16,
          padding: '16px',
          marginBottom: 16,
          display: 'grid',
          gap: 12
        }}>
          <div style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text, #0F172A)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {isKhmer ? 'ព័ត៌មានផ្ទៀងផ្ទាត់ក្នុង Telegram Bot' : 'Verification Credentials for Telegram Bot'}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.86rem' }}>
            <span style={{ color: 'var(--text-light, #64748B)', fontWeight: 600 }}>
              {isKhmer ? 'លេខសម្គាល់ហាង (Store ID):' : 'Store ID:'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 900, color: '#0088cc', fontSize: '0.95rem' }}>
                #{storeId || '—'}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(storeId, 'storeId')}
                style={{
                  background: copiedField === 'storeId' ? '#ECFDF5' : '#FFFFFF',
                  border: '1px solid var(--border, #CBD5E1)',
                  borderRadius: 8,
                  padding: '4px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: copiedField === 'storeId' ? '#059669' : '#334155'
                }}
              >
                {copiedField === 'storeId' ? <FiCheck size={12} /> : <FiCopy size={12} />}
                <span>{copiedField === 'storeId' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.86rem' }}>
            <span style={{ color: 'var(--text-light, #64748B)', fontWeight: 600 }}>
              {isKhmer ? 'អ៊ីមែលគណនី (Email):' : 'Account Email:'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 800, color: 'var(--text, #0F172A)' }}>
                {email || '—'}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(email, 'email')}
                style={{
                  background: copiedField === 'email' ? '#ECFDF5' : '#FFFFFF',
                  border: '1px solid var(--border, #CBD5E1)',
                  borderRadius: 8,
                  padding: '4px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: copiedField === 'email' ? '#059669' : '#334155'
                }}
              >
                {copiedField === 'email' ? <FiCheck size={12} /> : <FiCopy size={12} />}
                <span>{copiedField === 'email' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '0.86rem' }}>
            <span style={{ color: 'var(--text-light, #64748B)', fontWeight: 600 }}>
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

        {/* 3 Step Instructions */}
        <div style={{
          background: 'rgba(0, 136, 204, 0.05)',
          border: '1px solid rgba(0, 136, 204, 0.2)',
          borderRadius: 16,
          padding: '14px 16px',
          marginBottom: 20,
          fontSize: '0.82rem',
          color: 'var(--text, #1E293B)',
          lineHeight: 1.55
        }}>
          <div style={{ fontWeight: 800, color: '#0088cc', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiInfo size={15} />
            <span>{isKhmer ? 'របៀបតភ្ជាប់ក្នុង Telegram Bot (៣ ជំហានងាយៗ):' : 'How to Connect in Telegram Bot (3 Easy Steps):'}</span>
          </div>
          <div style={{ marginBottom: 6 }}>
            <strong>1.</strong> {isKhmer ? 'ចុចប៊ូតុង "បើក Telegram Bot" ហើយចុច Start (/start)' : 'Click "Open Telegram Bot" below and send /start'}
          </div>
          <div style={{ marginBottom: 6 }}>
            <strong>2.</strong> {isKhmer ? 'ជ្រើសរើសប៊ូតុង "[2] Connect Notification Website to Bot"' : 'Select "[2] Connect Notification Website to Bot"'}
          </div>
          <div>
            <strong>3.</strong> {isKhmer ? `បញ្ចូល Email, Password និង Store ID (#${storeId}) របស់អ្នក` : `Enter your Email, Password, and Store ID (#${storeId})`}
          </div>
        </div>

        {/* Features Received on Telegram */}
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--border, #E2E8F0)',
          borderRadius: 14,
          padding: '12px 14px',
          marginBottom: 20,
          fontSize: '0.78rem',
          color: 'var(--text-light, #475569)'
        }}>
          <div style={{ fontWeight: 800, color: 'var(--text, #0F172A)', marginBottom: 6 }}>
            {isKhmer ? 'ព័ត៌មានដែលអ្នកទទួលបានតាម Telegram៖' : 'Notification details you will receive on Telegram:'}
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.5 }}>
            <li>{isKhmer ? 'ឈ្មោះអតិថិជន និងអ៊ីមែល' : 'Customer Name & Email'}</li>
            <li>{isKhmer ? 'ឈ្មោះផលិតផល និងប្រភេទ' : 'Product Name & Product Type'}</li>
            <li>{isKhmer ? 'តម្លៃ និងរយៈពេល (Duration)' : 'Price & Duration (e.g. 1 Month, Lifetime)'}</li>
            <li>{isKhmer ? 'លេខបញ្ជាទិញ (Order ID) និងកាលបរិច្ឆេទ' : 'Order ID & Date'}</li>
            <li>{isKhmer ? 'សារជូនដំណឹងពី Admin' : 'Official Announcements from Platform Admin'}</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
          <a
            href="https://t.me/sabyshop_notication_bot"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 18px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, #0088cc 0%, #29b6f6 100%)',
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 900,
              fontSize: '0.88rem',
              boxShadow: '0 4px 14px rgba(0, 136, 204, 0.35)'
            }}
          >
            <FaTelegram size={18} />
            <span>{isKhmer ? 'បើក Telegram Bot' : 'Open Telegram Bot'}</span>
            <FiExternalLink size={14} />
          </a>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '12px 18px',
              borderRadius: 14,
              background: 'var(--bg-secondary, #F1F5F9)',
              border: '1px solid var(--border, #CBD5E1)',
              color: 'var(--text, #334155)',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            {isKhmer ? 'បិទ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
