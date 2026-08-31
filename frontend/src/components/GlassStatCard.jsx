import React from 'react';

/**
 * Premium Glassmorphism SaaS Stat Card Component
 * Inspired by Apple + Linear + Stripe UI design systems.
 */
export const GlassStatCard = ({
  title = "Total Revenue",
  value = "$148,250.00",
  change = "+12.5%",
  isPositive = true,
  chartData = [20, 35, 25, 45, 30, 60, 50, 75],
  color = "magenta" // magenta, cyan, purple, blue
}) => {
  const W = 130;
  const H = 45;
  const min = Math.min(...chartData);
  const max = Math.max(...chartData);
  const range = max - min || 1;
  
  const pts = chartData.map((v, i) => ({
    x: (i / (chartData.length - 1)) * W,
    y: H - ((v - min) / range) * (H - 10) - 5
  }));

  const pathLine = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const pathArea = `${pathLine} L ${W} ${H} L 0 ${H} Z`;

  const gradientColors = {
    magenta: { stroke: '#EC4899', fill: 'rgba(236, 72, 153, 0.25)', border: 'rgba(236, 72, 153, 0.4)', glow: 'rgba(236, 72, 153, 0.3)' },
    cyan: { stroke: '#00F2FE', fill: 'rgba(0, 242, 254, 0.25)', border: 'rgba(0, 242, 254, 0.4)', glow: 'rgba(0, 242, 254, 0.3)' },
    purple: { stroke: '#8B5CF6', fill: 'rgba(139, 92, 246, 0.25)', border: 'rgba(139, 92, 246, 0.4)', glow: 'rgba(139, 92, 246, 0.3)' },
    blue: { stroke: '#3B82F6', fill: 'rgba(59, 130, 246, 0.25)', border: 'rgba(59, 130, 246, 0.4)', glow: 'rgba(59, 130, 246, 0.3)' }
  }[color] || gradientColors.magenta;

  return (
    <div
      className="glass-stat-card"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 320,
        padding: '20px 22px',
        borderRadius: 20,
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.02) 100%)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: `0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.25), 0 0 30px ${gradientColors.glow}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        overflow: 'hidden',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), boxShadow 0.3s ease',
        cursor: 'pointer'
      }}
    >
      {/* Ambient specular highlight stroke */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1.5,
        background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.6) 50%, transparent 100%)'
      }} />

      {/* Left Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.65)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {title}
        </span>
        <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          {value}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <span style={{
            fontSize: '0.76rem', fontWeight: 800,
            color: isPositive ? '#10B981' : '#EF4444',
            background: isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            padding: '2px 8px', borderRadius: 12, border: `1px solid ${isPositive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
          }}>
            {isPositive ? '' : ''} {change}
          </span>
        </div>
      </div>

      {/* Right Glowing Line Chart Graphic */}
      <div style={{ width: W, height: H, flexShrink: 0, position: 'relative' }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={gradientColors.stroke} stopOpacity="0.45" />
              <stop offset="100%" stopColor={gradientColors.stroke} stopOpacity="0.0" />
            </linearGradient>
            <filter id={`glow-${color}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor={gradientColors.stroke} floodOpacity="0.6" />
            </filter>
          </defs>
          <path d={pathArea} fill={`url(#grad-${color})`} />
          <path d={pathLine} fill="none" stroke={gradientColors.stroke} strokeWidth="2.5" strokeLinecap="round" filter={`url(#glow-${color})`} />
        </svg>
      </div>
    </div>
  );
};

export default GlassStatCard;
