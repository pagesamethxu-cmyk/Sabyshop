package com.sabyshop.dto;

import com.sabyshop.model.WithdrawRequest.WithdrawStatus;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class WithdrawResponseDto {
    private Long id;
    private Double amount;
    private String khqrString;
    private String khqrImageUrl;
    private WithdrawStatus status;
    private LocalDateTime requestedAt;
    private LocalDateTime processedAt;
    private String adminNote;
    private Long sellerId;
    private String sellerName;
    private String sellerEmail;
}
