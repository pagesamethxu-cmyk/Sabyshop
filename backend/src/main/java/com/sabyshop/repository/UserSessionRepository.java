package com.sabyshop.repository;

import com.sabyshop.model.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, Long> {
    Optional<UserSession> findBySessionToken(String sessionToken);
    List<UserSession> findByUser_IdAndIsActiveTrueOrderByLastActiveAtDesc(Long userId);
    List<UserSession> findByUser_IdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT s FROM UserSession s LEFT JOIN FETCH s.user ORDER BY s.lastActiveAt DESC")
    List<UserSession> findAllByOrderByLastActiveAtDesc();
}
