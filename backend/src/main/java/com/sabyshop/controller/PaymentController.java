package com.sabyshop.controller;

import com.sabyshop.dto.ApiResponse;
import com.sabyshop.model.Payment;
import com.sabyshop.model.Role;
import com.sabyshop.model.User;
import com.sabyshop.repository.UserRepository;
import com.sabyshop.service.ExtendedFeaturesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PaymentController {

    private final ExtendedFeaturesService extendedFeaturesService;
    private final UserRepository userRepository;

    private User getCurrentUser(Authentication auth) {
        if (auth == null || auth.getName() == null) return null;
        return userRepository.findByEmail(auth.getName()).orElse(null);
    }

    @GetMapping("/payments/my-payments")
    public ResponseEntity<ApiResponse<List<Payment>>> getMyPayments(Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null) return ResponseEntity.status(401).body(new ApiResponse<>(false, "Unauthorized", null));
        return ResponseEntity.ok(new ApiResponse<>(true, "Payments fetched", extendedFeaturesService.getUserPayments(user.getId())));
    }

    @GetMapping("/admin/payments")
    public ResponseEntity<ApiResponse<List<Payment>>> adminGetAllPayments(Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null || user.getRole() != Role.ADMIN) {
            return ResponseEntity.status(403).body(new ApiResponse<>(false, "Admin only", null));
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "All payments fetched", extendedFeaturesService.getAllPayments()));
    }

    @GetMapping("/admin/commissions")
    public ResponseEntity<ApiResponse<List<?>>> adminGetAllCommissions(Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null || user.getRole() != Role.ADMIN) {
            return ResponseEntity.status(403).body(new ApiResponse<>(false, "Admin only", null));
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "All commissions fetched", extendedFeaturesService.getAllCommissions()));
    }

    @GetMapping("/admin/refunds")
    public ResponseEntity<ApiResponse<List<?>>> adminGetAllRefunds(Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null || user.getRole() != Role.ADMIN) {
            return ResponseEntity.status(403).body(new ApiResponse<>(false, "Admin only", null));
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "All refunds fetched", extendedFeaturesService.getAllRefunds()));
    }
}
