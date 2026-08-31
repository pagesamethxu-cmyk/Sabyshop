package com.sabyshop.controller;

import com.sabyshop.dto.ApiResponse;
import com.sabyshop.dto.DeviceDto;
import com.sabyshop.dto.DeviceLoginLogDto;
import com.sabyshop.model.User;
import com.sabyshop.repository.UserRepository;
import com.sabyshop.service.DeviceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DeviceController {

    private final DeviceService deviceService;
    private final UserRepository userRepository;

    private User getCurrentUser(Authentication auth) {
        if (auth == null || auth.getName() == null || "anonymousUser".equalsIgnoreCase(auth.getName())) {
            return null;
        }
        return userRepository.findByEmail(auth.getName()).orElse(null);
    }

    /** GET user active devices */
    @GetMapping("/devices")
    public ResponseEntity<ApiResponse<List<DeviceDto>>> getUserDevices(
            @RequestHeader(value = "X-Device-Id", required = false) String currentDeviceId,
            @RequestHeader(value = "X-Device-Name", required = false) String currentDeviceName,
            @RequestHeader(value = "User-Agent", required = false) String userAgent,
            jakarta.servlet.http.HttpServletRequest servletRequest,
            Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "Authentication required", null));
        }

        String ipAddress = servletRequest.getRemoteAddr();
        List<DeviceDto> devices = deviceService.getUserDevices(user, currentDeviceId, currentDeviceName, userAgent, ipAddress);
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", devices));
    }

    /** Revoke specific device by user */
    @PostMapping("/devices/{id}/revoke")
    public ResponseEntity<ApiResponse<String>> revokeDevice(@PathVariable Long id, Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "Authentication required", null));
        }

        deviceService.revokeDevice(user, id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Device revoked successfully", "Device disconnected"));
    }

    /** Revoke all other devices by user */
    @PostMapping("/devices/revoke-others")
    public ResponseEntity<ApiResponse<String>> revokeOtherDevices(
            @RequestHeader(value = "X-Device-Id", required = false) String currentDeviceId,
            Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "Authentication required", null));
        }

        deviceService.revokeAllOtherDevices(user, currentDeviceId != null ? currentDeviceId : "");
        return ResponseEntity.ok(new ApiResponse<>(true, "All other devices revoked successfully", "Other sessions terminated"));
    }

    /** SSE Stream for real-time user device changes */
    @GetMapping(value = "/devices/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamUserDevices(Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null) {
            SseEmitter emitter = new SseEmitter();
            emitter.completeWithError(new RuntimeException("Unauthorized"));
            return emitter;
        }
        return deviceService.subscribeUserStream(user.getEmail());
    }

    // ─── ADMIN ENDPOINTS ───────────────────────────────────────────────────

    /** Admin view real-time login log history */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/devices/logs")
    public ResponseEntity<ApiResponse<List<DeviceLoginLogDto>>> getAdminLoginLogs() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", deviceService.getAllLoginLogs()));
    }

    /** Admin view active user sessions */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/devices/active")
    public ResponseEntity<ApiResponse<List<DeviceLoginLogDto>>> getAdminActiveDevices(
            @RequestHeader(value = "X-Device-Id", required = false) String currentDeviceId,
            @RequestHeader(value = "X-Device-Name", required = false) String currentDeviceName,
            @RequestHeader(value = "User-Agent", required = false) String userAgent,
            jakarta.servlet.http.HttpServletRequest servletRequest,
            Authentication auth) {
        User adminUser = getCurrentUser(auth);
        if (adminUser != null && currentDeviceId != null && !currentDeviceId.isBlank()) {
            deviceService.registerDevice(adminUser, currentDeviceId, currentDeviceName, userAgent, servletRequest.getRemoteAddr());
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", deviceService.getAllActiveDevices()));
    }

    /** Admin revoke any user device */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/devices/{id}/revoke")
    public ResponseEntity<ApiResponse<String>> adminRevokeDevice(@PathVariable Long id) {
        deviceService.adminRevokeDevice(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Device revoked by admin", "Session terminated"));
    }

    /** Admin force revoke all device sessions across system */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/devices/revoke-all-system")
    public ResponseEntity<ApiResponse<String>> adminRevokeAllSystemDevices() {
        deviceService.adminRevokeAllSystemDevices();
        return ResponseEntity.ok(new ApiResponse<>(true, "All system devices revoked successfully", "All sessions terminated"));
    }

    /** Admin SSE stream for real-time live login logs */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping(value = "/admin/devices/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamAdminDeviceLogs() {
        return deviceService.subscribeAdminStream();
    }
}
