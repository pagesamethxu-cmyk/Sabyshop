import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FiMail, FiLock, FiUser, FiUserPlus, FiEye, FiEyeOff, FiShield, FiCheckCircle, FiRefreshCw, FiArrowLeft } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const OTP_LENGTH = 4;
const OTP_EXPIRY_SECONDS = 5 * 60; // 5 minutes

//  OTP Input Component 
const OtpInputGrid = ({ otp, setOtp, disabled }) => {
  const inputRefs = useRef([]);

  const handleChange = (index, e) => {
    const val = e.target.value.replace(/\D/g, ''); // digits only
    if (!val) {
      const next = [...otp];
      next[index] = '';
      setOtp(next);
      return;
    }
    // Support pasting full code
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

//  Countdown Timer 
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

//  Main RegisterPage 
const RegisterPage = () => {
  const { t } = useLanguage();
  const [step, setStep] = useState(1); // 1 = form, 2 = OTP
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirm: '' });
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timerKey, setTimerKey] = useState(0); // increment to reset timer
  const [expired, setExpired] = useState(false);
  const { sendVerificationCode, verifyAndRegister } = useAuth();
  const navigate = useNavigate();

  //  Step 1: Submit Registration Form 
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm) {
      toast.error(t('register.passwordMismatch'));
      return;
    }
    if (formData.password.length < 6) {
      toast.error(t('register.passwordTooShort'));
      return;
    }

    setLoading(true);
    try {
      await sendVerificationCode(formData.email, formData.password, formData.name);
      toast.success(t('register.codeSent'));
      setOtp(Array(OTP_LENGTH).fill(''));
      setExpired(false);
      setTimerKey(k => k + 1);
      setStep(2);
    } catch (error) {
      // Error already toasted in context
    } finally {
      setLoading(false);
    }
  };

  //  Step 2: Submit OTP 
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      toast.error(t('register.enterAllDigits'));
      return;
    }

    setLoading(true);
    try {
      await verifyAndRegister(formData.email, code);
      navigate('/');
    } catch (error) {
      // Error already toasted in context
    } finally {
      setLoading(false);
    }
  };

  //  Resend Code 
  const handleResend = async () => {
    setLoading(true);
    try {
      await sendVerificationCode(formData.email, formData.password, formData.name);
      toast.success(t('register.newCodeSent'));
      setOtp(Array(OTP_LENGTH).fill(''));
      setExpired(false);
      setTimerKey(k => k + 1);
    } catch (error) {
      // Error already toasted
    } finally {
      setLoading(false);
    }
  };

  const handleExpire = useCallback(() => setExpired(true), []);

  const maskedEmail = formData.email
    ? formData.email.replace(/(.{2}).+(@.+)/, '$1***$2')
    : '';

  // STEP 1 – Registration Form
  if (step === 1) {
    return (
      <div className="container" style={{ padding: 'clamp(30px, 8vw, 60px) 16px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <div className="card animate-slide-up" style={{ width: '100%', maxWidth: '420px', padding: 'clamp(24px, 6vw, 40px) clamp(16px, 5vw, 30px)' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <FiUserPlus size={40} style={{ color: 'var(--primary)', marginBottom: '10px' }} />
            <h2>{t('register.joinUs')}</h2>
            <p style={{ color: 'var(--text-light)' }}>{t('register.createAccount')}</p>
          </div>

          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Name */}
            <div style={{ position: 'relative' }}>
              <FiUser style={{ position: 'absolute', top: '15px', left: '15px', color: 'var(--text-light)', zIndex: 1 }} />
              <input
                type="text"
                className="input"
                placeholder={t('register.namePlaceholder')}
                style={{ paddingLeft: '45px' }}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            {/* Email */}
            <div style={{ position: 'relative' }}>
              <FiMail style={{ position: 'absolute', top: '15px', left: '15px', color: 'var(--text-light)', zIndex: 1 }} />
              <input
                type="email"
                className="input"
                placeholder={t('register.emailPlaceholder')}
                style={{ paddingLeft: '45px' }}
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>

            {/* Password */}
            <div style={{ position: 'relative' }}>
              <FiLock style={{ position: 'absolute', top: '15px', left: '15px', color: 'var(--text-light)', zIndex: 1 }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder={t('register.passwordPlaceholder')}
                style={{ paddingLeft: '45px', paddingRight: '45px' }}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', top: '50%', right: '15px', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>

            {/* Confirm Password */}
            <div style={{ position: 'relative' }}>
              <FiLock style={{ position: 'absolute', top: '15px', left: '15px', color: 'var(--text-light)', zIndex: 1 }} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="input"
                placeholder={t('register.confirmPasswordPlaceholder')}
                style={{ paddingLeft: '45px', paddingRight: '45px' }}
                value={formData.confirm}
                onChange={(e) => setFormData({...formData, confirm: e.target.value})}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ position: 'absolute', top: '50%', right: '15px', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
              {loading ? <LoadingSpinner /> : t('register.continue')}
            </button>
          </form>

          <div style={{
            marginTop: '20px',
            padding: '10px 12px',
            borderRadius: '8px',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.8rem',
            color: 'var(--text-light)'
          }}>
            <FiShield color="#10B981" size={20} style={{ flexShrink: 0 }} />
            <span><strong>{t('register.safeEncrypted')}</strong> {t('register.safeEncryptedDesc')}</span>
          </div>

          <div style={{ textAlign: 'center', marginTop: '25px', color: 'var(--text-light)' }}>
            {t('register.alreadyHaveAccount')} <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{t('register.loginLink')}</Link>
          </div>
        </div>
      </div>
    );
  }

  // STEP 2 – OTP Verification Screen
  return (
    <div className="container" style={{ padding: 'clamp(30px, 8vw, 60px) 16px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <div className="card animate-slide-up" style={{ width: '100%', maxWidth: '460px', padding: 'clamp(24px, 6vw, 40px) clamp(16px, 5vw, 30px)' }}>

        {/* Back button */}
        <button
          onClick={() => setStep(1)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-light)', display: 'flex', alignItems: 'center',
            gap: '6px', fontSize: '0.85rem', marginBottom: '20px', padding: 0,
          }}
        >
          <FiArrowLeft size={15} /> {t('register.backToForm')}
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(79,70,229,0.15), rgba(124,58,237,0.15))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <FiMail size={28} style={{ color: 'var(--primary)' }} />
          </div>
          <h2 style={{ margin: '0 0 6px' }}>{t('register.checkEmail')}</h2>
          <p style={{ color: 'var(--text-light)', margin: 0, fontSize: '0.9rem' }}>
            {t('register.sentCodeTo')} <strong>{t('register.digitCode')}</strong> {t('register.to')}
          </p>
          <p style={{ color: 'var(--primary)', fontWeight: '600', margin: '4px 0 0', fontSize: '0.95rem' }}>
            {maskedEmail}
          </p>
        </div>

        <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* OTP Boxes */}
          <div>
            <label style={{ display: 'block', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '14px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {t('register.enterVerificationCode')}
            </label>
            <OtpInputGrid otp={otp} setOtp={setOtp} disabled={loading || expired} />
          </div>

          {/* Timer */}
          {!expired ? (
            <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-light)' }}>
              {t('register.codeExpiresIn')}{' '}
              <CountdownTimer key={timerKey} seconds={OTP_EXPIRY_SECONDS} onExpire={handleExpire} />
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              fontSize: '0.85rem',
              color: '#ef4444',
              fontWeight: '500',
            }}>
              {t('register.codeExpired')}
            </div>
          )}

          {/* Verify button */}
          {!expired && (
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '13px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              disabled={loading || otp.join('').length < OTP_LENGTH}
            >
              {loading ? <LoadingSpinner /> : (<><FiCheckCircle size={18} /> {t('register.verifyCreateAccount')}</>)}
            </button>
          )}

          {/* Resend */}
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
              {t('register.didntReceive')}{' '}
            </span>
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              style={{
                background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                color: 'var(--primary)', fontWeight: '600', fontSize: '0.85rem',
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                opacity: loading ? 0.6 : 1, padding: 0,
              }}
            >
              <FiRefreshCw size={13} /> {t('register.resendCode')}
            </button>
          </div>
        </form>

        {/* Security note */}
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
          <span>This code is valid for <strong>{t('register.minutes')}</strong>. {t('register.neverShare')}</span>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
