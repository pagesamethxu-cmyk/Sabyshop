package com.sabyshop.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Table 39: dispute_evidence
 * Uploaded proof screenshots, videos, log files, or documents supporting a dispute claim.
 */
@Entity
@Table(name = "dispute_evidence")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class DisputeEvidence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispute_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "order", "buyer", "seller"})
    private Dispute dispute;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by_user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "roles"})
    private User uploadedBy;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String fileUrl;

    @Builder.Default
    private String fileType = "IMAGE"; // "IMAGE", "VIDEO", "PDF", "DOCUMENT"

    private String fileName;

    private Long fileSizeBytes;

    @Column(columnDefinition = "TEXT")
    private String description;

    private LocalDateTime createdAt;

    @JsonProperty("uploadedByName")
    public String getUploadedByName() {
        try {
            return uploadedBy != null ? uploadedBy.getName() : null;
        } catch (Exception e) {
            return null;
        }
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
