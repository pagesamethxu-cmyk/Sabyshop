package com.sabyshop.repository;

import com.sabyshop.model.Dispute;
import com.sabyshop.model.Dispute.DisputeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, Long> {
    Optional<Dispute> findByOrderId(Long orderId);
    List<Dispute> findByBuyerIdOrderByCreatedAtDesc(Long buyerId);
    List<Dispute> findBySellerIdOrderByCreatedAtDesc(Long sellerId);
    List<Dispute> findByStatusOrderByCreatedAtDesc(DisputeStatus status);
    List<Dispute> findAllByOrderByCreatedAtDesc();
    long countByStatus(DisputeStatus status);
    long countBySellerIdAndStatus(Long sellerId, DisputeStatus status);
    long countBySellerIdAndStatusNot(Long sellerId, DisputeStatus status);
}
