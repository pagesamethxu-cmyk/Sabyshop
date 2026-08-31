package com.sabyshop.dto;
import lombok.Data;
import java.util.List;
@Data
public class OrderItemResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String productImageUrl;
    private Double price;
    private String productType;
    private String duration;
    private String buyerInviteEmail;
    private List<DeliveredAccount> deliveredAccounts;
}
