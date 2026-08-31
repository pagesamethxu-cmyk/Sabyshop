package com.sabyshop.controller;

import com.sabyshop.dto.ApiResponse;
import com.sabyshop.model.AdminAction;
import com.sabyshop.model.Role;
import com.sabyshop.model.User;
import com.sabyshop.model.UserSession;
import com.sabyshop.repository.UserRepository;
import com.sabyshop.service.ExtendedFeaturesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminAuditController {

    private final ExtendedFeaturesService extendedFeaturesService;
    private final UserRepository userRepository;

    private User getCurrentUser(Authentication auth) {
        if (auth == null || auth.getName() == null) return null;
        return userRepository.findByEmail(auth.getName()).orElse(null);
    }

    @GetMapping("/audit-actions")
    public ResponseEntity<ApiResponse<List<AdminAction>>> getAuditActions(Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null || user.getRole() != Role.ADMIN) {
            return ResponseEntity.status(403).body(new ApiResponse<>(false, "Admin only", null));
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Audit actions fetched", extendedFeaturesService.getAdminActions()));
    }

    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<List<UserSession>>> getActiveSessions(Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null || user.getRole() != Role.ADMIN) {
            return ResponseEntity.status(403).body(new ApiResponse<>(false, "Admin only", null));
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Active sessions fetched", extendedFeaturesService.getAllActiveSessions()));
    }
}
