package com.sabyshop.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class CouponResponse {
    private Long id;
    private String code;
    private Long sellerId;
    private String sellerStoreName;
    private String discountType;
    private Double discountValue;
    private Double minSpend;
    private Double maxDiscount;
    private Integer usageLimit;
    private Integer usedCount;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Long productId;
    private String productName;
    private boolean active;
    private boolean valid;
    private LocalDateTime createdAt;
}
