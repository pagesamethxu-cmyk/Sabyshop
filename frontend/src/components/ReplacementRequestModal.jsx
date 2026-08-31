import React, { useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { chat as chatApi, disputes as disputesApi } from '../api/client';
import toast from 'react-hot-toast';
import {
  FiRefreshCw, FiShield, FiUpload, FiX, FiCheckCircle,
  FiAlertTriangle, FiMessageSquare, FiImage, FiSend,
  FiClock, FiInfo, FiTrash2, FiMaximize2, FiUserCheck, FiHeadphones
} from 'react-icons/fi';
import { MdStorefront, MdVerified } from 'react-icons/md';

const REPLACEMENT_REASONS = [
  {
    id: 'LOGIN_ERROR',
    labelEn: 'Wrong Password / Login Error',
    labelKm: 'ចូលប្រើមិនបាន / ខុសលេខសម្ងាត់',
    descEn: 'Credentials incorrect, password changed, or cannot access account.',
    descKm: 'លេខសម្ងាត់មិនត្រឹមត្រូវ ត្រូវបានផ្លាស់ប្តូរ ឬមិនអាចចូលប្រើប្រាស់បាន។',
    defaultMsgEn: 'Hello! The credentials provided for this order fail to log in (wrong password/invalid login). Please inspect and provide a working replacement account under the 1-to-1 replacement policy. Thank you!',
    defaultMsgKm: 'ជម្រាបសួរអ្នកលក់ និង Admin! គណនីដែលខ្ញុំទទួលបានពីការបញ្ជាទិញនេះមិនអាចចូលប្រើប្រាស់បានទេ (ខុសលេខសម្ងាត់ / Login Error)។ ខ្ញុំបានភ្ជាប់រូបភាពភស្តុតាងនៃកំហុសមកជាមួយ។ សូមជួយពិនិត្យ និងប្តូរគណនីថ្មីជូនខ្ញុំផង។ សូមអរគុណ!'
  },
  {
    id: 'EXPIRED_EARLY',
    labelEn: 'Expired Subscription Early',
    labelKm: 'ផុតកំណត់មុនពេលធានា',
    descEn: 'Subscription or premium ended before the purchased duration ended.',
    descKm: 'គណនីបានដាច់ Subscription ឬ Premium មុនកាលបរិច្ឆេទធានា។',
    defaultMsgEn: 'Hello! The subscription for this account has expired prematurely before the warranty duration ended. Please provide a replacement account. Thank you!',
    defaultMsgKm: 'ជម្រាបសួរ! គណនីនេះបានផុតកំណត់ Subscription/Premium មុនកាលកំណត់នៃការធានា។ សូមអ្នកលក់ និង Admin ជួយពិនិត្យ និងប្តូរគណនីថ្មីជូនខ្ញុំ។ សូមអរគុណ!'
  },
  {
    id: 'ACCOUNT_LOCKED',
    labelEn: 'Account Locked / 2FA Issue',
    labelKm: 'គណនីត្រូវជាប់សោ / ជាប់ 2FA',
    descEn: 'Account is locked, disabled, suspended, or prompts for 2FA code.',
    descKm: 'គណនីត្រូវបានផ្អាក ជាប់សោសុវត្ថិភាព ឬទាមទារលេខកូដ 2FA។',
    defaultMsgEn: 'Hello! This account is currently locked/suspended or requires two-factor verification that is unavailable. Please provide a working replacement. Thank you!',
    defaultMsgKm: 'ជម្រាបសួរ! គណនីនេះត្រូវបានជាប់សោ (Locked/Disabled) ឬជាប់ផ្ទៀងផ្ទាត់ 2FA មិនអាចចូលប្រើប្រាស់បាន។ សូមជួយផ្តល់គណនីថ្មីជំនួសជូនខ្ញុំផង។ សូមអរគុណ!'
  },
  {
    id: 'INVITE_LINK_INVALID',
    labelEn: 'Broken / Expired Invite Link',
    labelKm: 'តំណភ្ជាប់អញ្ជើញមិនដំណើរការ',
    descEn: 'Family/Team invite link is full, invalid, expired, or rejected.',
    descKm: 'តំណភ្ជាប់ Invite ពេញ ផុតកំណត់ ឬមិនអាចចូលរួម Group/Family បាន។',
    defaultMsgEn: 'Hello! The invite link delivered for this order is invalid, expired, or full. Please send a fresh replacement invite link. Thank you!',
    defaultMsgKm: 'ជម្រាបសួរ! តំណភ្ជាប់ Invite ដែលបានផ្ញើមកមិនដំណើរការ ពេញ ឬផុតកំណត់។ សូមជួយផ្ញើតំណភ្ជាប់ថ្មីជូនខ្ញុំផង។ សូមអរគុណ!'
  },
  {
    id: 'OTHER',
    labelEn: 'Other Credential Issue',
    labelKm: 'បញ្ហាផ្សេងៗ',
    descEn: 'Any other defect with the delivered digital product.',
    descKm: 'បញ្ហាផ្សេងៗទាក់ទងនឹងផលិតផលដែលបានទទួល។',
    defaultMsgEn: 'Hello! I encountered an issue with the delivered product. Please see the attached screenshot and provide a replacement under the 1-to-1 replacement guarantee.',
    defaultMsgKm: 'ជម្រាបសួរ! ខ្ញុំបានជួបបញ្ហាលើផលិតផលដែលបានទទួល។ សូមពិនិត្យរូបភាពកំហុសដែលខ្ញុំបានភ្ជាប់ និងជួយដោះស្រាយប្តូរថ្មីជូនខ្ញុំផង។'
  }
];

const ReplacementRequestModal = ({ isOpen, onClose, order, onSuccess }) => {
  const { lang } = useLanguage();
  const isKhmer = lang === 'km';

  const [selectedReasonId, setSelectedReasonId] = useState('LOGIN_ERROR');
  const [description, setDescription] = useState(REPLACEMENT_REASONS[0].defaultMsgKm);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);

  const fileInputRef = useRef(null);

  if (!isOpen || !order) return null;

  const firstItem = order.items?.[0] || order.product || {};
  const productName = firstItem.product?.name || firstItem.productName || order.productName || (isKhmer ? 'ផលិតផលឌីជីថល' : 'Digital Product');
  const productImg = firstItem.product?.imageUrl || firstItem.productImageUrl || order.productImageUrl || '';
  const storeName = order.sellerStoreName || firstItem.product?.sellerStoreName || (isKhmer ? 'ហាងអ្នកលក់ Saby' : 'Seller Store');
  const totalAmount = Number(order.totalAmount || 0);

  const handleSelectReason = (reason) => {
    setSelectedReasonId(reason.id);
    const defaultText = isKhmer ? reason.defaultMsgKm : reason.defaultMsgEn;
    // Update description if it is empty or matches another default text
    const isCurrentDefault = REPLACEMENT_REASONS.some(r => r.defaultMsgKm === description || r.defaultMsgEn === description);
    if (!description.trim() || isCurrentDefault) {
      setDescription(defaultText);
    }
  };

  const handleImageFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (uploadedImages.length + files.length > 5) {
      toast.error(isKhmer ? 'អាចបញ្ចូលរូបភាពកំហុសបានច្រើនបំផុត ៥ សន្លឹក' : 'Maximum 5 error screenshots allowed');
      return;
    }

    setUploadingImage(true);
    const toastId = toast.loading(isKhmer ? 'កំពុង Upload រូបភាពកំហុស...' : 'Uploading error screenshot...');

    try {
      const newUrls = [];
      for (const file of files) {
        if (file.size > 20 * 1024 * 1024) {
          toast.error(isKhmer ? `រូបភាព ${file.name} ធំជាង 20MB` : `File ${file.name} exceeds 20MB limit`);
          continue;
        }
        const res = await chatApi.uploadMedia(file);
        const url = res.data?.url || res.data?.data || res.data;
        if (url) {
          newUrls.push(url);
        }
      }

      if (newUrls.length > 0) {
        setUploadedImages(prev => [...prev, ...newUrls]);
        toast.success(isKhmer ? `បាន Upload រូបភាព ${newUrls.length} សន្លឹកជោគជ័យ!` : `Uploaded ${newUrls.length} screenshot(s)!`, { id: toastId });
      } else {
        toast.error(isKhmer ? 'មិនអាច Upload រូបភាពបានទេ' : 'Upload failed', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || (isKhmer ? 'បរាជ័យក្នុងការ Upload រូបភាព' : 'Failed to upload screenshot'), { id: toastId });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setUploadedImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      return toast.error(isKhmer ? 'សូមសរសេរបរិយាយពីបញ្ហាដែលអ្នកជួបប្រទះ' : 'Please describe the issue');
    }

    setSubmitting(true);
    const loadingToast = toast.loading(isKhmer ? 'កំពុងផ្ញើសំណើទៅកាន់អ្នកលក់ និង Admin...' : 'Sending request to Seller and Admin Support...');

    try {
      const currentReason = REPLACEMENT_REASONS.find(r => r.id === selectedReasonId) || REPLACEMENT_REASONS[0];
      const reasonLabel = isKhmer ? currentReason.labelKm : currentReason.labelEn;
      const lang = isKhmer ? 'km' : 'en';

      // Create official Dispute / Claim record in backend
      // This immediately moves the request into Seller Portal — DISPUTES, sets Order status to DISPUTED,
      // and triggers automated Email notifications to Seller & Buyer!
      await disputesApi.create(order.id, {
        issueType: reasonLabel,
        preferredSolution: 'REPLACEMENT',
        description: description.trim(),
        evidenceImages: uploadedImages
      });

      toast.success(
        isKhmer
          ? 'បានបញ្ជូនសំណើប្តូរគណនីទៅកាន់ Seller Portal (Disputes) និង Admin រួចរាល់! ប្រព័ន្ធ Safe Trade កំពុងការពារការបញ្ជាទិញនេះ។'
          : 'Replacement request submitted to Seller Portal (Disputes) & Admin Support! Safe Trade Escrow is protecting this order.',
        { id: loadingToast, duration: 6000 }
      );

      if (onSuccess) {
        onSuccess({
          orderId: order.id,
          reason: reasonLabel,
          description,
          images: uploadedImages
        });
      }

      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || (isKhmer ? 'បរាជ័យក្នុងការផ្ញើសំណើ' : 'Failed to send replacement request'), { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        background: 'var(--card-bg, #ffffff)',
        color: 'var(--text, #1e293b)',
        borderRadius: 22,
        border: '1px solid var(--border, #e2e8f0)',
        width: '100%', maxWidth: 540,
        maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
        position: 'relative',
        animation: 'modalSlideUp 0.22s ease-out'
      }}>
        <style>{`
          @keyframes modalSlideUp {
            from { opacity: 0; transform: translateY(16px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .rep-reason-chip {
            padding: 8px 12px;
            border-radius: 12px;
            border: 1.5px solid var(--border, #e2e8f0);
            background: var(--bg-secondary, #f8fafc);
            color: var(--text, #1e293b);
            font-size: 0.8rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.16s ease;
            text-align: left;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .rep-reason-chip:hover {
            border-color: #6366f1;
            background: rgba(99,102,241,0.06);
          }
          .rep-reason-chip.active {
            border-color: #4f46e5;
            background: rgba(79,70,229,0.1);
            color: #4338ca;
            box-shadow: 0 2px 8px rgba(79,70,229,0.15);
          }
          .rep-upload-zone {
            border: 2px dashed #6366f1;
            border-radius: 14px;
            background: rgba(99,102,241,0.04);
            padding: 18px 16px;
            text-align: center;
            cursor: pointer;
            transition: all 0.16s ease;
          }
          .rep-upload-zone:hover {
            background: rgba(99,102,241,0.08);
            border-color: #4f46e5;
          }
        `}</style>

        {/*  Header  */}
        <div style={{
          padding: '18px 22px 14px',
          borderBottom: '1px solid var(--border, #e2e8f0)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(79,70,229,0.06), rgba(16,185,129,0.04))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
              color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(79,70,229,0.3)'
            }}>
              <FiRefreshCw size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: 'var(--text)' }}>
                {isKhmer ? 'ស្នើសុំប្តូរគណនីថ្មី (1-to-1 Replace)' : 'Request Account Replacement'}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <MdVerified size={13} color="#10B981" />
                  {isKhmer ? 'ការធានា ១០០% ផ្លាស់ប្តូរថ្មី' : '100% 1-to-1 Guarantee'}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-lighter)' }}>• Safe Trade</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              background: 'var(--bg-secondary, #f1f5f9)',
              border: 'none', borderRadius: '50%',
              width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-light, #64748b)', cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <FiX size={18} />
          </button>
        </div>

        {/*  Body Form  */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 22px' }}>
          {/* Order Snapshot Card */}
          <div style={{
            background: 'var(--bg-secondary, #f8fafc)',
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: 14, padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 12,
            marginBottom: 16
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: 'var(--card-bg, #ffffff)',
              border: '1px solid var(--border, #e2e8f0)',
              overflow: 'hidden', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {productImg ? (
                <img src={productImg} alt={productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <FiRefreshCw size={20} color="#6366f1" />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {productName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-light)', fontWeight: 600 }}>
                  Order #{order.id}
                </span>
                <span style={{ fontSize: '0.74rem', color: '#4f46e5', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <MdStorefront size={13} /> {storeName}
                </span>
                <span style={{ fontSize: '0.74rem', color: '#ea580c', fontWeight: 800 }}>
                  USD {totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Dual Recipient Notification Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(59,130,246,0.06))',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: 12, padding: '10px 14px',
            marginBottom: 18, fontSize: '0.78rem', color: '#3730a3', lineHeight: 1.45
          }}>
            <div style={{ fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6, color: '#4338ca' }}>
              <FiShield size={14} color="#4f46e5" />
              <span>{isKhmer ? 'សំណើនេះនឹងត្រូវបានបញ្ជូនទៅកាន់៖' : 'This request will be dispatched to:'}</span>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ffffff', padding: '3px 8px', borderRadius: 6, border: '1px solid #c7d2fe', fontWeight: 700, fontSize: '0.74rem', color: '#4338ca' }}>
                <MdStorefront size={13} color="#4f46e5" /> {isKhmer ? 'អ្នកលក់ (Seller Store)' : 'Seller Store'}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ffffff', padding: '3px 8px', borderRadius: 6, border: '1px solid #bfdbfe', fontWeight: 700, fontSize: '0.74rem', color: '#1d4ed8' }}>
                <FiHeadphones size={13} color="#2563eb" /> {isKhmer ? 'Admin Safe Trade Support' : 'Admin Safe Trade Support'}
              </span>
            </div>
          </div>

          {/* 1. Reason Selection */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
              {isKhmer ? 'ជ្រើសរើសប្រភេទបញ្ហាដែលជួបប្រទះ *' : 'Select Issue Type *'}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', gap: 8 }}>
              {REPLACEMENT_REASONS.map(reason => {
                const isSelected = selectedReasonId === reason.id;
                return (
                  <button
                    key={reason.id}
                    type="button"
                    className={`rep-reason-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelectReason(reason)}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: isSelected ? '5px solid #4f46e5' : '2px solid var(--border-light, #cbd5e1)',
                      background: '#fff', flexShrink: 0
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ lineHeight: 1.25 }}>{isKhmer ? reason.labelKm : reason.labelEn}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Message / Description */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
              {isKhmer ? 'សារពិពណ៌នាលម្អិតអំពីបញ្ហា *' : 'Describe the Issue / Message *'}
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={isKhmer ? 'សូមសរសេរបញ្ជាក់លម្អិតពីបញ្ហាដែលអ្នកជួបប្រទះ...' : 'Provide details about what went wrong with the credentials...'}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 12,
                border: '1px solid var(--border, #cbd5e1)',
                background: 'var(--bg-secondary, #f8fafc)',
                color: 'var(--text, #1e293b)',
                fontSize: '0.85rem', outline: 'none', resize: 'vertical',
                fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box'
              }}
              required
            />
          </div>

          {/* 3. Upload Error Screenshots */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text)' }}>
                {isKhmer ? 'រូបភាពភស្តុតាងកំហុស (Error Screenshot)' : 'Upload Error Screenshot / Proof'}
              </label>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-lighter)' }}>
                {uploadedImages.length}/5 {isKhmer ? 'សន្លឹក' : 'images'}
              </span>
            </div>

            {/* Drop / Upload Button Area */}
            <div
              className="rep-upload-zone"
              onClick={() => !uploadingImage && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageFileChange}
                disabled={uploadingImage}
                style={{ display: 'none' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: 'rgba(99,102,241,0.12)', color: '#4f46e5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {uploadingImage ? (
                    <FiRefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <FiImage size={20} />
                  )}
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#4338ca' }}>
                  {uploadingImage
                    ? (isKhmer ? 'កំពុង Upload រូបភាព...' : 'Uploading Screenshot...')
                    : (isKhmer ? '+ ចុចដើម្បីជ្រើសរើសរូបភាពកំហុស (Error Screenshot)' : '+ Click to upload error screenshot')}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>
                  {isKhmer ? 'JPG, PNG, WebP (អតិបរមា 20MB)' : 'Supports JPG, PNG, WebP (Max 20MB)'}
                </div>
              </div>
            </div>

            {/* Uploaded Previews */}
            {uploadedImages.length > 0 && (
              <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                {uploadedImages.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'relative', width: 84, height: 84, borderRadius: 10,
                      overflow: 'hidden', border: '1.5px solid var(--border, #cbd5e1)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                    }}
                  >
                    <img
                      src={imgUrl}
                      alt={`Error Proof ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                      onClick={() => setZoomImage(imgUrl)}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      style={{
                        position: 'absolute', top: 3, right: 3,
                        background: 'rgba(239,68,68,0.9)', color: '#ffffff',
                        border: 'none', borderRadius: '50%',
                        width: 20, height: 20,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
                      }}
                      title={isKhmer ? 'លុបរូបភាពនេះ' : 'Remove image'}
                    >
                      <FiX size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomImage(imgUrl)}
                      style={{
                        position: 'absolute', bottom: 3, right: 3,
                        background: 'rgba(0,0,0,0.6)', color: '#ffffff',
                        border: 'none', borderRadius: 4,
                        padding: '2px 4px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title={isKhmer ? 'មើលរូបធំ' : 'Expand'}
                    >
                      <FiMaximize2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/*  Action Buttons  */}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                flex: 1, padding: '12px 16px', borderRadius: 12,
                border: '1px solid var(--border, #cbd5e1)',
                background: 'var(--bg-secondary, #f8fafc)',
                color: 'var(--text, #1e293b)',
                fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer'
              }}
            >
              {isKhmer ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingImage}
              style={{
                flex: 2, padding: '12px 18px', borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                color: '#ffffff',
                fontWeight: 900, fontSize: '0.92rem', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
                transition: 'all 0.15s ease'
              }}
            >
              {submitting ? (
                <>
                  <FiRefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>{isKhmer ? 'កំពុងផ្ញើសំណើ...' : 'Sending Request...'}</span>
                </>
              ) : (
                <>
                  <FiSend size={16} />
                  <span>{isKhmer ? 'ផ្ញើសំណើសុំប្តូរថ្មី' : 'Send Replacement Request'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Zoom Lightbox */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 10001,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setZoomImage(null)}
              style={{
                position: 'absolute', top: -36, right: 0,
                background: 'none', border: 'none', color: '#fff', cursor: 'pointer'
              }}
            >
              <FiX size={28} />
            </button>
            <img
              src={zoomImage}
              alt="Zoomed Error Proof"
              style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.5)', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReplacementRequestModal;
