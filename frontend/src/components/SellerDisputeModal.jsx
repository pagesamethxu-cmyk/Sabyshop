import React, { useState, useEffect } from 'react';
import { disputes as disputesApi } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import {
  FiAlertTriangle, FiCheck, FiX, FiRefreshCw, FiDollarSign,
  FiShield, FiExternalLink, FiImage
} from 'react-icons/fi';

const SellerDisputeModal = ({ isOpen, onClose, dispute, onSuccess }) => {
  const { isKhmer } = useLanguage();
  const [action, setAction] = useState('AGREE_REPLACEMENT');
  const [responseMessage, setResponseMessage] = useState('');
  const [replacementEmail, setReplacementEmail] = useState('');
  const [replacementPassword, setReplacementPassword] = useState('');
  const [replacementNote, setReplacementNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (dispute) {
      setReplacementEmail(dispute.replacementAccountEmail || '');
      setReplacementPassword(dispute.replacementAccountPassword || '');
      setReplacementNote(dispute.replacementNote || '');
      setResponseMessage(dispute.sellerResponse || '');
      setAction('AGREE_REPLACEMENT');
    }
  }, [dispute]);

  if (!isOpen || !dispute) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (action === 'AGREE_REPLACEMENT' && !replacementEmail.trim()) {
      return toast.error(isKhmer ? 'សូមបញ្ចូលគណនី ឬ License Key ថ្មី' : 'Please provide new account or license key');
    }

    setSubmitting(true);
    try {
      const payload = {
        action,
        responseMessage: responseMessage.trim(),
        replacementAccountEmail: replacementEmail.trim(),
        replacementAccountPassword: replacementPassword.trim(),
        replacementNote: replacementNote.trim()
      };

      await disputesApi.sellerRespond(dispute.id, payload);
      toast.success(
        action === 'AGREE_REPLACEMENT'
          ? (isKhmer ? 'បានប្រគល់គណនីថ្មីជូនអ្នកទិញជោគជ័យ!' : 'Replacement account sent successfully!')
          : action === 'AGREE_REFUND'
          ? (isKhmer ? 'បានយល់ព្រមបង្វិលប្រាក់សងអ្នកទិញ!' : 'Agreed to refund buyer!')
          : (isKhmer ? 'បានបញ្ជូនទំនាស់ទៅ Admin សម្របសម្រួលជោគជ័យ!' : 'Dispute escalated to Admin!')
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || (isKhmer ? 'មិនអាចឆ្លើយតបទំនាស់បានទេ' : 'Failed to respond to dispute'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1050,
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
          maxWidth: 640,
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
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                {isKhmer ? `ពិនិត្យទំនាស់ — ការបញ្ជាទិញ #${dispute.orderId}` : `Review Dispute — Order #${dispute.orderId}`}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-light, #64748B)' }}>
                {isKhmer ? 'អ្នកទិញ: ' : 'Buyer: '}{dispute.buyerEmail || (isKhmer ? 'អតិថិជន' : 'Customer')} · ${Number(dispute.orderAmount || 0).toFixed(2)}
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

        {/* Content */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Product Banner (if available) */}
          {dispute.productName && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: 'rgba(59, 130, 246, 0.06)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: 14,
              padding: '10px 14px'
            }}>
              {dispute.productImageUrl && (
                <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
                  <img src={dispute.productImageUrl} alt={dispute.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.72rem', color: '#2563EB', fontWeight: 700, textTransform: 'uppercase' }}>
                  {isKhmer ? 'ផលិតផលមានបញ្ហា' : 'Claimed Product'}
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text)' }}>
                  {dispute.productName}
                </div>
              </div>
            </div>
          )}

          {/* Buyer Issue Summary Box */}
          <div style={{
            background: 'var(--bg-secondary, #F8FAFC)',
            border: '1px solid var(--border, #E2E8F0)',
            borderRadius: 16,
            padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{
                background: '#FEE2E2',
                color: '#DC2626',
                fontWeight: 800,
                fontSize: '0.72rem',
                padding: '3px 10px',
                borderRadius: 8
              }}>
                {dispute.issueType}
              </span>
              <span style={{ fontSize: '0.78rem', color: '#4F46E5', fontWeight: 700 }}>
                {isKhmer ? 'សំណើពីអ្នកទិញ: ' : 'Buyer requested: '}<strong>{dispute.preferredSolution}</strong>
              </span>
            </div>

            <div style={{ fontSize: '0.86rem', color: 'var(--text, #0F172A)', lineHeight: 1.5, marginBottom: 10 }}>
              <strong>{isKhmer ? 'ការរៀបរាប់ពីបញ្ហា:' : 'Issue Description:'}</strong> {dispute.description || (isKhmer ? 'គ្មានការរៀបរាប់បន្ថែម។' : 'No description provided.')}
            </div>

            {/* Evidence Images */}
            {dispute.evidenceImages && dispute.evidenceImages.length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-light, #64748B)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FiImage size={13} /> {isKhmer ? `រូបភាពភស្តុតាងពីអ្នកទិញ (${dispute.evidenceImages.length} សន្លឹក):` : `Buyer Evidence Photos (${dispute.evidenceImages.length}):`}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {dispute.evidenceImages.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setPreviewImage(img)}
                      style={{
                        width: 68,
                        height: 68,
                        borderRadius: 10,
                        overflow: 'hidden',
                        border: '1.5px solid #CBD5E1',
                        display: 'inline-block',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                      }}
                      title={isKhmer ? 'ចុចដើម្បីមើលរូបភាពពេញ' : 'Click to zoom screenshot'}
                    >
                      <img src={img} alt="Evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
                {(dispute.caption || dispute.imageCaptions) && (
                  <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: 6, fontStyle: 'italic', background: '#FFF', padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <strong>{isKhmer ? 'ចំណាំលើរូបភាព៖' : 'Photo note:'}</strong> {dispute.caption || dispute.imageCaptions}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Choice */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 800, display: 'block', marginBottom: 8 }}>
              {isKhmer ? 'ជ្រើសរើសវិធីសាស្ត្រដោះស្រាយ:' : 'Choose Resolution Option:'}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
              {/* Replacement */}
              <div
                onClick={() => setAction('AGREE_REPLACEMENT')}
                style={{
                  padding: '12px',
                  borderRadius: 12,
                  border: action === 'AGREE_REPLACEMENT' ? '2px solid #10B981' : '1px solid var(--border)',
                  background: action === 'AGREE_REPLACEMENT' ? 'rgba(16,185,129,0.08)' : 'var(--bg-secondary)',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <FiRefreshCw size={20} color="#10B981" style={{ marginBottom: 4 }} />
                <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#059669' }}>{isKhmer ? 'ប្តូរទំនិញថ្មីជូន' : 'Provide Replacement'}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-light)' }}>{isKhmer ? 'ប្រគល់គណនី/Key ថ្មីជូនអតិថិជន' : 'Send replacement credentials'}</div>
              </div>

              {/* Refund */}
              <div
                onClick={() => setAction('AGREE_REFUND')}
                style={{
                  padding: '12px',
                  borderRadius: 12,
                  border: action === 'AGREE_REFUND' ? '2px solid #F59E0B' : '1px solid var(--border)',
                  background: action === 'AGREE_REFUND' ? 'rgba(245,158,11,0.08)' : 'var(--bg-secondary)',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <FiDollarSign size={20} color="#F59E0B" style={{ marginBottom: 4 }} />
                <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#B45309' }}>{isKhmer ? 'យល់ព្រមបង្វិលប្រាក់' : 'Accept Refund'}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-light)' }}>{isKhmer ? 'សងប្រាក់ជូនអ្នកទិញវិញ' : 'Refund to buyer'}</div>
              </div>

              {/* Reject ឬ Escalate */}
              <div
                onClick={() => setAction('REJECT_ESCALATE')}
                style={{
                  padding: '12px',
                  borderRadius: 12,
                  border: action === 'REJECT_ESCALATE' ? '2px solid #6366F1' : '1px solid var(--border)',
                  background: action === 'REJECT_ESCALATE' ? 'rgba(99,102,241,0.08)' : 'var(--bg-secondary)',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <FiShield size={20} color="#6366F1" style={{ marginBottom: 4 }} />
                <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#4F46E5' }}>{isKhmer ? 'Admin សម្របសម្រួល' : 'Escalate to Admin'}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-light)' }}>{isKhmer ? 'ស្នើ Admin ត្រួតពិនិត្យ' : 'Request Admin mediation'}</div>
              </div>
            </div>
          </div>

          {/* Conditional Inputs */}
          {action === 'AGREE_REPLACEMENT' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(16,185,129,0.04)', padding: 14, borderRadius: 14, border: '1px solid rgba(16,185,129,0.2)' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, display: 'block', marginBottom: 4 }}>
                  {isKhmer ? 'គណនី ឬ License Key ថ្មី *' : 'New Account / License Key *'}
                </label>
                <input
                  type="text"
                  value={replacementEmail}
                  onChange={e => setReplacementEmail(e.target.value)}
                  placeholder={isKhmer ? 'អ៊ីមែល ឬ Link ឬ Key ថ្មី...' : 'New email, link or key...'}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: '#FFF',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, display: 'block', marginBottom: 4 }}>
                  {isKhmer ? 'ពាក្យសម្ងាត់ថ្មី' : 'New Password'}
                </label>
                <input
                  type="text"
                  value={replacementPassword}
                  onChange={e => setReplacementPassword(e.target.value)}
                  placeholder={isKhmer ? 'ពាក្យសម្ងាត់ថ្មី...' : 'New password...'}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: '#FFF',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, display: 'block', marginBottom: 4 }}>
                  {isKhmer ? 'កំណត់ចំណាំជូនអ្នកទិញ' : 'Note to Buyer'}
                </label>
                <input
                  type="text"
                  value={replacementNote}
                  onChange={e => setReplacementNote(e.target.value)}
                  placeholder={isKhmer ? 'ឧ. នេះជាគណនីថ្មីដែលមានសុពលភាពពេញលេញ...' : 'e.g. Here is your replacement account...'}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: '#FFF',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          )}

          {/* Response Message ឬ Reason */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 800, display: 'block', marginBottom: 4 }}>
              {isKhmer ? 'កំណត់ចំណាំឆ្លើយតប ឬ មូលហេតុបន្ថែម' : 'Response Note / Explanation'}
            </label>
            <textarea
              value={responseMessage}
              onChange={e => setResponseMessage(e.target.value)}
              placeholder={action === 'REJECT_ESCALATE' ? (isKhmer ? 'រៀបរាប់មូលហេតុដែលអ្នកបដិសេធដើម្បីឱ្យ Admin ពិនិត្យ...' : 'Explain your dispute rejection to admin...') : (isKhmer ? 'សារបន្ថែមទៅកាន់អតិថិជន...' : 'Optional message to buyer...')}
              rows={2}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                fontSize: '0.85rem',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-light)',
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
                background: action === 'AGREE_REPLACEMENT'
                  ? 'linear-gradient(135deg, #10B981, #059669)'
                  : action === 'AGREE_REFUND'
                  ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                  : 'linear-gradient(135deg, #6366F1, #4F46E5)',
                color: '#FFF',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: submitting ? 'wait' : 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              {submitting ? (isKhmer ? 'កំពុងបញ្ជូន...' : 'Submitting...') : (isKhmer ? 'បញ្ជូនការឆ្លើយតប' : 'Submit Response')}
            </button>
          </div>
        </form>

      </div>
      
      {/* Evidence Image Zoom Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img
              src={previewImage}
              alt="Evidence Zoom"
              style={{ width: '100%', height: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: 12 }}
            />
            <button
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: -14,
                right: -14,
                background: '#EF4444',
                color: '#fff',
                border: '2px solid #fff',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(0,0,0,0.4)'
              }}
            >
              <FiX size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDisputeModal;
