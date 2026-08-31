package com.sabyshop.dto;

import lombok.Data;

@Data
public class AdminDisputeResolveRequest {
    /**
     * REFUND_BUYER, COMPLETE_SELLER, REJECT_DISPUTE
     */
    private String decision;

    private String adminNotes;
}
