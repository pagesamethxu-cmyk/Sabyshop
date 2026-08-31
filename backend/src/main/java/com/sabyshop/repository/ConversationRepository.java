package com.sabyshop.repository;

import com.sabyshop.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    Optional<Conversation> findByUserIdAndMode(Long userId, String mode);

    List<Conversation> findByUserId(Long userId);

    List<Conversation> findByModeOrderByLastMessageAtDesc(String mode);

    List<Conversation> findByModeOrderByCreatedAtDesc(String mode);

    @Query("SELECT c FROM Conversation c WHERE LOWER(c.mode) = LOWER(:mode) ORDER BY COALESCE(c.lastMessageAt, c.createdAt) DESC")
    List<Conversation> findByModeOrdered(@Param("mode") String mode);

    boolean existsByUserIdAndMode(Long userId, String mode);
}
