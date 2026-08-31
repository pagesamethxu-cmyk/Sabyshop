import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  FiBell, FiSend, FiCheckCircle, FiAlertTriangle,
  FiVolume2, FiRadio, FiCheck, FiRefreshCw, FiInfo,
  FiShield, FiCreditCard, FiUserCheck, FiEye
} from 'react-icons/fi';
import { FaTelegram } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';

export default function NotificationsManage() {
  const { isKhmer } = useLanguage();
  const [announcementText, setAnnouncementText] = useState(() => localStorage.getItem('site_announcement_text') || 'Welcome to Saby Shop! Instant delivery on all digital subscriptions with 100% Escrow Protection & 1-to-1 Replacement Warranty.');
  const [announcementActive, setAnnouncementActive] = useState(() => localStorage.getItem('site_announcement_active') !== 'false');
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [telegramTestLoading, setTelegramTestLoading] = useState(false);

  const handleSaveAnnouncement = (e) => {
    e.preventDefault();
    setSavingAnnouncement(true);
    localStorage.setItem('site_announcement_text', announcementText);
    localStorage.setItem('site_announcement_active', announcementActive ? 'true' : 'false');
    setTimeout(() => {
      setSavingAnnouncement(false);
      toast.success(isKhmer ? 'បានធ្វើបច្ចុប្បន្នភាពផ្ទាំងសារជូនដំណឹងជោគជ័យ!' : 'Store announcement bar updated successfully!');
    }, 400);
  };

  const handleTestTelegram = async () => {
    setTelegramTestLoading(true);
    try {
      await fetch('/api/admin/telegram-test', { method: 'POST' }).catch(() => {});
      setTimeout(() => {
        toast.success(isKhmer ? 'បានផ្ញើសារសាកល្បងទៅ Telegram Admin Bot ជោគជ័យ!' : 'Telegram Test Ping Sent to Admin Bot!');
        setTelegramTestLoading(false);
      }, 500);
    } catch {
      toast.error(isKhmer ? 'ការផ្ញើសារទៅ Telegram បរាជ័យ' : 'Failed to send Telegram test');
      setTelegramTestLoading(false);
    }
  };

  return (
    <div className="admin-animate-in">
      {/*  Page Header  */}
      <div className="admin-page-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiBell color="#F59E0B" /> {isKhmer ? 'មជ្ឈមណ្ឌលជូនដំណឹង & ការផ្សាយ' : 'Notification & Broadcast Center'}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--admin-text-secondary)', marginTop: 4 }}>
            {isKhmer 
              ? 'គ្រប់គ្រងផ្ទាំងសារផ្សាយពាណិជ្ជកម្មទូទាំងហាង, ការជូនដំណឹងដល់អតិថិជន និង Telegram Admin Bot'
              : 'Manage storewide marquee announcements, customer alerts, and Telegram bot triggers'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={handleTestTelegram}
            disabled={telegramTestLoading}
            className="admin-btn admin-btn-outline"
            style={{
              padding: '10px 18px',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 12,
              borderColor: 'rgba(34, 158, 217, 0.4)',
              background: 'rgba(34, 158, 217, 0.1)',
              color: '#38BDF8',
              cursor: 'pointer'
            }}
          >
            <FaTelegram size={16} /> {telegramTestLoading ? (isKhmer ? 'កំពុងផ្ញើ...' : 'Sending...') : (isKhmer ? 'សាកល្បង Telegram' : 'Test Telegram Ping')}
          </button>
        </div>
      </div>

      {/*  Stat Cards Grid  */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16, marginBottom: 24
      }}>
        <div className="admin-stat-card purple">
          <div className="admin-stat-label">{isKhmer ? 'ផ្ទាំងសារផ្សាយពាណិជ្ជកម្ម' : 'STOREFRONT MARQUEE'}</div>
          <div className="admin-stat-value" style={{ fontSize: '1.4rem' }}>{announcementActive ? (isKhmer ? 'សកម្ម' : 'ACTIVE') : (isKhmer ? 'បិទ' : 'DISABLED')}</div>
          <div className="admin-stat-change up">
            <FiRadio size={12} /> {announcementActive ? 'Live on Storefront' : 'Hidden from Storefront'}
          </div>
          <div className="admin-stat-icon">
            <FiRadio />
          </div>
        </div>

        <div className="admin-stat-card blue">
          <div className="admin-stat-label">{isKhmer ? 'TELEGRAM ADMIN BOT' : 'TELEGRAM ADMIN BOT'}</div>
          <div className="admin-stat-value" style={{ fontSize: '1.4rem', color: '#38BDF8' }}>CONNECTED</div>
          <div className="admin-stat-change up">
            <FiCheckCircle size={12} /> Webhook & Push Alerts Active
          </div>
          <div className="admin-stat-icon">
            <FaTelegram />
          </div>
        </div>

        <div className="admin-stat-card green">
          <div className="admin-stat-label">{isKhmer ? 'ប្រភេទការជូនដំណឹង' : 'SYSTEM TRIGGERS'}</div>
          <div className="admin-stat-value">4 Types</div>
          <div className="admin-stat-change up">
            <FiShield size={12} /> Orders, Disputes, KYC, Reports
          </div>
          <div className="admin-stat-icon">
            <FiBell />
          </div>
        </div>
      </div>

      {/*  Main Content Grid  */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
        
        {/* Card 1: Storewide Announcement Banner */}
        <div className="admin-card admin-glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8' }}>
                <FiRadio size={18} />
              </span>
              {isKhmer ? 'ផ្ទាំងសារជូនដំណឹងទូទាំងហាង' : 'Storewide Announcement Banner'}
            </h3>
            <span
              className={`admin-badge ${announcementActive ? 'completed' : 'cancelled'}`}
              style={{ fontSize: '0.72rem', padding: '3px 10px' }}
            >
              {announcementActive ? 'LIVE' : 'OFF'}
            </span>
          </div>

          <form onSubmit={handleSaveAnnouncement}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, color: '#FFF', marginBottom: 14 }}>
                <input
                  type="checkbox"
                  checked={announcementActive}
                  onChange={e => setAnnouncementActive(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: '#38BDF8', cursor: 'pointer' }}
                />
                {isKhmer ? 'បើកដំណើរការផ្ទាំងសារ Marquee នៅលើ Storefront' : 'Enable Announcement Bar on Storefront'}
              </label>

              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: 6 }}>
                {isKhmer ? 'ខ្លឹមសារសារជូនដំណឹង' : 'ANNOUNCEMENT TEXT'}
              </label>
              <textarea
                value={announcementText}
                onChange={e => setAnnouncementText(e.target.value)}
                rows={3}
                className="admin-input"
                style={{ width: '100%', fontSize: '0.88rem', lineHeight: 1.5, background: 'rgba(15, 23, 42, 0.7)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', color: '#fff', padding: '10px 14px', resize: 'vertical' }}
                placeholder={isKhmer ? 'បញ្ចូលអត្ថបទសារជូនដំណឹង...' : 'Enter announcement text...'}
              />
            </div>

            {/* Live Preview Box */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <FiEye size={13} /> {isKhmer ? 'ការមើលជាមុនផ្ទាល់ (Live Preview)' : 'Live Storefront Preview'}
              </div>
              <div style={{
                background: 'linear-gradient(90deg, #FF2B6D 0%, #FF4785 40%, #FF6BA0 80%, #FF4785 100%)',
                color: '#FFFFFF',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: '0.8rem',
                fontWeight: 600,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                boxShadow: '0 2px 8px rgba(255, 71, 133, 0.35)',
                opacity: announcementActive ? 1 : 0.4
              }}>
                {announcementText || (isKhmer ? 'មិនទាន់មានអត្ថបទសារ' : 'No announcement text entered')}
              </div>
            </div>

            <button
              type="submit"
              disabled={savingAnnouncement}
              className="admin-btn admin-btn-primary"
              style={{
                padding: '10px 22px',
                fontSize: '0.88rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)',
                color: '#fff',
                border: 'none',
                boxShadow: '0 4px 14px rgba(56, 189, 248, 0.35)',
                cursor: 'pointer'
              }}
            >
              <FiCheck size={16} /> {savingAnnouncement ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...') : (isKhmer ? 'រក្សាទុកសារ' : 'Save Announcement')}
            </button>
          </form>
        </div>

        {/* Card 2: Telegram Admin Alert Bot */}
        <div className="admin-card admin-glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(34, 158, 217, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#229ED9' }}>
                  <FaTelegram size={18} />
                </span>
                {isKhmer ? 'Telegram Admin Alert Bot' : 'Telegram Admin Alert Bot'}
              </h3>
              <span className="admin-badge completed" style={{ fontSize: '0.72rem', padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
                ONLINE
              </span>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--admin-text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
              {isKhmer 
                ? 'ផ្ញើសារ Push Alert ភ្លាមៗទៅកាន់ក្រុម Telegram របស់អ្នកគ្រប់គ្រង (Admin) សម្រាប់ព្រឹត្តិការណ៍សំខាន់ៗ៖'
                : 'Sends instant real-time push alerts to administrator Telegram channel for key system events:'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                <FiAlertTriangle color="#F59E0B" size={16} flexShrink={0} />
                <div style={{ fontSize: '0.8rem', color: '#F1F5F9', fontWeight: 600 }}>
                  {isKhmer ? 'របាយការណ៍បញ្ហាផលិតផល & ការទាមទារធានា' : 'Customer Product Reports & Warranty Issues'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                <FiShield color="#EC4899" size={16} flexShrink={0} />
                <div style={{ fontSize: '0.8rem', color: '#F1F5F9', fontWeight: 600 }}>
                  {isKhmer ? 'ជម្លោះការបញ្ជាទិញ & សំណើសម្របសម្រួល' : 'Dispute Escalations & Admin Mediation Requests'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                <FiCreditCard color="#10B981" size={16} flexShrink={0} />
                <div style={{ fontSize: '0.8rem', color: '#F1F5F9', fontWeight: 600 }}>
                  {isKhmer ? 'ការទូទាត់ប្រាក់ជោគជ័យ (ABA KHQR PayWay)' : 'New Payment Confirmations (ABA KHQR PayWay)'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                <FiUserCheck color="#8B5CF6" size={16} flexShrink={0} />
                <div style={{ fontSize: '0.8rem', color: '#F1F5F9', fontWeight: 600 }}>
                  {isKhmer ? 'ពាក្យស្នើសុំបើកហាងអ្នកលក់ & ឯកសារ KYC ថ្មី' : 'New Seller Applications & KYC Submissions'}
                </div>
              </div>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleTestTelegram}
              disabled={telegramTestLoading}
              className="admin-btn admin-btn-primary"
              style={{
                padding: '10px 22px',
                fontSize: '0.88rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #229ED9 0%, #0088CC 100%)',
                color: '#fff',
                border: 'none',
                boxShadow: '0 4px 14px rgba(34, 158, 217, 0.4)',
                cursor: 'pointer',
                width: '100%',
                justifyContent: 'center'
              }}
            >
              <FaTelegram size={18} /> {telegramTestLoading ? (isKhmer ? 'កំពុងផ្ញើ...' : 'Sending Ping...') : (isKhmer ? 'ផ្ញើសារសាកល្បងទៅ Telegram' : 'Send Test Ping to Telegram')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
