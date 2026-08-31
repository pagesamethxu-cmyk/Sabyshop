package com.sabyshop.controller;

import com.sabyshop.dto.ApiResponse;
import com.sabyshop.model.Notification;
import com.sabyshop.model.User;
import com.sabyshop.repository.UserRepository;
import com.sabyshop.service.ExtendedFeaturesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final ExtendedFeaturesService extendedFeaturesService;
    private final UserRepository userRepository;

    private User getCurrentUser(Authentication auth) {
        if (auth == null || auth.getName() == null) return null;
        return userRepository.findByEmail(auth.getName()).orElse(null);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Notification>>> getMyNotifications(Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null) return ResponseEntity.status(401).body(new ApiResponse<>(false, "Unauthorized", null));
        return ResponseEntity.ok(new ApiResponse<>(true, "Notifications fetched", extendedFeaturesService.getUserNotifications(user.getId())));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null) return ResponseEntity.ok(new ApiResponse<>(true, "Count", Map.of("count", 0L)));
        long count = extendedFeaturesService.getUnreadNotificationCount(user.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Count", Map.of("count", count)));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id, Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null) return ResponseEntity.status(401).body(new ApiResponse<>(false, "Unauthorized", null));
        extendedFeaturesService.markNotificationAsRead(id, user.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Marked as read", null));
    }

    @PostMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null) return ResponseEntity.status(401).body(new ApiResponse<>(false, "Unauthorized", null));
        extendedFeaturesService.markAllNotificationsAsRead(user.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "All marked as read", null));
    }

    @PostMapping("/broadcast")
    public ResponseEntity<ApiResponse<Void>> broadcast(@RequestBody Map<String, String> body, Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null || user.getRole() != com.sabyshop.model.Role.ADMIN) {
            return ResponseEntity.status(403).body(new ApiResponse<>(false, "Admin only", null));
        }
        extendedFeaturesService.broadcastNotification(body.get("title"), body.get("message"), body.get("link"));
        return ResponseEntity.ok(new ApiResponse<>(true, "Broadcast sent", null));
    }
}
