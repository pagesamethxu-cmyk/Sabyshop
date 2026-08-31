package com.sabyshop.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Table 35: user_sessions
 * Tracks active JWT / web client sessions, IP locations, user agent strings, and device types.
 */
@Entity
@Table(name = "user_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class UserSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User user;

    @Column(unique = true, nullable = false)
    private String sessionToken;

    private String deviceId;

    private String deviceName;

    @Builder.Default
    private String deviceType = "DESKTOP"; // "DESKTOP", "MOBILE", "TABLET"

    private String browser;

    private String os;

    private String ipAddress;

    private String locationCity;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isActive = true;

    private LocalDateTime lastActiveAt;

    private LocalDateTime expiresAt;

    private LocalDateTime createdAt;

    @JsonProperty("userName")
    public String getUserName() {
        try {
            return user != null ? user.getName() : null;
        } catch (Exception e) {
            return null;
        }
    }

    @JsonProperty("userEmail")
    public String getUserEmail() {
        try {
            return user != null ? user.getEmail() : null;
        } catch (Exception e) {
            return null;
        }
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.lastActiveAt == null) {
            this.lastActiveAt = LocalDateTime.now();
        }
    }
}
