package com.sabyshop.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Represents a platform support conversation thread between a user and Admin.
 * 
 * Chat Architecture Concept 1 & 2:
 * - Buyer Support (mode = 'buyer'): Buyer <-> Admin helpdesk chat (channel: USER_ADMIN)
 * - Seller VIP Support (mode = 'seller'): Seller <-> Admin VIP support chat (channel: SELLER_ADMIN)
 * 
 * Scoped strictly by (user_id, mode) via table-level unique constraint.
 * NOTE: Does NOT store seller-to-customer chats (which use SellerChatThread).
 */
@Entity
@Table(
    name = "conversations",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "mode"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Mode of conversation: 'buyer' or 'seller' */
    @Column(nullable = false, length = 32)
    private String mode;

    /** Status: OPEN, RESOLVED, CLOSED */
    @Builder.Default
    @Column(nullable = false, length = 32)
    private String status = "OPEN";

    @Column(columnDefinition = "TEXT")
    private String lastMessage;

    private LocalDateTime lastMessageAt;

    @Builder.Default
    private Integer unreadCountAdmin = 0;

    @Builder.Default
    private Integer unreadCountUser = 0;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.updatedAt == null) {
            this.updatedAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = "OPEN";
        }
        if (this.unreadCountAdmin == null) {
            this.unreadCountAdmin = 0;
        }
        if (this.unreadCountUser == null) {
            this.unreadCountUser = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
