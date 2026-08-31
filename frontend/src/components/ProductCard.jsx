import React from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { FiCheckCircle, FiStar } from 'react-icons/fi';
import { MdStorefront, MdVerified } from 'react-icons/md';
import { getProductImageUrl } from '../utils/productImages';
import { normalizeImageUrl } from '../utils/imageUrl';
import { getProductTypeInfo, getProductLabelInfo, resolveProductLabelInfo } from '../utils/productOptions';

const ProductCard = ({ product: initialProduct, variants = [] }) => {
  const [activeProduct, setActiveProduct] = React.useState(initialProduct);

  React.useEffect(() => {
    setActiveProduct(initialProduct);
  }, [initialProduct]);

  const product = activeProduct;
  const { addItem } = useCart();
  const { t, isKhmer, lang } = useLanguage();
  const navigate = useNavigate();
  const inStock = product.stockCount > 0;

  // Calculate sold count strictly from authentic backend/product data
  const rawSold = product.soldCount ?? product.salesCount ?? product.sold ?? product.totalSold;
  const soldCount = rawSold !== undefined ? Number(rawSold) : 0;
  const is70PlusSold = soldCount >= 70;

  const handleBuyNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inStock) {
      navigate(`/product/${product.id}`);
    } else {
      toast.error(t('product.outOfStockToast'), {
        duration: 3000,
        style: {
          fontWeight: 600,
          fontSize: '0.88rem',
        },
      });
    }
  };

  const [imgError, setImgError] = React.useState(false);
  const brandFallback = getProductImageUrl(product.name, '');
  const resolvedImg = !imgError && product.imageUrl ? normalizeImageUrl(product.imageUrl) : brandFallback;

  return (
    <div className="product-card-container card animate-fade-in">
      <Link to={`/product/${product.id}`} className="product-card-link">
        {/* Product Image / Visual Badge */}
        <div className="product-image-wrapper">
          {resolvedImg ? (
            <img
              src={resolvedImg}
              alt={product.name}
              loading="lazy"
              className="product-img"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="product-avatar-fallback">
              {(product.name || '?')[0]}
            </span>
          )}

          {/* Badge Display (HOT, BEST SELLER, PROMO, etc.) */}
          {(() => {
            const labelInfo = resolveProductLabelInfo(product, isKhmer);
            if (labelInfo) {
              return (
                <div className="badge-pos-left">
                  <span className="badge" style={{
                    background: labelInfo.badgeBg || 'linear-gradient(135deg, #FF4500 0%, #FF8C00 100%)',
                    color: '#ffffff',
                    fontWeight: 900,
                    boxShadow: '0 4px 14px rgba(255, 69, 0, 0.4)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    borderRadius: '8px'
                  }}>
                    {labelInfo.badgeText || labelInfo.label}
                  </span>
                </div>
              );
            }
            if (product.isNew || (product.createdAt && (Date.now() - new Date(product.createdAt).getTime()) < 14 * 24 * 60 * 60 * 1000)) {
              return (
                <div className="badge-pos-left">
                  <span className="badge" style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#ffffff',
                    fontWeight: 900,
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    borderRadius: '8px'
                  }}>
                    {isKhmer ? 'ថ្មី' : 'NEW'}
                  </span>
                </div>
              );
            }
            if (product.isBestSeller) {
              return (
                <div className="badge-pos-left">
                  <span className="badge" style={{
                    background: 'linear-gradient(135deg, #FF4500 0%, #FF8C00 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    boxShadow: '0 4px 12px rgba(255, 69, 0, 0.35)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    borderRadius: '8px'
                  }}>
                    {t('product.bestSeller')}
                  </span>
                </div>
              );
            }
            return null;
          })()}

          {!inStock && (
            <div className="badge-pos-left">
              <span className="badge" style={{
                background: 'rgba(15, 23, 42, 0.75)',
                color: '#ffffff',
                fontWeight: 700,
                padding: '4px 10px',
                fontSize: '0.72rem',
                borderRadius: '9999px',
                backdropFilter: 'blur(4px)'
              }}>
                {t('product.outOfStock')}
              </span>
            </div>
          )}
        </div>

        {/* Title, Seller Badge, Price & Badges */}
        <div className="product-info-box">
          <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '6px', gap: '6px' }}>
            {(() => {
              const targetSellerId = product.sellerId || product.seller?.id || product.sellerProfile?.userId || product.sellerProfile?.id;
              const storeLabel = product.sellerStoreName || product.sellerName || product.sellerStore || (isKhmer ? 'ហាងផ្លូវការ' : 'Official Store');
              return (
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (targetSellerId) {
                      navigate(`/store/${targetSellerId}`);
                    } else {
                      navigate('/store');
                    }
                  }}
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: '#4F46E5',
                    background: 'rgba(79, 70, 229, 0.08)',
                    border: '1px solid rgba(79, 70, 229, 0.22)',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    cursor: 'pointer',
                    transition: 'var(--transition)'
                  }}
                  className="product-card-seller-badge"
                  title={targetSellerId ? `View ${storeLabel}` : 'View Store'}
                >
                  <MdStorefront size={12} /> {storeLabel} <MdVerified size={13} color="#1d9bf0" />
                </span>
              );
            })()}
          </div>

          <h3 className="product-title">
            {product.name}
          </h3>

          {/* Duration Pill Badges / Variant Selector */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', margin: '6px 0 8px' }}>
            {/* If variants exist, show clickable duration selection pills */}
            {variants && variants.length > 1 ? (
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', width: '100%', marginTop: '4px' }}>
                {variants.map(v => {
                  const isSelected = v.id === product.id;
                  const vDuration = v.duration || 'Standard';
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveProduct(v);
                      }}
                      style={{
                        background: isSelected ? 'linear-gradient(135deg, #EC4899, #DB2777)' : 'rgba(236, 72, 153, 0.08)',
                        color: isSelected ? '#FFFFFF' : '#DB2777',
                        border: isSelected ? 'none' : '1px solid rgba(236, 72, 153, 0.3)',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      title={`Switch to ${vDuration} ($${(v.price || 0).toFixed(2)})`}
                    >
                      {vDuration}
                    </button>
                  );
                })}
              </div>
            ) : product.duration ? (
              <span style={{
                background: 'rgba(236, 72, 153, 0.12)',
                color: '#DB2777',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                fontSize: '0.73rem',
                fontWeight: 800,
                padding: '3px 9px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center'
              }}>
                {product.duration}
              </span>
            ) : null}
          </div>

          {/* Rating Row & Price */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 8px 0', gap: '6px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#FF2A6D' }}>
                ${product.price ? Number(product.price).toFixed(2) : '0.00'}
              </span>
              {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                <>
                  <span style={{ fontSize: '0.8rem', color: '#94A3B8', textDecoration: 'line-through', fontWeight: 600 }}>
                    ${Number(product.originalPrice).toFixed(2)}
                  </span>
                  <span style={{
                    background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    fontSize: '0.68rem', fontWeight: 900, padding: '1px 5px', borderRadius: '4px'
                  }}>
                    -{Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)}%
                  </span>
                </>
              )}
            </div>

            {/* Prominent Compact Star Rating Badge */}
            <div style={{
              background: '#FFFBEB',
              border: '1px solid #FCD34D',
              borderRadius: '6px',
              padding: '2px 6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px'
            }}>
              <FiStar size={10} fill="#F59E0B" color="#F59E0B" />
              <span style={{ fontWeight: 800, color: '#92400E', fontSize: '0.72rem' }}>
                {product.averageRating ? Number(product.averageRating).toFixed(1) : '5.0'}
              </span>
              <span style={{ fontSize: '0.68rem', color: '#B45309', fontWeight: 600 }}>
                ({product.reviewCount ? product.reviewCount : (product.id % 7 + 1)})
              </span>
            </div>
          </div>

          {/* Stock Status */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginTop: 'auto' }}>
            <span style={{
              background: inStock ? '#d1fae5' : '#fee2e2',
              color: inStock ? '#047857' : '#dc2626',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {inStock ? t('product.inStock') : t('product.outOfStock')}
            </span>
          </div>
        </div>
      </Link>

      {/* Footer: Buy Now Pill Button */}
      <div className="product-card-footer" style={{ borderTop: 'none', paddingTop: '10px' }}>
        <button
          className="btn product-buy-btn"
          onClick={handleBuyNow}
          style={{ 
            width: '100%',
            background: inStock ? 'linear-gradient(135deg, #FF4B8B 0%, #FF2B6D 100%)' : '#E2E8F0',
            color: inStock ? '#ffffff' : '#94A3B8',
            borderRadius: '14px',
            padding: '11px 16px',
            fontSize: '0.92rem',
            fontWeight: 800,
            border: 'none',
            boxShadow: inStock ? '0 6px 18px rgba(255, 43, 109, 0.35)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inStock ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            letterSpacing: '0.2px'
          }}
          disabled={!inStock}
        >
          {inStock ? t('product.buyNow') : t('product.outOfStock')}
        </button>
      </div>

      <style>{`
        .product-card-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 14px;
          border-radius: var(--radius);
          background-color: var(--card-bg);
          border: 1px solid var(--border);
          transition: var(--transition);
          position: relative;
          overflow: hidden;
        }
        .product-card-container:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-hover);
          border-color: var(--primary-glow);
        }
        .product-card-container:hover .product-img {
          transform: scale(1.06);
        }
        .product-card-link {
          display: flex;
          flex-direction: column;
          flex: 1;
          text-decoration: none;
        }
        .product-image-wrapper {
          width: 100%;
          aspect-ratio: 16/10;
          background: linear-gradient(135deg, var(--primary-light) 0%, var(--secondary-light) 100%);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          fontSize: 2.5rem;
          fontWeight: 800;
          color: var(--primary);
          margin-bottom: 12px;
          overflow: hidden;
          position: relative;
        }
        .product-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .product-avatar-fallback {
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-size: 2.8rem;
          font-weight: 800;
        }
        .badge-pos-left {
          position: absolute;
          top: 10px;
          left: 10px;
        }
        .badge-pos-right {
          position: absolute;
          top: 10px;
          right: 10px;
        }
        .product-info-box {
          display: flex;
          flex-direction: column;
          margin-bottom: 8px;
          flex: 1;
        }
        .product-title {
          font-size: 1.02rem;
          font-weight: 800;
          margin: 0;
          color: var(--text);
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .product-card-footer {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: auto;
        }

        /* Mobile specific styling for 2 columns per row */
        @media (max-width: 640px) {
          .product-card-container {
            padding: 10px 10px 12px;
            border-radius: 14px;
          }
          .product-image-wrapper {
            margin-bottom: 8px;
            border-radius: 10px;
          }
          .product-avatar-fallback {
            font-size: 2.2rem;
          }
          .product-title {
            font-size: 0.88rem;
            line-height: 1.25;
          }
          .product-buy-btn {
            padding: 10px 12px !important;
            font-size: 0.85rem !important;
            border-radius: 14px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductCard;
