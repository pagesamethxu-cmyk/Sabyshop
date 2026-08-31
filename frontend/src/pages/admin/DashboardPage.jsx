import React, { useState, useEffect, useRef } from 'react';
import { admin as adminApi, products as productsApi } from '../../api/client';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiDollarSign, FiShoppingBag, FiUsers, FiPackage,
  FiMoreHorizontal, FiEdit2, FiTrash2, FiDatabase, FiFileText, FiSave
} from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';

/* 
   Hook: animate a number from 0 → target
 */
const useCountUp = (target, duration = 1400, decimals = 0) => {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (target === 0 || target == null) { setCurrent(0); return; }
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCurrent(parseFloat((target * ease).toFixed(decimals)));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, decimals]);

  return current;
};

/* 
   Animated stat card value
 */
const AnimatedStat = ({ value, prefix = '', suffix = '', decimals = 0 }) => {
  const num = useCountUp(parseFloat(value) || 0, 1400, decimals);
  return (
    <span>
      {prefix}{decimals > 0 ? num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : Math.round(num).toLocaleString()}{suffix}
    </span>
  );
};

/* 
   SVG line chart
 */
/* 
   SVG line chart (Running Animated Path)
 */
const LineChart = ({ data, color, animateDelay = 0 }) => {
  if (!data || data.length < 2) return null;
  const W = 400; const H = 160;
  const max = Math.max(...data); const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - ((v - min) / range) * (H - 24) - 12,
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const area = `${line} L ${pts[pts.length - 1].x} ${H} L 0 ${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height="100%">
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
        <line key={i} x1="0" y1={H - f * (H - 24) - 12} x2={W} y2={H - f * (H - 24) - 12}
          stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="4 4" />
      ))}
      <path d={area} fill={color} opacity="0.08" className="admin-chart-area-path" />
      <path d={line} fill="none" stroke={color} strokeWidth="3"
        strokeLinecap="round" strokeLinejoin="round"
        className="admin-chart-line-path"
        style={{ animationDelay: `${animateDelay}s` }}
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={color} opacity="0.9"
          className="admin-chart-dot"
          style={{ animationDelay: `${i * 0.15 + animateDelay}s` }}
        />
      ))}
    </svg>
  );
};

/* 
   Conic-gradient donut
 */
const DonutChart = ({ segments }) => {
  let cumul = 0;
  const gradient = segments.map(s => {
    const start = cumul; cumul += s.pct;
    return `${s.color} ${start}% ${cumul}%`;
  }).join(', ');
  return (
    <div className="admin-donut" style={{ background: `conic-gradient(${gradient})` }}>
      <div className="admin-donut-hole" />
    </div>
  );
};

/* 
   Mini Glowing Wave Sparkline for Stat Cards
 */
const MiniSparkline = ({ data = [20, 35, 25, 45, 30, 60, 50, 75] }) => {
  const W = 130;
  const H = 45;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - ((v - min) / range) * (H - 10) - 5
  }));

  const pathLine = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const pathArea = `${pathLine} L ${W} ${H} L 0 ${H} Z`;

  return (
    <div style={{ width: W, height: H, position: 'absolute', bottom: 12, right: 14, pointerEvents: 'none' }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="revenueCardGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00F2FE" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
          </linearGradient>
          <filter id="revenueCardGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00F2FE" floodOpacity="0.75" />
          </filter>
        </defs>
        <path d={pathArea} fill="url(#revenueCardGrad)" />
        <path d={pathLine} fill="none" stroke="#00F2FE" strokeWidth="2.5" strokeLinecap="round" filter="url(#revenueCardGlow)" />
      </svg>
    </div>
  );
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];

const getStatusBadge = (status) => ({
  COMPLETED: 'completed', PROCESSING: 'processing',
  CANCELLED: 'cancelled', PENDING: 'pending', SHIPPED: 'shipped',
}[status] || 'pending');

/* 
   DASHBOARD PAGE
 */
const DashboardPage = () => {
  const { isKhmer } = useLanguage();
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [errorMsg, setErrorMsg]       = useState(null);
  const [recentOrders, setRecentOrders]   = useState([]);
  const [inventoryProducts, setInventoryProducts] = useState([]);

  const [totalSellersCount, setTotalSellersCount] = useState(0);
  const [pendingWithdrawCount, setPendingWithdrawCount] = useState(0);

  const fetchDashboard = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [dashRes, ordersRes, productsRes, sellersRes, withdrawRes] = await Promise.allSettled([
        adminApi.getDashboard(),
        adminApi.getAllOrders(),
        productsApi.getAll(),
        adminApi.getAllSellers(),
        adminApi.getAllWithdrawals(true),
      ]);

      // Dashboard stats
      const payload = dashRes.status === 'fulfilled'
        ? (dashRes.value?.data?.data ?? dashRes.value?.data ?? dashRes.value)
        : null;
      setData(payload && typeof payload === 'object' ? payload : { totalRevenue: 0, totalOrders: 0, totalProducts: 0, totalStock: 0 });

      // Recent orders (for order log table)
      if (ordersRes.status === 'fulfilled') {
        const orders = Array.isArray(ordersRes.value.data) ? ordersRes.value.data : (ordersRes.value.data?.data || []);
        setRecentOrders(orders.slice(0, 4));
      }

      // Products (for inventory table)
      if (productsRes.status === 'fulfilled') {
        const prods = Array.isArray(productsRes.value.data) ? productsRes.value.data : (productsRes.value.data?.data || []);
        setInventoryProducts(prods.slice(0, 4));
      }

      // Sellers count
      if (sellersRes.status === 'fulfilled') {
        const sList = Array.isArray(sellersRes.value.data) ? sellersRes.value.data : (sellersRes.value.data?.data || []);
        setTotalSellersCount(sList.length);
      }

      // Pending withdrawals
      if (withdrawRes.status === 'fulfilled') {
        const wList = Array.isArray(withdrawRes.value.data) ? withdrawRes.value.data : (withdrawRes.value.data?.data || []);
        setPendingWithdrawCount(wList.length);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to load dashboard.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const [timeframe, setTimeframe]     = useState('monthly');

  /*  Timeframe Configuration for Revenue Performance Chart  */
  const getTimeframeConfig = (tf) => {
    switch (tf) {
      case 'today':
        return {
          labels: ['8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM'],
          revFactors: [0.1, 0.25, 0.45, 0.6, 0.5, 0.8, 0.9, 1.0],
          ordFactors: [0.15, 0.3, 0.5, 0.65, 0.55, 0.85, 0.95, 1.0],
        };
      case 'weekly':
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          revFactors: [0.4, 0.55, 0.45, 0.7, 0.85, 0.95, 1.0],
          ordFactors: [0.35, 0.5, 0.4, 0.65, 0.8, 0.9, 1.0],
        };
      case 'monthly':
        return {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
          revFactors: [0.3, 0.45, 0.38, 0.55, 0.6, 0.72, 0.68, 1.0],
          ordFactors: [0.3, 0.45, 0.4, 0.6, 0.55, 0.75, 0.7, 1.0],
        };
      case 'yearly':
        return {
          labels: ['2020', '2021', '2022', '2023', '2024', '2025', '2026'],
          revFactors: [0.15, 0.3, 0.42, 0.58, 0.75, 0.88, 1.0],
          ordFactors: [0.2, 0.35, 0.45, 0.6, 0.78, 0.9, 1.0],
        };
      case 'all':
      default:
        return {
          labels: ['Q1 23', 'Q3 23', 'Q1 24', 'Q3 24', 'Q1 25', 'Q3 25', '2026'],
          revFactors: [0.2, 0.35, 0.5, 0.65, 0.8, 0.9, 1.0],
          ordFactors: [0.25, 0.4, 0.55, 0.7, 0.82, 0.92, 1.0],
        };
    }
  };

  /* Chart data calculated dynamically based on timeframe & backend totalRevenue/totalOrders */
  const currentRev = data?.totalRevenue != null ? data.totalRevenue : 0;
  const currentOrd = data?.totalOrders != null ? data.totalOrders : 0;
  const tfConfig   = getTimeframeConfig(timeframe);

  const revenueData = currentRev > 0
    ? tfConfig.revFactors.map(f => f * currentRev)
    : tfConfig.revFactors.map(() => 0);

  const ordersData = currentOrd > 0
    ? tfConfig.ordFactors.map(f => Math.round(f * currentOrd))
    : tfConfig.ordFactors.map(() => 0);

  const rawStats = Array.isArray(data?.categoryStats) && data.categoryStats.length > 0
    ? data.categoryStats
    : [
        { label: 'Streaming', color: '#7B6FFF', percentage: 35, revenue: currentRev * 0.35 },
        { label: 'Gaming', color: '#10B981', percentage: 25, revenue: currentRev * 0.25 },
        { label: 'Software', color: '#A78BFA', percentage: 20, revenue: currentRev * 0.20 },
        { label: 'VPN & Security', color: '#FBBF24', percentage: 12, revenue: currentRev * 0.12 },
        { label: 'Social Media', color: '#F87171', percentage: 8, revenue: currentRev * 0.08 },
      ];

  const categorySegments = rawStats.map(s => ({
    label: s.label,
    color: s.color || '#7B6FFF',
    pct: s.percentage || 0,
    revenue: s.revenue || 0
  }));

  const totalRevenue   = data?.totalRevenue != null ? data.totalRevenue : 0;
  const activeSales    = data?.activeSales != null ? data.activeSales : (data?.totalOrders || 0);
  const newOrders      = data?.newOrders != null ? data.newOrders : (data?.totalOrders || 0);
  const totalCustomers = data?.totalCustomers != null ? data.totalCustomers : 0;

  const stats = [
    {
      title: isKhmer ? 'ចំណូលសរុប' : 'Total Revenue', color: 'green', isWave: true,
      displayEl: <AnimatedStat value={totalRevenue} prefix="$" decimals={2} />,
      change: '+100%', up: true,
      sparkline: [20, 35, 25, 45, 30, 60, 50, 75],
    },
    {
      title: isKhmer ? 'ការលក់សកម្ម' : 'Active Sales', color: 'blue', icon: <FiShoppingBag />,
      displayEl: <AnimatedStat value={activeSales} />,
      change: '+100%', up: true,
      bars: [30, 50, 40, 60, 45, 65, 55, 75, 60, 80],
    },
    {
      title: isKhmer ? 'ការបញ្ជាទិញថ្មី' : 'New Orders', color: 'purple', icon: <FiPackage />,
      displayEl: <AnimatedStat value={newOrders} />,
      change: '+100%', up: true,
      bars: [50, 40, 60, 50, 70, 55, 75, 60, 80, 70],
    },
    {
      title: isKhmer ? 'អតិថិជនសរុប' : 'Customers', color: 'pink', icon: <FiUsers />,
      displayEl: <AnimatedStat value={totalCustomers} />,
      change: '+100%', up: true,
      bars: [20, 35, 45, 30, 55, 40, 65, 50, 75, 60],
    },
    {
      title: isKhmer ? 'អ្នកលក់សរុប' : 'Sellers', color: 'purple', icon: <FiUsers />,
      displayEl: <AnimatedStat value={totalSellersCount} />,
      change: isKhmer ? 'សកម្ម' : 'Active', up: true,
      link: '/admin/sellers'
    },
    {
      title: isKhmer ? 'ការដកប្រាក់រង់ចាំ' : 'Pending Withdrawals', color: 'green', icon: <FiDollarSign />,
      displayEl: <AnimatedStat value={pendingWithdrawCount} />,
      change: isKhmer ? 'ត្រូវការត្រួតពិនិត្យ' : 'Action needed', up: pendingWithdrawCount > 0,
      link: '/admin/withdrawals'
    },
  ];

  if (loading) {
    return <div className="admin-loading"><div className="admin-spinner" /></div>;
  }

  if (errorMsg && !data) {
    return (
      <div className="admin-card" style={{ maxWidth: 500, margin: '40px auto', padding: 32, textAlign: 'center' }}>
        <p style={{ color: '#F87171', marginBottom: 16 }}>{errorMsg}</p>
        <button className="admin-btn admin-btn-primary" onClick={fetchDashboard}>{isKhmer ? 'ព្យាយាមម្តងទៀត' : 'Retry'}</button>
      </div>
    );
  }

  return (
    <div className="admin-animate-in">

      {/*  Welcome Banner Header  */}
      <div style={{
        marginBottom: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(236, 72, 153, 0.12) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        padding: '20px 24px',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            {isKhmer ? 'សូមស្វាគមន៍មកកាន់ Admin Dashboard' : 'Welcome Back, Admin'}
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#94A3B8' }}>
            {isKhmer ? 'ទិដ្ឋភាពទូទៅនៃដំណើរការហាង និងស្ថិតិប្រតិបត្តិការទូទាំងប្រព័ន្ធ' : "Here is what's happening with your store today."}
          </p>
        </div>
        <span style={{
          background: 'rgba(99,102,241,0.2)',
          border: '1px solid rgba(99,102,241,0.4)',
          color: '#818CF8',
          padding: '6px 16px',
          borderRadius: 20,
          fontSize: '0.85rem',
          fontWeight: 700
        }}>
           {isKhmer ? 'ប្រព័ន្ធដំណើរការធម្មតា' : 'System Active'}
        </span>
      </div>

      {/*  Stat Cards  */}
      <div className="admin-stats-grid" style={{ marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div key={i} className={`admin-stat-card ${s.color}`}>
            <div>
              <div className="admin-stat-label">{s.title}</div>
              <div className="admin-stat-value">{s.displayEl}</div>
              <span className={`admin-stat-change ${s.up ? 'up' : 'down'}`}>
                {s.up ? '' : ''} {s.change}
              </span>
            </div>

            {s.isWave ? (
              <MiniSparkline data={s.sparkline} />
            ) : (
              <>
                {s.icon && <div className="admin-stat-icon">{s.icon}</div>}
                {s.bars && (
                  <div className="admin-stat-bars">
                    {s.bars.map((h, bi) => (
                      <div key={bi} className="bar" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/*  Charts Row  */}
      <div className="admin-charts-grid" style={{ marginBottom: 24 }}>

        {/* Revenue Performance */}
        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-title">{isKhmer ? 'ដំណើរការនៃចំណូល' : 'Revenue Performance'}</span>
            <select 
              className="admin-chart-dropdown"
              value={timeframe}
              onChange={e => setTimeframe(e.target.value)}
              style={{
                color: '#ffffff',
                background: 'rgba(15, 23, 42, 0.85)',
                borderColor: 'rgba(123, 111, 255, 0.35)',
                fontWeight: 600
              }}
            >
              <option value="today" style={{ background: '#0F172A', color: '#ffffff' }}>{isKhmer ? 'ថ្ងៃនេះ' : 'Today'}</option>
              <option value="weekly" style={{ background: '#0F172A', color: '#ffffff' }}>{isKhmer ? 'សប្តាហ៍នេះ' : 'This Week'}</option>
              <option value="monthly" style={{ background: '#0F172A', color: '#ffffff' }}>{isKhmer ? 'ប្រចាំខែ' : 'Monthly'}</option>
              <option value="yearly" style={{ background: '#0F172A', color: '#ffffff' }}>{isKhmer ? 'ប្រចាំឆ្នាំ' : 'Yearly'}</option>
              <option value="all" style={{ background: '#0F172A', color: '#ffffff' }}>{isKhmer ? 'ទាំងអស់' : 'All Growth'}</option>
            </select>
          </div>
          <div className="admin-card-body" style={{ paddingTop: 12 }}>
            <div style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
              {[{ label: isKhmer ? 'ចំណូល' : 'Revenue', color: '#7B6FFF' }, { label: isKhmer ? 'ការបញ្ជាទិញ' : 'Orders', color: '#22D3EE' }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--admin-text-secondary)' }}>
                  <div style={{ width: 12, height: 3, borderRadius: 2, background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex' }}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--admin-text-muted)', paddingRight: 8, paddingBottom: 20, minWidth: 35, textAlign: 'right' }}>
                {[600, 450, 300, 150, 0].map(v => <span key={v}>{v}</span>)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ height: 175, position: 'relative' }}>
                  <LineChart data={revenueData.map(v => v / ((Math.max(...revenueData) || 1) / 600))} color="#7B6FFF" animateDelay={0} />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%' }}>
                    <LineChart data={ordersData.map(v => v / ((Math.max(...ordersData) || 1) / 520))} color="#22D3EE" animateDelay={0.4} />
                  </div>
                </div>
                <div className="admin-chart-x-labels">{tfConfig.labels.map(m => <span key={m}>{m}</span>)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Donut */}
        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-title">{isKhmer ? 'ស្ថិតិប្រភេទផលិតផល' : 'Product Category Stats'}</span>
            <button className="admin-more-btn"><FiMoreHorizontal /></button>
          </div>
          <div className="admin-card-body">
            <div className="admin-donut-wrapper">
              <DonutChart segments={categorySegments} />
              <div className="admin-donut-legend">
                {categorySegments.map(s => (
                  <div key={s.label} className="admin-legend-item">
                    <div className="admin-legend-left">
                      <div className="admin-legend-dot" style={{ background: s.color }} />
                      <span className="admin-legend-label">{s.label}</span>
                    </div>
                    <span className="admin-legend-value">
                      ${((totalRevenue) * s.pct / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/*  Bottom Tables Row  */}
      <div className="admin-tables-grid">

        {/*  Inventory Management (real products)  */}
        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-title">{isKhmer ? 'ការគ្រប់គ្រងស្តុកផលិតផល' : 'Inventory Management'}</span>
            <button className="admin-more-btn"><FiMoreHorizontal /></button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{isKhmer ? 'ឈ្មោះផលិតផល' : 'Product Name'}</th>
                  <th>SKU</th>
                  <th>{isKhmer ? 'ប្រភេទ' : 'Category'}</th>
                  <th>{isKhmer ? 'កម្រិតស្តុក' : 'Stock Level'}</th>
                  <th>{isKhmer ? 'តម្លៃ' : 'Price'}</th>
                  <th>{isKhmer ? 'សកម្មភាព' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {inventoryProducts.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--admin-text-muted)' }}>
                      {isKhmer ? 'មិនមានផលិតផលទេ។ ' : 'No products. '} <Link to="/admin/products" style={{ color: 'var(--admin-accent)' }}>{isKhmer ? 'បន្ថែមផលិតផល →' : 'Add products →'}</Link>
                    </td>
                  </tr>
                ) : inventoryProducts.map((p, rowIdx) => {
                  const stockCount = p.stockCount ?? 0;
                  const maxStock = 20;
                  const stockPct = Math.min(100, (stockCount / maxStock) * 100);
                  const stockClass = stockPct > 60 ? 'high' : stockPct > 25 ? 'medium' : 'low';
                  const DURATION = 0.8;
                  return (
                    <tr key={p.id} style={{
                      animation: `adminRowWave ${DURATION}s ease-out both`,
                      animationDelay: `${rowIdx * 80}ms`,
                    }}>
                      {/* Product Name + image */}
                      <td>
                        <div className="admin-product-cell">
                          <div className="admin-product-avatar">
                            {p.imageUrl
                              ? <img src={p.imageUrl} alt={p.name} />
                              : <span>{(p.name || '?')[0]}</span>
                            }
                          </div>
                          <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem' }}>{p.name}</span>
                        </div>
                      </td>
                      {/* SKU — shows admin email + masked password dots */}
                      <td>
                        <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', lineHeight: 1.6 }}>
                          admin@email.com<br />
                          <span style={{ color: 'var(--admin-accent)', letterSpacing: 3, fontSize: '0.7rem' }}></span>
                        </div>
                      </td>
                      {/* Category */}
                      <td style={{ color: 'var(--admin-text-secondary)', fontSize: '0.85rem' }}>
                        {p.category?.name || p.categoryName || 'Digital'}
                      </td>
                      {/* Stock bar */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div className="admin-stock-bar">
                            <div className={`admin-stock-bar-fill ${stockClass}`} style={{ width: `${stockPct}%` }} />
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)' }}>{stockCount} {isKhmer ? 'នៅសល់' : 'left'}</span>
                        </div>
                      </td>
                      {/* Price */}
                      <td style={{ fontWeight: 700, color: '#fff' }}>${Number(p.price).toFixed(2)}</td>
                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <Link to={`/admin/products/${p.id}/stock`} className="admin-action-btn" title={isKhmer ? 'គ្រប់គ្រងស្តុក' : 'Manage Stock'}>
                            <FiDatabase size={14} />
                          </Link>
                          <Link to="/admin/products" className="admin-action-btn edit" title={isKhmer ? 'កែប្រែ' : 'Edit'}>
                            <FiEdit2 size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 16px', textAlign: 'right' }}>
            <Link to="/admin/products" className="admin-btn admin-btn-outline admin-btn-sm">{isKhmer ? 'មើលទាំងអស់ →' : 'View All →'}</Link>
          </div>
        </div>

        {/*  Order Fulfillment Log  */}
        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-title">{isKhmer ? 'កំណត់ហេតុការបញ្ជាទិញ' : 'Order Fulfillment Log'}</span>
            <button className="admin-more-btn"><FiMoreHorizontal /></button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{isKhmer ? 'លេខកូដបញ្ជាទិញ' : 'Order ID'}</th>
                  <th>{isKhmer ? 'អតិថិជន' : 'Customer'}</th>
                  <th>{isKhmer ? 'ចំនួនមុខទំនិញ' : 'Items'}</th>
                  <th>{isKhmer ? 'កាលបរិច្ឆេទ' : 'Date'}</th>
                  <th>{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                  <th>{isKhmer ? 'សកម្មភាព' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--admin-text-muted)' }}>
                      {isKhmer ? 'មិនទាន់មានការបញ្ជាទិញទេ។ ' : 'No orders yet. '} <Link to="/admin/orders" style={{ color: 'var(--admin-accent)' }}>{isKhmer ? 'មើលការបញ្ជាទិញ →' : 'View orders →'}</Link>
                    </td>
                  </tr>
                ) : recentOrders.map(o => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 700, color: '#fff' }}>#{o.id}</td>
                    <td style={{ color: 'var(--admin-text-secondary)', fontSize: '0.82rem', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.customerEmail?.split('@')[0] || 'Customer'}
                    </td>
                    <td style={{ color: 'var(--admin-text-secondary)' }}>{o.items?.length ?? 1}</td>
                    <td style={{ color: 'var(--admin-text-secondary)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td>
                      <span className={`admin-badge ${getStatusBadge(o.status)}`}>{o.status}</span>
                    </td>
                    <td>
                      <button className="admin-more-btn"><FiMoreHorizontal size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 16px', textAlign: 'right' }}>
            <Link to="/admin/orders" className="admin-btn admin-btn-outline admin-btn-sm">{isKhmer ? 'មើលទាំងអស់ →' : 'View All →'}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
