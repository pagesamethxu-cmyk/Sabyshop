package com.sabyshop.repository;

import com.sabyshop.model.ProductStock;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ProductStockRepository extends JpaRepository<ProductStock, Long> {
    @Query("SELECT s FROM ProductStock s WHERE s.product.id = :productId AND s.sold = false")
    List<ProductStock> findByProductIdAndSoldFalse(@Param("productId") Long productId);

    /** Pessimistic-write locked version — prevents double-assignment of the same stock item under concurrent payment confirmations. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM ProductStock s WHERE s.product.id = :productId AND s.sold = false ORDER BY s.id ASC")
    List<ProductStock> findByProductIdAndSoldFalseWithLock(@Param("productId") Long productId);

    @Query("SELECT COUNT(s) FROM ProductStock s WHERE s.product.id = :productId AND s.sold = false")
    int countByProductIdAndSoldFalse(@Param("productId") Long productId);

    @Query("SELECT s FROM ProductStock s WHERE s.product.id = :productId")
    List<ProductStock> findByProductId(@Param("productId") Long productId);

    long countBySoldFalse();
    List<ProductStock> findByAccountEmailIgnoreCaseAndSoldTrue(String accountEmail);
    List<ProductStock> findByAccountEmailIgnoreCase(String accountEmail);
}
