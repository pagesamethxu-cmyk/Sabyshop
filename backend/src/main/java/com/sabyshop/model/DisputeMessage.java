package com.sabyshop.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Table 38: dispute_messages
 * Threaded conversation messages within a dispute claim between buyer, seller, and mediating admin.
 */
@Entity
@Table(name = "dispute_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class DisputeMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispute_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "order", "buyer", "seller"})
    private Dispute dispute;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "roles"})
    private User sender;

    @Column(nullable = false)
    private String senderRole; // "BUYER", "SELLER", "ADMIN"

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    private String attachmentUrl;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isStaffInternal = false;

    private LocalDateTime createdAt;

    @JsonProperty("senderName")
    public String getSenderName() {
        try {
            return sender != null ? sender.getName() : null;
        } catch (Exception e) {
            return null;
        }
    }

    @JsonProperty("senderAvatarUrl")
    public String getSenderAvatarUrl() {
        try {
            return sender != null ? sender.getAvatarUrl() : null;
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
