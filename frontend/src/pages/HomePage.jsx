import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import YourRecentBuy from '../components/YourRecentBuy';
import { products } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { FiZap, FiShield, FiClock, FiCreditCard, FiArrowRight, FiDollarSign, FiStar, FiCheckCircle } from 'react-icons/fi';
import { MdStorefront } from 'react-icons/md';
import { FaTelegram } from 'react-icons/fa';

const mockProducts = [
 { id: 1, name: 'Netflix Premium 1 Month', description: 'Enjoy 4K UHD streaming with shared or private access.', price: 3.99, stockCount: 15, category: { emoji: '' } },
 { id: 2, name: 'Spotify Premium 3 Months', description: 'Ad-free music listening offline on any device.', price: 5.99, stockCount: 8, category: { emoji: '' } },
 { id: 3, name: 'Discord Nitro 1 Year', description: 'Boost your server and get custom emojis worldwide.', price: 29.99, stockCount: 0, category: { emoji: '' } },
];

const appBrands = [
 {
 name: 'YouTube',
 svg: (
 <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
 <rect width="100" height="100" rx="22" fill="#FF0000"/>
 <rect x="16" y="27" width="68" height="46" rx="14" fill="#FFFFFF"/>
 <polygon points="43,37 64,50 43,63" fill="#FF0000"/>
 </svg>
 ),
 },
 {
 name: 'CapCut',
 svg: (
 <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
 <rect width="100" height="100" rx="22" fill="#0F0F12"/>
 <g transform="translate(10, 10) scale(0.416666)" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="12" fill="none">
 <path d="M170 42 22 124v14c0 6.627 5.373 12 12 12h78c6.627 0 12-5.373 12-12v-9.5"/>
 <path d="M170 150 22 68V54c0-6.627 5.373-12 12-12h78c6.627 0 12 5.373 12 12v9.5"/>
 </g>
 </svg>
 ),
 },
 {
 name: 'ChatGPT',
 svg: (
 <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
 <rect width="100" height="100" rx="22" fill="#FFFFFF"/>
 <g fill="#000000" transform="translate(18, 17) scale(1.6)">
 <path d="M37.532 16.87a9.963 9.963 0 0 0-.856-8.184 10.078 10.078 0 0 0-10.855-4.835A9.964 9.964 0 0 0 18.306.5a10.079 10.079 0 0 0-9.614 6.977 9.967 9.967 0 0 0-6.664 4.834 10.08 10.08 0 0 0 1.24 11.817 9.965 9.965 0 0 0 .856 8.185 10.079 10.079 0 0 0 10.855 4.835 9.965 9.965 0 0 0 7.516 3.35 10.078 10.078 0 0 0 9.617-6.981 9.967 9.967 0 0 0 6.663-4.834 10.079 10.079 0 0 0-1.243-11.813zM22.498 37.886a7.474 7.474 0 0 1-4.799-1.735c.061-.033.168-.091.237-.134l7.964-4.6a1.294 1.294 0 0 0 .655-1.134V19.054l3.366 1.944a.12.12 0 0 1 .066.092v9.299a7.505 7.505 0 0 1-7.49 7.496zm-16.106-6.88a7.471 7.471 0 0 1-.894-5.023c.06.036.162.099.237.141l7.964 4.6a1.297 1.297 0 0 0 1.308 0l9.724-5.614v3.888a.12.12 0 0 1-.048.103l-8.051 4.649a7.504 7.504 0 0 1-10.24-2.744zM4.297 13.62A7.469 7.469 0 0 1 8.2 10.333c0 .068-.004.19-.004.274v9.201a1.294 1.294 0 0 0 .654 1.132l9.723 5.614-3.366 1.944a.12.12 0 0 1-.114.01L7.04 23.856a7.504 7.504 0 0 1-2.743-10.237zm27.658 6.437l-9.724-5.615 3.367-1.943a.121.121 0 0 1 .113-.01l8.052 4.648a7.498 7.498 0 0 1-1.158 13.528v-9.476a1.293 1.293 0 0 0-.65-1.132zm3.35-5.043a7.395 7.395 0 0 0-.236-.141l-7.965-4.6a1.298 1.298 0 0 0-1.308 0l-9.723 5.614v-3.888a.12.12 0 0 1 .048-.103l8.05-4.645a7.497 7.497 0 0 1 11.135 7.763zm-21.063 6.929l-3.367-1.944a.12.12 0 0 1-.065-.092v-9.299a7.497 7.497 0 0 1 12.293-5.756 6.94 6.94 0 0 0-.236.134l-7.965 4.6a1.294 1.294 0 0 0-.654 1.132l-.006 11.225zM16.071 18l4.33-2.501 4.332 2.5v5l-4.331 2.5-4.331-2.5V18z"/>
 </g>
 </svg>
 ),
 },
 {
 name: 'Gemini',
 svg: (
 <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
 <defs>
 <linearGradient id="geminiRichStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
 <stop offset="0%" stopColor="#FF3366" />
 <stop offset="25%" stopColor="#FF9900" />
 <stop offset="50%" stopColor="#00E676" />
 <stop offset="75%" stopColor="#2979FF" />
 <stop offset="100%" stopColor="#651FFF" />
 </linearGradient>
 </defs>
 <rect width="100" height="100" rx="22" fill="#FFFFFF"/>
 <path d="M 50 14 C 50 33 60 43 78 50 C 60 57 50 67 50 86 C 50 67 40 57 22 50 C 40 43 50 33 50 14 Z" fill="url(#geminiRichStarGrad)"/>
 </svg>
 ),
 },
 {
 name: 'Claude AI',
 svg: (
 <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
 <rect width="100" height="100" rx="22" fill="#D96B43"/>
 <g fill="#FFFFFF" transform="translate(50, 50) scale(0.95)">
 {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
 const length = [32, 25, 33, 27, 34, 26, 33, 27, 32, 25, 34, 26][i];
 const width = [6.5, 5.5, 7, 6, 6.5, 5.5, 7, 6, 6.5, 5.5, 7, 6][i];
 return (
 <rect
 key={angle}
 x={-width / 2}
 y={-length}
 width={width}
 height={length}
 rx={width / 2}
 transform={`rotate(${angle})`}
 />
 );
 })}
 <circle r="11" fill="#FFFFFF" />
 </g>
 </svg>
 ),
 },
 {
 name: 'Spotify',
 svg: (
 <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
 <rect width="100" height="100" rx="22" fill="#1DB954"/>
 <path d="M 50 16 C 31.2 16 16 31.2 16 50 C 16 68.8 31.2 84 50 84 C 68.8 84 84 68.8 84 50 C 84 31.2 68.8 16 50 16 Z M 65.5 65.2 C 64.8 66.3 63.4 66.7 62.3 66 C 54.3 61.1 44.2 60 32.4 62.7 C 31.1 63 29.8 62.1 29.5 60.8 C 29.2 59.5 30.1 58.2 31.4 57.9 C 44.4 54.9 55.6 56.2 64.7 61.8 C 65.8 62.4 66.1 63.9 65.5 65.2 Z M 69.5 56.5 C 68.6 57.9 66.7 58.4 65.3 57.5 C 55.7 51.6 41.2 49.9 30.1 53.3 C 28.5 53.8 26.8 52.9 26.3 51.3 C 25.8 49.7 26.7 48 28.3 47.5 C 41.1 43.6 57.1 45.5 68 52.2 C 69.4 53 69.9 54.9 69.5 56.5 Z M 70 47.4 C 59.8 41.3 42.1 40.7 32 43.8 C 30.2 44.3 28.3 43.3 27.8 41.5 C 27.3 39.7 28.3 37.8 30.1 37.3 C 41.7 33.8 61.3 34.5 73.1 41.5 C 74.7 42.4 75.3 44.5 74.3 46.1 C 73.4 47.8 71.3 48.3 70 47.4 Z" fill="white"/>
 </svg>
 ),
 },
 {
 name: 'Canva',
 svg: (
 <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
 <defs>
 <linearGradient id="canvaOfficialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
 <stop offset="0%" stopColor="#00C4CC" />
 <stop offset="40%" stopColor="#00B4D8" />
 <stop offset="80%" stopColor="#7D2AE8" />
 <stop offset="100%" stopColor="#6B21A8" />
 </linearGradient>
 </defs>
 <rect width="100" height="100" rx="22" fill="url(#canvaOfficialGrad)"/>
 <text
 x="50"
 y="63"
 textAnchor="middle"
 fontSize="35"
 fontWeight="700"
 fill="#FFFFFF"
 fontFamily="'Dancing Script', 'Brush Script MT', 'Caveat', 'Pacifico', cursive"
 style={{ letterSpacing: '-0.02em', fontStyle: 'italic' }}
 >
 Canva
 </text>
 </svg>
 ),
 },
 {
 name: 'Netflix',
 svg: (
 <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
 <defs>
 <linearGradient id="netflixRibbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
 <stop offset="0%" stopColor="#E50914"/>
 <stop offset="100%" stopColor="#990000"/>
 </linearGradient>
 </defs>
 <rect width="100" height="100" rx="22" fill="#000000"/>
 <g transform="translate(18, 16) scale(0.68)">
 <path fill="#B81D24" d="M0 0h24v95H0z"/>
 <path fill="#B81D24" d="M70 0h24v95H70z"/>
 <path fill="url(#netflixRibbonGrad)" d="M0 0l70 95h24L24 0H0z"/>
 </g>
 </svg>
 ),
 },
 {
 name: 'Apple Music',
 svg: (
 <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
 <defs>
 <linearGradient id="appleMusicGrad" x1="0%" y1="0%" x2="0%" y2="100%">
 <stop offset="0%" stopColor="#FF4E69"/>
 <stop offset="50%" stopColor="#FA233B"/>
 <stop offset="100%" stopColor="#E6002A"/>
 </linearGradient>
 </defs>
 <rect width="100" height="100" rx="22" fill="url(#appleMusicGrad)"/>
 <g transform="translate(6, 4) scale(0.88)">
 <path
 fill="white"
 d="M71.5 16.5 L36.2 24.1 C34.2 24.5 32.8 26.3 32.8 28.4 V66.8 C30.6 65.4 27.6 64.6 24.3 64.6 C16.4 64.6 10 69.9 10 76.4 C10 82.9 16.4 88.2 24.3 88.2 C31.9 88.2 38.1 83.1 38.4 76.8 V39.2 L68.4 32.7 V56.1 C66.2 54.7 63.2 53.9 59.9 53.9 C52 53.9 45.6 59.2 45.6 65.7 C45.6 72.2 52 77.5 59.9 77.5 C67.5 77.5 73.7 72.4 74 66.1 V20.1 C74 17.9 72.7 16.2 71.5 16.5 Z M 38.4 34.3 V29.0 L 68.4 22.6 V27.9 Z"
 />
 </g>
 </svg>
 ),
 },
];
const AppIcon = ({ app }) => (
 <div className="brand-app-icon">
 <div style={{
 width: '46px',
 height: '46px',
 borderRadius: '12px',
 boxShadow: '0 6px 16px -3px rgba(15, 23, 42, 0.1), 0 2px 6px -2px rgba(15, 23, 42, 0.05)',
 overflow: 'hidden',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 border: '1px solid rgba(226, 232, 240, 0.8)',
 background: '#FFFFFF',
 transition: 'box-shadow 0.3s ease',
 }}>
 {app.svg}
 </div>
 <span style={{
 fontSize: '0.7rem',
 fontWeight: 700,
 color: 'var(--text)',
 whiteSpace: 'nowrap',
 letterSpacing: '-0.01em',
 }}>{app.name}</span>
 </div>
);

const TypewriterTitle = () => {
 const { t } = useLanguage();
 const fullText = t('home.heroTitle');
 const sabyIndex = fullText.indexOf('SABY SHOP');
 const breakIndex = sabyIndex !== -1 ? sabyIndex : Math.floor(fullText.length * 0.5);
 const [displayText, setDisplayText] = useState('');
 const [isDeleting, setIsDeleting] = useState(false);

 useEffect(() => {
 let timer;
 const currentLen = displayText.length;

 if (!isDeleting && currentLen < fullText.length) {
 timer = setTimeout(() => {
 setDisplayText(fullText.slice(0, currentLen + 1));
 }, 55);
 } else if (!isDeleting && currentLen === fullText.length) {
 timer = setTimeout(() => {
 setIsDeleting(true);
 }, 4000);
 } else if (isDeleting && currentLen > 0) {
 timer = setTimeout(() => {
 setDisplayText(fullText.slice(0, currentLen - 1));
 }, 25);
 } else if (isDeleting && currentLen === 0) {
 timer = setTimeout(() => {
 setIsDeleting(false);
 }, 600);
 }

 return () => clearTimeout(timer);
 }, [displayText, isDeleting, fullText]);

 const mainPart = displayText.slice(0, Math.min(displayText.length, breakIndex));
 const gradientPart = displayText.length > breakIndex ? displayText.slice(breakIndex) : '';

 return (
 <h1 className="animate-slide-up" style={{
 fontSize: 'clamp(1.7rem, 4vw + 0.5rem, 3.2rem)',
 fontWeight: 800,
 color: 'var(--text)',
 marginBottom: '16px',
 lineHeight: 1.18,
 maxWidth: '850px',
 margin: '0 auto 16px',
 minHeight: '2.2em'
 }}>
 {mainPart}
 {gradientPart && (
 <span style={{
 background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
 WebkitBackgroundClip: 'text',
 WebkitTextFillColor: 'transparent'
 }}>
 {gradientPart}
 </span>
 )}
 <span className="typewriter-cursor" />
 </h1>
 );
};

const HomePage = () => {
 const { t } = useLanguage();
 const { user } = useAuth();
 const isSeller = user?.role === 'SELLER';
 const [featuredProducts, setFeaturedProducts] = useState([]);
 const [loading, setLoading] = useState(true);
 const [ctaVisible, setCtaVisible] = useState(false);
 const ctaRef = useRef(null);

 const marqueeRow1 = useMemo(() => {
 return [...appBrands, ...appBrands, ...appBrands, ...appBrands, ...appBrands, ...appBrands].map((app, idx) => (
 <AppIcon key={`r1-${idx}`} app={app} />
 ));
 }, []);

 const marqueeRow2 = useMemo(() => {
 return [...appBrands, ...appBrands, ...appBrands, ...appBrands, ...appBrands, ...appBrands].reverse().map((app, idx) => (
 <AppIcon key={`r2-${idx}`} app={app} />
 ));
 }, []);

 useEffect(() => {
 const observer = new IntersectionObserver(
 ([entry]) => {
 setCtaVisible(entry.isIntersecting);
 },
 { threshold: 0.15 }
 );

 if (ctaRef.current) {
 observer.observe(ctaRef.current);
 }

 return () => observer.disconnect();
 }, []);

 useEffect(() => {
 const controller = new AbortController();
 const fetchProducts = async () => {
 try {
 const res = await products.getAll({ limit: 6 }, { signal: controller.signal });
 const rawData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
 const sortedNewest = [...rawData].sort((a, b) => {
   return (b.id || 0) - (a.id || 0);
 });
 setFeaturedProducts(sortedNewest);
 } catch (error) {
 if (error.name !== 'CanceledError' && error.message !== 'canceled') {
 console.error('Failed to fetch products', error);
 setFeaturedProducts([]);
 }
 } finally {
 if (!controller.signal.aborted) {
 setLoading(false);
 }
 }
 };
 fetchProducts();
 return () => controller.abort();
 }, []);

 return (
 <div style={{ backgroundImage: "linear-gradient(to bottom, rgba(255,255,255,0.8), rgba(255,200,200,0.2)), url(/assets/hero.png)", backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center bottom', minHeight: '100vh' }}>
 {/* Hero Section */}
 <section style={{
 background: 'linear-gradient(180deg, var(--primary-light) 0%, rgba(255, 255, 255, 0) 100%)',
 padding: '48px 0 20px',
 position: 'relative',
 overflow: 'hidden'
 }}>
 <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
 {/* Heading with Typewriter Effect */}
 <TypewriterTitle />

 {/* Subtitle Marquee Loop (Compact Centered Width) */}
 <div className="animate-slide-up" style={{
 position: 'relative',
 overflow: 'hidden',
 maxWidth: '800px',
 margin: '0 auto 18px',
 display: 'flex',
 flexDirection: 'column',
 gap: '4px'
 }}>
 {/* Fade Edge Masks */}
 <div style={{
 position: 'absolute', left: 0, top: 0, bottom: 0, width: '100px',
 background: 'linear-gradient(to right, var(--bg, #FFFFFF), transparent)',
 zIndex: 2, pointerEvents: 'none'
 }} />
 <div style={{
 position: 'absolute', right: 0, top: 0, bottom: 0, width: '100px',
 background: 'linear-gradient(to left, var(--bg, #FFFFFF), transparent)',
 zIndex: 2, pointerEvents: 'none'
 }} />

 {/* Line 1 - Scroll Left */}
 <div className="text-marquee-track" style={{ animation: 'textMarqueeLeft 52s linear infinite' }}>
 {[1, 2, 3, 4, 5, 6].map((item) => (
 <span key={`l1-${item}`} style={{
 fontSize: 'clamp(0.75rem, 1.1vw, 0.88rem)',
 color: 'var(--text-light)',
 fontWeight: 600,
 display: 'inline-flex',
 alignItems: 'center',
 gap: '8px',
 paddingRight: '20px',
 whiteSpace: 'nowrap',
 flexShrink: 0
 }}>
 {t('home.heroSubtitle1')}
 <span style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'inline-block', opacity: 0.6, flexShrink: 0 }} />
 </span>
 ))}
 </div>

 {/* Line 2 - Scroll Right */}
 <div className="text-marquee-track" style={{ animation: 'textMarqueeRight 48s linear infinite' }}>
 {[1, 2, 3, 4, 5, 6].map((item) => (
 <span key={`l2-${item}`} style={{
 fontSize: 'clamp(0.72rem, 1vw, 0.82rem)',
 color: 'var(--text-lighter)',
 fontWeight: 500,
 display: 'inline-flex',
 alignItems: 'center',
 gap: '8px',
 paddingRight: '20px',
 whiteSpace: 'nowrap',
 flexShrink: 0
 }}>
 {t('home.heroSubtitle2')}
 <span style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: 'var(--secondary)', display: 'inline-block', opacity: 0.6, flexShrink: 0 }} />
 </span>
 ))}
 </div>
 </div>

 {/* Brand Marquee Carousel (Full-Width Edge to Edge) */}
 <div 
 className="marquee-container"
 style={{
 width: '100vw',
 position: 'relative',
 left: '50%',
 right: '50%',
 marginLeft: '-50vw',
 marginRight: '-50vw',
 marginTop: '12px',
 marginBottom: '24px',
 padding: '8px 0',
 display: 'flex',
 flexDirection: 'column',
 gap: '10px',
 }}
 >
 {/* Fade edge masks */}
 <div style={{
 position: 'absolute', left: 0, top: 0, bottom: 0, width: '100px',
 background: 'linear-gradient(to right, var(--bg, #FFFFFF), transparent)',
 zIndex: 2, pointerEvents: 'none'
 }} />
 <div style={{
 position: 'absolute', right: 0, top: 0, bottom: 0, width: '100px',
 background: 'linear-gradient(to left, var(--bg, #FFFFFF), transparent)',
 zIndex: 2, pointerEvents: 'none'
 }} />

 {/* Row 1 - Left Marquee (100% Seamless Gapless Infinite Loop) */}
 <div style={{ overflow: 'hidden' }}>
 <div className="marquee-track marquee-left">
 {marqueeRow1}
 </div>
 </div>

 {/* Row 2 - Right Marquee (100% Seamless Gapless Infinite Loop) */}
 <div style={{ overflow: 'hidden' }}>
 <div className="marquee-track marquee-right">
 {marqueeRow2}
 </div>
 </div>
 </div>

 {/* Action CTAs */}
 <div 
 ref={ctaRef}
 style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px', minHeight: '52px' }}
 >
 <Link 
 to="/store" 
 className={`btn hero-btn-explore ${ctaVisible ? 'is-visible' : ''}`}
 style={{
 background: 'linear-gradient(135deg, #FF4B8B 0%, #FF2B6D 100%)',
 color: '#ffffff',
 borderRadius: '14px',
 padding: '13px 28px',
 fontSize: '0.95rem',
 fontWeight: 800,
 border: 'none',
 boxShadow: '0 6px 20px rgba(255, 43, 109, 0.35)',
 display: 'inline-flex',
 alignItems: 'center',
 gap: '8px',
 transition: 'all 0.25s ease',
 letterSpacing: '0.2px'
 }}
 >
 {t('home.exploreStore')} <FiArrowRight size={18} />
 </Link>

 <Link 
 to="/about" 
 className={`btn hero-btn-learn ${ctaVisible ? 'is-visible' : ''}`}
 style={{
 background: '#ffffff',
 color: 'var(--text, #0F172A)',
 border: '1.5px solid var(--border-light, #E2E8F0)',
 borderRadius: '14px',
 padding: '13px 28px',
 fontSize: '0.95rem',
 fontWeight: 800,
 display: 'inline-flex',
 alignItems: 'center',
 gap: '8px',
 transition: 'all 0.25s ease',
 letterSpacing: '0.2px',
 boxShadow: '0 4px 14px rgba(0,0,0,0.05)'
 }}
 >
 {t('home.learnHow')}
 </Link>
 </div>

 <style>{`
 .text-marquee-track {
 display: flex;
 width: max-content;
 white-space: nowrap;
 will-change: transform;
 }
 .text-marquee-track:hover,
 .text-marquee-track:active {
 animation-play-state: paused !important;
 }
 @keyframes textMarqueeLeft {
 0% { transform: translateX(0); }
 100% { transform: translateX(-50%); }
 }
 @keyframes textMarqueeRight {
 0% { transform: translateX(-50%); }
 100% { transform: translateX(0); }
 }

 .marquee-track {
 display: flex;
 width: max-content;
 will-change: transform;
 }
 .marquee-left {
 animation: marqueeLeft 75s linear infinite;
 }
 .marquee-right {
 animation: marqueeRight 65s linear infinite;
 }

 /* Pause ONLY the specific marquee row being hovered or touched */
 .marquee-track:hover,
 .marquee-track:active {
 animation-play-state: paused !important;
 }

 @keyframes marqueeLeft {
 0% { transform: translateX(0); }
 100% { transform: translateX(-33.333%); }
 }
 @keyframes marqueeRight {
 0% { transform: translateX(-33.333%); }
 100% { transform: translateX(0); }
 }
 `}</style>
 </div>
 </section>

 {/* Featured Products Showcase */}
 <section style={{ backgroundColor: '#ffffff', padding: '24px 0 36px', borderTop: '1px solid var(--border-light)' }}>
 <div className="container">
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
 <div>
 <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0', color: 'var(--text)' }}>
 {t('home.featuredProducts')}
 </h2>
 </div>
 <Link to="/store" className="btn btn-outline btn-sm" style={{ gap: '6px', padding: '6px 14px', fontSize: '0.8rem' }}>
 {t('home.viewAllProducts')} <FiArrowRight />
 </Link>
 </div>

 {loading ? (
 <LoadingSpinner />
 ) : (
 <div className="grid grid-3">
 {featuredProducts.map(product => (
 <ProductCard key={product.id} product={product} />
 ))}
 </div>
 )}

 <div style={{ textAlign: 'center', marginTop: '48px' }}>
 <Link 
 to="/store" 
 className="btn" 
 style={{ 
 gap: '8px', 
 padding: '13px 32px',
 borderRadius: '12px',
 background: 'linear-gradient(135deg, #FF4B8B 0%, #FF2B6D 100%)',
 color: '#ffffff',
 fontWeight: 800,
 fontSize: '0.95rem',
 boxShadow: '0 6px 20px rgba(255, 43, 109, 0.35)',
 border: 'none',
 display: 'inline-flex',
 alignItems: 'center'
 }}
 >
 {t('home.exploreFullCatalog')} <FiArrowRight />
 </Link>
 </div>
 </div>
 </section>

 {/* Customer Reviews & Seller Ratings Showcase Section */}
 <section style={{ backgroundColor: '#F8FAFC', padding: '50px 0', borderTop: '1px solid var(--border-light)' }}>
 <div className="container">
 <div style={{ textAlign: 'center', marginBottom: '36px' }}>
 <div style={{
 display: 'inline-flex', alignItems: 'center', gap: '6px',
 background: 'rgba(245,158,11,0.12)', color: '#D97706',
 padding: '6px 16px', borderRadius: '20px', fontSize: '0.82rem',
 fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px'
 }}>
 <FiStar size={14} color="#D97706" fill="#D97706" /> Verified Customer Reviews
 </div>
 <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.1rem)', fontWeight: 900, margin: '0 0 10px', color: 'var(--text)' }}>
 Trusted by 10,000+ Buyers & Verified Sellers
 </h2>
 <p style={{ color: 'var(--text-light)', fontSize: '0.95rem', maxWidth: '600px', margin: '0 auto' }}>
 Real reviews from real purchases. Buyers rate products 1 to 5 stars upon order completion.
 </p>
 </div>

 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
 {[
 {
 name: 'Vannak S.',
 rating: 5,
 comment: 'Instant delivery in 5 seconds! The YouTube Premium key works flawlessly. Highly recommend seller TechKeys Store!',
 product: 'YouTube Premium 1 Year',
 store: 'TechKeys Store',
 date: '2 hours ago'
 },
 {
 name: 'Chanthou K.',
 rating: 5,
 comment: 'Super fast delivery and smooth checkout via KHQR. Seller account features on this store are amazing!',
 product: 'ChatGPT Plus Account',
 store: 'AI Digital Vault',
 date: '5 hours ago'
 },
 {
 name: 'Dara M.',
 rating: 5,
 comment: 'Great customer support! Order was completed immediately and account credentials worked 100%.',
 product: 'Canva Pro 1 Year',
 store: 'Saby Digital',
 date: 'Yesterday'
 }
 ].map((rev, i) => (
 <div key={i} style={{
 background: '#ffffff', borderRadius: '18px', padding: '24px',
 border: '1px solid var(--border-light)',
 boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
 display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
 }}>
 <div>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
 <div style={{ color: '#f59e0b', fontSize: '1rem', letterSpacing: '2px', display: 'flex', gap: '2px' }}>
 {Array.from({ length: rev.rating }).map((_, i) => <FiStar key={i} size={14} fill="#f59e0b" />)}
 </div>
 <span style={{ fontSize: '0.75rem', color: 'var(--text-lighter)', fontWeight: 600 }}>{rev.date}</span>
 </div>
 <p style={{ color: 'var(--text)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 16px', fontWeight: 500 }}>
 "{rev.comment}"
 </p>
 </div>
 <div style={{ borderTop: '1px dashed var(--border-light)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
 <div>
 <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text)' }}>{rev.name}</div>
 <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
 <FiCheckCircle size={12} color="#10b981" /> Verified Buyer
 </div>
 </div>
 <div style={{ textAlign: 'right' }}>
 <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)' }}>{rev.store}</div>
 <div style={{ fontSize: '0.72rem', color: 'var(--text-lighter)' }}>{rev.product}</div>
 </div>
 </div>
 </div>
 ))}
 </div>

 <div style={{ textAlign: 'center' }}>
 <Link to="/seller/onboard" style={{
 display: 'inline-flex', alignItems: 'center', gap: '8px',
 background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)',
 color: '#ffffff', fontWeight: 800, fontSize: '0.9rem',
 padding: '12px 24px', borderRadius: '12px', textDecoration: 'none',
 boxShadow: '0 4px 14px rgba(99,102,241,0.3)'
 }}>
 Become a Seller & Start Earning (1st Month Free) <FiArrowRight />
 </Link>
 </div>
 </div>
 </section>

 {/* Your Recent Buy Section - Placed right above Official Telegram Channel */}
 <section style={{ padding: '40px 0 20px', borderTop: '1px solid var(--border-light)', background: 'var(--bg-secondary)' }}>
 <div className="container">
 <YourRecentBuy limit={4} />
 </div>
 </section>

 {/*  Official Telegram Channel Join & News Updates Section (Ultra Clean UI)  */}
 <section style={{ padding: '70px 0', background: 'radial-gradient(ellipse at 50% 0%, #0F172A 0%, #070B17 100%)', color: '#FFFFFF', position: 'relative', overflow: 'hidden' }}>
 {/* Soft background glow */}
 <div style={{
 position: 'absolute',
 top: '50%',
 left: '50%',
 transform: 'translate(-50%, -50%)',
 width: '500px',
 height: '250px',
 background: 'radial-gradient(ellipse, rgba(0, 136, 204, 0.18) 0%, rgba(139, 92, 246, 0.12) 50%, transparent 70%)',
 filter: 'blur(60px)',
 pointerEvents: 'none',
 zIndex: 1
 }} />

 <div className="container" style={{ position: 'relative', zIndex: 2 }}>
 <div className="telegram-banner-card">
 <div className="telegram-banner-content">
 <div style={{
 display: 'inline-flex',
 alignItems: 'center',
 gap: '8px',
 background: 'rgba(0, 136, 204, 0.15)',
 border: '1px solid rgba(56, 189, 248, 0.3)',
 color: '#38BDF8',
 padding: '5px 14px',
 borderRadius: '9999px',
 fontSize: '0.82rem',
 fontWeight: 700,
 letterSpacing: '0.02em',
 marginBottom: '16px'
 }}>
 <FaTelegram size={15} color="#38BDF8" /> {t('home.joinTelegramPill')}
 </div>

 <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.3rem)', fontWeight: 800, margin: '0 0 12px 0', color: '#F8FAFC', letterSpacing: '-0.02em' }}>
 {t('home.joinTelegramTitle')}
 </h2>

 <p style={{ fontSize: '1rem', color: '#94A3B8', margin: 0, lineHeight: 1.65, maxWidth: '640px' }}>
 {t('home.joinTelegramDesc')} <span style={{ color: '#38BDF8', fontWeight: 700 }}>@saby_shop_ceo</span>.
 </p>
 </div>

 <div className="telegram-banner-action">
 <a
 href="https://t.me/saby_shop_ceo"
 target="_blank"
 rel="noopener noreferrer"
 className="btn telegram-join-btn"
 >
 <FaTelegram size={20} /> {t('home.joinChannel')}
 </a>
 </div>
 </div>
 </div>
 </section>
 </div>
 );
};

export default HomePage;

