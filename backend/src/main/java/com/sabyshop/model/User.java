package com.sabyshop.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name="users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    @JsonIgnore
    private String password;

    private String name;

    @Enumerated(EnumType.STRING)
    private Role role;

    private LocalDateTime createdAt;

    /** Used for seller accounts — accumulated balance from sales */
    @Builder.Default
    @Column(nullable = false)
    private Double sellerBalance = 0.0;

    /** Used for buyer accounts — store credit / refunds for repurchase */
    @Builder.Default
    @Column(nullable = false)
    private Double buyerBalance = 0.0;

    /** Track if this user has already used their 1-time 7-day free trial */
    @Builder.Default
    @Column(columnDefinition = "boolean default false")
    private Boolean hasUsedFreeTrial = false;

    /** Avatar / profile photo URL */
    private String avatarUrl;

    /** Telegram Chat ID linked for order/admin notifications */
    private String telegramChatId;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
