import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FiCamera, FiUser, FiMail, FiLock, FiLogOut,
  FiEdit2, FiCheck, FiCheckCircle, FiX, FiEye, FiEyeOff,
  FiShoppingBag, FiChevronRight, FiShield, FiMessageSquare, FiHelpCircle, FiGlobe, FiTrash2,
  FiSmartphone, FiMonitor, FiCpu, FiAlertTriangle, FiRefreshCw, FiHeadphones, FiCopy
} from 'react-icons/fi';
import { MdStorefront, MdVerified } from 'react-icons/md';
import { useLanguage } from '../context/LanguageContext';
import { auth as authApi, devices as devicesApi, disputes as disputesApi, support as supportApi } from '../api/client';
import { getDeviceId } from '../utils/deviceInfo';
import ConfirmDeletePhotoModal from '../components/ConfirmDeletePhotoModal';
import ConfirmLogoutModal from '../components/ConfirmLogoutModal';
import UserChatHistoryModal from '../components/UserChatHistoryModal';
import UserHelpModal from '../components/UserHelpModal';
import { FaTelegram } from 'react-icons/fa';

const TELEGRAM_URL = 'https://t.me/saby_shop_support';

/*  tiny helpers  */
const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

/*  ui helpers (declared at top-level to preserve input focus)  */
const SectionCard = ({ children, style }) => (
  <div style={{
    background: 'var(--card-bg)',
    borderRadius: 16,
    border: '1px solid var(--border)',
    overflow: 'hidden',
    ...style
  }}>
    {children}
  </div>
);

const Row = ({ icon, label, value, onEdit, editActive }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 16px',
    borderBottom: '1px solid var(--border-light)',
  }}>
    <span style={{
      width: 36, height: 36, borderRadius: 10,
      background: 'var(--primary-light)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--primary)', flexShrink: 0
    }}>
      {icon}
    </span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-lighter)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text)', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{value}</div>
    </div>
    {onEdit && (
      <button onClick={onEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: editActive ? 'var(--primary)' : 'var(--text-lighter)', padding: 4 }}>
        <FiEdit2 size={16} />
      </button>
    )}
  </div>
);

const PwdInput = ({ placeholder, value, onChange, show, onToggle, autoFocus }) => (
  <div style={{ position: 'relative' }}>
    <input
      type={show ? 'text' : 'password'}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="input"
      style={{ paddingRight: 42 }}
      autoFocus={autoFocus}
    />
    <button
      type="button"
      onClick={onToggle}
      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-lighter)' }}
    >
      {show ? <FiEyeOff size={16} /> : <FiEye size={16} />}
    </button>
  </div>
);

const compressImage = (file, maxWidth = 300, maxHeight = 300, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function AccountPage() {
  const { user, isAuthenticated, isAdmin, logout, updateUser } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();

  /*  photo  */
  const fileRef = useRef(null);
  const userKey = (user?.email || user?.id || 'default').toLowerCase().trim();
  const [photo, setPhoto] = useState(() => {
    return user?.avatar || user?.photo || user?.photoUrl || localStorage.getItem(`user_avatar_${userKey}`) || localStorage.getItem(`userPhoto_${userKey}`) || localStorage.getItem('userPhoto') || null;
  });
  const [deletePhotoModalOpen, setDeletePhotoModalOpen] = useState(false);

  useEffect(() => {
    const saved = user?.avatar || user?.photo || user?.photoUrl || (userKey ? (localStorage.getItem(`user_avatar_${userKey}`) || localStorage.getItem(`userPhoto_${userKey}`)) : null) || localStorage.getItem('userPhoto');
    if (saved) setPhoto(saved);

    const controller = new AbortController();
    const email = user?.email;
    if (email) {
      authApi.getProfile({ signal: controller.signal })
        .then(res => {
          if (res.data?.avatar) {
            setPhoto(res.data.avatar);
            const lowerEmail = email.toLowerCase().trim();
            localStorage.setItem(`user_avatar_${lowerEmail}`, res.data.avatar);
            localStorage.setItem(`userPhoto_${lowerEmail}`, res.data.avatar);
            localStorage.setItem('userPhoto', res.data.avatar);
          }
        })
        .catch(() => {});
    }
    return () => controller.abort();
  }, [user?.email, user?.avatar]);

  /*  name  */
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);

  /*  password  */
  const [editingPwd, setEditingPwd] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  /* Support Helpdesk Tickets (Table 26: support_threads) */
  const [supportThreads, setSupportThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: '', message: '', priority: 'NORMAL' });
  const [savingTicket, setSavingTicket] = useState(false);

  const fetchSupportThreads = async () => {
    if (!isAuthenticated) return;
    setLoadingThreads(true);
    try {
      const res = await supportApi.getMyThreads();
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setSupportThreads(list);
    } catch (e) {
      console.warn("Could not load support tickets", e);
    } finally {
      setLoadingThreads(false);
    }
  };

  useEffect(() => {
    fetchSupportThreads();
  }, [isAuthenticated]);

  /*  OTP Reset Password Modal State  */
  const [resetOtpModalOpen, setResetOtpModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: Verify OTP, 2: New Password
  const [resetEmailVal, setResetEmailVal] = useState('');
  const [resetOtpVal, setResetOtpVal] = useState('');
  const [resetNewPwdVal, setResetNewPwdVal] = useState('');
  const [resetConfirmPwdVal, setResetConfirmPwdVal] = useState('');
  const [sendingResetOtp, setSendingResetOtp] = useState(false);
  const [verifyingResetOtp, setVerifyingResetOtp] = useState(false);
  const [showResetNewPwd, setShowResetNewPwd] = useState(false);
  const [showResetConfirmPwd, setShowResetConfirmPwd] = useState(false);

  const handleTriggerForgotPwd = async () => {
    const targetEmail = user?.email || resetEmailVal;
    if (!targetEmail) {
      toast.error(lang === 'km' ? 'សូមបញ្ចូលអ៊ីមែលរបស់អ្នក' : 'Please enter your email');
      return;
    }
    setSendingResetOtp(true);
    try {
      await authApi.forgotPassword(targetEmail);
      toast.success(
        lang === 'km' 
          ? `បានផ្ញើលេខកូដ OTP ទៅកាន់អ៊ីមែល ${targetEmail} រួចរាល់! (សូមពិនិត្យមើល Inbox/Spam)`
          : `OTP code sent to ${targetEmail}! Check Inbox/Spam.`
      );
      setResetEmailVal(targetEmail);
      setResetStep(1);
      setResetOtpModalOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP email');
    } finally {
      setSendingResetOtp(false);
    }
  };

  const handleNextToNewPasswordStep = () => {
    if (!resetOtpVal.trim() || resetOtpVal.trim().length < 4) {
      toast.error(lang === 'km' ? 'សូមបញ្ចូលលេខកូដ OTP ៤ ខ្ទង់ឱ្យបានត្រឹមត្រូវ' : 'Please enter valid 4-digit OTP code');
      return;
    }
    setResetStep(2);
    toast.success(lang === 'km' ? 'លេខកូដ OTP ត្រូវបានបញ្ចូល! សូមបង្កើតពាក្យសម្ងាត់ថ្មី' : 'OTP entered! Now enter your new password.');
  };

  const handleConfirmResetPwd = async () => {
    if (!resetOtpVal.trim()) {
      toast.error(lang === 'km' ? 'សូមបញ្ចូលលេខកូដ OTP' : 'Please enter the OTP code');
      return;
    }
    if (!resetNewPwdVal || resetNewPwdVal.length < 6) {
      toast.error(lang === 'km' ? 'ពាក្យសម្ងាត់ថ្មីយ៉ាងហោច ៦ តួអក្សរ' : 'New password must be at least 6 characters');
      return;
    }
    if (resetNewPwdVal !== resetConfirmPwdVal) {
      toast.error(lang === 'km' ? 'ពាក្យសម្ងាត់ទាំងពីរមិនត្រូវគ្នាទេ' : 'Passwords do not match');
      return;
    }

    setVerifyingResetOtp(true);
    try {
      await authApi.resetPassword(resetEmailVal, resetOtpVal.trim(), resetNewPwdVal);
      toast.success(lang === 'km' ? 'បានកំណត់ពាក្យសម្ងាត់ថ្មីដោយជោគជ័យ!' : 'Password reset successfully!');
      setResetOtpModalOpen(false);
      setResetOtpVal('');
      setResetNewPwdVal('');
      setResetConfirmPwdVal('');
      setResetStep(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setVerifyingResetOtp(false);
    }
  };

  /*  modals & unread  */
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [chatHistoryOpen, setChatHistoryOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [userUnreadCount, setUserUnreadCount] = useState(0);

  /*  replacement claims for user  */
  const [replacementClaims, setReplacementClaims] = useState([]);

  const fetchReplacementClaims = async () => {
    try {
      const res = await disputesApi.getBuyerDisputes();
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      const ready = list.filter(d => d.replacementAccountEmail || d.status === 'RESOLVED_REPLACED');
      setReplacementClaims(ready);
    } catch (err) {
      console.warn('Could not fetch buyer replacement claims:', err);
    }
  };

  const handleConfirmReplacement = (rc) => {
    const credText = `Account/Key: ${rc.replacementAccountEmail}${rc.replacementAccountPassword ? `\nPassword: ${rc.replacementAccountPassword}` : ''}`;
    navigator.clipboard.writeText(credText).catch(() => {});
    toast.success(
      lang === 'km'
        ? 'បានបញ្ជាក់ទទួលគណនីប្តូរថ្មី! ព័ត៌មាន Login ត្រូវបានចម្លង (Copied).'
        : 'Replacement confirmed! Login credentials copied to clipboard.',
      { duration: 5000 }
    );
  };

  /*  device management  */
  const [deviceList, setDeviceList] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [revokingId, setRevokingId] = useState(null);

  const fetchUserDevices = async () => {
    setLoadingDevices(true);
    try {
      const res = await devicesApi.getUserDevices();
      setDeviceList(res.data || res || []);
    } catch (err) {
      console.warn('Error fetching devices:', err);
    } finally {
      setLoadingDevices(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserDevices();
      fetchReplacementClaims();

      let eventSource;
      try {
        const token = localStorage.getItem('token');
        eventSource = new EventSource(`/api/devices/stream?token=${token}`);
        eventSource.addEventListener('device_update', () => {
          fetchUserDevices();
        });
      } catch (e) {
        console.warn('SSE stream error:', e);
      }

      return () => {
        if (eventSource) eventSource.close();
      };
    }
  }, [isAuthenticated]);

  /*  Confirm Revoke Device Modal State  */
  const [confirmRevokeModalOpen, setConfirmRevokeModalOpen] = useState(false);
  const [targetRevokeDevice, setTargetRevokeDevice] = useState(null);

  const requestRevokeDevice = (dev) => {
    if (dev.isCurrentDevice) {
      toast.error(lang === 'km' ? 'មិនអាចដកឧបករណ៍បច្ចុប្បន្នបានទេ!' : 'Cannot revoke current device!');
      return;
    }
    setTargetRevokeDevice(dev);
    setConfirmRevokeModalOpen(true);
  };

  const requestRevokeOthers = () => {
    setTargetRevokeDevice('ALL_OTHERS');
    setConfirmRevokeModalOpen(true);
  };

  const executeRevokeAction = async () => {
    if (!targetRevokeDevice) return;
    setRevokingId(targetRevokeDevice === 'ALL_OTHERS' ? 'ALL' : targetRevokeDevice.id);
    try {
      if (targetRevokeDevice === 'ALL_OTHERS') {
        await devicesApi.revokeOtherDevices();
        toast.success(lang === 'km' ? 'បានដកឧបករណ៍ផ្សេងទៀតទាំងអស់ចេញជោគជ័យ!' : 'All other devices revoked!');
      } else {
        await devicesApi.revokeDevice(targetRevokeDevice.id);
        toast.success(lang === 'km' ? 'បានដកឧបករណ៍ចេញជោគជ័យ!' : 'Device session revoked!');
      }
      setConfirmRevokeModalOpen(false);
      setTargetRevokeDevice(null);
      fetchUserDevices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to revoke device');
    } finally {
      setRevokingId(null);
    }
  };

  useEffect(() => {
    const checkUnread = () => {
      try {
        const userReadMap = JSON.parse(localStorage.getItem('user_chat_read_map') || '{}');
        const orderMap = {};
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('chat_messages_order_')) {
            const ordId = k.replace('chat_messages_order_', '');
            try {
              const msgs = JSON.parse(localStorage.getItem(k) || '[]');
              if (Array.isArray(msgs) && msgs.length > 0) orderMap[ordId] = msgs;
            } catch (_) {}
          }
        }
        let unread = 0;
        Object.keys(orderMap).forEach(ordId => {
          const msgs = orderMap[ordId].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg && lastMsg.senderRole === 'ADMIN') {
            const marker = lastMsg.id || lastMsg.createdAt;
            if (userReadMap[ordId] !== marker) unread++;
          }
        });
        setUserUnreadCount(unread);
      } catch (_) {}
    };

    checkUnread();
    const interval = setInterval(checkUnread, 3000);
    window.addEventListener('storage', checkUnread);
    window.addEventListener('user_chat_read_updated', checkUnread);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkUnread);
      window.removeEventListener('user_chat_read_updated', checkUnread);
    };
  }, []);

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
        <FiUser size={48} color="var(--primary)" />
        <h2 style={{ fontWeight: 800, color: 'var(--text)' }}>
          {lang === 'km' ? 'សូមចូលប្រើប្រាស់ដើម្បីមើលគណនីរបស់អ្នក' : 'Sign in to view your account'}
        </h2>
        <Link to="/login" className="btn btn-primary">{lang === 'km' ? 'ចូលប្រើប្រាស់' : 'Login'}</Link>
        <Link to="/register" className="btn btn-outline">{lang === 'km' ? 'បង្កើតគណនីថ្មី' : 'Create account'}</Link>
      </div>
    );
  }

  /*  handlers  */
  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(lang === 'km' ? 'សូមជ្រើសរើសរូបភាពដែលត្រឹមត្រូវ' : 'Please select a valid image file');
      return;
    }
    try {
      toast.loading(lang === 'km' ? 'កំពុងដំណើការរូបថត Profile...' : 'Processing profile photo...', { id: 'photo-upload' });
      const base64 = await compressImage(file, 300, 300, 0.85);
      setPhoto(base64);
      const key = userKey;
      localStorage.setItem(`userPhoto_${key}`, base64);
      if (user?.email) {
        const lowerEmail = user.email.toLowerCase().trim();
        localStorage.setItem(`user_avatar_${lowerEmail}`, base64);
        localStorage.setItem(`userPhoto_${lowerEmail}`, base64);
      }
      localStorage.setItem('userPhoto', base64);
      try {
        await updateUser({ avatar: base64, photo: base64, photoUrl: base64, imageUrl: base64 });
      } catch (err) {
        console.warn('Updated photo locally:', err);
      }
      toast.success(lang === 'km' ? 'បានបច្ចុប្បន្នភាពរូបថត Profile!' : 'Profile photo updated & saved!', { id: 'photo-upload' });
    } catch (err) {
      console.error('Error compressing photo:', err);
      toast.error(lang === 'km' ? 'បរាជ័យក្នុងការកែប្រែរូបថត' : 'Failed to process photo. Please try another image.', { id: 'photo-upload' });
    }
  };

  const handleDeletePhotoClick = () => {
    setDeletePhotoModalOpen(true);
  };

  const confirmDeletePhoto = async () => {
    setDeletePhotoModalOpen(false);
    try {
      setPhoto(null);
      const key = userKey;
      localStorage.removeItem(`userPhoto_${key}`);
      if (user?.email) {
        const lowerEmail = user.email.toLowerCase().trim();
        localStorage.removeItem(`user_avatar_${lowerEmail}`);
        localStorage.removeItem(`userPhoto_${lowerEmail}`);
      }
      localStorage.removeItem('userPhoto');
      try {
        await updateUser({ avatar: '', photo: '', photoUrl: '', imageUrl: '' });
      } catch (err) {
        console.warn('Cleared photo locally:', err);
      }
      toast.success(lang === 'km' ? 'បានលុបរូបថត Profile រួចរាល់!' : 'Profile photo removed!');
    } catch (err) {
      console.error('Error removing photo:', err);
    }
  };

  const saveName = async () => {
    const trimmed = nameVal.trim();
    if (!trimmed) {
      toast.error(lang === 'km' ? 'ឈ្មោះមិនអាចទទេបានទេ' : 'Name cannot be empty');
      return;
    }
    setSavingName(true);
    try {
      await updateUser({ name: trimmed });
      toast.success(lang === 'km' ? 'បានបច្ចុប្បន្នភាពឈ្មោះរួចរាល់!' : 'Name updated!');
      setEditingName(false);
    } finally { setSavingName(false); }
  };

  /*  Change Password OTP Modal State  */
  const [changePwdOtpModalOpen, setChangePwdOtpModalOpen] = useState(false);
  const [changePwdOtpVal, setChangePwdOtpVal] = useState('');
  const [verifyingChangePwdOtp, setVerifyingChangePwdOtp] = useState(false);

  const savePassword = async () => {
    if (!currentPwd) {
      toast.error(lang === 'km' ? 'សូមបញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្ន' : 'Enter your current password');
      return;
    }
    if (newPwd.length < 6) {
      toast.error(lang === 'km' ? 'ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោចណាស់ ៦ តួអក្សរ' : 'New password must be at least 6 characters');
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error(lang === 'km' ? 'ពាក្យសម្ងាត់មិនត្រូវគ្នាទេ' : 'Passwords do not match');
      return;
    }
    setSavingPwd(true);
    try {
      await authApi.sendChangePasswordOtp(currentPwd, newPwd);
      toast.success(
        lang === 'km'
          ? `បានផ្ញើលេខកូដ OTP ទៅកាន់អ៊ីមែល ${user?.email}! សូមបញ្ចូលលេខកូដដើម្បីបញ្ជាក់ការប្ដូរពាក្យសម្ងាត់។`
          : `OTP code sent to ${user?.email}! Enter OTP to confirm password change.`
      );
      setChangePwdOtpModalOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.message || (lang === 'km' ? 'ពាក្យសម្ងាត់បច្ចុប្បន្នមិនត្រឹមត្រូវទេ' : 'Failed to request OTP. Check current password.'));
    } finally {
      setSavingPwd(false);
    }
  };

  const handleConfirmChangePasswordWithOtp = async () => {
    if (!changePwdOtpVal.trim() || changePwdOtpVal.trim().length < 4) {
      toast.error(lang === 'km' ? 'សូមបញ្ចូលលេខកូដ OTP ៤ ខ្ទង់ឱ្យបានត្រឹមត្រូវ' : 'Please enter valid 4-digit OTP code');
      return;
    }
    setVerifyingChangePwdOtp(true);
    try {
      await authApi.confirmChangePassword(changePwdOtpVal.trim());
      toast.success(lang === 'km' ? 'បានផ្លាស់ប្ដូរពាក្យសម្ងាត់ដោយជោគជ័យ!' : 'Password changed successfully!');
      setChangePwdOtpModalOpen(false);
      setEditingPwd(false);
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setChangePwdOtpVal('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP code');
    } finally {
      setVerifyingChangePwdOtp(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };



  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 100px' }}>

      {/*  Header Banner  */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
        padding: '40px 24px 70px',
        position: 'relative',
      }}>
        <h1 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
          {lang === 'km' ? 'គណនីរបស់ខ្ញុំ' : 'My Account'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.83rem', marginTop: 2 }}>
          {lang === 'km' ? 'គ្រប់គ្រងព័ត៌មានរូបថត & ការកំណត់' : 'Manage your profile & settings'}
        </p>
      </div>

      {/*  Avatar floating over banner  */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: -52, marginBottom: 16, position: 'relative', zIndex: 2 }}>
        <div style={{ position: 'relative' }}>
          {photo ? (
            <img
              src={photo}
              alt="Profile"
              style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '4px solid white', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
            />
          ) : (
            <div style={{
              width: 96, height: 96, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              border: '4px solid white',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', fontWeight: 800, color: 'white'
            }}>
              {getInitials(user?.name)}
            </div>
          )}

          {/* Camera button */}
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              position: 'absolute', bottom: 2, right: 2,
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--primary)', border: '2px solid white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
            aria-label="Change profile photo"
            title={lang === 'km' ? 'ប្ដូររូបថត Profile' : 'Change profile photo'}
          >
            <FiCamera size={13} />
          </button>

          {/* Delete photo button (only shown when photo exists) */}
          {photo && (
            <button
              type="button"
              onClick={handleDeletePhotoClick}
              style={{
                position: 'absolute', bottom: 2, left: 2,
                width: 28, height: 28, borderRadius: '50%',
                background: '#EF4444', border: '2px solid white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
              aria-label="Delete profile photo"
              title={lang === 'km' ? 'លុបរូបថត Profile' : 'Remove profile photo'}
            >
              <FiTrash2 size={13} />
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
        </div>
      </div>

      {/*  Name under avatar  */}
      <div style={{ textAlign: 'center', marginBottom: 24, padding: '0 16px' }}>
        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {user?.name || 'User'}
          {user?.role === 'SELLER' && <MdVerified size={18} color="#1d9bf0" />}
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-lighter)', marginBottom: 4 }}>{user?.email}</div>
        {user?.role === 'SELLER' && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'rgba(29, 155, 240, 0.08)', color: '#1d9bf0',
            fontSize: '0.74rem', fontWeight: 800, padding: '3px 10px', borderRadius: 12,
            border: '1px solid rgba(29, 155, 240, 0.25)', marginTop: 4
          }}>
            Verified Seller <MdVerified size={13} color="#1d9bf0" />
          </span>
        )}
        {isAdmin && (
          <span className="badge badge-info" style={{ marginTop: 6, fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center' }}>
            <FiShield style={{ marginRight: 3 }} /> {lang === 'km' ? 'សិទ្ធិ Admin' : 'Admin Access'}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 16px' }}>

        {/*  REPLACEMENT CREDENTIALS / CONFIRM CHANGE ACCOUNT  */}
        {replacementClaims.length > 0 && (
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, paddingLeft: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiCheckCircle size={15} color="#10B981" />
              {lang === 'km' ? 'គណនីប្តូរថ្មីរបស់អ្នក (Replacement Account Ready)' : 'Replacement Account Ready'}
            </p>
            <div style={{ display: 'grid', gap: 12 }}>
              {replacementClaims.map(rc => (
                <div
                  key={rc.id}
                  style={{
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.03))',
                    border: '1.5px solid #86EFAC',
                    borderRadius: 18,
                    padding: '18px 20px',
                    boxShadow: '0 4px 16px rgba(16,185,129,0.08)'
                  }}
                >
                  {/* Product Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid rgba(16,185,129,0.2)' }}>
                    {rc.productImageUrl && (
                      <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', border: '1px solid #86EFAC', flexShrink: 0 }}>
                        <img src={rc.productImageUrl} alt={rc.productName || 'Product'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text)' }}>
                        {rc.productName || (lang === 'km' ? 'ផលិតផលឌីជីថល' : 'Digital Product')}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>
                        {lang === 'km' ? 'ការបញ្ជាទិញ' : 'Order'} #{rc.orderId} · {lang === 'km' ? 'បានប្តូរថ្មីជូន' : 'Replacement Delivered'}
                      </div>
                    </div>
                    <span style={{ background: '#DCFCE7', color: '#15803D', fontWeight: 800, fontSize: '0.72rem', padding: '3px 8px', borderRadius: 6 }}>
                      {lang === 'km' ? 'រួចរាល់' : 'Ready'}
                    </span>
                  </div>

                  {/* Credentials Box */}
                  <div style={{ background: '#FFF', borderRadius: 12, padding: '12px 14px', border: '1px solid #BBF7D0', marginBottom: 12, display: 'grid', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                      <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700 }}>
                        {lang === 'km' ? 'គណនី / Key ថ្មី:' : 'New Account / Key:'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <code style={{ background: '#F0FDF4', padding: '2px 8px', borderRadius: 6, fontWeight: 800, color: '#15803D', fontSize: '0.86rem' }}>
                          {rc.replacementAccountEmail}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(rc.replacementAccountEmail);
                            toast.success(lang === 'km' ? 'បានចម្លងគណនី!' : 'Account copied!');
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#059669', padding: 2, display: 'inline-flex', alignItems: 'center' }}
                          title="Copy"
                        >
                          <FiCopy size={13} />
                        </button>
                      </div>
                    </div>

                    {rc.replacementAccountPassword && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                        <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700 }}>
                          {lang === 'km' ? 'ពាក្យសម្ងាត់ថ្មី:' : 'New Password:'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <code style={{ background: '#F0FDF4', padding: '2px 8px', borderRadius: 6, fontWeight: 800, color: '#15803D', fontSize: '0.86rem' }}>
                            {rc.replacementAccountPassword}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(rc.replacementAccountPassword);
                              toast.success(lang === 'km' ? 'បានចម្លងពាក្យសម្ងាត់!' : 'Password copied!');
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#059669', padding: 2, display: 'inline-flex', alignItems: 'center' }}
                            title="Copy"
                          >
                            <FiCopy size={13} />
                          </button>
                        </div>
                      </div>
                    )}

                    {rc.replacementNote && (
                      <div style={{ fontSize: '0.78rem', color: '#166534', fontStyle: 'italic', paddingTop: 6, borderTop: '1px dashed #DCFCE7' }}>
                        <strong>{lang === 'km' ? 'កំណត់ចំណាំអ្នកលក់:' : 'Seller Note:'}</strong> {rc.replacementNote}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons: Confirm Change Account & Login */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleConfirmReplacement(rc)}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        borderRadius: 10,
                        border: 'none',
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                        color: '#FFF',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: '0 3px 10px rgba(16,185,129,0.35)'
                      }}
                    >
                      <FiCheckCircle size={16} />
                      {lang === 'km' ? 'បញ្ជាក់ប្តូរគណនី & Login ប្រើប្រាស់' : 'Confirm Change Account & Login'}
                    </button>
                    <Link
                      to={`/orders/${rc.orderId}`}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '1px solid #86EFAC',
                        background: '#FFF',
                        color: '#15803D',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      {lang === 'km' ? 'មើល Order' : 'View Order'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/*  Profile Info  */}
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-lighter)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, paddingLeft: 4 }}>
            {lang === 'km' ? 'ព័ត៌មាន Profile' : 'Profile'}
          </p>
          <SectionCard>
            <Row
              icon={<FiUser size={16} />}
              label={lang === 'km' ? 'ឈ្មោះបង្ហាញ' : 'Display Name'}
              value={user?.name || '—'}
              onEdit={() => { setEditingName(v => !v); setNameVal(user?.name || ''); }}
              editActive={editingName}
            />
            {editingName && (
              <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', display: 'flex', gap: 8 }}>
                <input
                  className="input"
                  value={nameVal}
                  onChange={e => setNameVal(e.target.value)}
                  placeholder={lang === 'km' ? 'ឈ្មោះបង្ហាញរបស់អ្នក' : 'Your display name'}
                  style={{ flex: 1 }}
                  onKeyDown={e => e.key === 'Enter' && saveName()}
                  autoFocus
                />
                <button onClick={saveName} disabled={savingName} className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
                  {savingName ? '...' : <FiCheck size={15} />}
                </button>
                <button onClick={() => setEditingName(false)} className="btn btn-outline btn-sm" style={{ flexShrink: 0 }}>
                  <FiX size={15} />
                </button>
              </div>
            )}
          </SectionCard>
        </div>

        {/*  Login Info  */}
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-lighter)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, paddingLeft: 4 }}>
            {lang === 'km' ? 'ព័ត៌មានចូលប្រើប្រាស់' : 'Login Info'}
          </p>
          <SectionCard>
            <Row
              icon={<FiMail size={16} />}
              label={lang === 'km' ? 'អាសយដ្ឋានអ៊ីមែល' : 'Email Address'}
              value={user?.email || '—'}
            />
            <div style={{ padding: '6px 16px 10px', fontSize: '0.76rem', color: 'var(--text-lighter)', fontStyle: 'italic' }}>
              {lang === 'km'
                ? 'អ៊ីមែលមិនអាចកែប្រែបានទេ! សូមទាក់ទងផ្នែកជំនួយប្រសិនបើត្រូវការប្ដូរ។'
                : 'Email cannot be changed. Contact support if you need to update it.'
              }
            </div>

            {/* Password row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px',
            }}>
              <span style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                <FiLock size={16} />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-lighter)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {lang === 'km' ? 'ពាក្យសម្ងាត់' : 'Password'}
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text)' }}>••••••••</div>
              </div>
              <button onClick={() => setEditingPwd(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: editingPwd ? 'var(--primary)' : 'var(--text-lighter)', padding: 4 }}>
                <FiEdit2 size={16} />
              </button>
            </div>

            {editingPwd && (
              <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <PwdInput
                  placeholder={lang === 'km' ? 'ពាក្យសម្ងាត់បច្ចុប្បន្ន' : 'Current password'}
                  value={currentPwd} onChange={setCurrentPwd} show={showCurrent} onToggle={() => setShowCurrent(v => !v)}
                />
                <PwdInput
                  placeholder={lang === 'km' ? 'ពាក្យសម្ងាត់ថ្មី (យ៉ាងហោច ៦ តួអក្សរ)' : 'New password (min 6 chars)'}
                  value={newPwd} onChange={setNewPwd} show={showNew} onToggle={() => setShowNew(v => !v)}
                />
                <PwdInput
                  placeholder={lang === 'km' ? 'បញ្ជាក់ពាក្យសម្ងាត់ថ្មី' : 'Confirm new password'}
                  value={confirmPwd} onChange={setConfirmPwd} show={showConfirm} onToggle={() => setShowConfirm(v => !v)}
                />
                
                {/*  Forgot Password Link  */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -2, marginBottom: 2 }}>
                  <button
                    type="button"
                    onClick={handleTriggerForgotPwd}
                    disabled={sendingResetOtp}
                    style={{
                      background: 'none', border: 'none', color: 'var(--primary)',
                      fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                      padding: '2px 0', textDecoration: 'underline'
                    }}
                  >
                    {sendingResetOtp
                      ? (lang === 'km' ? 'កំពុងផ្ញើ OTP...' : 'Sending OTP...')
                      : (lang === 'km' ? 'ភ្លេចពាក្យសម្ងាត់?' : 'Forgot password?')
                    }
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={savePassword} disabled={savingPwd} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                    {savingPwd ? (lang === 'km' ? 'កំពុងរក្សាទុក...' : 'Saving...') : (lang === 'km' ? 'រក្សាទុកពាក្យសម្ងាត់' : 'Save Password')}
                  </button>
                  <button onClick={() => { setEditingPwd(false); setCurrentPwd(''); setNewPwd(''); setConfirmPwd(''); }} className="btn btn-outline btn-sm">
                    {lang === 'km' ? 'បោះបង់' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        {/*  Devices & Active Sessions (ឧបករណ៍ & សុវត្ថិភាព)  */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingLeft: 4, paddingRight: 4 }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-lighter)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
              {lang === 'km' ? 'ឧបករណ៍ និងសុវត្ថិភាព' : 'Devices & Security'}
            </p>

            {deviceList.filter(d => !d.isCurrentDevice && d.status !== 'REVOKED').length > 0 && (
              <button
                type="button"
                onClick={requestRevokeOthers}
                style={{
                  background: 'none', border: 'none', color: '#EF4444',
                  fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
                }}
              >
                {lang === 'km' ? 'ដកឧបករណ៍ផ្សេងទៀតទាំងអស់' : 'Revoke All Other Devices'}
              </button>
            )}
          </div>

          <SectionCard>
            {loadingDevices && deviceList.filter(d => d.status !== 'REVOKED').length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-lighter)', fontSize: '0.85rem' }}>
                <FiRefreshCw className="spin" style={{ marginRight: 6 }} /> {lang === 'km' ? 'កំពុងផ្ទុកឧបករណ៍...' : 'Loading devices...'}
              </div>
            ) : deviceList.filter(d => d.status !== 'REVOKED').length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-lighter)', fontSize: '0.85rem' }}>
                {lang === 'km' ? 'គ្មានទិន្នន័យឧបករណ៍ទេ' : 'No active devices found'}
              </div>
            ) : (
              deviceList.filter(d => d.status !== 'REVOKED').map((dev) => {
                const isMobile = (dev.os || '').toLowerCase().includes('android') || (dev.os || '').toLowerCase().includes('ios');
                const isRevoked = dev.status === 'REVOKED';
                const localId = getDeviceId();
                const activeCount = deviceList.filter(d => d.status !== 'REVOKED').length;
                const isThisDevice = dev.isCurrentDevice || (dev.deviceId && dev.deviceId === localId) || (activeCount === 1 && !isRevoked);

                return (
                  <div
                    key={dev.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px',
                      borderBottom: '1px solid var(--border-light)',
                      background: isThisDevice ? 'rgba(79, 70, 229, 0.04)' : 'transparent'
                    }}
                  >
                    <span style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: isThisDevice ? 'var(--primary-light)' : 'var(--bg-secondary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isThisDevice ? 'var(--primary)' : 'var(--text-lighter)',
                      flexShrink: 0
                    }}>
                      {isMobile ? <FiSmartphone size={18} /> : <FiMonitor size={18} />}
                    </span>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
                          {dev.deviceName || dev.browser}
                        </span>
                        {isAdmin ? (
                          <span style={{
                            background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', color: '#fff',
                            fontSize: '0.65rem', fontWeight: 800, padding: '2px 7px',
                            borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 3
                          }}>
                            <FiShield size={10} /> {lang === 'km' ? 'គណនី Admin' : 'ADMIN SESSION'}
                          </span>
                        ) : (
                          <span style={{
                            background: 'rgba(59, 130, 246, 0.12)', color: '#2563EB',
                            fontSize: '0.65rem', fontWeight: 800, padding: '2px 7px',
                            borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 3
                          }}>
                            <FiUser size={10} /> {lang === 'km' ? 'គណនីអតិថិជន' : 'USER SESSION'}
                          </span>
                        )}
                        {isThisDevice && (
                          <span style={{
                            background: 'linear-gradient(135deg, #4F46E5, #3730A3)', color: 'white',
                            fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px',
                            borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 3
                          }}>
                            <FiSmartphone size={10} /> {lang === 'km' ? 'ឧបករណ៍របស់អ្នក' : 'YOUR DEVICE'}
                          </span>
                        )}
                        {dev.isNewDevice && !isThisDevice && (
                          <span style={{
                            background: '#F59E0B', color: 'white',
                            fontSize: '0.65rem', fontWeight: 800, padding: '2px 7px',
                            borderRadius: 6
                          }}>
                            {lang === 'km' ? ' ឧបករណ៍ថ្មី' : ' NEW'}
                          </span>
                        )}
                        {isRevoked && (
                          <span style={{
                            background: '#EF4444', color: 'white',
                            fontSize: '0.65rem', fontWeight: 800, padding: '2px 7px',
                            borderRadius: 6
                          }}>
                            {lang === 'km' ? ' បានដកចេញ' : ' REVOKED'}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-lighter)', marginTop: 2 }}>
                        IP: {dev.ipAddress} • {dev.os || 'OS'} • {dev.browser || 'Browser'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-lighter)', marginTop: 1 }}>
                        {lang === 'km' ? 'សកម្មភាពចុងក្រោយ: ' : 'Last active: '}
                        {dev.lastActive ? new Date(dev.lastActive).toLocaleString() : 'Just now'}
                      </div>
                    </div>

                    {!isThisDevice && !isRevoked && (
                      <button
                        onClick={() => requestRevokeDevice(dev)}
                        disabled={revokingId === dev.id}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444',
                          border: 'none', padding: '6px 10px', borderRadius: 8,
                          fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                          flexShrink: 0
                        }}
                      >
                        {revokingId === dev.id ? '...' : (lang === 'km' ? 'ដកចេញ' : 'Revoke')}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </SectionCard>
        </div>

        {/*  Quick Links  */}
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-lighter)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, paddingLeft: 4 }}>
            {lang === 'km' ? 'សកម្មភាពរបស់ខ្ញុំ' : 'My Activity'}
          </p>
          <SectionCard>
            <Link to="/orders" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: '1px solid var(--border-light)', color: 'var(--text)', textDecoration: 'none' }}>
              <span style={{ width: 36, height: 36, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6', flexShrink: 0 }}>
                <FiShoppingBag size={16} />
              </span>
              <span style={{ flex: 1, fontWeight: 600, fontSize: '0.92rem' }}>
                {lang === 'km' ? 'ការបញ្ជាទិញរបស់ខ្ញុំ' : 'My Orders'}
              </span>
              <FiChevronRight size={16} color="var(--text-lighter)" />
            </Link>

            <div
              onClick={() => {
                window.dispatchEvent(new Event('open_saku_support'));
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                borderBottom: '1px solid var(--border-light)', color: 'var(--text)',
                cursor: 'pointer'
              }}
            >
              <span style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#ffffff', flexShrink: 0, position: 'relative',
                boxShadow: '0 3px 10px rgba(37,99,235,0.35)'
              }}>
                <FiHeadphones size={20} />
                {userUnreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -2, right: -2,
                    width: 12, height: 12, borderRadius: '50%',
                    background: '#FF2B6D', border: '2px solid #fff'
                  }} />
                )}
              </span>
              <span style={{ flex: 1, fontWeight: 700, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                {lang === 'km' ? 'ផ្នែកជំនួយការ (SAKU AI)' : 'Admin Support Chat (SAKU AI)'}
                {userUnreadCount > 0 && (
                  <span style={{
                    background: '#FF2B6D', color: '#fff', fontSize: '0.72rem', fontWeight: 800,
                    borderRadius: '9999px', padding: '4px 10px', lineHeight: 1, whiteSpace: 'nowrap',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {userUnreadCount} {lang === 'km' ? 'សារថ្មី' : 'NEW'}
                  </span>
                )}
              </span>
              <FiChevronRight size={16} color="var(--text-lighter)" />
            </div>

            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: '1px solid var(--border-light)', color: 'var(--text)', textDecoration: 'none' }}
            >
              <span style={{ width: 36, height: 36, borderRadius: 10, background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0088cc', flexShrink: 0 }}>
                <FaTelegram size={18} />
              </span>
              <span style={{ flex: 1, fontWeight: 600, fontSize: '0.92rem' }}>
                {lang === 'km' ? 'ផ្នែកជំនួយ Telegram' : 'Telegram Support'}
              </span>
              <FiChevronRight size={16} color="var(--text-lighter)" />
            </a>

            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                borderBottom: isAdmin ? '1px solid var(--border-light)' : 'none', color: 'var(--text)',
                textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left'
              }}
            >
              <span style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255, 71, 133, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF4785', flexShrink: 0 }}>
                <FiHelpCircle size={17} />
              </span>
              <span style={{ flex: 1, fontWeight: 600, fontSize: '0.92rem' }}>
                {lang === 'km' ? 'មជ្ឈមណ្ឌលជំនួយ & សំណួរញឹកញាប់' : 'Help & Support Center'}
              </span>
              <FiChevronRight size={16} color="var(--text-lighter)" />
            </button>

            {isAdmin && (
              <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: '1px solid var(--border-light)', color: 'var(--text)', textDecoration: 'none' }}>
                <span style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--secondary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)', flexShrink: 0 }}>
                  <FiShield size={16} />
                </span>
                <span style={{ flex: 1, fontWeight: 600, fontSize: '0.92rem' }}>
                  {lang === 'km' ? 'ផ្ទាំងគ្រប់គ្រង Admin' : 'Admin Dashboard'}
                </span>
                <FiChevronRight size={16} color="var(--text-lighter)" />
              </Link>
            )}

            {/*  Seller: Show dashboard if SELLER, or "Become a Seller" if CUSTOMER  */}
            {user?.role === 'SELLER' ? (
              <Link to="/seller" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', color: 'var(--text)', textDecoration: 'none', borderTop: '1px solid var(--border-light)' }} id="account-seller-dashboard-link">
                <span style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(124,58,237,0.12))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                  <MdStorefront size={16} />
                </span>
                <span style={{ flex: 1, fontWeight: 600, fontSize: '0.92rem' }}>
                  {lang === 'km' ? 'ផ្ទាំងគ្រប់គ្រងហាង' : 'My Seller Dashboard'}
                </span>
                <FiChevronRight size={16} color="var(--text-lighter)" />
              </Link>
            ) : !isAdmin && (
              <Link to="/seller/onboard" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', color: 'var(--text)', textDecoration: 'none', borderTop: '1px solid var(--border-light)' }} id="account-become-seller-link">
                <span style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(124,58,237,0.12))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                  <MdStorefront size={16} />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text)' }}>
                    {lang === 'km' ? 'បើកហាងលក់ផ្ទាល់ខ្លួន' : 'Become a Seller'}
                  </div>
                  <div style={{ fontSize: '0.77rem', color: 'var(--primary)', fontWeight: 600 }}>$2.50/month · Start selling digital products</div>
                </div>
                <FiChevronRight size={16} color="var(--text-lighter)" />
              </Link>
            )}
          </SectionCard>
        </div>

        {/*  Support Tickets & Helpdesk (Table 26: support_threads)  */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingLeft: 4, paddingRight: 4 }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-lighter)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
              {lang === 'km' ? 'សំបុត្រជំនួយ & Support Tickets' : 'Support Helpdesk Tickets (Table 26)'}
            </p>
            <button
              type="button"
              onClick={() => setShowNewTicketModal(true)}
              style={{
                background: 'none', border: 'none', color: '#2563EB',
                fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer'
              }}
            >
              + {lang === 'km' ? 'បង្កើតសំបុត្រថ្មី' : 'Open New Ticket'}
            </button>
          </div>

          <SectionCard>
            {loadingThreads ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-lighter)', fontSize: '0.85rem' }}>
                <FiRefreshCw className="spin" style={{ marginRight: 6 }} /> {lang === 'km' ? 'កំពុងទាញយកសំបុត្រ...' : 'Loading tickets...'}
              </div>
            ) : supportThreads.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-lighter)', fontSize: '0.85rem' }}>
                {lang === 'km' ? 'មិនទាន់មានសំបុត្រជំនួយនៅឡើយទេ' : 'No support tickets yet. Click "Open New Ticket" if you need assistance.'}
              </div>
            ) : (
              supportThreads.map((st) => (
                <div
                  key={st.id}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text)' }}>
                      {st.subject}
                    </span>
                    <span style={{
                      padding: '2px 8px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 800,
                      background: st.status === 'RESOLVED' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                      color: st.status === 'RESOLVED' ? '#10B981' : '#D97706'
                    }}>
                      {st.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-light)', lineHeight: 1.4 }}>
                    {st.message}
                  </div>
                  {st.adminNotes && (
                    <div style={{ fontSize: '0.78rem', color: '#2563EB', background: 'rgba(37,99,235,0.06)', padding: '6px 10px', borderRadius: 8, marginTop: 4 }}>
                      <strong>{lang === 'km' ? 'ការឆ្លើយតបពី Admin៖ ' : 'Admin Response: '}</strong>{st.adminNotes}
                    </div>
                  )}
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-lighter)', marginTop: 2 }}>
                    {st.createdAt ? new Date(st.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ''}
                  </div>
                </div>
              ))
            )}
          </SectionCard>
        </div>

        {/* Modal: New Support Ticket */}
        {showNewTicketModal && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: 16
          }}>
            <div style={{
              background: 'var(--card-bg, #fff)',
              borderRadius: 20, padding: 24, width: '100%', maxWidth: 440,
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              border: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>
                  {lang === 'km' ? 'បើកសំបុត្រជំនួយថ្មី' : 'Open Support Ticket'}
                </h3>
                <button onClick={() => setShowNewTicketModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-lighter)' }}>
                  <FiX size={20} />
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                setSavingTicket(true);
                try {
                  await supportApi.createThread(ticketForm);
                  toast.success(lang === 'km' ? 'បានផ្ញើសំបុត្រជំនួយជោគជ័យ!' : 'Support ticket submitted!');
                  setShowNewTicketModal(false);
                  setTicketForm({ subject: '', message: '', priority: 'NORMAL' });
                  fetchSupportThreads();
                } catch (err) {
                  toast.error(err?.response?.data?.message || 'Failed to submit ticket');
                } finally {
                  setSavingTicket(false);
                }
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light)' }}>
                      {lang === 'km' ? 'ប្រធានបទ' : 'SUBJECT'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Account activation issue"
                      value={ticketForm.subject}
                      onChange={e => setTicketForm(f => ({ ...f, subject: e.target.value }))}
                      className="input"
                      style={{ width: '100%', marginTop: 4 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light)' }}>
                      {lang === 'km' ? 'កម្រិតបន្ទាន់' : 'PRIORITY'}
                    </label>
                    <select
                      value={ticketForm.priority}
                      onChange={e => setTicketForm(f => ({ ...f, priority: e.target.value }))}
                      className="input"
                      style={{ width: '100%', marginTop: 4 }}
                    >
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light)' }}>
                      {lang === 'km' ? 'សាររៀបរាប់' : 'MESSAGE'}
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Please describe your question or issue in detail..."
                      value={ticketForm.message}
                      onChange={e => setTicketForm(f => ({ ...f, message: e.target.value }))}
                      className="input"
                      style={{ width: '100%', marginTop: 4, resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                    <button type="button" onClick={() => setShowNewTicketModal(false)} className="btn btn-outline btn-sm">
                      {lang === 'km' ? 'បោះបង់' : 'Cancel'}
                    </button>
                    <button type="submit" disabled={savingTicket} className="btn btn-primary btn-sm">
                      {savingTicket ? (lang === 'km' ? 'កំពុងផ្ញើ...' : 'Sending...') : (lang === 'km' ? 'ផ្ញើសំបុត្រ' : 'Submit Ticket')}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/*  Settings & Language Section  */}
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-lighter)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, paddingLeft: 4 }}>
            {lang === 'km' ? 'ការកំណត់ & ភាសា' : 'Settings & Language'}
          </p>
          <SectionCard>
            {/* Language Toggle Row */}
            <div 
              onClick={() => setLang(lang === 'km' ? 'en' : 'km')}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                borderBottom: '1px solid var(--border-light)', cursor: 'pointer'
              }}
            >
              <span style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                <FiGlobe size={18} />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-lighter)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {lang === 'km' ? 'ភាសាកម្មវិធី' : 'App Language'}
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text)' }}>
                  {lang === 'km' ? 'ភាសាខ្មែរ' : 'English'}
                </div>
              </div>
              <button 
                type="button" 
                className="btn btn-outline btn-sm"
                style={{ padding: '4px 12px', fontSize: '0.78rem', borderRadius: '20px', fontWeight: 800 }}
              >
                {lang === 'km' ? 'Switch to EN' : 'ប្ដូរទៅ ខ្មែរ'}
              </button>
            </div>

            {/* Logout Row */}
            <div 
              onClick={() => setLogoutOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                color: 'var(--danger)', cursor: 'pointer'
              }}
            >
              <span style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', flexShrink: 0 }}>
                <FiLogOut size={17} />
              </span>
              <span style={{ flex: 1, fontWeight: 700, fontSize: '0.92rem' }}>
                {lang === 'km' ? 'ចាកចេញ' : 'Logout'}
              </span>
              <FiChevronRight size={16} color="var(--danger)" />
            </div>
          </SectionCard>
        </div>

      </div>

      <UserChatHistoryModal
        isOpen={chatHistoryOpen}
        onClose={() => setChatHistoryOpen(false)}
      />

      <UserHelpModal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
      />

      <ConfirmDeletePhotoModal
        isOpen={deletePhotoModalOpen}
        onClose={() => setDeletePhotoModalOpen(false)}
        onConfirm={confirmDeletePhoto}
      />

      <ConfirmLogoutModal
        isOpen={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
      />

      {/*  OTP Reset Password Modal (2-Step Clean Flow)  */}
      {resetOtpModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1200,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: 'var(--card-bg)', borderRadius: 20, width: '100%', maxWidth: 440,
            border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
            overflow: 'hidden', animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #FF4785 0%, #8B5CF6 100%)',
              padding: '18px 20px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FiLock size={20} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem' }}>
                    {resetStep === 1
                      ? (lang === 'km' ? 'ផ្ទៀងផ្ទាត់លេខកូដ OTP' : 'Verify OTP Code')
                      : (lang === 'km' ? 'បង្កើតពាក្យសម្ងាត់ថ្មី' : 'Create New Password')
                    }
                  </div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                    {resetEmailVal}
                  </div>
                </div>
              </div>
              <button onClick={() => { setResetOtpModalOpen(false); setResetStep(1); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 30, height: 30, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiX size={18} />
              </button>
            </div>

            {/* Form Content */}
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>

              {resetStep === 1 ? (
                /*  STEP 1: Enter & Verify OTP Code  */
                <>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-light)', background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', lineHeight: 1.4 }}>
                    {lang === 'km'
                      ? `លេខកូដ OTP ត្រូវបានផ្ញើទៅកាន់អ៊ីមែល ${resetEmailVal}។ សូមពិនិត្យមើល Inbox ឬ Spam របស់អ្នក។`
                      : `An OTP code has been sent to ${resetEmailVal}. Please check your inbox or spam folder.`
                    }
                  </div>

                  {/* OTP Code Input */}
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-lighter)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>
                      {lang === 'km' ? 'លេខកូដ OTP' : 'OTP Code'}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      className="input"
                      placeholder=""
                      value={resetOtpVal}
                      onChange={e => setResetOtpVal(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleNextToNewPasswordStep()}
                      style={{ letterSpacing: '6px', textAlign: 'center', fontSize: '1.25rem', fontWeight: 900, height: 46 }}
                      autoFocus
                    />
                  </div>

                  {/* Resend OTP */}
                  <div style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={handleTriggerForgotPwd}
                      disabled={sendingResetOtp}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {sendingResetOtp ? '...' : (lang === 'km' ? 'មិនបានទទួលលេខកូដ? ផ្ញើឡើងវិញ' : 'Resend OTP Code')}
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                    <button
                      onClick={handleNextToNewPasswordStep}
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '10px 16px', fontSize: '0.88rem', fontWeight: 800 }}
                    >
                      {lang === 'km' ? 'ផ្ទៀងផ្ទាត់លេខកូដ' : 'Verify OTP'}
                    </button>
                    <button
                      onClick={() => setResetOtpModalOpen(false)}
                      className="btn btn-outline"
                      style={{ padding: '10px 16px', fontSize: '0.88rem', fontWeight: 700 }}
                    >
                      {lang === 'km' ? 'បោះបង់' : 'Cancel'}
                    </button>
                  </div>
                </>
              ) : (
                /*  STEP 2: Enter New Password & Confirm  */
                <>
                  <div style={{ fontSize: '0.84rem', color: '#065F46', background: '#ECFDF5', padding: '10px 14px', borderRadius: 12, border: '1px solid #A7F3D0', lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FiCheckCircle color="#10B981" size={18} />
                    <div>
                      {lang === 'km'
                        ? 'លេខកូដ OTP ត្រូវបានបញ្ចូលជោគជ័យ! សូមបង្កើតពាក្យសម្ងាត់ថ្មី។'
                        : 'OTP code verified! Please create your new password.'
                      }
                    </div>
                  </div>

                  {/* New Password Input */}
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-lighter)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>
                      {lang === 'km' ? 'ពាក្យសម្ងាត់ថ្មី' : 'New Password'}
                    </label>
                    <PwdInput
                      placeholder={lang === 'km' ? 'បញ្ចូលពាក្យសម្ងាត់ថ្មី' : 'Enter new password'}
                      value={resetNewPwdVal} onChange={setResetNewPwdVal} show={showResetNewPwd} onToggle={() => setShowResetNewPwd(v => !v)}
                      autoFocus
                    />
                  </div>

                  {/* Confirm New Password Input */}
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-lighter)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>
                      {lang === 'km' ? 'បញ្ជាក់ពាក្យសម្ងាត់ថ្មី' : 'Confirm New Password'}
                    </label>
                    <PwdInput
                      placeholder={lang === 'km' ? 'វាយបញ្ជាក់ពាក្យសម្ងាត់ថ្មី' : 'Re-enter new password'}
                      value={resetConfirmPwdVal} onChange={setResetConfirmPwdVal} show={showResetConfirmPwd} onToggle={() => setShowResetConfirmPwd(v => !v)}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                    <button
                      onClick={handleConfirmResetPwd}
                      disabled={verifyingResetOtp}
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '10px 16px', fontSize: '0.88rem', fontWeight: 800 }}
                    >
                      {verifyingResetOtp ? '...' : (lang === 'km' ? 'រក្សាទុកពាក្យសម្ងាត់ថ្មី' : 'Save New Password')}
                    </button>
                    <button
                      onClick={() => setResetStep(1)}
                      className="btn btn-outline"
                      style={{ padding: '10px 16px', fontSize: '0.88rem', fontWeight: 700 }}
                    >
                      {lang === 'km' ? 'ត្រឡប់' : 'Back'}
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      )}

      {/*  Change Password OTP Confirmation Modal  */}
      {changePwdOtpModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1200,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: 'var(--card-bg)', borderRadius: 20, width: '100%', maxWidth: 420,
            border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
            overflow: 'hidden', animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              padding: '18px 20px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FiShield size={20} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem' }}>
                    {lang === 'km' ? 'បញ្ជាក់ការប្ដូរពាក្យសម្ងាត់តាម OTP' : 'Confirm Password Change OTP'}
                  </div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                    {user?.email}
                  </div>
                </div>
              </div>
              <button onClick={() => setChangePwdOtpModalOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 30, height: 30, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiX size={18} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-light)', background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', lineHeight: 1.4 }}>
                {lang === 'km'
                  ? `លេខកូដ OTP ត្រូវបានផ្ញើទៅកាន់អ៊ីមែល ${user?.email}។ សូមបញ្ចូលលេខកូដដើម្បីបញ្ជាក់ការប្ដូរពាក្យសម្ងាត់។`
                  : `An OTP code has been sent to ${user?.email}. Enter code to authorize password change.`
                }
              </div>

              {/* OTP Code Input */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-lighter)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>
                  {lang === 'km' ? 'លេខកូដ OTP' : 'OTP Code'}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  className="input"
                  placeholder=""
                  value={changePwdOtpVal}
                  onChange={e => setChangePwdOtpVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleConfirmChangePasswordWithOtp()}
                  style={{ letterSpacing: '6px', textAlign: 'center', fontSize: '1.25rem', fontWeight: 900, height: 46 }}
                  autoFocus
                />
              </div>

              {/* Resend link */}
              <div style={{ textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={savePassword}
                  disabled={savingPwd}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  {savingPwd ? '...' : (lang === 'km' ? 'មិនបានទទួលលេខកូដ? ផ្ញើឡើងវិញ' : 'Resend OTP Code')}
                </button>
              </div>

              {/* Action Buttons */}
              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button
                  onClick={handleConfirmChangePasswordWithOtp}
                  disabled={verifyingChangePwdOtp}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '10px 16px', fontSize: '0.88rem', fontWeight: 800 }}
                >
                  {verifyingChangePwdOtp ? '...' : (lang === 'km' ? 'ផ្ទៀងផ្ទាត់ & ប្ដូរពាក្យសម្ងាត់' : 'Verify & Change Password')}
                </button>
                <button
                  onClick={() => setChangePwdOtpModalOpen(false)}
                  className="btn btn-outline"
                  style={{ padding: '10px 16px', fontSize: '0.88rem', fontWeight: 700 }}
                >
                  {lang === 'km' ? 'បោះបង់' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/*  Confirm Revoke Device Modal  */}
      {confirmRevokeModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1250,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: 'var(--card-bg)', borderRadius: 20, width: '100%', maxWidth: 420,
            border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
            overflow: 'hidden', animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              padding: '18px 20px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FiTrash2 size={20} />
                <div style={{ fontWeight: 800, fontSize: '1rem' }}>
                  {lang === 'km' ? 'បញ្ជាក់ការដកឧបករណ៍ចេញ' : 'Confirm Device Revocation'}
                </div>
              </div>
              <button onClick={() => setConfirmRevokeModalOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 30, height: 30, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiX size={18} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.5 }}>
                {targetRevokeDevice === 'ALL_OTHERS' ? (
                  lang === 'km' 
                    ? 'តើអ្នកប្រាកដជាចង់ដកឧបករណ៍ផ្សេងទៀតទាំងអស់ចេញពីគណនីរបស់អ្នកមែនទេ?' 
                    : 'Are you sure you want to revoke all other device sessions?'
                ) : (
                  lang === 'km'
                    ? `តើអ្នកប្រាកដជាចង់ដកឧបករណ៍ ${targetRevokeDevice?.deviceName || 'ឧបករណ៍នេះ'} ចេញពីគណនីរបស់អ្នកមែនទេ?`
                    : `Are you sure you want to revoke device session for ${targetRevokeDevice?.deviceName || 'this device'}?`
                )}
              </div>

              <div style={{
                background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)',
                padding: '12px 14px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10,
                color: '#EF4444', fontSize: '0.82rem', fontWeight: 600
              }}>
                <FiAlertTriangle size={18} flexShrink={0} />
                <div>
                  {lang === 'km'
                      ? 'ឧបករណ៍នេះនឹងត្រូវចាកចេញពីគណនីរបស់អ្នកភ្លាមៗ!'
                      : 'The selected device will be logged out of your account immediately!'
                    }
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button
                  onClick={executeRevokeAction}
                  disabled={revokingId}
                  className="btn"
                  style={{
                    flex: 1, padding: '10px 16px', fontSize: '0.88rem', fontWeight: 800,
                    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', color: '#fff', border: 'none',
                    borderRadius: 12, boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)'
                  }}
                >
                  {revokingId ? '...' : (lang === 'km' ? 'ដកចេញភ្លាមៗ' : 'Revoke Now')}
                </button>
                <button
                  onClick={() => setConfirmRevokeModalOpen(false)}
                  className="btn btn-outline"
                  style={{ padding: '10px 16px', fontSize: '0.88rem', fontWeight: 700, borderRadius: 12 }}
                >
                  {lang === 'km' ? 'បោះបង់' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
