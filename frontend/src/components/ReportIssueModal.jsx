import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { disputes as disputesApi } from '../api/client';
import toast from 'react-hot-toast';
import {
  FiAlertTriangle, FiUpload, FiX, FiCheck, FiShield,
  FiRefreshCw, FiDollarSign, FiInfo, FiTrash2
} from 'react-icons/fi';
import PolicyModal from './PolicyModal';

const ISSUE_CATEGORIES = [
  {
    id: 'ACCOUNT_VOUCHER_PROBLEM',
    labelEn: 'Account or voucher problem',
    labelKm: 'បញ្ហាគណនី ឬ Voucher មិនដំណើរការ',
    descEn: 'Invalid password, account locked, or expired before warranty ends.',
    descKm: 'ខុស Password, គណនីជាប់សោ ឬផុតកំណត់មុនការធានា។',
    icon: FiAlertTriangle
  },
  {
    id: 'WRONG_INCOMPLETE_PRODUCT',
    labelEn: 'Wrong or incomplete product',
    labelKm: 'ផលិតផលខុស ឬមិនគ្រប់ចំនួន',
    descEn: 'Received different product or missing quantity of accounts.',
    descKm: 'ទទួលបានផលិតផលខុស ឬខ្វះចំនួនគណនី។',
    icon: FiRefreshCw
  },
  {
    id: 'ORDER_NOT_RECEIVED',
    labelEn: 'Order not received',
    labelKm: 'មិនបានទទួលទំនិញ',
    descEn: 'Seller has not delivered credentials or credentials empty.',
    descKm: 'អ្នកលក់មិនទាន់បានប្រគល់គណនី ឬទិន្នន័យទទេស្អាត។',
    icon: FiInfo
  }
];

const ReportIssueModal = ({ isOpen, onClose, order, onSuccess }) => {
  const { lang } = useLanguage();
  const isKhmer = lang === 'km';

  const [issueType, setIssueType] = useState('ACCOUNT_VOUCHER_PROBLEM');
  const [preferredSolution, setPreferredSolution] = useState('REPLACEMENT');
  const [description, setDescription] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [evidenceImages, setEvidenceImages] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  if (!isOpen || !order) return null;

  const handleAddImageUrl = (e) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;
    if (evidenceImages.length >= 4) {
      return toast.error(isKhmer ? 'អាចដាក់រូបភាពភស្តុតាងបានច្រើនបំផុត ៤ សន្លឹក' : 'Maximum 4 proof images allowed');
    }
    setEvidenceImages(prev => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingImage(true);
    try {
      for (const file of files) {
        const reader = new FileReader();
        reader.onload = (uploadEvt) => {
          if (uploadEvt.target?.result) {
            setEvidenceImages(prev => [...prev, uploadEvt.target.result]);
          }
        };
        reader.readAsDataURL(file);
      }
      toast.success(isKhmer ? 'បានផ្ទុកឡើងរូបភាពភស្តុតាង!' : 'Evidence photo attached!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to attach evidence');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index) => {
    setEvidenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      return toast.error(isKhmer ? 'សូមពិពណ៌នាអំពីបញ្ហារបស់អ្នក' : 'Please describe your issue');
    }

    setSubmitting(true);
    try {
      const payload = {
        issueType,
        preferredSolution,
        description: description.trim(),
        caption: imageCaption.trim() || undefined,
        imageCaptions: imageCaption.trim() || undefined,
        evidenceImages
      };

      const res = await disputesApi.create(order.id, payload);
      toast.success(isKhmer ? 'បានផ្ញើការរាយការណ៍បញ្ហាជោគជ័យ!' : 'Dispute report submitted successfully!');
      if (onSuccess) {
        onSuccess(res.data);
      }
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit dispute');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1050,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          style={{
            background: 'var(--card-bg, #FFFFFF)',
            color: 'var(--text, #0F172A)',
            borderRadius: 24,
            width: '100%',
            maxWidth: 620,
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
            border: '1px solid var(--border, #E2E8F0)',
            overflow: 'hidden',
            animation: 'modalPop 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(245,158,11,0.06))'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #EF4444, #F59E0B)',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(239,68,68,0.3)'
              }}>
                <FiAlertTriangle size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text, #0F172A)' }}>
                  {isKhmer ? `រាយការណ៍បញ្ហា — Order #${order.id}` : `Report Issue — Order #${order.id}`}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light, #64748B)' }}>
                  {order.items?.[0]?.product?.name || order.items?.[0]?.productName || 'Digital Product'} · USD {Number(order.totalAmount || 0).toFixed(2)}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-light, #94A3B8)',
                padding: 6,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Body Form */}
          <form onSubmit={handleSubmit} style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
            
            {/* 1. Issue Category */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text, #0F172A)', display: 'block', marginBottom: 8 }}>
                {isKhmer ? '១. ជ្រើសរើសប្រភេទបញ្ហា *' : '1. Select Issue Type *'}
              </label>
              <div style={{ display: 'grid', gap: 8 }}>
                {ISSUE_CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const isSelected = issueType === cat.id;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => setIssueType(cat.id)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 12,
                        border: isSelected ? '1.5px solid #4F46E5' : '1px solid var(--border, #E2E8F0)',
                        background: isSelected ? 'rgba(79, 70, 229, 0.06)' : 'var(--bg-secondary, #F8FAFC)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        border: isSelected ? '6px solid #4F46E5' : '2px solid #CBD5E1',
                        background: '#FFF',
                        marginTop: 2,
                        flexShrink: 0
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: isSelected ? '#4F46E5' : 'var(--text, #0F172A)' }}>
                          {isKhmer ? cat.labelKm : cat.labelEn}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-light, #64748B)', marginTop: 2 }}>
                          {isKhmer ? cat.descKm : cat.descEn}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Preferred Solution */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text, #0F172A)', margin: 0 }}>
                  {isKhmer ? '២. ដំណោះស្រាយដែលអ្នកចង់បាន *' : '2. Preferred Solution *'}
                </label>
                <button
                  type="button"
                  onClick={() => setShowPolicyModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4F46E5',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <FiShield size={12} /> {isKhmer ? 'មើលគោលការណ៍' : 'View Policy'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {/* Replacement */}
                <div
                  onClick={() => setPreferredSolution('REPLACEMENT')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: preferredSolution === 'REPLACEMENT' ? '1.5px solid #10B981' : '1px solid var(--border, #E2E8F0)',
                    background: preferredSolution === 'REPLACEMENT' ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-secondary, #F8FAFC)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10
                  }}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: preferredSolution === 'REPLACEMENT' ? '#10B981' : '#CBD5E1',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <FiRefreshCw size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.84rem', color: preferredSolution === 'REPLACEMENT' ? '#059669' : 'var(--text, #0F172A)' }}>
                      {isKhmer ? 'ប្តូរទំនិញថ្មី' : 'Replacement'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-light, #64748B)' }}>
                      {isKhmer ? 'ប្តូរគណនីថ្មីដំណើរការ' : 'Get working account'}
                    </div>
                  </div>
                </div>

                {/* Refund */}
                <div
                  onClick={() => setPreferredSolution('REFUND')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: preferredSolution === 'REFUND' ? '1.5px solid #F59E0B' : '1px solid var(--border, #E2E8F0)',
                    background: preferredSolution === 'REFUND' ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-secondary, #F8FAFC)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10
                  }}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: preferredSolution === 'REFUND' ? '#F59E0B' : '#CBD5E1',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <FiDollarSign size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.84rem', color: preferredSolution === 'REFUND' ? '#B45309' : 'var(--text, #0F172A)' }}>
                      {isKhmer ? 'សងប្រាក់វិញ' : 'Full Refund'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-light, #64748B)' }}>
                      {isKhmer ? 'សងប្រាក់ ១០០%' : '100% Money back'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Description */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text, #0F172A)', display: 'block', marginBottom: 6 }}>
                {isKhmer ? '៣. ពិពណ៌នាលម្អិតអំពីបញ្ហា *' : '3. Detailed Description *'}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isKhmer
                  ? 'សូមបញ្ជាក់លម្អិត ឧ. គណនីខុស Password, ចូលមិនបាន, ឬទិន្នន័យខុស...'
                  : 'Please describe the issue in detail, e.g. wrong password, login error, etc...'}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1px solid var(--border, #CBD5E1)',
                  background: 'var(--bg-secondary, #F8FAFC)',
                  color: 'var(--text, #0F172A)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>

            {/* 4. Evidence Images Upload */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text, #0F172A)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span>{isKhmer ? '៤. ភ្ជាប់រូបភាពភស្តុតាង' : '4. Upload Evidence (Screenshots)'}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-light, #94A3B8)' }}>{isKhmer ? 'រូបថត Screenshot' : 'Image proof'}</span>
              </label>

              {/* Uploaded thumbnails */}
              {evidenceImages.length > 0 && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                  {evidenceImages.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative', width: 70, height: 70, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <img src={img} alt={`Evidence ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        style={{
                          position: 'absolute',
                          top: 3,
                          right: 3,
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: 'rgba(239, 68, 68, 0.9)',
                          color: '#FFF',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0
                        }}
                      >
                        <FiX size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1.5px dashed var(--border, #CBD5E1)',
                    background: 'var(--bg-secondary, #F8FAFC)',
                    color: '#4F46E5',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: uploadingImage ? 'wait' : 'pointer'
                  }}
                >
                  <FiUpload size={15} />
                  {uploadingImage
                    ? (isKhmer ? 'កំពុងផ្ទុកឡើង...' : 'Uploading...')
                    : (isKhmer ? 'ជ្រើសរើសរូប Screenshot' : 'Upload Screenshot')}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    hidden
                    disabled={uploadingImage}
                  />
                </label>

                <div style={{ flex: 1, display: 'flex', gap: 6, minWidth: 200 }}>
                  <input
                    type="url"
                    placeholder={isKhmer ? 'ឬដាក់ Link រូបភាព Screenshot...' : 'Or paste screenshot image URL...'}
                    value={imageUrlInput}
                    onChange={e => setImageUrlInput(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid var(--border, #CBD5E1)',
                      fontSize: '0.78rem'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#4F46E5',
                      color: '#FFF',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {isKhmer ? 'បញ្ចូល' : 'Add'}
                  </button>
                </div>
              </div>

              {/* Evidence Caption ឬ Notes */}
              <div style={{ marginTop: 8 }}>
                <input
                  type="text"
                  placeholder={isKhmer ? 'កំណត់សម្គាល់បន្ថែមលើរូបភាពភស្តុតាង (ឧ. រូបបង្ហាញថា Password ខុស)...' : 'Write a caption for the proof images (e.g. error screen)...'}
                  value={imageCaption}
                  onChange={e => setImageCaption(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border, #CBD5E1)',
                    fontSize: '0.8rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Escrow & Mediation Notice */}
            <div style={{
              background: 'rgba(79, 70, 229, 0.05)',
              border: '1px solid rgba(79, 70, 229, 0.2)',
              borderRadius: 12,
              padding: '10px 14px',
              fontSize: '0.75rem',
              color: 'var(--text-light, #475569)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8
            }}>
              <FiShield size={16} color="#4F46E5" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                {isKhmer
                  ? 'ប្រាក់របស់អ្នកត្រូវបានការពារក្នុង Escrow។ អ្នកលក់នឹងទទួលបានដំណឹង ហើយឆ្លើយតប។ ប្រសិនបើគ្មានការចុះសម្រុង Admin នឹងសម្រេចសងប្រាក់ ឬប្តូរទំនិញជូនអ្នក។'
                  : 'Your funds are held securely in Escrow. The seller will be notified to resolve or replace. If unagreed, Admin will step in for final mediation.'}
              </div>
            </div>

            {/* Submit Buttons */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                style={{
                  padding: '10px 18px',
                  borderRadius: 12,
                  border: '1px solid var(--border, #CBD5E1)',
                  background: 'transparent',
                  color: 'var(--text-light, #64748B)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                {isKhmer ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={submitting || uploadingImage}
                style={{
                  padding: '10px 24px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #EF4444, #EA580C)',
                  color: '#FFF',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: submitting ? 'wait' : 'pointer',
                  boxShadow: '0 4px 14px rgba(239,68,68,0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {submitting ? (isKhmer ? 'កំពុងផ្ញើ...' : 'Submitting...') : (isKhmer ? 'ផ្ញើការរាយការណ៍' : 'Submit Issue')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Policy Modal */}
      <PolicyModal
        isOpen={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        initialTab="replacement"
      />
    </>
  );
};

export default ReportIssueModal;
