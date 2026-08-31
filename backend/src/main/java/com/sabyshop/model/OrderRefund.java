package com.sabyshop.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Table 30: order_refunds
 * Stores customer refund records, resolution reasons, refund channels, and admin approvals.
 */
@Entity
@Table(name = "order_refunds")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class OrderRefund {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "items", "user"})
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispute_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "order", "buyer", "seller"})
    private Dispute dispute;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "roles"})
    private User user; // Refund recipient (buyer)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by_admin_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "roles"})
    private User processedBy;

    @Column(nullable = false)
    private Double amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RefundType refundType = RefundType.STORE_CREDIT;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RefundStatus status = RefundStatus.COMPLETED;

    private String transactionReference;

    private LocalDateTime processedAt;

    private LocalDateTime createdAt;

    public enum RefundType {
        STORE_CREDIT,
        BAKONG_KHQR,
        ABA_ORIGINAL,
        MANUAL_BANK
    }

    public enum RefundStatus {
        PENDING,
        APPROVED,
        COMPLETED,
        REJECTED
    }

    @JsonProperty("orderId")
    public Long getOrderId() {
        try {
            return order != null ? order.getId() : null;
        } catch (Exception e) {
            return null;
        }
    }

    @JsonProperty("customerName")
    public String getCustomerName() {
        try {
            return user != null ? user.getName() : null;
        } catch (Exception e) {
            return null;
        }
    }

    @JsonProperty("customerEmail")
    public String getCustomerEmail() {
        try {
            return user != null ? user.getEmail() : null;
        } catch (Exception e) {
            return null;
        }
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.processedAt == null && this.status == RefundStatus.COMPLETED) {
            this.processedAt = LocalDateTime.now();
        }
    }
}
