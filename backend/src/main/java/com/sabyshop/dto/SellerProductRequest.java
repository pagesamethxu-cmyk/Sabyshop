package com.sabyshop.dto;

import lombok.Data;

@Data
public class SellerProductRequest {
    private String name;
    private String description;
    /** Seller's base price — platform will add $0.20 on top for buyers */
    private Double basePrice;
    /** Original / regular price before discount */
    private Double originalPrice;
    private Integer discountPercent;
    private String imageUrl;
    private Long categoryId;
    private String productType;
    private String duration;
    private String productLabel;
}
