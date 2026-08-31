import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { products as productsApi, seller as sellerApi, orders as ordersApi, coupons as couponsApi } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import {
  FiMinus, FiPlus, FiArrowLeft, FiShoppingCart, FiCreditCard,
  FiShield, FiZap, FiCheckCircle, FiHeart, FiShare2, FiStar,
  FiMessageSquare, FiChevronDown, FiChevronUp, FiClock, FiMaximize2, FiX, FiInfo, FiMail,
  FiTag, FiPercent
} from 'react-icons/fi';
import { MdStorefront, MdVerified } from 'react-icons/md';
import { FaTelegram } from 'react-icons/fa';
import toast from 'react-hot-toast';
import ProductRatingsSection from '../components/ProductRatingsSection';
import ProductCard from '../components/ProductCard';
import ContactSellerModal from '../components/ContactSellerModal';
import PolicyModal from '../components/PolicyModal';
import PaymentModal from '../components/PaymentModal';
import { generateKHQR, generateMD5 } from '../utils/khqr';
import { getProductTypeInfo } from '../utils/productOptions';
import { getProductImageUrl } from '../utils/productImages';
import { normalizeImageUrl } from '../utils/imageUrl';

const ACCOUNT_ID = import.meta.env.VITE_ABA_ACCOUNT_ID || import.meta.env.VITE_BAKONG_ACCOUNT_ID || 'ec477571@abaa';
const BANK_PHONE = import.meta.env.VITE_ABA_PHONE || import.meta.env.VITE_BAKONG_PHONE || '0972089305';

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { t, lang, isKhmer: ctxIsKhmer } = useLanguage();
  const isKhmer = ctxIsKhmer ?? (lang === 'km');
  const { user } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [otherProducts, setOtherProducts] = useState([]);
  const [allProductsList, setAllProductsList] = useState([]);
  const [sellerProfile, setSellerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [buyerInviteEmail, setBuyerInviteEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [lightboxImage, setLightboxImage] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [sellerNote, setSellerNote] = useState('');
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [showContactSellerModal, setShowContactSellerModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  // Direct KHQR Payment State
  const [showConfirmOrderModal, setShowConfirmOrderModal] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Coupon / Promo Code State
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const fallbackProducts = [
    { id: 1, name: 'Netflix Premium 1 Month', description: 'Awesome 4K Netflix account for 1 month with instant delivery and warranty.', price: 12.99, stockCount: 10, category: { name: 'Streaming' } },
    { id: 2, name: 'Spotify Premium 1 Month', description: 'Spotify Premium individual account with full warranty and offline download support.', price: 9.99, stockCount: 5, category: { name: 'Streaming' } },
    { id: 3, name: 'Steam Account', description: 'Steam account containing various popular games.', price: 15.99, stockCount: 0, category: { name: 'Gaming' } },
    { id: 4, name: 'Discord Nitro 1 Month', description: 'Discord Nitro 1-month subscription link or account.', price: 4.99, stockCount: 8, category: { name: 'Social Media' } },
    { id: 5, name: 'NordVPN Premium 1 Year', description: '1-Year NordVPN Premium account with high speed servers.', price: 8.99, stockCount: 12, category: { name: 'VPN & Security' } },
    { id: 6, name: 'Adobe Creative Cloud', description: 'Adobe Creative Cloud all-apps subscription.', price: 24.99, stockCount: 3, category: { name: 'Software' } },
    { id: 7, name: 'CapCut Pro 1 Month', description: 'CapCut Pro account with full premium features.', price: 1.25, stockCount: 15, category: { name: 'Software' } },
    { id: 8, name: 'YouTube Premium 1 Month', description: 'YouTube Premium account ad-free and background play.', price: 3.00, stockCount: 20, category: { name: 'Streaming' } },
    { id: 9, name: 'ChatGPT Plus 1 Month', description: 'ChatGPT Plus subscription with GPT-4 access.', price: 19.99, stockCount: 6, category: { name: 'AI Tools' } },
    { id: 10, name: 'Canva Pro 1 Year', description: 'Canva Pro 1-Year team invite link.', price: 4.99, stockCount: 10, category: { name: 'Design' } }
  ];

  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      try {
        const res = await productsApi.getById(id);
        const prodData = res.data;
        setProduct(prodData);

        if (prodData?.sellerId) {
          sellerApi.getPublicProfile(prodData.sellerId)
            .then(sRes => setSellerProfile(sRes.data))
            .catch(() => {});
        }
      } catch (error) {
        const mockMap = {};
        fallbackProducts.forEach(p => { mockMap[String(p.id)] = p; });
        setProduct(mockMap[id] || { id: Number(id), name: 'Digital Product', description: 'Instant credentials delivery product.', price: 4.99, stockCount: 5, category: { name: 'Digital Item' } });
      }

      try {
        const allRes = await productsApi.getAll();
        const allList = Array.isArray(allRes.data) ? allRes.data : fallbackProducts;
        setAllProductsList(allList);
        setOtherProducts(allList.filter(p => String(p.id) !== String(id)));
      } catch (error) {
        setAllProductsList(fallbackProducts);
        setOtherProducts(fallbackProducts.filter(p => String(p.id) !== String(id)));
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!product) return (
    <EmptyState
      title={isKhmer ? 'ទំនិញមិនអាចទិញបានទេ' : 'Product Currently Unavailable'}
      message={isKhmer ? 'ទំនិញនេះមិនអាចបញ្ជាទិញបានទេ ដោយសារហាងម្ចាស់ទំនិញបានផុតកំណត់កញ្ចប់សេវាកម្ម ឬទំនិញត្រូវបានផ្អាកដំណើរការ។' : 'This product cannot be purchased because the seller subscription has expired or the item is unavailable.'}
      actionText={isKhmer ? 'ត្រឡប់ទៅហាងទំនិញ' : 'Back to Store'}
      actionLink="/store"
    />
  );

  const inStock = (product.stockCount ?? 0) > 0 || (product.productType === 'SHARING');
  const rawSold = product.soldCount ?? product.salesCount ?? product.sold ?? product.totalSold ?? 0;
  const soldCount = Number(rawSold);

  const sellerStoreName = sellerProfile?.storeName || product.sellerStoreName || product.sellerName || 'Saby Shop Store';
  const rawRating = sellerProfile?.averageRating ?? product.averageRating ?? 5.0;
  const sellerRating = Number(rawRating).toFixed(1);
  const rawRevCount = sellerProfile?.reviewCount ?? product.reviewCount ?? 0;
  const sellerReviewsCount = Number(rawRevCount) >= 1000 ? (Number(rawRevCount) / 1000).toFixed(1) + 'K' : rawRevCount.toString();
  const sellerLogo = sellerProfile?.storeLogoUrl || product.sellerStoreLogoUrl;

  const handleAddToCart = (targetProd = product, qty = quantity) => {
    if (targetProd?.productType === 'SHARING') {
      const emailToUse = (buyerInviteEmail || user?.email || '').trim();
      if (!emailToUse || !emailToUse.includes('@')) {
        toast.error(isKhmer ? 'សូមបញ្ចូលអ៊ីមែលសម្រាប់ទទួល Invite ជាមុនសិន' : 'Please enter your invite email to continue', { id: 'invite-email-required' });
        return;
      }
    }
    const maxStock = targetProd.stockCount != null ? targetProd.stockCount : 99;
    if (qty > maxStock && targetProd.productType !== 'SHARING') {
      toast.error(`Product in stock still ${maxStock}`, { id: 'stock-limit' });
      addItem(targetProd, maxStock, buyerInviteEmail || user?.email, sellerNote);
      return;
    }
    addItem(targetProd, qty, buyerInviteEmail || user?.email, sellerNote);
    toast.success(`${targetProd.name} added to cart!`);
  };

  const handleApplyCoupon = async (e) => {
    if (e) e.preventDefault();
    const code = couponCodeInput.trim().toUpperCase();
    if (!code) {
      toast.error(isKhmer ? 'សូមបញ្ចូលកូដបញ្ចុះតម្លៃ' : 'Please enter a coupon code');
      return;
    }
    setValidatingCoupon(true);
    try {
      const currentSubtotal = Number((Number(product.price || 0) * quantity).toFixed(2));
      const payload = {
        code: code,
        orderAmount: currentSubtotal,
        sellerId: product.sellerId || null,
        productId: product.id,
        items: [{
          productId: product.id,
          sellerId: product.sellerId || null,
          quantity: quantity,
          price: product.price
        }]
      };
      const res = await couponsApi.validate(payload);
      const val = res.data?.data || res.data;
      if (val && (val.valid || val.isValid)) {
        const discountVal = Number(val.discountAmount || val.discount || 0);
        setAppliedCoupon({
          code: code,
          discount: discountVal,
          discountType: val.discountType,
          message: val.message || `ទទួលបានការបញ្ចុះតម្លៃ $${discountVal.toFixed(2)}`
        });
        toast.success(isKhmer ? `បានអនុវត្តកូដ "${code}" ជោគជ័យ! បញ្ចុះតម្លៃ -$${discountVal.toFixed(2)}` : `Coupon "${code}" applied! Saved -$${discountVal.toFixed(2)}`);
      } else {
        toast.error(val?.message || (isKhmer ? 'កូដបញ្ចុះតម្លៃមិនត្រឹមត្រូវ ឬផុតកំណត់' : 'Invalid or expired coupon code'));
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || (isKhmer ? 'កូដបញ្ចុះតម្លៃមិនត្រឹមត្រូវ' : 'Invalid coupon code'));
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    toast(isKhmer ? 'បានលុបកូដបញ្ចុះតម្លៃចេញ' : 'Coupon removed');
  };

  const subtotalNum = Number(product?.price || 0) * quantity;
  const couponDiscountAmount = appliedCoupon ? Math.min(subtotalNum, Number(appliedCoupon.discount || 0)) : 0;
  const totalToPay = Math.max(0, subtotalNum - couponDiscountAmount);

  // Check if product is Account Sharing OR Invite Link (តំណភ្ជាប់អញ្ជើញ)
  const productTypeUpper = String(product?.productType || '').toUpperCase();
  const productNameLower = String(product?.name || '').toLowerCase();
  const isInviteOrSharingProduct = 
    productTypeUpper === 'SHARING' ||
    productTypeUpper === 'INVITE_LINK' ||
    productTypeUpper === 'INVITE' ||
    productTypeUpper === 'FAMILY' ||
    productNameLower.includes('invite') ||
    productNameLower.includes('sharing') ||
    productNameLower.includes('family') ||
    productNameLower.includes('អញ្ជើញ') ||
    productNameLower.includes('តំណភ្ជាប់') ||
    productNameLower.includes('ចែករំលែក');

  const isInviteLinkType = productTypeUpper === 'INVITE_LINK' ||
    productNameLower.includes('តំណភ្ជាប់') ||
    productNameLower.includes('invite link');

  const handleBuyNow = () => {
    if (isInviteOrSharingProduct) {
      const emailToUse = (buyerInviteEmail || '').trim();
      if (!emailToUse || !emailToUse.includes('@')) {
        setEmailError(isKhmer ? 'សូមបញ្ចូលអ៊ីមែលសម្រាប់ទទួល Invite / តំណភ្ជាប់អញ្ជើញ ជាមុនសិន' : 'Please enter your invite email');
        toast.error(
          isKhmer 
            ? 'សូមបញ្ចូលអ៊ីមែលសម្រាប់ទទួល Invite / តំណភ្ជាប់អញ្ជើញ ជាមុនសិន!' 
            : 'Please enter your invite email to continue', 
          { id: 'invite-email-required' }
        );
        return;
      }
    }
    setEmailError('');
    const maxStock = product.stockCount != null ? product.stockCount : 99;
    if (quantity > maxStock && !isInviteOrSharingProduct) {
      toast.error(`Product in stock still ${maxStock}`, { id: 'stock-limit' });
      return;
    }
    setShowConfirmOrderModal(true);
  };

  const executeOrderAndPay = async () => {
    setIsSubmittingPayment(true);
    const emailToUse = (buyerInviteEmail || user?.email || '').trim();
    const finalAmount = Number(totalToPay.toFixed(2));
    const merchantLabel = sellerProfile?.storeName || product.sellerStoreName || product.sellerName || 'Saby Shop';

    // 3-second spin before showing QR
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
      // Create order directly in backend first to obtain orderId for ABA PayWay
      let newOrderId;
      try {
        const res = await ordersApi.create({
          items: [{
            productId: product.id,
            quantity: quantity,
            buyerInviteEmail: emailToUse || null,
            claimNote: sellerNote || null
          }],
          buyerInviteEmail: emailToUse || null,
          couponCode: appliedCoupon?.code || null,
          discountAmount: couponDiscountAmount > 0 ? couponDiscountAmount : null
        });
        newOrderId = res.data?.id ?? res.data?.data?.id;
      } catch (err) {
        console.error('Order creation failed:', err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          toast.error('Session expired or unauthorized. Please log in again.');
          navigate('/login', { state: { from: `/product/${product.id}` } });
          return;
        }
        const errMsg = err.response?.data?.message || err.message || 'Failed to create order on server';
        toast.error(`Order Creation Failed: ${errMsg}`);
        return;
      }

      if (!newOrderId) {
        toast.error('Failed to get order ID');
        return;
      }

      const orderPayload = {
        id: newOrderId,
        totalAmount: finalAmount,
        merchantName: merchantLabel,
        sellerStoreName: merchantLabel,
        items: [{ product, quantity }],
        product: product
      };

      setActiveOrder(orderPayload);
      setShowConfirmOrderModal(false);
      setIsPaymentModalOpen(true);
      toast.success(isKhmer ? 'បានរៀបចំ KHQR រួចរាល់! សូមស្កែនទូទាត់ប្រាក់' : 'KHQR ready! Scan with ABA / Bakong to pay');

    } catch (err) {
      console.error('Direct buy error:', err);
      toast.error(isKhmer ? 'បរាជ័យក្នុងការរៀបចំការទូទាត់' : 'Failed to prepare payment');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = `Check out ${product.name} from ${sellerStoreName} (${sellerRating} stars) on Saby Shop!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} - ${sellerStoreName}`,
          text: shareText,
          url: shareUrl
        });
        return;
      } catch (_) {}
    }
    navigator.clipboard.writeText(shareUrl);
    toast.success(`Share link for ${sellerStoreName} copied to clipboard!`);
  };

  const handleWishlistToggle = () => {
    setIsWishlisted(!isWishlisted);
    toast.success(!isWishlisted ? 'Saved to wishlist!' : 'Removed from wishlist');
  };

  const handleChatSeller = () => {
    setShowContactSellerModal(true);
  };

  const [imgError, setImgError] = useState(false);
  const brandFallback = getProductImageUrl(product?.name, '');
  const resolvedImg = !imgError && product?.imageUrl ? normalizeImageUrl(product.imageUrl) : brandFallback;
  const typeInfo = getProductTypeInfo(product.productType || 'ACCOUNT');
  const subtotal = subtotalNum.toFixed(2);

  return (
    <div className="product-page-container container" style={{ padding: '24px 16px 80px', maxWidth: '1180px', margin: '0 auto' }}>
      
      {/* Top Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '8px', flexWrap: 'nowrap' }}>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-outline btn-sm"
          style={{ border: '1px solid var(--border)', background: 'var(--card-bg)', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', flexShrink: 0, padding: '6px 10px', fontSize: '0.8rem' }}
        >
          <FiArrowLeft size={15} /> <span style={{ whiteSpace: 'nowrap' }}>{t('product.backToProducts')}</span>
        </button>

        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          <button
            onClick={handleWishlistToggle}
            style={{
              background: isWishlisted ? '#FEF2F2' : 'var(--card-bg)',
              border: `1px solid ${isWishlisted ? '#FCA5A5' : 'var(--border)'}`,
              color: isWishlisted ? '#EF4444' : 'var(--text-light)',
              borderRadius: '10px',
              padding: '6px 10px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 700,
              fontSize: '0.8rem',
              whiteSpace: 'nowrap'
            }}
          >
            <FiHeart size={14} fill={isWishlisted ? '#EF4444' : 'none'} color={isWishlisted ? '#EF4444' : 'currentColor'} />
            <span style={{ whiteSpace: 'nowrap' }}>{isWishlisted ? (isKhmer ? 'បានរក្សាទុក' : 'Saved') : (isKhmer ? 'ចំណូលចិត្ត' : 'Wishlist')}</span>
          </button>
          <button
            onClick={handleShare}
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              borderRadius: '10px',
              padding: '6px 10px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 700,
              fontSize: '0.8rem',
              whiteSpace: 'nowrap'
            }}
          >
            <FiShare2 size={14} /> <span style={{ whiteSpace: 'nowrap' }}>{isKhmer ? 'ចែករំលែក' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/*  TOP MAIN GRID (Product Details Left + Sticky Purchase Widget Right)  */}
      <div className="product-top-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start', marginBottom: '28px' }}>
        
        {/* LEFT COLUMN: Main Product Details Box */}
        <div className="card animate-fade-in" style={{ padding: '24px', borderRadius: '20px', background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
          <div className="product-hero-split" style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '24px', alignItems: 'flex-start' }}>
            
            {/* Left Image Visual (Small Compact Size) */}
            <div 
              onClick={() => setLightboxImage({ url: resolvedImg, name: product.name })}
              style={{
                width: '100%',
                maxWidth: '200px',
                height: '200px',
                maxHeight: '200px',
                margin: '0 auto',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.06) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '1px solid var(--border-light)',
                cursor: 'pointer',
                position: 'relative',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                flexShrink: 0
              }}
              title="Click to view image"
            >
              {resolvedImg ? (
                <img src={resolvedImg} alt={product.name} onError={() => setImgError(true)} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }} />
              ) : (
                <span style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--primary)' }}>
                  {(product.name || '?')[0]}
                </span>
              )}
              <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(15,23,42,0.7)', color: '#fff', padding: '3px 7px', borderRadius: '6px', backdropFilter: 'blur(4px)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FiMaximize2 size={11} /> <span>{isKhmer ? 'មើលរូប' : 'View'}</span>
              </div>
            </div>

            {/* Right Product Overview */}
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              
              {/* Product Title */}
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 10px 0', color: 'var(--text)', lineHeight: 1.3 }}>
                {product.name}
              </h1>

              {/* Star Rating & Review Count */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <FiStar key={star} size={16} fill="#F59E0B" color="#F59E0B" />
                  ))}
                </div>
                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text)' }}>
                  {product.averageRating ? Number(product.averageRating).toFixed(1) : '5.0'}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>
                  | {product.reviewCount ?? 0} {isKhmer ? 'ការវាយតម្លៃ' : 'reviews'}
                </span>
              </div>

              {/* Price Row */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FF2B6D', lineHeight: 1 }}>
                  USD {Number(product.price || 0).toFixed(2)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <del style={{ fontSize: '1.1rem', color: '#94A3B8', fontWeight: 700 }}>
                      USD {Number(product.originalPrice).toFixed(2)}
                    </del>
                    <span style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', fontSize: '0.75rem', fontWeight: 800, padding: '2px 7px', borderRadius: '6px' }}>
                      {product.discountPercent ? `${product.discountPercent}% OFF` : `${Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF`}
                    </span>
                  </div>
                )}
                <span style={{ fontSize: '0.78rem', color: 'var(--text-lighter)', fontWeight: 600 }}>
                  {isKhmer ? 'តម្លៃសរុបគណនាពេលទូទាត់' : 'Price is not final'} <FiInfo size={11} title="Taxes and platform fees calculated at checkout" />
                </span>
              </div>

              {/* Instant Tag & Badges Row */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
                <span style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontSize: '0.75rem', fontWeight: 800, padding: '3px 9px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <FiZap size={12} /> {isKhmer ? 'ដឹកជញ្ជូនភ្លាមៗ' : 'Instant Delivery'}
                </span>
                {product.duration && (
                  <span style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#DB2777', border: '1px solid rgba(236, 72, 153, 0.25)', fontSize: '0.75rem', fontWeight: 800, padding: '3px 9px', borderRadius: '8px' }}>
                    {product.duration}
                  </span>
                )}
                {typeInfo && (
                  <span style={{ background: typeInfo.badgeBg, color: typeInfo.badgeColor, border: `1px solid ${typeInfo.borderColor}`, fontSize: '0.75rem', fontWeight: 800, padding: '3px 9px', borderRadius: '8px' }}>
                    {typeInfo.label}
                  </span>
                )}
              </div>

              {/* Replace Policy Guarantee Card (Interactive) */}
              <div
                onClick={() => setShowPolicyModal(true)}
                style={{
                  background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08), rgba(99, 102, 241, 0.04))',
                  border: '1px solid rgba(79, 70, 229, 0.25)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title={isKhmer ? 'ចុចដើម្បីមើលគោលការណ៍ប្តូរទំនិញ' : 'Click to view replacement policy'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: '#4F46E5', color: '#FFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <FiShield size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#4338CA', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                      <span>{isKhmer ? 'ការធានាប្តូរថ្មី ១ ជំនួស ១ (1-to-1 Replace Policy)' : '1-to-1 Replacement Guarantee'}</span>
                      <MdVerified size={13} color="#10B981" style={{ flexShrink: 0 }} />
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-light)', marginTop: 2, wordBreak: 'break-word', lineHeight: 1.4 }}>
                      {isKhmer ? 'ប្តូរគណនីថ្មីភ្លាមៗប្រសិនបើខុស Password ឬផុតកំណត់មុនពេល' : 'Fast 1-to-1 replacement if credentials fail or expire early'}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4F46E5', textDecoration: 'underline', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {isKhmer ? 'គោលការណ៍' : 'Policy'}
                </span>
              </div>

              {/* Duration Variant Selector (if multiple duration options exist) */}
              {(() => {
                const cleanBaseName = (product?.name || '')
                  .replace(/\b(\d+)\s*(month|months|year|years|day|days|ខែ|ឆ្នាំ|ថ្ងៃ)\b/gi, '')
                  .trim().toLowerCase();
                const siblingVariants = allProductsList.filter(p => {
                  const pClean = (p.name || '')
                    .replace(/\b(\d+)\s*(month|months|year|years|day|days|ខែ|ឆ្នាំ|ថ្ងៃ)\b/gi, '')
                    .trim().toLowerCase();
                  return (p.sellerId || 'admin') === (product?.sellerId || 'admin') && pClean === cleanBaseName;
                });

                if (siblingVariants.length <= 1) return null;

                return (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text)', display: 'block', marginBottom: '6px' }}>
                      {isKhmer ? 'ជ្រើសរើសជម្រើស៖' : 'Select Option:'}
                    </label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {siblingVariants.map(v => {
                        const isSelected = String(v.id) === String(product.id);
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => navigate(`/product/${v.id}`)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontWeight: 800,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              background: isSelected ? 'linear-gradient(135deg, #EC4899, #DB2777)' : 'var(--bg-secondary)',
                              color: isSelected ? '#FFFFFF' : 'var(--text)',
                              border: isSelected ? 'none' : '1px solid var(--border)',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {v.duration || v.name} (${Number(v.price || 0).toFixed(2)})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Specs Box */}
              <div style={{
                background: 'var(--bg-secondary, #F8FAFC)',
                border: '1px solid var(--border-light, #E2E8F0)',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginTop: 'auto'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                  <span style={{ color: 'var(--text-light)' }}>{isKhmer ? 'ចំនួនទិញអប្បបរមា៖' : 'Minimum Purchase:'}</span>
                  <span style={{ fontWeight: 800, color: 'var(--text)' }}>
                    {product.minPurchase || product.minQuantity || 1}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-light)' }}>{isKhmer ? 'បានលក់៖' : 'Sold:'}</span>
                  <span style={{ fontWeight: 800, color: 'var(--text)' }}>
                    {soldCount}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-light)' }}>{isKhmer ? 'រយៈពេលដឹកជញ្ជូនជាមធ្យម៖' : 'Average Delivery Time:'}</span>
                  <span style={{ fontWeight: 700, color: '#059669', fontSize: '0.78rem' }}>
                    {inStock ? (isKhmer ? 'ភ្លាមៗ (១-២ នាទី)' : 'Instant (1-2 mins)') : (isKhmer ? '១០-៣០ នាទី' : '10-30 mins')}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sticky Seller & Purchase Widget Card */}
        <div className="card animate-fade-in" style={{ padding: '20px', borderRadius: '20px', background: 'var(--card-bg)', border: '1px solid var(--border)', position: 'sticky', top: '84px' }}>
          
          {/* Seller Store Header Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            paddingBottom: '14px',
            marginBottom: '16px',
            borderBottom: '1px solid var(--border)'
          }}>
            <Link
              to={product.sellerId ? `/store/${product.sellerId}` : '/store'}
              style={{
                width: '46px', height: '46px', borderRadius: '12px', overflow: 'hidden',
                background: sellerLogo ? `url(${sellerLogo}) center/cover` : 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid var(--border)', flexShrink: 0, textDecoration: 'none',
                cursor: 'pointer'
              }}
              title="Click to view seller store"
            >
              {!sellerLogo && <MdStorefront size={24} color="#2563EB" />}
            </Link>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Link
                  to={product.sellerId ? `/store/${product.sellerId}` : '/store'}
                  style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  title="Click to view seller store"
                >
                  {sellerStoreName}
                </Link>
                <MdVerified size={16} color="#38bdf8" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '2px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 700, color: '#D97706' }}>
                  <FiStar size={12} fill="#F59E0B" color="#F59E0B" /> {sellerRating} / 5.0 ({sellerReviewsCount})
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-lighter)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} /> {isKhmer ? 'អនឡាញ ៣៦ នាទីមុន' : 'Last online 36 minutes ago'}
              </div>
            </div>
          </div>

          {/* Stock Status & Quantity Stepper Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 800, color: inStock ? '#059669' : '#DC2626', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: inStock ? '#10B981' : '#EF4444' }} />
              {isKhmer ? (inStock ? 'មានក្នុងស្តុក' : 'អស់ពីស្តុក') : (inStock ? 'In Stock' : 'Out of stock')}
            </span>

            {/* Stepper */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', borderRadius: '10px', padding: '3px 8px', border: '1px solid var(--border)' }}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', display: 'flex', padding: '4px' }}
                disabled={!inStock || quantity <= 1}
              >
                <FiMinus size={14} />
              </button>
              <span style={{ fontWeight: 800, fontSize: '0.95rem', minWidth: '24px', textAlign: 'center' }}>{quantity}</span>
              <button
                onClick={() => {
                  const maxStock = product.stockCount != null ? product.stockCount : 99;
                  if (quantity >= maxStock) {
                    toast.error(`Product in stock still ${maxStock}`, { id: 'stock-limit' });
                  } else {
                    setQuantity(quantity + 1);
                  }
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', display: 'flex', padding: '4px' }}
                disabled={!inStock}
              >
                <FiPlus size={14} />
              </button>
            </div>
          </div>

          {/* Collapsible "Add note for seller" Dropdown */}
          <div style={{ marginBottom: '16px' }}>
            <button
              onClick={() => setIsNoteOpen(!isNoteOpen)}
              style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-light)',
                display: 'inline-flex', alignItems: 'center', gap: '4px'
              }}
            >
              {isKhmer ? 'បន្ថែមចំណាំផ្ញើទៅអ្នកលក់' : 'Add note for seller'} {isNoteOpen ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
            </button>

            {isNoteOpen && (
              <textarea
                value={sellerNote}
                onChange={(e) => setSellerNote(e.target.value)}
                placeholder={isKhmer ? 'សរសេរចំណាំផ្ញើទៅអ្នកលក់...' : 'Type note for seller (e.g. preferred delivery method)...'}
                rows={2}
                style={{
                  width: '100%', marginTop: '8px', padding: '8px 12px',
                  borderRadius: '10px', border: '1px solid var(--border)',
                  fontSize: '0.82rem', fontFamily: 'inherit', background: 'var(--bg-secondary)',
                  color: 'var(--text)', outline: 'none', resize: 'none'
                }}
              />
            )}
          </div>

          {/* Email for Invite Input - FOR ACCOUNT SHARING & INVITE LINK */}
          {isInviteOrSharingProduct && (
            <div style={{
              marginBottom: '16px',
              padding: '14px',
              background: emailError ? 'rgba(239, 68, 68, 0.05)' : 'linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, rgba(37, 99, 235, 0.02) 100%)',
              border: emailError ? '1.5px solid #EF4444' : '1.5px solid #3B82F6',
              borderRadius: '14px',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  color: emailError ? '#DC2626' : '#1E40AF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <FiMail color={emailError ? '#EF4444' : '#2563EB'} size={16} /> 
                  <span>
                    {isKhmer 
                      ? (isInviteLinkType ? 'អ៊ីមែលសម្រាប់ទទួលតំណភ្ជាប់អញ្ជើញ (Email for Invite Link)' : 'អ៊ីមែលសម្រាប់ទទួល Invite (Email for Delivery)') 
                      : (isInviteLinkType ? 'Email for Invite Link (Required)' : 'Email for Delivery (Invite Account)')}
                  </span>
                </label>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 900,
                  padding: '2px 6px',
                  borderRadius: '6px',
                  background: emailError ? '#FEE2E2' : '#DBEAFE',
                  color: emailError ? '#DC2626' : '#1D4ED8',
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase'
                }}>
                  {isKhmer ? 'ចាំបាច់' : 'Required'}
                </span>
              </div>

              <div style={{ fontSize: '0.75rem', color: emailError ? '#DC2626' : '#475569', marginBottom: '10px', lineHeight: 1.45 }}>
                {emailError
                  ? (isKhmer ? '* សូមបញ្ចូលអ៊ីមែលត្រឹមត្រូវដើម្បីទទួលតំណភ្ជាប់អញ្ជើញ (Invite Link) មុនពេលទូទាត់' : '* Please enter a valid email address to receive your invite link before paying')
                  : (isKhmer ? 'អ្នកលក់នឹងផ្ញើតំណភ្ជាប់អញ្ជើញ (Invite Link) ឬការអញ្ជើញទៅកាន់អ៊ីមែលនេះ។' : 'Your invitation link or family/team invite will be sent to this email address.')}
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={buyerInviteEmail}
                  onChange={(e) => {
                    setBuyerInviteEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  placeholder={isKhmer ? 'បញ្ចូលអ៊ីមែល (ឧ. yourname@gmail.com)...' : 'Enter your email (e.g. yourname@gmail.com)...'}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '9px',
                    border: emailError ? '1.5px solid #EF4444' : '1.5px solid #3B82F6',
                    background: 'var(--card-bg, #FFFFFF)',
                    color: 'var(--text, #0F172A)',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    outline: 'none',
                    boxShadow: emailError ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : '0 0 0 3px rgba(59, 130, 246, 0.12)'
                  }}
                />
              </div>

              <div style={{
                marginTop: '8px',
                fontSize: '0.72rem',
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span style={{ color: '#2563EB', fontWeight: 800 }}>&bull;</span>
                <span>{isKhmer ? 'សូមប្រាកដថាជាអ៊ីមែលដែលអ្នកអាចបើកមើល Inbox បាន ដើម្បីចុចទទួល Invite។' : 'Ensure you have access to this email to accept the invite.'}</span>
              </div>
            </div>
          )}

          {/* Coupon Code Input Box */}
          <div style={{
            marginBottom: '16px',
            padding: '12px',
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border)'
          }}>
            <label style={{
              fontSize: '0.82rem',
              fontWeight: 800,
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '8px'
            }}>
              <FiTag size={15} color="#10B981" />
              <span>{isKhmer ? 'កូដបញ្ចុះតម្លៃ (COUPON CODE)' : 'COUPON CODE'}</span>
            </label>

            {appliedCoupon ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 900, color: '#059669', fontSize: '0.92rem', letterSpacing: '0.04em' }}>{appliedCoupon.code}</span>
                  <span style={{ background: '#059669', color: '#fff', fontSize: '0.72rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                    -${couponDiscountAmount.toFixed(2)} OFF
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.78rem', fontWeight: 700 }}
                  title="Remove coupon"
                >
                  <FiX size={14} /> {isKhmer ? 'លុប' : 'Remove'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder={isKhmer ? 'បញ្ចូលកូដបញ្ចុះតម្លៃ...' : 'Enter promo code...'}
                  value={couponCodeInput}
                  onChange={e => setCouponCodeInput(e.target.value.toUpperCase())}
                  disabled={validatingCoupon || isSubmittingPayment}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--card-bg)',
                    color: 'var(--text)',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={validatingCoupon || !couponCodeInput.trim() || isSubmittingPayment}
                  className="btn btn-primary"
                  style={{ padding: '8px 12px', fontSize: '0.82rem', fontWeight: 800, whiteSpace: 'nowrap', borderRadius: '8px' }}
                >
                  {validatingCoupon ? '...' : (isKhmer ? 'ប្រើ' : 'Apply')}
                </button>
              </form>
            )}
          </div>

          {/* TOTAL AMOUNT Display */}
          <div style={{
            marginBottom: '16px',
            padding: '12px 14px',
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border)'
          }}>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-light)', fontWeight: 800, letterSpacing: '0.04em', marginBottom: '2px' }}>
              {isKhmer ? 'តម្លៃសរុប (TOTAL AMOUNT)' : 'TOTAL AMOUNT'}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A' }}>
                ${totalToPay.toFixed(2)}
              </span>
              {appliedCoupon && (
                <span style={{ fontSize: '0.88rem', color: '#64748B', textDecoration: 'line-through' }}>
                  ${subtotalNum.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* Payment Method Selector Card */}
          <div style={{
            marginBottom: '16px',
            padding: '12px 14px',
            background: 'var(--card-bg)',
            borderRadius: '12px',
            border: '2px solid #2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: '#D12027', color: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: '0.72rem', letterSpacing: '0.02em',
                flexShrink: 0
              }}>
                KHQR
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text)' }}>
                  ABA KHQR
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-light)' }}>
                  {isKhmer ? 'ស្កែនទូទាត់ជាមួយ App ធនាគារទាំងអស់' : 'Scan & Pay with any banking app'}
                </div>
              </div>
            </div>
            <div style={{
              width: '18px', height: '18px', borderRadius: '50%',
              border: '5px solid #2563EB', background: '#FFFFFF', flexShrink: 0
            }} />
          </div>

          {/* Action Buttons Row: Chat, AddToCart, Pay Now */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <button
              onClick={handleChatSeller}
              title="Chat with seller"
              style={{
                width: '44px', height: '44px', borderRadius: '12px',
                border: '1px solid #F97316', background: '#FFF7ED',
                color: '#EA580C', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}
            >
              <FiMessageSquare size={18} />
            </button>

            <button
              onClick={() => handleAddToCart()}
              title="Add to cart"
              disabled={!inStock}
              style={{
                width: '44px', height: '44px', borderRadius: '12px',
                border: '1px solid #F97316', background: '#FFF7ED',
                color: '#EA580C', cursor: inStock ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                opacity: inStock ? 1 : 0.5
              }}
            >
              <FiShoppingCart size={18} />
            </button>

            <button
              onClick={handleBuyNow}
              disabled={!inStock || isSubmittingPayment}
              style={{
                flex: 1, height: '44px', borderRadius: '12px',
                background: (isSubmittingPayment || isPaymentModalOpen)
                  ? '#334155'
                  : 'linear-gradient(135deg, #FF4500 0%, #FF8C00 100%)',
                color: '#FFFFFF', border: 'none', fontWeight: 900,
                fontSize: '1rem', cursor: (inStock && !isSubmittingPayment) ? 'pointer' : 'not-allowed',
                boxShadow: (isSubmittingPayment || isPaymentModalOpen) ? 'none' : '0 4px 14px rgba(255, 69, 0, 0.35)',
                opacity: inStock ? 1 : 0.5,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              <style>{`
                @keyframes spinLoader {
                  to { transform: rotate(360deg); }
                }
              `}</style>
              {isSubmittingPayment ? (
                <>
                  <span style={{
                    width: '16px', height: '16px',
                    border: '2.5px solid rgba(255,255,255,0.35)',
                    borderTopColor: '#FFFFFF',
                    borderRadius: '50%',
                    animation: 'spinLoader 0.75s linear infinite',
                    display: 'inline-block'
                  }} />
                  <span>{isKhmer ? 'កំពុងរៀបចំ QR...' : 'Preparing QR...'}</span>
                </>
              ) : isPaymentModalOpen ? (
                <span>{isKhmer ? 'កំពុងរង់ចាំការទូទាត់...' : 'Waiting for payment...'}</span>
              ) : (
                <span>{isKhmer ? 'ទូទាត់ឥឡូវ' : 'Pay Now'}</span>
              )}
            </button>
          </div>

        </div>
      </div>

      {/*  SECOND SECTION: Product Description Card (Collapsible)  */}
      <div className="card animate-fade-in" style={{ padding: '24px', borderRadius: '20px', background: 'var(--card-bg)', border: '1px solid var(--border)', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px', color: 'var(--text)' }}>
          {isKhmer ? 'ការពិពណ៌នាអំពីទំនិញ' : 'Product Description'}
        </h2>

        <div style={{
          maxHeight: isDescExpanded ? 'none' : '120px',
          overflow: 'hidden',
          position: 'relative',
          lineHeight: 1.6,
          color: 'var(--text-light)',
          fontSize: '0.92rem',
          whiteSpace: 'pre-line'
        }}>
          {product.description || `SPOTIFY 1 MONTH\n***** NO NEED TO ASK IF READY, WHEN YOU ORDER IT GOES DIRECTLY INTO PROCESS *****\nSpotify Premium FULL WARRANTY`}
          
          {!isDescExpanded && (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px',
              background: 'linear-gradient(to bottom, transparent, var(--card-bg))'
            }} />
          )}
        </div>

        <button
          onClick={() => setIsDescExpanded(!isDescExpanded)}
          style={{
            background: 'none', border: 'none', color: '#6366F1', fontWeight: 800,
            fontSize: '0.88rem', cursor: 'pointer', marginTop: '12px',
            display: 'inline-flex', alignItems: 'center', gap: '4px'
          }}
        >
          {isKhmer ? (isDescExpanded ? 'មើលតិចជាងមុន ∧' : 'មើលបន្ថែម ∨') : (isDescExpanded ? 'See less ∧' : 'See more ∨')}
        </button>
      </div>

      {/*  THIRD SECTION: How to Trade / Delivery Guide Card  */}
      <div className="card animate-fade-in" style={{ padding: '24px', borderRadius: '20px', background: 'var(--card-bg)', border: '1px solid var(--border)', marginBottom: '28px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px', color: 'var(--text)' }}>
          {isKhmer ? `របៀបទិញ និងប្រើប្រាស់ ${product.name}` : `How to Trade ${product.name}`}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#EEF2FF', color: '#4F46E5', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>
              1
            </span>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-light)', lineHeight: 1.5 }}>
              {isKhmer
                ? 'ជ្រើសរើសជម្រើសទំនិញដែលអ្នកពេញចិត្ត បញ្ចូលចំនួនដែលចង់ទិញ និងចុចប៊ូតុង «ទូទាត់ឥឡូវ»។'
                : 'Select an account option from the provided merchandise, specify quantity, and complete your purchase.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#EEF2FF', color: '#4F46E5', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>
              2
            </span>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-light)', lineHeight: 1.5 }}>
              {isKhmer
                ? 'ព័ត៌មានគណនីរបស់អ្នកនឹងត្រូវផ្ញើជូនភ្លាមៗនៅលើទំព័រ «ប្រវត្តិនៃការបញ្ជាទិញ» និងតាមរយៈសារជូនដំណឹង។'
                : 'Your digital credentials will be delivered instantly to your Order History page and sent via email notification.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#EEF2FF', color: '#4F46E5', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>
              3
            </span>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-light)', lineHeight: 1.5 }}>
              {isKhmer 
                ? 'ចូលប្រើប្រាស់ដើម្បីពិនិត្យគណនីរបស់អ្នក។ អ្នកទទួលបានការធានាប្តូរថ្មី ១ ជំនួស ១ ពេញលេញ! ប្រសិនបើមានបញ្ហា សូមទាក់ទងអ្នកលក់ក្នុង Chat ឬរាយការណ៍បញ្ហាដើម្បីប្តូរថ្មីភ្លាមៗ។'
                : 'Log in to verify your account credentials. Enjoy full 1-to-1 replacement warranty throughout your active duration! If any issue arises, message the seller in Chat or Report Issue for fast replacement.'}
            </p>
          </div>
        </div>
      </div>

      {/*  FOURTH SECTION: Customer Reviews & Ratings  */}
      <ProductRatingsSection productId={product.id} />

      {/*  FIFTH SECTION: People Also Buy Grid  */}
      {otherProducts.length > 0 && (
        <div style={{ width: '100%', marginTop: '36px', borderTop: '1px solid var(--border)', paddingTop: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text)', fontWeight: 800, margin: 0, borderLeft: '4px solid #FF2B6D', paddingLeft: '10px' }}>
              {t('product.peopleAlsoBuy')}
            </h2>
            <Link to="/store" className="btn btn-outline btn-sm">{t('product.viewAllStoreItems')}</Link>
          </div>

          <div className="grid grid-4">
            {otherProducts.slice(0, 8).map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div style={{ position: 'relative', maxWidth: '600px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <img src={lightboxImage.url} alt={lightboxImage.name} style={{ width: '100%', height: 'auto', borderRadius: '16px' }} />
            <button
              onClick={() => setLightboxImage(null)}
              style={{ position: 'absolute', top: '-14px', right: '-14px', background: '#ffffff', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <FiX size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Contact Seller Modal (Website Chat / Telegram Account / Telegram Channel) */}
      <ContactSellerModal
        isOpen={showContactSellerModal}
        onClose={() => setShowContactSellerModal(false)}
        seller={sellerProfile || {
          id: product.sellerId,
          sellerId: product.sellerId,
          storeName: sellerStoreName,
          storeLogoUrl: sellerLogo,
          telegramUsername: product.sellerTelegramUsername,
          telegramChannel: product.sellerTelegramChannel,
          preferredContactMethod: product.sellerPreferredContactMethod
        }}
        productId={product.id}
        productName={product.name}
      />

      {/* Policy Modal for Replacement & Buyer/Seller Guarantees */}
      <PolicyModal
        isOpen={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        initialTab="replacement"
      />

      {/*  CONFIRM YOUR ORDER MODAL (Matching video frames 00:02 - 00:04)  */}
      {showConfirmOrderModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9997,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}
        onClick={() => setShowConfirmOrderModal(false)}
        >
          <div
            className="animate-slide-up"
            style={{
              width: '100%',
              maxWidth: '440px',
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
              border: '1px solid #E2E8F0',
              color: '#0F172A'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>
              {isKhmer ? 'ផ្ទៀងផ្ទាត់ការបញ្ជាទិញរបស់អ្នក' : 'Confirm your order'}
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 18px', fontWeight: 500 }}>
              {isKhmer ? 'សូមពិនិត្យព័ត៌មានលម្អិតមុនពេលទូទាត់ប្រាក់' : 'Review the details before you pay'}
            </p>

            {/* Product Summary Box */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              background: '#F8FAFC',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '10px',
                background: resolvedImg ? `url(${resolvedImg}) center/cover` : '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: '0.85rem',
                flexShrink: 0,
                border: '1px solid #CBD5E1'
              }}>
                {!resolvedImg && (product.name?.slice(0, 2)?.toUpperCase() || 'PRO')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {product.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                  {product.category?.name || typeInfo?.label || 'Media / TV / Store'}
                </div>
              </div>
            </div>

            {/* Details Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748B', fontWeight: 500 }}>{isKhmer ? 'ជម្រើស (Option)' : 'Option'}</span>
                <span style={{ fontWeight: 700, color: '#0F172A', maxWidth: '240px', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {product.duration || typeInfo?.label || product.name}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748B', fontWeight: 500 }}>{isKhmer ? 'ចំនួន (Quantity)' : 'Quantity'}</span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>{quantity}</span>
              </div>

              {/* Only show email row for Account Sharing or Invite Link */}
              {isInviteOrSharingProduct && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>
                    {isKhmer 
                      ? (isInviteLinkType ? 'អ៊ីមែលទទួលតំណភ្ជាប់អញ្ជើញ' : 'អ៊ីមែលទទួល Invite') 
                      : (isInviteLinkType ? 'Invite Link Email' : 'Invite Email')}
                  </span>
                  <span style={{ fontWeight: 700, color: '#0F172A', wordBreak: 'break-all', maxWidth: '220px', textAlign: 'right' }}>
                    {buyerInviteEmail || 'N/A'}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748B', fontWeight: 500 }}>{isKhmer ? 'វិធីទូទាត់ (Payment)' : 'Payment'}</span>
                <span style={{ fontWeight: 800, color: '#1E40AF', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ background: '#D12027', color: '#FFF', fontSize: '0.68rem', fontWeight: 900, padding: '1px 5px', borderRadius: '4px' }}>KHQR</span>
                  ABA KHQR
                </span>
              </div>

              {appliedCoupon && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#059669' }}>
                  <span style={{ fontWeight: 600 }}>{isKhmer ? `កូដបញ្ចុះតម្លៃ (${appliedCoupon.code})` : `Coupon (${appliedCoupon.code})`}</span>
                  <span style={{ fontWeight: 800 }}>-USD {couponDiscountAmount.toFixed(2)}</span>
                </div>
              )}

              <div style={{ height: '1px', background: '#E2E8F0', margin: '4px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.92rem' }}>{isKhmer ? 'សរុប (TOTAL)' : 'TOTAL'}</span>
                <span style={{ fontWeight: 900, color: '#0F172A', fontSize: '1.25rem' }}>
                  ${totalToPay.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Note */}
            <p style={{ fontSize: '0.74rem', color: '#64748B', lineHeight: 1.4, margin: '0 0 20px', padding: '8px 10px', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
              {isKhmer
                ? 'ផ្ទាំង ABA KHQR នឹងបើកឡើងបន្ទាប់ពីអ្នកបញ្ជាក់។ សូមកុំទាន់បិទទំព័ររហូតដល់ទូទាត់រួចរាល់។'
                : 'The ABA KHQR window opens after you confirm. Keep this page open until payment completes.'}
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowConfirmOrderModal(false)}
                style={{
                  flex: 1,
                  height: '42px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  background: '#F8FAFC',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                {isKhmer ? 'បោះបង់' : 'Cancel'}
              </button>

              <button
                type="button"
                disabled={isSubmittingPayment}
                onClick={executeOrderAndPay}
                style={{
                  flex: 1.4,
                  height: '42px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: isSubmittingPayment ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isSubmittingPayment ? (
                  <>
                    <span style={{
                      width: '16px', height: '16px',
                      border: '2.5px solid rgba(255,255,255,0.35)',
                      borderTopColor: '#FFFFFF',
                      borderRadius: '50%',
                      animation: 'spinLoader 0.75s linear infinite',
                      display: 'inline-block'
                    }} />
                    <span>{isKhmer ? 'កំពុងរៀបចំ QR...' : 'Preparing QR...'}</span>
                  </>
                ) : (
                  <span>{isKhmer ? 'ទូទាត់ឥឡូវ' : 'Pay Now'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confetti on Payment Success */}
      {showConfetti && <ConfettiEffect />}

      {/* KHQR PAYMENT MODAL DIRECTLY ON PRODUCT PAGE */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        order={activeOrder}
        onPaymentSuccess={(updatedOrder) => {
          setIsPaymentModalOpen(false);
          setShowConfetti(true);
          const targetOrderId = updatedOrder?.id || activeOrder?.id;
          if (targetOrderId) {
            toast.success(isKhmer ? 'ការទូទាត់ប្រាក់ទទួលបានជោគជ័យ!' : 'Payment verified successfully!');
            setTimeout(() => navigate('/orders/' + targetOrderId), 1800);
          }
        }}
        onPaymentExpired={() => {
          setIsPaymentModalOpen(false);
          toast.error(isKhmer ? 'ការទូទាត់ប្រាក់ផុតកំណត់។ សូមចុចទិញម្តងទៀត។' : 'Payment expired. Please click Buy again.');
        }}
      />

    </div>
  );
};

export default ProductPage;
