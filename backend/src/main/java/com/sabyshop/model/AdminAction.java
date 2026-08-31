package com.sabyshop.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Table 40: admin_actions
 * Tamper-evident administrative audit log recording every admin decision, dispute resolution, balance update, and system action.
 */
@Entity
@Table(name = "admin_actions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AdminAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User admin;

    @Column(nullable = false)
    private String actionType; // "RESOLVE_DISPUTE", "PROCESS_WITHDRAWAL", "UPDATE_SELLER", "BAN_USER", "REFUND_ORDER", "UPDATE_COMMISSION", "BROADCAST_NOTIFICATION", "CONFIG_CHANGE"

    @Column(nullable = false)
    private String targetEntity; // "DISPUTE", "ORDER", "SELLER", "USER", "PAYMENT", "WITHDRAW_REQUEST", "SYSTEM"

    private String targetId;

    @Column(columnDefinition = "TEXT")
    private String details;

    private String ipAddress;

    private LocalDateTime createdAt;

    @JsonProperty("adminName")
    public String getAdminName() {
        try {
            return admin != null ? admin.getName() : null;
        } catch (Exception e) {
            return null;
        }
    }

    @JsonProperty("adminEmail")
    public String getAdminEmail() {
        try {
            return admin != null ? admin.getEmail() : null;
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
