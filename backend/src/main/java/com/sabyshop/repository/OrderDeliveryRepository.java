package com.sabyshop.repository;

import com.sabyshop.model.OrderDelivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderDeliveryRepository extends JpaRepository<OrderDelivery, Long> {
    List<OrderDelivery> findByOrder_IdOrderByCreatedAtDesc(Long orderId);
    List<OrderDelivery> findByDeliveredBy_IdOrderByCreatedAtDesc(Long userId);
    List<OrderDelivery> findAllByOrderByCreatedAtDesc();
}
