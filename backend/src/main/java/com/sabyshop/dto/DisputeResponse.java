package com.sabyshop.dto;

import com.sabyshop.model.Dispute.DisputeStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DisputeResponse {
    private Long id;
    private Long orderId;
    private Double orderAmount;
    private String orderStatus;
    private String productName;
    private String productImageUrl;

    private Long buyerId;
    private String buyerEmail;
    private String buyerName;

    private Long sellerId;
    private String sellerEmail;
    private String sellerStoreName;

    private String issueType;
    private String preferredSolution;
    private String description;
    private List<String> evidenceImages;

    private DisputeStatus status;

    private String sellerResponse;
    private String replacementAccountEmail;
    private String replacementAccountPassword;
    private String replacementNote;

    private String adminNotes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
}
