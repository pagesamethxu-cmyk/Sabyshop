import React, { useState } from 'react';
import { products as productsApi } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiAlertTriangle, FiX, FiCheck, FiShield, FiStar, FiInfo, FiUpload } from 'react-icons/fi';
import PolicyModal from './PolicyModal';

const REPORT_REASONS = [
  {
    id: 'NO_WARRANTY',
    labelEn: 'No warranty ឬ Seller refused warranty',
    labelKm: 'គ្មានការធានា ឬអ្នកលក់បដិសេធការធានា',
    descEn: 'Product lacks stated warranty or seller does not provide support.',
    descKm: 'ទំនិញគ្មានការធានា ឬអ្នកលក់មិនផ្តល់ការដោះស្រាយ។'
  },
  {
    id: 'EXPIRED_EARLY',
    labelEn: 'Account expired before warranty ended',
    labelKm: 'គណនីផុតកំណត់មុនកាលកំណត់នៃការធានា',
    descEn: 'Purchased 1 month/year but account expired in days.',
    descKm: 'ទិញកញ្ចប់ 1 ខែ ឬ 1 ឆ្នាំ ប៉ុន្តែប្រើបានតែប៉ុន្មានថ្ងៃក៏ផុតកំណត់។'
  },
  {
    id: 'INVALID_CREDENTIALS',
    labelEn: 'Invalid login ឬ Wrong credentials',
    labelKm: 'ព័ត៌មានគណនីខុស ឬ ចូលមិនបាន',
    descEn: 'Cannot log in with the provided email, password, or key.',
    descKm: 'មិនអាច Login ចូលគណនី ឬលេខកូដប្រើមិនកើត។'
  },
  {
    id: 'MISLEADING_INFO',
    labelEn: 'Misleading product details or fake features',
    labelKm: 'ការពិពណ៌នាទំនិញមិនពិត ឬបោកបញ្ឆោត',
    descEn: 'Product differs completely from the store description.',
    descKm: 'ទំនិញខុសគ្នាស្រឡះពីអ្វីដែលបានផ្សព្វផ្សាយ។'
  },
  {
    id: 'OTHER',
    labelEn: 'Other problem',
    labelKm: 'បញ្ហាផ្សេងៗ',
    descEn: 'Other quality or seller behavior concerns.',
    descKm: 'បញ្ហាផ្សេងទៀតទាក់ទងនឹងគុណភាព ឬអ្នកលក់។'
  }
];

const ReportProductModal = ({ isOpen, onClose, product, initialRating = null, onSuccess }) => {
  const { lang } = useLanguage();
  const isKhmer = lang === 'km';
  const { user } = useAuth();

  const [reason, setReason] = useState('NO_WARRANTY');
  const [starRating, setStarRating] = useState(initialRating || 1);
  const [description, setDescription] = useState('');
  const [evidenceImages, setEvidenceImages] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  if (!isOpen || !product) return null;

  const handleAddImage = (e) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;
    if (evidenceImages.length >= 4) {
      return toast.error(isKhmer ? 'អាចដាក់រូបភាពភស្តុតាងបានច្រើនបំផុត ៤ សន្លឹក' : 'Maximum 4 proof images allowed');
    }
    setEvidenceImages(prev => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (evidenceImages.length >= 4) {
      return toast.error(isKhmer ? 'អាចដាក់រូបភាពភស្តុតាងបានច្រើនបំផុត ៤ សន្លឹក' : 'Maximum 4 proof images allowed');
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      if (uploadEvent.target?.result) {
        setEvidenceImages(prev => [...prev, uploadEvent.target.result]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (index) => {
    setEvidenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      return toast.error(isKhmer ? 'សូមបញ្ជាក់ព័ត៌មានលម្អិតអំពីបញ្ហា' : 'Please provide details about the issue');
    }

    setSubmitting(true);
    try {
      const storeLocation = product?.sellerStoreLocation || product?.sellerProfile?.storeLocation || 'រាជធានីភ្នំពេញ, កម្ពុជា (Phnom Penh, Cambodia)';
      const sellerStoreName = product?.sellerStoreName || product?.sellerProfile?.storeName || product?.sellerName || 'Saby Shop Store';

      const payload = {
        reason,
        starRating,
        description: description.trim(),
        evidenceImages,
        imageCaptions: caption.trim() || undefined,
        caption: caption.trim() || undefined,
        reporterEmail: user?.email || 'Anonymous Customer',
        reporterName: user?.name || 'Customer',
        sellerStoreName,
        storeLocation,
        orderId: product?.orderId || null
      };

      await productsApi.report(product.id, payload);
      toast.success(isKhmer ? 'បានរាយការណ៍ផលិតផល និងរូបភស្តុតាងជោគជ័យ! Admin នឹងស៊ើបអង្កេតភ្លាមៗ' : 'Report & proof submitted successfully! Admin is investigating.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to report product');
    } finally {
      setSubmitting(false);
    }
  };

  const currentStoreLocation = product?.sellerStoreLocation || product?.sellerProfile?.storeLocation || 'រាជធានីភ្នំពេញ, កម្ពុជា (Phnom Penh, Cambodia)';
  const currentSellerStoreName = product?.sellerStoreName || product?.sellerProfile?.storeName || product?.sellerName || 'Saby Shop Store';

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1060,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
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
            maxWidth: 560,
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
            background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(245,158,11,0.05))'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(239,68,68,0.3)'
              }}>
                <FiAlertTriangle size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                  {isKhmer ? 'រាយការណ៍បញ្ហាទំនិញ ឬហាង' : 'Report Product ឬ Store Issue'}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light, #64748B)' }}>
                  {product.name}
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
                borderRadius: 8
              }}
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* Store & Location Card */}
            <div style={{
              background: 'var(--bg-secondary, #F8FAFC)',
              border: '1px solid var(--border, #E2E8F0)',
              borderRadius: 14,
              padding: '12px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12
            }}>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text)' }}>
                  ហាងម្ចាស់ទំនិញ៖ {currentSellerStoreName}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-light)', marginTop: 2 }}>
                  ទីតាំងហាង៖ {currentStoreLocation}
                </div>
              </div>
              <span style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#EF4444',
                padding: '3px 8px',
                borderRadius: 6,
                fontSize: '0.7rem',
                fontWeight: 800,
                whiteSpace: 'nowrap'
              }}>
                {isKhmer ? 'បញ្ជូនទៅ Admin ផ្ទាល់' : 'Sent to Admin'}
              </span>
            </div>

            {/* Reason Selector */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 800, display: 'block', marginBottom: 8 }}>
                {isKhmer ? '១. មូលហេតុនៃការរាយការណ៍ *' : '1. Select Report Reason *'}
              </label>
              <div style={{ display: 'grid', gap: 8 }}>
                {REPORT_REASONS.map(r => {
                  const isSelected = reason === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setReason(r.id)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 12,
                        border: isSelected ? '1.5px solid #EF4444' : '1px solid var(--border, #E2E8F0)',
                        background: isSelected ? 'rgba(239,68,68,0.06)' : 'var(--bg-secondary, #F8FAFC)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10
                      }}
                    >
                      <div style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        border: isSelected ? '5px solid #EF4444' : '2px solid #CBD5E1',
                        background: '#FFF',
                        marginTop: 2,
                        flexShrink: 0
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.84rem', color: isSelected ? '#DC2626' : 'var(--text, #0F172A)' }}>
                          {isKhmer ? r.labelKm : r.labelEn}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-light, #64748B)', marginTop: 2 }}>
                          {isKhmer ? r.descKm : r.descEn}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Star Rating (1 or 2 Stars for Negative Experience) */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 800, display: 'block', marginBottom: 6 }}>
                {isKhmer ? '២. វាយតម្លៃផ្កាយ' : '2. Star Rating (1 or 2 Stars for No Warranty ឬ Bad Experience)'}
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {[1, 2, 3].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setStarRating(star)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px 14px',
                      borderRadius: 10,
                      border: starRating === star ? '1.5px solid #EF4444' : '1px solid var(--border, #CBD5E1)',
                      background: starRating === star ? 'rgba(239,68,68,0.1)' : 'var(--bg-secondary, #F8FAFC)',
                      color: starRating === star ? '#DC2626' : 'var(--text, #0F172A)',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    <FiStar size={14} fill={starRating >= star ? '#F59E0B' : 'none'} color="#F59E0B" />
                    {star} {star === 1 ? 'Star (Very Poor)' : star === 2 ? 'Stars (Poor ឬ No Warranty)' : 'Stars'}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 800, display: 'block', marginBottom: 6 }}>
                {isKhmer ? '៣. ពិពណ៌នាលម្អិត *' : '3. Detailed Explanation *'}
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={isKhmer ? 'បញ្ជាក់ពីបញ្ហាដែលអ្នកបានជួប ឧ. ទិញមកគ្មានការធានា, ខុស password ឬផុតកំណត់...' : 'Explain the warranty or product problem in detail...'}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1px solid var(--border, #CBD5E1)',
                  background: 'var(--bg-secondary, #F8FAFC)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>

            {/* 4. Evidence ឬ Proof Images & Captions */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 800, display: 'block', marginBottom: 6 }}>
                {isKhmer ? '៤. រូបភាពភស្តុតាងបញ្ជាក់' : '4. Proof Screenshots & Images'}
              </label>

              {/* Images Preview Grid */}
              {evidenceImages.length > 0 && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                  {evidenceImages.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative', width: 72, height: 72, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <img src={img} alt={`Proof ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        style={{
                          position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.65)',
                          color: '#FFF', border: 'none', borderRadius: '50%', width: 20, height: 20,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.7rem'
                        }}
                      >
                        <FiX size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload & URL Input Row */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{
                  padding: '6px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <FiUpload size={14} />
                  <span>{isKhmer ? 'ជ្រើសរើសរូបពីម៉ាស៊ីន' : 'Upload Image'}</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>

                <div style={{ flex: 1, display: 'flex', gap: 6, minWidth: 200 }}>
                  <input
                    type="url"
                    placeholder={isKhmer ? 'ឬដាក់ Link រូបភាព Screenshot...' : 'Or paste screenshot image URL...'}
                    value={imageUrlInput}
                    onChange={e => setImageUrlInput(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      fontSize: '0.78rem'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    style={{
                      padding: '6px 12px',
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

              {/* Proof Caption ឬ Notes */}
              <div style={{ marginTop: 8 }}>
                <input
                  type="text"
                  placeholder={isKhmer ? 'កំណត់សម្គាល់បន្ថែមលើរូបភាពភស្តុតាង (ឧ. រូបបង្ហាញថា Password ខុស)...' : 'Write a caption for the proof images (e.g. error screen)...'}
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    fontSize: '0.8rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Policy Banner Link */}
            <div style={{
              background: 'rgba(79, 70, 229, 0.05)',
              border: '1px solid rgba(79, 70, 229, 0.2)',
              borderRadius: 12,
              padding: '10px 14px',
              fontSize: '0.75rem',
              color: 'var(--text-light, #475569)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiShield size={16} color="#4F46E5" />
                <span>{isKhmer ? 'ការពារដោយគោលការណ៍ប្តូរ និងសងប្រាក់វិញ' : 'Protected by Replacement & Return Policy'}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPolicy(true)}
                style={{ background: 'none', border: 'none', color: '#4F46E5', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer' }}
              >
                {isKhmer ? 'មើលគោលការណ៍' : 'View Policy'}
              </button>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '9px 16px',
                  borderRadius: 10,
                  border: '1px solid var(--border, #CBD5E1)',
                  background: 'transparent',
                  color: 'var(--text-light, #64748B)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                {isKhmer ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '9px 20px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                  color: '#FFF',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: submitting ? 'wait' : 'pointer',
                  boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {submitting ? (isKhmer ? 'កំពុងផ្ញើ...' : 'Submitting...') : (isKhmer ? 'ផ្ញើការរាយការណ៍' : 'Submit Report')}
              </button>
            </div>
          </form>
        </div>
      </div>

      <PolicyModal
        isOpen={showPolicy}
        onClose={() => setShowPolicy(false)}
        initialTab="replacement"
      />
    </>
  );
};

export default ReportProductModal;
