package com.sabyshop.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponValidationResponse {
    private boolean valid;
    private String message;
    private String code;
    private String discountType;
    private Double discountValue;
    private Double originalAmount;
    private Double discountAmount;
    private Double finalAmount;
    private Long sellerId;
    private String sellerStoreName;
    private Long productId;
    private String productName;
}
