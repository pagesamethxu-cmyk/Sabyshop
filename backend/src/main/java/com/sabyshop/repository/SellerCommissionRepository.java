package com.sabyshop.repository;

import com.sabyshop.model.SellerCommission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SellerCommissionRepository extends JpaRepository<SellerCommission, Long> {
    @Query("SELECT c FROM SellerCommission c LEFT JOIN FETCH c.order LEFT JOIN FETCH c.seller WHERE c.seller.id = :sellerId ORDER BY c.createdAt DESC")
    List<SellerCommission> findBySeller_IdOrderByCreatedAtDesc(@org.springframework.data.repository.query.Param("sellerId") Long sellerId);

    @Query("SELECT c FROM SellerCommission c LEFT JOIN FETCH c.order LEFT JOIN FETCH c.seller WHERE c.order.id = :orderId ORDER BY c.createdAt DESC")
    List<SellerCommission> findByOrder_IdOrderByCreatedAtDesc(@org.springframework.data.repository.query.Param("orderId") Long orderId);

    @Query("SELECT c FROM SellerCommission c LEFT JOIN FETCH c.order LEFT JOIN FETCH c.seller ORDER BY c.createdAt DESC")
    List<SellerCommission> findAllByOrderByCreatedAtDesc();
}
