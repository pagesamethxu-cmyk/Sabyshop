package com.sabyshop.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Table 25: wallet_transactions
 * Double-entry ledger of all wallet operations (sales, commissions, withdrawals, refunds, adjustments).
 */
@Entity
@Table(name = "wallet_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class WalletTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private SellerWallet wallet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User seller;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;

    @Column(nullable = false)
    private Double amount;

    private Double balanceBefore;

    private Double balanceAfter;

    private String referenceType; // "ORDER", "WITHDRAW_REQUEST", "REFUND", "SUBSCRIPTION", "ADMIN"

    private String referenceId; // order ID, withdrawal ID, etc.

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TransactionStatus status = TransactionStatus.COMPLETED;

    private LocalDateTime createdAt;

    public enum TransactionType {
        ORDER_SALE,
        COMMISSION_FEE,
        WITHDRAWAL,
        WITHDRAWAL_REFUND,
        REFUND_DEDUCTION,
        SUBSCRIPTION_PAYMENT,
        ESCROW_RELEASE,
        ADMIN_ADJUSTMENT
    }

    public enum TransactionStatus {
        PENDING,
        COMPLETED,
        FAILED,
        CANCELLED
    }

    @JsonProperty("sellerId")
    public Long getSellerId() {
        try {
            return seller != null ? seller.getId() : null;
        } catch (Exception e) {
            return null;
        }
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
