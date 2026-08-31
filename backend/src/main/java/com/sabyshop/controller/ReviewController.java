package com.sabyshop.controller;

import com.sabyshop.dto.ApiResponse;
import com.sabyshop.dto.ReviewRequest;
import com.sabyshop.dto.ReviewResponse;
import com.sabyshop.model.User;
import com.sabyshop.repository.UserRepository;
import com.sabyshop.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final UserRepository userRepository;

    private Long getCurrentUserId(Authentication auth) {
        if (auth == null || auth.getName() == null || "anonymousUser".equalsIgnoreCase(auth.getName())) {
            throw new com.sabyshop.exception.BadRequestException("Authentication required. Please login.");
        }
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new com.sabyshop.exception.ResourceNotFoundException("User not found: " + auth.getName()));
        return user.getId();
    }

    /** Submit a review for a product in a completed order */
    @PostMapping
    public ResponseEntity<ApiResponse<ReviewResponse>> submitReview(
            @RequestBody ReviewRequest request, Authentication auth) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Review submitted",
                reviewService.submitReview(getCurrentUserId(auth), request)));
    }

    /** Get all reviews for a product (public) */
    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getProductReviews(
            @PathVariable Long productId) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success",
                reviewService.getProductReviews(productId)));
    }

    /** Check if current user has already reviewed this product for a given order */
    @GetMapping("/check")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkReviewed(
            @RequestParam Long productId,
            @RequestParam Long orderId,
            Authentication auth) {
        if (auth == null || auth.getName() == null || "anonymousUser".equalsIgnoreCase(auth.getName())) {
            return ResponseEntity.ok(new ApiResponse<>(true, "Success", Map.of("reviewed", false)));
        }
        Long userId = userRepository.findByEmail(auth.getName()).map(User::getId).orElse(null);
        if (userId == null) {
            return ResponseEntity.ok(new ApiResponse<>(true, "Success", Map.of("reviewed", false)));
        }
        boolean reviewed = reviewService.hasReviewed(userId, productId, orderId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Success",
                Map.of("reviewed", reviewed)));
    }

    /** Get all reviews for current seller's products */
    @GetMapping("/seller")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getSellerReviews(Authentication auth) {
        if (auth == null || auth.getName() == null || "anonymousUser".equalsIgnoreCase(auth.getName())) {
            return ResponseEntity.ok(new ApiResponse<>(true, "Success", List.of()));
        }
        Long userId = userRepository.findByEmail(auth.getName()).map(User::getId).orElse(null);
        if (userId == null) {
            return ResponseEntity.ok(new ApiResponse<>(true, "Success", List.of()));
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Success",
                reviewService.getSellerReviews(userId)));
    }

    /** Get all reviews for a specific seller's products (public) */
    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getSellerReviewsBySellerId(@PathVariable Long sellerId) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success",
                reviewService.getSellerReviews(sellerId)));
    }

    /** Average rating for a product (public) */
    @GetMapping("/product/{productId}/rating")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAverageRating(
            @PathVariable Long productId) {
        Double avg = reviewService.getAverageRating(productId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Success",
                Map.of("averageRating", avg != null ? avg : 0.0)));
    }
}
