package com.sabyshop.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Stores buyer reviews for purchased products.
 * A buyer may only review a product once per completed order.
 */
@Entity
@Table(
    name = "product_reviews",
    uniqueConstraints = @UniqueConstraint(columnNames = {"buyer_id", "product_id", "order_id"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    /** Star rating: 1 (worst) to 5 (best) */
    @Column(nullable = false)
    private Integer rating;

    /** Optional text comment */
    @Column(columnDefinition = "TEXT")
    private String comment;

    /** Optional feedback tags e.g. "Swift delivery,Perfect product" */
    @Column(columnDefinition = "TEXT")
    private String tags;

    private LocalDateTime createdAt;
}
