package com.sabyshop.controller;

import com.sabyshop.dto.*;
import com.sabyshop.model.User;
import com.sabyshop.repository.UserRepository;
import com.sabyshop.service.DisputeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/disputes")
@RequiredArgsConstructor
public class DisputeController {

    private final DisputeService disputeService;
    private final UserRepository userRepository;

    private Long getCurrentUserId(Authentication auth) {
        if (auth == null || auth.getName() == null || "anonymousUser".equalsIgnoreCase(auth.getName())) {
            throw new com.sabyshop.exception.BadRequestException("Authentication required. Please login.");
        }
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new com.sabyshop.exception.ResourceNotFoundException("User not found: " + auth.getName()));
        return user.getId();
    }

    /**
     * Buyer creates a dispute on an order.
     */
    @PostMapping("/orders/{orderId}")
    public ResponseEntity<ApiResponse<DisputeResponse>> createDispute(
            @PathVariable Long orderId,
            @RequestBody DisputeRequest request,
            Authentication auth) {
        DisputeResponse dispute = disputeService.createDispute(getCurrentUserId(auth), orderId, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Dispute submitted successfully", dispute));
    }

    /**
     * Get dispute details for a specific order.
     */
    @GetMapping("/orders/{orderId}")
    public ResponseEntity<ApiResponse<DisputeResponse>> getDisputeByOrderId(
            @PathVariable Long orderId,
            Authentication auth) {
        DisputeResponse dispute = disputeService.getDisputeByOrderId(getCurrentUserId(auth), orderId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", dispute));
    }

    /**
     * Buyer views their reported disputes.
     */
    @GetMapping("/my-disputes")
    public ResponseEntity<ApiResponse<List<DisputeResponse>>> getBuyerDisputes(Authentication auth) {
        List<DisputeResponse> list = disputeService.getBuyerDisputes(getCurrentUserId(auth));
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", list));
    }

    /**
     * Seller views disputes for their products.
     */
    @GetMapping("/seller")
    public ResponseEntity<ApiResponse<List<DisputeResponse>>> getSellerDisputes(Authentication auth) {
        List<DisputeResponse> list = disputeService.getSellerDisputes(getCurrentUserId(auth));
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", list));
    }

    /**
     * Seller responds to a dispute (Agree to Replacement, Agree to Refund, or Escalate to Admin).
     */
    @PostMapping("/{id}/seller-respond")
    public ResponseEntity<ApiResponse<DisputeResponse>> sellerRespond(
            @PathVariable Long id,
            @RequestBody SellerDisputeResponseRequest request,
            Authentication auth) {
        DisputeResponse dispute = disputeService.sellerRespond(getCurrentUserId(auth), id, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Response recorded successfully", dispute));
    }

    /**
     * Admin views all disputes.
     */
    @GetMapping("/admin/all")
    public ResponseEntity<ApiResponse<List<DisputeResponse>>> getAllDisputesForAdmin(Authentication auth) {
        List<DisputeResponse> list = disputeService.getAllDisputesForAdmin();
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", list));
    }

    /**
     * Admin resolves a dispute (Refund Buyer, Complete to Seller, etc.).
     */
    @PostMapping("/{id}/admin-resolve")
    public ResponseEntity<ApiResponse<DisputeResponse>> adminResolve(
            @PathVariable Long id,
            @RequestBody AdminDisputeResolveRequest request,
            Authentication auth) {
        DisputeResponse dispute = disputeService.adminResolve(getCurrentUserId(auth), id, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Dispute mediation completed", dispute));
    }
}
