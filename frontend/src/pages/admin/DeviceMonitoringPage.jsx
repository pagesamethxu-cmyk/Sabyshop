import React, { useState, useEffect } from 'react';
import { devices as devicesApi } from '../../api/client';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';
import {
  FiShield, FiSmartphone, FiMonitor, FiRadio,
  FiRefreshCw, FiTrash2, FiUser, FiActivity,
  FiSearch, FiCheckCircle, FiAlertTriangle, FiClock, FiKey, FiX
} from 'react-icons/fi';

export default function DeviceMonitoringPage() {
  const { isKhmer } = useLanguage();
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' | 'active'
  const [logs, setLogs] = useState([]);
  const [activeDevices, setActiveDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState(null);
  const [search, setSearch] = useState('');
  const [isLive, setIsLive] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await devicesApi.getAdminLoginLogs();
      setLogs(res.data || res || []);
    } catch (err) {
      console.warn('Error fetching login logs:', err);
    }
  };

  const fetchActiveDevices = async () => {
    try {
      const res = await devicesApi.getAdminActiveDevices();
      setActiveDevices(res.data || res || []);
    } catch (err) {
      console.warn('Error fetching active devices:', err);
    }
  };

  const reloadData = async () => {
    setLoading(true);
    await Promise.all([fetchLogs(), fetchActiveDevices()]);
    setLoading(false);
  };

  useEffect(() => {
    reloadData();

    // Subscribe to SSE Real-time Live Log Events
    let eventSource;
    try {
      const token = localStorage.getItem('token');
      eventSource = new EventSource(`/api/admin/devices/stream?token=${token}`);

      eventSource.addEventListener('device_log', (event) => {
        try {
          const newLog = JSON.parse(event.data);
          setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
          if (newLog.isNewDevice) {
            toast((t) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FiAlertTriangle color="#F59E0B" size={20} />
                <div>
                  <div style={{ fontWeight: 800 }}>ចូលប្រើប្រាស់ពី ឧបករណ៍ថ្មី!</div>
                  <div style={{ fontSize: '0.8rem' }}>{newLog.userEmail} ({newLog.deviceName})</div>
                </div>
              </div>
            ), { duration: 5000, position: 'top-right' });
          }
          fetchActiveDevices();
        } catch (e) {
          console.error('Error parsing SSE event:', e);
        }
      });

      eventSource.addEventListener('device_update', () => {
        reloadData();
      });

      eventSource.onopen = () => setIsLive(true);
      eventSource.onerror = () => setIsLive(false);
    } catch (e) {
      console.warn('SSE subscription failed:', e);
      setIsLive(false);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  /*  Confirm Revoke Modal State  */
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [targetRevokeItem, setTargetRevokeItem] = useState(null);

  const requestAdminRevokeSingle = (dev) => {
    setTargetRevokeItem(dev);
    setConfirmModalOpen(true);
  };

  const requestAdminRevokeAllSystem = () => {
    setTargetRevokeItem('ALL_SYSTEM');
    setConfirmModalOpen(true);
  };

  const executeAdminRevoke = async () => {
    if (!targetRevokeItem) return;
    setLoading(true);
    try {
      if (targetRevokeItem === 'ALL_SYSTEM') {
        await devicesApi.adminRevokeAllSystemDevices();
        toast.success('បានដក Session ឧបករណ៍ទាំងអស់ក្នុងប្រព័ន្ធជោគជ័យ! All sessions revoked.');
      } else {
        const id = typeof targetRevokeItem === 'object' ? targetRevokeItem.id : targetRevokeItem;
        await devicesApi.adminRevokeDevice(id);
        toast.success('បានដក Session ឧបករណ៍ចេញជោគជ័យ!');
      }
      setConfirmModalOpen(false);
      setTargetRevokeItem(null);
      await reloadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to revoke device session');
    } finally {
      setLoading(false);
    }
  };

  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'admin' | 'user'

  const filteredLogs = logs.filter(l => {
    if (l.status?.includes('REVOKED')) return false;
    const matchesSearch = (l.userEmail || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.userName || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.deviceName || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.ipAddress || '').includes(search);
    
    if (!matchesSearch) return false;
    if (roleFilter === 'admin') return l.userRole === 'ADMIN';
    if (roleFilter === 'user') return l.userRole !== 'ADMIN';
    return true;
  });

  const filteredActive = activeDevices.filter(d => {
    if (d.status === 'REVOKED') return false;
    const matchesSearch = (d.userEmail || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.userName || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.deviceName || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.ipAddress || '').includes(search);

    if (!matchesSearch) return false;
    if (roleFilter === 'admin') return d.userRole === 'ADMIN';
    if (roleFilter === 'user') return d.userRole !== 'ADMIN';
    return true;
  });

  return (
    <div className="admin-animate-in">
      
      {/*  Page Header  */}
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiShield /> Device Security & Real-Time Login Logs
            <span
              className={`admin-badge ${isLive ? 'completed' : 'cancelled'}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', textTransform: 'none' }}
            >
              <FiRadio className={isLive ? 'pulse' : ''} /> {isLive ? 'LIVE SSE STREAM' : 'OFFLINE'}
            </span>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--admin-text-secondary)', marginTop: 4 }}>
            គ្រប់គ្រងការចូលប្រើប្រាស់ឧបករណ៍របស់អ្នកប្រើប្រាស់ & Admin និងដក Session ដែលមានហានិភ័យ
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={requestAdminRevokeAllSystem}
            className="admin-btn admin-btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#F87171', borderColor: 'rgba(248,113,113,0.4)', background: 'rgba(248,113,113,0.1)' }}
          >
            <FiTrash2 /> {isKhmer ? 'ចាកចេញសកម្មភាពឧបករណ៍ទាំងអស់' : 'Sign Out All Sessions'}
          </button>
          <button
            onClick={reloadData}
            className="admin-btn admin-btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <FiRefreshCw className={loading ? 'spin' : ''} /> {isKhmer ? 'ធ្វើបច្ចុប្បន្នភាព' : 'Refresh'}
          </button>
        </div>
      </div>

      {/*  Ultra-Glassmorphism Stat Cards Grid  */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16, marginBottom: 24
      }}>
        {/* Card 1: Admin Logins */}
        <div className="admin-stat-card purple">
          <div className="admin-stat-label">{isKhmer ? 'ការចូលរបស់អ្នកគ្រប់គ្រង' : 'ADMIN LOGINS'}</div>
          <div className="admin-stat-value">{activeDevices.filter(d => d.userRole === 'ADMIN').length}</div>
          <div className="admin-stat-change up">
            <FiShield size={12} /> Active Admin Devices
          </div>
          <div className="admin-stat-icon">
            <FiShield />
          </div>
        </div>

        {/* Card 2: User Logins */}
        <div className="admin-stat-card blue">
          <div className="admin-stat-label">{isKhmer ? 'ឧបករណ៍អ្នកប្រើប្រាស់សកម្ម' : 'ACTIVE USERS'}</div>
          <div className="admin-stat-value">{activeDevices.filter(d => d.userRole !== 'ADMIN').length}</div>
          <div className="admin-stat-change up">
            <FiCheckCircle size={12} /> Active User Connected Devices
          </div>
          <div className="admin-stat-icon">
            <FiMonitor />
          </div>
        </div>

        {/* Card 3: Total Logs */}
        <div className="admin-stat-card green">
          <div className="admin-stat-label">{isKhmer ? 'កំណត់ហេតុចូលសរុប' : 'TOTAL LOGS'}</div>
          <div className="admin-stat-value">{logs.length}</div>
          <div className="admin-stat-change up">
            <FiClock size={12} /> Recent Logins Recorded
          </div>
          <div className="admin-stat-icon">
            <FiActivity />
          </div>
        </div>

        {/* Card 4: New Devices */}
        <div className="admin-stat-card red">
          <div className="admin-stat-label">{isKhmer ? 'ឧបករណ៍ថ្មី' : 'NEW DEVICES'}</div>
          <div className="admin-stat-value">{logs.filter(l => l.isNewDevice).length}</div>
          <div className="admin-stat-change down" style={{ color: '#FBBF24', background: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.3)' }}>
            <FiAlertTriangle size={12} /> Untrusted Device Logins
          </div>
          <div className="admin-stat-icon">
            <FiKey />
          </div>
        </div>
      </div>

      {/*  Navigation Tabs, Role Filter & Search  */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 16, marginBottom: 20
      }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Main Tabs */}
          <div style={{
            display: 'flex', gap: 6, background: 'rgba(15, 23, 42, 0.7)',
            padding: 5, borderRadius: 14, border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <button
              onClick={() => setActiveTab('logs')}
              className={`admin-btn ${activeTab === 'logs' ? 'admin-btn-primary' : 'admin-btn-outline'}`}
              style={{
                padding: '8px 18px', fontSize: '0.85rem', fontWeight: 800, borderRadius: 10,
                border: activeTab === 'logs' ? 'none' : 'transparent'
              }}
            >
              កំណត់ហេតុការចូល Real-Time ({filteredLogs.length})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`admin-btn ${activeTab === 'active' ? 'admin-btn-primary' : 'admin-btn-outline'}`}
              style={{
                padding: '8px 18px', fontSize: '0.85rem', fontWeight: 800, borderRadius: 10,
                border: activeTab === 'active' ? 'none' : 'transparent'
              }}
            >
              Session ឧបករណ៍សកម្ម ({filteredActive.length})
            </button>
          </div>

          {/* Role Filters */}
          <div style={{
            display: 'flex', gap: 4, background: 'rgba(30, 41, 59, 0.6)',
            padding: 4, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <button
              onClick={() => setRoleFilter('all')}
              style={{
                padding: '5px 12px', fontSize: '0.78rem', fontWeight: 700, borderRadius: 8,
                background: roleFilter === 'all' ? 'var(--admin-primary)' : 'transparent',
                color: roleFilter === 'all' ? '#fff' : 'var(--admin-text-secondary)', border: 'none', cursor: 'pointer'
              }}
            >
              {isKhmer ? 'ទាំងអស់' : 'All'}
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              style={{
                padding: '5px 12px', fontSize: '0.78rem', fontWeight: 700, borderRadius: 8,
                background: roleFilter === 'admin' ? '#8B5CF6' : 'transparent',
                color: roleFilter === 'admin' ? '#fff' : 'var(--admin-text-secondary)', border: 'none', cursor: 'pointer'
              }}
            >
              <FiShield size={12} style={{ marginRight: 4 }} /> Admin តែប៉ុណ្ណោះ
            </button>
            <button
              onClick={() => setRoleFilter('user')}
              style={{
                padding: '5px 12px', fontSize: '0.78rem', fontWeight: 700, borderRadius: 8,
                background: roleFilter === 'user' ? '#3B82F6' : 'transparent',
                color: roleFilter === 'user' ? '#fff' : 'var(--admin-text-secondary)', border: 'none', cursor: 'pointer'
              }}
            >
              <FiUser size={12} style={{ marginRight: 4 }} /> User តែប៉ុណ្ណោះ
            </button>
          </div>
        </div>

        {/* Search input box */}
        <div style={{ position: 'relative', width: 320 }}>
          <FiSearch style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
          <input
            type="text"
            className="input"
            placeholder="ស្វែងរកតាម Email, Device, IP..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', paddingLeft: 40, paddingRight: 14, height: 42,
              background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 12, color: '#fff', fontSize: '0.88rem'
            }}
          />
        </div>
      </div>

      {/*  Table Container Card  */}
      <div className="admin-card admin-glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {activeTab === 'logs' ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{isKhmer ? 'អ្នកប្រើប្រាស់' : 'USER'}</th>
                  <th>{isKhmer ? 'ឧបករណ៍' : 'DEVICE'}</th>
                  <th>IP ADDRESS</th>
                  <th>ពេលចូលប្រើប្រាស់</th>
                  <th>{isKhmer ? 'ស្ថានភាព' : 'STATUS'}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                      <FiRefreshCw className="spin" style={{ marginRight: 8 }} /> កំពុងផ្ទុកទិន្នន័យ...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                      មិនមានកំណត់ហេតុការចូលទេ
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(l => (
                    <tr key={l.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{l.userName || 'User'}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <span style={{ fontSize: '0.76rem', color: 'var(--admin-text-secondary)' }}>{l.userEmail}</span>
                          {l.userRole === 'ADMIN' ? (
                            <span className="admin-badge completed" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                              <FiShield size={10} style={{ marginRight: 3 }} /> ADMIN
                            </span>
                          ) : (
                            <span className="admin-badge shipped" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                              <FiUser size={10} style={{ marginRight: 3 }} /> USER
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: 'rgba(139, 92, 246, 0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#A78BFA'
                          }}>
                            {l.deviceName?.toLowerCase().includes('android') || l.deviceName?.toLowerCase().includes('iphone') ? <FiSmartphone size={16} /> : <FiMonitor size={16} />}
                          </span>
                          <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem' }}>{l.deviceName}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: '#00F2FE' }}>
                        {l.ipAddress}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--admin-text-secondary)' }}>
                        {l.loginTime ? new Date(l.loginTime).toLocaleString() : 'Just now'}
                      </td>
                      <td>
                        {l.isNewDevice ? (
                          <span className="admin-badge processing">
                            NEW DEVICE
                          </span>
                        ) : l.status?.includes('REVOKED') ? (
                          <span className="admin-badge cancelled">
                            REVOKED
                          </span>
                        ) : (
                          <span className="admin-badge shipped">
                            SAVED DEVICE
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{isKhmer ? 'អ្នកប្រើប្រាស់' : 'USER'}</th>
                  <th>{isKhmer ? 'ឧបករណ៍' : 'DEVICE'}</th>
                  <th>IP ADDRESS</th>
                  <th>សកម្មភាពចុងក្រោយ</th>
                  <th style={{ textAlign: 'right' }}>{isKhmer ? 'សកម្មភាព' : 'ACTION'}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                      <FiRefreshCw className="spin" style={{ marginRight: 8 }} /> កំពុងផ្ទុកទិន្នន័យ...
                    </td>
                  </tr>
                ) : filteredActive.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                      មិនមាន Session ឧបករណ៍សកម្មទេ
                    </td>
                  </tr>
                ) : (
                  filteredActive.map(dev => (
                    <tr key={dev.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{dev.userName || 'User'}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <span style={{ fontSize: '0.76rem', color: 'var(--admin-text-secondary)' }}>{dev.userEmail}</span>
                          {dev.userRole === 'ADMIN' ? (
                            <span className="admin-badge completed" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                              <FiShield size={10} style={{ marginRight: 3 }} /> ADMIN
                            </span>
                          ) : (
                            <span className="admin-badge shipped" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                              <FiUser size={10} style={{ marginRight: 3 }} /> USER
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: 'rgba(16, 185, 129, 0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#10B981'
                          }}>
                            {dev.deviceName?.toLowerCase().includes('android') || dev.deviceName?.toLowerCase().includes('iphone') ? <FiSmartphone size={16} /> : <FiMonitor size={16} />}
                          </span>
                          <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem' }}>{dev.deviceName}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: '#00F2FE' }}>
                        {dev.ipAddress}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--admin-text-secondary)' }}>
                        {dev.loginTime ? new Date(dev.loginTime).toLocaleString() : 'Just now'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => requestAdminRevokeSingle(dev)}
                          disabled={revokingId === dev.id}
                          className="admin-btn admin-btn-outline"
                          style={{
                            color: '#F87171', borderColor: 'rgba(248,113,113,0.4)',
                            background: 'rgba(248,113,113,0.1)', padding: '4px 12px',
                            fontSize: '0.8rem'
                          }}
                        >
                          <FiTrash2 style={{ marginRight: 4 }} /> {revokingId === dev.id ? '...' : 'ដកចេញ'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/*  Confirm Revoke Modal  */}
      {confirmModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1250,
          background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: '#1e293b', borderRadius: 20, width: '100%', maxWidth: 440,
            border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            overflow: 'hidden', animation: 'fadeIn 0.2s ease-out', color: '#f8fafc'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              padding: '18px 20px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FiAlertTriangle size={22} />
                <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>
                  {targetRevokeItem === 'ALL_SYSTEM' 
                    ? 'បញ្ជាក់ការដក Session ទាំងអស់ក្នុងប្រព័ន្ធ' 
                    : 'បញ្ជាក់ការដក Session ឧបករណ៍'}
                </div>
              </div>
              <button 
                onClick={() => setConfirmModalOpen(false)} 
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 30, height: 30, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: '0.92rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                {targetRevokeItem === 'ALL_SYSTEM' ? (
                  'តើអ្នកប្រាកដជាចង់ចាកចេញ និងដក Session ឧបករណ៍ទាំងអស់ក្នុងប្រព័ន្ធមែនទេ? '
                ) : (
                  `តើអ្នកប្រាកដជាចង់ដក Session ឧបករណ៍ ${targetRevokeItem?.deviceName || ''} (${targetRevokeItem?.userEmail || ''}) មែនទេ?`
                )}
              </div>

              <div style={{
                background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '12px 14px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10,
                color: '#F87171', fontSize: '0.84rem', fontWeight: 600
              }}>
                <FiTrash2 size={18} flexShrink={0} />
                <div>
                  {targetRevokeItem === 'ALL_SYSTEM'
                    ? 'ឧបករណ៍ User & Admin ទាំងអស់នឹងត្រូវចាកចេញ  ភ្លាមៗ!'
                    : 'ឧបករណ៍នេះនឹងត្រូវចាកចេញពីគណនី  ភ្លាមៗ!'
                  }
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  onClick={executeAdminRevoke}
                  disabled={loading}
                  className="admin-btn"
                  style={{
                    flex: 1, padding: '10px 16px', fontSize: '0.9rem', fontWeight: 800,
                    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', color: '#fff', border: 'none',
                    borderRadius: 12, boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
                  }}
                >
                  {loading ? '...' : 'ដកចេញភ្លាមៗ'}
                </button>
                <button
                  onClick={() => setConfirmModalOpen(false)}
                  className="admin-btn admin-btn-outline"
                  style={{ padding: '10px 16px', fontSize: '0.9rem', fontWeight: 700, borderRadius: 12 }}
                >
                  {isKhmer ? 'បោះបង់' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
