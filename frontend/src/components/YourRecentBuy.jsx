import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orders as ordersApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getProductImageUrl } from '../utils/productImages';
import {
  FiShoppingBag, FiCheckCircle, FiClock, FiPackage,
  FiMessageSquare, FiExternalLink, FiKey, FiArrowRight, FiCreditCard
} from 'react-icons/fi';
import PaymentModal from './PaymentModal';

const RecentItemThumb = ({ item, orderId }) => {
  const [hasError, setHasError] = useState(false);
  const rawImg = item?.product?.imageUrl || item?.product?.image || item?.productImageUrl || item?.imageUrl;
  const prodName = item?.product?.name || item?.productName || item?.name || 'Digital Product';
  const imgUrl = getProductImageUrl(prodName, rawImg);
  const showImg = imgUrl && !hasError;

  const content = (
    <div
      title={`Click image to view details for ${prodName}`}
      style={{
        width: 68, height: 68, borderRadius: 12,
        background: 'var(--card-bg)', border: '2px solid var(--border-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', flexShrink: 0, padding: showImg ? 5 : 0,
        cursor: 'pointer', boxShadow: '0 3px 8px rgba(0,0,0,0.06)'
      }}
    >
      {showImg ? (
        <img
          src={imgUrl} alt={prodName}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          onError={() => setHasError(true)}
        />
      ) : (
        <FiPackage size={26} color="var(--primary)" />
      )}
    </div>
  );

  if (orderId) {
    return (
      <Link to={`/orders/${orderId}`} style={{ textDecoration: 'none', display: 'inline-block' }}>
        {content}
      </Link>
    );
  }

  return content;
};

const YourRecentBuy = ({ limit = 3, showTitle = true }) => {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentOrder, setPaymentOrder] = useState(null);

  const loadRecentOrders = async (signal) => {
    if (!isAuthenticated) {
      setRecentOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let ordersList = [];

    try {
      const res = await ordersApi.getAll({ signal });
      const fetched = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      if (fetched.length > 0) ordersList = fetched;
    } catch (err) {
      if (err.name === 'CanceledError' || err.message === 'canceled') return;
      // Fallback local storage
      const keys = Object.keys(localStorage).filter(k => k.startsWith('chat_messages_order_'));
      if (keys.length > 0) {
        ordersList = keys.map(k => {
          const oid = k.replace('chat_messages_order_', '');
          return {
            id: oid,
            createdAt: new Date().toISOString(),
            status: 'COMPLETED',
            totalAmount: 3.99,
            items: [{ product: { name: `Order #${oid}` }, price: 3.99 }]
          };
        });
      }
    }

    if (signal?.aborted) return;

    // Prioritize and filter COMPLETED orders for recent buys
    const completedOrders = ordersList.filter(o => o.status === 'COMPLETED');
    const displayList = completedOrders.length > 0 ? completedOrders : ordersList;

    // Sort descending by date
    displayList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    setRecentOrders(displayList.slice(0, limit));
    setLoading(false);
  };

  useEffect(() => {
    const controller = new AbortController();
    loadRecentOrders(controller.signal);
    return () => controller.abort();
  }, [isAuthenticated]);

  if (loading) return null;
  if (recentOrders.length === 0) return null;

  return (
    <div className="your-recent-buy-widget animate-fade-in" style={{ marginBottom: 28 }}>
      {showTitle && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 14, flexWrap: 'wrap', gap: 8
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--primary), #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', boxShadow: '0 4px 12px var(--primary-glow)'
            }}>
              <FiShoppingBag size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, color: 'var(--text)' }}>
                {t('recentBuy.title')}
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
                {t('recentBuy.subtitle')}
              </span>
            </div>
          </div>

          <Link
            to="/orders"
            style={{
              fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)',
              display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none'
            }}
          >
            {t('recentBuy.viewAll')} <FiArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Vertical Cards Stack List */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }}>
        {recentOrders.map(order => {
          const mainItem = order.items?.[0] || {};
          const prodName = mainItem.product?.name || mainItem.productName || order.productName || `Order #${order.id}`;
          const isCompleted = order.status === 'COMPLETED';
          const isProcessing = order.status === 'PROCESSING';
          const isPending = order.status === 'PENDING';

          return (
            <div
              key={order.id}
              style={{
                background: 'var(--card-bg)',
                borderRadius: 16,
                border: '1px solid var(--border)',
                padding: '16px 20px',
                boxShadow: 'var(--shadow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 14,
                transition: 'all 0.2s'
              }}
            >
              {/* Left Side: Product Info */}
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', minWidth: 220, flex: '1 1 auto' }}>
                <RecentItemThumb item={mainItem} orderId={order.id} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary)' }}>
                      Order #{order.id}
                    </span>
                    <span style={{
                      padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 800,
                      background: isCompleted ? 'rgba(16,185,129,0.14)' : isProcessing ? 'rgba(251,191,36,0.16)' : 'rgba(99,102,241,0.14)',
                      color: isCompleted ? '#10B981' : isProcessing ? '#FBBF24' : '#6366f1',
                      border: isCompleted ? '1px solid rgba(16,185,129,0.3)' : isProcessing ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(99,102,241,0.3)'
                    }}>
                      {order.status}
                    </span>
                  </div>
                  <div style={{
                    fontWeight: 800, fontSize: '0.98rem', color: 'var(--text)', marginTop: 2,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {prodName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 2 }}>
                    ${Number(order.totalAmount || mainItem.price || 0).toFixed(2)} &bull; {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Right Side: Action Buttons */}
              <div style={{
                display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
                justifyContent: 'flex-end', flexShrink: 0
              }}>
                {isCompleted && (
                  <button
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.78rem', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 5, borderRadius: 10 }}
                  >
                    <FiKey size={13} color="#10B981" /> {t('recentBuy.viewAccount')}
                  </button>
                )}

                {isProcessing && (
                  <button
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.78rem', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 5, borderRadius: 10, color: '#FBBF24', borderColor: 'rgba(251,191,36,0.4)' }}
                  >
                    <FiClock size={13} /> {t('recentBuy.checkStatus')}
                  </button>
                )}

                {isPending && (
                  <button
                    onClick={() => setPaymentOrder(order)}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.78rem', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 5, borderRadius: 10 }}
                  >
                    <FiCreditCard size={13} /> {t('recentBuy.payKhqr')}
                  </button>
                )}

                <button
                  onClick={() => navigate(`/chats?order=${order.id}`)}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.78rem', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 5, borderRadius: 10 }}
                  title="Chat with Support for this order"
                >
                  <FiMessageSquare size={13} color="var(--primary)" /> {t('recentBuy.supportChat')}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {paymentOrder && (
        <PaymentModal
          order={paymentOrder}
          isOpen={Boolean(paymentOrder)}
          onClose={() => setPaymentOrder(null)}
          onPaymentSuccess={() => {
            setPaymentOrder(null);
            loadRecentOrders();
          }}
        />
      )}
    </div>
  );
};

export default YourRecentBuy;
