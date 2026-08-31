package com.sabyshop.repository;

import com.sabyshop.model.WalletTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {
    List<WalletTransaction> findBySeller_IdOrderByCreatedAtDesc(Long sellerId);
    List<WalletTransaction> findByWallet_IdOrderByCreatedAtDesc(Long walletId);

    @Query("SELECT w FROM WalletTransaction w LEFT JOIN FETCH w.wallet LEFT JOIN FETCH w.seller ORDER BY w.createdAt DESC")
    List<WalletTransaction> findAllByOrderByCreatedAtDesc();
}
