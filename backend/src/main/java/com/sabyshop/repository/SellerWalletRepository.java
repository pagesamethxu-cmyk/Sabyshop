package com.sabyshop.repository;

import com.sabyshop.model.SellerWallet;
import com.sabyshop.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SellerWalletRepository extends JpaRepository<SellerWallet, Long> {
    @Query("SELECT w FROM SellerWallet w LEFT JOIN FETCH w.seller WHERE w.seller.id = :sellerId")
    Optional<SellerWallet> findBySeller_Id(@Param("sellerId") Long sellerId);

    @Query("SELECT w FROM SellerWallet w LEFT JOIN FETCH w.seller WHERE w.seller = :seller")
    Optional<SellerWallet> findBySeller(@Param("seller") User seller);
}
