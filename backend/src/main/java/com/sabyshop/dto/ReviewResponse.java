package com.sabyshop.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ReviewResponse {
    private Long id;
    private Long productId;
    private String productName;
    private Long orderId;
    private Long buyerId;
    private String buyerName;
    private Integer rating;
    private String comment;
    private String tags;
    private LocalDateTime createdAt;
}
