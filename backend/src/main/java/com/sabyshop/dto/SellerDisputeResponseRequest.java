package com.sabyshop.dto;

import lombok.Data;

@Data
public class SellerDisputeResponseRequest {
    /**
     * AGREE_REPLACEMENT, AGREE_REFUND, REJECT_ESCALATE
     */
    private String action;

    private String responseMessage;

    // In case action is AGREE_REPLACEMENT:
    private String replacementAccountEmail;
    private String replacementAccountPassword;
    private String replacementNote;
}
