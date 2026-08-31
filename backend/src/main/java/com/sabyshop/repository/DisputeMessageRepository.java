package com.sabyshop.repository;

import com.sabyshop.model.DisputeMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DisputeMessageRepository extends JpaRepository<DisputeMessage, Long> {
    List<DisputeMessage> findByDispute_IdOrderByCreatedAtAsc(Long disputeId);
}
