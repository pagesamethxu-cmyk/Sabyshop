package com.sabyshop.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeviceDto {
    private Long id;
    private String deviceId;
    private String deviceName;
    private String browser;
    private String os;
    private String ipAddress;
    private String status; // ACTIVE, REVOKED
    private boolean isNewDevice;
    private boolean isCurrentDevice;
    private LocalDateTime lastActive;
    private LocalDateTime createdAt;
}
