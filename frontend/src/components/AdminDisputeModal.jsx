import React, { useState, useEffect } from 'react';
import { disputes as disputesApi } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import {
  FiShield, FiX, FiCheck, FiAlertTriangle, FiDollarSign,
  FiRefreshCw, FiImage, FiExternalLink, FiInfo, FiCheckCircle,
  FiEye, FiEdit3, FiClock
} from 'react-icons/fi';

const AdminDisputeModal = ({ isOpen, onClose, orderId, onSuccess }) => {
  const { isKhmer } = useLanguage();
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMediateMode, setIsMediateMode] = useState(false);
  const [decision, setDecision] = useState('REFUND_BUYER');
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchDispute();
    }
  }, [isOpen, orderId]);

  const fetchDispute = async () => {
    setLoading(true);
    try {
      const res = await disputesApi.getByOrderId(orderId);
      if (res.data) {
        setDispute(res.data);
        setIsMediateMode(res.data.status === 'ESCALATED_ADMIN');
      }
    } catch (err) {
      toast.error(isKhmer ? 'មិនអាចទាញយកព័ត៌មានវិវាទបានទេ' : 'Failed to load dispute details');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!dispute) return;

    setSubmitting(true);
    try {
      const payload = {
        decision,
        adminNotes: adminNotes.trim()
      };

      await disputesApi.adminResolve(dispute.id, payload);
      toast.success(
        isKhmer
          ? `ការសម្របសម្រួលវិវាទ #${dispute.id} បានបញ្ចប់ដោយជោគជ័យ!`
          : `Dispute #${dispute.id} mediation completed with decision: ${decision}`
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || (isKhmer ? 'បរាជ័យក្នុងការដោះស្រាយវិវាទ' : 'Failed to resolve dispute'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        background: 'rgba(15, 23, 42, 0.82)',
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
          background: '#1E293B',
          color: '#F8FAFC',
          borderRadius: 24,
          width: '100%',
          maxWidth: 680,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 22px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: isMediateMode
            ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.1))'
            : 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(99, 102, 241, 0.08))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: isMediateMode
                ? 'linear-gradient(135deg, #8B5CF6, #6366F1)'
                : 'linear-gradient(135deg, #0EA5E9, #2563EB)',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
              flexShrink: 0
            }}>
              {isMediateMode ? <FiShield size={20} /> : <FiEye size={20} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#FFF' }}>
                  {isMediateMode
                    ? (isKhmer ? 'ការសម្របសម្រួលវិវាទ Admin' : 'Admin Mediation')
                    : (isKhmer ? 'ការពិនិត្យវិវាទ' : 'Dispute Review')} — {isKhmer ? 'ការបញ្ជាទិញ' : 'Order'} #{orderId}
                </h3>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: isMediateMode ? 'rgba(139,92,246,0.3)' : 'rgba(14,165,233,0.25)',
                  color: isMediateMode ? '#DDD6FE' : '#BAE6FD',
                  border: isMediateMode ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(14,165,233,0.4)'
                }}>
                  {isMediateMode
                    ? (isKhmer ? 'របៀបកាត់សេចក្តី (Mediation)' : 'Mediation Mode')
                    : (isKhmer ? 'របៀបមើលតែប៉ុណ្ណោះ (View Only)' : 'View Only Mode')}
                </span>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                {isMediateMode
                  ? (isKhmer ? 'ការស៊ើបអង្កេតផ្លូវការ និងការទូទាត់ប្រាក់ Escrow' : 'Official Escrow Mediation & Dispute Verdict')
                  : (isKhmer ? 'តាមដានការពិនិត្យរបស់អ្នកលក់ និងការប្រគល់គណនីប្តូរថ្មី' : 'Monitoring seller review and replacement fulfillment')}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              cursor: 'pointer',
              color: '#94A3B8',
              padding: 8,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94A3B8' }}>
            {isKhmer ? 'កំពុងផ្ទុកព័ត៌មានលម្អិតអំពីវិវាទ...' : 'Loading dispute details...'}
          </div>
        ) : !dispute ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94A3B8' }}>
            {isKhmer ? 'មិនមានវិវាទសម្រាប់ការបញ្ជាទិញនេះឡើយ។' : 'No dispute found for this order.'}
          </div>
        ) : (
          <form onSubmit={handleResolve} style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* View Mode Notice Banner */}
            {!isMediateMode && (
              <div style={{
                background: 'rgba(14, 165, 233, 0.08)',
                border: '1px solid rgba(14, 165, 233, 0.25)',
                borderRadius: 14,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                fontSize: '0.8rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiInfo size={16} color="#38BDF8" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#E0F2FE' }}>
                    <strong>{isKhmer ? 'របៀបមើលរបស់ Admin:' : 'Admin View Mode:'}</strong>{' '}
                    {isKhmer
                      ? 'អ្នកលក់ពិនិត្យវិវាទនេះ និងប្រគល់គណនីប្តូរថ្មីជូនអតិថិជនតាមរយៈផ្ទាំងគ្រប់គ្រងអ្នកលក់ (Seller Portal)។'
                      : 'The seller reviews this dispute and provides replacement credentials in the Seller Portal.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMediateMode(true)}
                  style={{
                    background: 'rgba(139,92,246,0.2)',
                    border: '1px solid rgba(139,92,246,0.4)',
                    color: '#C4B5FD',
                    borderRadius: 8,
                    padding: '5px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <FiEdit3 size={11} /> {isKhmer ? 'កាត់សេចក្តីវិវាទ' : 'Mediate Verdict'}
                </button>
              </div>
            )}

            {/* Product & Parties Summary Box */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 16,
              padding: '14px 16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              fontSize: '0.82rem'
            }}>
              {/* Product Info with Image */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, gridColumn: '1 / -1', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {dispute.productImageUrl && (
                  <div style={{ width: 46, height: 46, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }}>
                    <img src={dispute.productImageUrl} alt={dispute.productName || 'Product'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div>
                  <div style={{ color: '#94A3B8', fontSize: '0.7rem', fontWeight: 700 }}>
                    {isKhmer ? 'ទំនិញដែលបានទិញ:' : 'PRODUCT CLAIMED:'}
                  </div>
                  <div style={{ color: '#38BDF8', fontWeight: 800, fontSize: '0.92rem' }}>
                    {dispute.productName || (isKhmer ? 'គណនីឌីជីថល / License Product' : 'Digital Account / License Product')}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ color: '#94A3B8', fontSize: '0.72rem', fontWeight: 700 }}>
                  {isKhmer ? 'អ្នកទិញ (ដើមបណ្តឹង):' : 'BUYER CLAIMANT:'}
                </div>
                <div style={{ color: '#FFF', fontWeight: 800 }}>{dispute.buyerName || (isKhmer ? 'អ្នកទិញ' : 'Buyer')}</div>
                <div style={{ color: '#94A3B8', fontSize: '0.74rem' }}>{dispute.buyerEmail}</div>
              </div>
              <div>
                <div style={{ color: '#94A3B8', fontSize: '0.72rem', fontWeight: 700 }}>
                  {isKhmer ? 'អ្នកលក់ (ចុងចម្លើយ):' : 'SELLER DEFENDANT:'}
                </div>
                <div style={{ color: '#FFF', fontWeight: 800 }}>{dispute.sellerStoreName || dispute.sellerEmail || 'Digital Store'}</div>
                <div style={{ color: '#94A3B8', fontSize: '0.74rem' }}>{dispute.sellerEmail}</div>
              </div>
              <div>
                <div style={{ color: '#94A3B8', fontSize: '0.72rem', fontWeight: 700 }}>
                  {isKhmer ? 'ចំនួនទឹកប្រាក់ ESCROW:' : 'ESCROW AMOUNT:'}
                </div>
                <div style={{ color: '#10B981', fontWeight: 900, fontSize: '0.95rem' }}>${Number(dispute.orderAmount || 0).toFixed(2)}</div>
              </div>
            </div>

            {/* Seller Replacement Account Status Box */}
            {dispute.replacementAccountEmail ? (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1.5px solid rgba(16, 185, 129, 0.4)',
                borderRadius: 14,
                padding: '12px 16px',
                fontSize: '0.82rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34D399', fontWeight: 800, marginBottom: 6 }}>
                  <FiCheckCircle size={15} /> {isKhmer ? 'គណនីប្តូរថ្មីត្រូវបានប្រគល់ដោយអ្នកលក់:' : 'Replacement Credentials Delivered by Seller:'}
                </div>
                <div style={{ display: 'grid', gap: 4, color: '#E2E8F0' }}>
                  <div><strong style={{ color: '#A7F3D0' }}>{isKhmer ? 'គណនី/Key:' : 'Account/Key:'}</strong> <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4, color: '#6EE7B7' }}>{dispute.replacementAccountEmail}</code></div>
                  {dispute.replacementAccountPassword && (
                    <div><strong style={{ color: '#A7F3D0' }}>{isKhmer ? 'ពាក្យសម្ងាត់:' : 'Password:'}</strong> <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4, color: '#6EE7B7' }}>{dispute.replacementAccountPassword}</code></div>
                  )}
                  {dispute.replacementNote && (
                    <div style={{ fontSize: '0.78rem', color: '#CBD5E1', fontStyle: 'italic', marginTop: 2 }}>
                      <strong>{isKhmer ? 'កំណត់សម្គាល់ទៅកាន់អ្នកទិញ:' : 'Note to Buyer:'}</strong> {dispute.replacementNote}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 14,
                padding: '12px 16px',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <FiClock size={20} color="#F59E0B" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ color: '#FCD34D', fontWeight: 800 }}>
                    {isKhmer ? 'កំពុងរង់ចាំអ្នកលក់ប្រគល់គណនីប្តូរថ្មីក្នុង Seller Portal' : 'Awaiting Seller Replacement in Seller Portal'}
                  </div>
                  <div style={{ color: '#94A3B8', fontSize: '0.74rem', marginTop: 2 }}>
                    {isKhmer
                      ? 'អ្នកលក់ត្រូវបានជូនដំណឹងឱ្យពិនិត្យភស្តុតាង និងប្រគល់គណនីថ្មី។ Admin កំពុងតាមដានករណីនេះ។'
                      : 'The seller has been notified to review the defect proof below and provide replacement credentials.'}
                  </div>
                </div>
              </div>
            )}

            {/* Buyer Issue & Evidence */}
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 14,
              padding: '14px 16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                <span style={{ background: '#DC2626', color: '#FFF', fontWeight: 800, fontSize: '0.74rem', padding: '3px 10px', borderRadius: 6 }}>
                  {dispute.issueType}
                </span>
                <span style={{ fontSize: '0.76rem', color: '#FCA5A5' }}>
                  {isKhmer ? 'ដំណោះស្រាយដែលចង់បាន:' : 'Requested:'}{' '}
                  <strong>
                    {dispute.preferredSolution === 'REPLACEMENT'
                      ? (isKhmer ? 'ប្តូរគណនីថ្មី (1-to-1 Replace)' : 'Replacement')
                      : (isKhmer ? 'បង្វិលប្រាក់វិញ (Refund)' : 'Refund')}
                  </strong>
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#F8FAFC', marginBottom: 12, lineHeight: 1.5 }}>
                <strong style={{ color: '#FCA5A5' }}>{isKhmer ? 'ការរៀបរាប់របស់អ្នកទិញ:' : 'Buyer Statement:'}</strong>{' '}
                {dispute.description || (isKhmer ? 'មិនមានការពិពណ៌នា' : 'No description provided.')}
              </div>

              {dispute.evidenceImages && dispute.evidenceImages.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FCA5A5', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FiImage size={13} /> {isKhmer ? `ភស្តុតាងរូបភាព (${dispute.evidenceImages.length} រូបភាព - ចុចដើម្បីពង្រីកមើល):` : `Evidence Proof (${dispute.evidenceImages.length} images - click to inspect):`}
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {dispute.evidenceImages.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setZoomImage(img)}
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 10,
                          overflow: 'hidden',
                          border: '2px solid rgba(255,255,255,0.2)',
                          cursor: 'pointer',
                          position: 'relative'
                        }}
                      >
                        <img src={img} alt="Evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0,0,0,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0,
                          transition: 'opacity 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                        onMouseLeave={e => e.currentTarget.style.opacity = 0}
                        >
                          <FiEye size={16} color="#FFF" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Seller Response (if any) */}
            {dispute.sellerResponse && (
              <div style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: 14,
                padding: '12px 16px',
                fontSize: '0.82rem'
              }}>
                <div style={{ fontWeight: 800, color: '#60A5FA', marginBottom: 4 }}>
                  {isKhmer ? 'ការឆ្លើយតបរបស់អ្នកលក់:' : 'Seller Remark:'}
                </div>
                <div style={{ color: '#E2E8F0' }}>{dispute.sellerResponse}</div>
              </div>
            )}

            {/* Mediation Controls (Only when in Mediation Mode) */}
            {isMediateMode ? (
              <>
                {/* Admin Decision Selection */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FFF', display: 'block', marginBottom: 8 }}>
                    {isKhmer ? 'ជ្រើសរើសសេចក្តីសម្រេចកាត់សេចក្តី និងការទូទាត់ប្រាក់:' : 'Select Mediation Verdict & Fund Disposition:'}
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                    {/* Decision 1: Refund Buyer */}
                    <div
                      onClick={() => setDecision('REFUND_BUYER')}
                      style={{
                        padding: '12px',
                        borderRadius: 12,
                        border: decision === 'REFUND_BUYER' ? '2px solid #EF4444' : '1px solid rgba(255,255,255,0.1)',
                        background: decision === 'REFUND_BUYER' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      <FiDollarSign size={20} color="#EF4444" style={{ marginBottom: 4 }} />
                      <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#F87171' }}>
                        {isKhmer ? 'បង្វិលប្រាក់ទៅអ្នកទិញ' : 'Refund Buyer'}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                        {isKhmer ? 'ប្រគល់ប្រាក់ Escrow ជូនអ្នកទិញវិញ' : 'Return escrow to buyer'}
                      </div>
                    </div>

                    {/* Decision 2: Complete to Seller */}
                    <div
                      onClick={() => setDecision('COMPLETE_SELLER')}
                      style={{
                        padding: '12px',
                        borderRadius: 12,
                        border: decision === 'COMPLETE_SELLER' ? '2px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
                        background: decision === 'COMPLETE_SELLER' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      <FiCheckCircle size={20} color="#10B981" style={{ marginBottom: 4 }} />
                      <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#34D399' }}>
                        {isKhmer ? 'ទូទាត់ប្រាក់ឱ្យអ្នកលក់' : 'Complete to Seller'}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                        {isKhmer ? 'ដោះលែងប្រាក់ទៅកាន់អ្នកលក់' : 'Release funds to seller'}
                      </div>
                    </div>

                    {/* Decision 3: Dismiss Claim */}
                    <div
                      onClick={() => setDecision('REJECT_DISPUTE')}
                      style={{
                        padding: '12px',
                        borderRadius: 12,
                        border: decision === 'REJECT_DISPUTE' ? '2px solid #6366F1' : '1px solid rgba(255,255,255,0.1)',
                        background: decision === 'REJECT_DISPUTE' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      <FiShield size={20} color="#6366F1" style={{ marginBottom: 4 }} />
                      <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#A5B4FC' }}>
                        {isKhmer ? 'បដិសេធពាក្យបណ្តឹង' : 'Dismiss Claim'}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                        {isKhmer ? 'កំណត់ស្ថានភាពជា បានប្រគល់' : 'Set status DELIVERED'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#CBD5E1', display: 'block', marginBottom: 4 }}>
                    {isKhmer ? 'ការរកឃើញរបស់ Admin & កំណត់សម្គាល់កាត់សេចក្តី *' : 'Admin Findings & Mediation Note *'}
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    placeholder={isKhmer ? 'សូមសរសេរពីការសន្និដ្ឋាននៃការស៊ើបអង្កេត និងមូលហេតុនៃសេចក្តីសម្រេច...' : 'State the investigation conclusion and reason for this decision...'}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(15, 23, 42, 0.8)',
                      color: '#FFF',
                      fontSize: '0.85rem',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>

                {/* Mediation Actions */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setIsMediateMode(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      textDecoration: 'underline'
                    }}
                  >
                    {isKhmer ? '← ត្រឡប់ទៅមើល' : '← Back to View Mode'}
                  </button>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      onClick={onClose}
                      style={{
                        padding: '10px 18px',
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'transparent',
                        color: '#94A3B8',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      {isKhmer ? 'បោះបង់' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        padding: '10px 24px',
                        borderRadius: 10,
                        border: 'none',
                        background: decision === 'REFUND_BUYER'
                          ? 'linear-gradient(135deg, #EF4444, #DC2626)'
                          : decision === 'COMPLETE_SELLER'
                          ? 'linear-gradient(135deg, #10B981, #059669)'
                          : 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                        color: '#FFF',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: submitting ? 'wait' : 'pointer',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      {submitting ? (isKhmer ? 'កំពុងដំណើរការ...' : 'Processing Verdict...') : <><FiCheck size={15} /> {isKhmer ? 'បញ្ជាក់សេចក្តីសម្រេច' : 'Confirm Mediation Decision'}</>}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* View Mode Actions */
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsMediateMode(true)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    border: '1px solid rgba(139,92,246,0.4)',
                    background: 'rgba(139,92,246,0.15)',
                    color: '#C4B5FD',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <FiShield size={14} /> {isKhmer ? 'អន្តរាគមន៍កាត់សេចក្តី' : 'Overrule & Mediate'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, #0EA5E9, #2563EB)',
                    color: '#FFF',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(14,165,233,0.35)'
                  }}
                >
                  {isKhmer ? 'រួចរាល់ / បិទ' : 'Done / Close'}
                </button>
              </div>
            )}
          </form>
        )}
      </div>

      {/* Lightbox Zoom Modal */}
      {zoomImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
          onClick={() => setZoomImage(null)}
        >
          <button
            onClick={() => setZoomImage(null)}
            style={{
              position: 'absolute',
              top: 24,
              right: 24,
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: 44,
              height: 44,
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <FiX size={24} />
          </button>
          <img
            src={zoomImage}
            alt="Zoomed Evidence"
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: 12,
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default AdminDisputeModal;
