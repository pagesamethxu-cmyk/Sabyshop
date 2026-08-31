package com.sabyshop.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Table 29: order_deliveries
 * Encrypted credential delivery logs, serial keys, and seller fulfillment dispatches.
 */
@Entity
@Table(name = "order_deliveries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class OrderDelivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private OrderItem orderItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivered_by_user_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User deliveredBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DeliveryType deliveryType = DeliveryType.AUTOMATED_STOCK;

    private String accountEmail;

    private String accountPassword;

    @Column(columnDefinition = "TEXT")
    private String secretPayload; // Additional tokens, backup codes, or license keys

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DeliveryStatus status = DeliveryStatus.DELIVERED;

    private LocalDateTime deliveredAt;

    private LocalDateTime createdAt;

    public enum DeliveryType {
        AUTOMATED_STOCK,
        MANUAL_SELLER,
        REPLACEMENT
    }

    public enum DeliveryStatus {
        PENDING,
        DELIVERED,
        REPLACED,
        FAILED
    }

    @JsonProperty("orderId")
    public Long getOrderId() {
        return order != null ? order.getId() : null;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.deliveredAt == null) {
            this.deliveredAt = LocalDateTime.now();
        }
    }
}
