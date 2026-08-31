package com.sabyshop.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "device_login_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeviceLoginLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String deviceId;

    private String deviceName;

    private String ipAddress;

    @Column(length = 500)
    private String userAgent;

    private LocalDateTime loginTime;

    private String status; // NEW_DEVICE, SAVED_DEVICE, REVOKED

    private boolean isNewDevice;
}
