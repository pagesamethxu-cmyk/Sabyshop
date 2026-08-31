package com.sabyshop.repository;

import com.sabyshop.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByConversationIdOrderByCreatedAtAsc(Long conversationId);

    List<ChatMessage> findByConversationIdOrderByCreatedAtDesc(Long conversationId);

    void deleteByConversationId(Long conversationId);

    List<ChatMessage> findByOrderIdOrderByCreatedAtAsc(Long orderId);

    List<ChatMessage> findBySenderEmailOrderByCreatedAtDesc(String senderEmail);

    List<ChatMessage> findByTargetEmailIgnoreCaseOrderByCreatedAtDesc(String targetEmail);

    @Query("""
        SELECT m FROM ChatMessage m
        WHERE (LOWER(m.senderEmail) = LOWER(:email) OR LOWER(m.targetEmail) = LOWER(:email))
        ORDER BY m.createdAt DESC
    """)
    List<ChatMessage> findUserDirectAndTargetMessages(@Param("email") String email);

    List<ChatMessage> findByOrderIdInOrderByCreatedAtDesc(List<Long> orderIds);

    List<ChatMessage> findAllByOrderByCreatedAtDesc();
}
