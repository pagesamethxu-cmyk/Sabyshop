package com.sabyshop.repository;

import com.sabyshop.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCategoryIdAndActiveTrue(Long categoryId);
    List<Product> findByNameContainingIgnoreCaseAndActiveTrue(String name);
    List<Product> findByActiveTrue();
    List<Product> findBySellerIdAndActiveTrue(Long sellerId);
    List<Product> findBySellerId(Long sellerId);

    @Query("SELECT p FROM Product p LEFT JOIN p.category c LEFT JOIN p.seller s WHERE p.active = true AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.productType) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Product> findBySearchTerm(@Param("search") String search);

    @Query("SELECT p FROM Product p LEFT JOIN p.category c LEFT JOIN p.seller s WHERE p.active = true AND " +
           "c.id = :categoryId AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.productType) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Product> findByCategoryIdAndSearchTerm(@Param("categoryId") Long categoryId, @Param("search") String search);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.seller.id = :sellerId AND p.active = true")
    Long countActiveProductsBySeller(@Param("sellerId") Long sellerId);
}
