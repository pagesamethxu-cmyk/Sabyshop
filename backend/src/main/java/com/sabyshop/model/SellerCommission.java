package com.sabyshop.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Table 32: seller_commissions
 * Records platform commission cuts and seller net amounts per order item or order transaction.
 */
@Entity
@Table(name = "seller_commissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class SellerCommission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "seller_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "roles"})
    private User seller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "items", "user"})
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "order", "stockItem"})
    private OrderItem orderItem;

    @Column(nullable = false)
    private Double grossAmount; // Full sale price

    @Column(nullable = false)
    @Builder.Default
    private Double commissionRate = 5.0; // % e.g. 5.0%

    @Column(nullable = false)
    private Double commissionAmount; // Platform fee cut

    @Column(nullable = false)
    private Double sellerNetAmount; // Amount credited to seller

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CommissionStatus status = CommissionStatus.CLEARED;

    private LocalDateTime releaseDate;

    private LocalDateTime createdAt;

    public enum CommissionStatus {
        PENDING_ESCROW,
        CLEARED,
        REFUNDED,
        CANCELLED
    }

    @JsonProperty("orderId")
    public Long getOrderId() {
        try {
            return order != null ? order.getId() : null;
        } catch (Exception e) {
            return null;
        }
    }

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

    @JsonProperty("sellerEmail")
    public String getSellerEmail() {
        try {
            return seller != null ? seller.getEmail() : null;
        } catch (Exception e) {
            return null;
        }
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.releaseDate == null) {
            this.releaseDate = LocalDateTime.now();
        }
    }
}
