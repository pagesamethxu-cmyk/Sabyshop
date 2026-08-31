package com.sabyshop.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Table 27: notifications
 * Real-time customer, seller, and admin in-app notification alerts with click-through links and read tracking.
 */
@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User user;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isRead = false;

    private String link; // Route to navigate to, e.g. "/orders/12" or "/seller"

    @Column(columnDefinition = "TEXT")
    private String metadataJson; // Optional context data (orderId, amount, etc.)

    private LocalDateTime readAt;

    private LocalDateTime createdAt;

    public enum NotificationType {
        ORDER_CREATED,
        PAYMENT_SUCCESS,
        ORDER_DELIVERED,
        ORDER_COMPLETED,
        ORDER_CANCELLED,
        DISPUTE_OPENED,
        DISPUTE_RESOLVED,
        WALLET_CREDITED,
        WITHDRAWAL_UPDATE,
        SUPPORT_REPLY,
        SYSTEM_BROADCAST,
        SECURITY_ALERT
    }

    @JsonProperty("userId")
    public Long getUserId() {
        return user != null ? user.getId() : null;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
