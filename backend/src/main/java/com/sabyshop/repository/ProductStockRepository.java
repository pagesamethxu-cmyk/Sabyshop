package com.sabyshop.repository;

import com.sabyshop.model.ProductStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ProductStockRepository extends JpaRepository<ProductStock, Long> {
    @Query("SELECT s FROM ProductStock s WHERE s.product.id = :productId AND s.sold = false")
    List<ProductStock> findByProductIdAndSoldFalse(@Param("productId") Long productId);

    @Query("SELECT COUNT(s) FROM ProductStock s WHERE s.product.id = :productId AND s.sold = false")
    int countByProductIdAndSoldFalse(@Param("productId") Long productId);

    @Query("SELECT s FROM ProductStock s WHERE s.product.id = :productId")
    List<ProductStock> findByProductId(@Param("productId") Long productId);

    long countBySoldFalse();
    List<ProductStock> findByAccountEmailIgnoreCaseAndSoldTrue(String accountEmail);
    List<ProductStock> findByAccountEmailIgnoreCase(String accountEmail);
}
