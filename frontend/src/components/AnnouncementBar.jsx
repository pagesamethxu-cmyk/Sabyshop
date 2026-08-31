import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function AnnouncementBar() {
  const { t } = useLanguage();

  return (
    <div style={{
      background: 'linear-gradient(90deg, #FF2B6D 0%, #FF4785 40%, #FF6BA0 80%, #FF4785 100%)',
      color: '#FFFFFF',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      position: 'relative',
      fontSize: '0.82rem',
      fontWeight: 600,
      borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
      boxShadow: '0 2px 8px rgba(255, 71, 133, 0.35)',
      zIndex: 1000,
    }}>
      <div 
        className="announcement-marquee-track"
        style={{
          display: 'flex',
          whiteSpace: 'nowrap',
          width: 'max-content',
          animation: 'announcementMarquee 38s linear infinite',
          willChange: 'transform',
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <span key={i} style={{ paddingRight: '48px', display: 'inline-flex', alignItems: 'center' }}>
            {t('announcement.welcomeText')}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes announcementMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .announcement-marquee-track:hover {
          animation-play-state: paused !important;
        }
      `}</style>
    </div>
  );
}
