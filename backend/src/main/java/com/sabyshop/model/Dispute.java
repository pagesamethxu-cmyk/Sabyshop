package com.sabyshop.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "disputes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dispute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "seller_id")
    private User seller;

    /**
     * ORDER_NOT_RECEIVED, WRONG_INCOMPLETE_PRODUCT, ACCOUNT_VOUCHER_PROBLEM, OTHER
     */
    @Column(nullable = false)
    private String issueType;

    /**
     * REPLACEMENT, REFUND
     */
    @Column(nullable = false)
    private String preferredSolution;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    /** Comma-separated or JSON list of evidence image URLs */
    @Column(columnDefinition = "TEXT")
    private String evidenceImages;

    /**
     * OPEN (Waiting Seller),
     * RESOLVED_REPLACED (Seller provided replacement),
     * RESOLVED_REFUNDED (Seller approved refund),
     * ESCALATED_ADMIN (Seller rejected ឬ escalated to Admin Mediation),
     * RESOLVED_ADMIN_REFUNDED (Admin decided Refund to Buyer),
     * RESOLVED_ADMIN_COMPLETED (Admin decided Completed to Seller),
     * REJECTED (Dispute dismissed),
     * CLOSED
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DisputeStatus status = DisputeStatus.OPEN;

    @Column(columnDefinition = "TEXT")
    private String sellerResponse;

    private String replacementAccountEmail;
    private String replacementAccountPassword;

    @Column(columnDefinition = "TEXT")
    private String replacementNote;

    @Column(columnDefinition = "TEXT")
    private String adminNotes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;

    public enum DisputeStatus {
        OPEN,
        RESOLVED_REPLACED,
        RESOLVED_REFUNDED,
        ESCALATED_ADMIN,
        RESOLVED_ADMIN_REFUNDED,
        RESOLVED_ADMIN_COMPLETED,
        REJECTED,
        CLOSED
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
