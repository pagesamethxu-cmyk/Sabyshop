package com.sabyshop.repository;

import com.sabyshop.model.SellerSaleRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SellerSaleRecordRepository extends JpaRepository<SellerSaleRecord, Long> {
    List<SellerSaleRecord> findBySeller_IdOrderBySoldAtDesc(Long sellerId);
    List<SellerSaleRecord> findBySeller_IdAndSoldAtAfterOrderBySoldAtDesc(Long sellerId, LocalDateTime since);
}
