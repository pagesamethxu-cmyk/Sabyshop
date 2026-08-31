package com.sabyshop.repository;

import com.sabyshop.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByTokenAndIsUsedFalse(String token);
    Optional<PasswordResetToken> findTopByUserIdAndIsUsedFalseOrderByCreatedAtDesc(Long userId);
}
