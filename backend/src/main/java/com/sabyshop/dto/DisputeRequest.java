package com.sabyshop.dto;

import lombok.Data;
import java.util.List;

@Data
public class DisputeRequest {
    /**
     * ORDER_NOT_RECEIVED, WRONG_INCOMPLETE_PRODUCT, ACCOUNT_VOUCHER_PROBLEM, OTHER
     */
    private String issueType;

    /**
     * REPLACEMENT, REFUND
     */
    private String preferredSolution;

    private String description;

    /**
     * Evidence image URLs uploaded by the buyer
     */
    private List<String> evidenceImages;
}
