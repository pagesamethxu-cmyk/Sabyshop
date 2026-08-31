package com.sabyshop.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Audit log tracking seller store registration and onboarding history.
 */
@Entity
@Table(name = "seller_registration_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerRegistrationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String storeName;

    private String subscriptionPlan;

    private String paymentStatus;

    @Builder.Default
    private LocalDateTime registeredAt = LocalDateTime.now();

    private LocalDateTime approvedAt;
}
