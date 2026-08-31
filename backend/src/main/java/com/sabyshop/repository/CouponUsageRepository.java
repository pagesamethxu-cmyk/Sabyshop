package com.sabyshop.repository;

import com.sabyshop.model.CouponUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CouponUsageRepository extends JpaRepository<CouponUsage, Long> {
    List<CouponUsage> findByCoupon_IdOrderByUsedAtDesc(Long couponId);
    List<CouponUsage> findByUser_IdOrderByUsedAtDesc(Long userId);
    List<CouponUsage> findByOrder_Id(Long orderId);
    long countByCoupon_IdAndUser_Id(Long couponId, Long userId);
}
