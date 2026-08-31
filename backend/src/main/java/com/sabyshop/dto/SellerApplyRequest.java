package com.sabyshop.dto;

import lombok.Data;

@Data
public class SellerApplyRequest {
    private String storeName;
    private String storeDescription;
    /** Bakong KHQR MD5 hash from the $2.50 subscription payment */
    private String paymentId;
    /** Subscription plan identifier: PLAN_1 ($0.00), PLAN_2 ($4.50), PLAN_3 ($6.00) */
    private String subscriptionPlan;
    private String telegramUsername;
    private String telegramChannel;
    private String preferredContactMethod;
}
