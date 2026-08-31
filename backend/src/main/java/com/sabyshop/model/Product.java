package com.sabyshop.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name="products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Double price;

    /** Seller's base price before the $0.20 platform fee. Null for admin products. */
    private Double basePrice;

    /** Original / regular price before discount (for strikethrough display like $10.00 -> $7.00) */
    private Double originalPrice;

    /** Explicit discount percentage e.g. 20 (for 20% OFF) */
    private Integer discountPercent;

    private String imageUrl;

    /** Type of digital product: SHARING, KEY, INVITE_LINK, ACCOUNT, KEY_ACTIVATION, KEY_SERVER, JOIN_MINECRAFT_PASSWORD, ACCOUNT_GAME */
    private String productType;

    /** Duration variant e.g. 1 Month, 3 Months, 6 Months, 1 Year, Lifetime */
    private String duration;

    /** Product label / badge e.g. HOT, BEST_SELLER, PROMO, FLASH_SALE, NEW, NONE */
    private String productLabel;

    @ManyToOne
    @JoinColumn(name="category_id")
    private Category category;

    /** Null = admin-managed product. Non-null = seller-owned product. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User seller;

    @Builder.Default
    private boolean active = true;

    /**
     * Cached count of unsold stock items for this product.
     * Updated atomically whenever stock is added or sold.
     * Use this for fast listing queries instead of COUNT(*) on product_stock.
     */
    @Builder.Default
    private Integer stockCount = 0;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
