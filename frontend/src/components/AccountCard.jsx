import React, { useState } from 'react';
import { FiCopy, FiCheck, FiEye, FiEyeOff, FiPackage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';

const AccountCard = ({ account, product, productName, productImageUrl }) => {
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const handleCopy = (text, fieldLabel) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldLabel);
    toast.success(`${t('accountCard.copied')} ${fieldLabel}!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const prod = product || account?.product || {};
  const rawImg = productImageUrl || prod.imageUrl || prod.image || account?.imageUrl || account?.productImageUrl;
  const name = productName || prod.name || account?.productName || t('product.defaultCategory');

  const defaultNote = t('accountCard.defaultNote');
  const noteValue = account?.note || account?.userNote || account?.label || account?.instructions || defaultNote;

  return (
    <div className="delivered-account-card" style={{ 
      background: '#ffffff', 
      border: '1px solid var(--border)',
      boxShadow: '0 3px 12px rgba(0,0,0,0.04)',
      borderRadius: 'var(--radius, 14px)',
      padding: '16px 18px',
      marginBottom: '14px',
      position: 'relative'
    }}>
      {/* Delivered Badge */}
      <div style={{
        position: 'absolute',
        top: '-10px',
        right: '18px',
        background: 'linear-gradient(135deg, #ff4785, #ec4899)',
        color: 'white',
        padding: '3px 10px',
        borderRadius: '20px',
        fontSize: '0.72rem',
        fontWeight: 800,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        boxShadow: '0 2px 8px rgba(255, 71, 133, 0.3)'
      }}>
        <FiCheck /> {t('accountCard.delivered')}
      </div>

      <div className="delivered-card-body" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        
        {/*  LEFT: Product Image  */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', flexShrink: 0 }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '12px',
            background: '#ffffff',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            fontSize: '1.6rem',
            fontWeight: 800,
            color: 'var(--primary)'
          }}>
            {rawImg ? (
              <img
                src={rawImg}
                alt={name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <span style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {(name || '?')[0]}
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text)', textAlign: 'center', maxWidth: '85px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name}
          </span>
        </div>

        {/*  RIGHT: Email, Password & Note Fields  */}
        <div className="delivered-card-inputs" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.76rem', color: 'var(--text-light)', fontWeight: 700 }}>{t('accountCard.email')}</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                className="input account-input-field" 
                value={account?.email || ''} 
                readOnly 
                style={{ background: 'white', borderColor: 'var(--border)', fontWeight: 600, fontSize: '0.8rem', padding: '7px 10px' }}
              />
              <button 
                className="btn btn-primary account-copy-btn" 
                style={{ padding: '0 12px', flexShrink: 0, height: '36px' }}
                onClick={() => handleCopy(account?.email, t('accountCard.email'))}
                title="Copy Email"
              >
                {copiedField === t('accountCard.email') ? <FiCheck /> : <FiCopy />}
              </button>
            </div>
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.76rem', color: 'var(--text-light)', fontWeight: 700 }}>{t('accountCard.password')}</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                className="input account-input-field" 
                type={showPassword ? 'text' : 'password'}
                value={account?.password || ''} 
                readOnly 
                style={{ background: 'white', borderColor: 'var(--border)', fontWeight: 600, fontSize: '0.8rem', padding: '7px 10px' }}
              />
              <button 
                className="btn btn-outline account-copy-btn" 
                style={{ padding: '0 10px', background: 'white', flexShrink: 0, height: '36px' }}
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide Password' : 'Show Password'}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
              <button 
                className="btn btn-primary account-copy-btn" 
                style={{ padding: '0 12px', flexShrink: 0, height: '36px' }}
                onClick={() => handleCopy(account?.password, t('accountCard.password'))}
                title="Copy Password"
              >
                {copiedField === t('accountCard.password') ? <FiCheck /> : <FiCopy />}
              </button>
            </div>
          </div>

          {/* Note */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.76rem', color: 'var(--text-light)', fontWeight: 700 }}>{t('accountCard.note')}</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                className="input account-input-field" 
                value={noteValue} 
                readOnly 
                style={{ background: 'white', borderColor: 'var(--border)', fontWeight: 500, fontSize: '0.76rem', padding: '7px 10px', color: 'var(--text)' }}
              />
              <button 
                className="btn btn-primary account-copy-btn" 
                style={{ padding: '0 12px', flexShrink: 0, height: '36px' }}
                onClick={() => handleCopy(noteValue, t('accountCard.note'))}
                title="Copy Note"
              >
                {copiedField === t('accountCard.note') ? <FiCheck /> : <FiCopy />}
              </button>
            </div>
          </div>

        </div>

      </div>

      <style>{`
        @media (max-width: 580px) {
          .delivered-card-body {
            flex-direction: row !important;
            align-items: center !important;
            gap: 10px !important;
          }
          .delivered-card-inputs {
            flex: 1 !important;
            min-width: 0 !important;
          }
          .account-input-field {
            font-size: 0.75rem !important;
            padding: 5px 8px !important;
            height: 34px !important;
          }
          .account-copy-btn {
            height: 34px !important;
            padding: 0 8px !important;
            font-size: 0.8rem !important;
          }
          .delivered-card-inputs label {
            font-size: 0.72rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AccountCard;
