import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiZap, FiShield, FiStar } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const { lang, t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);
  const isGoogleInitializedRef = useRef(false);

  const { user, login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const triggerAdminSplitAndNavigate = () => {
    setIsSplitting(true);
    toast.success(t('login.welcomeBack'));
    setTimeout(() => {
      navigate('/admin');
    }, 500);
  };

  // Auto redirect Admin straight to Admin Dashboard
  useEffect(() => {
    if (user && user.role === 'ADMIN' && !isSplitting) {
      triggerAdminSplitAndNavigate();
    }
  }, [user]);

  const handleGoogleSuccess = useCallback(async (response) => {
    setGoogleLoading(true);
    try {
      const loggedUser = await loginWithGoogle(response.credential);
      if (loggedUser && (loggedUser.role === 'ADMIN' || loggedUser.email?.toLowerCase().includes('admin'))) {
        triggerAdminSplitAndNavigate();
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error("Google login failed", error);
    } finally {
      setGoogleLoading(false);
    }
  }, [loginWithGoogle, navigate]);

  useEffect(() => {
    if (isGoogleInitializedRef.current) return;

    const initGoogle = () => {
      if (window.google?.accounts?.id && !isGoogleInitializedRef.current) {
        try {
          isGoogleInitializedRef.current = true;
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "322740762669-hk69shviolgoils4f83cama37k348hsf.apps.googleusercontent.com",
            callback: (res) => handleGoogleSuccess(res),
            auto_select: false,
            cancel_on_tap_outside: true,
            use_fedcm_for_prompt: false,
          });
        } catch (err) {
          console.warn("Google Sign-In initialization warning:", err);
        }
      }
    };

    const timer = setTimeout(initGoogle, 200);
    return () => clearTimeout(timer);
  }, []);

  const [errorMessage, setErrorMessage] = useState('');
  const [errorField, setErrorField] = useState(null); // 'email' | 'password' | null

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setErrorField(null);

    if (!email || !email.trim()) {
      setErrorField('email');
      setErrorMessage(lang === 'km' ? 'សូមបញ្ចូលអ៊ីមែល' : 'Please enter your email');
      toast.error(lang === 'km' ? 'សូមបញ្ចូលអ៊ីមែល' : 'Please enter your email');
      return;
    }
    if (!password) {
      setErrorField('password');
      setErrorMessage(lang === 'km' ? 'សូមបញ្ចូលពាក្យសម្ងាត់' : 'Please enter your password');
      toast.error(lang === 'km' ? 'សូមបញ្ចូលពាក្យសម្ងាត់' : 'Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await login(email.trim(), password);
      if (loggedUser && loggedUser.role === 'ADMIN') {
        triggerAdminSplitAndNavigate();
      } else {
        navigate('/');
      }
    } catch (error) {
      const rawMsg = error.response?.data?.message || '';
      const lower = rawMsg.toLowerCase();
      if (lower.includes('email') || rawMsg.includes('អ៊ីមែល')) {
        setErrorField('email');
        setErrorMessage(lang === 'km' ? 'អ៊ីមែលមិនត្រឹមត្រូវទេ (រកមិនឃើញគណនីនេះទេ)' : 'Wrong email. No account found with this email.');
      } else if (lower.includes('password') || rawMsg.includes('ពាក្យសម្ងាត់')) {
        setErrorField('password');
        setErrorMessage(lang === 'km' ? 'ពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ សូមព្យាយាមម្តងទៀត' : 'Wrong password. Please check your password and try again.');
      } else {
        setErrorMessage(rawMsg || (lang === 'km' ? 'ការចូលគណនីបានបរាជ័យ' : 'Login failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: '100%',
      minHeight: 'calc(100vh - 120px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 16px',
      background: 'var(--bg-secondary, #F8FAFC)',
      position: 'relative'
    }}>
      <style>{`
        .login-input-icon {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          left: 15px;
          color: var(--text-lighter);
          pointer-events: none;
        }
        .login-social-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--text-lighter);
          font-size: 0.85rem;
          margin: 18px 0;
        }
        .login-social-divider::before,
        .login-social-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border, #E2E8F0);
        }
      `}</style>

      {/*  CENTERED LOGIN CARD  */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        margin: '0 auto',
        zIndex: 10,
      }}>
        <div style={{
          background: 'var(--card-bg, #ffffff)',
          borderRadius: '24px',
          padding: '36px 32px',
          boxShadow: 'var(--shadow-lg, 0 20px 50px rgba(15, 23, 42, 0.1))',
          border: '1px solid var(--border, #E2E8F0)',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, rgba(255, 71, 133, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)',
              color: 'var(--primary)',
              borderRadius: '20px',
              padding: '4px 14px',
              fontSize: '0.82rem',
              fontWeight: 800,
              marginBottom: '10px'
            }}>
              Saby Shop ហាងឌីជីថល
            </span>
            <h1 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 1.85rem)', fontWeight: 900, marginBottom: '6px', color: 'var(--text)', letterSpacing: '-0.02em' }}>
              {t('login.title')}
            </h1>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', margin: 0 }}>
              {t('login.subtitle')}
            </p>
          </div>

          {/* Form */}
          <form id="login-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Inline Error Alert */}
            {errorMessage && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#DC2626',
                padding: '12px 14px',
                borderRadius: '12px',
                fontSize: '0.88rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                animation: 'fadeIn 0.2s ease-in-out'
              }}>
                <FiShield size={18} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                {t('login.email')}
              </label>
              <div style={{ position: 'relative' }}>
                <span className="login-input-icon"><FiMail size={16} /></span>
                <input
                  id="login-email"
                  type="email"
                  className="input"
                  placeholder={t('login.emailPlaceholder')}
                  style={{
                    paddingLeft: '42px',
                    borderRadius: '12px',
                    border: errorField === 'email' ? '1.5px solid #EF4444' : undefined,
                    background: errorField === 'email' ? '#FEF2F2' : undefined
                  }}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorField === 'email') {
                      setErrorField(null);
                      setErrorMessage('');
                    }
                  }}
                  required
                  autoComplete="email"
                />
              </div>
              {errorField === 'email' && (
                <p style={{ color: '#EF4444', fontSize: '0.8rem', fontWeight: 600, margin: '4px 0 0 2px' }}>
                  {lang === 'km' ? 'រកមិនឃើញអ៊ីមែលនេះទេ' : 'Wrong email address'}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                {t('login.password')}
              </label>
              <div style={{ position: 'relative' }}>
                <span className="login-input-icon"><FiLock size={16} /></span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  placeholder={t('login.passwordPlaceholder')}
                  style={{
                    paddingLeft: '42px',
                    paddingRight: '44px',
                    borderRadius: '12px',
                    border: errorField === 'password' ? '1.5px solid #EF4444' : undefined,
                    background: errorField === 'password' ? '#FEF2F2' : undefined
                  }}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorField === 'password') {
                      setErrorField(null);
                      setErrorMessage('');
                    }
                  }}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  id="login-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', top: '50%', right: '14px',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-lighter)', display: 'flex',
                    alignItems: 'center', padding: 0,
                  }}
                  aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                >
                  {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                </button>
              </div>
              {errorField === 'password' && (
                <p style={{ color: '#EF4444', fontSize: '0.8rem', fontWeight: 600, margin: '4px 0 0 2px' }}>
                  {lang === 'km' ? 'ពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ' : 'Wrong password'}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-8px' }}>
              <Link to="/forgot-password" style={{ fontSize: '0.83rem', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
                {lang === 'km' ? 'ភ្លេចពាក្យសម្ងាត់?' : 'Forgot Password?'}
              </Link>
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '13px',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: '14px',
                marginTop: '4px',
                background: 'linear-gradient(135deg, #FF4785 0%, #8B5CF6 100%)',
                border: 'none',
                boxShadow: '0 8px 20px -4px rgba(255, 71, 133, 0.4)',
              }}
              disabled={loading || googleLoading || isSplitting}
            >
              {loading ? <LoadingSpinner /> : t('login.signIn')}
            </button>
          </form>

          {/* Divider */}
          <div className="login-social-divider">{t('login.orContinueWith')}</div>

          {/* Google Sign-In */}
          <button
            type="button"
            id="google-signin-button"
            onClick={() => {
              setGoogleLoading(true);
              const runGoogleLogin = () => {
                if (window.google?.accounts?.oauth2) {
                  try {
                    const client = window.google.accounts.oauth2.initTokenClient({
                      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "322740762669-hk69shviolgoils4f83cama37k348hsf.apps.googleusercontent.com",
                      scope: 'email profile openid',
                      callback: async (tokenResponse) => {
                        if (tokenResponse && tokenResponse.access_token) {
                          try {
                            const loggedUser = await loginWithGoogle(tokenResponse.access_token);
                            if (loggedUser && (loggedUser.role === 'ADMIN' || loggedUser.email?.toLowerCase().includes('admin'))) {
                              triggerAdminSplitAndNavigate();
                            } else {
                              navigate('/');
                            }
                          } catch (err) {
                            console.error("Google login failed", err);
                          } finally {
                            setGoogleLoading(false);
                          }
                        } else {
                          setGoogleLoading(false);
                        }
                      },
                      error_callback: () => setGoogleLoading(false)
                    });
                    client.requestAccessToken();
                  } catch (err) {
                    console.warn("Google OAuth init fallback:", err);
                    setGoogleLoading(false);
                  }
                } else if (window.google?.accounts?.id) {
                  try {
                    window.google.accounts.id.initialize({
                      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "322740762669-hk69shviolgoils4f83cama37k348hsf.apps.googleusercontent.com",
                      callback: (res) => handleGoogleSuccess(res),
                      auto_select: false,
                      cancel_on_tap_outside: true,
                      use_fedcm_for_prompt: false,
                    });
                    window.google.accounts.id.prompt();
                  } catch (_) {
                    setGoogleLoading(false);
                  }
                } else {
                  setGoogleLoading(false);
                  toast.error(lang === 'km' ? 'សូមចូលប្រើប្រាស់ជាមួយអ៊ីមែល និងពាក្យសម្ងាត់' : 'Please sign in with your email and password');
                }
              };

              if (!window.google?.accounts) {
                const script = document.createElement('script');
                script.src = 'https://accounts.google.com/gsi/client';
                script.async = true;
                script.onload = runGoogleLogin;
                script.onerror = () => {
                  setGoogleLoading(false);
                  toast.error(lang === 'km' ? 'សូមចូលប្រើប្រាស់ជាមួយអ៊ីមែល និងពាក្យសម្ងាត់' : 'Please sign in with your email and password');
                };
                document.head.appendChild(script);
              } else {
                runGoogleLogin();
              }
            }}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: '14px',
              border: '1px solid var(--border)',
              background: 'var(--card-bg)',
              color: 'var(--text)',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.2s ease',
            }}
            disabled={googleLoading || isSplitting}
          >
            {googleLoading ? <LoadingSpinner /> : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.13C3.26 21.3 7.31 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.63H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.37l3.99-3.13z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.63l3.99 3.13c.95-2.85 3.6-4.96 6.72-4.96z"/>
                </svg>
                {lang === 'km' ? 'ចូលតាម Google Account' : 'Continue with Google'}
              </>
            )}
          </button>

          {/* Register Link */}
          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.88rem', color: 'var(--text-light)' }}>
            {t('login.noAccount')}{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>
              {t('login.createFree')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
