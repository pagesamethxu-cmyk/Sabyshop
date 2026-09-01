package com.sabyshop.repository;

import com.sabyshop.model.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {

    Optional<Coupon> findByCodeIgnoreCase(String code);

    Optional<Coupon> findByCodeIgnoreCaseAndActiveTrue(String code);

    List<Coupon> findBySellerIdOrderByCreatedAtDesc(Long sellerId);

    List<Coupon> findBySellerIdAndActiveTrue(Long sellerId);

    List<Coupon> findBySellerIdAndActiveTrueOrderByCreatedAtDesc(Long sellerId);

    List<Coupon> findBySellerIsNullOrderByCreatedAtDesc();

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);

    /** Atomically increments usedCount by 1 only if within usageLimit.
     * Returns 1 if succeeded, 0 if coupon is exhausted or not found. */
    @Modifying
    @Query("UPDATE Coupon c SET c.usedCount = c.usedCount + 1 " +
           "WHERE c.id = :id AND (c.usageLimit IS NULL OR c.usedCount < c.usageLimit)")
    int atomicIncrementUsage(@Param("id") Long id);
}
