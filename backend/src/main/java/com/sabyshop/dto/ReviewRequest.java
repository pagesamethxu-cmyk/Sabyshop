package com.sabyshop.dto;

import lombok.Data;

@Data
public class ReviewRequest {
    private Long productId;
    private Long orderId;
    /** Star rating: 1 (worst) to 5 (best) */
    private Integer rating;
    private String comment;
    private String tags;
}
