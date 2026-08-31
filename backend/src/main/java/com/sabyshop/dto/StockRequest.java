package com.sabyshop.dto;
import lombok.Data;

@Data
public class StockRequest {
    // ── Credentials (ACCOUNT / SHARING / ACCOUNT_GAME types) ──────────────────
    private String accountEmail;
    private String accountPassword;

    // ── License Key (KEY / KEY_ACTIVATION / KEY_SERVER types) ─────────────────
    private String licenseKey;

    // ── Invite / Join Link (INVITE_LINK / JOIN_MINECRAFT_PASSWORD types) ───────
    private String inviteLink;

    // ── Generic note ──────────────────────────────────────────────────────────
    private String note;
    private String userNote;
}
