package com.sabyshop.repository;

import com.sabyshop.model.AdminAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminActionRepository extends JpaRepository<AdminAction, Long> {
    @Query("SELECT a FROM AdminAction a LEFT JOIN FETCH a.admin ORDER BY a.createdAt DESC")
    List<AdminAction> findAllByOrderByCreatedAtDesc();

    List<AdminAction> findByTargetEntityOrderByCreatedAtDesc(String targetEntity);
    List<AdminAction> findByAdmin_IdOrderByCreatedAtDesc(Long adminId);
}
