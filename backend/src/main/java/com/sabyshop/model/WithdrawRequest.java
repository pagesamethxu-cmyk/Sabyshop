package com.sabyshop.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Represents a seller's request to withdraw funds from their balance.
 * Balance is debited immediately; admin processes the payout within 30-60 min.
 */
@Entity
@Table(name = "withdraw_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WithdrawRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @Column(nullable = false)
    private Double amount;

    /** The seller's KHQR string that admin will scan to send money */
    @Column(columnDefinition = "TEXT")
    private String khqrString;

    /** Image URL of the uploaded KHQR code picture */
    @Column(columnDefinition = "TEXT")
    private String khqrImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private WithdrawStatus status = WithdrawStatus.PENDING;

    private LocalDateTime requestedAt;
    private LocalDateTime processedAt;

    /** Optional note from admin (e.g. reason for rejection) */
    @Column(columnDefinition = "TEXT")
    private String adminNote;

    public enum WithdrawStatus {
        PENDING,    // waiting for admin to process
        COMPLETED,  // admin has sent the money
        REJECTED    // admin rejected — balance refunded
    }
}
