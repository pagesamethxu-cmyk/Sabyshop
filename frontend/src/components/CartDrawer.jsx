import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import {
  FiX, FiMinus, FiPlus, FiTrash2, FiShoppingCart,
  FiArrowRight, FiPackage, FiMail
} from 'react-icons/fi';
import ConfirmRemoveCartModal from './ConfirmRemoveCartModal';
import { getProductImageUrl } from '../utils/productImages';
import { getProductTypeInfo } from '../utils/productOptions';
import emptyStateImg from '../assets/empty-state.png';

const CartDrawer = ({ isOpen, onClose }) => {
  const { items, addItem, updateQuantity, removeItem, totalPrice } = useCart();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [itemToRemove, setItemToRemove] = useState(null);

  if (!isOpen) return null;

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  const handleDecreaseQuantity = (item) => {
    if (item.quantity <= 1) {
      setItemToRemove(item);
    } else {
      updateQuantity(item.product.id, item.quantity - 1);
    }
  };

  const handleConfirmRemove = () => {
    if (itemToRemove) {
      removeItem(itemToRemove.product.id);
      setItemToRemove(null);
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes cartOverlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .cart-item-row:hover {
          background: var(--bg-secondary) !important;
        }
        .cart-qty-btn:hover {
          background: var(--primary-light) !important;
          color: var(--primary) !important;
        }
        .cart-remove-btn:hover {
          color: var(--danger) !important;
          background: var(--danger-light) !important;
        }
      `}</style>

      {/* Overlay */}
      <div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(6px)',
          zIndex: 3000,
          animation: 'cartOverlayIn 0.25s ease forwards',
        }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '100%', maxWidth: '420px',
        backgroundColor: 'var(--card-bg)',
        zIndex: 3001,
        boxShadow: '-8px 0 40px rgba(15, 23, 42, 0.15)',
        display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--card-bg)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'var(--primary-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FiShoppingCart size={18} color="var(--primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>{t('cart.title')}</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-lighter)', margin: 0 }}>
                {items.length} {items.length !== 1 ? t('cart.items') : t('cart.item')}
              </p>
            </div>
          </div>
          <button
            id="cart-drawer-close"
            onClick={onClose}
            style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'var(--bg-secondary)', border: 'none',
              cursor: 'pointer', color: 'var(--text-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'var(--transition)',
            }}
            aria-label="Close cart"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {items.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              textAlign: 'center', padding: '40px 16px',
              height: '100%',
              gap: '16px',
            }}>
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  position: 'absolute',
                  width: '100px',
                  height: '100px',
                  background: 'radial-gradient(circle, rgba(255, 71, 133, 0.22) 0%, transparent 70%)',
                  borderRadius: '50%',
                  filter: 'blur(14px)',
                  zIndex: 0,
                  pointerEvents: 'none'
                }} />
                <img 
                  src={emptyStateImg} 
                  alt="Empty Cart" 
                  style={{
                    width: '120px',
                    height: '120px',
                    objectFit: 'contain',
                    position: 'relative',
                    zIndex: 1,
                    filter: 'drop-shadow(0 8px 20px rgba(255, 71, 133, 0.22))',
                    animation: 'emptyStateFloat 4s ease-in-out infinite'
                  }}
                  onError={(e) => { e.target.src = '/images/empty-state.png'; }}
                />
              </div>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text)', marginBottom: '6px' }}>{t('cart.emptyTitle')}</h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.88rem', maxWidth: '280px', lineHeight: 1.5 }}>
                  {t('cart.emptyDesc')}
                </p>
              </div>
              <button
                id="cart-continue-shopping-empty"
                className="btn btn-primary"
                onClick={() => { onClose(); navigate('/store'); }}
                style={{
                  marginTop: '6px',
                  padding: '10px 24px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  boxShadow: '0 4px 14px rgba(255, 71, 133, 0.35)'
                }}
              >
                {t('cart.browseProducts')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="cart-item-row"
                  style={{
                    display: 'flex', gap: '14px', padding: '14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    transition: 'var(--transition)',
                    background: 'var(--card-bg)',
                  }}
                >
                  {/* Product Image */}
                  <div style={{
                    width: '60px', height: '60px', borderRadius: '10px',
                    background: 'var(--primary-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)',
                    overflow: 'hidden', flexShrink: 0,
                    border: '1px solid var(--border)',
                  }}>
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                      />
                    ) : (
                      (item.product.name || '?')[0]
                    )}
                  </div>

                  {/* Product Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{
                      margin: '0 0 2px 0', fontSize: '0.9rem', fontWeight: 700,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {item.product.name}
                    </h4>

                    {/* Account Type & Duration Badge (Displayed at checkout) */}
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap', margin: '2px 0 6px' }}>
                      {(() => {
                        const typeInfo = getProductTypeInfo(item.product?.productType || 'ACCOUNT');
                        return (
                          <span style={{
                            background: typeInfo?.badgeBg || '#EEF2FF',
                            color: typeInfo?.badgeColor || '#4F46E5',
                            border: `1px solid ${typeInfo?.borderColor || '#C7D2FE'}`,
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '6px',
                            display: 'inline-flex'
                          }}>
                            {typeInfo?.label || 'គណនីពេញលេញ'}
                          </span>
                        );
                      })()}
                      {item.product?.duration && (
                        <span style={{
                          background: 'rgba(236, 72, 153, 0.1)',
                          color: '#DB2777',
                          border: '1px solid rgba(236, 72, 153, 0.25)',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '6px'
                        }}>
                          {item.product.duration}
                        </span>
                      )}
                      {item.buyerInviteEmail && (
                        <span style={{
                          background: '#EFF6FF',
                          color: '#2563EB',
                          border: '1px solid #BFDBFE',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '6px',
                          maxWidth: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }} title={`Invite to: ${item.buyerInviteEmail}`}>
                          <FiMail size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />{item.buyerInviteEmail}
                        </span>
                      )}
                    </div>

                    <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.95rem', marginBottom: '10px' }}>
                      ${Number(item.product.price || 0).toFixed(2)}
                    </div>

                    {/* Quantity + Remove */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {/* Qty stepper */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-full)', padding: '4px 8px',
                      }}>
                        <button
                          className="cart-qty-btn"
                          onClick={() => handleDecreaseQuantity(item)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            width: '24px', height: '24px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--text-light)', transition: 'var(--transition)',
                          }}
                          title="Decrease"
                        >
                          <FiMinus size={12} />
                        </button>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          className="cart-qty-btn"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            width: '24px', height: '24px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--text-light)', transition: 'var(--transition)',
                          }}
                          title="Increase"
                        >
                          <FiPlus size={12} />
                        </button>
                      </div>

                      {/* Remove */}
                      <button
                        className="cart-remove-btn"
                        onClick={() => setItemToRemove(item)}
                        style={{
                          background: 'none', border: 'none',
                          color: 'var(--text-lighter)', cursor: 'pointer',
                          width: '28px', height: '28px', borderRadius: '6px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'var(--transition)',
                        }}
                        title="Remove item"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/*  Quick Add Suggested Products in Cart  */}
              <div style={{ marginTop: '16px', borderTop: '1px dashed var(--border)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { id: 1, name: 'Netflix Premium', price: 12.99, stockCount: 10 },
                    { id: 2, name: 'Spotify Premium', price: 9.99, stockCount: 5 },
                    { id: 4, name: 'Discord Nitro', price: 4.99, stockCount: 8 },
                    { id: 7, name: 'CapCut Pro', price: 6.99, stockCount: 15 },
                    { id: 8, name: 'ChatGPT Plus', price: 19.99, stockCount: 12 }
                  ].filter(p => !items.some(i => i.product?.id === p.id)).map(prod => {
                    const imgUrl = getProductImageUrl(prod.name, prod.imageUrl);
                    return (
                      <div
                        key={prod.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: 'var(--bg-secondary)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-light)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '6px',
                            overflow: 'hidden', background: '#fff',
                            border: '1px solid var(--border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {imgUrl ? (
                              <img src={imgUrl} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--primary)' }}>
                                {(prod.name || '?')[0]}
                              </span>
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text)' }}>{prod.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 800 }}>${prod.price.toFixed(2)}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => addItem ? addItem({ ...prod, imageUrl: imgUrl }, 1) : null}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '3px 8px', fontSize: '0.72rem', borderRadius: '6px' }}
                        >
                          {t('cart.addMore')}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{
            padding: '20px 24px',
            borderTop: '1px solid var(--border-light)',
            backgroundColor: 'var(--card-bg)',
          }}>
            {/* Subtotal */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '6px',
            }}>
              <span style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>{t('cart.subtotal')}</span>
              <span style={{ fontWeight: 900, fontSize: '1.4rem', color: 'var(--primary)' }}>
                ${totalPrice.toFixed(2)}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-lighter)', marginBottom: '16px' }}>
              {t('cart.digitalDelivery')}
            </p>
            <button
              id="cart-checkout-btn"
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '1rem', borderRadius: 'var(--radius-sm)' }}
              onClick={handleCheckout}
            >
              {t('cart.checkout')} <FiArrowRight size={16} />
            </button>
          </div>
        )}
      </div>

      <ConfirmRemoveCartModal
        isOpen={!!itemToRemove}
        item={itemToRemove}
        onClose={() => setItemToRemove(null)}
        onConfirm={handleConfirmRemove}
      />
    </>
  );
};

export default CartDrawer;

