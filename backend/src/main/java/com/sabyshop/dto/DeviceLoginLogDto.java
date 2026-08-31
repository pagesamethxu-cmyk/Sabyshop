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
public class DeviceLoginLogDto {
    private Long id;
    private Long userId;
    private String userEmail;
    private String userName;
    private String userRole;
    private String deviceId;
    private String deviceName;
    private String ipAddress;
    private LocalDateTime loginTime;
    private String status;
    private boolean isNewDevice;
}
