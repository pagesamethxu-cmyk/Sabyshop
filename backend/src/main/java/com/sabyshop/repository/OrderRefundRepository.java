package com.sabyshop.repository;

import com.sabyshop.model.OrderRefund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRefundRepository extends JpaRepository<OrderRefund, Long> {
    List<OrderRefund> findByOrder_IdOrderByCreatedAtDesc(Long orderId);
    List<OrderRefund> findByUser_IdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT r FROM OrderRefund r LEFT JOIN FETCH r.order LEFT JOIN FETCH r.user LEFT JOIN FETCH r.processedBy ORDER BY r.createdAt DESC")
    List<OrderRefund> findAllByOrderByCreatedAtDesc();
}
