package com.sabyshop.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Table 23: payments
 * Stores transaction payments, gateway reference IDs, payment method, amount and status.
 */
@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "items", "user"})
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "roles"})
    private User user;

    @Column(nullable = false)
    private String paymentMethod; // e.g. "ABA_PAYWAY", "BAKONG_KHQR", "STORE_BALANCE", "MANUAL_TRANSFER"

    @Column(unique = true)
    private String transactionId; // e.g. MD5 hash, ABA tran_id

    @Column(nullable = false)
    private Double amount;

    @Builder.Default
    private String currency = "USD";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    private String provider; // "ABA", "BAKONG", "SYSTEM"

    @Column(columnDefinition = "TEXT")
    private String providerPayload;

    private LocalDateTime paidAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public enum PaymentStatus {
        PENDING,
        SUCCESSFUL,
        FAILED,
        REFUNDED,
        CANCELLED
    }

    @JsonProperty("orderId")
    public Long getOrderId() {
        return order != null ? order.getId() : null;
    }

    @JsonProperty("customerEmail")
    public String getCustomerEmail() {
        return user != null ? user.getEmail() : (order != null && order.getUser() != null ? order.getUser().getEmail() : null);
    }

    @JsonProperty("customerName")
    public String getCustomerName() {
        return user != null ? user.getName() : (order != null && order.getUser() != null ? order.getUser().getName() : null);
    }

    @JsonProperty("totalAmount")
    public Double getTotalAmount() {
        return amount != null ? amount : 0.0;
    }

    @JsonProperty("paymentStatus")
    public String getPaymentStatus() {
        return status != null ? status.name() : "PENDING";
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
