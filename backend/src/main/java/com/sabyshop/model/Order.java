package com.sabyshop.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name="orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name="user_id")
    private User user;

    private Double totalAmount;
    private Double originalSubtotal;
    private Double discountAmount;
    private String couponCode;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    private String paymentId;
    private LocalDateTime createdAt;

    @Builder.Default
    private boolean sellerCredited = false;

    private String manualAccountEmail;
    private String manualAccountPassword;
    private String sellerDeliveryNote;
    private LocalDateTime sellerDeliveredAt;

    private String buyerInviteEmail;
    private String claimNote;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
