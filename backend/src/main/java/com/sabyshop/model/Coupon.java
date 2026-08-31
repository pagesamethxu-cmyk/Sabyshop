package com.sabyshop.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupons")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    /** Seller who owns this coupon; null for marketplace platform-wide coupons */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User seller;

    /** Type of discount: PERCENTAGE (e.g. 15%) or FIXED_AMOUNT (e.g. $1.50) */
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String discountType = "PERCENTAGE";

    /** Value of discount: e.g. 20 (for 20%) or 1.50 (for $1.50) */
    @Column(nullable = false)
    private Double discountValue;

    /** Minimum order spend required to apply this coupon (optional) */
    private Double minSpend;

    /** Maximum discount cap for percentage-based coupons (optional) */
    private Double maxDiscount;

    /** Maximum total times this coupon can be used (null = unlimited) */
    private Integer usageLimit;

    /** Current usage counter */
    @Builder.Default
    private Integer usedCount = 0;

    /** Valid start date/time */
    private LocalDateTime startDate;

    /** Valid end ឬ expiry date/time */
    private LocalDateTime endDate;

    /** Optional product restriction (null = applies to all seller's products) */
    private Long productId;

    @Builder.Default
    private boolean active = true;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.usedCount == null) {
            this.usedCount = 0;
        }
    }

    /** Helper to check if coupon is currently valid */
    public boolean isValid() {
        if (!active) return false;
        LocalDateTime now = LocalDateTime.now();
        if (startDate != null && now.isBefore(startDate)) return false;
        if (endDate != null && now.isAfter(endDate)) return false;
        if (usageLimit != null && usedCount >= usageLimit) return false;
        return true;
    }
}
