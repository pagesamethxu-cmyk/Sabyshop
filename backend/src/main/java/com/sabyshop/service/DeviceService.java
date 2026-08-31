package com.sabyshop.service;

import com.sabyshop.model.*;

import com.sabyshop.dto.DeviceDto;
import com.sabyshop.dto.DeviceLoginLogDto;
import com.sabyshop.exception.BadRequestException;
import com.sabyshop.repository.DeviceLoginLogRepository;
import com.sabyshop.repository.UserDeviceRepository;
import com.sabyshop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeviceService {

    private final UserDeviceRepository userDeviceRepository;
    private final DeviceLoginLogRepository deviceLoginLogRepository;
    private final UserRepository userRepository;

    // SSE Emitters for real-time live events
    private final List<SseEmitter> adminEmitters = new CopyOnWriteArrayList<>();
    private final Map<String, List<SseEmitter>> userEmitters = new ConcurrentHashMap<>();

    /** Parse User-Agent string into readable Browser and Device Model */
    private String[] parseUserAgent(String userAgent) {
        String browser = "Browser";
        String deviceModel = "Unknown Device";

        if (userAgent == null || userAgent.isBlank()) {
            return new String[]{browser, deviceModel};
        }

        String ua = userAgent.toLowerCase();

        // Detect Device Model / OS
        if (ua.contains("iphone")) {
            deviceModel = "iPhone";
        } else if (ua.contains("ipad")) {
            deviceModel = "iPad";
        } else if (ua.contains("android")) {
            if (ua.contains("samsung") || ua.contains("sm-")) deviceModel = "Samsung Galaxy";
            else if (ua.contains("pixel")) deviceModel = "Google Pixel";
            else if (ua.contains("redmi") || ua.contains("xiaomi")) deviceModel = "Xiaomi Phone";
            else if (ua.contains("oppo")) deviceModel = "OPPO Phone";
            else if (ua.contains("vivo")) deviceModel = "Vivo Phone";
            else deviceModel = "Android Smartphone";
        } else if (ua.contains("macintosh") || ua.contains("mac os")) {
            deviceModel = "MacBook / Mac";
        } else if (ua.contains("windows nt 10.0")) {
            deviceModel = "Windows 11 / 10 PC";
        } else if (ua.contains("windows")) {
            deviceModel = "Windows PC";
        } else if (ua.contains("linux")) {
            deviceModel = "Linux PC";
        }

        // Detect Browser
        if (ua.contains("edg/")) browser = "Edge";
        else if (ua.contains("chrome") && !ua.contains("chromium")) browser = "Chrome";
        else if (ua.contains("safari") && !ua.contains("chrome")) browser = "Safari";
        else if (ua.contains("firefox")) browser = "Firefox";
        else if (ua.contains("opera") || ua.contains("opr/")) browser = "Opera";

        return new String[]{browser, deviceModel};
    }

    /** Register device session during login */
    @Transactional
    public UserDevice registerDevice(User user, String deviceId, String customDeviceName, String userAgent, String ipAddress, boolean isExplicitLogin) {
        if (deviceId == null || deviceId.isBlank()) {
            deviceId = "dev_" + user.getId() + "_" + System.currentTimeMillis();
        }

        String[] parsed = parseUserAgent(userAgent);
        String browser = parsed[0];
        String os = parsed[1];

        String deviceName = (customDeviceName != null && !customDeviceName.isBlank()) 
                ? customDeviceName 
                : (os + " (" + browser + ")");

        Optional<UserDevice> existing = userDeviceRepository.findByUserAndDeviceId(user, deviceId);
        boolean isNewDevice = existing.isEmpty();

        UserDevice device;
        if (isNewDevice) {
            device = UserDevice.builder()
                    .user(user)
                    .deviceId(deviceId)
                    .deviceName(deviceName)
                    .browser(browser)
                    .os(os)
                    .ipAddress(ipAddress != null ? ipAddress : "127.0.0.1")
                    .userAgent(userAgent)
                    .status("ACTIVE")
                    .isNewDevice(true)
                    .lastActive(LocalDateTime.now())
                    .createdAt(LocalDateTime.now())
                    .build();
        } else {
            device = existing.get();
            device.setStatus("ACTIVE");
            device.setDeviceName(deviceName);
            device.setBrowser(browser);
            device.setOs(os);
            device.setIpAddress(ipAddress != null ? ipAddress : "127.0.0.1");
            device.setUserAgent(userAgent);
            device.setLastActive(LocalDateTime.now());
        }

        UserDevice savedDevice = userDeviceRepository.save(device);

        // Record real-time login log if explicit login, new device, or >5 mins since last log
        boolean shouldLog = isExplicitLogin || isNewDevice;
        if (!shouldLog) {
            Optional<DeviceLoginLog> lastLog = deviceLoginLogRepository.findFirstByUserAndDeviceIdOrderByLoginTimeDesc(user, deviceId);
            if (lastLog.isEmpty() || lastLog.get().getLoginTime().isBefore(LocalDateTime.now().minusMinutes(5))) {
                shouldLog = true;
            }
        }

        if (shouldLog) {
            DeviceLoginLog logEntry = DeviceLoginLog.builder()
                    .user(user)
                    .deviceId(deviceId)
                    .deviceName(deviceName)
                    .ipAddress(ipAddress != null ? ipAddress : "127.0.0.1")
                    .userAgent(userAgent)
                    .loginTime(LocalDateTime.now())
                    .status(isNewDevice ? "NEW_DEVICE" : "SAVED_DEVICE")
                    .isNewDevice(isNewDevice)
                    .build();
            
            deviceLoginLogRepository.save(logEntry);

            // Broadcast real-time SSE event to admin and user UI
            broadcastLogToAdmin(toLogDto(logEntry));
            notifyUserDeviceChanged(user.getEmail());
        }

        log.info("Device registered for user {}: {} (New: {}, Logged: {})", user.getEmail(), deviceName, isNewDevice, shouldLog);
        return savedDevice;
    }

    public UserDevice registerDevice(User user, String deviceId, String customDeviceName, String userAgent, String ipAddress) {
        return registerDevice(user, deviceId, customDeviceName, userAgent, ipAddress, false);
    }

    /** Update device last active timestamp */
    @Transactional
    public void updateLastActive(User user, String deviceId) {
        if (user == null || deviceId == null) return;
        userDeviceRepository.findByUserAndDeviceId(user, deviceId).ifPresent(device -> {
            if ("ACTIVE".equalsIgnoreCase(device.getStatus())) {
                device.setLastActive(LocalDateTime.now());
                userDeviceRepository.save(device);
            }
        });
    }

    /** Check if device session is revoked */
    @Transactional(readOnly = true)
    public boolean isDeviceRevoked(String email, String deviceId) {
        if (email == null || deviceId == null) return false;
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return false;

        Optional<UserDevice> dev = userDeviceRepository.findByUserAndDeviceId(user, deviceId);
        return dev.map(d -> "REVOKED".equalsIgnoreCase(d.getStatus())).orElse(false);
    }

    /** Get active devices for current user, auto-registering current device session if missing */
    @Transactional
    public List<DeviceDto> getUserDevices(User user, String currentDeviceId, String customDeviceName, String userAgent, String ipAddress) {
        if (user == null) return List.of();

        List<UserDevice> devices = userDeviceRepository.findByUserAndStatus(user, "ACTIVE");
        
        String validDeviceId = (currentDeviceId != null && !currentDeviceId.isBlank())
                ? currentDeviceId
                : ("dev_" + user.getId() + "_default");

        boolean hasCurrent = devices.stream().anyMatch(d -> d.getDeviceId().equals(validDeviceId));
        if (!hasCurrent) {
            registerDevice(user, validDeviceId, customDeviceName, userAgent, ipAddress);
            devices = userDeviceRepository.findByUserAndStatus(user, "ACTIVE");
        }

        return devices.stream()
                .filter(d -> "ACTIVE".equalsIgnoreCase(d.getStatus()))
                .map(d -> DeviceDto.builder()
                        .id(d.getId())
                        .deviceId(d.getDeviceId())
                        .deviceName(d.getDeviceName())
                        .browser(d.getBrowser())
                        .os(d.getOs())
                        .ipAddress(d.getIpAddress())
                        .status(d.getStatus())
                        .isNewDevice(d.isNewDevice())
                        .isCurrentDevice(d.getDeviceId().equals(validDeviceId))
                        .lastActive(d.getLastActive())
                        .createdAt(d.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    /** Revoke a specific device session by User */
    @Transactional
    public void revokeDevice(User user, Long deviceId) {
        UserDevice device = userDeviceRepository.findById(deviceId)
                .orElseThrow(() -> new BadRequestException("Device not found"));

        if (!device.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Not authorized to manage this device");
        }

        device.setStatus("REVOKED");
        userDeviceRepository.save(device);

        // Remove all login history logs for this removed device so it doesn't show in history
        deviceLoginLogRepository.deleteByUserAndDeviceId(user, device.getDeviceId());

        notifyUserDeviceChanged(user.getEmail());
        broadcastAdminDeviceUpdate();
    }

    /** Revoke all other devices for user */
    @Transactional
    public void revokeAllOtherDevices(User user, String currentDeviceId) {
        List<UserDevice> devices = userDeviceRepository.findByUser(user);
        for (UserDevice d : devices) {
            if (!d.getDeviceId().equals(currentDeviceId) && "ACTIVE".equalsIgnoreCase(d.getStatus())) {
                d.setStatus("REVOKED");
                userDeviceRepository.save(d);
                deviceLoginLogRepository.deleteByUserAndDeviceId(user, d.getDeviceId());
            }
        }
        notifyUserDeviceChanged(user.getEmail());
        broadcastAdminDeviceUpdate();
    }

    /** Admin force revokes ALL device sessions in system */
    @Transactional
    public void adminRevokeAllSystemDevices() {
        userDeviceRepository.revokeAllDevicesInSystem();
        deviceLoginLogRepository.deleteAll();
        log.info("ALL system device sessions revoked by Admin and login history cleared.");
        broadcastAdminDeviceUpdate();
    }

    /** Admin revokes any user's device */
    @Transactional
    public void adminRevokeDevice(Long deviceId) {
        UserDevice device = userDeviceRepository.findById(deviceId)
                .orElseThrow(() -> new BadRequestException("Device not found"));

        device.setStatus("REVOKED");
        userDeviceRepository.save(device);

        // Remove all login history logs for this removed device so it doesn't show in history
        deviceLoginLogRepository.deleteByUserAndDeviceId(device.getUser(), device.getDeviceId());

        notifyUserDeviceChanged(device.getUser().getEmail());
        broadcastAdminDeviceUpdate();
    }

    /** Get real-time login logs for Admin */
    @Transactional(readOnly = true)
    public List<DeviceLoginLogDto> getAllLoginLogs() {
        return deviceLoginLogRepository.findTop50ByOrderByLoginTimeDesc()
                .stream()
                .filter(l -> {
                    if (l.getUser() == null || l.getDeviceId() == null) return false;
                    Optional<UserDevice> dev = userDeviceRepository.findByUserAndDeviceId(l.getUser(), l.getDeviceId());
                    return dev.isPresent() && "ACTIVE".equalsIgnoreCase(dev.get().getStatus());
                })
                .map(this::toLogDto)
                .collect(Collectors.toList());
    }

    /** Get all active devices across system for Admin */
    @Transactional(readOnly = true)
    public List<DeviceLoginLogDto> getAllActiveDevices() {
        return userDeviceRepository.findByStatus("ACTIVE")
                .stream()
                .map(d -> {
                    User u = d.getUser();
                    return DeviceLoginLogDto.builder()
                            .id(d.getId())
                            .userId(u != null ? u.getId() : null)
                            .userEmail(u != null ? u.getEmail() : null)
                            .userName(u != null ? u.getName() : null)
                            .userRole(u != null && u.getRole() != null ? u.getRole().name() : null)
                            .deviceId(d.getDeviceId())
                            .deviceName(d.getDeviceName())
                            .ipAddress(d.getIpAddress())
                            .loginTime(d.getLastActive())
                            .status(d.getStatus())
                            .isNewDevice(d.isNewDevice())
                            .build();
                })
                .collect(Collectors.toList());
    }

    private DeviceLoginLogDto toLogDto(DeviceLoginLog l) {
        User u = l.getUser();
        return DeviceLoginLogDto.builder()
                .id(l.getId())
                .userId(u != null ? u.getId() : null)
                .userEmail(u != null ? u.getEmail() : null)
                .userName(u != null ? u.getName() : null)
                .userRole(u != null && u.getRole() != null ? u.getRole().name() : null)
                .deviceId(l.getDeviceId())
                .deviceName(l.getDeviceName())
                .ipAddress(l.getIpAddress())
                .loginTime(l.getLoginTime())
                .status(l.getStatus())
                .isNewDevice(l.isNewDevice())
                .build();
    }

    // ─── SSE Real-Time Live Stream Management ───────────────────────────────

    public SseEmitter subscribeAdminStream() {
        SseEmitter emitter = new SseEmitter(0L); // No timeout
        adminEmitters.add(emitter);
        emitter.onCompletion(() -> adminEmitters.remove(emitter));
        emitter.onTimeout(() -> adminEmitters.remove(emitter));
        emitter.onError((e) -> adminEmitters.remove(emitter));
        return emitter;
    }

    public SseEmitter subscribeUserStream(String email) {
        SseEmitter emitter = new SseEmitter(0L);
        userEmitters.computeIfAbsent(email, k -> new CopyOnWriteArrayList<>()).add(emitter);
        emitter.onCompletion(() -> removeUserEmitter(email, emitter));
        emitter.onTimeout(() -> removeUserEmitter(email, emitter));
        emitter.onError((e) -> removeUserEmitter(email, emitter));
        return emitter;
    }

    private void removeUserEmitter(String email, SseEmitter emitter) {
        List<SseEmitter> list = userEmitters.get(email);
        if (list != null) {
            list.remove(emitter);
            if (list.isEmpty()) userEmitters.remove(email);
        }
    }

    private void broadcastLogToAdmin(DeviceLoginLogDto dto) {
        List<SseEmitter> dead = new ArrayList<>();
        for (SseEmitter emitter : adminEmitters) {
            try {
                emitter.send(SseEmitter.event().name("device_log").data(dto));
            } catch (Exception e) {
                dead.add(emitter);
            }
        }
        adminEmitters.removeAll(dead);
    }

    private void broadcastAdminDeviceUpdate() {
        List<SseEmitter> dead = new ArrayList<>();
        for (SseEmitter emitter : adminEmitters) {
            try {
                emitter.send(SseEmitter.event().name("device_update").data("refresh"));
            } catch (Exception e) {
                dead.add(emitter);
            }
        }
        adminEmitters.removeAll(dead);
    }

    private void notifyUserDeviceChanged(String email) {
        List<SseEmitter> emitters = userEmitters.get(email);
        if (emitters == null || emitters.isEmpty()) return;

        List<SseEmitter> dead = new ArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("device_update").data("refresh"));
            } catch (Exception e) {
                dead.add(emitter);
            }
        }
        userEmitters.get(email).removeAll(dead);
    }
}
