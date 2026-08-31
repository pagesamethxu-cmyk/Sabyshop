package com.sabyshop.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Tracks every sale made by a seller with exact timestamp and transaction metrics.
 */
@Entity
@Table(name = "seller_sale_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerSaleRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    private Integer quantity;

    private Double saleAmount;

    @Builder.Default
    private LocalDateTime soldAt = LocalDateTime.now();
}
