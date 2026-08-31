import React, { useState } from 'react';
import { reviews as reviewsApi } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import { FiX, FiStar, FiCheck, FiPackage } from 'react-icons/fi';

const SATISFIED_TAGS_EN = [
  'Swift delivery',
  'Friendly seller',
  "Fast seller's response",
  'Perfect product'
];

const SATISFIED_TAGS_KM = [
  'ដឹករហ័ស',
  'អ្នកលក់រាក់ទាក់',
  'ឆ្លើយតបរហ័ស',
  'ទំនិញល្អឥតខ្ចោះ'
];

const UNSATISFIED_TAGS_EN = [
  'Slow delivery',
  'Unresponsive seller',
  'Account problem',
  'Product not as described'
];

const UNSATISFIED_TAGS_KM = [
  'ដឹកយឺត',
  'អ្នកលក់មិនឆ្លើយ',
  'បញ្ហាគណនី',
  'ទំនិញមិនដូចការពិពណ៌នា'
];

export default function ReviewModal({
  productId,
  orderId,
  productName,
  productImage,
  categoryName,
  onClose,
  onSuccess
}) {
  const { lang } = useLanguage();
  const isKhmer = lang === 'km';

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);

  const availableTags = rating >= 4
    ? (isKhmer ? SATISFIED_TAGS_KM : SATISFIED_TAGS_EN)
    : (isKhmer ? UNSATISFIED_TAGS_KM : UNSATISFIED_TAGS_EN);

  const handleRatingChange = (newStar) => {
    setRating(newStar);
    // Clear tags if rating polarity switches
    setSelectedTags([]);
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const isFormValid = rating > 0 && selectedTags.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      return toast.error(isKhmer ? 'សូមជ្រើសរើសចំនួនផ្កាយវាយតម្លៃ' : 'Please select a star rating');
    }
    if (selectedTags.length === 0) {
      return toast.error(
        isKhmer ? 'អ្នកត្រូវតែជ្រើសរើសយ៉ាងហោចណាស់ ១ ហេតុផល' : 'You must choose at least 1 reason'
      );
    }

    setSubmitting(true);
    setShowSkeleton(true);

    try {
      const payload = {
        productId,
        orderId,
        rating,
        comment: comment.trim(),
        tags: selectedTags.join(', ')
      };

      await reviewsApi.submit(payload);

      // Brief delay to display skeleton transition smoothly like in video
      setTimeout(() => {
        onSuccess?.({
          rating,
          comment,
          tags: selectedTags.join(', ')
        });
        onClose?.();
      }, 700);
    } catch (err) {
      setShowSkeleton(false);
      setSubmitting(false);
      toast.error(
        err?.response?.data?.message ||
          (isKhmer ? 'មិនអាចបញ្ជូនការវាយតម្លៃបានទេ' : 'Failed to submit review')
      );
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => e.target === e.currentTarget && !submitting && onClose()}
    >
      <style>{`
        @keyframes shimmerSlow {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .review-skeleton-bar {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: shimmerSlow 1.5s infinite;
          border-radius: 6px;
        }
      `}</style>

      <div
        style={{
          background: 'var(--card-bg, #ffffff)',
          color: 'var(--text, #0f172a)',
          borderRadius: 20,
          width: '100%',
          maxWidth: 440,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
          border: '1px solid var(--border, #e2e8f0)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
          position: 'relative'
        }}
      >
        {/* SKELETON LOADING VIEW ON SUBMIT (matches video frame 00:12) */}
        {showSkeleton ? (
          <div style={{ padding: '24px 20px', minHeight: 460, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header skeleton */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="review-skeleton-bar" style={{ width: 140, height: 22 }} />
              <div className="review-skeleton-bar" style={{ width: 60, height: 16 }} />
            </div>
            {/* Product card skeleton */}
            <div style={{ display: 'flex', gap: 12, padding: '12px', border: '1px solid #f1f5f9', borderRadius: 12 }}>
              <div className="review-skeleton-bar" style={{ width: 44, height: 44, borderRadius: 8 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="review-skeleton-bar" style={{ width: '80%', height: 16 }} />
                <div className="review-skeleton-bar" style={{ width: '40%', height: 12 }} />
              </div>
            </div>
            {/* Content skeleton */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
              <div className="review-skeleton-bar" style={{ width: '90%', height: 18 }} />
              <div className="review-skeleton-bar" style={{ width: '100%', height: 70, borderRadius: 10 }} />
              <div className="review-skeleton-bar" style={{ width: '70%', height: 16 }} />
              <div className="review-skeleton-bar" style={{ width: '100%', height: 40, borderRadius: 8, marginTop: 10 }} />
            </div>
            <div style={{ marginTop: 'auto' }}>
              <div className="review-skeleton-bar" style={{ width: '100%', height: 46, borderRadius: 10 }} />
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border, #e2e8f0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                background: 'var(--card-bg, #ffffff)'
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text)' }}>
                {isKhmer ? 'ផ្តល់ការវាយតម្លៃ' : 'Give Review'}
              </h3>
              <button
                onClick={onClose}
                id="review-modal-close"
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-light, #94a3b8)',
                  padding: 6,
                  borderRadius: 8
                }}
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Product Summary Strip */}
            <div
              style={{
                padding: '12px 18px',
                borderBottom: '1px solid var(--border, #e2e8f0)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'var(--bg-secondary, #f8fafc)'
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: '#ffffff',
                  border: '1px solid var(--border, #e2e8f0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  overflow: 'hidden'
                }}
              >
                {productImage ? (
                  <img
                    src={productImage}
                    alt={productName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <FiPackage size={22} color="var(--primary, #4f46e5)" />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    color: 'var(--text, #0f172a)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {productName || (isKhmer ? 'ផលិតផលឌីជីថល' : 'Digital Product')}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-light, #64748b)', marginTop: 2 }}>
                  {categoryName || 'Netflix'}
                </div>
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} style={{ padding: '20px 20px 22px' }}>
              {/* Question: What is the rating for this order? */}
              <div style={{ textAlign: 'center', marginBottom: 18 }}>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    color: 'var(--text, #0f172a)',
                    marginBottom: 14
                  }}
                >
                  {isKhmer ? 'តើអ្នកឱ្យពិន្ទុប៉ុន្មានចំពោះការបញ្ជាទិញនេះ?' : 'What is the rating for this order?'}
                </div>

                {/* 5 Star Selector */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingChange(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        id={`review-star-${star}`}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 4,
                          transition: 'transform 0.15s ease',
                          transform: isFilled ? 'scale(1.15)' : 'scale(1)'
                        }}
                      >
                        <FiStar
                          size={32}
                          color={isFilled ? '#f59e0b' : '#cbd5e1'}
                          fill={isFilled ? '#f59e0b' : 'none'}
                          strokeWidth={1.5}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Satisfaction Tags Section */}
              {rating > 0 && (
                <div style={{ marginTop: 18, animation: 'fadeIn 0.2s ease-out' }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      color: 'var(--text, #0f172a)',
                      marginBottom: 8
                    }}
                  >
                    {rating >= 4
                      ? isKhmer
                        ? 'តើអ្វីដែលធ្វើឱ្យអ្នកពេញចិត្ត?'
                        : 'What makes you satisfied?'
                      : isKhmer
                      ? 'តើមានបញ្ហាអ្វីកើតឡើង?'
                      : 'What went wrong?'}
                  </div>

                  {/* Pills */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                    {availableTags.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          style={{
                            padding: '7px 14px',
                            borderRadius: 8,
                            border: isSelected ? '1.5px solid #2563eb' : '1px solid var(--border, #cbd5e1)',
                            background: isSelected ? '#eff6ff' : 'var(--bg-secondary, #f8fafc)',
                            color: isSelected ? '#1d4ed8' : 'var(--text, #334155)',
                            fontWeight: isSelected ? 800 : 600,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          {isSelected && <FiCheck size={13} color="#2563eb" />}
                          <span>{tag}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Requirement notice */}
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: selectedTags.length === 0 ? '#ef4444' : 'var(--text-light, #64748b)',
                      fontWeight: 600,
                      marginBottom: 16
                    }}
                  >
                    {isKhmer
                      ? 'អ្នកត្រូវតែជ្រើសរើសយ៉ាងហោចណាស់ ១ ហេតុផល។'
                      : 'You must choose at least 1 reason.'}
                  </div>

                  {/* Feedback Textarea */}
                  <div style={{ marginBottom: 12 }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        color: 'var(--text, #0f172a)',
                        marginBottom: 6
                      }}
                    >
                      {isKhmer ? 'តើធ្វើដូចម្តេចដើម្បីឱ្យកាន់តែប្រសើរឡើង?' : 'How to make it even better?'}
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value.slice(0, 140))}
                      placeholder={
                        isKhmer
                          ? 'ចែករំលែកបទពិសោធន៍របស់អ្នកចំពោះការបញ្ជាទិញនេះ...'
                          : 'Tell us about your experience with this order'
                      }
                      rows={3}
                      maxLength={140}
                      id="review-comment"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid var(--border, #cbd5e1)',
                        background: 'var(--bg-secondary, #f8fafc)',
                        color: 'var(--text, #0f172a)',
                        fontSize: '0.84rem',
                        outline: 'none',
                        resize: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.72rem',
                        color: 'var(--text-lighter, #94a3b8)',
                        marginTop: 4
                      }}
                    >
                      <span>
                        {isKhmer
                          ? `${comment.length} នៃ 140 តួអក្សរ`
                          : `${comment.length} of 140 characters`}
                      </span>
                    </div>
                  </div>

                  {/* Privacy note */}
                  <div
                    style={{
                      fontSize: '0.73rem',
                      color: 'var(--text-light, #64748b)',
                      lineHeight: 1.4,
                      marginBottom: 20
                    }}
                  >
                    {isKhmer
                      ? 'ឈ្មោះរបស់អ្នកត្រូវបានរក្សាការសម្ងាត់នៅពេលអ្នកផ្តល់ការវាយតម្លៃនេះ។'
                      : 'Your name is kept private when you provide this review.'}
                  </div>
                </div>
              )}

              {/* Bottom Send Button */}
              <button
                type="submit"
                disabled={!isFormValid || submitting}
                id="review-submit-btn"
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: 10,
                  border: 'none',
                  background: isFormValid
                    ? '#2563eb'
                    : 'var(--border, #cbd5e1)',
                  color: isFormValid ? '#ffffff' : 'var(--text-light, #94a3b8)',
                  fontWeight: 800,
                  fontSize: '0.94rem',
                  cursor: isFormValid && !submitting ? 'pointer' : 'not-allowed',
                  boxShadow: isFormValid ? '0 4px 14px rgba(37, 99, 235, 0.3)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {submitting
                  ? isKhmer
                    ? 'កំពុងបញ្ជូន...'
                    : 'Submitting...'
                  : isKhmer
                  ? 'ផ្ញើ'
                  : 'Send'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
