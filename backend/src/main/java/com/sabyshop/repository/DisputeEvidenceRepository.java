package com.sabyshop.repository;

import com.sabyshop.model.DisputeEvidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DisputeEvidenceRepository extends JpaRepository<DisputeEvidence, Long> {
    List<DisputeEvidence> findByDispute_IdOrderByCreatedAtAsc(Long disputeId);
}
