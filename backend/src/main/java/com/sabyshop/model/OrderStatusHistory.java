package com.sabyshop.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Table 28: order_status_history
 * Complete audit trail of order lifecycle state transitions, including actor role and contextual notes.
 */
@Entity
@Table(name = "order_status_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class OrderStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Order order;

    @Column(nullable = false)
    private String fromStatus; // Previous status, e.g. "PENDING"

    @Column(nullable = false)
    private String toStatus; // New status, e.g. "PROCESSING", "COMPLETED"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by_user_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User changedBy;

    @Column(nullable = false)
    @Builder.Default
    private String actorRole = "SYSTEM"; // "SYSTEM", "BUYER", "SELLER", "ADMIN"

    @Column(columnDefinition = "TEXT")
    private String notes;

    private LocalDateTime createdAt;

    @JsonProperty("orderId")
    public Long getOrderId() {
        try {
            return order != null ? order.getId() : null;
        } catch (Exception e) {
            return null;
        }
    }

    @JsonProperty("changedByName")
    public String getChangedByName() {
        try {
            return changedBy != null ? changedBy.getName() : "System";
        } catch (Exception e) {
            return "System";
        }
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
