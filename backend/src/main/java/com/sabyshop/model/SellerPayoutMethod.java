package com.sabyshop.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Table 31: seller_payout_methods
 * Stores seller payout destinations (Bakong KHQR, ABA Bank, ACLEDA, Wing) with default preferences.
 */
@Entity
@Table(name = "seller_payout_methods")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class SellerPayoutMethod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User seller;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private MethodType methodType = MethodType.BAKONG_KHQR;

    @Column(nullable = false)
    private String accountName; // Account holder full name

    @Column(nullable = false)
    private String accountNumber; // Bank account number or Bakong ID

    private String bankName; // e.g. "ABA Bank", "ACLEDA Bank", "Wing Bank"

    @Column(columnDefinition = "TEXT")
    private String khqrData; // Deep link / QR string

    @Column(columnDefinition = "TEXT")
    private String khqrImageUrl; // Uploaded QR image asset

    @Builder.Default
    @Column(nullable = false)
    private Boolean isDefault = false;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isActive = true;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public enum MethodType {
        BAKONG_KHQR,
        ABA_BANK,
        ACLEDA_BANK,
        WING_BANK,
        OTHER_BANK
    }

    @JsonProperty("sellerId")
    public Long getSellerId() {
        return seller != null ? seller.getId() : null;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.updatedAt == null) {
            this.updatedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
