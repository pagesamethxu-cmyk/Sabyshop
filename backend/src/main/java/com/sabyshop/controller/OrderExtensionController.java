package com.sabyshop.controller;

import com.sabyshop.dto.ApiResponse;
import com.sabyshop.model.*;
import com.sabyshop.repository.UserRepository;
import com.sabyshop.service.ExtendedFeaturesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderExtensionController {

    private final ExtendedFeaturesService extendedFeaturesService;
    private final UserRepository userRepository;

    private User getCurrentUser(Authentication auth) {
        if (auth == null || auth.getName() == null) return null;
        return userRepository.findByEmail(auth.getName()).orElse(null);
    }

    @GetMapping("/{orderId}/history")
    public ResponseEntity<ApiResponse<List<OrderStatusHistory>>> getOrderStatusHistory(@PathVariable Long orderId, Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null) return ResponseEntity.status(401).body(new ApiResponse<>(false, "Unauthorized", null));
        return ResponseEntity.ok(new ApiResponse<>(true, "Order history fetched", extendedFeaturesService.getOrderHistory(orderId)));
    }

    @GetMapping("/{orderId}/deliveries")
    public ResponseEntity<ApiResponse<List<OrderDelivery>>> getOrderDeliveries(@PathVariable Long orderId, Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null) return ResponseEntity.status(401).body(new ApiResponse<>(false, "Unauthorized", null));
        return ResponseEntity.ok(new ApiResponse<>(true, "Deliveries fetched", extendedFeaturesService.getOrderDeliveries(orderId)));
    }

    @GetMapping("/{orderId}/refunds")
    public ResponseEntity<ApiResponse<List<OrderRefund>>> getOrderRefunds(@PathVariable Long orderId, Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null) return ResponseEntity.status(401).body(new ApiResponse<>(false, "Unauthorized", null));
        return ResponseEntity.ok(new ApiResponse<>(true, "Refunds fetched", extendedFeaturesService.getOrderRefunds(orderId)));
    }
}
