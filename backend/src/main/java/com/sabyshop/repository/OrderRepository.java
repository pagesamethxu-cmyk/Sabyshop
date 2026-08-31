package com.sabyshop.repository;

import com.sabyshop.model.Order;
import com.sabyshop.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserId(Long userId);
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT o.id FROM Order o WHERE LOWER(o.user.email) = LOWER(:email)")
    List<Long> findIdsByUserEmail(@Param("email") String email);

    /** Returns true if the buyer has at least one COMPLETED order containing that product */
    @Query("""
        SELECT COUNT(o) > 0 FROM Order o
        JOIN o.items i
        WHERE o.user.id = :buyerId
          AND i.product.id = :productId
          AND o.status = :status
        """)
    boolean existsByUserIdAndItemProductIdAndStatus(
            @Param("buyerId") Long buyerId,
            @Param("productId") Long productId,
            @Param("status") OrderStatus status);

    /** Check if buyer has a completed order containing any product from a given seller */
    @Query("""
        SELECT COUNT(o) > 0 FROM Order o
        JOIN o.items i
        WHERE o.user.id = :buyerId
          AND i.product.seller.id = :sellerId
          AND o.status = :status
        """)
    boolean existsByUserIdAndItemProductSellerIdAndStatus(
            @Param("buyerId") Long buyerId,
            @Param("sellerId") Long sellerId,
            @Param("status") OrderStatus status);

    /** All orders that contain at least one product from a given seller */
    @Query("""
        SELECT DISTINCT o FROM Order o
        JOIN o.items i
        WHERE i.product.seller.id = :sellerId
        ORDER BY o.createdAt DESC
        """)
    List<Order> findOrdersBySellerId(@Param("sellerId") Long sellerId);

    /** Count unique buyers for a seller since a given timestamp */
    @Query("""
        SELECT COUNT(DISTINCT o.user.id) FROM Order o
        JOIN o.items i
        WHERE i.product.seller.id = :sellerId
          AND o.createdAt >= :since
        """)
    Long countUniqueBuyersBySellerSince(@Param("sellerId") Long sellerId, @Param("since") java.time.LocalDateTime since);

    /** All orders containing products from a given seller created since a given timestamp */
    @Query("""
        SELECT DISTINCT o FROM Order o
        JOIN o.items i
        WHERE i.product.seller.id = :sellerId
          AND o.createdAt >= :since
        ORDER BY o.createdAt DESC
        """)
    List<Order> findOrdersBySellerIdSince(
            @Param("sellerId") Long sellerId,
            @Param("since") java.time.LocalDateTime since);

    /** Count total orders containing at least one product from a given seller */
    @Query("""
        SELECT COUNT(DISTINCT o.id) FROM Order o
        JOIN o.items i
        WHERE i.product.seller.id = :sellerId
        """)
    Long countTotalOrdersBySeller(@Param("sellerId") Long sellerId);

    /** Count completed orders containing at least one product from a given seller */
    @Query("""
        SELECT COUNT(DISTINCT o.id) FROM Order o
        JOIN o.items i
        WHERE i.product.seller.id = :sellerId
          AND o.status = com.sabyshop.model.OrderStatus.COMPLETED
        """)
    Long countCompletedOrdersBySeller(@Param("sellerId") Long sellerId);

    /** Fetch delivered orders eligible for automated 48-hour escrow payout */
    @Query("""
        SELECT o FROM Order o
        WHERE o.status = :status
          AND o.sellerDeliveredAt IS NOT NULL
          AND o.sellerDeliveredAt < :cutoff
          AND o.sellerCredited = false
        """)
    List<Order> findDeliveredOrdersForEscrowRelease(
            @Param("status") OrderStatus status,
            @Param("cutoff") java.time.LocalDateTime cutoff);
}
