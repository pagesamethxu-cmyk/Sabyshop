import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaTelegram } from 'react-icons/fa';
import { FiMail, FiSend, FiMessageSquare, FiClock, FiCheckCircle, FiCopy, FiHeadphones } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { contact } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

const ContactPage = () => {
  const { t } = useLanguage();
  const telegramUsername = 'saby_shop_support';
  const telegramUrl = `https://t.me/${telegramUsername}`;
  const supportEmail = 'korbsameth.dev@gmail.com';

  // Phone-only responsive styles (applied via a <style> tag scoped to this page)
  const mobileStyles = `
    @media (max-width: 639px) {
      .contact-grid {
        grid-template-columns: 1fr !important;
        gap: 16px !important;
      }
      .contact-page-wrap {
        padding: 24px 0 40px !important;
      }
      .contact-header {
        margin-bottom: 24px !important;
      }
      .contact-header h1 {
        font-size: 1.6rem !important;
      }
      .contact-header p {
        font-size: 0.95rem !important;
      }
    }
  `;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error(t('contact.fillRequired'));
      return;
    }
    setLoading(true);

    try {
      let sentSuccess = false;

      // 1. Try sending via Backend API (/api/contact)
      try {
        const res = await contact.send(formData);
        if (res && res.data) {
          sentSuccess = true;
        }
      } catch (err) {
        console.warn('Backend /api/contact failed or offline, attempting proxy...', err);
      }

      // 2. Fallback: Try Vite Proxy (/api/resend-direct) to bypass browser CORS
      if (!sentSuccess) {
        const response = await fetch('/api/resend-direct', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'onboarding@resend.dev',
            to: 'korbsameth.dev@gmail.com',
            subject: `[Saby Shop Support] ${formData.subject || 'Order Inquiry / Question'}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #1f2937; line-height: 1.6;">
                <h2 style="color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-top: 0;">
                  New Message from Send Us a Message Form
                </h2>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; width: 130px; color: #4b5563;">Name:</td>
                    <td style="padding: 6px 0; color: #111827;">${formData.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #4b5563;">Sender Email:</td>
                    <td style="padding: 6px 0; color: #111827;"><a href="mailto:${formData.email}">${formData.email}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #4b5563;">Subject:</td>
                    <td style="padding: 6px 0; color: #111827;">${formData.subject || 'N/A'}</td>
                  </tr>
                </table>
                <div style="background-color: #f9fafb; border-left: 4px solid #4f46e5; padding: 15px; border-radius: 4px;">
                  <h4 style="margin: 0 0 10px 0; color: #374151;">Message:</h4>
                  <p style="margin: 0; white-space: pre-wrap; color: #1f2937;">${formData.message}</p>
                </div>
                <p style="margin-top: 25px; font-size: 0.85rem; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 15px;">
                  This email was submitted directly via Saby Shop online store.
                </p>
              </div>
            `
          })
        });

        const data = await response.json();
        if (response.ok && data.id) {
          sentSuccess = true;
        }
      }

      if (sentSuccess) {
        toast.success(t('contact.messageSent'));
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        toast.error(t('contact.failedSend'));
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(t('contact.failedSend'));
    } finally {
      setLoading(false);
    }
  };

  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText(supportEmail);
    toast.success(t('contact.emailCopied'));
  };

  return (
    <>
      <style>{mobileStyles}</style>
      <div className="animate-fade-in contact-page-wrap" style={{ padding: '40px 0 60px' }}>
      <div className="container">
        
        {/* Header */}
        <div className="contact-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text)', marginBottom: '10px' }}>
            {t('contact.title')}
          </h1>
          <p style={{ color: 'var(--text-light)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
            {t('contact.desc')}
          </p>
        </div>

        <div className="grid grid-2 contact-grid" style={{ gap: '30px', alignItems: 'start' }}>
          
          {/* Support Channels & Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Website In-App Live Support Chat Card */}
            <div className="card" style={{
              padding: '24px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              color: 'white',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 8px 25px rgba(99, 102, 241, 0.35)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiHeadphones size={26} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>
                    {t('contact.websiteChatTitle') || 'Live Support Chat'}
                  </h3>
                  <p style={{ opacity: 0.9, fontSize: '0.85rem', margin: '2px 0 0 0' }}>
                    {t('contact.websiteChatDesc') || 'Instant in-app help desk with Admin'}
                  </p>
                </div>
              </div>
              <p style={{ lineHeight: 1.5, marginBottom: '16px', opacity: 0.95, fontSize: '0.88rem' }}>
                {t('contact.websiteChatBody') || 'Chat directly with our support team inside Saby Shop without leaving the website.'}
              </p>
              <Link
                to="/chat/user-admin"
                className="btn"
                style={{
                  background: 'white',
                  color: '#4f46e5',
                  fontWeight: 800,
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.92rem',
                  textDecoration: 'none'
                }}
              >
                <FiMessageSquare size={18} />
                <span>{t('contact.startWebsiteChat') || 'Start Live Chat on Website'}</span>
              </Link>
            </div>

            {/* Telegram Direct Card */}
            <div className="card" style={{
              padding: '24px',
              background: 'linear-gradient(135deg, #0088cc 0%, #00a2ed 100%)',
              color: 'white',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 8px 25px rgba(0, 136, 204, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '12px' }}>
                <FaTelegram size={36} />
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{t('contact.telegramCard')}</h3>
                  <p style={{ opacity: 0.9, fontSize: '0.85rem' }}>{t('contact.telegramCardDesc')}</p>
                </div>
              </div>
              <p style={{ lineHeight: 1.5, marginBottom: '16px', opacity: 0.95, fontSize: '0.88rem' }}>
                {t('contact.telegramCardBody')}
              </p>
              <a 
                href={telegramUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn" 
                style={{
                  background: 'white',
                  color: '#0088cc',
                  fontWeight: 800,
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  fontSize: '0.92rem'
                }}
              >
                <FaTelegram size={18} /> {t('contact.telegramSupportBtn')}
              </a>
            </div>

            {/* Official Telegram Channel Card */}
            <div className="card" style={{
              padding: '24px',
              background: '#ffffff',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '12px' }}>
                <FaTelegram size={36} color="#0088cc" />
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>{t('contact.officialChannel')}</h3>
                  <p style={{ color: '#0088cc', fontSize: '0.85rem', margin: '2px 0 0 0', fontWeight: 700 }}>@saby_shop_ceo</p>
                </div>
              </div>
              <p style={{ lineHeight: 1.5, fontSize: '0.88rem', marginBottom: '16px', color: 'var(--text-light)' }}>
                {t('contact.officialChannelDesc')}
              </p>
              <a 
                href="https://t.me/saby_shop_ceo" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-primary" 
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.92rem',
                  fontWeight: 800
                }}
              >
                <FaTelegram size={18} /> {t('contact.joinChannel')}
              </a>
            </div>


            {/* Quick Contact Info Cards */}
            <div className="card" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                  <FiClock />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 600 }}>{t('contact.responseTime')}</div>
                  <div style={{ fontWeight: 800, color: 'var(--text)' }}>{t('contact.responseTimeValue')}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--secondary-light)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                  <FiMessageSquare />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 600 }}>{t('contact.supportUsername')}</div>
                  <div style={{ fontWeight: 800, color: 'var(--text)' }}>@{telegramUsername}</div>
                </div>
              </div>
            </div>

          </div>

          {/* Contact Form */}
          <div className="card" style={{ padding: '30px', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiMail color="var(--primary)" /> {t('contact.sendMessage')}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                  {t('contact.yourName')}
                </label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder={t('contact.namePlaceholder')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                  {t('contact.emailAddress')}
                </label>
                <input 
                  type="email" 
                  className="input" 
                  placeholder={t('contact.emailPlaceholder')}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                  {t('contact.subject')}
                </label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder={t('contact.subjectPlaceholder')}
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                  {t('contact.message')}
                </label>
                <textarea 
                  className="textarea" 
                  rows={4}
                  placeholder={t('contact.messagePlaceholder')}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                />
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>
                {t('contact.submittingTo')} <strong>{supportEmail}</strong>.
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-lg" 
                disabled={loading}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {loading ? t('contact.sending') : <><FiSend /> {t('contact.sendBtn')}</>}
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
    </>
  );
};

export default ContactPage;
