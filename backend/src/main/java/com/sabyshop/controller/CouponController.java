package com.sabyshop.controller;

import com.sabyshop.dto.ApiResponse;
import com.sabyshop.dto.CouponRequest;
import com.sabyshop.dto.CouponResponse;
import com.sabyshop.dto.CouponValidationResponse;
import com.sabyshop.model.User;
import com.sabyshop.repository.UserRepository;
import com.sabyshop.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;
    private final UserRepository userRepository;

    private Long getCurrentUserId(Authentication auth) {
        if (auth == null) return null;
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }

    /**
     * Seller creates a new store coupon
     * POST /api/seller/coupons
     */
    @PostMapping("/api/seller/coupons")
    public ResponseEntity<ApiResponse<CouponResponse>> createCoupon(
            @RequestBody CouponRequest request,
            Authentication auth) {
        CouponResponse response = couponService.createCoupon(getCurrentUserId(auth), request);
        return ResponseEntity.ok(new ApiResponse<>(true, "បានបង្កើតកូដបញ្ចុះតម្លៃជោគជ័យ (Coupon created)", response));
    }

    /**
     * Seller gets all their coupons
     * GET /api/seller/coupons
     */
    @GetMapping("/api/seller/coupons")
    public ResponseEntity<ApiResponse<List<CouponResponse>>> getSellerCoupons(Authentication auth) {
        List<CouponResponse> list = couponService.getSellerCoupons(getCurrentUserId(auth));
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", list));
    }

    /**
     * Seller updates an existing coupon
     * PUT /api/seller/coupons/{id}
     */
    @PutMapping("/api/seller/coupons/{id}")
    public ResponseEntity<ApiResponse<CouponResponse>> updateCoupon(
            @PathVariable Long id,
            @RequestBody CouponRequest request,
            Authentication auth) {
        CouponResponse response = couponService.updateCoupon(getCurrentUserId(auth), id, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "បានកែប្រែកូដបញ្ចុះតម្លៃជោគជ័យ (Coupon updated)", response));
    }

    /**
     * Seller deletes a coupon
     * DELETE /api/seller/coupons/{id}
     */
    @DeleteMapping("/api/seller/coupons/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCoupon(
            @PathVariable Long id,
            Authentication auth) {
        couponService.deleteCoupon(getCurrentUserId(auth), id);
        return ResponseEntity.ok(new ApiResponse<>(true, "បានលុបកូដបញ្ចុះតម្លៃជោគជ័យ (Coupon deleted)", null));
    }

    /**
     * Public/Customer gets active coupons for a store (returns empty list as coupons are private promo codes)
     * GET /api/coupons/store/{sellerId}
     */
    @GetMapping("/api/coupons/store/{sellerId}")
    public ResponseEntity<ApiResponse<List<CouponResponse>>> getPublicStoreCoupons(@PathVariable Long sellerId) {
        List<CouponResponse> list = couponService.getPublicStoreCoupons(sellerId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", list));
    }

    /**
     * Public check if store has active coupons without exposing codes
     * GET /api/coupons/store/{sellerId}/has-coupons?productId=123
     */
    @GetMapping("/api/coupons/store/{sellerId}/has-coupons")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkStoreHasCoupons(
            @PathVariable Long sellerId,
            @RequestParam(required = false) Long productId) {
        Map<String, Object> res = couponService.checkStoreHasActiveCoupons(sellerId, productId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", res));
    }

    /**
     * Public/Customer validates coupon code before checkout
     * POST /api/coupons/validate
     * Body: { "code": "SAVE10", "orderAmount": 15.00, "items": [...] }
     */
    @PostMapping("/api/coupons/validate")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<CouponValidationResponse>> validateCoupon(
            @RequestBody Map<String, Object> body) {
        String code = (String) body.get("code");
        Long sellerId = body.get("sellerId") != null ? Long.valueOf(body.get("sellerId").toString()) : null;
        Double orderAmount = body.get("orderAmount") != null ? Double.valueOf(body.get("orderAmount").toString()) : 0.0;
        Double sellerItemsAmount = body.get("sellerItemsAmount") != null ? Double.valueOf(body.get("sellerItemsAmount").toString()) : null;
        Long productId = body.get("productId") != null ? Long.valueOf(body.get("productId").toString()) : null;
        List<Map<String, Object>> items = (List<Map<String, Object>>) body.get("items");

        CouponValidationResponse val = couponService.validateCouponWithItems(code, items, sellerId, orderAmount, productId, sellerItemsAmount);
        return ResponseEntity.ok(new ApiResponse<>(val.isValid(), val.getMessage(), val));
    }
}
