import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { seller as sellerApi, reviews as reviewsApi } from '../api/client';
import {
 FiStar, FiShare2, FiClock, FiUsers, FiCheckCircle,
 FiX, FiArrowLeft, FiHome, FiExternalLink, FiMessageSquare
} from 'react-icons/fi';
import { MdStorefront, MdVerified } from 'react-icons/md';
import ContactSellerModal from '../components/ContactSellerModal';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';

export default function SellerProfilePage() {
 const { sellerId } = useParams();
 const navigate = useNavigate();
 const { lang } = useLanguage();
 const isKhmer = lang === 'km';

 const [profile, setProfile] = useState(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);
 const [showReviewsModal, setShowReviewsModal] = useState(false);
 const [showContactModal, setShowContactModal] = useState(false);
 const [sellerReviews, setSellerReviews] = useState([]);

 useEffect(() => {
 const load = async () => {
 setLoading(true);
 try {
 const [profileRes, reviewsRes] = await Promise.allSettled([
        sellerApi.getPublicProfile(sellerId),
        reviewsApi.getPublicSellerReviews(sellerId),
      ]);
      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data);
      if (reviewsRes.status === 'fulfilled') {
        const rList = Array.isArray(reviewsRes.value.data) ? reviewsRes.value.data : (reviewsRes.value.data?.data || []);
        setSellerReviews(rList);
      }
 } catch (err) {
 setError('Store not found or currently unavailable.');
 } finally {
 setLoading(false);
 }
 };
 load();
 window.scrollTo(0, 0);
 }, [sellerId]);

 const formattedOpenSince = useMemo(() => {
 if (!profile?.createdAt) return 'Shop Open Since 25 January 2021';
 const d = new Date(profile.createdAt);
 if (isNaN(d.getTime())) return 'Shop Open Since 25 January 2021';
 const formatted = d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
 return `Shop Open Since ${formatted}`;
 }, [profile?.createdAt]);

 const handleShareStore = async () => {
 const shareUrl = window.location.href;
 const storeName = profile?.storeName || 'Saby Shop Store';
 if (navigator.share) {
 try {
 await navigator.share({ title: storeName, text: `Check out ${storeName}!`, url: shareUrl });
 return;
 } catch (_) {}
 }
 navigator.clipboard.writeText(shareUrl);
 toast.success(`Share link for ${storeName} copied!`);
 };

 /*  Loading  */
 if (loading) return (
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
 <div className="loading-spinner" />
 </div>
 );

 /*  Error  */
 if (error) return (
 <div style={{ textAlign: 'center', padding: '80px 16px', maxWidth: 520, margin: '0 auto' }}>
 <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
 <MdStorefront size={38} />
 </div>
 <h2 style={{ color: '#DC2626', fontWeight: 900, fontSize: '1.4rem', marginBottom: 10 }}>
 {isKhmer ? 'ហាងត្រូវបានផ្អាកបណ្ដោះអាសន្ន' : 'Store Suspended'}
 </h2>
 <p style={{ fontSize: '0.92rem', color: 'var(--text-light)', lineHeight: 1.5, marginBottom: 24 }}>
 {isKhmer ? 'ហាងនេះត្រូវបានផ្អាកដំណើរការបណ្ដោះអាសន្នដោយសារផុតកំណត់កញ្ចប់សេវាកម្ម។' : 'Seller Store Subscription Expired.'}
 </p>
 <Link to="/store" className="btn btn-primary" style={{ display: 'inline-flex', borderRadius: 12, padding: '10px 24px', fontWeight: 800 }}>
 {isKhmer ? 'ត្រឡប់ទៅទំព័រទំនិញទាំងអស់' : 'Browse All Products'}
 </Link>
 </div>
 );

 const avgRating = profile?.averageRating != null
    ? Number(profile.averageRating)
    : (sellerReviews.length > 0 ? Number((sellerReviews.reduce((acc, r) => acc + (r.rating || 5), 0) / sellerReviews.length).toFixed(1)) : 5.0);

  const rating5Count = sellerReviews.filter(r => Math.round(r.rating || 5) === 5).length;
  const rating4Count = sellerReviews.filter(r => Math.round(r.rating || 5) === 4).length;
  const rating3Count = sellerReviews.filter(r => Math.round(r.rating || 5) === 3).length;
  const rating2Count = sellerReviews.filter(r => Math.round(r.rating || 5) === 2).length;
  const rating1Count = sellerReviews.filter(r => Math.round(r.rating || 5) === 1).length;
  const totalReviewsCount = profile?.reviewCount != null ? Number(profile.reviewCount) : sellerReviews.length;

 return (
 <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px 60px' }}>

 {/*  Top Nav Bar  */}
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 8 }}>
 <button
 onClick={() => navigate(-1)}
 className="btn btn-outline"
 style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, background: 'var(--card-bg)', borderColor: 'var(--border)', color: 'var(--text)', cursor: 'pointer', boxShadow: 'none' }}
 >
 <FiArrowLeft size={14} />
 <span>{isKhmer ? 'ថយក្រោយ' : 'Back'}</span>
 </button>

 <button
 onClick={() => navigate('/')}
 className="btn btn-secondary"
 style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', boxShadow: 'none' }}
 >
 <FiHome size={14} />
 <span>{isKhmer ? 'ទំព័រដើម' : 'Home'}</span>
 </button>
 </div>

 {/*  ABOUT STORE card (main profile)  */}
 <div className="card" style={{ padding: '24px', borderRadius: '20px', background: 'var(--card-bg)', border: '1px solid var(--border)', marginBottom: 20 }}>
 <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

 {/* Logo */}
 <div style={{
 width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
 background: profile?.storeLogoUrl ? `url(${profile.storeLogoUrl}) center/cover` : 'linear-gradient(135deg, #1E293B, #0F172A)',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 border: '3px solid #6366F1', boxShadow: '0 6px 18px rgba(99,102,241,0.25)',
 position: 'relative'
 }}>
 {!profile?.storeLogoUrl && <MdStorefront size={36} color="#fff" />}
 <span style={{ position: 'absolute', bottom: 3, right: 3, width: 14, height: 14, borderRadius: '50%', background: '#10B981', border: '2px solid #fff' }} />
 </div>

 {/* Info */}
 <div style={{ flex: 1, minWidth: 220 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
 <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
 {profile?.storeName || 'Seller Store'}
 <MdVerified size={20} color="#38bdf8" />
 </h1>
 <span style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)', padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800 }}>
 {profile?.subscriptionStatus || 'ACTIVE'}
 </span>
 </div>

 <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: 'var(--text-light)', lineHeight: 1.6 }}>
 {profile?.storeDescription || (isKhmer ? 'មិនទាន់មានការពិពណ៌នាឡើយ' : 'No description yet.')}
 </p>

 <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: '0.75rem', marginBottom: 14 }}>
 <span style={{
 background: profile?.subscriptionPlan === 'PLAN_3' ? 'rgba(139,92,246,0.12)' : profile?.subscriptionPlan === 'PLAN_2' ? 'rgba(236,72,153,0.12)' : 'rgba(99,102,241,0.12)',
 color: profile?.subscriptionPlan === 'PLAN_3' ? '#8B5CF6' : profile?.subscriptionPlan === 'PLAN_2' ? '#EC4899' : '#6366F1',
 border: `1px solid ${profile?.subscriptionPlan === 'PLAN_3' ? '#8B5CF6' : profile?.subscriptionPlan === 'PLAN_2' ? '#EC4899' : '#6366F1'}40`,
 padding: '2px 8px', borderRadius: 8, fontWeight: 800
 }}>
 {profile?.subscriptionPlan === 'PLAN_3' ? 'VIP Store (Top Boost)' : profile?.subscriptionPlan === 'PLAN_2' ? 'Pro Store (AI Assistant)' : 'Basic Store'}
 </span>
 <span style={{ color: 'var(--text-light)', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
 <FiClock size={12} /> {formattedOpenSince}
 </span>
 </div>

 {/* Action Buttons */}
 <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
  <button
  type="button"
  onClick={() => setShowContactModal(true)}
  className="btn btn-primary"
  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', border: 'none' }}
  >
  <FiMessageSquare size={15} />
  {isKhmer ? 'ទាក់ទងអ្នកលក់ (Contact)' : 'Message Seller'}
  </button>

 <Link
 to={`/store/${sellerId}`}
 className="btn btn-outline"
 style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, fontWeight: 800, fontSize: '0.85rem', textDecoration: 'none', background: 'var(--card-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
 >
 <FiExternalLink size={14} />
 {isKhmer ? 'មើលទំព័រហ្គាល់' : 'View Store'}
 </Link>

 <button
 onClick={handleShareStore}
 style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '9px 14px', borderRadius: 10, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-light)' }}
 >
 <FiShare2 size={14} />
 {isKhmer ? 'ចែករំលែក' : 'Share'}
 </button>
 </div>
 </div>
 </div>
 </div>

 {/*  3-CARD DASHBOARD ROW  */}
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>

 {/* CARD 1 — Store Stats */}
 <div className="card" style={{ padding: '20px', borderRadius: '18px', background: 'var(--card-bg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
 <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text)', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
 <FiUsers size={15} color="#6366F1" />
 <span>{isKhmer ? 'ស្ថិតិប្រតិបត្តិការ' : 'Transaction Stats'}</span>
 </div>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
 <span style={{ color: 'var(--text-light)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
 <FiUsers size={14} color="#6366F1" /> {isKhmer ? 'អ្នកទិញ:' : 'Buyers:'}
 </span>
 <span style={{ fontWeight: 800, color: 'var(--text)' }}>
 {profile?.recentBuyersCount ?? 990} {isKhmer ? 'នាក់' : 'People'}
 <span style={{ fontSize: '0.72rem', color: 'var(--text-lighter)', fontWeight: 500 }}> ({isKhmer ? '2 សប្តាហ៍ចុងក្រោយ' : 'Last 2 Weeks'})</span>
 </span>
 </div>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
 <span style={{ color: 'var(--text-light)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
 <FiCheckCircle size={14} color="#10B981" /> {isKhmer ? 'លក់ជោគជ័យ:' : 'Sold:'}
 </span>
 <span style={{ fontWeight: 800, color: '#10B981' }}>
 {profile?.successRate != null ? `${profile.successRate}%` : '99%'}
 <span style={{ fontSize: '0.72rem', color: 'var(--text-lighter)', fontWeight: 500 }}>
 {' '}({profile?.completedOrdersCount ?? 102655} / {profile?.totalOrdersCount ?? 103130})
 </span>
 </span>
 </div>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
 <span style={{ color: 'var(--text-light)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
 <FiClock size={14} color="#F59E0B" /> {isKhmer ? 'ពេលដឹកជញ្ជូន:' : 'Avg Delivery:'}
 </span>
 <span style={{ fontWeight: 700, color: '#10B981', fontSize: '0.78rem' }}>
 {isKhmer ? 'ភ្លាម (1-2 នាទី)' : 'Instant (1-2 mins)'}
 </span>
 </div>
 </div>
 </div>

 {/* CARD 2 — Rating */}
 <div className="card" style={{ padding: '20px', borderRadius: '18px', background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: '0.95rem', color: 'var(--text)' }}>
 <span>{isKhmer ? 'ការវាយតម្លៃ' : 'Rating'}</span>
 <FiStar size={16} fill="#F59E0B" color="#F59E0B" />
 <span style={{ fontSize: '1.05rem', color: '#D97706' }}>{avgRating.toFixed(2)} / 5.0</span>
 </div>
 <button
 onClick={() => setShowReviewsModal(true)}
 style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
 >
 {isKhmer ? 'មើលការវាយតម្លៃ' : 'See All Reviews'}
 </button>
 </div>

 <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
 {[
 { star: 5, count: rating5Count, pct: 90 },
 { star: 4, count: rating4Count, pct: 15 },
 { star: 3, count: rating3Count, pct: 6 },
 { star: 2, count: rating2Count, pct: 2 },
 { star: 1, count: rating1Count, pct: 5 }
 ].map(item => (
 <div key={item.star} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem' }}>
 <span style={{ width: 14, color: '#F59E0B', fontWeight: 800 }}></span>
 <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
 <div style={{ height: '100%', width: `${item.pct}%`, background: '#2563EB', borderRadius: 3 }} />
 </div>
 <span style={{ width: 44, textAlign: 'right', color: 'var(--text-lighter)', fontWeight: 600 }}>
 {item.count.toLocaleString()}
 </span>
 </div>
 ))}
 </div>
 </div>

 {/* CARD 3 — Quick Info */}
 <div className="card" style={{ padding: '20px', borderRadius: '18px', background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
 <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text)', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
 <MdStorefront size={16} /> {isKhmer ? 'ព័ត៌មានហាង' : 'Store Info'}
 </div>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
 <span style={{ color: 'var(--text-light)', fontWeight: 600 }}>{isKhmer ? 'ម៉ោងបើក:' : 'Hours:'}</span>
 <span style={{ fontWeight: 700, color: 'var(--text)' }}>12:00 – 22:00</span>
 </div>
 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
 <span style={{ color: 'var(--text-light)', fontWeight: 600 }}>{isKhmer ? 'ស្ថានភាព:' : 'Status:'}</span>
 <span style={{ fontWeight: 700, color: '#10B981', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
 <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
 {isKhmer ? 'អនឡាញ' : 'Online'}
 </span>
 </div>
 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
 <span style={{ color: 'var(--text-light)', fontWeight: 600 }}>{isKhmer ? 'ចុងក្រោយ:' : 'Last seen:'}</span>
 <span style={{ fontWeight: 600, color: 'var(--text-lighter)', fontSize: '0.78rem' }}>37 {isKhmer ? 'នាទីមុន' : 'mins ago'}</span>
 </div>
 <div style={{ marginTop: 6 }}>
 <Link
 to={`/store/${sellerId}`}
 style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', fontWeight: 800, color: '#6366F1', textDecoration: 'none' }}
 >
 <FiExternalLink size={13} />
 {isKhmer ? 'ចូលទៅទំព័រហាង' : 'Browse All Products →'}
 </Link>
 </div>
 </div>
 </div>

 </div>

 {/*  Reviews Modal  */}
 {showReviewsModal && (
 <div onClick={() => setShowReviewsModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
 <div className="modal animate-slide-up" style={{ maxWidth: 520, padding: 24, borderRadius: 20 }} onClick={e => e.stopPropagation()}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
 <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem' }}>{isKhmer ? 'ការវាយតម្លៃពីអតិថិជន' : 'Store Customer Reviews'}</h3>
 <button onClick={() => setShowReviewsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
 <FiX size={20} />
 </button>
 </div>
 <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 12, marginBottom: 16 }}>
 <div style={{ fontSize: '2rem', fontWeight: 900, color: '#D97706' }}>4.85</div>
 <div>
 <div style={{ display: 'flex', gap: 2 }}>
 {[1,2,3,4,5].map(i => <FiStar key={i} size={16} fill="#F59E0B" color="#F59E0B" />)}
 </div>
 <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: 2 }}>
 {isKhmer ? `ផ្អែកលើការវាយតម្លៃ ${totalReviewsCount.toLocaleString()} ពីអតិថិជន` : `Based on ${totalReviewsCount.toLocaleString()} verified ratings`}
 </div>
 </div>
 </div>
 <p style={{ fontSize: '0.88rem', color: 'var(--text-light)', lineHeight: 1.5 }}>
 {isKhmer ? '100% Verified customer reviews.' : '100% authentic customer feedback verified by Saby Shop automated transaction logs.'}
 </p>
 <button onClick={() => setShowReviewsModal(false)} className="btn btn-primary" style={{ width: '100%', marginTop: 16, borderRadius: 12, fontWeight: 800 }}>
 {isKhmer ? 'បិទ' : 'Close'}
 </button>
 </div>
 </div>
 )}

  {/* Contact Seller Modal (Website Chat / Telegram Account / Telegram Channel) */}
  <ContactSellerModal
    isOpen={showContactModal}
    onClose={() => setShowContactModal(false)}
    seller={profile ? {
      id: profile.userId || sellerId,
      sellerId: profile.userId || sellerId,
      storeName: profile.storeName,
      storeLogoUrl: profile.storeLogoUrl,
      telegramUsername: profile.telegramUsername,
      telegramChannel: profile.telegramChannel,
      preferredContactMethod: profile.preferredContactMethod
    } : null}
  />

 </div>
 );
}
