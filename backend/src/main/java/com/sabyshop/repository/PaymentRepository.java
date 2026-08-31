package com.sabyshop.repository;

import com.sabyshop.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByTransactionId(String transactionId);
    List<Payment> findByUser_IdOrderByCreatedAtDesc(Long userId);
    List<Payment> findByOrder_IdOrderByCreatedAtDesc(Long orderId);

    @Query("SELECT p FROM Payment p LEFT JOIN FETCH p.order LEFT JOIN FETCH p.user ORDER BY p.createdAt DESC")
    List<Payment> findAllByOrderByCreatedAtDesc();

    List<Payment> findByStatusOrderByCreatedAtDesc(Payment.PaymentStatus status);
}
