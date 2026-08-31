package com.sabyshop.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Table 26: support_threads
 * Stores customer & seller support tickets, categories, priority levels, and resolution status.
 */
@Entity
@Table(name = "support_threads")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class SupportThread {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String ticketNumber; // e.g. "TICK-2026-1001"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_admin_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User assignedAdmin;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false)
    private String category; // "PAYMENT_ISSUE", "DELIVERY_PROBLEM", "ACCOUNT_SECURITY", "SELLER_INQUIRY", "TECHNICAL_BUG", "GENERAL"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Priority priority = Priority.NORMAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TicketStatus status = TicketStatus.OPEN;

    @Column(columnDefinition = "TEXT")
    private String initialMessage;

    @Column(columnDefinition = "TEXT")
    private String lastReply;

    private LocalDateTime lastRepliedAt;

    private LocalDateTime resolvedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public enum Priority {
        LOW,
        NORMAL,
        HIGH,
        URGENT
    }

    public enum TicketStatus {
        OPEN,
        IN_PROGRESS,
        WAITING_USER,
        RESOLVED,
        CLOSED
    }

    @JsonProperty("userName")
    public String getUserName() {
        try {
            return user != null ? user.getName() : null;
        } catch (Exception e) {
            return null;
        }
    }

    @JsonProperty("userEmail")
    public String getUserEmail() {
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
        if (this.updatedAt == null) {
            this.updatedAt = LocalDateTime.now();
        }
        if (this.lastRepliedAt == null) {
            this.lastRepliedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
