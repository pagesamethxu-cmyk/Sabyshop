package com.sabyshop.repository;

import com.sabyshop.model.SellerPayoutMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SellerPayoutMethodRepository extends JpaRepository<SellerPayoutMethod, Long> {
    List<SellerPayoutMethod> findBySeller_IdAndIsActiveTrueOrderByCreatedAtDesc(Long sellerId);
    Optional<SellerPayoutMethod> findBySeller_IdAndIsDefaultTrue(Long sellerId);
}
