import React, { useState, useEffect } from 'react';
import { chat as chatApi, orders as ordersApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FiX, FiMessageSquare, FiClock, FiChevronRight, FiShield, FiUser, FiCheckCircle, FiHelpCircle } from 'react-icons/fi';
import SupportChatModal from './SupportChatModal';

const UserChatHistoryModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { isKhmer } = useLanguage();
  const [chatsByOrder, setChatsByOrder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isDetailChatOpen, setIsDetailChatOpen] = useState(false);

  // Unread read map — in state so badge disappears immediately on click
  const [userReadMap, setUserReadMap] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user_chat_read_map') || '{}'); } catch (_) { return {}; }
  });

  const markUserRead = (orderId, msgs) => {
    if (!orderId) return;
    const msgsList = Array.isArray(msgs) ? msgs : [];
    const last = msgsList[msgsList.length - 1];
    const marker = last ? (last.id || last.createdAt) : 'read';
    const contentMarker = last ? `${last.senderRole}__${(last.content || '').trim()}` : '';

    setUserReadMap(prev => {
      const updated = {
        ...prev,
        [orderId]: marker,
        [`${orderId}_content`]: contentMarker
      };
      localStorage.setItem('user_chat_read_map', JSON.stringify(updated));
      window.dispatchEvent(new Event('user_chat_read_updated'));
      return updated;
    });
  };

  const fetchChatHistory = async () => {
    setLoading(true);
    const orderMap = {};

    const isDup = (list, msg) => {
      return list.some(existing => {
        if (existing.id && msg.id && String(existing.id) === String(msg.id)) return true;
        const sameRole = (existing.senderRole || '') === (msg.senderRole || '');
        const sameContent = (existing.content || '').trim() === (msg.content || '').trim();
        return sameRole && sameContent;
      });
    };

    // 1. LocalStorage collection
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('chat_messages_order_')) {
          const ordId = key.replace('chat_messages_order_', '');
          try {
            const msgs = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(msgs) && msgs.length > 0) {
              const clean = [];
              msgs.forEach(m => {
                if (!isDup(clean, m)) clean.push(m);
              });
              orderMap[ordId] = clean;
            }
          } catch (e) {
            // parse error ignore
          }
        }
      }
    } catch (e) {
      // localStorage read error ignore
    }

    // 2. API collection
    try {
      const res = await chatApi.getUserMessages();
      const list = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
      list.forEach(msg => {
        if (msg.orderId) {
          if (!orderMap[msg.orderId]) {
            orderMap[msg.orderId] = [];
          }
          // avoid duplicates
          if (!isDup(orderMap[msg.orderId], msg)) {
            orderMap[msg.orderId].push(msg);
          }
        }
      });
    } catch (err) {
      // API fallback
    }

    // Group into structured list sorted by newest message
    const list = Object.keys(orderMap).map(orderId => {
      const msgs = orderMap[orderId].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const lastMsg = msgs[msgs.length - 1];
      const hasAdminReply = msgs.some(m => m.senderRole === 'ADMIN');
      return {
        orderId,
        messages: msgs,
        messagesCount: msgs.length,
        lastMessage: lastMsg,
        hasAdminReply,
        updatedAt: lastMsg?.createdAt || new Date().toISOString()
      };
    }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    setChatsByOrder(list);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchChatHistory();
    }
  }, [isOpen]);

  // Listen for storage events so new admin messages show badge immediately
  useEffect(() => {
    if (!isOpen) return;
    const onStorage = (e) => {
      if (!e.key || e.key.startsWith('chat_messages_') || e.key.startsWith('support_messages_')) {
        fetchChatHistory();
      }
    };
    const onCustomStorage = () => fetchChatHistory();
    window.addEventListener('storage', onStorage);
    window.addEventListener('storage', onCustomStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('storage', onCustomStorage);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenOrderChat = (orderId, msgs) => {
    setSelectedOrderId(orderId);
    setIsDetailChatOpen(true);
    markUserRead(orderId, msgs);
  };

  return (
    <>
      {/* Modal Backdrop */}
      <div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(6px)',
          zIndex: 1080,
        }}
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '92%',
          maxWidth: '520px',
          maxHeight: '85vh',
          backgroundColor: 'var(--card-bg)',
          borderRadius: '20px',
          zIndex: 1081,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.25s ease-out'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #FF4785 0%, #8B5CF6 100%)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <FiMessageSquare size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                {isKhmer ? 'ប្រវត្តិសន្ទនាជំនួយ' : 'Support Chat History'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.9 }}>
                {isKhmer ? 'ការសន្ទនារបស់អ្នកជាមួយផ្នែកជំនួយ Saby Support' : 'Your conversations with Saby Support Admin'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* List Content */}
        <div style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto',
          background: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: '40px 0' }}>
              Loading support chats...
            </div>
          ) : chatsByOrder.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              background: 'var(--card-bg)',
              borderRadius: '16px',
              border: '1px dashed var(--border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '54px', height: '54px', borderRadius: '50%',
                background: 'var(--primary-light)', color: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem'
              }}>
                <FiHelpCircle />
              </div>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                {isKhmer ? 'មិនទាន់មានប្រវត្តិសន្ទនានៅឡើយទេ' : 'No Chat History Yet'}
              </h4>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-light)', maxWidth: '320px', lineHeight: 1.5 }}>
                {isKhmer 
                  ? 'នៅពេលអ្នកទំនាក់ទំនងផ្នែកជំនួយលើការបញ្ជាទិញណាមួយ សាររបស់អ្នក និងការឆ្លើយតបរបស់អ្នកគ្រប់គ្រងនឹងបង្ហាញនៅទីនេះ។'
                  : 'When you contact support on any order, your messages and admin replies will appear here.'}
              </p>
            </div>
          ) : (
            chatsByOrder.map((chat) => {
              const isAdminLast = chat.lastMessage?.senderRole === 'ADMIN';
              const readMarker = userReadMap[chat.orderId];
              const contentMarker = userReadMap[`${chat.orderId}_content`];
              const msgs = chat.messages || [];

              let unreadCount = 0;

              if (!readMarker && !contentMarker) {
                if (isAdminLast) {
                  for (let i = msgs.length - 1; i >= 0; i--) {
                    if (msgs[i].senderRole === 'ADMIN') unreadCount++;
                    else break;
                  }
                }
              } else {
                let readIdx = msgs.findIndex(m => m && (String(m.id) === String(readMarker) || String(m.createdAt) === String(readMarker)));
                if (readIdx === -1 && contentMarker) {
                  readIdx = msgs.findIndex(m => m && `${m.senderRole}__${(m.content || '').trim()}` === contentMarker);
                }

                if (readIdx !== -1) {
                  for (let i = readIdx + 1; i < msgs.length; i++) {
                    if (msgs[i].senderRole === 'ADMIN') unreadCount++;
                  }
                } else {
                  unreadCount = 0;
                }
              }

              const isUnread = unreadCount > 0;

              return (
                <div
                  key={chat.orderId}
                  onClick={() => handleOpenOrderChat(chat.orderId, chat.messages)}
                  style={{
                    background: 'var(--card-bg)',
                    borderRadius: '16px',
                    padding: '16px',
                    border: '1px solid var(--border)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(255,71,133,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        padding: '4px 10px',
                        borderRadius: '9999px'
                      }}>
                        Order #{chat.orderId}
                      </span>
                      {isUnread ? (
                        <span style={{
                          background: '#FF2B6D',
                          color: '#fff',
                          fontWeight: 900,
                          fontSize: '0.75rem',
                          minWidth: 22,
                          height: 22,
                          borderRadius: '50%',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(255,43,109,0.5)',
                          lineHeight: 1
                        }}>
                          {unreadCount}
                        </span>
                      ) : chat.hasAdminReply ? (
                        <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                          <FiShield style={{ marginRight: '3px' }} /> {isKhmer ? 'បានឆ្លើយតប' : 'Admin Replied'}
                        </span>
                      ) : null}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: isUnread ? '#FF2B6D' : 'var(--text-lighter)', fontWeight: isUnread ? 800 : 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FiClock size={12} />
                      {new Date(chat.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </div>
                  </div>

                  <div style={{
                    fontSize: '0.88rem',
                    color: 'var(--text)',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    background: isUnread ? 'rgba(255,71,133,0.08)' : 'var(--bg-secondary)',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    borderLeft: isAdminLast ? (isUnread ? '4px solid #FF2B6D' : '3px solid var(--success)') : '3px solid var(--primary)'
                  }}>
                    <span style={{ fontWeight: 800, color: isUnread ? '#FF2B6D' : (isAdminLast ? 'var(--success)' : 'var(--primary)'), marginRight: '6px' }}>
                      {isAdminLast ? (isKhmer ? 'ផ្នែកជំនួយ:' : 'Support Admin:') : (isKhmer ? 'អ្នក:' : 'You:')}
                    </span>
                    {chat.lastMessage?.content || (isKhmer ? 'ការសន្ទនាបានចាប់ផ្ដើម' : 'Conversation started')}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '2px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 600 }}>
                      {chat.messagesCount} {isKhmer ? 'សារ' : (chat.messagesCount === 1 ? 'message' : 'messages')}
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: isUnread ? '#FF2B6D' : 'var(--primary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      {isKhmer ? 'បើកការសន្ទនា' : 'Open Chat'} <FiChevronRight size={14} />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Individual Order Chat Modal */}
      {selectedOrderId && (
        <SupportChatModal
          isOpen={isDetailChatOpen}
          onClose={() => {
            setIsDetailChatOpen(false);
            fetchChatHistory();
          }}
          orderId={selectedOrderId}
        />
      )}
    </>
  );
};

export default UserChatHistoryModal;
