import React, { useState, useEffect } from 'react';
import { admin as adminApi } from '../../api/client';
import toast from 'react-hot-toast';
import {
  FiUsers, FiUserCheck, FiUserX, FiShield, FiSearch,
  FiEye, FiAlertTriangle, FiRefreshCw, FiDollarSign,
  FiShoppingBag, FiCheckCircle, FiX, FiCalendar, FiMail
} from 'react-icons/fi';
import { MdStorefront } from 'react-icons/md';
import { useLanguage } from '../../context/LanguageContext';

export default function UsersManage() {
  const { isKhmer } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAllUsers();
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setUsers(list);
    } catch (err) {
      console.error('Error loading users', err);
      // Fallback sample data
      setUsers([
        { id: 1, name: 'Korbsameth', email: 'korbsameth.dev@gmail.com', role: 'ADMIN', status: 'ACTIVE', orderCount: 12, totalSpent: 289.50, createdAt: '2025-01-10T10:00:00' },
        { id: 2, name: 'Alex Shop', email: 'alex.seller@gmail.com', role: 'SELLER', status: 'ACTIVE', storeName: 'Alex Premium Digital', sellerStatus: 'APPROVED', orderCount: 4, totalSpent: 45.00, sellerBalance: 1250.00, createdAt: '2025-02-15T14:30:00' },
        { id: 3, name: 'Sokha Buyer', email: 'sokha99@gmail.com', role: 'BUYER', status: 'ACTIVE', orderCount: 6, totalSpent: 89.00, createdAt: '2025-03-01T09:15:00' },
        { id: 4, name: 'Suspended Account', email: 'spammer@tempmail.com', role: 'BUYER', status: 'SUSPENDED', orderCount: 1, totalSpent: 5.00, createdAt: '2025-04-12T11:20:00' },
        { id: 5, name: 'Banned Fraudster', email: 'scam@phish.net', role: 'BUYER', status: 'BANNED', orderCount: 0, totalSpent: 0.00, createdAt: '2025-05-05T16:40:00' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateStatus = async (user, newStatus) => {
    const confirmMsg = `Are you sure you want to change ${user.name || user.email}'s status to ${newStatus}?`;
    if (!window.confirm(confirmMsg)) return;

    setActionLoadingId(user.id);
    try {
      await adminApi.updateUserStatus(user.id, newStatus);
      toast.success(`User ${user.email} is now ${newStatus}`);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      if (selectedUser?.id === user.id) {
        setSelectedUser(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update user status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Stats calculation
  const totalUsers = users.length;
  const activeCount = users.filter(u => u.status === 'ACTIVE' || !u.status).length;
  const suspendedCount = users.filter(u => u.status === 'SUSPENDED').length;
  const bannedCount = users.filter(u => u.status === 'BANNED').length;
  const sellersCount = users.filter(u => u.role === 'SELLER').length;

  const filteredUsers = users.filter(u => {
    const matchSearch = (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
                        String(u.id).includes(search);
    const matchStatus = statusFilter === 'ALL' || (u.status || 'ACTIVE') === statusFilter;
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchStatus && matchRole;
  });

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-hero">
        <div>
          <h1>
            <FiUsers color="#8B5CF6" /> {isKhmer ? 'ការគ្រប់គ្រងអ្នកប្រើប្រាស់' : 'User Management'}
          </h1>
          <p>{isKhmer ? 'មើល ត្រួតពិនិត្យ ផ្អាក ឬបិទគណនីអតិថិជន និងអ្នកលក់' : 'View, moderate, suspend, or ban customer and seller accounts'}</p>
        </div>
        <button className="admin-btn secondary" onClick={fetchUsers} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiRefreshCw className={loading ? 'spin' : ''} /> {isKhmer ? 'ផ្ទុកឡើងវិញ' : 'Refresh'}
        </button>
      </div>


      {/* Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 22 }}>
        <div className="admin-card" style={{ padding: 18, borderLeft: '4px solid #8B5CF6' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', fontWeight: 700 }}>{isKhmer ? 'អ្នកប្រើប្រាស់សរុប' : 'TOTAL USERS'}</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#fff', marginTop: 4 }}>{totalUsers}</div>
          <div style={{ fontSize: '0.75rem', color: '#8B5CF6', marginTop: 2 }}>{sellersCount} {isKhmer ? 'អ្នកលក់ផ្ទៀងផ្ទាត់' : 'Verified Sellers'}</div>
        </div>

        <div className="admin-card" style={{ padding: 18, borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', fontWeight: 700 }}>{isKhmer ? 'គណនីសកម្ម' : 'ACTIVE USERS'}</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#10B981', marginTop: 4 }}>{activeCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: 2 }}>{isKhmer ? 'ដំណើរការធម្មតា' : 'In good standing'}</div>
        </div>

        <div className="admin-card" style={{ padding: 18, borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', fontWeight: 700 }}>{isKhmer ? 'គណនីផ្អាក' : 'SUSPENDED'}</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#F59E0B', marginTop: 4 }}>{suspendedCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: 2 }}>{isKhmer ? 'ការរឹតបន្តឹងបណ្តោះអាសន្ន' : 'Temporary restriction'}</div>
        </div>

        <div className="admin-card" style={{ padding: 18, borderLeft: '4px solid #EF4444' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', fontWeight: 700 }}>{isKhmer ? 'គណនីត្រូវហាមឃាត់' : 'BANNED'}</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#EF4444', marginTop: 4 }}>{bannedCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: 2 }}>{isKhmer ? 'ការក្លែងបន្លំ / បំពាន' : 'Fraud / Violations'}</div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="admin-card" style={{ padding: 16, marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 380 }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
            <input
              type="text"
              placeholder={isKhmer ? 'ស្វែងរកតាមឈ្មោះ អ៊ីមែល ឬ ID...' : 'Search by name, email, or ID...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="admin-input"
              style={{ paddingLeft: 36, width: '100%' }}
            />
          </div>

          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['ALL', 'ACTIVE', 'SUSPENDED', 'BANNED'].map(st => {
              const label = st === 'ALL' ? (isKhmer ? 'ទាំងអស់' : 'ALL')
                : st === 'ACTIVE' ? (isKhmer ? 'សកម្ម' : 'ACTIVE')
                : st === 'SUSPENDED' ? (isKhmer ? 'បានផ្អាក' : 'SUSPENDED')
                : (isKhmer ? 'បានហាមឃាត់' : 'BANNED');

              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 18,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    border: '1px solid',
                    cursor: 'pointer',
                    background: statusFilter === st ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
                    borderColor: statusFilter === st ? '#8B5CF6' : 'rgba(255,255,255,0.1)',
                    color: statusFilter === st ? '#C4B5FD' : 'var(--admin-text-muted)'
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="admin-input"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <option value="ALL">{isKhmer ? 'គ្រប់តួនាទី' : 'All Roles'}</option>
            <option value="BUYER">{isKhmer ? 'អ្នកទិញ' : 'Buyers'}</option>
            <option value="SELLER">{isKhmer ? 'អ្នកលក់' : 'Sellers'}</option>
            <option value="ADMIN">{isKhmer ? 'អ្នកគ្រប់គ្រង' : 'Admins'}</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>{isKhmer ? 'អ្នកប្រើប្រាស់' : 'User'}</th>
              <th>{isKhmer ? 'តួនាទី' : 'Role'}</th>
              <th>{isKhmer ? 'ការបញ្ជាទិញ / ចំណាយ' : 'Orders / Spent'}</th>
              <th>{isKhmer ? 'កាលបរិច្ឆេទចុះឈ្មោះ' : 'Registered'}</th>
              <th>{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
              <th style={{ textAlign: 'right', paddingRight: 20 }}>{isKhmer ? 'សកម្មភាព' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>
                  <FiRefreshCw className="spin" style={{ marginRight: 8 }} /> {isKhmer ? 'កំពុងផ្ទុកទិន្នន័យអ្នកប្រើប្រាស់...' : 'Loading users...'}
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>
                  {isKhmer ? 'រកមិនឃើញអ្នកប្រើប្រាស់ដែលត្រូវនឹងការច្រោះទេ។' : 'No users found matching filters.'}
                </td>
              </tr>
            ) : (
              filteredUsers.map(u => {
                const isSuspended = u.status === 'SUSPENDED';
                const isBanned = u.status === 'BANNED';
                const isActive = !isSuspended && !isBanned;

                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: u.role === 'ADMIN' ? 'linear-gradient(135deg, #EF4444, #DC2626)' :
                                      u.role === 'SELLER' ? 'linear-gradient(135deg, #3B82F6, #1D4ED8)' :
                                      'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                          color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: '0.9rem'
                        }}>
                          {(u.name || u.email || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#FFF', fontSize: '0.88rem' }}>
                            {u.name || 'Anonymous User'}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--admin-text-muted)' }}>
                            {u.email} (ID: #{u.id})
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span style={{
                        padding: '3px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 800,
                        background: u.role === 'ADMIN' ? 'rgba(239, 68, 68, 0.2)' :
                                    u.role === 'SELLER' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                        color: u.role === 'ADMIN' ? '#FCA5A5' :
                               u.role === 'SELLER' ? '#93C5FD' : '#C4B5FD',
                        border: `1px solid ${u.role === 'ADMIN' ? 'rgba(239,68,68,0.4)' : u.role === 'SELLER' ? 'rgba(59,130,246,0.4)' : 'rgba(139,92,246,0.4)'}`
                      }}>
                        {u.role}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFF' }}>
                        {u.orderCount || 0} Orders
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#10B981' }}>
                        ${Number(u.totalSpent || 0).toFixed(2)} spent
                      </div>
                    </td>

                    <td style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                    </td>

                    <td>
                      <span style={{
                        padding: '3px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 800,
                        background: isActive ? 'rgba(16, 185, 129, 0.15)' : isSuspended ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: isActive ? '#10B981' : isSuspended ? '#F59E0B' : '#EF4444',
                        border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.3)' : isSuspended ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                      }}>
                        {u.status || 'ACTIVE'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right', paddingRight: 20 }}>
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        <button
                          className="admin-action-btn edit"
                          title="View User Details"
                          onClick={() => setSelectedUser(u)}
                          style={{ color: '#8B5CF6', borderColor: 'rgba(139,92,246,0.3)' }}
                        >
                          <FiEye size={14} />
                        </button>

                        {isActive && (
                          <button
                            title="Suspend User (Temporary)"
                            onClick={() => handleUpdateStatus(u, 'SUSPENDED')}
                            disabled={actionLoadingId === u.id}
                            style={{
                              padding: '4px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800,
                              background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B',
                              border: '1px solid rgba(245, 158, 11, 0.4)', cursor: 'pointer'
                            }}
                          >
                            Suspend
                          </button>
                        )}

                        {isSuspended && (
                          <button
                            title="Activate User"
                            onClick={() => handleUpdateStatus(u, 'ACTIVE')}
                            disabled={actionLoadingId === u.id}
                            style={{
                              padding: '4px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800,
                              background: 'rgba(16, 185, 129, 0.15)', color: '#10B981',
                              border: '1px solid rgba(16, 185, 129, 0.4)', cursor: 'pointer'
                            }}
                          >
                            Unsuspend
                          </button>
                        )}

                        {!isBanned && (
                          <button
                            title="Ban User (Permanent)"
                            onClick={() => handleUpdateStatus(u, 'BANNED')}
                            disabled={actionLoadingId === u.id}
                            style={{
                              padding: '4px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800,
                              background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444',
                              border: '1px solid rgba(239, 68, 68, 0.4)', cursor: 'pointer'
                            }}
                          >
                            Ban
                          </button>
                        )}

                        {isBanned && (
                          <button
                            title="Unban User"
                            onClick={() => handleUpdateStatus(u, 'ACTIVE')}
                            disabled={actionLoadingId === u.id}
                            style={{
                              padding: '4px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800,
                              background: 'rgba(16, 185, 129, 0.15)', color: '#10B981',
                              border: '1px solid rgba(16, 185, 129, 0.4)', cursor: 'pointer'
                            }}
                          >
                            Unban
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
          }}
          onClick={(e) => e.target === e.currentTarget && setSelectedUser(null)}
        >
          <div style={{
            background: 'var(--admin-card-bg, #1a1f3a)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20, width: '100%', maxWidth: 520,
            padding: 24, position: 'relative', color: '#FFF'
          }}>
            <button
              onClick={() => setSelectedUser(null)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-muted)' }}
            >
              <FiX size={20} />
            </button>

            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiUsers color="#8B5CF6" /> User Account Details
            </h3>

            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#8B5CF6', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem' }}>
                  {(selectedUser.name || selectedUser.email || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem' }}>{selectedUser.name || 'Anonymous User'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>{selectedUser.email}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.82rem' }}>
                <div><strong>User ID:</strong> #{selectedUser.id}</div>
                <div><strong>Role:</strong> {selectedUser.role}</div>
                <div><strong>Status:</strong> {selectedUser.status || 'ACTIVE'}</div>
                <div><strong>Joined:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}</div>
                <div><strong>Total Orders:</strong> {selectedUser.orderCount || 0}</div>
                <div><strong>Total Spent:</strong> ${Number(selectedUser.totalSpent || 0).toFixed(2)}</div>
                {selectedUser.sellerBalance != null && (
                  <div><strong>Seller Balance:</strong> ${Number(selectedUser.sellerBalance).toFixed(2)}</div>
                )}
                {selectedUser.storeName && (
                  <div><strong>Store:</strong> {selectedUser.storeName}</div>
                )}
              </div>
            </div>

            {/* Moderation Controls in Modal */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {selectedUser.status !== 'SUSPENDED' && (
                <button
                  onClick={() => handleUpdateStatus(selectedUser, 'SUSPENDED')}
                  style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#F59E0B', color: '#000', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Suspend User
                </button>
              )}
              {selectedUser.status !== 'BANNED' && (
                <button
                  onClick={() => handleUpdateStatus(selectedUser, 'BANNED')}
                  style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#EF4444', color: '#FFF', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Ban User
                </button>
              )}
              {selectedUser.status !== 'ACTIVE' && (
                <button
                  onClick={() => handleUpdateStatus(selectedUser, 'ACTIVE')}
                  style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#10B981', color: '#FFF', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Activate User
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
