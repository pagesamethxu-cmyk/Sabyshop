import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { orders as ordersApi, products as productsApi } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import PaymentModal from '../components/PaymentModal';
import ConfirmCancelOrderModal from '../components/ConfirmCancelOrderModal';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { FiChevronRight, FiPackage, FiCreditCard, FiTrash2, FiClock, FiCheckCircle, FiRefreshCw, FiMessageSquare } from 'react-icons/fi';
import { MdStorefront, MdVerified } from 'react-icons/md';
import { getProductImageUrl } from '../utils/productImages';
import UserChatHistoryModal from '../components/UserChatHistoryModal';
import YourRecentBuy from '../components/YourRecentBuy';

const formatDateCustom = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const datePart = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${datePart} at ${timePart}`;
};

const fallbackProductMap = [
  { keywords: ['netflix'], id: 1 },
  { keywords: ['spotify'], id: 2 },
  { keywords: ['steam'], id: 3 },
  { keywords: ['discord', 'nitro'], id: 4 },
  { keywords: ['nordvpn', 'vpn'], id: 5 },
  { keywords: ['adobe'], id: 6 }
];

const getBuyAgainProductId = (item, productName, allProducts = []) => {
  if (item?.product?.id) return item.product.id;
  if (item?.productId) return item.productId;
  
  const cleanName = (productName || item?.name || '').toLowerCase().trim();
  if (!cleanName) return 1;

  if (allProducts && allProducts.length > 0) {
    const exactMatch = allProducts.find(p => p.name && p.name.toLowerCase().trim() === cleanName);
    if (exactMatch) return exactMatch.id;

    const partialMatch = allProducts.find(p => p.name && (p.name.toLowerCase().includes(cleanName) || cleanName.includes(p.name.toLowerCase())));
    if (partialMatch) return partialMatch.id;
  }

  for (const entry of fallbackProductMap) {
    if (entry.keywords.some(kw => cleanName.includes(kw))) {
      return entry.id;
    }
  }

  return 1;
};

const OrderItemThumbnail = ({ item, orderId }) => {
  const [hasError, setHasError] = useState(false);
  const rawImg = item?.product?.imageUrl || item?.product?.image || item?.productImageUrl || item?.imageUrl;
  const prodName = item?.product?.name || item?.productName || item?.name || 'Product';
  const imgUrl = getProductImageUrl(prodName, rawImg);

  const showImage = imgUrl && !hasError;

  const content = (
    <div
      title={`Click image to view details for ${prodName}`}
      style={{
        width: '56px',
        height: '56px',
        borderRadius: '10px',
        background: showImage ? 'var(--card-bg)' : 'var(--primary-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: '1rem',
        color: 'var(--primary)',
        overflow: 'hidden',
        flexShrink: 0,
        border: '1px solid var(--border-light)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        padding: showImage ? '4px' : '0',
        cursor: 'pointer',
        transition: 'transform 0.2s ease'
      }}
    >
      {showImage ? (
        <img
          src={imgUrl}
          alt={prodName}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          onError={() => setHasError(true)}
        />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: 'var(--primary-light)', color: 'var(--primary)' }}>
          <FiPackage size={24} />
        </div>
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

const OrdersPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const [orders, setOrders] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const tabParam = (searchParams.get('tab') || searchParams.get('status') || location.state?.tab || '').toUpperCase();
  const [activeTab, setActiveTab] = useState(tabParam ? tabParam : 'PENDING');

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Auto select active tab if no tabParam specified (e.g. default to COMPLETED if user has 0 pending orders)
  useEffect(() => {
    if (!tabParam && orders.length > 0) {
      const hasPending = orders.some(o => o.status === 'PENDING');
      const hasCompleted = orders.some(o => o.status === 'COMPLETED');
      const hasProcessing = orders.some(o => o.status === 'PROCESSING');

      if (!hasPending && hasCompleted) {
        setActiveTab('COMPLETED');
      } else if (!hasPending && !hasCompleted && hasProcessing) {
        setActiveTab('PROCESSING');
      }
    }
  }, [orders, tabParam]);
  
  // Selection state (Array of order IDs)
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);

  // Payment Modal state
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Deletion Modal state
  const [deleteTargetIds, setDeleteTargetIds] = useState([]);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Chat History Modal state
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);

  const fetchOrders = async (signalInput) => {
    const validSignal = (signalInput && typeof signalInput.addEventListener === 'function') ? signalInput : undefined;
    const config = validSignal ? { signal: validSignal } : undefined;
    setLoading(true);
    try {
      const res = await ordersApi.getAll(config);
      const fetchedOrders = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setOrders(fetchedOrders);
      try {
        localStorage.setItem('cached_user_orders', JSON.stringify(fetchedOrders));
      } catch (_) {}
    } catch (error) {
      if (error.name !== 'CanceledError' && error.message !== 'canceled') {
        console.error("Error fetching user orders", error);
        try {
          const cached = localStorage.getItem('cached_user_orders');
          if (cached) {
            setOrders(JSON.parse(cached));
          } else {
            setOrders([]);
          }
        } catch (_) {
          setOrders([]);
        }
      }
    }

    try {
      const prodRes = await productsApi.getAll(null, config);
      const fetchedProds = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data?.data || []);
      setAllProducts(fetchedProds);
    } catch (error) {
      if (error.name !== 'CanceledError' && error.message !== 'canceled') {
        console.error("Error fetching products list", error);
      }
    } finally {
      if (!validSignal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchOrders(controller.signal);
    return () => controller.abort();
  }, []);

  // Filter orders by active tab
  const filteredOrders = orders.filter(o => {
    if (activeTab === 'ALL') return true;
    return o.status === activeTab;
  });

  // Calculate count for each tab
  const pendingCount = orders.filter(o => o.status === 'PENDING').length;
  const processingCount = orders.filter(o => o.status === 'PROCESSING').length;
  const deliveredCount = orders.filter(o => o.status === 'DELIVERED').length;
  const completedCount = orders.filter(o => o.status === 'COMPLETED').length;

  // Selection handlers
  const toggleSelectOrder = (id) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const visibleSelectableOrders = filteredOrders.filter(o => o.status !== 'COMPLETED');
  const visibleIds = visibleSelectableOrders.map(o => o.id);
  const isAllSelected = visibleIds.length > 0 && visibleIds.every(id => selectedOrderIds.includes(id));

  // Helper to group duplicate items by product name inside an order
  const groupItemsByProduct = (items) => {
    if (!items || items.length === 0) return [];
    const map = new Map();
    items.forEach(item => {
      const name = item.product?.name || item.productName || item.name || 'Digital Product';
      if (map.has(name)) {
        const existing = map.get(name);
        existing.quantity += (item.quantity || 1);
        existing.totalPrice += Number(item.price || item.product?.price || 0) * (item.quantity || 1);
        existing.items.push(item);
      } else {
        map.set(name, {
          name,
          item,
          quantity: item.quantity || 1,
          unitPrice: Number(item.price || item.product?.price || 0),
          totalPrice: Number(item.price || item.product?.price || 0) * (item.quantity || 1),
          items: [item]
        });
      }
    });
    return Array.from(map.values());
  };

  // Expand filtered orders into individual product display cards
  const displayCards = [];
  filteredOrders.forEach(order => {
    if (!order.items || order.items.length === 0) {
      displayCards.push({
        order,
        cardKey: `order-${order.id}-0`,
        productName: `Order #${order.id}`,
        quantity: 1,
        price: Number(order.totalAmount || 0),
        item: null,
      });
    } else {
      const grouped = groupItemsByProduct(order.items);
      grouped.forEach((g, idx) => {
        displayCards.push({
          order,
          cardKey: `order-${order.id}-${idx}`,
          productName: g.name,
          quantity: g.quantity,
          price: g.totalPrice,
          item: g.item,
        });
      });
    }
  });

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedOrderIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedOrderIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleClearSelection = () => {
    setSelectedOrderIds([]);
  };

  // Handle Continue Payment
  const handleOpenPayment = (order, e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedPaymentOrder(order);
    setIsPaymentModalOpen(true);
  };

  // Handle Deletion Modal Open (Single or Batch)
  const handleOpenSingleDelete = (order, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setDeleteTargetIds([order.id]);
    setIsCancelModalOpen(true);
  };

  const handleOpenBatchDelete = () => {
    if (selectedOrderIds.length === 0) return;
    setDeleteTargetIds(selectedOrderIds);
    setIsCancelModalOpen(true);
  };

  // Confirm Deletion logic
  const handleConfirmCancel = async () => {
    if (!deleteTargetIds || deleteTargetIds.length === 0) return;
    setCancelling(true);
    try {
      for (const id of deleteTargetIds) {
        await ordersApi.cancel(id).catch(() => null);
      }
      toast.success(`Successfully deleted ${deleteTargetIds.length} order(s)`);
      setOrders(prev => prev.filter(o => !deleteTargetIds.includes(o.id)));
      setSelectedOrderIds(prev => prev.filter(id => !deleteTargetIds.includes(id)));
    } catch (err) {
      toast.error('Failed to delete selected orders');
    } finally {
      setCancelling(false);
      setIsCancelModalOpen(false);
      setDeleteTargetIds([]);
    }
  };

  const handlePaymentSuccess = (updatedOrder) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? { ...o, status: 'COMPLETED' } : o));
    fetchOrders();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><FiClock /> {t('orders.pending')}</span>;
      case 'PROCESSING':
        return <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><FiRefreshCw /> {t('orders.processing')}</span>;
      case 'COMPLETED':
        return <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><FiCheckCircle /> {t('orders.completed')}</span>;
      case 'CANCELLED':
        return <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{t('orders.cancelled')}</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '850px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.8rem', fontWeight: 800 }}>
          <FiPackage style={{ color: 'var(--primary)' }} /> {t('orders.title')}
        </h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link 
            to={user?.role === 'SELLER' ? '/chat/seller-customers' : '/chat/user-seller'} 
            className="btn btn-outline btn-sm" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', borderColor: 'var(--primary-light)' }}
          >
            <FiMessageSquare /> {t('orders.chatHistory')}
          </Link>
          <button 
            onClick={() => fetchOrders()} 
            className="btn btn-outline btn-sm" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FiRefreshCw /> {t('orders.refresh')}
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '6px',
        background: 'var(--card-bg)',
        padding: '4px',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '18px',
        border: '1px solid var(--border-light)',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        <button
          onClick={() => setActiveTab('PENDING')}
          style={{
            flex: '1 0 auto',
            minWidth: 'fit-content',
            whiteSpace: 'nowrap',
            padding: '6px 10px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.8rem',
            transition: 'var(--transition)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: activeTab === 'PENDING' ? 'var(--accent-light)' : 'transparent',
            color: activeTab === 'PENDING' ? '#B08B2C' : 'var(--text-light)'
          }}
        >
          <span style={{ whiteSpace: 'nowrap' }}>{t('orders.pending')}</span>
          <span style={{
            background: activeTab === 'PENDING' ? '#B08B2C' : 'var(--bg-secondary)',
            color: activeTab === 'PENDING' ? 'white' : 'var(--text-light)',
            borderRadius: '10px', padding: '1px 6px', fontSize: '0.7rem', flexShrink: 0, fontWeight: 800
          }}>{pendingCount}</span>
        </button>

        <button
          onClick={() => setActiveTab('PROCESSING')}
          style={{
            flex: '1 0 auto',
            minWidth: 'fit-content',
            whiteSpace: 'nowrap',
            padding: '6px 10px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.8rem',
            transition: 'var(--transition)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: activeTab === 'PROCESSING' ? 'var(--secondary-light)' : 'transparent',
            color: activeTab === 'PROCESSING' ? '#7B4B94' : 'var(--text-light)'
          }}
        >
          <span style={{ whiteSpace: 'nowrap' }}>{t('orders.processing')}</span>
          <span style={{
            background: activeTab === 'PROCESSING' ? '#7B4B94' : 'var(--bg-secondary)',
            color: activeTab === 'PROCESSING' ? 'white' : 'var(--text-light)',
            borderRadius: '10px', padding: '1px 6px', fontSize: '0.7rem', flexShrink: 0, fontWeight: 800
          }}>{processingCount}</span>
        </button>

        <button
          onClick={() => setActiveTab('DELIVERED')}
          style={{
            flex: '1 0 auto',
            minWidth: 'fit-content',
            whiteSpace: 'nowrap',
            padding: '6px 10px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.8rem',
            transition: 'var(--transition)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: activeTab === 'DELIVERED' ? 'rgba(59,130,246,0.15)' : 'transparent',
            color: activeTab === 'DELIVERED' ? '#2563EB' : 'var(--text-light)'
          }}
        >
          <span style={{ whiteSpace: 'nowrap' }}>{t('orders.delivered') || 'Delivered'}</span>
          <span style={{
            background: activeTab === 'DELIVERED' ? '#2563EB' : 'var(--bg-secondary)',
            color: activeTab === 'DELIVERED' ? 'white' : 'var(--text-light)',
            borderRadius: '10px', padding: '1px 6px', fontSize: '0.7rem', flexShrink: 0, fontWeight: 800
          }}>{deliveredCount}</span>
        </button>

        <button
          onClick={() => setActiveTab('COMPLETED')}
          style={{
            flex: '1 0 auto',
            minWidth: 'fit-content',
            whiteSpace: 'nowrap',
            padding: '6px 10px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.8rem',
            transition: 'var(--transition)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: activeTab === 'COMPLETED' ? 'var(--success-light)' : 'transparent',
            color: activeTab === 'COMPLETED' ? '#2B8A5A' : 'var(--text-light)'
          }}
        >
          <span style={{ whiteSpace: 'nowrap' }}>{t('orders.completed')}</span>
          <span style={{
            background: activeTab === 'COMPLETED' ? '#2B8A5A' : 'var(--bg-secondary)',
            color: activeTab === 'COMPLETED' ? 'white' : 'var(--text-light)',
            borderRadius: '10px', padding: '1px 6px', fontSize: '0.7rem', flexShrink: 0, fontWeight: 800
          }}>{completedCount}</span>
        </button>
      </div>

      {/* Selection Control Bar (Only show if there are selectable orders) */}
      {!loading && visibleSelectableOrders.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: selectedOrderIds.length > 0 ? 'var(--danger-light)' : 'var(--card-bg)',
          padding: '12px 18px',
          borderRadius: 'var(--radius-sm)',
          border: selectedOrderIds.length > 0 ? '1px solid var(--danger)' : '1px solid var(--border-light)',
          marginBottom: '20px',
          transition: 'var(--transition)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
              <input 
                type="checkbox" 
                checked={isAllSelected}
                onChange={toggleSelectAll}
                disabled={visibleIds.length === 0}
                style={{ width: '18px', height: '18px', cursor: visibleIds.length > 0 ? 'pointer' : 'not-allowed', accentColor: 'var(--primary)' }}
              />
              {t('orders.selectAll')} ({visibleSelectableOrders.length})
            </label>

            {selectedOrderIds.length > 0 && (
              <span style={{
                fontSize: '0.85rem',
                fontWeight: 800,
                color: 'var(--danger)',
                background: 'rgba(255,255,255,0.7)',
                padding: '3px 10px',
                borderRadius: '12px'
              }}>
                {selectedOrderIds.length} {t('orders.selected')}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {selectedOrderIds.length > 0 && (
              <>
                <button 
                  onClick={handleClearSelection}
                  className="btn btn-outline btn-sm"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-light)', background: 'white' }}
                >
                  {t('orders.deselect')}
                </button>
                <button 
                  onClick={handleOpenBatchDelete}
                  className="btn btn-danger btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}
                >
                  <FiTrash2 /> {t('orders.deleteSelected')} ({selectedOrderIds.length})
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Orders List */}
      {loading ? (
        <LoadingSpinner />
      ) : displayCards.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {displayCards.map((card, index) => {
            const { order, cardKey, productName, quantity, price, item } = card;
            const isSelected = selectedOrderIds.includes(order.id);
            const targetProductId = getBuyAgainProductId(item, productName, allProducts);

            return (
              <div 
                key={cardKey} 
                className="card animate-fade-in"
                onClick={(e) => {
                  if (e.target.closest('button, input, a')) return;
                  navigate(`/orders/${order.id}`);
                }}
                style={{ 
                  padding: 0,
                  animationDelay: `${index * 0.04}s`,
                  display: 'flex',
                  flexDirection: 'column',
                  border: isSelected ? '2px solid var(--danger)' : '1px solid var(--border-light)',
                  backgroundColor: isSelected ? '#FFF8F8' : 'var(--card-bg)',
                  boxShadow: isSelected ? '0 4px 15px rgba(255,107,107,0.15)' : 'var(--shadow)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
                title="Click to view order details"
              >
                {/* 1. Full-Width Top Status Banner (Smaller & Sleeker) */}
                <div style={{
                  width: '100%',
                  padding: '7px 14px',
                  textAlign: 'center',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  background: order.status === 'COMPLETED' ? '#D1E7DD' : order.status === 'PENDING' ? '#FFF3CD' : order.status === 'PROCESSING' ? '#CFE2FF' : '#F8D7DA',
                  color: order.status === 'COMPLETED' ? '#0F5132' : order.status === 'PENDING' ? '#664D03' : order.status === 'PROCESSING' ? '#084298' : '#842029',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}>
                  {order.status !== 'COMPLETED' && (
                    <input 
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOrder(order.id)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--danger)' }}
                      title="Select for delete"
                    />
                  )}
                  <span>{order.status.charAt(0) + order.status.slice(1).toLowerCase()}</span>
                </div>

                {/* 2. Main Padded Card Content */}
                <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                  {/* Date Line */}
                  <div style={{
                    color: '#6B7280',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    paddingBottom: '10px',
                    borderBottom: '1px solid var(--border-light)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>{formatDateCustom(order.createdAt)}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Order #{order.id}</span>
                  </div>

                  {/* Product Info Row */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    {item && <OrderItemThumbnail item={item} orderId={order.id} />}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                      <Link 
                        to={`/orders/${order.id}`}
                        style={{ fontWeight: 800, fontSize: '0.96rem', color: 'var(--text)', textDecoration: 'none' }}
                        title="Click to view order details"
                      >
                        {productName}
                      </Link>

                      <div style={{ color: '#6B7280', fontSize: '0.76rem', fontWeight: 500 }}>
                        {item?.product?.category?.name || item?.product?.categoryName || 'Digital Product'}
                      </div>

                      <div style={{ color: '#6B7280', fontSize: '0.74rem', fontWeight: 500 }}>
                        {quantity} Account(s)
                      </div>

                      {/* Seller Store Link */}
                      {(order.sellerStoreName || item?.product?.sellerStoreName) && (
                        <Link
                          to={(order.sellerId || item?.product?.sellerId) ? `/store/${order.sellerId || item?.product?.sellerId}` : '/store'}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            color: '#2563EB',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            textDecoration: 'none',
                            width: 'fit-content',
                            marginTop: '2px',
                            background: 'rgba(37, 99, 235, 0.06)',
                            padding: '2px 6px',
                            borderRadius: '6px'
                          }}
                          title="Click to view seller store"
                        >
                          <MdStorefront size={13} /> {order.sellerStoreName || item?.product?.sellerStoreName} <MdVerified size={12} color="#1d9bf0" />
                        </Link>
                      )}

                      {/* Instant Delivery Badge */}
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '3px', color: '#16A34A', fontWeight: 800, fontSize: '0.72rem' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor"></polygon>
                        </svg>
                        <span>{t('orders.instantDeliveryBadge')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Row */}
                  <div style={{
                    borderTop: '1px solid var(--border-light)',
                    paddingTop: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    {/* Total Purchase Label + Price */}
                    <div>
                      <div style={{ color: '#6B7280', fontSize: '0.72rem', fontWeight: 500 }}>{t('orders.totalPurchase')}</div>
                      <div style={{ color: '#EA580C', fontWeight: 900, fontSize: '1.05rem', marginTop: '1px' }}>
                        USD {price.toFixed(2)}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {order.status !== 'COMPLETED' && (
                        <button 
                          onClick={(e) => handleOpenSingleDelete(order, e)}
                          className="btn btn-outline btn-sm"
                          style={{ color: 'var(--danger)', borderColor: 'var(--danger-light)', fontSize: '0.78rem', padding: '5px 12px' }}
                        >
                          <FiTrash2 /> {t('orders.delete')}
                        </button>
                      )}

                      {order.status === 'PENDING' && (
                        <button 
                          onClick={(e) => handleOpenPayment(order, e)}
                          className="btn btn-sm"
                          style={{
                            background: 'linear-gradient(135deg, #c0392b, #e74c3c)',
                            color: '#fff',
                            border: 'none',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            padding: '5px 14px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 2px 8px rgba(231,76,60,0.4)'
                          }}
                        >
                          <FiCreditCard /> {t('orders.continuePayment')}
                        </button>
                      )}

                      {order.status === 'PROCESSING' && (
                        <button 
                          onClick={(e) => handleOpenPayment(order, e)}
                          className="btn btn-sm"
                          style={{
                            background: 'linear-gradient(135deg, #c0392b, #e74c3c)',
                            color: '#fff',
                            border: 'none',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            padding: '5px 14px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 2px 8px rgba(231,76,60,0.4)'
                          }}
                        >
                          <FiRefreshCw /> {t('orders.checkPayStatus')}
                        </button>
                      )}

                      {order.status === 'DELIVERED' && (
                        <>
                          <button 
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              try {
                                await ordersApi.confirm(order.id);
                                toast.success(t('orders.confirmSuccess') || 'Order confirmed!');
                                fetchOrders();
                              } catch (err) {
                                toast.error(err?.response?.data?.message || 'Failed to confirm');
                              }
                            }}
                            className="btn btn-sm"
                            style={{
                              background: 'linear-gradient(135deg, #10B981, #059669)',
                              color: '#fff',
                              border: 'none',
                              fontWeight: 800,
                              fontSize: '0.78rem',
                              padding: '5px 14px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: '0 2px 8px rgba(16,185,129,0.4)'
                            }}
                          >
                            <FiCheckCircle /> {t('orders.confirmReceived') || 'Confirm Received'}
                          </button>
                          <Link
                            to={`/orders/${order.id}`}
                            className="btn btn-sm btn-outline"
                            style={{
                              border: '1px solid #3B82F6',
                              color: '#2563EB',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              padding: '5px 12px',
                              textDecoration: 'none'
                            }}
                          >
                            {t('orders.viewDetails') || 'View Details'}
                          </Link>
                        </>
                      )}

                      {order.status === 'COMPLETED' && (
                        <Link
                          to={targetProductId ? `/product/${targetProductId}` : `/store`}
                          className="btn btn-sm"
                          style={{
                            border: '1.5px solid #EA580C',
                            color: '#EA580C',
                            background: '#FFF',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            borderRadius: '7px',
                            padding: '5px 16px',
                            textDecoration: 'none'
                          }}
                        >
                          {t('orders.buyAgain')}
                        </Link>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState 
          title={activeTab === 'PENDING' ? t('orders.noPendingOrders') : t('orders.noOrdersInSection')} 
          description={activeTab === 'PENDING' ? t('orders.noPendingOrders') : t('orders.noOrdersInSection')} 
          actionText={t('orders.goToStore')} 
          actionLink="/store" 
        />
      )}

      {/* Your Recent Buy Section - Hidden during PENDING and PROCESSING tabs */}
      {activeTab !== 'PENDING' && activeTab !== 'PROCESSING' && (
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border-light)' }}>
          <YourRecentBuy limit={4} />
        </div>
      )}

      {/* Payment Modal for Pending Orders */}
      {selectedPaymentOrder && (
        <PaymentModal 
          isOpen={isPaymentModalOpen}
          order={selectedPaymentOrder}
          onClose={() => setIsPaymentModalOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Confirm Delete Modal */}
      <ConfirmCancelOrderModal
        isOpen={isCancelModalOpen}
        orderId={deleteTargetIds.length === 1 ? deleteTargetIds[0] : null}
        selectedCount={deleteTargetIds.length}
        loading={cancelling}
        onClose={() => {
          setIsCancelModalOpen(false);
          setDeleteTargetIds([]);
        }}
        onConfirm={handleConfirmCancel}
      />

      {/* User Chat History Modal */}
      <UserChatHistoryModal
        isOpen={isChatHistoryOpen}
        onClose={() => setIsChatHistoryOpen(false)}
      />
    </div>
  );
};

export default OrdersPage;
