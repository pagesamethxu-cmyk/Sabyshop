package com.sabyshop.repository;

import com.sabyshop.model.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {
    Optional<OtpVerification> findTopByIdentifierAndPurposeAndIsUsedFalseOrderByCreatedAtDesc(
            String identifier, OtpVerification.OtpPurpose purpose);
    List<OtpVerification> findByIdentifierOrderByCreatedAtDesc(String identifier);
}
