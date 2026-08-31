package com.sabyshop.dto;
import lombok.Data;
import java.time.LocalDateTime;
@Data
public class ProductResponse {
    private Long id;
    private String name;
    private String description;
    private Double price;
    /** Seller's base price before platform fee. Null for admin products. */
    private Double basePrice;
    private Double originalPrice;
    private Integer discountPercent;
    private String imageUrl;
    private String productType;
    private String duration;
    private String productLabel;
    private Long categoryId;
    private String categoryName;
    private boolean active;
    private LocalDateTime createdAt;
    private int stockCount;
    private String categoryEmoji;
    // Seller info (null for admin-managed products)
    private Long sellerId;
    private String sellerName;
    private String sellerStoreName;
    private String sellerStoreLogoUrl;
    private String sellerStoreDescription;
    private String sellerTelegramUsername;
    private String sellerTelegramChannel;
    private String sellerPreferredContactMethod;
    // Review aggregates
    private Double averageRating;
    private Long reviewCount;
}
