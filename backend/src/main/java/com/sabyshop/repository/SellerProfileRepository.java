package com.sabyshop.repository;

import com.sabyshop.model.SellerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface SellerProfileRepository extends JpaRepository<SellerProfile, Long> {
    @Query("SELECT s FROM SellerProfile s LEFT JOIN FETCH s.user WHERE s.user.id = :userId")
    Optional<SellerProfile> findByUserId(@Param("userId") Long userId);

    Optional<SellerProfile> findByPaymentId(String paymentId);
    boolean existsByUserId(Long userId);

    /** Check if a store name is already taken by ANY seller (case-insensitive & trimmed) */
    @Query("SELECT COUNT(s) > 0 FROM SellerProfile s WHERE LOWER(TRIM(s.storeName)) = LOWER(TRIM(:storeName))")
    boolean existsByStoreNameIgnoreCase(@Param("storeName") String storeName);

    /** Check if a store name is taken by a DIFFERENT seller (case-insensitive & trimmed) — used when updating profile */
    @Query("SELECT COUNT(s) > 0 FROM SellerProfile s WHERE LOWER(TRIM(s.storeName)) = LOWER(TRIM(:storeName)) AND s.user.id <> :userId")
    boolean existsByStoreNameIgnoreCaseAndNotUserId(@Param("storeName") String storeName, @Param("userId") Long userId);

    /** Find all sellers ordered chronologically by registration time */
    @Query("SELECT s FROM SellerProfile s LEFT JOIN FETCH s.user ORDER BY s.createdAt ASC NULLS LAST, s.id ASC")
    java.util.List<SellerProfile> findAllOrderedByCreation();

    /** Find all sellers currently flagged with duplicate name warning */
    @Query("SELECT s FROM SellerProfile s LEFT JOIN FETCH s.user WHERE s.duplicateWarning = true")
    java.util.List<SellerProfile> findByDuplicateWarningTrue();

    @Query("SELECT s FROM SellerProfile s LEFT JOIN FETCH s.user WHERE s.telegramChatId = :telegramChatId")
    Optional<SellerProfile> findByTelegramChatId(@Param("telegramChatId") String telegramChatId);

    @Query("SELECT s FROM SellerProfile s LEFT JOIN FETCH s.user WHERE s.telegramChatId IS NOT NULL")
    java.util.List<SellerProfile> findByTelegramChatIdIsNotNull();

    @Query("SELECT s FROM SellerProfile s LEFT JOIN FETCH s.user WHERE s.subscriptionExpiresAt IS NOT NULL")
    java.util.List<SellerProfile> findAllWithSubscription();
}
