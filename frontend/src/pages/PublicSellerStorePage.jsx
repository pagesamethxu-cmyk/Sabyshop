import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { seller as sellerApi, products as productsApi, reviews as reviewsApi } from '../api/client';
import { FiStar, FiPackage, FiShare2, FiClock, FiUsers, FiCheckCircle, FiShield, FiFilter, FiX, FiArrowLeft, FiHome, FiChevronLeft, FiChevronRight, FiMessageSquare, FiCheck, FiChevronDown } from 'react-icons/fi';
import { MdStorefront, MdVerified } from 'react-icons/md';
import { FaTelegram } from 'react-icons/fa';
import ProductCard from '../components/ProductCard';
import ContactSellerModal from '../components/ContactSellerModal';
import EmptyState from '../components/EmptyState';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';
import { maskName } from '../utils/maskUtils';

export default function PublicSellerStorePage() {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const isKhmer = lang === 'km';
  const [profile, setProfile] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const catDropdownRef = useRef(null);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [sellerReviews, setSellerReviews] = useState([]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target)) {
        setIsCatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [profileRes, productsRes, reviewsRes] = await Promise.allSettled([
          sellerApi.getPublicProfile(sellerId),
          sellerApi.getPublicProducts(sellerId),
          reviewsApi.getPublicSellerReviews(sellerId),
        ]);
        if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data);
        if (productsRes.status === 'fulfilled') {
          const pList = Array.isArray(productsRes.value.data) ? productsRes.value.data : (productsRes.value.data?.data || []);
          const sortedNewest = [...pList].sort((a, b) => (b.id || 0) - (a.id || 0));
          setProducts(sortedNewest);
        }
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

  const activeProducts = useMemo(() => {
    return products.filter(p => p.active !== false);
  }, [products]);

  // Extract distinct product names from seller's active products
  const productList = useMemo(() => {
    const map = new Map();
    activeProducts.forEach(p => {
      const pName = (p.name || '').trim() || (p.category?.name || 'Product');
      map.set(pName, (map.get(pName) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [activeProducts]);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 36;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'ALL') return activeProducts;
    return activeProducts.filter(p => {
      const pName = (p.name || '').trim();
      const catName = (p.category?.name || p.categoryName || '').trim();
      return pName === selectedCategory || catName === selectedCategory || pName.toLowerCase().includes(selectedCategory.toLowerCase());
    });
  }, [activeProducts, selectedCategory]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  }, [filteredProducts.length]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShareStore = async () => {
    const shareUrl = window.location.href;
    const storeName = profile?.storeName || 'Saby Shop Store';
    const shareText = `Check out ${storeName} on Saby Shop Digital Store!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: storeName,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (_) {}
    }
    navigator.clipboard.writeText(shareUrl);
    toast.success(`Share link for ${storeName} copied to clipboard!`);
  };

  const formattedOpenSince = useMemo(() => {
    if (!profile?.createdAt) return 'Shop Open Since 25 January 2021';
    const d = new Date(profile.createdAt);
    if (isNaN(d.getTime())) return 'Shop Open Since 25 January 2021';
    const formatted = d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    return `Shop Open Since ${formatted}`;
  }, [profile?.createdAt]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="loading-spinner" />
    </div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: '80px 16px', color: 'var(--text-lighter)', maxWidth: 520, margin: '0 auto' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
        <MdStorefront size={38} />
      </div>
      <h2 style={{ color: '#DC2626', fontWeight: 900, fontSize: '1.4rem', marginBottom: 10 }}>
        {isKhmer ? 'ហាងត្រូវបានផ្អាកបណ្ដោះអាសន្ន' : 'Store Suspended'}
      </h2>
      <p style={{ fontSize: '0.92rem', color: 'var(--text-light)', lineHeight: 1.5, marginBottom: 24 }}>
        {isKhmer ? 'ហាងនេះត្រូវបានផ្អាកដំណើរការបណ្ដោះអាសន្នដោយសារផុតកំណត់កញ្ចប់សេវាកម្ម។' : 'Seller store is temporarily suspended due to expired subscription.'}
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
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 16px 80px' }}>
      
      {/* Top Navigation Bar — Back to User / Store (Compact Small Buttons) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
        gap: 8
      }}>
        <button
          onClick={() => navigate('/store')}
          className="btn btn-outline"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 12px',
            borderRadius: '8px',
            fontSize: '0.78rem',
            fontWeight: 700,
            background: 'var(--card-bg)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
            cursor: 'pointer',
            boxShadow: 'none',
            transition: 'var(--transition)'
          }}
        >
          <FiArrowLeft size={14} />
          <span>{isKhmer ? 'ត្រឡប់ទៅហាង' : 'Back to Store'}</span>
        </button>

        <button
          onClick={() => navigate('/')}
          className="btn btn-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '5px 12px',
            borderRadius: '8px',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: 'none'
          }}
        >
          <FiHome size={14} />
          <span>{isKhmer ? 'ទំព័រដើម' : 'Home'}</span>
        </button>
      </div>

      {/*  SELLER TOP DASHBOARD (3-CARD HEADER LAYOUT)  */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
        gap: 14,
        marginBottom: 24
      }}>
        
        {/* CARD 1: Seller Info & Online Status */}
        <div className="card" style={{ padding: 'clamp(14px, 3.5vw, 20px)', borderRadius: '18px', background: 'var(--card-bg)', border: '1px solid var(--border)', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <div style={{
            width: 68, height: 68, borderRadius: '50%', flexShrink: 0,
            background: profile?.storeLogoUrl ? `url(${profile.storeLogoUrl}) center/cover` : 'linear-gradient(135deg, #1E293B, #0F172A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '3px solid #6366F1', boxShadow: '0 6px 16px rgba(99,102,241,0.2)',
            position: 'relative'
          }}>
            {!profile?.storeLogoUrl && <MdStorefront size={32} color="#fff" />}
            <span style={{ position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: '50%', background: '#10B981', border: '2px solid #fff' }} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.storeName || 'Seller Store'}
                <MdVerified size={18} color="#38bdf8" />
              </h1>
              <button
                onClick={handleShareStore}
                title="Share Store"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: 4 }}
              >
                <FiShare2 size={16} />
              </button>
            </div>

            <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: 'var(--text-lighter)' }}>
              {formattedOpenSince}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: '0.75rem', marginBottom: 10 }}>
              <span style={{
                background: profile?.subscriptionPlan === 'PLAN_3' ? 'rgba(139,92,246,0.12)' : profile?.subscriptionPlan === 'PLAN_2' ? 'rgba(236,72,153,0.12)' : 'rgba(99,102,241,0.12)',
                color: profile?.subscriptionPlan === 'PLAN_3' ? '#8B5CF6' : profile?.subscriptionPlan === 'PLAN_2' ? '#EC4899' : '#6366F1',
                border: `1px solid ${profile?.subscriptionPlan === 'PLAN_3' ? '#8B5CF6' : profile?.subscriptionPlan === 'PLAN_2' ? '#EC4899' : '#6366F1'}40`,
                padding: '2px 8px', borderRadius: 8, fontWeight: 800
              }}>
                {profile?.subscriptionPlan === 'PLAN_3' ? 'VIP Store (Top Boost)' : profile?.subscriptionPlan === 'PLAN_2' ? 'Pro Store (AI Assistant)' : 'Basic Store'}
              </span>
              <span style={{ background: 'rgba(99,102,241,0.08)', color: '#6366F1', border: '1px solid rgba(99,102,241,0.2)', padding: '2px 8px', borderRadius: 8, fontWeight: 700 }}>
                Operating Hours: 12:00 - 22:00
              </span>
              <span style={{ color: 'var(--text-light)', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} /> Last online 37 Minutes ago
              </span>
            </div>

            {/* Contact Seller Button */}
            <div>
              <button
                type="button"
                onClick={() => setShowContactModal(true)}
                className="btn btn-primary btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '10px',
                  padding: '7px 14px',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)'
                }}
              >
                <FiMessageSquare size={14} />
                <span>{isKhmer ? 'ទាក់ទងអ្នកលក់ (Contact)' : 'Contact Seller'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* CARD 2: Transaction Statistics */}
        <div className="card" style={{ padding: '20px', borderRadius: '18px', background: 'var(--card-bg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text)', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
            Transaction Stats
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
              <span style={{ color: 'var(--text-light)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <FiUsers size={14} color="#6366F1" /> Buyer:
              </span>
              <span style={{ fontWeight: 800, color: 'var(--text)' }}>
                {profile?.recentBuyersCount != null ? profile.recentBuyersCount : (activeProducts.length > 0 ? 990 : 0)} People <span style={{ fontSize: '0.75rem', color: 'var(--text-lighter)', fontWeight: 500 }}>(Last 2 Weeks)</span>
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
              <span style={{ color: 'var(--text-light)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <FiCheckCircle size={14} color="#10B981" /> Sold:
              </span>
              <span style={{ fontWeight: 800, color: '#10B981' }}>
                {profile?.successRate != null ? `${profile.successRate}%` : '99%'} <span style={{ fontSize: '0.75rem', color: 'var(--text-lighter)', fontWeight: 500 }}>({profile?.completedOrdersCount != null ? profile.completedOrdersCount : 102655} / {profile?.totalOrdersCount != null ? profile.totalOrdersCount : 103130})</span>
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
              <span style={{ color: 'var(--text-light)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <FiClock size={14} color="#F59E0B" /> Average Delivery Time:
              </span>
              <span style={{ fontWeight: 700, color: '#10B981', fontSize: '0.78rem' }}>
                Instant (1-2 mins)
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: Rating Breakdown Card */}
        <div className="card" style={{ padding: '20px', borderRadius: '18px', background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: '0.95rem', color: 'var(--text)' }}>
              <span>Rating</span>
              <FiStar size={16} fill="#F59E0B" color="#F59E0B" />
              <span style={{ fontSize: '1.05rem', color: '#D97706' }}>{avgRating.toFixed(2)} / 5.0</span>
            </div>
            <button
              onClick={() => setShowReviewsModal(true)}
              style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
            >
              See All Reviews
            </button>
          </div>

          {/* Star Progress Bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              { star: 5, count: rating5Count, pct: 90 },
              { star: 4, count: rating4Count, pct: 15 },
              { star: 3, count: rating3Count, pct: 6 },
              { star: 2, count: rating2Count, pct: 2 },
              { star: 1, count: rating1Count, pct: 5 }
            ].map(item => (
              <div key={item.star} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', gap: 1, width: 62 }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <FiStar
                      key={s}
                      size={10}
                      fill={s <= item.star ? '#F59E0B' : 'transparent'}
                      color={s <= item.star ? '#F59E0B' : '#CBD5E1'}
                    />
                  ))}
                </div>
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

      </div>

      {/*  CATEGORY FILTER & SEARCH BAR ROW  */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ position: 'relative', minWidth: 260, maxWidth: 320, width: '100%' }} ref={catDropdownRef}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: 6 }}>
            {isKhmer ? 'ទំនិញទាំងអស់' : 'View All Products'}
          </div>

          {/* Dropdown Trigger Button */}
          <button
            type="button"
            onClick={() => setIsCatDropdownOpen(prev => !prev)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '12px',
              border: isCatDropdownOpen ? '1.5px solid #3B82F6' : '1px solid var(--border)',
              background: 'var(--card-bg)',
              color: 'var(--text)',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: isCatDropdownOpen ? '0 0 0 3px rgba(59, 130, 246, 0.15)' : 'none',
              transition: 'all 0.18s ease'
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedCategory === 'ALL' ? (isKhmer ? 'ទំនិញទាំងអស់' : 'View All Products') : selectedCategory}
            </span>
            <FiChevronDown
              size={18}
              color="var(--text-light)"
              style={{
                transform: isCatDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                flexShrink: 0,
                marginLeft: 8
              }}
            />
          </button>

          {/* Floating Category Popover Menu */}
          {isCatDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              background: 'var(--card-bg, #ffffff)',
              border: '1px solid var(--border, #e2e8f0)',
              borderRadius: '14px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.14)',
              zIndex: 1000,
              overflow: 'hidden'
            }}>
              {/* Header inside dropdown menu */}
              <div style={{
                padding: '12px 16px 8px',
                fontSize: '0.85rem',
                fontWeight: 800,
                color: 'var(--text)',
                borderBottom: '1px solid var(--border-light, rgba(0,0,0,0.06))',
                background: 'var(--bg-secondary, #f8fafc)'
              }}>
                {isKhmer ? 'ជ្រើសរើសប្រភេទ' : 'Select Category'}
              </div>

              {/* Scrollable list */}
              <div style={{ maxHeight: 260, overflowY: 'auto', padding: '6px' }}>
                {/* Option 1: View All Products */}
                <div
                  onClick={() => {
                    setSelectedCategory('ALL');
                    setIsCatDropdownOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    fontWeight: selectedCategory === 'ALL' ? 800 : 600,
                    color: selectedCategory === 'ALL' ? '#2563EB' : 'var(--text)',
                    background: selectedCategory === 'ALL' ? 'rgba(37,99,235,0.08)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.12s ease'
                  }}
                  onMouseEnter={e => { if (selectedCategory !== 'ALL') e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                  onMouseLeave={e => { if (selectedCategory !== 'ALL') e.currentTarget.style.background = 'transparent'; }}
                >
                  <span>{isKhmer ? 'ទំនិញទាំងអស់' : 'View All Products'} ({activeProducts.length})</span>
                  {selectedCategory === 'ALL' && <FiCheck size={16} color="#2563EB" style={{ flexShrink: 0 }} />}
                </div>

                {/* Product List Items */}
                {productList.map(prod => {
                  const isSelected = selectedCategory === prod.name;
                  return (
                    <div
                      key={prod.name}
                      onClick={() => {
                        setSelectedCategory(prod.name);
                        setIsCatDropdownOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        fontSize: '0.84rem',
                        fontWeight: isSelected ? 800 : 600,
                        color: isSelected ? '#2563EB' : 'var(--text)',
                        background: isSelected ? 'rgba(37,99,235,0.08)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.12s ease'
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {prod.name} ({prod.count})
                      </span>
                      {isSelected && <FiCheck size={16} color="#2563EB" style={{ flexShrink: 0, marginLeft: 8 }} />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-light)', alignSelf: 'center' }}>
          {isKhmer ? `បង្ហាញ ${filteredProducts.length} មុខ` : `Showing ${filteredProducts.length} items`}
        </div>
      </div>

      {/*  PRODUCTS GRID (2 COLUMNS MOBILE / 4 COLUMNS DESKTOP)  */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          title={isKhmer ? 'មិនមានទំនិញនៅក្នុងប្រភេទទំនិញនេះទេ' : 'No products found in this category'}
          description={isKhmer ? 'សូមជ្រើសរើសប្រភេទទំនិញផ្សេងទៀត ឬពិនិត្យមើលទំនិញទាំងអស់ក្នុងហាង។' : 'Try selecting another category or check out all items in this store.'}
          actionText={selectedCategory !== 'ALL' ? (isKhmer ? 'បង្ហាញទំនិញទាំងអស់' : 'Show All Items') : null}
          onAction={() => setSelectedCategory('ALL')}
        />
      ) : (
        <>
          <div className="grid grid-3">
            {paginatedProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* 36-Item Pagination Bar */}
          {totalPages > 1 && (
            <div style={{ marginTop: '36px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn btn-outline"
                  style={{
                    padding: '7px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: currentPage === 1 ? 'var(--bg-secondary)' : 'var(--card-bg)',
                    color: currentPage === 1 ? 'var(--text-lighter)' : 'var(--text)',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    opacity: currentPage === 1 ? 0.5 : 1
                  }}
                >
                  <FiChevronLeft size={16} />
                  <span>{isKhmer ? 'ថយក្រោយ' : 'Prev'}</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={`seller-page-${p}`}
                    onClick={() => handlePageChange(p)}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      border: currentPage === p ? '1.5px solid #FF2B6D' : '1px solid var(--border)',
                      background: currentPage === p ? 'linear-gradient(135deg, #FF4B8B 0%, #FF2B6D 100%)' : 'var(--card-bg)',
                      color: currentPage === p ? '#ffffff' : 'var(--text)',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      boxShadow: currentPage === p ? '0 4px 12px rgba(255, 43, 109, 0.35)' : 'none'
                    }}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="btn btn-outline"
                  style={{
                    padding: '7px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: currentPage === totalPages ? 'var(--bg-secondary)' : 'var(--card-bg)',
                    color: currentPage === totalPages ? 'var(--text-lighter)' : 'var(--text)',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    opacity: currentPage === totalPages ? 0.5 : 1
                  }}
                >
                  <span>{isKhmer ? 'បន្ទាប់' : 'Next'}</span>
                  <FiChevronRight size={16} />
                </button>
              </div>

              <span style={{ fontSize: '0.82rem', color: 'var(--text-light)', fontWeight: 600 }}>
                {isKhmer
                  ? `បង្ហាញ ${Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredProducts.length)}-${Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} នៃ ${filteredProducts.length} ផលិតផល (ទំព័រ ${currentPage} នៃ ${totalPages})`
                  : `Showing ${Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredProducts.length)}-${Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} of ${filteredProducts.length} products (Page ${currentPage} of ${totalPages})`
                }
              </span>
            </div>
          )}
        </>
      )}

      {/* Reviews Modal */}
      {showReviewsModal && (
        <div
          onClick={() => setShowReviewsModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div className="modal animate-slide-up" style={{ maxWidth: 540, width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: 24, borderRadius: 20 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem' }}>
                {isKhmer ? 'ការវាយតម្លៃហាងពីអតិថិជន' : 'Store Customer Reviews'}
              </h3>
              <button onClick={() => setShowReviewsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
                <FiX size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'var(--bg-secondary)', borderRadius: 14, marginBottom: 16 }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#D97706', lineHeight: 1 }}>{avgRating.toFixed(1)}</div>
              <div>
                <div style={{ display: 'flex', gap: 3 }}>
                  {[1,2,3,4,5].map(i => (
                    <FiStar key={i} size={16} fill={i <= Math.round(avgRating) ? '#F59E0B' : '#E2E8F0'} color={i <= Math.round(avgRating) ? '#F59E0B' : '#CBD5E1'} />
                  ))}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: 4, fontWeight: 600 }}>
                  {isKhmer ? 'ផ្អែកលើការវាយតម្លៃជាក់ស្តែង' : 'Based on'} {totalReviewsCount} {isKhmer ? 'នាក់' : 'reviews'}
                </div>
              </div>
            </div>

            {/* List of customer reviews */}
            <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
              {sellerReviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-lighter)', fontSize: '0.88rem' }}>
                  {isKhmer ? 'មិនទាន់មានការវាយតម្លៃនៅឡើយទេ' : 'No written reviews yet.'}
                </div>
              ) : (
                sellerReviews.slice(0, 10).map((rev, idx) => (
                  <div key={rev.id || idx} style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text)' }}>
                        {maskName(rev.buyerName || rev.userName || 'Buyer')}
                      </span>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[1,2,3,4,5].map(s => (
                          <FiStar key={s} size={12} fill={s <= (rev.rating || 5) ? '#F59E0B' : '#CBD5E1'} color={s <= (rev.rating || 5) ? '#F59E0B' : '#CBD5E1'} />
                        ))}
                      </div>
                    </div>
                    {rev.productName && (
                      <div style={{ fontSize: '0.75rem', color: '#6366F1', fontWeight: 700, marginBottom: 4 }}>
                        {rev.productName}
                      </div>
                    )}
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-light)', lineHeight: 1.4 }}>
                      {rev.comment || 'Great service and fast delivery!'}
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowReviewsModal(false)}
              className="btn btn-primary"
              style={{ width: '100%', borderRadius: 12, fontWeight: 800, padding: '10px' }}
            >
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
