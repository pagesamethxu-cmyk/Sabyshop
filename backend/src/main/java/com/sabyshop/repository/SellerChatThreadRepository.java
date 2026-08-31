package com.sabyshop.repository;

import com.sabyshop.model.SellerChatThread;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SellerChatThreadRepository extends JpaRepository<SellerChatThread, Long> {
    List<SellerChatThread> findBySellerIdOrderByLastMessageAtDesc(Long sellerId);
    List<SellerChatThread> findByCustomerIdOrderByLastMessageAtDesc(Long customerId);
    Optional<SellerChatThread> findBySellerIdAndCustomerId(Long sellerId, Long customerId);
}
