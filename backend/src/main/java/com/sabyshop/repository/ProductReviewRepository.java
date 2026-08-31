package com.sabyshop.repository;

import com.sabyshop.model.ProductReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {

    @Query("SELECT r FROM ProductReview r LEFT JOIN FETCH r.product LEFT JOIN FETCH r.buyer LEFT JOIN FETCH r.order WHERE r.product.id = :productId ORDER BY r.createdAt DESC")
    List<ProductReview> findByProductIdOrderByCreatedAtDesc(@Param("productId") Long productId);

    boolean existsByBuyerIdAndProductIdAndOrderId(Long buyerId, Long productId, Long orderId);

    @Query("SELECT r FROM ProductReview r LEFT JOIN FETCH r.product LEFT JOIN FETCH r.buyer LEFT JOIN FETCH r.order WHERE r.buyer.id = :buyerId AND r.product.id = :productId AND r.order.id = :orderId")
    Optional<ProductReview> findByBuyerIdAndProductIdAndOrderId(@Param("buyerId") Long buyerId, @Param("productId") Long productId, @Param("orderId") Long orderId);

    @Query("SELECT AVG(r.rating) FROM ProductReview r WHERE r.product.id = :productId")
    Double findAverageRatingByProductId(@Param("productId") Long productId);

    @Query("SELECT COUNT(r) FROM ProductReview r WHERE r.product.id = :productId")
    Long countByProductId(@Param("productId") Long productId);

    @Query("SELECT r FROM ProductReview r LEFT JOIN FETCH r.product LEFT JOIN FETCH r.buyer LEFT JOIN FETCH r.order WHERE r.product.seller.id = :sellerId ORDER BY r.createdAt DESC")
    List<ProductReview> findBySellerIdOrderByCreatedAtDesc(@Param("sellerId") Long sellerId);

    @Query("SELECT AVG(r.rating) FROM ProductReview r WHERE r.product.seller.id = :sellerId")
    Double findAverageRatingBySellerId(@Param("sellerId") Long sellerId);

    @Query("SELECT COUNT(r) FROM ProductReview r WHERE r.product.seller.id = :sellerId")
    Long countBySellerId(@Param("sellerId") Long sellerId);
}
