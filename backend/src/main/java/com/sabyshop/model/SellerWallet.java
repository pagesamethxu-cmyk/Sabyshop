package com.sabyshop.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Table 24: seller_wallets
 * Stores multi-balance wallet records for sellers (available, escrow/pending, frozen, cumulative earnings/withdrawals).
 */
@Entity
@Table(name = "seller_wallets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class SellerWallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "seller_id", unique = true, nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User seller;

    @Column(nullable = false)
    @Builder.Default
    private Double balance = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double pendingBalance = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double frozenBalance = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double totalEarned = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double totalWithdrawn = 0.0;

    @Builder.Default
    private String currency = "USD";

    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, LOCKED, SUSPENDED

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @JsonProperty("sellerId")
    public Long getSellerId() {
        try {
            return seller != null ? seller.getId() : null;
        } catch (Exception e) {
            return null;
        }
    }

    @JsonProperty("sellerName")
    public String getSellerName() {
        try {
            return seller != null ? seller.getName() : null;
        } catch (Exception e) {
            return null;
        }
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
