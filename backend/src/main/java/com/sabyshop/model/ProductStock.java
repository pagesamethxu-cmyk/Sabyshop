package com.sabyshop.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name="product_stock")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductStock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name="product_id")
    private Product product;

    // ── Credentials (for ACCOUNT / SHARING / ACCOUNT_GAME types) ──────────────
    private String accountEmail;
    private String accountPassword;

    // ── License Key (for KEY / KEY_ACTIVATION / KEY_SERVER types) ─────────────
    /** License or activation key — used when productType is KEY, KEY_ACTIVATION, KEY_SERVER */
    private String licenseKey;

    // ── Invite / Join Link (for INVITE_LINK / JOIN_MINECRAFT_PASSWORD types) ───
    /** Invite or join link — used when productType is INVITE_LINK, JOIN_MINECRAFT_PASSWORD */
    private String inviteLink;

    // ── Extra notes (generic, any type) ───────────────────────────────────────
    /** Optional seller note or extra info for the buyer */
    private String userNote;

    // ── Upload tracking ───────────────────────────────────────────────────────
    /** The seller or admin who uploaded this stock item */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by")
    @JsonIgnore
    private User uploadedBy;

    /** When this stock item was added */
    private LocalDateTime addedAt;

    // ── Sale tracking ─────────────────────────────────────────────────────────
    @Builder.Default
    private boolean sold = false;

    @ManyToOne
    @JoinColumn(name="order_id")
    @JsonIgnore
    private Order order;

    private LocalDateTime soldAt;

    @PrePersist
    protected void onCreate() {
        if (this.addedAt == null) {
            this.addedAt = LocalDateTime.now();
        }
    }
}
