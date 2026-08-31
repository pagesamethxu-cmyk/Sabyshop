package com.sabyshop.dto;

import lombok.Data;

@Data
public class WithdrawRequestDto {
    /** Amount the seller wants to withdraw (must not exceed balance) */
    private Double amount;
    /** KHQR string (from seller's banking app) that admin will scan to send payment */
    private String khqrString;
    /** Image URL of uploaded KHQR code picture */
    private String khqrImageUrl;
}
