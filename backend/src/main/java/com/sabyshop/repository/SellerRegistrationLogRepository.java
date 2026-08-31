package com.sabyshop.repository;

import com.sabyshop.model.SellerRegistrationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SellerRegistrationLogRepository extends JpaRepository<SellerRegistrationLog, Long> {
    List<SellerRegistrationLog> findByUserIdOrderByRegisteredAtDesc(Long userId);
}
