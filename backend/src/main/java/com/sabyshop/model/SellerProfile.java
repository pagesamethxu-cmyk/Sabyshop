package com.sabyshop.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Represents a seller's store profile.
 * Created when a user applies to become a seller and pays the subscription fee.
 */
@Entity
@Table(name = "seller_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** One-to-one with User — each user can have at most one seller profile */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    @Column(nullable = false)
    private String storeName;

    @Column(columnDefinition = "TEXT")
    private String storeDescription;

    private String storeLogoUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SubscriptionStatus subscriptionStatus = SubscriptionStatus.PENDING;

    /** Bakong KHQR MD5 hash used to verify the $2.50 subscription payment */
    private String paymentId;

    /** Date/time when the current subscription period expires */
    private LocalDateTime subscriptionExpiresAt;

    private LocalDateTime lastStoreNameChangedAt;

    /** Indicates whether this store is flagged as a duplicate and must change its name */
    @Builder.Default
    private Boolean duplicateWarning = false;

    /** When the duplicate warning notice was issued */
    private LocalDateTime duplicateWarningAt;

    /** Deadline for changing the duplicate store name (7 days grace period). After this date, store is auto-deleted. */
    private LocalDateTime nameChangeDeadline;

    /** Track if this seller profile has used the 1-time 7-day free trial */
    @Builder.Default
    private Boolean hasUsedFreeTrial = false;

    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    @Builder.Default
    private SubscriptionPlan subscriptionPlan = SubscriptionPlan.PLAN_1;

    /** Seller's direct/personal Telegram username without @ (e.g. saby_seller) */
    private String telegramUsername;

    /** Seller's official Telegram channel or group link/username */
    private String telegramChannel;

    /** Preferred contact method: ALL, WEBSITE, TELEGRAM_PERSONAL, TELEGRAM_CHANNEL */
    @Builder.Default
    private String preferredContactMethod = "ALL";

    /** Linked Telegram Chat ID for automated order notifications */
    private String telegramChatId;

    public enum SubscriptionStatus {
        PENDING,    // payment not yet confirmed
        ACTIVE,     // subscription is active
        EXPIRED     // subscription expired, store is deactivated
    }

    public enum SubscriptionPlan {
        PLAN_1, // $2.50 Basic Plan
        PLAN_2, // $4.50 Pro Plan + AI Auto Reply & Product Alerts
        PLAN_3  // $6.00 VIP Plan + AI Search & Top Store Boost (7d)
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
