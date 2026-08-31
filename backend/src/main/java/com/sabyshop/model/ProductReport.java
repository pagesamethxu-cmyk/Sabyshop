package com.sabyshop.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "product_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "seller_id")
    private User seller;

    private String sellerStoreName;
    private String storeLocation;

    private Long orderId;

    private Long reporterUserId;
    private String reporterEmail;
    private String reporterName;

    /**
     * NO_WARRANTY, EXPIRED_EARLY, INVALID_CREDENTIALS, MISLEADING_INFO, FAKE_PRODUCT, OTHER
     */
    @Column(nullable = false)
    private String reason;

    private Integer starRating;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    /** Comma-separated or JSON list of evidence/screenshot proof URLs */
    @Column(columnDefinition = "TEXT")
    private String evidenceImages;

    /** Captions ឬ explanations for proof images */
    @Column(columnDefinition = "TEXT")
    private String imageCaptions;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ReportStatus status = ReportStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String sellerSolution;

    private String replacementEmail;
    private String replacementPassword;

    @Column(columnDefinition = "TEXT")
    private String replacementNote;

    private Double refundAmount;

    @Column(columnDefinition = "TEXT")
    private String adminNotes;

    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;

    public enum ReportStatus {
        PENDING,
        INVESTIGATING,
        PENALTY_APPLIED,
        RESOLVED,
        DISMISSED
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
