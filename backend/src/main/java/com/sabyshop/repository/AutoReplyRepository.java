package com.sabyshop.repository;

import com.sabyshop.model.AutoReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AutoReplyRepository extends JpaRepository<AutoReply, Long> {

    List<AutoReply> findByCategoryIgnoreCase(String category);

    Optional<AutoReply> findByKeywordIgnoreCase(String keyword);

    @Query("SELECT a FROM AutoReply a WHERE LOWER(:text) LIKE LOWER(CONCAT('%', a.keyword, '%'))")
    List<AutoReply> findMatchingReplies(@Param("text") String text);
}
