package com.sabyshop.controller;

import com.sabyshop.dto.ApiResponse;
import com.sabyshop.model.Role;
import com.sabyshop.model.SupportThread;
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
@RequestMapping("/api/support/threads")
@RequiredArgsConstructor
public class SupportThreadController {

    private final ExtendedFeaturesService extendedFeaturesService;
    private final UserRepository userRepository;

    private User getCurrentUser(Authentication auth) {
        if (auth == null || auth.getName() == null) return null;
        return userRepository.findByEmail(auth.getName()).orElse(null);
    }

    @GetMapping("/my-tickets")
    public ResponseEntity<ApiResponse<List<SupportThread>>> getMyTickets(Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null) return ResponseEntity.status(401).body(new ApiResponse<>(false, "Unauthorized", null));
        return ResponseEntity.ok(new ApiResponse<>(true, "Tickets fetched", extendedFeaturesService.getUserSupportThreads(user.getId())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SupportThread>> createTicket(@RequestBody Map<String, String> payload, Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null) return ResponseEntity.status(401).body(new ApiResponse<>(false, "Unauthorized", null));

        String subject = payload.get("subject");
        String category = payload.get("category");
        String priorityStr = payload.get("priority");
        String message = payload.get("message");

        SupportThread.Priority priority = SupportThread.Priority.NORMAL;
        if (priorityStr != null) {
            try {
                priority = SupportThread.Priority.valueOf(priorityStr.toUpperCase());
            } catch (Exception ignored) {}
        }

        SupportThread thread = extendedFeaturesService.createSupportThread(user, subject, category, priority, message);
        return ResponseEntity.ok(new ApiResponse<>(true, "Ticket created successfully", thread));
    }

    @PostMapping("/{id}/reply")
    public ResponseEntity<ApiResponse<SupportThread>> replyTicket(@PathVariable Long id, @RequestBody Map<String, String> payload, Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null) return ResponseEntity.status(401).body(new ApiResponse<>(false, "Unauthorized", null));

        String message = payload.get("message");
        User admin = (user.getRole() == Role.ADMIN) ? user : null;
        SupportThread thread = extendedFeaturesService.replySupportThread(id, message, admin);
        return ResponseEntity.ok(new ApiResponse<>(true, "Replied", thread));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<SupportThread>> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload, Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null) return ResponseEntity.status(401).body(new ApiResponse<>(false, "Unauthorized", null));

        String statusStr = payload.get("status");
        try {
            SupportThread.TicketStatus status = SupportThread.TicketStatus.valueOf(statusStr.toUpperCase());
            SupportThread thread = extendedFeaturesService.updateSupportThreadStatus(id, status);
            return ResponseEntity.ok(new ApiResponse<>(true, "Status updated", thread));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Invalid status", null));
        }
    }

    @GetMapping("/admin/all")
    public ResponseEntity<ApiResponse<List<SupportThread>>> adminGetAllTickets(Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null || user.getRole() != Role.ADMIN) {
            return ResponseEntity.status(403).body(new ApiResponse<>(false, "Admin only", null));
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "All tickets", extendedFeaturesService.getAllSupportThreads()));
    }
}
