package com.sabyshop.controller;

import com.sabyshop.dto.ApiResponse;
import com.sabyshop.dto.OrderRequest;
import com.sabyshop.dto.OrderResponse;
import com.sabyshop.model.User;
import com.sabyshop.repository.UserRepository;
import com.sabyshop.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    private Long getCurrentUserId(Authentication auth) {
        if (auth == null || auth.getName() == null || "anonymousUser".equalsIgnoreCase(auth.getName())) {
            throw new com.sabyshop.exception.BadRequestException("Authentication required. Please login.");
        }
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new com.sabyshop.exception.ResourceNotFoundException("User not found: " + auth.getName()));
        return user.getId();
    }

    @PostMapping({"", "/"})
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(@RequestBody OrderRequest request, Authentication auth) {
        OrderResponse order = orderService.createOrder(getCurrentUserId(auth), request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Order created successfully", order));
    }

    @GetMapping({"", "/"})
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getUserOrders(Authentication auth) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", orderService.getUserOrders(getCurrentUserId(auth))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", orderService.getOrderById(getCurrentUserId(auth), id)));
    }

    @PostMapping("/{id}/verify")
    public ResponseEntity<ApiResponse<OrderResponse>> verifyOrder(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Verification processed", orderService.verifyPayment(getCurrentUserId(auth), id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> cancelOrder(@PathVariable Long id, Authentication auth) {
        orderService.cancelOrder(getCurrentUserId(auth), id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Order cancelled successfully", null));
    }

    /**
     * Seller marks order as DELIVERED after completing buyer's invitation or manual delivery.
     * POST /api/orders/{id}/deliver
     */
    @PostMapping("/{id}/deliver")
    public ResponseEntity<ApiResponse<OrderResponse>> deliverOrder(
            @PathVariable Long id,
            @RequestBody(required = false) com.sabyshop.dto.OrderDeliveryRequest request,
            Authentication auth) {
        OrderResponse order = orderService.deliverOrder(getCurrentUserId(auth), id, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Order marked as delivered successfully", order));
    }

    /**
     * Buyer (or Admin) confirms order delivery receipt and releases funds to seller.
     * POST /api/orders/{id}/confirm
     * POST /api/orders/{id}/confirm-delivery
     */
    @PostMapping({"/{id}/confirm", "/{id}/confirm-delivery"})
    public ResponseEntity<ApiResponse<OrderResponse>> confirmOrderDelivery(
            @PathVariable Long id,
            Authentication auth) {
        OrderResponse order = orderService.confirmOrderDelivery(getCurrentUserId(auth), id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Order confirmed successfully", order));
    }

    /**
     * Updates the paymentId (Bakong MD5 hash) on a PENDING order.
     * Called when the original KHQR expired and the user generates a new QR.
     *
     * PATCH /api/orders/{id}/payment-id
     * Body: { "paymentId": "<new_md5>" }
     */
    @PatchMapping("/{id}/payment-id")
    public ResponseEntity<ApiResponse<OrderResponse>> updatePaymentId(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        String newMd5 = body.get("paymentId");
        OrderResponse order = orderService.updatePaymentId(getCurrentUserId(auth), id, newMd5);
        return ResponseEntity.ok(new ApiResponse<>(true, "Payment ID updated", order));
    }
}
