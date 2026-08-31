import React, { useState, useEffect, useRef } from 'react';
import { 
  FiEye, FiShoppingBag, FiTrash2, FiSearch, FiX, FiChevronDown, FiChevronUp, 
  FiFileText, FiMessageSquare, FiSend, FiSave, FiCheck, FiUser, FiShield, FiDownload, FiPackage,
  FiCheckCircle, FiAlertTriangle, FiRefreshCw
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { admin as adminApi, orders as ordersApi, chat as chatApi } from '../../api/client';
import toast from 'react-hot-toast';
import ConfirmCancelOrderModal from '../../components/ConfirmCancelOrderModal';
import { useLanguage } from '../../context/LanguageContext';

const getStatusBadge = (status) => ({
  COMPLETED: 'completed', PROCESSING: 'processing',
  CANCELLED: 'cancelled', PENDING: 'pending', SHIPPED: 'shipped',
}[status] || 'pending');

/*  Admin Note Component inside Expanded Row  */
const AdminNoteSection = ({ orderId, note, onSaveNote }) => {
  const [currentNote, setCurrentNote] = useState(note || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setCurrentNote(note || '');
  }, [note]);

  const handleSave = () => {
    setIsSaving(true);
    onSaveNote(orderId, currentNote);
    setTimeout(() => {
      setIsSaving(false);
      toast.success(`Admin note saved for Order #${orderId}`);
    }, 300);
  };

  return (
    <div style={{
      marginTop: '16px',
      padding: '14px 16px',
      background: 'rgba(30, 41, 59, 0.6)',
      borderRadius: '10px',
      border: '1px solid rgba(123, 111, 255, 0.2)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#A78BFA' }}>
          <FiFileText size={15} />
          <span>Internal Admin Notes & Instructions</span>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="admin-btn admin-btn-sm"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: 'white',
            border: 'none',
            fontSize: '0.78rem',
            padding: '4px 12px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          {isSaving ? <FiCheck size={13} /> : <FiSave size={13} />}
          <span>{isSaving ? 'Saved!' : 'Save Note'}</span>
        </button>
      </div>
      <textarea
        value={currentNote}
        onChange={(e) => setCurrentNote(e.target.value)}
        placeholder="Type internal admin notes for this order (e.g. Account credentials verified, payment ref #1234, manual delivery note)..."
        style={{
          width: '100%',
          minHeight: '60px',
          padding: '8px 12px',
          borderRadius: '6px',
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#F8FAFC',
          fontSize: '0.85rem',
          resize: 'vertical',
          outline: 'none',
          fontFamily: 'inherit'
        }}
      />
    </div>
  );
};

/*  Expanded order detail row with product images & Admin Notes  */
const OrderExpandedRow = ({ order, note, onSaveNote, onOpenChat }) => {
  const items = order.items || [];
  return (
    <tr>
      <td colSpan="8" style={{ padding: 0, background: 'rgba(123,111,255,0.04)' }}>
        <div style={{ padding: '16px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Order Items Details
            </div>
            <button
              onClick={() => onOpenChat(order)}
              className="admin-btn admin-btn-sm"
              style={{
                background: 'rgba(123, 111, 255, 0.15)',
                color: '#7B6FFF',
                border: '1px solid rgba(123, 111, 255, 0.3)',
                fontSize: '0.8rem',
                padding: '4px 12px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <FiMessageSquare size={13} />
              <span>Reply Customer Support</span>
            </button>
          </div>

          {items.length === 0 ? (
            <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>No item details available.</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {items.map((item, idx) => {
                const imgUrl = item.product?.imageUrl || item.productImageUrl || item.imageUrl || null;
                const name   = item.product?.name    || item.productName    || `Product #${idx + 1}`;
                const qty    = item.quantity ?? 1;
                const price  = item.price ?? item.unitPrice ?? 0;
                return (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 10, padding: '10px 14px', minWidth: 220, flex: '0 1 auto',
                  }}>
                    {/* Product image */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 8,
                      overflow: 'hidden', flexShrink: 0,
                      background: 'rgba(123,111,255,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {imgUrl ? (
                        <img src={imgUrl} alt={name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#7B6FFF' }}>
                          {name[0]}
                        </span>
                      )}
                    </div>
                    {/* Info */}
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem' }}>{name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: 2 }}>
                        Qty: {qty} · ${Number(price).toFixed(2)} each
                      </div>
                      {(item.account?.email || item.deliveredAccounts?.[0]?.accountEmail) && (
                        <div style={{ fontSize: '0.72rem', color: '#A78BFA', marginTop: 3, fontFamily: 'monospace' }}>
                          {item.account?.email || item.deliveredAccounts?.[0]?.accountEmail}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Admin Note Section */}
          <AdminNoteSection orderId={order.id} note={note} onSaveNote={onSaveNote} />

          {/* Order meta footer */}
          <div style={{ display: 'flex', gap: 24, marginTop: 16, fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
            <span>{new Date(order.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            <span>Total: <strong style={{ color: '#fff' }}>${Number(order.totalAmount || 0).toFixed(2)}</strong></span>
            <span>Customer: {order.customerEmail || 'Guest'}</span>
            {order.paymentMethod && <span>Payment: {order.paymentMethod}</span>}
          </div>
        </div>
      </td>
    </tr>
  );
};

/*  Inline Admin Support Reply Modal Component  */
const AdminSupportReplyModal = ({ isOpen, onClose, order }) => {
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const orderId = order?.id;

  const loadMessages = async () => {
    if (!orderId) return;
    try {
      const res = await chatApi.getMessages(orderId);
      const fetched = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setMessages(fetched);
    } catch (e) {
      console.warn("Error fetching chat messages for order " + orderId, e);
    }
  };

  useEffect(() => {
    if (isOpen && orderId) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, orderId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendReply = async (e) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !orderId) return;

    setSending(true);
    const text = replyText.trim();
    setReplyText('');

    try {
      await chatApi.sendMessage(orderId, text);
      toast.success('Admin reply sent to customer!');
      await loadMessages();
    } catch (err) {
      console.error('Error sending admin chat reply:', err);
      toast.error('Failed to send admin reply');
    } finally {
      setSending(false);
    }
  };

  const quickReplies = [
    "Your payment has been verified successfully!",
    "Your digital account credentials are available in your Order Details.",
    "Please send a screenshot of your KHQR Bakong payment receipt.",
    "Our support team is checking this issue right now."
  ];

  if (!isOpen || !order) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#1E293B',
        border: '1px solid rgba(123, 111, 255, 0.25)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '560px',
        height: '600px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(15, 23, 42, 0.5)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiMessageSquare color="#7B6FFF" /> Admin Support Reply — Order #{orderId}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
              Customer: {order.customerEmail || 'Customer'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={async () => {
                if (window.confirm(`Are you sure you want to delete the chat thread for Order #${orderId}?`)) {
                  try {
                    await chatApi.deleteOrderChat(orderId);
                  } catch (_) {}
                  const lk = `chat_messages_order_${orderId}`;
                  localStorage.removeItem(lk);
                  localStorage.removeItem(`chat_messages_${orderId}`);
                  window.dispatchEvent(new StorageEvent('storage', { key: lk }));
                  toast.success(`Chat thread deleted for Order #${orderId}`);
                  setMessages([]);
                  onClose();
                }
              }}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#EF4444',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
              title="Delete Chat Thread"
            >
              <FiTrash2 size={13} /> Delete Chat
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#94A3B8',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto',
          background: 'rgba(15, 23, 42, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {messages.map((msg, idx) => {
            const isAdmin = msg.senderRole === 'ADMIN';
            return (
              <div
                key={msg.id || idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isAdmin ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontSize: '0.72rem', color: '#94A3B8' }}>
                  {isAdmin ? (
                    <>
                      <span>You (Support Admin)</span>
                      <FiShield color="#7B6FFF" />
                    </>
                  ) : (
                    <>
                      <FiUser />
                      <span style={{ fontWeight: 700 }}>{msg.senderName || msg.senderEmail || 'Customer'}</span>
                    </>
                  )}
                  <span>• {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div style={{
                  maxWidth: '82%',
                  padding: '10px 14px',
                  borderRadius: isAdmin ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                  background: isAdmin ? 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' : 'rgba(30, 41, 59, 0.9)',
                  color: '#FFF',
                  border: isAdmin ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '0.9rem',
                  lineHeight: '1.45'
                }}>
                  {msg.content}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Reply Presets */}
        <div style={{
          padding: '8px 16px',
          background: 'rgba(15, 23, 42, 0.6)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          gap: '6px',
          overflowX: 'auto'
        }}>
          {quickReplies.map((qr, qidx) => (
            <button
              key={qidx}
              type="button"
              onClick={() => setReplyText(qr)}
              style={{
                whiteSpace: 'nowrap',
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: '12px',
                background: 'rgba(123, 111, 255, 0.1)',
                border: '1px solid rgba(123, 111, 255, 0.25)',
                color: '#A78BFA',
                cursor: 'pointer'
              }}
            >
              {qr.slice(0, 30)}...
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSendReply} style={{ padding: '14px 16px', background: '#1E293B', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Type admin response to customer..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(15, 23, 42, 0.8)',
              color: '#FFF',
              fontSize: '0.88rem',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={sending || !replyText.trim()}
            style={{
              borderRadius: '20px',
              padding: '0 18px',
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              color: '#FFF',
              border: 'none',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: sending || !replyText.trim() ? 'not-allowed' : 'pointer',
              opacity: sending || !replyText.trim() ? 0.6 : 1
            }}
          >
            <FiSend size={14} /> Reply
          </button>
        </form>
      </div>
    </div>
  );
};

/*  Inline Manual Account Delivery Modal  */
const ManualAccountDeliverModal = ({ isOpen, onClose, order, onDeliverSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (order) {
      const stored = localStorage.getItem(`order_account_delivery_${order.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setEmail(parsed.email || '');
          setPassword(parsed.password || '');
          setNote(parsed.note || '');
        } catch (e) {}
      } else {
        setEmail(`${order.items?.[0]?.product?.name?.toLowerCase().replace(/\s+/g, '') || 'account'}@sabyshop.com`);
        setPassword('Pass' + Math.floor(1000 + Math.random() * 9000));
        setNote('Standard Digital Account - Instant 0-second delivery');
      }
    }
  }, [order]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || submitting) return;

    if (order?.status && order.status !== 'PROCESSING') {
      toast.error('Manual account delivery is only allowed for orders in PROCESSING status');
      onClose();
      return;
    }

    setSubmitting(true);
    const delivery = { email: email.trim(), password: password.trim(), note: note.trim() };
    localStorage.setItem(`order_account_delivery_${order.id}`, JSON.stringify(delivery));

    const deliveryMsgText = `Your account has been delivered!\nEmail: ${delivery.email}\nPassword: ${delivery.password}${delivery.note ? `\nNote: ${delivery.note}` : ''}`;

    try {
      await chatApi.sendMessage(order.id, deliveryMsgText);
    } catch (e) {
      console.warn('Error sending delivery message:', e);
    }

    try {
      await adminApi.updateOrderStatus(order.id, 'COMPLETED');
    } catch (e) {
      console.warn('Error updating status:', e);
    }

    setSubmitting(false);
    toast.success(`Account delivered for Order #${order.id} - Customer notified via chat!`);
    onDeliverSuccess(order.id, delivery);
    onClose();
  };

  if (!isOpen || !order) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        background: '#1E293B', border: '1px solid rgba(123, 111, 255, 0.25)',
        borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '24px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiPackage color="#10B981" /> Manual Account Delivery — Order #{order.id}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><FiX size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#94A3B8', marginBottom: '4px', display: 'block' }}>Account Email</label>
            <input type="text" className="admin-input" style={{ width: '100%', padding: '10px 12px' }} value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#94A3B8', marginBottom: '4px', display: 'block' }}>Account Password</label>
            <input type="text" className="admin-input" style={{ width: '100%', padding: '10px 12px' }} value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#94A3B8', marginBottom: '4px', display: 'block' }}>Note / Instructions for Customer</label>
            <input type="text" className="admin-input" style={{ width: '100%', padding: '10px 12px' }} value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Profile 1 PIN 1234" />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="admin-btn admin-btn-sm" style={{ background: 'rgba(255,255,255,0.05)', color: '#94A3B8' }}>Cancel</button>
            <button type="submit" disabled={submitting} className="admin-btn admin-btn-primary admin-btn-sm" style={{ background: 'linear-gradient(135deg, #10B981, #059669)', border: 'none' }}>
              {submitting ? 'Delivering...' : 'Deliver Account to User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const OrdersManage = () => {
  const { isKhmer } = useLanguage();
  const [orders, setOrders]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [deleteTargetIds, setDeleteTargetIds]   = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting]           = useState(false);
  const [search, setSearch]               = useState('');
  const [statusFilter, setStatusFilter]   = useState('ALL');
  const [expandedRows, setExpandedRows]   = useState(new Set());
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  // Admin Notes state map { orderId: noteString }
  const [adminNotes, setAdminNotes]       = useState({});

  // Chat modal target order
  const [chatModalOrder, setChatModalOrder] = useState(null);

  // Manual delivery target order
  const [manualDeliverOrder, setManualDeliverOrder] = useState(null);

  const handleExportCSV = () => {
    if (orders.length === 0) {
      toast.error(isKhmer ? 'គ្មានទិន្នន័យបញ្ជាទិញដើម្បី Export ទេ' : 'No order data to export');
      return;
    }
    const headers = ['Order ID', 'Customer Email', 'Status', 'Total Amount ($)', 'Payment Method', 'Date', 'Items Count'];
    const rows = orders.map(o => [
      o.id,
      `"${o.customerEmail || 'Guest'}"`,
      o.status,
      Number(o.totalAmount || 0).toFixed(2),
      `"${o.paymentMethod || 'KHQR / ABA'}"`,
      `"${new Date(o.createdAt).toLocaleString()}"`,
      o.items?.length || 1
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `orders_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(isKhmer ? 'បានទាញយកឯកសារ CSV ជោគជ័យ!' : 'Exported orders CSV successfully!');
  };

  const handleManualDeliverSuccess = (orderId) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'COMPLETED' } : o));
  };

  const handleMarkCompleted = async (order) => {
    setUpdatingStatusId(order.id);
    try {
      await ordersApi.updateStatus(order.id, 'COMPLETED');
      toast.success(isKhmer ? `ការបញ្ជាទិញ #${order.id} ត្រូវបានសម្គាល់ថាបានបញ្ចប់!` : `Order #${order.id} marked as COMPLETED!`);
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'COMPLETED' } : o));
    } catch (e) {
      toast.error(isKhmer ? 'បរាជ័យក្នុងការកែប្រែស្ថានភាព' : 'Failed to update order status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleMarkProcessing = async (order) => {
    setUpdatingStatusId(order.id);
    try {
      await ordersApi.updateStatus(order.id, 'PROCESSING');
      toast.success(isKhmer ? `ការបញ្ជាទិញ #${order.id} ត្រូវបានកំណត់ជា PROCESSING!` : `Order #${order.id} set to PROCESSING!`);
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'PROCESSING' } : o));
    } catch (e) {
      toast.error(isKhmer ? 'បរាជ័យក្នុងការកែប្រែស្ថានភាព' : 'Failed to update order status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const loadAdminNotes = () => {
    const notes = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('admin_note_order_')) {
        const orderId = key.replace('admin_note_order_', '');
        notes[orderId] = localStorage.getItem(key);
      }
    }
    setAdminNotes(notes);
  };

  const handleSaveAdminNote = (orderId, noteContent) => {
    localStorage.setItem(`admin_note_order_${orderId}`, noteContent);
    setAdminNotes(prev => ({
      ...prev,
      [orderId]: noteContent
    }));
  };

  const fetchOrders = async () => {
    try {
      const cached = localStorage.getItem('admin_cached_orders');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOrders(parsed.sort((a, b) => Number(b.id || 0) - Number(a.id || 0)));
          setLoading(false);
        }
      }
    } catch (_) {}

    try {
      const res = await adminApi.getAllOrders();
      const fetched = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      const sorted = [...fetched].sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
      setOrders(sorted);
      localStorage.setItem('admin_cached_orders', JSON.stringify(sorted));
    } catch (err) {
      console.error("Error fetching admin orders from database", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchOrders(); 
    loadAdminNotes();
  }, []);

  const toggleExpand = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const isAllSelected = orders.length > 0 && orders.every(o => selectedOrderIds.includes(o.id));
  const toggleSelectAll = () => setSelectedOrderIds(isAllSelected ? [] : orders.map(o => o.id));
  const toggleSelectOrder = (id) =>
    setSelectedOrderIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const handleOpenSingleDelete = (id) => { setDeleteTargetIds([id]); setIsDeleteModalOpen(true); };
  const handleOpenBatchDelete = () => {
    if (selectedOrderIds.length === 0) return;
    setDeleteTargetIds(selectedOrderIds);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetIds?.length) return;
    setDeleting(true);
    try {
      for (const id of deleteTargetIds) await ordersApi.cancel(id).catch(() => null);
      toast.success(isKhmer ? `បានលុប ${deleteTargetIds.length} ការបញ្ជាទិញ` : `Deleted ${deleteTargetIds.length} order(s)`);
      setOrders(prev => prev.filter(o => !deleteTargetIds.includes(o.id)));
      setSelectedOrderIds(prev => prev.filter(id => !deleteTargetIds.includes(id)));
    } catch { toast.error(isKhmer ? 'បរាជ័យក្នុងការលុបការបញ្ជាទិញ' : 'Failed to delete orders'); }
    finally { setDeleting(false); setIsDeleteModalOpen(false); setDeleteTargetIds([]); }
  };

  const filtered = orders
    .filter(o => {
      const matchSearch =
        String(o.id).includes(search) ||
        (o.customerEmail || '').toLowerCase().includes(search.toLowerCase()) ||
        (o.status || '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));

  const processingCount = orders.filter(o => o.status === 'PROCESSING').length;
  const pendingCount    = orders.filter(o => o.status === 'PENDING').length;

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /></div>;

  return (
    <div className="admin-animate-in">
      <div className="admin-page-header">
        <div className="admin-page-title"><FiShoppingBag /> {isKhmer ? 'ការគ្រប់គ្រងការបញ្ជាទិញ' : 'Order Fulfillment'}</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={handleExportCSV}
            className="admin-btn admin-btn-sm"
            style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <FiDownload size={13} /> {isKhmer ? 'ទាញយក CSV' : 'Export CSV'}
          </button>
          <div style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)', fontSize: '0.9rem' }} />
            <input className="admin-input" placeholder={isKhmer ? 'ស្វែងរកការបញ្ជាទិញ…' : 'Search orders…'} style={{ paddingLeft: 36, width: 200 }}
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Quick Status Alert Banners */}
      {processingCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '12px 18px', borderRadius: '10px', marginBottom: '16px',
          background: 'rgba(251, 191, 36, 0.12)', border: '1px solid rgba(251, 191, 36, 0.35)'
        }}>
          <FiAlertTriangle size={18} color="#FBBF24" />
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 800, color: '#FBBF24', fontSize: '0.92rem' }}>
              {isKhmer ? `${processingCount} ការបញ្ជាទិញ ត្រូវការប្រគល់គណនីផ្ទាល់ដៃ` : `${processingCount} Order${processingCount > 1 ? 's' : ''} Need Manual Delivery`}
            </span>
            <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.82rem', marginLeft: '10px' }}>
              {isKhmer ? 'ទទួលបានការទូទាត់ហើយ ប៉ុន្តែស្តុកអស់ — សូមប្រគល់គណនីជូនអតិថិជន' : 'Payment received but stock ran out — deliver accounts manually'}
            </span>
          </div>
          <button
            onClick={() => setStatusFilter(statusFilter === 'PROCESSING' ? 'ALL' : 'PROCESSING')}
            className="admin-btn admin-btn-sm"
            style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.4)', fontSize: '0.78rem' }}
          >
            {statusFilter === 'PROCESSING' ? (isKhmer ? 'បង្ហាញទាំងអស់' : 'Show All') : (isKhmer ? 'មើល PROCESSING' : 'View PROCESSING')}
          </button>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'].map(s => {
          const tabLabel = s === 'ALL' ? (isKhmer ? `ទាំងអស់ (${orders.length})` : `All (${orders.length})`)
            : s === 'PENDING' ? (isKhmer ? `រង់ចាំ (${orders.filter(o => o.status === s).length})` : `PENDING (${orders.filter(o => o.status === s).length})`)
            : s === 'PROCESSING' ? (isKhmer ? `កំពុងដំណើរការ (${orders.filter(o => o.status === s).length})` : `PROCESSING (${orders.filter(o => o.status === s).length})`)
            : s === 'COMPLETED' ? (isKhmer ? `បានបញ្ចប់ (${orders.filter(o => o.status === s).length})` : `COMPLETED (${orders.filter(o => o.status === s).length})`)
            : (isKhmer ? `បានបោះបង់ (${orders.filter(o => o.status === s).length})` : `CANCELLED (${orders.filter(o => o.status === s).length})`);

          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '5px 14px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700,
                border: '1px solid',
                cursor: 'pointer',
                background: statusFilter === s
                  ? (s === 'PROCESSING' ? 'rgba(251,191,36,0.25)' : s === 'COMPLETED' ? 'rgba(16,185,129,0.25)' : s === 'PENDING' ? 'rgba(99,102,241,0.25)' : s === 'CANCELLED' ? 'rgba(239,68,68,0.2)' : 'rgba(123,111,255,0.2)')
                  : 'transparent',
                borderColor: statusFilter === s
                  ? (s === 'PROCESSING' ? '#FBBF24' : s === 'COMPLETED' ? '#10B981' : s === 'PENDING' ? '#6366f1' : s === 'CANCELLED' ? '#EF4444' : '#7B6FFF')
                  : 'rgba(255,255,255,0.1)',
                color: statusFilter === s
                  ? (s === 'PROCESSING' ? '#FBBF24' : s === 'COMPLETED' ? '#10B981' : s === 'PENDING' ? '#A78BFA' : s === 'CANCELLED' ? '#EF4444' : '#A78BFA')
                  : 'var(--admin-text-muted)'
              }}
            >
              {tabLabel}
            </button>
          );
        })}
      </div>

      <div className="admin-card" style={{ overflowX: 'auto', padding: 0 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 36, paddingLeft: 20 }} />  {/* expand toggle */}
              <th>{isKhmer ? 'លេខកូដបញ្ជាទិញ' : 'Order ID'}</th>
              <th>{isKhmer ? 'ផលិតផល' : 'Products'}</th>
              <th>{isKhmer ? 'អតិថិជន' : 'Customer'}</th>
              <th>{isKhmer ? 'កាលបរិច្ឆេទ' : 'Date'}</th>
              <th>{isKhmer ? 'សរុប' : 'Total'}</th>
              <th>{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
              <th style={{ textAlign: 'right', paddingRight: 24 }}>{isKhmer ? 'សកម្មភាព' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o, idx) => {
              const isExpanded = expandedRows.has(o.id);
              const items = o.items || [];
              const hasNote = Boolean(adminNotes[o.id]);

              return (
                <React.Fragment key={o.id}>
                  <tr style={{
                    animation: `adminRowWave 0.4s ease both`,
                    animationDelay: `${idx * 60}ms`,
                  }}>
                    {/* Expand toggle */}
                    <td style={{ paddingLeft: 20, paddingRight: 0 }}>
                      <button
                        onClick={() => toggleExpand(o.id)}
                        style={{
                          width: 26, height: 26, borderRadius: 6,
                          border: '1px solid var(--admin-card-border)',
                          background: isExpanded ? 'rgba(123,111,255,0.15)' : 'transparent',
                          color: isExpanded ? '#7B6FFF' : 'var(--admin-text-muted)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', transition: 'all 0.2s',
                        }}
                        title={isExpanded ? 'Collapse' : 'Expand order details'}
                      >
                        {isExpanded ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />}
                      </button>
                    </td>

                    {/* Order ID & Note Badge */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700, color: '#fff' }}>#{o.id}</span>
                        {hasNote && (
                          <span
                            title={`Admin Note: ${adminNotes[o.id]}`}
                            style={{
                              background: 'rgba(167, 139, 250, 0.2)',
                              color: '#A78BFA',
                              border: '1px solid rgba(167, 139, 250, 0.4)',
                              borderRadius: '4px',
                              padding: '1px 5px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <FiFileText size={10} /> Note
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Product images preview */}
                    <td>
                      <div style={{ display: 'flex', gap: -4 }}>
                        {items.slice(0, 3).map((item, ii) => {
                          const img = item.product?.imageUrl || item.productImageUrl || item.imageUrl;
                          const name = item.product?.name || item.productName || 'P';
                          return (
                            <div key={ii} style={{
                              width: 30, height: 30, borderRadius: 7,
                              overflow: 'hidden', border: '2px solid var(--admin-sidebar-bg)',
                              background: 'rgba(123,111,255,0.15)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              marginLeft: ii > 0 ? -8 : 0, flexShrink: 0,
                            }}>
                              {img
                                ? <img src={img} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                                : <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#7B6FFF' }}>{name[0]}</span>
                              }
                            </div>
                          );
                        })}
                        {items.length > 3 && (
                          <div style={{
                            width: 30, height: 30, borderRadius: 7,
                            background: 'rgba(255,255,255,0.08)', border: '2px solid var(--admin-sidebar-bg)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginLeft: -8, fontSize: '0.65rem', fontWeight: 700, color: 'var(--admin-text-secondary)',
                          }}>+{items.length - 3}</div>
                        )}
                        {items.length === 0 && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>—</span>
                        )}
                      </div>
                    </td>

                    {/* Customer */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {(() => {
                          const custEmail = (o.customerEmail || '').toLowerCase().trim();
                          const custAvatar = o.customerAvatar || o.userAvatar || (custEmail ? (localStorage.getItem(`user_avatar_${custEmail}`) || localStorage.getItem(`userPhoto_${custEmail}`) || (localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')).email?.toLowerCase() === custEmail ? localStorage.getItem('userPhoto') : null)) : null);
                          return custAvatar ? (
                            <img src={custAvatar} alt="Customer Avatar" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                              {(o.customerEmail || 'G')[0].toUpperCase()}
                            </div>
                          );
                        })()}
                        <span style={{ color: 'var(--admin-text-secondary)', fontSize: '0.85rem', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {o.customerEmail || 'Guest'}
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td style={{ color: 'var(--admin-text-secondary)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                      {new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' '}
                      <span style={{ color: 'var(--admin-text-muted)' }}>
                        {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    {/* Total */}
                    <td style={{ fontWeight: 700, color: '#fff' }}>${Number(o.totalAmount || 0).toFixed(2)}</td>

                    {/* Status */}
                    <td><span className={`admin-badge ${getStatusBadge(o.status)}`}>{o.status}</span></td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right', paddingRight: 24 }}>
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>

                        {/* PROCESSING → Quick Mark Completed / Manual Deliver */}
                        {o.status === 'PROCESSING' && (
                          <>
                            <button
                              className="admin-action-btn edit"
                              title="Manual Account Deliver & Mark Completed"
                              onClick={() => setManualDeliverOrder(o)}
                              style={{ color: '#10B981', borderColor: 'rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.08)' }}
                            >
                              <FiPackage size={14} />
                            </button>
                            <button
                              title="Mark as COMPLETED"
                              onClick={() => handleMarkCompleted(o)}
                              disabled={updatingStatusId === o.id}
                              style={{
                                padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800,
                                background: 'rgba(16,185,129,0.15)', color: '#10B981',
                                border: '1px solid rgba(16,185,129,0.4)', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '4px',
                                opacity: updatingStatusId === o.id ? 0.6 : 1
                              }}
                            >
                              {updatingStatusId === o.id ? <FiRefreshCw size={11} /> : <FiCheckCircle size={11} />}
                              {updatingStatusId === o.id ? '...' : 'Complete'}
                            </button>
                          </>
                        )}

                        {/* PENDING → Mark as Processing */}
                        {o.status === 'PENDING' && (
                          <button
                            title="Mark as PROCESSING"
                            onClick={() => handleMarkProcessing(o)}
                            disabled={updatingStatusId === o.id}
                            style={{
                              padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800,
                              background: 'rgba(251,191,36,0.12)', color: '#FBBF24',
                              border: '1px solid rgba(251,191,36,0.3)', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: '4px',
                              opacity: updatingStatusId === o.id ? 0.6 : 1
                            }}
                          >
                            {updatingStatusId === o.id ? <FiRefreshCw size={11} /> : <FiAlertTriangle size={11} />}
                            {updatingStatusId === o.id ? '...' : 'Processing'}
                          </button>
                        )}


                        <button
                          className="admin-action-btn edit"
                          title="Reply Customer Support"
                          onClick={() => setChatModalOrder(o)}
                          style={{ color: '#7B6FFF', borderColor: 'rgba(123,111,255,0.3)' }}
                        >
                          <FiMessageSquare size={14} />
                        </button>
                        <Link to={`/orders/${o.id}`} className="admin-action-btn edit" title="View order">
                          <FiEye size={14} />
                        </Link>
                        <button className="admin-action-btn danger" title="Delete" onClick={() => handleOpenSingleDelete(o.id)}>
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded row with product images & Admin Notes */}
                  {isExpanded && (
                    <OrderExpandedRow
                      order={o}
                      note={adminNotes[o.id] || ''}
                      onSaveNote={handleSaveAdminNote}
                      onOpenChat={(targetOrder) => setChatModalOrder(targetOrder)}
                    />
                  )}
                </React.Fragment>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                  {search ? 'No orders match your search.' : 'No orders found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmCancelOrderModal
        isOpen={isDeleteModalOpen}
        orderId={deleteTargetIds.length === 1 ? deleteTargetIds[0] : null}
        selectedCount={deleteTargetIds.length}
        loading={deleting}
        onClose={() => { setIsDeleteModalOpen(false); setDeleteTargetIds([]); }}
        onConfirm={handleConfirmDelete}
      />

      {/* Admin Support Reply Modal */}
      <AdminSupportReplyModal
        isOpen={Boolean(chatModalOrder)}
        onClose={() => setChatModalOrder(null)}
        order={chatModalOrder}
      />

      {/* Manual Account Delivery Modal */}
      <ManualAccountDeliverModal
        isOpen={Boolean(manualDeliverOrder)}
        onClose={() => setManualDeliverOrder(null)}
        order={manualDeliverOrder}
        onDeliverSuccess={handleManualDeliverSuccess}
      />
    </div>
  );
};

export default OrdersManage;
