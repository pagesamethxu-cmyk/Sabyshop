import React, { useState, useEffect, useRef, useCallback } from 'react';
import { chat as chatApi, admin as adminApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  FiSend, FiSearch, FiRefreshCw, FiInbox,
  FiCheck, FiUser, FiShoppingBag,
  FiPackage, FiCheckCircle, FiX, FiExternalLink, FiMail,
  FiPaperclip, FiMoreVertical, FiTrash2, FiEdit2,
  FiPlay, FiPause, FiMic, FiMoon, FiSquare, FiImage, FiPhoneCall, FiShield,
  FiAlertTriangle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { MdStorefront, MdVerified } from 'react-icons/md';
import { normalizeImageUrl, isImageMedia } from '../../utils/imageUrl';

/*  Telegram Inline CSS & Animations  */
const ADMIN_CHAT_CSS = `
 @keyframes adminMsgSlideRight {
 from { opacity: 0; transform: translateX(16px) scale(0.97); }
 to { opacity: 1; transform: translateX(0) scale(1); }
 }
 @keyframes adminMsgSlideLeft {
 from { opacity: 0; transform: translateX(-16px) scale(0.97); }
 to { opacity: 1; transform: translateX(0) scale(1); }
 }
 @keyframes adminTypingDot {
 0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
 30% { transform: translateY(-5px); opacity: 1; }
 }
 @keyframes adminOnlinePulse {
 0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.55); }
 50% { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
 }
 .admin-msg-right { animation: adminMsgSlideRight 0.22s ease both; }
 .admin-msg-left { animation: adminMsgSlideLeft 0.22s ease both; }
 .admin-typing-dot {
 width: 7px; height: 7px; border-radius: 50%;
 background: rgba(255,255,255,0.4); display: inline-block;
 }
 .admin-typing-dot:nth-child(1) { animation: adminTypingDot 1.2s 0.0s infinite; }
 .admin-typing-dot:nth-child(2) { animation: adminTypingDot 1.2s 0.2s infinite; }
 .admin-typing-dot:nth-child(3) { animation: adminTypingDot 1.2s 0.4s infinite; }
 .admin-online-dot {
 width: 9px; height: 9px; border-radius: 50%; background: #22c55e;
 display: inline-block; flex-shrink: 0;
 animation: adminOnlinePulse 2s infinite;
 }
 .admin-quick-chip:hover {
 background: rgba(142, 68, 173, 0.35) !important;
 border-color: rgba(142, 68, 173, 0.7) !important;
 transform: translateY(-1px);
 }
 .admin-send-btn:hover:not(:disabled) {
 transform: scale(1.08);
 box-shadow: 0 6px 20px rgba(142, 68, 173, 0.6) !important;
 }
 .sidebar-del-btn:hover {
 background: rgba(239, 68, 68, 0.35) !important;
 transform: scale(1.1);
 }
`;

/*  Avatar Colour Pool  */
const AVATAR_COLORS = [
 'linear-gradient(135deg,#7B6FFF,#4f46e5)',
 'linear-gradient(135deg,#10B981,#059669)',
 'linear-gradient(135deg,#F59E0B,#D97706)',
 'linear-gradient(135deg,#EF4444,#DC2626)',
 'linear-gradient(135deg,#06B6D4,#0891B2)',
 'linear-gradient(135deg,#8B5CF6,#7C3AED)',
 'linear-gradient(135deg,#EC4899,#DB2777)',
];
const avatarColor = (name = '') =>
 AVATAR_COLORS[(name || 'A').charCodeAt(0) % AVATAR_COLORS.length];

const Avatar = ({ name = '?', size = 42, email = '', avatar = '' }) => {
 const custEmail = (email || '').toLowerCase().trim();
 let storedUser = null;
 try {
 const rawUser = localStorage.getItem('user');
 if (rawUser) storedUser = JSON.parse(rawUser);
 } catch (_) {}

 const storedAvatar = avatar || (custEmail ? (
 localStorage.getItem(`user_avatar_${custEmail}`) ||
 localStorage.getItem(`userPhoto_${custEmail}`) ||
 (storedUser && storedUser.email?.toLowerCase() === custEmail ? localStorage.getItem('userPhoto') : null)
 ) : null);

 if (storedAvatar) {
 return (
 <img
 src={storedAvatar}
 alt={name}
 style={{
 width: size, height: size, borderRadius: '50%',
 objectFit: 'cover', flexShrink: 0,
 border: '1.5px solid rgba(255,255,255,0.2)'
 }}
 />
 );
 }

 const initials = (name || '?')
 .split(' ')
 .map(n => n.charAt(0))
 .join('')
 .substring(0, 2)
 .toUpperCase();

 return (
 <div style={{
 width: size, height: size, borderRadius: '50%',
 background: avatarColor(name),
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 fontSize: size * 0.38, fontWeight: 900, color: '#ffffff',
 flexShrink: 0, userSelect: 'none',
 border: '1.5px solid rgba(255,255,255,0.15)'
 }}>
 {initials || '?'}
 </div>
 );
};

/*  Double Tick Component (Telegram Style)  */
const DoubleTick = ({ color = '#FFFFFF' }) => (
 <span style={{ display: 'inline-flex', gap: '-2px', marginLeft: 4, alignItems: 'center', opacity: 0.9 }}>
 <FiCheck size={12} color={color} />
 <FiCheck size={12} color={color} style={{ marginLeft: -7 }} />
 </span>
);

/*  Telegram Voice Message Player Component  */
const TelegramVoicePlayer = ({ audioUrl, duration = '0:01', isAdmin = false }) => {
 const [isPlaying, setIsPlaying] = useState(false);
 const [progress, setProgress] = useState(0);
 const audioRef = useRef(null);
 const timerRef = useRef(null);

 const playSyntheticBeep = () => {
 if (isPlaying) {
 setIsPlaying(false);
 setProgress(0);
 if (timerRef.current) clearInterval(timerRef.current);
 return;
 }
 setIsPlaying(true);

 try {
 const AudioContext = window.AudioContext || window.webkitAudioContext;
 if (AudioContext) {
 const ctx = new AudioContext();
 const osc = ctx.createOscillator();
 const gain = ctx.createGain();
 osc.type = 'sine';
 osc.frequency.setValueAtTime(440, ctx.currentTime);
 osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 1.2);
 gain.gain.setValueAtTime(0.12, ctx.currentTime);
 gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
 osc.connect(gain);
 gain.connect(ctx.destination);
 osc.start();
 osc.stop(ctx.currentTime + 1.2);
 }
 } catch (_) {}

 let current = 0;
 timerRef.current = setInterval(() => {
 current += 8;
 setProgress(current);
 if (current >= 100) {
 clearInterval(timerRef.current);
 setIsPlaying(false);
 setProgress(0);
 }
 }, 100);
 };

 const togglePlay = () => {
 if (audioUrl) {
 if (!audioRef.current) {
 audioRef.current = new Audio(audioUrl);
 audioRef.current.onended = () => {
 setIsPlaying(false);
 setProgress(0);
 };
 audioRef.current.ontimeupdate = () => {
 if (audioRef.current.duration) {
 setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
 }
 };
 }
 if (isPlaying) {
 audioRef.current.pause();
 setIsPlaying(false);
 } else {
 audioRef.current.play().catch(() => playSyntheticBeep());
 setIsPlaying(true);
 }
 } else {
 playSyntheticBeep();
 }
 };

 useEffect(() => {
 return () => {
 if (timerRef.current) clearInterval(timerRef.current);
 if (audioRef.current) audioRef.current.pause();
 };
 }, []);

 return (
 <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 2px', minWidth: 160 }}>
 <button
 type="button"
 onClick={togglePlay}
 style={{
 width: 40, height: 40, borderRadius: '50%',
 background: '#FFFFFF',
 border: 'none', cursor: 'pointer',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
 color: isAdmin ? '#8E44AD' : '#1A1829',
 flexShrink: 0,
 transition: 'transform 0.15s ease'
 }}
 >
 {isPlaying ? (
 <FiPause size={18} style={{ fill: 'currentColor' }} />
 ) : (
 <FiPlay size={18} style={{ fill: 'currentColor', marginLeft: 2 }} />
 )}
 </button>

 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 20 }}>
 {[3, 6, 11, 16, 8, 14, 18, 9, 15, 7, 13, 17, 10, 5, 14, 18, 9, 4, 12, 7, 14, 9, 5].map((height, i) => {
 const barProgress = (i / 23) * 100;
 const active = isPlaying && barProgress <= progress;
 return (
 <div
 key={i}
 style={{
 width: 2.5,
 height: `${height}px`,
 borderRadius: 2,
 background: active
 ? '#FFFFFF'
 : (isAdmin ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.3)'),
 transition: 'height 0.15s, background 0.15s'
 }}
 />
 );
 })}
 </div>

 <div style={{ fontSize: '0.68rem', color: isAdmin ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
 {duration}
 </div>
 </div>
 </div>
 );
};

/*  Voice Recorder Component  */
const VoiceRecorder = ({ onRecordComplete, onCancel }) => {
 const [isRecording, setIsRecording] = useState(false);
 const [recordTime, setRecordTime] = useState(0);
 const mediaRecorderRef = useRef(null);
 const audioChunksRef = useRef([]);
 const timerRef = useRef(null);

 const startRecording = async () => {
 try {
 const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
 mediaRecorderRef.current = new MediaRecorder(stream);
 audioChunksRef.current = [];

 mediaRecorderRef.current.ondataavailable = (event) => {
 if (event.data.size > 0) {
 audioChunksRef.current.push(event.data);
 }
 };

 mediaRecorderRef.current.onstop = () => {
 const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
 const audioUrl = URL.createObjectURL(audioBlob);
 const mins = Math.floor(recordTime / 60);
 const secs = recordTime % 60;
 const durStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
 onRecordComplete({ audioUrl, duration: durStr || '0:03' });
 stream.getTracks().forEach(track => track.stop());
 };

 mediaRecorderRef.current.start();
 setIsRecording(true);
 setRecordTime(0);

 timerRef.current = setInterval(() => {
 setRecordTime(prev => prev + 1);
 }, 1000);
 } catch (err) {
 toast.error('Microphone permission denied or not available');
 onCancel();
 }
 };

 const stopRecording = () => {
 if (mediaRecorderRef.current && isRecording) {
 mediaRecorderRef.current.stop();
 clearInterval(timerRef.current);
 setIsRecording(false);
 }
 };

 useEffect(() => {
 startRecording();
 return () => {
 if (timerRef.current) clearInterval(timerRef.current);
 };
 }, []);

 const mins = Math.floor(recordTime / 60);
 const secs = recordTime % 60;

 return (
 <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, background: 'rgba(239,68,68,0.15)', padding: '6px 14px', borderRadius: 24, border: '1px solid rgba(239,68,68,0.3)' }}>
 <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444', animation: 'adminOnlinePulse 1s infinite' }} />
 <span style={{ fontSize: '0.85rem', color: '#F87171', fontWeight: 700 }}>
 Recording Voice Note… {mins}:{secs < 10 ? '0' : ''}{secs}
 </span>
 <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
 <button
 type="button"
 onClick={onCancel}
 style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.78rem' }}
 >
 Cancel
 </button>
 <button
 type="button"
 onClick={stopRecording}
 style={{ background: '#EF4444', color: '#fff', border: 'none', borderRadius: 16, padding: '4px 12px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
 >
 Send Voice
 </button>
 </div>
 </div>
 );
};

/*  Telegram Doodle Pattern Wallpaper  */
const TelegramWallpaper = () => (
 <div style={{
 position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.08,
 backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FFFFFF' fill-opacity='0.8'%3E%3Cpath d='M20 20a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm40 60a6 6 0 1 0 0-12 6 6 0 0 0 0 12zm50-50a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM30 90a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm60 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'/%3E%3Cpath d='M75 35l10 10-10 10-10-10 10-10zM25 55l7 7-7 7-7-7 7-7z'/%3E%3C/g%3E%3C/svg%3E")`,
 backgroundSize: '240px 240px'
 }} />
);

/*  Deliver Account Modal  */
const DeliverAccountModal = ({ isOpen, onClose, orderId, customerName, onDeliverSuccess }) => {
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [note, setNote] = useState('');
 const [submitting, setSubmitting] = useState(false);

 useEffect(() => {
 if (orderId) {
 const stored = localStorage.getItem(`order_account_delivery_${orderId}`);
 if (stored) {
 try {
 const parsed = JSON.parse(stored);
 setEmail(parsed.email || '');
 setPassword(parsed.password || '');
 setNote(parsed.note || '');
 } catch (_) {}
 } else {
 setEmail(`account_${orderId}@sabyshop.com`);
 setPassword('Pass' + Math.floor(1000 + Math.random() * 9000));
 setNote('Standard Digital Account - Instant delivery');
 }
 }
 }, [orderId]);

 if (!isOpen) return null;

 const handleSubmit = async (e) => {
 e.preventDefault();
 if (!email || !password || submitting) return;
 setSubmitting(true);

 const delivery = { email: email.trim(), password: password.trim(), note: note.trim() };
 localStorage.setItem(`order_account_delivery_${orderId}`, JSON.stringify(delivery));

 const deliveryMsgText = `Your account has been delivered!\nEmail: ${delivery.email}\nPassword: ${delivery.password}${delivery.note ? `\nNote: ${delivery.note}` : ''}`;

 try {
 await chatApi.sendMessage(orderId, deliveryMsgText);
 } catch (err) {
 console.warn('Error sending delivery message:', err);
 }

 try {
 await adminApi.updateOrderStatus(orderId, 'COMPLETED');
 } catch (err) {
 console.warn('Error updating order status:', err);
 }

 setSubmitting(false);
 toast.success(`Account delivered to ${customerName || 'customer'}!`);
 if (onDeliverSuccess) onDeliverSuccess(orderId, delivery);
 onClose();
 };

 return (
 <div style={{
 position: 'fixed', inset: 0, zIndex: 9999,
 background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
 display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
 }}>
 <div style={{
 background: '#1E293B', border: '1px solid rgba(255,255,255,0.15)',
 borderRadius: 16, width: '100%', maxWidth: 460, padding: 24,
 boxShadow: '0 20px 50px rgba(0,0,0,0.6)', color: '#fff'
 }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.1rem', fontWeight: 800 }}>
 <FiPackage color="#10B981" size={22} /> Deliver Account — Order #{orderId}
 </div>
 <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
 <FiX size={20} />
 </button>
 </div>

 <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
 <div>
 <label style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700, display: 'block', marginBottom: 4 }}>Account Email / Username</label>
 <input
 type="text" className="admin-input" style={{ width: '100%' }}
 value={email} onChange={e => setEmail(e.target.value)} required
 />
 </div>
 <div>
 <label style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700, display: 'block', marginBottom: 4 }}>Password</label>
 <input
 type="text" className="admin-input" style={{ width: '100%' }}
 value={password} onChange={e => setPassword(e.target.value)} required
 />
 </div>
 <div>
 <label style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700, display: 'block', marginBottom: 4 }}>Note / Instructions (Optional)</label>
 <textarea
 className="admin-input" style={{ width: '100%', minHeight: 60 }}
 value={note} onChange={e => setNote(e.target.value)}
 />
 </div>

 <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
 <button type="button" onClick={onClose} className="admin-btn admin-btn-secondary">Cancel</button>
 <button type="submit" disabled={submitting} className="admin-btn admin-btn-primary" style={{ background: 'linear-gradient(135deg,#10B981,#059669)', border: 'none' }}>
 {submitting ? 'Delivering…' : 'Send Credentials & Mark Completed'}
 </button>
 </div>
 </form>
 </div>
 </div>
 );
};

/*  Confirm Delete Modal  */
const ConfirmDeleteModal = ({ isOpen, onClose, title, message, onConfirm }) => {
 if (!isOpen) return null;

 return (
 <div style={{
 position: 'fixed', inset: 0, zIndex: 10000,
 background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
 display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
 }}>
 <div style={{
 background: '#1E293B', border: '1px solid rgba(255,255,255,0.15)',
 borderRadius: 16, width: '100%', maxWidth: 400, padding: 24,
 boxShadow: '0 20px 50px rgba(0,0,0,0.6)', color: '#fff'
 }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.05rem', fontWeight: 800, color: '#EF4444' }}>
 <FiTrash2 size={20} /> {title || 'Confirm Delete'}
 </div>
 <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
 <FiX size={20} />
 </button>
 </div>

 <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, marginBottom: 20 }}>
 {message || 'Are you sure you want to delete this item? This action cannot be undone.'}
 </p>

 <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
 <button
 type="button"
 onClick={onClose}
 className="admin-btn admin-btn-secondary"
 style={{ padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}
 >
 Cancel
 </button>
 <button
 type="button"
 onClick={() => {
 if (onConfirm) onConfirm();
 onClose();
 }}
 className="admin-btn"
 style={{
 background: 'linear-gradient(135deg,#EF4444,#DC2626)',
 color: '#fff', border: 'none', padding: '8px 18px',
 borderRadius: 8, fontWeight: 700, cursor: 'pointer',
 boxShadow: '0 4px 14px rgba(239,68,68,0.4)',
 display: 'flex', alignItems: 'center', gap: 6
 }}
 >
 <FiTrash2 size={14} /> Yes, Delete
</button>
 </div>
 </div>
 </div>
 );
};

/*  Date label helper  */
const getAdminDateLabel = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
};

const AdminChatPage = () => {
  const { user } = useAuth();
  const { isKhmer } = useLanguage();
  const [conversations, setConversations] = useState({});
  const [ordersMap, setOrdersMap] = useState({});
  const [sellersMap, setSellersMap] = useState({});
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [adminReplyOrderId, setAdminReplyOrderId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('USER'); // 'USER' (Buyer Support) | 'SELLER' (Seller Support)
  const [showProfileDrawer, setShowProfileDrawer] = useState(true);
  const [deliverModalOpen, setDeliverModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const [readMap, setReadMap] = useState(() => {
    try { return JSON.parse(localStorage.getItem('admin_chat_read_map') || '{}'); }
    catch { return {}; }
  });

  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const prevActiveMsgCount = useRef(0);
  const conversationsRef = useRef({});

  /*  Dedup  */
  const isDup = (list, msg) => list.some(ex => {
    const exOid = String(ex.orderId || ex.threadId || 'G');
    const mOid = String(msg.orderId || msg.threadId || 'G');
    if (exOid !== mOid) return false;
    if (ex.id && msg.id && String(ex.id) === String(msg.id)) return true;
    const exRole = ex.senderRole || (ex.senderName?.includes('Admin') ? 'ADMIN' : 'USER');
    const mRole = msg.senderRole || (msg.senderName?.includes('Admin') ? 'ADMIN' : 'USER');
    if (exRole !== mRole) return false;
    if ((ex.content || '').trim() !== (msg.content || '').trim()) return false;
    const exTime = new Date(ex.createdAt || 0).getTime();
    const mTime = new Date(msg.createdAt || 0).getTime();
    return Math.abs(mTime - exTime) < 10000;
  });

  /*  Sort Order IDs  */
  const sortOids = useCallback((convs, rm) =>
    Object.keys(convs).sort((a, b) => {
      const la = convs[a].at(-1), lb = convs[b].at(-1);
      const ua = la?.senderRole !== 'ADMIN' && rm[a] !== (la?.id || la?.createdAt);
      const ub = lb?.senderRole !== 'ADMIN' && rm[b] !== (lb?.id || lb?.createdAt);
      if (ua && !ub) return -1;
      if (!ua && ub) return 1;
      return new Date(lb?.createdAt || 0) - new Date(la?.createdAt || 0);
    }), []);

  /*  Mark read  */
  const markRead = useCallback((oid, convs) => {
    const msgs = convs[oid] || [];
    const last = msgs.at(-1);
    if (!last) return;
    const marker = last.id || last.createdAt;
    const contentMarker = `${last.senderRole}__${(last.content || '').trim()}`;
    setReadMap(prev => {
      if (prev[oid] === marker && prev[`${oid}_content`] === contentMarker) return prev;
      const next = { ...prev, [oid]: marker, [`${oid}_content`]: contentMarker };
      try { localStorage.setItem('admin_chat_read_map', JSON.stringify(next)); } catch (_) {}
      return next;
    });
  }, []);

  /*  Select Conversation  */
  const selectConv = useCallback((oid) => {
    setSelectedOrderId(String(oid));
    setReplyText('');
    markRead(String(oid), conversations);
    const msgs = conversations[String(oid)] || [];
    const lastUserMsg = [...msgs].reverse().find(m => (m.senderRole === 'USER' || m.senderRole === 'SELLER') && m.orderId && !isNaN(Number(m.orderId)));
    if (lastUserMsg) setAdminReplyOrderId(String(lastUserMsg.orderId));
    else setAdminReplyOrderId(null);
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
  }, [conversations, markRead]);

  /*  Fetch all chats & order details & seller profiles  */
  const fetchAllChats = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      let ordersList = [];
      const map = {};
      try {
        const ordersRes = await adminApi.getAllOrders();
        if (Array.isArray(ordersRes.data)) {
          ordersList = ordersRes.data;
          ordersRes.data.forEach(o => { map[String(o.id)] = o; });
          setOrdersMap(map);
        }
      } catch (_) {}

      // Fetch sellers list for Seller Profiles
      const sMap = {};
      try {
        const sellersRes = await adminApi.getAllSellers();
        const sList = Array.isArray(sellersRes.data) ? sellersRes.data : (sellersRes.data?.data || []);
        if (Array.isArray(sList)) {
          sList.forEach(s => {
            if (s?.user?.email) sMap[s.user.email.toLowerCase().trim()] = s;
            if (s?.email) sMap[s.email.toLowerCase().trim()] = s;
            if (s?.id) sMap[String(s.id)] = s;
          });
          setSellersMap(sMap);
        }
      } catch (_) {}

      let apiMsgs = [];
      try {
        const res = await chatApi.adminGetAll();
        if (Array.isArray(res.data)) apiMsgs = res.data;
      } catch (_) {}

      const localMsgs = [];
      const storageKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        storageKeys.push(localStorage.key(i));
      }
      storageKeys.forEach(k => {
        if (k && (k.startsWith('chat_messages_order_') || k.startsWith('chat_messages_user_') || k.startsWith('chat_messages_seller_') || k.startsWith('chat_messages_') || k.startsWith('support_messages_'))) {
          try {
            const parsed = JSON.parse(localStorage.getItem(k));
            if (Array.isArray(parsed)) {
              parsed.forEach(m => { if (m) localMsgs.push(m); });
            }
          } catch (_) {}
        }
      });

      const msgMap = new Map();
      const addMsg = (m) => {
        if (!m) return;
        const key = m.id ? String(m.id) : `${m.orderId || m.threadId}_${m.senderRole}_${m.content}`;
        if (!msgMap.has(key)) msgMap.set(key, m);
      };

      apiMsgs.forEach(addMsg);
      localMsgs.forEach(addMsg);

      const getCustomerKey = (m) => {
        if (!m) return null;
        if (m.orderId && map[String(m.orderId)]?.customerEmail) {
          return map[String(m.orderId)].customerEmail.toLowerCase().trim();
        }
        if (m.senderRole === 'USER' && m.senderEmail && !m.senderEmail.includes('admin')) {
          return m.senderEmail.toLowerCase().trim();
        }
        if (m.targetEmail && !m.targetEmail.includes('admin')) {
          return m.targetEmail.toLowerCase().trim();
        }
        if (m.userEmail && !m.userEmail.includes('admin')) {
          return m.userEmail.toLowerCase().trim();
        }
        if (m.senderEmail && !m.senderEmail.includes('admin')) {
          return m.senderEmail.toLowerCase().trim();
        }
        return null;
      };

      const grouped = {};

      // Seed Default User Profiles
      grouped['user:gshsbzvhzbx@gmail.com'] = [];
      grouped['user:korb.sameth@gmail.com'] = [];

      // Seed Default Seller Profile (Korb Store)
      grouped['seller:korb.sameth@gmail.com'] = [];

      // Seed any other registered sellers from DB
      Object.keys(sMap).forEach(k => {
        if (k && k.includes('@')) {
          grouped[`seller:${k}`] = [];
        }
      });

      msgMap.forEach(msg => {
        const rawEmail = getCustomerKey(msg);
        if (!rawEmail || rawEmail.startsWith('+') || rawEmail.startsWith('order_') || rawEmail === 'general') return;

        const isSellerMsg = msg.channel === 'SELLER_ADMIN' || msg.senderRole === 'SELLER' || msg.senderProfileType === 'SELLER';
        const threadKey = isSellerMsg ? `seller:${rawEmail}` : `user:${rawEmail}`;

        if (!grouped[threadKey]) grouped[threadKey] = [];
        if (!grouped[threadKey].some(ex => ex.id === msg.id)) {
          grouped[threadKey].push(msg);
        }
      });

      ordersList.forEach(ord => {
        if (ord.customerEmail) {
          const emailKey = ord.customerEmail.toLowerCase().trim();
          const threadKey = `user:${emailKey}`;
          if (!grouped[threadKey]) grouped[threadKey] = [];
        }
      });

      // Default mock messages for User Profiles
      if (grouped['user:gshsbzvhzbx@gmail.com'] && grouped['user:gshsbzvhzbx@gmail.com'].length === 0 && localStorage.getItem('deleted_chat_thread_user_gshsbzvhzbx_gmail_com') !== 'true') {
        grouped['user:gshsbzvhzbx@gmail.com'] = [
          { id: 'gz-1', senderRole: 'USER', channel: 'USER_ADMIN', senderName: 'Gshsb Zvhzbx', senderEmail: 'gshsbzvhzbx@gmail.com', content: 'hello brother it not work simple', createdAt: '2026-08-03T14:56:00.000Z' },
          { id: 'gz-2', senderRole: 'USER', channel: 'USER_ADMIN', senderName: 'Gshsb Zvhzbx', senderEmail: 'gshsbzvhzbx@gmail.com', content: 'Incorrect Netflix Password', createdAt: '2026-08-03T16:06:00.000Z' },
          { id: 'gz-3', senderRole: 'USER', channel: 'USER_ADMIN', senderName: 'Gshsb Zvhzbx', senderEmail: 'gshsbzvhzbx@gmail.com', content: 'Household location / TV code', createdAt: '2026-08-03T16:06:10.000Z' },
          { id: 'gz-4', senderRole: 'USER', channel: 'USER_ADMIN', senderName: 'Gshsb Zvhzbx', senderEmail: 'gshsbzvhzbx@gmail.com', content: 'Screen limit reached', createdAt: '2026-08-03T16:06:20.000Z' },
          { id: 'gz-5', senderRole: 'USER', channel: 'USER_ADMIN', senderName: 'Gshsb Zvhzbx', senderEmail: 'gshsbzvhzbx@gmail.com', content: 'Need replacement account', createdAt: '2026-08-03T16:06:30.000Z' },
          { id: 'gz-6', senderRole: 'USER', channel: 'USER_ADMIN', senderName: 'Gshsb Zvhzbx', senderEmail: 'gshsbzvhzbx@gmail.com', content: 'ទីតាំងគ្រួសារ / កូដ TV', createdAt: '2026-08-03T21:30:00.000Z' }
        ];
      }

      if (grouped['user:korb.sameth@gmail.com'] && grouped['user:korb.sameth@gmail.com'].length === 0 && localStorage.getItem('deleted_chat_thread_user_korb_sameth_gmail_com') !== 'true') {
        grouped['user:korb.sameth@gmail.com'] = [
          { id: 'ks-1', senderRole: 'USER', channel: 'USER_ADMIN', senderName: 'Korb Sameth', senderEmail: 'korb.sameth@gmail.com', content: 'Hello admin, I need help with my digital account order.', createdAt: '2026-08-04T14:41:00.000Z' },
          { id: 'ks-2', senderRole: 'ADMIN', channel: 'USER_ADMIN', senderName: 'Admin', senderEmail: 'admin@sabyshop.com', content: 'Hello Korb! We verified your order. Replacement credentials have been delivered.', createdAt: '2026-08-04T14:41:30.000Z' }
        ];
      }

      // Default mock messages for Seller Profile (Korb Store)
      if (grouped['seller:korb.sameth@gmail.com'] && grouped['seller:korb.sameth@gmail.com'].length === 0 && localStorage.getItem('deleted_chat_thread_seller_korb_sameth_gmail_com') !== 'true') {
        grouped['seller:korb.sameth@gmail.com'] = [
          { id: 'ss-1', senderRole: 'SELLER', channel: 'SELLER_ADMIN', senderName: 'Korb Store (Official)', senderEmail: 'korb.sameth@gmail.com', senderStoreName: 'Korb Digital Store', content: 'Hello Admin! I would like to upgrade my store subscription to Pro Plan ($4.50/mo).', createdAt: '2026-08-05T09:15:00.000Z' },
          { id: 'ss-2', senderRole: 'ADMIN', channel: 'SELLER_ADMIN', senderName: 'Platform Admin', senderEmail: 'admin@sabyshop.com', content: 'Hello Korb Store! Your Pro subscription plan is active with AI Assistant and automated replacement alerts enabled.', createdAt: '2026-08-05T09:16:00.000Z' }
        ];
      }

      // Check if a thread key was deleted by admin
      const isThreadDeleted = (key) => {
        const cleanKey = String(key).toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
        return localStorage.getItem(`deleted_chat_thread_${cleanKey}`) === 'true';
      };

      const cleanGrouped = {};
      Object.keys(grouped).forEach(k => {
        const msgs = grouped[k];
        if (!isThreadDeleted(k) && k && !k.startsWith('order_') && !k.startsWith('+') && k !== 'General' && k !== 'general') {
          cleanGrouped[k] = msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }
      });

      const isDiff = JSON.stringify(cleanGrouped) !== JSON.stringify(conversationsRef.current);
      if (isDiff) {
        conversationsRef.current = cleanGrouped;
        setConversations(cleanGrouped);
      }

      const convKeys = Object.keys(cleanGrouped);
      if (convKeys.length > 0) {
        setSelectedOrderId(prev => {
          const sp = prev != null ? String(prev) : '';
          if (sp && cleanGrouped[sp]) return sp;
          return String(sortOids(cleanGrouped, {})[0] ?? convKeys[0]);
        });
      } else { setSelectedOrderId(null); }
    } finally { if (!silent) setLoading(false); }
  };

  useEffect(() => {
    fetchAllChats();
    const iv = setInterval(() => fetchAllChats(true), 4000);
    return () => { clearInterval(iv); };
  }, []);

  // Scroll to bottom when conversation changes
  useEffect(() => {
    if (selectedOrderId && messagesContainerRef.current) {
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 30);
    }
  }, [selectedOrderId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    const msgs = selectedOrderId ? (conversations[selectedOrderId] || []) : [];
    const count = msgs.length;
    if (count > prevActiveMsgCount.current && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
    prevActiveMsgCount.current = count;
  }, [conversations, selectedOrderId]);

  useEffect(() => {
    if (selectedOrderId && conversations[selectedOrderId]) markRead(selectedOrderId, conversations);
  }, [conversations, selectedOrderId, markRead]);

  /*  Send Message  */
  const handleSend = async (e, customMsgData = null) => {
    if (e) e.preventDefault();
    const text = customMsgData ? customMsgData.content : replyText.trim();
    if (!text || !selectedOrderId || sending) return;
    setSending(true);

    const aid = String(selectedOrderId);
    const cur = conversations[aid] || [];
    const info = getInfo(cur, aid);
    const targetEmail = info.email || aid.replace(/^(user|seller):/, '');

    const targetOrderId = (
      (adminReplyOrderId && !isNaN(Number(adminReplyOrderId))) ? Number(adminReplyOrderId) : null
    ) || (
      (() => { const m = [...cur].reverse().find(m2 => (m2.senderRole === 'USER' || m2.senderRole === 'SELLER') && m2.orderId && !isNaN(Number(m2.orderId))); return m ? Number(m.orderId) : 0; })()
    ) || info.order?.id || (info.customerOrders && info.customerOrders[0]?.id) || 0;

    const convChannel = info.isSeller ? 'SELLER_ADMIN' : 'USER_ADMIN';
    const tid = 'admin-' + Date.now();
    const msg = {
      id: tid,
      orderId: targetOrderId ? Number(targetOrderId) : 0,
      senderEmail: user?.email || 'admin@sabyshop.com',
      targetEmail: targetEmail,
      senderName: user?.name || 'Platform Admin',
      senderRole: 'ADMIN',
      channel: convChannel,
      content: text,
      type: customMsgData?.type || 'text',
      duration: customMsgData?.duration || null,
      audioUrl: customMsgData?.audioUrl || null,
      createdAt: new Date().toISOString()
    };

    const isDup = (list, m) => list.some(x => x.id === m.id);
    const updated = [...cur, msg];
    setConversations(p => ({ ...p, [aid]: updated }));

    if (targetOrderId) {
      const ordKey = `chat_messages_order_${targetOrderId}`;
      try {
        const existing = JSON.parse(localStorage.getItem(ordKey) || '[]');
        const merged = [...existing];
        if (!merged.some(m => m.id === tid)) merged.push(msg);
        localStorage.setItem(ordKey, JSON.stringify(merged));
      } catch (_) {}
    }

    const cleanKey = aid.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
    const userStorageKey = `chat_messages_user_${cleanKey}`;
    try {
      const existingUserMsgs = JSON.parse(localStorage.getItem(userStorageKey) || '[]');
      const mergedUserMsgs = [...existingUserMsgs];
      if (!mergedUserMsgs.some(m => m.id === tid)) mergedUserMsgs.push(msg);
      localStorage.setItem(userStorageKey, JSON.stringify(mergedUserMsgs));
    } catch (_) {}

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new StorageEvent('storage', { key: targetOrderId ? `chat_messages_order_${targetOrderId}` : userStorageKey }));

    setReplyText('');
    markRead(aid, { ...conversations, [aid]: updated });

    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 40);

    try {
      const res = await chatApi.sendMessage(targetOrderId || 0, text, targetEmail, isKhmer ? 'km' : 'en', convChannel);
      const serverMsg = res.data;
      if (serverMsg) {
        setConversations(p => {
          const list = p[aid] || [];
          const rep = list.map(m => m.id === tid ? { ...serverMsg, id: serverMsg.id || tid } : m);
          const cl = []; rep.forEach(m => { if (!isDup(cl, m)) cl.push(m); });
          if (targetOrderId) {
            localStorage.setItem(`chat_messages_order_${targetOrderId}`, JSON.stringify(cl));
          }
          window.dispatchEvent(new Event('storage'));
          return { ...p, [aid]: cl };
        });
      }
    } catch (_) {
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  /*  Send Voice Complete  */
  const handleVoiceRecordComplete = ({ audioUrl, duration }) => {
    setIsRecordingVoice(false);
    handleSend(null, {
      content: '[Voice Note]',
      type: 'voice',
      duration: duration || '0:03',
      audioUrl
    });
    toast.success(isKhmer ? 'បានផ្ញើសារជាសំឡេង' : 'Voice message sent');
  };

  /*  Edit single message  */
  const handleConfirmEdit = async (msgId) => {
    const trimmed = editText.trim();
    if (!trimmed || !msgId) return;
    const aid = String(selectedOrderId);
    const cur = conversations[aid] || [];
    const orig = cur.find(m => String(m.id) === String(msgId));
    if (orig && trimmed === orig.content) { setEditingId(null); return; }

    setConversations(prev => {
      const list = prev[aid] || [];
      const updated = list.map(m => String(m.id) === String(msgId) ? { ...m, content: trimmed, edited: true } : m);
      const msgOid = list.find(m => String(m.id) === String(msgId))?.orderId;
      const lk = msgOid ? `chat_messages_order_${msgOid}` : `chat_messages_user_${aid.replace(/[^a-zA-Z0-9]/g, '_')}`;
      localStorage.setItem(lk, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      return { ...prev, [aid]: updated };
    });
    setEditingId(null);

    try {
      if (typeof msgId === 'number' || (!isNaN(Number(msgId)) && !String(msgId).startsWith('admin-'))) {
        await chatApi.editMessage(msgId, trimmed);
      }
      toast.success(isKhmer ? 'សារត្រូវបានកែប្រែ' : 'Message updated');
    } catch (_) {}
  };

  /*  Delete single message (Permanent)  */
  const handleDeleteMessage = (msgId) => {
    if (!msgId) return;
    setDeleteConfirmModal({
      isOpen: true,
      title: isKhmer ? 'លុបសារ' : 'Delete Message',
      message: isKhmer ? 'តើអ្នកប្រាកដថាចង់លុបសារនេះជាអចិន្ត្រៃយ៍ឬ?' : 'Are you sure you want to delete this message? It will be permanently removed.',
      onConfirm: async () => {
        try {
          if (typeof msgId === 'number' || (!isNaN(Number(msgId)) && !String(msgId).startsWith('admin-'))) {
            await chatApi.deleteMessage(msgId);
          }
        } catch (_) {}

        const aid = String(selectedOrderId);
        const cleanKey = aid.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
        const cur = conversations[aid] || [];
        const msgToDelete = cur.find(m => String(m.id) === String(msgId));
        const updated = cur.filter(m => String(m.id) !== String(msgId));

        localStorage.setItem(`chat_messages_user_${cleanKey}`, JSON.stringify(updated));

        if (msgToDelete?.orderId) {
          const ordKey = `chat_messages_order_${msgToDelete.orderId}`;
          try {
            const existingOrd = JSON.parse(localStorage.getItem(ordKey) || '[]');
            const updatedOrd = existingOrd.filter(m => String(m.id) !== String(msgId));
            localStorage.setItem(ordKey, JSON.stringify(updatedOrd));
          } catch (_) {}
        }

        window.dispatchEvent(new Event('storage'));
        setConversations(prev => ({ ...prev, [aid]: updated }));
        toast.success(isKhmer ? 'បានលុបសារជាអចិន្ត្រៃយ៍' : 'Message deleted permanently');
      }
    });
  };

  /*  Delete entire chat thread (Permanent across All Storage & State)  */
  const handleDeleteChatThread = (oid) => {
    const aid = String(oid || selectedOrderId);
    if (!aid) return;

    const msgs = conversations[aid] || [];
    const info = getInfo(msgs, aid);
    const targetName = info.name || aid;

    setDeleteConfirmModal({
      isOpen: true,
      title: isKhmer ? 'លុបការសន្ទនាទាំងមូល' : 'Delete Entire Chat Thread',
      message: isKhmer ? `តើអ្នកពិតជាចង់លុបប្រវត្តិជជែកទាំងអស់សម្រាប់ ${targetName}?` : `Are you sure you want to delete the entire chat history for ${targetName}? This action is permanent and cannot be undone.`,
      onConfirm: async () => {
        const cleanKey = aid.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');

        // 1. Mark thread as permanently deleted in localStorage
        localStorage.setItem(`deleted_chat_thread_${cleanKey}`, 'true');

        // 2. Collect all order IDs associated with this customer
        const orderIdsInThread = new Set();
        if (info.customerOrders) {
          info.customerOrders.forEach(o => { if (o.id) orderIdsInThread.add(String(o.id)); });
        }
        msgs.forEach(m => {
          if (m.orderId && !isNaN(Number(m.orderId))) {
            orderIdsInThread.add(String(m.orderId));
          }
        });

        // 3. Remove all localStorage keys for user/seller and orders
        localStorage.removeItem(`chat_messages_user_${cleanKey}`);
        localStorage.removeItem(`chat_messages_seller_${cleanKey}`);
        localStorage.removeItem(`chat_messages_${aid}`);
        localStorage.removeItem(`support_messages_${aid}`);

        orderIdsInThread.forEach(ordId => {
          localStorage.removeItem(`chat_messages_order_${ordId}`);
          localStorage.setItem(`deleted_chat_order_${ordId}`, 'true');
        });

        // 4. Call backend API for all associated orders
        for (const ordId of orderIdsInThread) {
          try {
            await chatApi.deleteOrderChat(Number(ordId));
          } catch (_) {}
        }

        // 5. Update state and dispatch storage events for real-time removal
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new StorageEvent('storage', { key: `chat_messages_user_${cleanKey}` }));

        setConversations(prev => {
          const next = { ...prev };
          delete next[aid];
          return next;
        });

        if (String(selectedOrderId) === String(aid)) {
          setSelectedOrderId(null);
        }

        toast.success(isKhmer ? `បានលុបប្រវត្តិជជែកសម្រាប់ ${targetName}` : `Chat history for ${targetName} permanently deleted`);
      }
    });
  };

  /*  Derived Data & Info (Organized by User Profile vs Seller Profile)  */
  const getInfo = (msgs, key) => {
    const isSeller = String(key).startsWith('seller:') || msgs?.some(m => m.channel === 'SELLER_ADMIN');
    const rawKey = String(key || '').replace(/^(user|seller):/, '');
    const cleanEmail = rawKey.toLowerCase().trim();

    if (isSeller) {
      const sellerProfile = sellersMap[cleanEmail] || null;
      let storeName = sellerProfile?.storeName || msgs?.find(m => m.senderStoreName)?.senderStoreName;
      if (!storeName) {
        if (cleanEmail.includes('korb')) storeName = 'Korb Digital Store';
        else storeName = `${cleanEmail.split('@')[0]}'s Store`;
      }
      const storeLogo = sellerProfile?.storeLogoUrl || msgs?.find(m => m.senderStoreLogoUrl)?.senderStoreLogoUrl || '';
      return {
        isSeller: true,
        profileType: 'SELLER',
        name: storeName,
        storeName: storeName,
        logo: storeLogo,
        avatar: storeLogo,
        email: cleanEmail,
        plan: sellerProfile?.subscriptionPlan || 'PLAN_2',
        status: sellerProfile?.subscriptionStatus || 'ACTIVE',
        telegram: sellerProfile?.telegramUsername || 'saby_seller',
        sellerId: sellerProfile?.id || (cleanEmail.includes('korb') ? 1 : null),
        sellerProfile,
        statusText: isKhmer ? 'អនឡាញ · ហាងផ្លូវការ (Official Merchant)' : 'Online · Official Merchant Store',
        customerOrders: []
      };
    }

    // Otherwise USER Profile
    const um = msgs?.find(m => m.senderRole === 'USER' && m.senderEmail && !m.senderEmail.includes('admin')) || msgs?.find(m => m.senderEmail && !m.senderEmail.includes('admin'));
    const email = cleanEmail || um?.senderEmail || '';

    const customerOrders = Object.values(ordersMap).filter(o =>
      o && o.customerEmail && email && o.customerEmail.toLowerCase().trim() === email.toLowerCase().trim()
    );

    const matchedOrder = customerOrders[0] || ordersMap[String(key)] || null;
    let name = matchedOrder?.customerName || matchedOrder?.user?.name || um?.senderName;
    if (!name || name.toLowerCase().includes('admin')) {
      if (email.includes('gshsbzvhzbx')) name = 'Gshsb Zvhzbx';
      else if (email.includes('korb')) name = 'Korb Sameth';
      else name = email ? email.split('@')[0] : (isKhmer ? 'គណនីអតិថិជន' : 'Customer Profile');
    }
    const avatar = matchedOrder?.customerAvatar || matchedOrder?.user?.avatar || (email ? (localStorage.getItem(`user_avatar_${email.toLowerCase()}`) || localStorage.getItem(`userPhoto_${email.toLowerCase()}`)) : null);
    return {
      isSeller: false,
      profileType: 'USER',
      name,
      email: email || 'gshsbzvhzbx@gmail.com',
      avatar,
      statusText: isKhmer ? 'អនឡាញ · អតិថិជន (Registered Buyer)' : 'Online · Registered Buyer Profile',
      order: matchedOrder,
      customerOrders,
      items: matchedOrder?.items || []
    };
  };

  const sortedOids = sortOids(conversations, readMap);
  const orderIds = sortedOids.filter(oid => {
    const msgs = conversations[oid];
    const info = getInfo(msgs, oid);

    if (channelFilter === 'USER' && info.isSeller) return false;
    if (channelFilter === 'SELLER' && !info.isSeller) return false;

    if (!searchQuery) return true;
    return String(oid).toLowerCase().includes(searchQuery.toLowerCase()) ||
      info.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      info.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msgs.some(m => (m.content || '').toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const activeMsgs = selectedOrderId ? (conversations[selectedOrderId] || []) : [];

  const isUnread = (oid) => {
    if (String(oid) === String(selectedOrderId)) return false;
    const msgs = conversations[oid] || [];
    const last = msgs.at(-1);
    if (!last || last.senderRole === 'ADMIN') return false;
    const marker = readMap[oid];
    if (!marker) return true;
    return false;
  };

  const getUnreadUserMsgCount = (oid) => {
    if (String(oid) === String(selectedOrderId)) return 0;
    const msgs = conversations[oid] || [];
    const marker = readMap[oid];
    if (!marker) {
      let count = 0;
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].senderRole !== 'ADMIN') count++;
        else break;
      }
      return count;
    }
    return 0;
  };

  const unreadCount = orderIds.filter(isUnread).length;

  if (loading && !Object.keys(conversations).length)
    return <div className="admin-loading"><div className="admin-spinner" /></div>;

  const selInfo = getInfo(activeMsgs, selectedOrderId);
  const activeOrder = ordersMap[String(selectedOrderId)] || selInfo.order;

  return (
    <div style={{ height: 'calc(100vh - 145px)', display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}>
      <style>{ADMIN_CHAT_CSS}</style>

      {/*  Top Header Title  */}
      <div className="admin-page-header" style={{ marginBottom: 12 }}>
        <div className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isKhmer ? 'ការជជែកគាំទ្រអតិថិជន និងអ្នកលក់' : 'Customer & Seller Support Chats'}
          {unreadCount > 0 && (
            <span style={{
              background: '#EF4444', color: '#fff', borderRadius: 20,
              padding: '1px 8px', fontSize: '0.7rem', fontWeight: 900
            }}>{unreadCount}</span>
          )}
        </div>
        <button 
          onClick={() => fetchAllChats()} 
          className="admin-btn admin-btn-primary admin-btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
        >
          <FiRefreshCw size={14} className={loading ? "admin-spin" : ""} /> {isKhmer ? 'ផ្ទុកឡើងវិញ' : 'Refresh'}
        </button>
      </div>

      {/*  Main Chat Shell (Telegram Dark Theme)  */}
      <div style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: showProfileDrawer ? '310px 1fr 280px' : '310px 1fr',
        borderRadius: 16, overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        background: '#0F0C1B',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
        height: '100%', minHeight: 0
      }}>

        {/*  LEFT SIDEBAR — Conversations List  */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          background: '#151026',
          height: '100%', minHeight: 0, overflow: 'hidden'
        }}>

          {/* Search bar */}
          <div style={{ padding: '12px 12px 8px' }}>
            <div style={{ position: 'relative' }}>
              <FiSearch size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)' }} />
              <input
                className="admin-input"
                placeholder={isKhmer ? 'ស្វែងរកឈ្មោះ ឬ Profile...' : 'Search profile or messages...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', paddingLeft: 32, fontSize: '0.82rem', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
          </div>

          {/* Strictly Separated Inboxes: Buyer Support & Seller VIP Support */}
          <div style={{ padding: '0 12px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <button
              type="button"
              onClick={() => { setChannelFilter('USER'); setSelectedOrderId(null); }}
              style={{
                padding: '8px 10px',
                borderRadius: 12,
                fontSize: '0.74rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                border: channelFilter === 'USER' ? '1.5px solid #3B82F6' : '1px solid rgba(255,255,255,0.1)',
                background: channelFilter === 'USER' ? 'linear-gradient(135deg, rgba(59,130,246,0.35) 0%, rgba(29,78,216,0.35) 100%)' : 'rgba(255,255,255,0.04)',
                color: channelFilter === 'USER' ? '#93C5FD' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <FiUser size={13} />
              <span>{isKhmer ? 'ជំនួយអ្នកទិញ' : 'Buyer Support'}</span>
            </button>

            <button
              type="button"
              onClick={() => { setChannelFilter('SELLER'); setSelectedOrderId(null); }}
              style={{
                padding: '8px 10px',
                borderRadius: 12,
                fontSize: '0.74rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                border: channelFilter === 'SELLER' ? '1.5px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
                background: channelFilter === 'SELLER' ? 'linear-gradient(135deg, rgba(16,185,129,0.35) 0%, rgba(5,150,105,0.35) 100%)' : 'rgba(255,255,255,0.04)',
                color: channelFilter === 'SELLER' ? '#A7F3D0' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <MdStorefront size={14} />
              <span>{isKhmer ? 'ជំនួយអ្នកលក់' : 'Seller Support'}</span>
            </button>
          </div>

          {/* List */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {orderIds.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                <FiInbox size={36} style={{ marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
                <p style={{ margin: 0, fontSize: '0.85rem' }}>{isKhmer ? 'គ្មានការសន្ទនា' : 'No conversations yet'}</p>
              </div>
            ) : orderIds.map(oid => {
              const msgs = conversations[oid];
              const last = msgs?.at(-1);
              const info = getInfo(msgs, oid);
              const sel = String(oid) === String(selectedOrderId);
              const unread = isUnread(oid);

              return (
                <div
                  key={oid}
                  onClick={() => selectConv(oid)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', cursor: 'pointer',
                    background: sel
                      ? (info.isSeller ? 'rgba(16,185,129,0.18)' : 'rgba(142,68,173,0.3)')
                      : 'transparent',
                    borderLeft: sel
                      ? (info.isSeller ? '4px solid #10B981' : '4px solid #8E44AD')
                      : '4px solid transparent',
                    transition: 'background 0.15s',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    position: 'relative'
                  }}
                >
                  {info.isSeller ? (
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: info.logo ? '#1E293B' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      border: '1.5px solid rgba(16,185,129,0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', color: '#fff', boxShadow: '0 2px 10px rgba(16,185,129,0.25)'
                    }}>
                      {info.logo ? (
                        <img src={info.logo} alt={info.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                      ) : (
                        <MdStorefront size={24} color="#FFFFFF" />
                      )}
                    </div>
                  ) : (
                    <Avatar name={info.name} email={info.email} avatar={info.avatar} size={44} />
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                      <span style={{
                        fontWeight: unread ? 900 : 700,
                        fontSize: '0.88rem',
                        color: sel ? (info.isSeller ? '#A7F3D0' : '#D7BDE2') : '#FFFFFF',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        display: 'flex', alignItems: 'center', gap: 4
                      }}>
                        {info.name}
                        {info.isSeller && <MdVerified size={14} color="#1d9bf0" />}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: unread ? '#D7BDE2' : 'rgba(255,255,255,0.4)', flexShrink: 0, marginLeft: 4 }}>
                        {last ? new Date(last.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                        <span style={{
                          background: info.isSeller ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)',
                          color: info.isSeller ? '#34D399' : '#A5B4FC',
                          border: info.isSeller ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(99,102,241,0.35)',
                          fontSize: '0.62rem', fontWeight: 800, padding: '1px 5px', borderRadius: 5, flexShrink: 0
                        }}>
                          {info.isSeller ? (isKhmer ? 'ហាង' : 'Store') : (isKhmer ? 'អ្នកទិញ' : 'User')}
                        </span>
                        <span style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {last?.type === 'voice' ? (
                            <span style={{ color: '#C084FC', fontWeight: 600 }}> Voice note ({last.duration || '0:01'})</span>
                          ) : last?.senderRole === 'ADMIN' ? (
                            <span><strong style={{ color: 'rgba(215,189,226,0.85)' }}>You: </strong>{last?.content}</span>
                          ) : (
                            <span>{last?.content || (isKhmer ? 'មិនទាន់មានសារ' : 'No messages')}</span>
                          )}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                        {(() => {
                          const numUnread = getUnreadUserMsgCount(oid);
                          return numUnread > 0 && !sel ? (
                            <span style={{
                              background: '#EF4444', color: '#fff',
                              minWidth: 18, height: 18, borderRadius: '50%',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.66rem', fontWeight: 900, flexShrink: 0
                            }}>
                              {numUnread}
                            </span>
                          ) : null;
                        })()}

                        {/* Delete Conversation Button */}
                        <button
                          type="button"
                          className="sidebar-del-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChatThread(oid);
                          }}
                          title={`Delete ${info.name}'s conversation`}
                          style={{
                            background: 'rgba(239,68,68,0.15)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            color: '#EF4444',
                            borderRadius: '50%',
                            width: 24, height: 24,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                            transition: 'all 0.15s'
                          }}
                        >
                          <FiTrash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/*  CENTER AREA — Telegram Dark Chat Window  */}
        {selectedOrderId ? (
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', minHeight: 0, overflow: 'hidden', position: 'relative', background: '#0D0B14' }}>
          
            {/* Telegram Subtle Wallpaper */}
            <TelegramWallpaper />

            {/* Telegram Header */}
            <div style={{
              padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#191328',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              zIndex: 10, flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => setShowProfileDrawer(p => !p)}>
                {selInfo.isSeller ? (
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: selInfo.logo ? '#1E293B' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    border: '1.5px solid rgba(16,185,129,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', color: '#fff', boxShadow: '0 2px 10px rgba(16,185,129,0.25)', flexShrink: 0
                  }}>
                    {selInfo.logo ? (
                      <img src={selInfo.logo} alt={selInfo.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                    ) : (
                      <MdStorefront size={24} color="#FFFFFF" />
                    )}
                  </div>
                ) : (
                  <Avatar name={selInfo.name} email={selInfo.email} avatar={selInfo.avatar} size={44} />
                )}

                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.02rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span>{selInfo.name}</span>
                    {selInfo.isSeller && <MdVerified size={16} color="#1d9bf0" />}
                    <span style={{
                      fontSize: '0.7rem',
                      color: selInfo.isSeller ? '#34D399' : '#93C5FD',
                      background: selInfo.isSeller ? 'rgba(16,185,129,0.18)' : 'rgba(59,130,246,0.18)',
                      border: selInfo.isSeller ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(59,130,246,0.35)',
                      padding: '2px 8px', borderRadius: 8, fontWeight: 800
                    }}>
                      {selInfo.isSeller ? '[SELLER VIP SUPPORT]' : '[BUYER SUPPORT]'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.45)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="admin-online-dot" />
                    <span>{selInfo.statusText}</span>
                    {selInfo.email && <span style={{ opacity: 0.6 }}>({selInfo.email})</span>}
                  </div>
                </div>
              </div>

              {/* Top Right Header Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {!selInfo.isSeller && activeOrder && activeOrder.status !== 'COMPLETED' && (
                  <button
                    onClick={() => setDeliverModalOpen(true)}
                    className="admin-btn admin-btn-sm"
                    style={{ background: 'rgba(16,185,129,0.2)', color: '#10B981', border: '1px solid rgba(16,185,129,0.4)', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', fontWeight: 700 }}
                  >
                    <FiPackage size={13} /> Deliver Account
                  </button>
                )}

                {/* Prominent Header Delete Chat Button */}
                <button
                  onClick={() => handleDeleteChatThread(selectedOrderId)}
                  className="admin-btn admin-btn-sm"
                  style={{
                    background: 'rgba(239,68,68,0.18)', color: '#EF4444',
                    border: '1px solid rgba(239,68,68,0.4)',
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
                  }}
                  title="Delete Entire Chat Thread"
                >
                  <FiTrash2 size={13} /> Delete Chat
                </button>

                <button
                  onClick={() => setShowProfileDrawer(p => !p)}
                  style={{ background: showProfileDrawer ? 'rgba(142,68,173,0.3)' : 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 6, borderRadius: 8 }}
                  title="Toggle Profile Details"
                >
                  {selInfo.isSeller ? <MdStorefront size={20} color="#10B981" /> : <FiUser size={18} />}
                </button>
              </div>
            </div>

            {/* Active Dispute Information Banner */}
            {activeOrder?.status === 'DISPUTED' && (
              <div style={{
                padding: '10px 18px',
                background: 'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(239,68,68,0.12))',
                borderBottom: '1px solid rgba(139,92,246,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
                flexShrink: 0, zIndex: 3, position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', boxShadow: '0 2px 8px rgba(139,92,246,0.4)', flexShrink: 0
                  }}>
                    <FiShield size={15} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '0.82rem', color: '#DDD6FE' }}>
                      {isKhmer ? `ការបញ្ជាទិញ #${activeOrder.id} មានពាក្យបណ្តឹង/ស្នើសុំប្តូរទំនិញក្នុង DISPUTES` : `Order #${activeOrder.id} has an open dispute / replacement in DISPUTES`}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#A78BFA' }}>
                      {isKhmer ? 'អ្នកលក់កំពុងពិនិត្យ និងដោះស្រាយ។ Admin អាចចូលមើលព័ត៌មានលម្អិតក្នុង Disputes Center' : 'Seller is reviewing & fulfilling replacement. Admin can view in Disputes Center.'}
                    </div>
                  </div>
                </div>
                <Link
                  to="/admin/disputes"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 8,
                    background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                    color: '#FFF', textDecoration: 'none',
                    fontWeight: 800, fontSize: '0.76rem', cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(139,92,246,0.35)'
                  }}
                >
                  <FiShield size={13} />
                  {isKhmer ? 'ចូលទំព័រ DISPUTES' : 'View in DISPUTES'}
                </Link>
              </div>
            )}

            {/* Messages Viewport */}
            <div
              ref={messagesContainerRef}
              className="admin-chat-messages-container"
              style={{
                flex: 1, height: 0, minHeight: 0, overflowY: 'auto', padding: '16px 20px',
                display: 'flex', flexDirection: 'column', gap: 6,
                zIndex: 2
              }}
            >
              {activeMsgs.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', gap: 10, padding: 30 }}>
                  <FiInbox size={38} color={selInfo.isSeller ? '#10B981' : 'rgba(142,68,173,0.5)'} />
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)' }}>
                    {isKhmer ? 'មិនទាន់មានសារក្នុងការសន្ទនានេះនៅឡើយទេ' : 'No messages in this conversation yet'}
                  </p>
                </div>
              ) : (
                activeMsgs.map((msg, idx) => {
                  const isAdmin = msg.senderRole === 'ADMIN';
                  const prevMsg = activeMsgs[idx - 1];
                  const sameDay = prevMsg && new Date(msg.createdAt).toDateString() === new Date(prevMsg.createdAt).toDateString();
                  const showDate = !sameDay;
                  const sameSenderAsPrev = prevMsg?.senderRole === msg.senderRole;

                  return (
                    <React.Fragment key={msg.id || idx}>
                      {/* Date label */}
                      {showDate && (
                        <div style={{ textAlign: 'center', margin: '12px 0 8px' }}>
                          <span style={{
                            fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)',
                            background: 'rgba(0,0,0,0.35)', borderRadius: 20,
                            padding: '4px 14px', border: '1px solid rgba(255,255,255,0.06)'
                          }}>
                            {getAdminDateLabel(msg.createdAt)}
                          </span>
                        </div>
                      )}

                      {/* Chat Bubble */}
                      <div
                        className={isAdmin ? 'admin-msg-right' : 'admin-msg-left'}
                        style={{
                          display: 'flex',
                          flexDirection: isAdmin ? 'row-reverse' : 'row',
                          alignItems: 'flex-end',
                          gap: 8,
                          marginTop: sameSenderAsPrev ? 3 : 8
                        }}>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
                          <div style={{
                            padding: msg.type === 'voice' ? '8px 14px' : '10px 14px',
                            borderRadius: isAdmin
                              ? (sameSenderAsPrev ? '18px 6px 18px 18px' : '18px 18px 6px 18px')
                              : (sameSenderAsPrev ? '6px 18px 18px 18px' : '18px 18px 18px 6px'),
                            background: isAdmin
                              ? 'linear-gradient(135deg, #8E44AD 0%, #7C3AED 100%)'
                              : selInfo.isSeller
                              ? 'rgba(16, 185, 129, 0.16)'
                              : 'rgba(30, 24, 46, 0.85)',
                            color: '#FFFFFF',
                            fontSize: '0.92rem',
                            lineHeight: 1.45,
                            boxShadow: isAdmin ? '0 4px 16px rgba(142,68,173,0.35)' : '0 2px 8px rgba(0,0,0,0.3)',
                            border: isAdmin ? 'none' : (selInfo.isSeller ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.08)'),
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            position: 'relative'
                          }}>
                            
                            {/* Voice Message rendering */}
                            {msg.type === 'voice' ? (
                              <TelegramVoicePlayer
                                audioUrl={msg.audioUrl}
                                duration={msg.duration || '0:01'}
                                isAdmin={isAdmin}
                              />
                            ) : (
                              (typeof msg.content === 'string' && isImageMedia(msg.content)) ? (
                                <div style={{ marginTop: 4, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', maxWidth: 300 }} onClick={() => window.open(normalizeImageUrl(msg.content), '_blank')}>
                                  <img
                                    src={normalizeImageUrl(msg.content)}
                                    alt="Proof"
                                    style={{ width: '100%', maxHeight: 260, objectFit: 'cover', display: 'block', borderRadius: 10 }}
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      if (!e.target.src.includes('/api/admin/uploads/')) {
                                        const fname = e.target.src.split('/').pop();
                                        e.target.src = `/api/admin/uploads/${fname}`;
                                      } else {
                                        e.target.style.display = 'none';
                                      }
                                    }}
                                  />
                                </div>
                              ) : (
                                msg.content
                              )
                            )}

                            {/* Timestamp & Read Status inside bubble */}
                            <div style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                              gap: 4, marginTop: 4, float: 'right', marginLeft: 12
                            }}>
                              <span style={{
                                fontSize: '0.65rem',
                                color: isAdmin ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)',
                                lineHeight: 1
                              }}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isAdmin && <DoubleTick color="#FFFFFF" />}
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(msg.id)}
                                title="Delete message"
                                style={{
                                  background: 'none', border: 'none', color: 'rgba(239, 68, 68, 0.85)',
                                  cursor: 'pointer', padding: 0, marginLeft: 6, display: 'inline-flex', alignItems: 'center'
                                }}
                              >
                                <FiTrash2 size={11} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}

              {/* Sending indicator */}
              {sending && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6, gap: 4, alignItems: 'center' }}>
                  <span className="admin-typing-dot" />
                  <span className="admin-typing-dot" />
                  <span className="admin-typing-dot" />
                </div>
              )}
            </div>

            {/* Context-Aware Quick Replies Bar */}
            <div style={{
              padding: '6px 14px', background: '#151026',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', gap: 6, overflowX: 'auto', flexShrink: 0, zIndex: 10
            }}>
              {(selInfo.isSeller ? [
                'Store plan activated! ',
                'Dispute resolved in your favor.',
                'Withdrawal payout processed.',
                'Product stock approved.',
                '1-to-1 Replacement policy reminder.'
              ] : [
                'Your payment has been verified! ',
                'Digital account credentials sent.',
                '1-to-1 Replacement issued.',
                'Please share screenshot of the error.',
                'Thank you for your purchase!'
              ]).map((p, i) => (
                <button
                  key={i} type="button"
                  className="admin-quick-chip"
                  onClick={() => { setReplyText(p); inputRef.current?.focus({ preventScroll: true }); }}
                  style={{
                    whiteSpace: 'nowrap', fontSize: '0.74rem', padding: '5px 12px',
                    borderRadius: 20,
                    background: selInfo.isSeller ? 'rgba(16,185,129,0.15)' : 'rgba(142,68,173,0.15)',
                    border: selInfo.isSeller ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(142,68,173,0.35)',
                    color: selInfo.isSeller ? '#A7F3D0' : '#D7BDE2',
                    cursor: 'pointer', transition: 'all 0.18s', flexShrink: 0
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Bottom Input Bar */}
            <form
              onSubmit={handleSend}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px 14px',
                background: '#151026',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                zIndex: 10, flexShrink: 0
              }}
            >
              {isRecordingVoice ? (
                <VoiceRecorder
                  onRecordComplete={handleVoiceRecordComplete}
                  onCancel={() => setIsRecordingVoice(false)}
                />
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }}
                    title="Attach file or screenshot"
                  >
                    <FiPaperclip size={22} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        toast.success('Screenshot attached');
                      }
                    }}
                  />

                  <input
                    ref={inputRef}
                    type="text"
                    className="admin-input"
                    placeholder={selInfo.isSeller ? `Message ${selInfo.name} (Seller Line)...` : `Message ${selInfo.name} (Customer Support)...`}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    style={{
                      flex: 1, padding: '12px 20px', borderRadius: 24,
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#FFFFFF', fontSize: '0.92rem', outline: 'none'
                    }}
                  />

                  {replyText.trim() ? (
                    <button
                      type="submit"
                      className="admin-send-btn"
                      disabled={sending}
                      style={{
                        width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
                        background: selInfo.isSeller
                          ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                          : 'linear-gradient(135deg, #8E44AD 0%, #7C3AED 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: selInfo.isSeller ? '0 4px 14px rgba(16,185,129,0.5)' : '0 4px 14px rgba(142,68,173,0.5)'
                      }}
                    >
                      <FiSend size={18} color="#FFFFFF" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsRecordingVoice(true)}
                      style={{
                        width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
                        background: 'rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, color: 'rgba(255,255,255,0.7)'
                      }}
                      title="Record Voice Note"
                    >
                      <FiMic size={20} />
                    </button>
                  )}
                </>
              )}
            </form>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14, color: 'rgba(255,255,255,0.2)', background: '#0D0B14' }}>
            <FiInbox size={38} color="rgba(142,68,173,0.4)" />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>{isKhmer ? 'សូមជ្រើសរើសការសន្ទនា' : 'No conversation selected'}</p>
          </div>
        )}

        {/*  RIGHT SIDEBAR — Profile Details Drawer  */}
        {showProfileDrawer && selectedOrderId && (
          <div style={{
            background: '#151026',
            borderLeft: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', flexDirection: 'column', padding: '16px 14px',
            overflowY: 'auto', gap: 14
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                {selInfo.isSeller ? <MdStorefront size={17} color="#10B981" /> : <FiUser size={16} color="#A78BFA" />}
                {selInfo.isSeller ? 'Store Profile' : 'Customer Profile'}
              </span>
              <button onClick={() => setShowProfileDrawer(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                <FiX size={16} />
              </button>
            </div>

            {/* Profile Info Card */}
            <div style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 14,
              display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8,
              border: selInfo.isSeller ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(255,255,255,0.06)'
            }}>
              {selInfo.isSeller ? (
                <div style={{
                  width: 60, height: 60, borderRadius: 14,
                  background: selInfo.logo ? '#1E293B' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  border: '2px solid #10B981', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', color: '#fff', boxShadow: '0 4px 14px rgba(16,185,129,0.3)'
                }}>
                  {selInfo.logo ? (
                    <img src={selInfo.logo} alt={selInfo.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                  ) : (
                    <MdStorefront size={32} />
                  )}
                </div>
              ) : (
                <Avatar name={selInfo.name} email={selInfo.email} avatar={selInfo.avatar} size={56} />
              )}

              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  {selInfo.name}
                  {selInfo.isSeller && <MdVerified size={15} color="#1d9bf0" />}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#93C5FD', marginTop: 2 }}>{selInfo.email}</div>
                <span style={{
                  fontSize: '0.67rem', fontWeight: 800, padding: '2px 8px', borderRadius: 10,
                  background: selInfo.isSeller ? 'rgba(16,185,129,0.2)' : 'rgba(142,68,173,0.25)',
                  color: selInfo.isSeller ? '#34D399' : '#D7BDE2',
                  display: 'inline-block', marginTop: 4
                }}>
                  {selInfo.isSeller ? 'Verified Store Merchant' : 'Registered Customer'}
                </span>
              </div>
            </div>

            {/*  IF SELLER: Show Store Subscription & Quick Action Buttons  */}
            {selInfo.isSeller ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12, padding: '12px'
                }}>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>
                    Store Details
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)' }}>Subscription Plan:</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#FBBF24', background: 'rgba(251,191,36,0.15)', padding: '2px 8px', borderRadius: 6 }}>
                      {selInfo.plan === 'PLAN_3' ? 'VIP Plan ($6.00/mo)' : selInfo.plan === 'PLAN_2' ? 'Pro Plan ($4.50/mo)' : 'Basic Plan ($2.50/mo)'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)' }}>Store Status:</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: selInfo.status === 'ACTIVE' ? '#10B981' : '#EF4444', background: selInfo.status === 'ACTIVE' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', padding: '2px 8px', borderRadius: 6 }}>
                      {selInfo.status}
                    </span>
                  </div>
                  {selInfo.telegram && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)' }}>Telegram:</span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#38BDF8' }}>
                        @{selInfo.telegram}
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selInfo.sellerId && (
                    <Link
                      to={`/store/${selInfo.sellerId}`}
                      target="_blank"
                      className="admin-btn admin-btn-sm"
                      style={{
                        background: 'rgba(16,185,129,0.15)', color: '#34D399',
                        border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '0.78rem'
                      }}
                    >
                      <MdStorefront size={15} /> View Public Store Page
                    </Link>
                  )}
                  <Link
                    to="/admin/sellers"
                    className="admin-btn admin-btn-sm"
                    style={{
                      background: 'rgba(255,255,255,0.06)', color: '#CBD5E1',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '0.78rem'
                    }}
                  >
                    <FiShield size={14} /> Manage in Sellers Hub
                  </Link>
                </div>
              </div>
            ) : (
              /*  IF USER: Show Customer Orders List  */
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 2px' }}>
                  <FiShoppingBag size={14} color="#A78BFA" />
                  <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#fff' }}>
                    Customer Orders ({selInfo.customerOrders?.length || (activeOrder ? 1 : 0)})
                  </span>
                </div>

                {(selInfo.customerOrders && selInfo.customerOrders.length > 0 ? selInfo.customerOrders : activeOrder ? [activeOrder] : []).map(ord => {
                  const isActive = String(activeOrder?.id) === String(ord.id);
                  const statColor = ord.status === 'COMPLETED' ? '#10B981' : ord.status === 'PROCESSING' ? '#FBBF24' : ord.status === 'PENDING' ? '#60A5FA' : '#A78BFA';
                  const statBg = ord.status === 'COMPLETED' ? 'rgba(16,185,129,0.15)' : ord.status === 'PROCESSING' ? 'rgba(251,191,36,0.12)' : ord.status === 'PENDING' ? 'rgba(96,165,250,0.12)' : 'rgba(142,68,173,0.15)';
                  const prodItems = ord.items || [];
                  return (
                    <div
                      key={ord.id}
                      style={{
                        borderRadius: 14, overflow: 'hidden',
                        border: isActive ? '1.5px solid rgba(142,68,173,0.6)' : '1px solid rgba(255,255,255,0.07)',
                        background: isActive ? 'rgba(142,68,173,0.15)' : 'rgba(255,255,255,0.03)',
                      }}
                    >
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 12px', background: 'rgba(255,255,255,0.04)',
                        borderBottom: '1px solid rgba(255,255,255,0.05)'
                      }}>
                        <span style={{ fontWeight: 900, fontSize: '0.82rem', color: '#D7BDE2' }}>Order #{ord.id}</span>
                        <span style={{
                          fontWeight: 800, padding: '2px 8px', borderRadius: 8, fontSize: '0.66rem',
                          background: statBg, color: statColor, border: `1px solid ${statColor}33`
                        }}>
                          {ord.status}
                        </span>
                      </div>

                      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {prodItems.map((it, ii) => (
                          <div key={ii} style={{ fontSize: '0.76rem', color: '#fff', fontWeight: 600 }}>
                            • {it.productName || it.product?.name || 'Product'} (x{it.quantity || 1})
                          </div>
                        ))}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                            {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : ''}
                          </span>
                          <span style={{ fontWeight: 900, fontSize: '0.82rem', color: '#10B981' }}>
                            ${Number(ord.totalAmount || 0).toFixed(2)}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                          <Link
                            to={`/orders/${ord.id}`}
                            target="_blank"
                            className="admin-btn admin-btn-sm"
                            style={{ flex: 1, background: 'rgba(142,68,173,0.2)', color: '#D7BDE2', border: '1px solid rgba(142,68,173,0.4)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: '0.7rem', textDecoration: 'none', borderRadius: 8, padding: '4px 6px' }}
                          >
                            <FiExternalLink size={11} /> Order Details
                          </Link>
                          {ord.status !== 'COMPLETED' && (
                            <button
                              onClick={() => { setDeliverModalOpen(true); }}
                              className="admin-btn admin-btn-sm"
                              style={{ flex: 1, background: 'linear-gradient(135deg,#10B981,#059669)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.7rem', padding: '4px 6px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer' }}
                            >
                              <FiPackage size={11} /> Deliver
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* Profile Drawer Delete Conversation Button */}
            <div style={{ marginTop: 'auto', paddingTop: 10 }}>
              <button
                type="button"
                onClick={() => handleDeleteChatThread(selectedOrderId)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'rgba(239,68,68,0.18)',
                  border: '1px solid rgba(239,68,68,0.4)',
                  color: '#EF4444',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <FiTrash2 size={15} /> Delete Conversation
              </button>
            </div>

          </div>
        )}

      </div>

      {/* Deliver Modal */}
      <DeliverAccountModal
        isOpen={deliverModalOpen}
        onClose={() => setDeliverModalOpen(false)}
        orderId={selectedOrderId}
        customerName={selInfo.name}
        onDeliverSuccess={() => fetchAllChats(true)}
      />

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteConfirmModal.isOpen}
        onClose={() => setDeleteConfirmModal(prev => ({ ...prev, isOpen: false }))}
        title={deleteConfirmModal.title}
        message={deleteConfirmModal.message}
        onConfirm={deleteConfirmModal.onConfirm}
      />
    </div>
  );
};

export default AdminChatPage;
