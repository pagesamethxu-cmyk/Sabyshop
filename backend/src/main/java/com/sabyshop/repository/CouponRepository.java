package com.sabyshop.repository;

import com.sabyshop.model.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
