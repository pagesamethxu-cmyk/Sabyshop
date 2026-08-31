package com.sabyshop.repository;

import com.sabyshop.model.SupportThread;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupportThreadRepository extends JpaRepository<SupportThread, Long> {
    Optional<SupportThread> findByTicketNumber(String ticketNumber);
    List<SupportThread> findByUser_IdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT t FROM SupportThread t LEFT JOIN FETCH t.user LEFT JOIN FETCH t.assignedAdmin ORDER BY t.createdAt DESC")
    List<SupportThread> findAllByOrderByCreatedAtDesc();

    List<SupportThread> findByStatusOrderByCreatedAtDesc(SupportThread.TicketStatus status);
}
