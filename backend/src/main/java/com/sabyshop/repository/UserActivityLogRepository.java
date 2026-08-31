package com.sabyshop.repository;

import com.sabyshop.model.UserActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserActivityLogRepository extends JpaRepository<UserActivityLog, Long> {
    List<UserActivityLog> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<UserActivityLog> findByActivityTypeOrderByCreatedAtDesc(String activityType);
}
