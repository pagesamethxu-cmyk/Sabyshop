package com.sabyshop.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ProductDiscountRequest {
    private Double discountPrice;
    private Integer discountPercent;
    private Integer durationDays; // e.g. 1 (24h/daily), 3, 7 days

    @JsonFormat(pattern = "[yyyy-MM-dd'T'HH:mm:ss][yyyy-MM-dd'T'HH:mm][yyyy-MM-dd]")
    private LocalDateTime startDate;

    @JsonFormat(pattern = "[yyyy-MM-dd'T'HH:mm:ss][yyyy-MM-dd'T'HH:mm][yyyy-MM-dd]")
    private LocalDateTime endDate;

    private Boolean active;
}
