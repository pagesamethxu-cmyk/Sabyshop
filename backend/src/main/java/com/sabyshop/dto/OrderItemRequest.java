package com.sabyshop.dto;
import lombok.Data;
@Data
public class OrderItemRequest {
    private Long productId;
    private int quantity;
    private String buyerInviteEmail;
    private String claimNote;
}
