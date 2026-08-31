import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FiMail, FiLock, FiKey, FiEye, FiEyeOff, FiShield, FiCheckCircle, FiRefreshCw, FiArrowLeft } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const OTP_LENGTH = 4;
const OTP_EXPIRY_SECONDS = 5 * 60; // 5 minutes

//  OTP Input Grid Component 
const OtpInputGrid = ({ otp, setOtp, disabled }) => {
  const inputRefs = useRef([]);

  const handleChange = (index, e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) {
      const next = [...otp];
      next[index] = '';
      setOtp(next);
      return;
    }
    if (val.length > 1) {
      const digits = val.slice(0, OTP_LENGTH).split('');
      const next = Array(OTP_LENGTH).fill('');
      digits.forEach((d, i) => { next[i] = d; });
      setOtp(next);
      const focusIdx = Math.min(digits.length, OTP_LENGTH - 1);
      inputRefs.current[focusIdx]?.focus();
      return;
    }
    const next = [...otp];
    next[index] = val;
    setOtp(next);
    if (index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const next = [...otp];
        next[index] = '';
        setOtp(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    const next = Array(OTP_LENGTH).fill('');
    text.split('').forEach((d, i) => { next[i] = d; });
    setOtp(next);
    const focusIdx = Math.min(text.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  return (
    <div style={{ display: 'flex', gap: 'clamp(6px, 2.5vw, 12px)', justifyContent: 'center' }}>
      {Array(OTP_LENGTH).fill(null).map((_, i) => (
        <input
          key={i}
          ref={el => inputRefs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={OTP_LENGTH}
          value={otp[i]}
          disabled={disabled}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={e => e.target.select()}
          style={{
            width: 'clamp(46px, 13vw, 60px)',
            height: 'clamp(56px, 15vw, 70px)',
            textAlign: 'center',
            fontSize: 'clamp(1.4rem, 5vw, 1.8rem)',
            fontWeight: '700',
            fontFamily: "'Courier New', monospace",
            border: otp[i]
              ? '2px solid var(--primary)'
              : '2px solid var(--border, #e5e7eb)',
            borderRadius: '12px',
            background: otp[i]
              ? 'rgba(79, 70, 229, 0.06)'
              : 'var(--bg-secondary, #f9fafb)',
            color: 'var(--text)',
            outline: 'none',
            transition: 'all 0.15s ease',
            boxShadow: otp[i] ? '0 0 0 3px rgba(79,70,229,0.12)' : 'none',
            cursor: disabled ? 'not-allowed' : 'text',
            opacity: disabled ? 0.6 : 1,
          }}
        />
      ))}
    </div>
  );
};

//  Countdown Timer Component 
const CountdownTimer = ({ seconds, onExpire }) => {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      onExpire?.();
      return;
    }
    const id = setInterval(() => setRemaining(r => r - 1), 1000);
    return () => clearInterval(id);
  }, [remaining, onExpire]);

  const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
  const secs = String(remaining % 60).padStart(2, '0');
  const isUrgent = remaining < 60;

  return (
    <span style={{
      fontWeight: '700',
      color: isUrgent ? '#ef4444' : 'var(--primary)',
      fontFamily: "'Courier New', monospace",
      fontSize: '1rem',
    }}>
      {mins}:{secs}
    </span>
  );
};

//  Main ForgotPasswordPage 
const ForgotPasswordPage = () => {
  const { lang } = useLanguage();
  const isKhmer = lang === 'km';
  const navigate = useNavigate();

  const { forgotPassword, resetPassword } = useAuth();

  const [step, setStep] = useState(1); // 1 = enter email, 2 = enter OTP + new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [expired, setExpired] = useState(false);

  //  Step 1: Send OTP for Reset Password 
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      toast.error(isKhmer ? 'សូមបញ្ចូលអ៊ីមែលរបស់អ្នក' : 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setOtp(Array(OTP_LENGTH).fill(''));
      setExpired(false);
      setTimerKey(k => k + 1);
      setStep(2);
    } catch (error) {
      // Toast handles error message
    } finally {
      setLoading(false);
    }
  };

  //  Step 2: Submit OTP & Reset Password 
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');

    if (code.length < OTP_LENGTH) {
      toast.error(isKhmer ? 'សូមបញ្ចូលលេខកូដ OTP ៤ ខ្ទង់ឱ្យគ្រប់' : 'Please enter all 4 digits of the OTP code');
      return;
    }

    if (newPassword.length < 6) {
      toast.error(isKhmer ? 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួអក្សរ' : 'Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(isKhmer ? 'ពាក្យសម្ងាត់ថ្មីមិនត្រូវគ្នាទេ' : 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim(), code, newPassword);
      navigate('/login');
    } catch (error) {
      // Toast handles error message
    } finally {
      setLoading(false);
    }
  };

  //  Resend Code 
  const handleResend = async () => {
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      toast.success(isKhmer ? 'លេខកូដថ្មីត្រូវបានផ្ញើទៅអ៊ីមែលរបស់អ្នក!' : 'New verification code sent to your email!');
      setOtp(Array(OTP_LENGTH).fill(''));
      setExpired(false);
      setTimerKey(k => k + 1);
    } catch (error) {
      // Toast handles error message
    } finally {
      setLoading(false);
    }
  };

  const handleExpire = useCallback(() => setExpired(true), []);

  const maskedEmail = email
    ? email.replace(/(.{2}).+(@.+)/, '$1***$2')
    : '';

  return (
    <div className="container" style={{ padding: 'clamp(30px, 8vw, 60px) 16px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '75vh' }}>
      <div className="card animate-slide-up" style={{ width: '100%', maxWidth: '460px', padding: 'clamp(24px, 6vw, 40px) clamp(16px, 5vw, 30px)' }}>
        
        {/* Back Link */}
        <Link
          to="/login"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-light)', display: 'inline-flex', alignItems: 'center',
            gap: '6px', fontSize: '0.85rem', marginBottom: '20px', textDecoration: 'none'
          }}
        >
          <FiArrowLeft size={16} /> {isKhmer ? 'ត្រឡប់ទៅទំព័រចូល' : 'Back to Login'}
        </Link>

        {/* STEP 1: Enter Email */}
        {step === 1 ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(245,158,11,0.15))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px',
              }}>
                <FiKey size={28} style={{ color: '#ef4444' }} />
              </div>
              <h2 style={{ margin: '0 0 6px' }}>{isKhmer ? 'ភ្លេចពាក្យសម្ងាត់?' : 'Forgot Password?'}</h2>
              <p style={{ color: 'var(--text-light)', margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>
                {isKhmer 
                  ? 'បញ្ចូលអ៊ីមែលរបស់អ្នកដើម្បីទទួលបានលេខកូដ OTP ៤ ខ្ទង់ សម្រាប់កំណត់ពាក្យសម្ងាត់ថ្មី។' 
                  : 'Enter your account email to receive a 4-digit OTP code to reset your password.'}
              </p>
            </div>

            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ position: 'relative' }}>
                <FiMail style={{ position: 'absolute', top: '15px', left: '15px', color: 'var(--text-light)', zIndex: 1 }} />
                <input
                  type="email"
                  className="input"
                  placeholder={isKhmer ? 'បញ្ចូលអ៊ីមែលរបស់អ្នក' : 'Enter your email address'}
                  style={{ paddingLeft: '45px' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)', border: 'none' }} disabled={loading}>
                {loading ? <LoadingSpinner /> : (isKhmer ? 'ផ្ញើលេខកូដ OTP' : 'Send OTP Code')}
              </button>
            </form>
          </>
        ) : (
          /* STEP 2: Enter OTP & New Password */
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(59,130,246,0.15))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px',
              }}>
                <FiLock size={28} style={{ color: '#10B981' }} />
              </div>
              <h2 style={{ margin: '0 0 6px' }}>{isKhmer ? 'កំណត់ពាក្យសម្ងាត់ថ្មី' : 'Reset Password'}</h2>
              <p style={{ color: 'var(--text-light)', margin: 0, fontSize: '0.88rem' }}>
                {isKhmer ? 'លេខកូដ OTP ត្រូវ បាន ផ្ញើ ទៅកាន់' : 'OTP verification code sent to'}
              </p>
              <p style={{ color: 'var(--primary)', fontWeight: '600', margin: '4px 0 0', fontSize: '0.95rem' }}>
                {maskedEmail}
              </p>
            </div>

            <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* OTP Grid */}
              <div>
                <label style={{ display: 'block', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '12px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {isKhmer ? 'បញ្ចូលលេខកូដ OTP ៤ ខ្ទង់' : 'Enter 4-Digit OTP Code'}
                </label>
                <OtpInputGrid otp={otp} setOtp={setOtp} disabled={loading || expired} />
              </div>

              {/* Timer */}
              {!expired ? (
                <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                  {isKhmer ? 'លេខកូដផុតកំណត់ក្នុង: ' : 'Code expires in: '}
                  <CountdownTimer key={timerKey} seconds={OTP_EXPIRY_SECONDS} onExpire={handleExpire} />
                </div>
              ) : (
                <div style={{
                  textAlign: 'center', padding: '10px', borderRadius: '8px',
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                  fontSize: '0.85rem', color: '#ef4444', fontWeight: '600'
                }}>
                  {isKhmer ? 'លេខកូដ OTP ផុតកំណត់ហើយ' : 'OTP Code has expired'}
                </div>
              )}

              {/* New Password */}
              <div style={{ position: 'relative' }}>
                <FiLock style={{ position: 'absolute', top: '15px', left: '15px', color: 'var(--text-light)', zIndex: 1 }} />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  className="input"
                  placeholder={isKhmer ? 'ពាក្យសម្ងាត់ថ្មី (យ៉ាងតិច ៦ តួ)' : 'New password (min 6 chars)'}
                  style={{ paddingLeft: '45px', paddingRight: '45px' }}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{ position: 'absolute', top: '50%', right: '15px', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
                >
                  {showNewPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>

              {/* Confirm Password */}
              <div style={{ position: 'relative' }}>
                <FiLock style={{ position: 'absolute', top: '15px', left: '15px', color: 'var(--text-light)', zIndex: 1 }} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="input"
                  placeholder={isKhmer ? 'ផ្ទៀងផ្ទាត់ពាក្យសម្ងាត់ថ្មី' : 'Confirm new password'}
                  style={{ paddingLeft: '45px', paddingRight: '45px' }}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', top: '50%', right: '15px', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
                >
                  {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>

              {!expired && (
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none' }}
                  disabled={loading || otp.join('').length < OTP_LENGTH}
                >
                  {loading ? <LoadingSpinner /> : (<><FiCheckCircle size={18} /> {isKhmer ? 'រក្សាទុកពាក្យសម្ងាត់ថ្មី' : 'Save New Password'}</>)}
                </button>
              )}

              {/* Resend */}
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                  {isKhmer ? 'មិនបានទទួលលេខកូដ?' : "Didn't receive the code?"}{' '}
                </span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  style={{
                    background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    color: 'var(--primary)', fontWeight: '600', fontSize: '0.85rem',
                    display: 'inline-flex', alignItems: 'center', gap: '4px', padding: 0
                  }}
                >
                  <FiRefreshCw size={13} /> {isKhmer ? 'ផ្ញើលេខកូដឡើងវិញ' : 'Resend Code'}
                </button>
              </div>
            </form>
          </>
        )}

        <div style={{
          marginTop: '24px',
          padding: '10px 12px',
          borderRadius: '8px',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.78rem',
          color: 'var(--text-light)',
        }}>
          <FiShield color="#10B981" size={18} style={{ flexShrink: 0 }} />
          <span>{isKhmer ? 'ប្រព័ន្ធការពារសុវត្ថិភាព 100% សម្រាប់ការផ្លាស់ប្ដូរពាក្យសម្ងាត់' : '100% Secure Password Reset System'}</span>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
