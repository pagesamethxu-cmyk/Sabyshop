package com.sabyshop.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Represents a conversation thread between a seller and a customer (channel: USER_SELLER).
 * 
 * Chat Architecture Concept 3:
 * - Seller-Customer Chat (channel = 'USER_SELLER'): Seller <-> Buyer product & order discussion.
 * - Intentionally NOT part of the 'conversations' table — kept completely separate to prevent
 *   any risk of cross-linking with admin support threads (Buyer Support / Seller VIP Support).
 * - Scoped by (seller_id, customer_id).
 */
@Entity
@Table(name = "seller_chat_threads")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerChatThread {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @Column(columnDefinition = "TEXT")
    private String lastMessage;

    @Builder.Default
    private LocalDateTime lastMessageAt = LocalDateTime.now();

    @Builder.Default
    private Integer unreadCountSeller = 0;

    @Builder.Default
    private Integer unreadCountCustomer = 0;
}
