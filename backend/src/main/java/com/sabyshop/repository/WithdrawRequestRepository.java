package com.sabyshop.repository;

import com.sabyshop.model.WithdrawRequest;
import com.sabyshop.model.WithdrawRequest.WithdrawStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface WithdrawRequestRepository extends JpaRepository<WithdrawRequest, Long> {

    @Query("SELECT w FROM WithdrawRequest w WHERE w.seller.id = :sellerId ORDER BY w.id DESC")
    List<WithdrawRequest> findBySellerIdOrderByRequestedAtDesc(@Param("sellerId") Long sellerId);

    @Query("SELECT w FROM WithdrawRequest w WHERE w.status = :status ORDER BY w.id DESC")
    List<WithdrawRequest> findByStatusOrderByRequestedAtDesc(@Param("status") WithdrawStatus status);

    @Query("SELECT w FROM WithdrawRequest w ORDER BY w.id DESC")
    List<WithdrawRequest> findAllByOrderByRequestedAtDesc();
}
