package com.sabyshop.dto;
import com.sabyshop.model.OrderStatus;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
@Data
public class OrderResponse {
    private Long id;
    private Double totalAmount;
    private Double originalSubtotal;
    private Double discountAmount;
    private String couponCode;
    private OrderStatus status;
    private String paymentId;
    private LocalDateTime createdAt;
    private List<OrderItemResponse> items;
    private String customerEmail;
    private String customerName;
    /** ID of the seller who owns the product. Null for admin products. */
    private Long sellerId;
    /** Store name of the seller who owns the product. Null for admin products. */
    private String sellerStoreName;
    /** Store logo / avatar URL of the seller who owns the product. */
    private String sellerStoreLogoUrl;
    /** Payment method label shown to the user e.g. "KHQR" */
    private String paymentMethod;
    /** Whether the customer has already submitted a review for this order */
    private Boolean hasReviewed;

    private String buyerInviteEmail;
    private String claimNote;
    private String manualAccountEmail;
    private String manualAccountPassword;
    private String sellerDeliveryNote;
    private LocalDateTime sellerDeliveredAt;
    private boolean sellerCredited;
}

