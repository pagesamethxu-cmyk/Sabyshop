package com.sabyshop.service;

import com.sabyshop.dto.ReviewRequest;
import com.sabyshop.dto.ReviewResponse;
import com.sabyshop.exception.BadRequestException;
import com.sabyshop.exception.ResourceNotFoundException;
import com.sabyshop.model.*;
import com.sabyshop.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewService {

    private final ProductReviewRepository reviewRepository;
    private final ProductRepository       productRepository;
    private final OrderRepository         orderRepository;
    private final UserRepository          userRepository;

    @Transactional
    @CacheEvict(value = {"reviews", "products"}, allEntries = true)
    public ReviewResponse submitReview(Long buyerId, ReviewRequest request) {
        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw new BadRequestException("Rating must be between 1 and 5.");
        }

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        // Ensure the order belongs to this buyer
        if (!order.getUser().getId().equals(buyerId)) {
            throw new BadRequestException("Order does not belong to you.");
        }

        // Ensure seller cannot review their own product
        if (product.getSeller() != null && product.getSeller().getId().equals(buyerId)) {
            throw new BadRequestException("Sellers cannot review their own products.");
        }

        // Ensure order is COMPLETED
        if (order.getStatus() != OrderStatus.COMPLETED) {
            throw new BadRequestException("You can only review products from completed orders.");
        }

        // Ensure the product was actually in the order
        boolean productInOrder = order.getItems().stream()
                .anyMatch(item -> item.getProduct() != null
                        && item.getProduct().getId().equals(request.getProductId()));
        if (!productInOrder) {
            throw new BadRequestException("This product was not in the specified order.");
        }

        // Prevent duplicate reviews
        if (reviewRepository.existsByBuyerIdAndProductIdAndOrderId(buyerId, request.getProductId(), request.getOrderId())) {
            throw new BadRequestException("You have already reviewed this product for this order.");
        }

        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ProductReview review = ProductReview.builder()
                .product(product)
                .buyer(buyer)
                .order(order)
                .rating(request.getRating())
                .comment(request.getComment())
                .tags(request.getTags())
                .createdAt(LocalDateTime.now())
                .build();

        return mapToResponse(reviewRepository.save(review));
    }

    public List<ReviewResponse> getProductReviews(Long productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<ReviewResponse> getSellerReviews(Long sellerId) {
        return reviewRepository.findBySellerIdOrderByCreatedAtDesc(sellerId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public Double getAverageRating(Long productId) {
        return reviewRepository.findAverageRatingByProductId(productId);
    }

    /**
     * Check if buyer has already reviewed a specific product+order combo.
     * Used by frontend to show/hide review form.
     */
    public boolean hasReviewed(Long buyerId, Long productId, Long orderId) {
        return reviewRepository.existsByBuyerIdAndProductIdAndOrderId(buyerId, productId, orderId);
    }

    private ReviewResponse mapToResponse(ProductReview review) {
        ReviewResponse dto = new ReviewResponse();
        dto.setId(review.getId());
        try {
            if (review.getProduct() != null) {
                dto.setProductId(review.getProduct().getId());
                dto.setProductName(review.getProduct().getName());
            }
        } catch (Exception ignored) {}

        try {
            if (review.getOrder() != null) {
                dto.setOrderId(review.getOrder().getId());
            }
        } catch (Exception ignored) {}

        try {
            if (review.getBuyer() != null) {
                dto.setBuyerId(review.getBuyer().getId());
                String rawName = review.getBuyer().getName() != null ? review.getBuyer().getName() : "User";
                dto.setBuyerName(maskBuyerName(rawName));
            } else {
                dto.setBuyerName("U***r");
            }
        } catch (Exception ignored) {
            dto.setBuyerName("U***r");
        }

        dto.setRating(review.getRating());
        dto.setComment(review.getComment());
        dto.setTags(review.getTags());
        dto.setCreatedAt(review.getCreatedAt());
        return dto;
    }

    public static String maskBuyerName(String name) {
        if (name == null || name.trim().isEmpty() || "Anonymous".equalsIgnoreCase(name.trim())) {
            return "U***r";
        }
        String clean = name.trim();
        String[] parts = clean.split("\\s+");
        if (parts.length > 1) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < parts.length; i++) {
                if (i > 0) sb.append(" ");
                sb.append(maskSingleWord(parts[i]));
            }
            return sb.toString();
        }
        return maskSingleWord(clean);
    }

    private static String maskSingleWord(String word) {
        if (word.length() <= 1) return word + "***";
        if (word.length() == 2) return word.substring(0, 1) + "***";
        return word.substring(0, 1) + "***" + word.substring(word.length() - 1);
    }
}
