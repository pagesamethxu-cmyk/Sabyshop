package com.sabyshop.repository;

import com.sabyshop.model.ProductReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductReportRepository extends JpaRepository<ProductReport, Long> {
    List<ProductReport> findBySeller_IdOrderByCreatedAtDesc(Long sellerId);
    List<ProductReport> findByProduct_IdOrderByCreatedAtDesc(Long productId);
    long countBySeller_IdAndStatusNot(Long sellerId, ProductReport.ReportStatus status);
}
