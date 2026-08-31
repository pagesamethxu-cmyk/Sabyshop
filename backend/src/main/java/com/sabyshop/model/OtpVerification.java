package com.sabyshop.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Table 33: otp_verifications
 * Stores 4-digit / 6-digit OTP codes for email verification, registration, password changes, and sensitive actions.
 */
@Entity
@Table(name = "otp_verifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtpVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String identifier; // Email or phone number

    @Column(nullable = false)
    private String otpCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OtpPurpose purpose = OtpPurpose.REGISTRATION;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isUsed = false;

    @Builder.Default
    @Column(nullable = false)
    private Integer attemptsCount = 0;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    private LocalDateTime verifiedAt;

    private LocalDateTime createdAt;

    public enum OtpPurpose {
        REGISTRATION,
        PASSWORD_RESET,
        CHANGE_PASSWORD,
        WITHDRAWAL_AUTH,
        TWO_FACTOR
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.expiresAt == null) {
            this.expiresAt = LocalDateTime.now().plusMinutes(10);
        }
    }
}
