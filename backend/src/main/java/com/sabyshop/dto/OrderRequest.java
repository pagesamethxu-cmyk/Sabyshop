package com.sabyshop.dto;
import lombok.Data;
import java.util.List;
@Data
public class OrderRequest {
    private List<OrderItemRequest> items;
    private String paymentId;
    private String couponCode;
    private Double discountAmount;
    private String buyerInviteEmail;
    private String claimNote;
}
