import React from 'react';
import { Link } from 'react-router-dom';
import { FiInbox } from 'react-icons/fi';
import defaultEmptyImg from '../assets/empty-state.png';

const EmptyState = ({ 
  image = defaultEmptyImg,
  imageAlt = 'No items found',
  imageSize = 160,
  icon = null,
  title = 'Nothing here!', 
  description,
  message,
  actionText,
  actionLink = '/',
  onAction,
  extraContent,
  children,
  className = '',
  style = {}
}) => {
  const descText = description || message;
  const numericSize = typeof imageSize === 'number' ? imageSize : parseInt(imageSize, 10) || 160;

  return (
    <div 
      className={`empty-state-card animate-fade-in ${className}`} 
      style={{
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        textAlign: 'center', 
        padding: '56px 24px',
        background: 'var(--card-bg, #FFFFFF)', 
        borderRadius: 'var(--radius-lg, 24px)',
        boxShadow: 'var(--shadow, 0 4px 20px -2px rgba(15, 23, 42, 0.08))', 
        border: '1.5px dashed var(--border, #E2E8F0)',
        maxWidth: '720px',
        margin: '24px auto',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
    >
      {/* Visual Anchor (Branded Saby Shop Illustration or Custom Icon) */}
      <div style={{ 
        position: 'relative', 
        marginBottom: '24px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {image ? (
          <>
            {/* Ambient Pink Glow behind image */}
            <div 
              aria-hidden="true"
              style={{
                position: 'absolute',
                width: `${numericSize * 0.9}px`,
                height: `${numericSize * 0.9}px`,
                background: 'radial-gradient(circle, rgba(255, 71, 133, 0.22) 0%, rgba(255, 71, 133, 0.04) 65%, transparent 100%)',
                borderRadius: '50%',
                filter: 'blur(16px)',
                zIndex: 0,
                pointerEvents: 'none'
              }} 
            />
            <img 
              src={image} 
              alt={imageAlt || title || 'Empty'} 
              className="empty-state-img"
              style={{
                width: `${numericSize}px`,
                height: `${numericSize}px`,
                maxWidth: '100%',
                objectFit: 'contain',
                position: 'relative',
                zIndex: 1,
                filter: 'drop-shadow(0 12px 24px rgba(255, 71, 133, 0.2))',
                animation: 'emptyStateFloat 4s ease-in-out infinite',
                userSelect: 'none'
              }}
              onError={(e) => {
                // If local image fails to load, fallback to public path
                if (e.target.src !== '/images/empty-state.png') {
                  e.target.src = '/images/empty-state.png';
                }
              }}
            />
          </>
        ) : (
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'var(--primary-light, #FFF0F5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(255, 71, 133, 0.15)'
          }}>
            {icon || <FiInbox size={42} color="var(--primary, #FF4785)" />}
          </div>
        )}
      </div>

      {/* Main Title */}
      {title && (
        <h2 style={{ 
          fontSize: '1.3rem', 
          fontWeight: 800, 
          color: 'var(--text, #1E293B)', 
          marginBottom: '10px',
          letterSpacing: '-0.01em',
          lineHeight: 1.35
        }}>
          {title}
        </h2>
      )}

      {/* Description Text */}
      {descText && (
        <p style={{ 
          color: 'var(--text-light, #334155)', 
          fontSize: '0.94rem',
          maxWidth: '480px', 
          lineHeight: 1.6,
          marginBottom: actionText ? '26px' : '0' 
        }}>
          {descText}
        </p>
      )}
      
      {/* Call to Action Button */}
      {actionText && (
        onAction ? (
          <button 
            type="button"
            onClick={onAction} 
            className="btn btn-primary"
            style={{
              padding: '11px 28px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.92rem',
              boxShadow: '0 6px 18px rgba(255, 71, 133, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: 'none',
              transition: 'var(--transition, all 0.25s ease)'
            }}
          >
            {actionText}
          </button>
        ) : (
          <Link 
            to={actionLink} 
            className="btn btn-primary"
            style={{
              padding: '11px 28px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.92rem',
              boxShadow: '0 6px 18px rgba(255, 71, 133, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              transition: 'var(--transition, all 0.25s ease)'
            }}
          >
            {actionText}
          </Link>
        )
      )}

      {/* Optional Extra Content / Custom Children */}
      {extraContent}
      {children}

      <style>{`
        @keyframes emptyStateFloat {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-6px) scale(1.02);
          }
        }
      `}</style>
    </div>
  );
};

export default EmptyState;
