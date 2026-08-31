package com.sabyshop.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_devices")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDevice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String deviceId;

    private String deviceName;

    private String browser;

    private String os;

    private String ipAddress;

    @Column(length = 500)
    private String userAgent;

    @Column(nullable = false)
    private String status; // ACTIVE, REVOKED

    private boolean isNewDevice;

    private LocalDateTime lastActive;

    private LocalDateTime createdAt;
}
