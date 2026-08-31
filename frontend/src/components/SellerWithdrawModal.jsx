import React, { useState, useRef } from 'react';
import { seller as sellerApi, admin as adminApi } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import { FiX, FiDollarSign, FiAlertTriangle, FiUpload, FiCheck } from 'react-icons/fi';

const MIN_WITHDRAWAL = 5.00; // Minimum withdrawal amount $5.00

export default function SellerWithdrawModal({ balance = 0, onClose, onSuccess }) {
  const { isKhmer } = useLanguage();
  const [amount, setAmount] = useState('');
  const [khqrString, setKhqrString] = useState('');
  const [khqrImageUrl, setKhqrImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const fileInputRef = useRef(null);

  const parsedAmount = parseFloat(amount) || 0;
  const hasPaymentMethod = khqrString.trim().length > 0 || khqrImageUrl.length > 0;
  const isBalanceEnough = balance >= MIN_WITHDRAWAL;
  const isAmountValid = parsedAmount >= MIN_WITHDRAWAL && parsedAmount <= balance;
  const isValid = isBalanceEnough && isAmountValid && hasPaymentMethod;

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await adminApi.uploadImage(formData);
      const url = res.data?.data || res.data || res;
      setKhqrImageUrl(url);
      setConfirmed(false);
      toast.success(isKhmer ? 'បានបញ្ចូលរូបភាព KHQR ជោគជ័យ!' : 'KHQR picture uploaded!');
    } catch (err) {
      toast.error(isKhmer ? 'មិនអាចបញ្ចូលរូបភាព KHQR បានទេ' : ('Failed to upload QR image: ' + (err?.response?.data?.message || err?.message)));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    if (!confirmed) { setConfirmed(true); return; }
    setLoading(true);
    try {
      await sellerApi.requestWithdrawal({
        amount: parsedAmount,
        khqrString: khqrString.trim(),
        khqrImageUrl: khqrImageUrl
      });
      toast.success(isKhmer ? 'សំណើដកប្រាក់ត្រូវបានបញ្ជូន! Admin នឹងពិនិត្យក្នុងរយៈពេល 30–60 នាទី។' : 'Withdrawal request submitted! Admin will process it in 30–60 min.');
      onSuccess();
    } catch (err) {
      toast.error(err?.response?.data?.message || (isKhmer ? 'ការស្នើសុំដកប្រាក់មិនជោគជ័យ' : 'Withdrawal failed'));
    } finally {
      setLoading(false);
    }
  };

  // Button text renderer based on validation state
  const getButtonText = () => {
    if (loading) return isKhmer ? 'កំពុងបញ្ជូន...' : 'Submitting...';
    if (confirmed) return isKhmer ? 'បញ្ជាក់ការដកប្រាក់' : 'Confirm Withdrawal';
    if (!isBalanceEnough) return isKhmer ? `សមតុល្យមិនគ្រប់គ្រាន់ (អប្បបរមា $${MIN_WITHDRAWAL.toFixed(2)})` : `Insufficient Balance (Min $${MIN_WITHDRAWAL.toFixed(2)})`;
    if (parsedAmount > 0 && parsedAmount < MIN_WITHDRAWAL) return isKhmer ? `ចំនួនដកអប្បបរមា $${MIN_WITHDRAWAL.toFixed(2)}` : `Minimum Withdrawal $${MIN_WITHDRAWAL.toFixed(2)}`;
    if (parsedAmount > balance) return isKhmer ? 'លើសពីសមតុល្យដែលមាន' : 'Exceeds Available Balance';
    if (!hasPaymentMethod) return isKhmer ? 'សូមបញ្ចូលរូបភាព ឬកូដ KHQR' : 'Upload QR Image or Paste String';
    return isKhmer ? `ស្នើដកប្រាក់ $${parsedAmount > 0 ? parsedAmount.toFixed(2) : '0.00'}` : `Request $${parsedAmount > 0 ? parsedAmount.toFixed(2) : '0.00'} Withdrawal`;
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{
        background: 'var(--card-bg)', borderRadius: 20,
        border: '1px solid var(--border)', width: '100%', maxWidth: 460,
        padding: '28px 24px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
      }}>
        {/* Close */}
        <button onClick={onClose} id="withdraw-modal-close" style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-lighter)' }}>
          <FiX size={20} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiDollarSign size={22} color="#10b981" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' }}>
              {isKhmer ? 'ដកប្រាក់ចំណូល' : 'Withdraw Funds'}
            </div>
            <div style={{ fontSize: '0.83rem', color: 'var(--text-lighter)' }}>
              {isKhmer ? 'សមតុល្យដែលអាចដកបាន: ' : 'Available Balance: '}
              <strong style={{ color: '#10b981' }}>${balance.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* Warning Banner when balance < $5.00 */}
        {!isBalanceEnough && (
          <div style={{
            background: '#FEF3C7', border: '1px solid #FCD34D',
            borderRadius: 12, padding: '12px 14px', marginBottom: 18,
            color: '#92400E', fontSize: '0.82rem', lineHeight: 1.45,
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            <FiAlertTriangle size={20} color="#D97706" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ display: 'block', marginBottom: 2, color: '#B45309' }}>
                {isKhmer ? 'សមតុល្យមិនទាន់គ្រប់គ្រាន់!' : 'Insufficient Balance!'}
              </strong>
              {isKhmer
                ? <>សមតុល្យរបស់អ្នកត្រូវមានយ៉ាងហោចណាស់ <strong>$5.00</strong> ដើម្បីអាចធ្វើការដកប្រាក់បាន។</>
                : <>Your balance must be at least <strong>$5.00</strong> to submit a withdrawal request.</>}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Amount */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: '0.76rem', color: 'var(--text-lighter)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {isKhmer ? 'ចំនួនទឹកប្រាក់ដែលត្រូវដក ($) *' : 'Withdrawal Amount ($) *'}
              </label>
              <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 700 }}>
                {isKhmer ? 'អប្បបរមា: $5.00' : 'Min: $5.00'}
              </span>
            </div>
            <input
              className="input"
              type="number"
              step="0.01"
              min={MIN_WITHDRAWAL}
              max={balance}
              placeholder={isKhmer ? 'បញ្ចូលចំនួនទឹកប្រាក់ (អប្បបរមា $5.00)' : 'Enter amount (min $5.00)'}
              value={amount}
              onChange={e => { setAmount(e.target.value); setConfirmed(false); }}
              required
              id="withdraw-amount"
              style={{
                fontSize: '0.92rem',
                fontWeight: 700,
                borderColor: (parsedAmount > 0 && parsedAmount < MIN_WITHDRAWAL) || parsedAmount > balance ? '#EF4444' : undefined
              }}
            />

            {/* Error Message: Below $5.00 Minimum */}
            {parsedAmount > 0 && parsedAmount < MIN_WITHDRAWAL && (
              <div style={{ color: '#EF4444', fontSize: '0.78rem', marginTop: 6, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                <FiAlertTriangle size={13} /> {isKhmer ? 'ចំនួនទឹកប្រាក់ដកអប្បបរមាគឺ $5.00' : 'Minimum withdrawal is $5.00'}
              </div>
            )}

            {/* Error Message: Exceeds Available Balance */}
            {parsedAmount > balance && (
              <div style={{ color: '#EF4444', fontSize: '0.78rem', marginTop: 6, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                <FiAlertTriangle size={13} /> {isKhmer ? 'ចំនួនទឹកប្រាក់ដកលើសពីសមតុល្យដែលមាន' : 'Amount exceeds your available balance'}
              </div>
            )}
          </div>

          {/* Upload KHQR Image Section */}
          <div style={{ marginBottom: 18, background: 'var(--bg-secondary)', padding: 14, borderRadius: 14, border: '1px solid var(--border)' }}>
            <label style={{ fontSize: '0.76rem', color: 'var(--text-lighter)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>
              {isKhmer ? 'បញ្ចូលរូបភាព KHQR (ណែនាំ)' : 'Upload KHQR Image (Recommended)'}
            </label>
            
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              style={{ display: 'none' }} 
              id="withdraw-qr-file"
            />

            {khqrImageUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 60, height: 60, borderRadius: 10, overflow: 'hidden', border: '2px solid #10b981', background: '#000', flexShrink: 0 }}>
                  <img src={khqrImageUrl} alt="KHQR Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FiCheck size={14} /> {isKhmer ? 'បានបញ្ចូលរូបភាព KHQR រួចរាល់' : 'KHQR Picture Uploaded'}
                  </div>
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    style={{ fontSize: '0.76rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 4, fontWeight: 700 }}
                  >
                    {isKhmer ? 'ប្តូររូបភាព' : 'Change Picture'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: '1px dashed var(--primary)', background: 'rgba(99, 102, 241, 0.06)',
                  color: 'var(--primary)', fontWeight: 700, fontSize: '0.84rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  cursor: 'pointer'
                }}
              >
                <FiUpload size={16} /> {uploadingImage ? (isKhmer ? 'កំពុងបញ្ចូលរូបភាព...' : 'Uploading Image...') : (isKhmer ? 'ចុចទីនេះដើម្បីបញ្ចូលរូបភាព KHQR' : 'Click to Upload KHQR QR Code Picture')}
              </button>
            )}
          </div>

          {/* KHQR String / Note to Admin */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: '0.76rem', color: 'var(--text-lighter)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
              {isKhmer ? 'កំណត់ចំណាំជូន Admin / កូដ KHQR (ជម្រើស)' : 'Note to Admin / KHQR String (Optional)'}
            </label>
            <textarea
              className="input"
              placeholder={isKhmer ? 'ចម្លងកូដ KHQR ឬសរសេរកំណត់ចំណាំជូន Admin...' : 'Paste KHQR code string or add a note to admin...'}
              value={khqrString}
              onChange={e => { setKhqrString(e.target.value); setConfirmed(false); }}
              rows={2}
              id="withdraw-khqr"
              style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '0.78rem' }}
            />
          </div>

          {/* Info box */}
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '10px 12px', marginBottom: 16 }}>
            <div style={{ fontSize: '0.78rem', color: '#f59e0b', lineHeight: 1.5 }}>
              {isKhmer
                ? <>រយៈពេលដំណើរការ: <strong>30–60 នាទី</strong> | ដកប្រាក់អប្បបរមា: <strong>$5.00</strong></>
                : <>Processing time: <strong>30–60 minutes</strong> | Min withdrawal: <strong>$5.00</strong></>}
            </div>
          </div>

          {/* Confirm state */}
          {confirmed && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>
                {isKhmer ? `បញ្ជាក់: ដកប្រាក់ $${parsedAmount.toFixed(2)}?` : `Confirm: Withdraw $${parsedAmount.toFixed(2)}?`}<br />
                <span style={{ fontWeight: 400 }}>
                  {isKhmer ? 'ប្រព័ន្ធនឹងកាត់ចេញពីសមតុល្យរបស់អ្នក និងបញ្ជូនសំណើទៅកាន់ Admin។' : 'This will debit your balance and send request to admin.'}
                </span>
              </div>
            </div>
          )}

          {/* Request Button — Disabled when amount < $5.00 or amount > balance */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!isValid || loading || uploadingImage}
            style={{
              width: '100%',
              fontWeight: 800,
              padding: '12px',
              opacity: (!isValid || loading || uploadingImage) ? 0.5 : 1,
              cursor: (!isValid || loading || uploadingImage) ? 'not-allowed' : 'pointer',
              background: (!isValid || loading || uploadingImage) ? '#94A3B8' : (confirmed ? '#059669' : '#10B981'),
              borderColor: (!isValid || loading || uploadingImage) ? '#94A3B8' : (confirmed ? '#059669' : '#10B981'),
              boxShadow: (!isValid || loading || uploadingImage) ? 'none' : '0 4px 14px rgba(16,185,129,0.3)'
            }}
            id="withdraw-submit-btn"
          >
            {getButtonText()}
          </button>
        </form>
      </div>
    </div>
  );
}

