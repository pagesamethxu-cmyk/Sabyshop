import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { FiX, FiCheckCircle, FiClock, FiPackage, FiShield, FiCreditCard } from 'react-icons/fi';

export default function StatusDetailsModal({ isOpen, onClose, order }) {
  const { lang } = useLanguage();
  const isKhmer = lang === 'km';

  if (!isOpen || !order) return null;

  const isCompleted = order.status === 'COMPLETED';
  const isDelivered = order.status === 'DELIVERED';
  const isProcessing = order.status === 'PROCESSING';
  const isPending = order.status === 'PENDING';
  const isDisputed = order.status === 'DISPUTED';
  const isCancelled = order.status === 'CANCELLED';

  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleString() : '';
  const deliveredDate = order.sellerDeliveredAt ? new Date(order.sellerDeliveredAt).toLocaleString() : '';

  const steps = [
    {
      id: 1,
      title: isKhmer ? 'ការបញ្ជាទិញបានបង្កើត និងទូទាត់ជោគជ័យ' : 'Order Created & Payment Confirmed',
      desc: isKhmer ? `បានបង់ប្រាក់តាម ${order.paymentMethod || 'KHQR / Paypal'}` : `Paid via ${order.paymentMethod || 'KHQR / Paypal'}`,
      time: orderDate,
      done: !isPending,
      current: isPending,
      icon: FiCreditCard
    },
    {
      id: 2,
      title: isKhmer ? 'អ្នកលក់បានប្រគល់ទំនិញរួចរាល់' : 'Delivered by Seller',
      desc: isKhmer ? 'ព័ត៌មានគណនីត្រូវបានប្រគល់ជូន និងស្ថិតក្រោមការការពារ Escrow' : 'Account credentials delivered under Safe Escrow protection',
      time: deliveredDate || (isDelivered || isCompleted ? orderDate : null),
      done: isDelivered || isCompleted,
      current: isDelivered,
      icon: FiPackage
    },
    {
      id: 3,
      title: isKhmer ? 'ការបញ្ជាទិញបានបញ្ចប់' : 'Order Completed',
      desc: isKhmer ? 'អ្នកទិញបានបញ្ជាក់ការទទួល និងបានវាយតម្លៃ' : 'Buyer confirmed receipt and funds released to seller',
      time: isCompleted ? (deliveredDate || orderDate) : null,
      done: isCompleted,
      current: isCompleted,
      icon: FiCheckCircle
    }
  ];

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
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: 'var(--card-bg, #ffffff)',
          color: 'var(--text, #0f172a)',
          borderRadius: 20,
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
          border: '1px solid var(--border, #e2e8f0)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border, #e2e8f0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-secondary, #f8fafc)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiClock size={18} color="#4f46e5" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
              {isKhmer ? 'ព័ត៌មានលម្អិតអំពីស្ថានភាព' : 'Status Details'}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-light, #94a3b8)',
              padding: 4
            }}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Timeline Body */}
        <div style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative' }}>
            {/* Vertical connector line */}
            <div
              style={{
                position: 'absolute',
                top: 16,
                bottom: 16,
                left: 17,
                width: 2,
                background: 'var(--border, #e2e8f0)',
                zIndex: 0
              }}
            />

            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 16,
                    position: 'relative',
                    zIndex: 1
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: step.done
                        ? '#10b981'
                        : step.current
                        ? '#3b82f6'
                        : 'var(--bg-secondary, #f1f5f9)',
                      color: step.done || step.current ? '#ffffff' : 'var(--text-light, #94a3b8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: step.done || step.current ? 'none' : '2px solid var(--border, #cbd5e1)',
                      boxShadow: step.done || step.current ? '0 2px 8px rgba(16,185,129,0.3)' : 'none'
                    }}
                  >
                    <Icon size={18} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: '0.92rem',
                        color: step.done ? '#065f46' : step.current ? '#1d4ed8' : 'var(--text, #0f172a)'
                      }}
                    >
                      {step.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-light, #64748b)', marginTop: 2 }}>
                      {step.desc}
                    </div>
                    {step.time && (
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-lighter, #94a3b8)',
                          marginTop: 4,
                          fontWeight: 600
                        }}
                      >
                        {step.time}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Safe Escrow Info Box */}
          <div
            style={{
              marginTop: 22,
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 12,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: '0.78rem',
              color: '#166534'
            }}
          >
            <FiShield size={20} color="#16a34a" style={{ flexShrink: 0 }} />
            <span>
              {isKhmer
                ? 'ប្រព័ន្ធ Safe Trade Escrow ការពារការទូទាត់ និងធានាប្តូរថ្មី 1-to-1 រហូតដល់អតិថិជនបញ្ជាក់ទទួលដោយជោគជ័យ។'
                : 'Safe Trade Escrow holds payment securely and guarantees 1-to-1 replacement until customer confirms receipt.'}
            </span>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              marginTop: 18,
              width: '100%',
              padding: '10px',
              borderRadius: 10,
              border: '1px solid var(--border, #cbd5e1)',
              background: 'var(--bg-secondary, #f8fafc)',
              color: 'var(--text, #0f172a)',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer'
            }}
          >
            {isKhmer ? 'បិទ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
