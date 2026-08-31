import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  FiSettings, FiShield, FiCreditCard, FiCheck,
  FiLock, FiSliders, FiDollarSign, FiRefreshCw, FiClock, FiPercent,
  FiGlobe, FiActivity
} from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';
import { adminAudit as auditApi } from '../../api/client';

export default function SettingsManage() {
  const { lang, setLang, isKhmer } = useLanguage();
  const [escrowDays, setEscrowDays] = useState(() => localStorage.getItem('cfg_escrow_days') || '3');
  const [platformFee, setPlatformFee] = useState(() => localStorage.getItem('cfg_platform_fee') || '5');
  const [autoCompleteHours, setAutoCompleteHours] = useState(() => localStorage.getItem('cfg_autocomplete_hours') || '72');
  const [maintenanceMode, setMaintenanceMode] = useState(() => localStorage.getItem('cfg_maintenance') === 'true');
  const [paywayMerchantId, setPaywayMerchantId] = useState('ec439129');
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const res = await auditApi.getAuditActions();
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setAuditLogs(list);
    } catch (e) {
      console.warn("Could not load audit logs", e);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    localStorage.setItem('cfg_escrow_days', escrowDays);
    localStorage.setItem('cfg_platform_fee', platformFee);
    localStorage.setItem('cfg_autocomplete_hours', autoCompleteHours);
    localStorage.setItem('cfg_maintenance', maintenanceMode ? 'true' : 'false');

    setTimeout(() => {
      setSaving(false);
      toast.success(isKhmer ? 'បានរក្សាទុកការកំណត់ប្រព័ន្ធជោគជ័យ!' : 'System configuration saved successfully!');
    }, 400);
  };

  return (
    <div className="admin-animate-in">
      {/*  Page Header  */}
      <div className="admin-page-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiSettings color="#8B5CF6" /> {isKhmer ? 'ការកំណត់ប្រព័ន្ធ & Platform' : 'System & Platform Settings'}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--admin-text-secondary)', marginTop: 4 }}>
            {isKhmer 
              ? 'គ្រប់គ្រងភាសាប្រព័ន្ធ, រយៈពេលកាន់កាប់ Escrow, កម្រៃជើងសារវេទិកា, Payment Gateway និងប៉ារ៉ាម៉ែត្រសុវត្ថិភាព'
              : 'Configure system language, Escrow holding periods, platform fees, payment gateways, and security parameters'}
          </div>
        </div>

        <button
          type="submit"
          form="settings-form"
          disabled={saving}
          className="admin-btn admin-btn-primary"
          style={{
            padding: '10px 22px',
            fontSize: '0.88rem',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
            color: '#fff',
            border: 'none',
            boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
            cursor: 'pointer'
          }}
        >
          <FiCheck size={16} /> {saving ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...') : (isKhmer ? 'រក្សាទុកការកំណត់' : 'Save All Settings')}
        </button>
      </div>

      <form id="settings-form" onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
        
        {/* Card 1: Language & Localization */}
        <div className="admin-card admin-glass-card" style={{ padding: 24, borderTop: '3px solid #8B5CF6' }}>
          <h3 style={{ margin: '0 0 18px 0', fontSize: '1rem', fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6' }}>
              <FiGlobe size={18} />
            </span>
            {isKhmer ? 'ភាសា & ការកំណត់តំបន់' : 'Language & Localization'}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: 10, color: '#CBD5E1' }}>
                {isKhmer ? 'ជ្រើសរើសភាសាប្រព័ន្ធ (SYSTEM LANGUAGE)' : 'SELECT SYSTEM LANGUAGE'}
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setLang('km')}
                  style={{
                    padding: '14px 12px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    border: lang === 'km' ? '2px solid #8B5CF6' : '1px solid rgba(255,255,255,0.12)',
                    background: lang === 'km' ? 'rgba(139, 92, 246, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                    color: '#fff',
                    fontWeight: lang === 'km' ? 800 : 600,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.2s',
                    boxShadow: lang === 'km' ? '0 0 16px rgba(139, 92, 246, 0.3)' : 'none'
                  }}
                >
                  <FiGlobe size={24} style={{ color: '#8E44AD' }} />
                  <span style={{ fontSize: '0.88rem' }}>ភាសាខ្មែរ</span>
                  <span style={{ fontSize: '0.72rem', color: lang === 'km' ? '#C4B5FD' : 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {lang === 'km' && <FiCheck size={12} color="#8B5CF6" />}
                    {lang === 'km' ? (isKhmer ? 'កំពុងប្រើប្រាស់' : 'Active') : 'Khmer'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setLang('en')}
                  style={{
                    padding: '14px 12px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    border: lang === 'en' ? '2px solid #8B5CF6' : '1px solid rgba(255,255,255,0.12)',
                    background: lang === 'en' ? 'rgba(139, 92, 246, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                    color: '#fff',
                    fontWeight: lang === 'en' ? 800 : 600,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.2s',
                    boxShadow: lang === 'en' ? '0 0 16px rgba(139, 92, 246, 0.3)' : 'none'
                  }}
                >
                  <FiGlobe size={24} style={{ color: '#3B82F6' }} />
                  <span style={{ fontSize: '0.88rem' }}>English</span>
                  <span style={{ fontSize: '0.72rem', color: lang === 'en' ? '#C4B5FD' : 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {lang === 'en' && <FiCheck size={12} color="#8B5CF6" />}
                    {lang === 'en' ? (isKhmer ? 'កំពុងប្រើប្រាស់' : 'Currently Active') : 'English (US)'}
                  </span>
                </button>
              </div>

              <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', display: 'block', marginTop: 10, lineHeight: 1.4 }}>
                {isKhmer 
                  ? 'ការប្តូរភាសានឹងអនុវត្តភ្លាមៗទូទាំងផ្ទាំងបញ្ជា Admin, ម៉ឺនុយ, របាយការណ៍ និងការកំណត់។'
                  : 'Language switches instantly across all admin sidebars, dashboards, tables, and settings.'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Escrow & Mediation Rules */}
        <div className="admin-card admin-glass-card" style={{ padding: 24, borderTop: '3px solid #10B981' }}>
          <h3 style={{ margin: '0 0 18px 0', fontSize: '1rem', fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
              <FiShield size={18} />
            </span>
            {isKhmer ? 'ប៉ារ៉ាម៉ែត្រ Escrow & ការធានា' : 'Escrow & Warranty Parameters'}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#CBD5E1' }}>
                <FiClock size={14} color="#10B981" />
                {isKhmer ? 'រយៈពេលកាន់កាប់ ESCROW (ថ្ងៃ)' : 'ESCROW HOLDING DURATION (DAYS)'}
              </label>
              <input
                type="number"
                value={escrowDays}
                onChange={e => setEscrowDays(e.target.value)}
                className="admin-input"
                style={{ width: '100%', height: 42, background: 'rgba(15, 23, 42, 0.7)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', color: '#fff', padding: '0 14px' }}
                min="1"
                max="30"
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', display: 'block', marginTop: 4 }}>
                {isKhmer ? 'ចំនួនថ្ងៃដែលទឹកប្រាក់ត្រូវរក្សាទុកក្នុង Escrow មុនពេលអ្នកលក់អាចដកប្រាក់បាន។' : 'Funds held in escrow before seller withdrawal is eligible.'}
              </span>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#CBD5E1' }}>
                <FiClock size={14} color="#F59E0B" />
                {isKhmer ? 'ម៉ោងបញ្ចប់ស្វ័យប្រវត្តិ (ម៉ោងក្រោយពេលប្រគល់ទំនិញ)' : 'AUTO-COMPLETE TIMER (HOURS AFTER DELIVERY)'}
              </label>
              <input
                type="number"
                value={autoCompleteHours}
                onChange={e => setAutoCompleteHours(e.target.value)}
                className="admin-input"
                style={{ width: '100%', height: 42, background: 'rgba(15, 23, 42, 0.7)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', color: '#fff', padding: '0 14px' }}
                min="12"
                max="168"
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', display: 'block', marginTop: 4 }}>
                {isKhmer ? 'ការបញ្ជាទិញនឹងបញ្ចប់ដោយស្វ័យប្រវត្តទៅអ្នកលក់ ប្រសិនបើអ្នកទិញមិនបានរាយការណ៍បញ្ហា។' : "Order auto-completes to seller if buyer doesn't report an issue within this window."}
              </span>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#CBD5E1' }}>
                <FiPercent size={14} color="#8B5CF6" />
                {isKhmer ? 'កម្រៃសេវាជើងសារវេទិកា (%)' : 'PLATFORM COMMISSION FEE (%)'}
              </label>
              <input
                type="number"
                step="0.1"
                value={platformFee}
                onChange={e => setPlatformFee(e.target.value)}
                className="admin-input"
                style={{ width: '100%', height: 42, background: 'rgba(15, 23, 42, 0.7)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', color: '#fff', padding: '0 14px' }}
                min="0"
                max="50"
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', display: 'block', marginTop: 4 }}>
                {isKhmer ? 'កម្រៃសេវានឹងត្រូវកាត់ដោយស្វ័យប្រវត្តពីសមតុល្យអ្នកលក់នៅពេលការបញ្ជាទិញបានសម្រេច។' : 'Platform service fee automatically deducted from seller balance upon completion.'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Payment Gateway (ABA KHQR PayWay) */}
        <div className="admin-card admin-glass-card" style={{ padding: 24, borderTop: '3px solid #38BDF8' }}>
          <h3 style={{ margin: '0 0 18px 0', fontSize: '1rem', fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8' }}>
              <FiCreditCard size={18} />
            </span>
            {isKhmer ? 'ទូទាត់ប្រាក់ ABA KHQR PayWay Gateway' : 'ABA KHQR PayWay Gateway'}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: 8, color: '#CBD5E1' }}>
                {isKhmer ? 'ABA PAYWAY MERCHANT ID' : 'ABA PAYWAY MERCHANT ID'}
              </label>
              <input
                type="text"
                value={paywayMerchantId}
                onChange={e => setPaywayMerchantId(e.target.value)}
                className="admin-input"
                style={{ width: '100%', height: 42, background: 'rgba(15, 23, 42, 0.7)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', color: '#fff', padding: '0 14px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: 8, color: '#CBD5E1' }}>
                {isKhmer ? 'ស្ថានភាព GATEWAY' : 'GATEWAY STATUS'}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, color: '#10B981', fontSize: '0.82rem', fontWeight: 700 }}>
                <FiCheck size={16} /> ABA KHQR Live & Webhooks Connected
              </div>
            </div>

            <div style={{ marginTop: 6, padding: '14px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: 12, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, color: '#FFF' }}>
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={e => setMaintenanceMode(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: '#EF4444', cursor: 'pointer' }}
                />
                {isKhmer ? 'បើកដំណើរការ Maintenance Mode ហាង' : 'Enable Store Maintenance Mode'}
              </label>
              <span style={{ fontSize: '0.72rem', color: '#FCA5A5', display: 'block', marginTop: 6, paddingLeft: 28 }}>
                {isKhmer ? 'ផ្អាកការ Checkout បណ្តោះអាសន្នសម្រាប់ការជួសជុល ដោយមិនប៉ះពាល់ដល់ផ្ទាំង Admin ឡើយ។' : 'Temporarily pause checkout for maintenance without affecting admin portal.'}
              </span>
            </div>
          </div>
        </div>

        {/*  Bottom Action Bar  */}
        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button
            type="submit"
            disabled={saving}
            className="admin-btn admin-btn-primary"
            style={{
              padding: '12px 28px',
              fontSize: '0.92rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
              color: '#fff',
              border: 'none',
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
              cursor: 'pointer'
            }}
          >
            <FiCheck size={18} /> {saving ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...') : (isKhmer ? 'រក្សាទុកការកំណត់ទាំងអស់' : 'Save All Settings')}
          </button>
        </div>
      </form>

      {/* Admin Action Audit Trail Table (Table 40: admin_actions) */}
      <div className="admin-card" style={{ marginTop: 32, padding: 22, borderTop: '3px solid #38BDF8' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiActivity color="#38BDF8" /> {isKhmer ? 'កំណត់ត្រាសកម្មភាព Admin (Security Audit Trail - Table 40)' : 'Admin Action Security Audit Trail (Table 40)'}
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-secondary)' }}>
              {isKhmer ? 'តាមដានគ្រប់សកម្មភាពផ្លាស់ប្តូរទិន្នន័យ, ការអនុម័តដកប្រាក់, ការដោះស្រាយវិវាទ ដោយ Admin' : 'Chronological tamper-evident audit logs of administrative actions, payouts, and system changes'}
            </span>
          </div>
          <button
            type="button"
            onClick={fetchAuditLogs}
            className="admin-btn admin-btn-secondary"
            style={{ fontSize: '0.78rem' }}
          >
            <FiRefreshCw className={loadingAudit ? 'spin' : ''} /> {isKhmer ? 'ផ្ទុកឡើងវិញ' : 'Refresh Logs'}
          </button>
        </div>

        {auditLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--admin-text-secondary)', fontSize: '0.85rem' }}>
            {isKhmer ? 'មិនទាន់មានកំណត់ត្រាសកម្មភាព Admin នៅឡើយទេ។' : 'No admin audit records logged yet.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>{isKhmer ? 'កាលបរិច្ឆេទ' : 'Timestamp'}</th>
                  <th>{isKhmer ? 'Admin អនុវត្ត' : 'Admin User'}</th>
                  <th>{isKhmer ? 'ប្រភេទសកម្មភាព' : 'Action Type'}</th>
                  <th>{isKhmer ? 'មុខសញ្ញា' : 'Target / Entity'}</th>
                  <th>{isKhmer ? 'ព័ត៌មានលម្អិត' : 'Action Details'}</th>
                  <th>{isKhmer ? 'IP Address' : 'IP Address'}</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {log.createdAt ? new Date(log.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </td>
                    <td style={{ fontWeight: 700, color: '#38BDF8' }}>
                      {log.adminUser?.name || log.adminUser?.email || 'Super Admin'}
                    </td>
                    <td>
                      <span style={{
                        padding: '3px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 800,
                        background: 'rgba(56, 189, 248, 0.12)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.3)'
                      }}>
                        {log.actionType}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '0.8rem' }}>
                      {log.targetEntity ? `${log.targetEntity} #${log.targetId || ''}` : '—'}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#E2E8F0' }}>
                      {log.details}
                    </td>
                    <td style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--admin-text-secondary)' }}>
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
