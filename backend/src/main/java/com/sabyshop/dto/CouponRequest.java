package com.sabyshop.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CouponRequest {
    private String code;
    private String discountType; // "PERCENTAGE" or "FIXED_AMOUNT"
    private Double discountValue; // e.g. 20 (for 20%) or 1.50 (for $1.50)
    private Double minSpend;
    private Double maxDiscount;
    private Integer usageLimit;

    @JsonFormat(pattern = "[yyyy-MM-dd'T'HH:mm:ss][yyyy-MM-dd'T'HH:mm][yyyy-MM-dd]")
    private LocalDateTime startDate;

    @JsonFormat(pattern = "[yyyy-MM-dd'T'HH:mm:ss][yyyy-MM-dd'T'HH:mm][yyyy-MM-dd]")
    private LocalDateTime endDate;

    private Long productId;
    private Boolean clearProductId;
    private Boolean active;
}
