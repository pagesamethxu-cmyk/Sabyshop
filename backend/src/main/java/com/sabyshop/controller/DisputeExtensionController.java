package com.sabyshop.controller;

import com.sabyshop.dto.ApiResponse;
import com.sabyshop.model.*;
import com.sabyshop.repository.DisputeRepository;
import com.sabyshop.repository.UserRepository;
import com.sabyshop.service.ExtendedFeaturesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/disputes")
@RequiredArgsConstructor
public class DisputeExtensionController {

    private final ExtendedFeaturesService extendedFeaturesService;
    private final DisputeRepository disputeRepository;
    private final UserRepository userRepository;

    private User getCurrentUser(Authentication auth) {
        if (auth == null || auth.getName() == null) return null;
        return userRepository.findByEmail(auth.getName()).orElse(null);
    }

    @GetMapping("/{disputeId}/messages")
    public ResponseEntity<ApiResponse<List<DisputeMessage>>> getDisputeMessages(@PathVariable Long disputeId, Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null) return ResponseEntity.status(401).body(new ApiResponse<>(false, "Unauthorized", null));
        return ResponseEntity.ok(new ApiResponse<>(true, "Messages fetched", extendedFeaturesService.getDisputeMessages(disputeId)));
    }

    @PostMapping("/{disputeId}/messages")
    public ResponseEntity<ApiResponse<DisputeMessage>> addDisputeMessage(@PathVariable Long disputeId, @RequestBody Map<String, String> payload, Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null) return ResponseEntity.status(401).body(new ApiResponse<>(false, "Unauthorized", null));

        Dispute dispute = disputeRepository.findById(disputeId).orElse(null);
        if (dispute == null) return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Dispute not found", null));

        String message = payload.get("message");
        String attachmentUrl = payload.get("attachmentUrl");
        String role = (user.getRole() == Role.ADMIN) ? "ADMIN" : (dispute.getSeller() != null && dispute.getSeller().getId().equals(user.getId()) ? "SELLER" : "BUYER");

        DisputeMessage msg = extendedFeaturesService.addDisputeMessage(dispute, user, role, message, attachmentUrl, false);
        return ResponseEntity.ok(new ApiResponse<>(true, "Message sent", msg));
    }

    @GetMapping("/{disputeId}/evidence")
    public ResponseEntity<ApiResponse<List<DisputeEvidence>>> getDisputeEvidence(@PathVariable Long disputeId, Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null) return ResponseEntity.status(401).body(new ApiResponse<>(false, "Unauthorized", null));
        return ResponseEntity.ok(new ApiResponse<>(true, "Evidence fetched", extendedFeaturesService.getDisputeEvidence(disputeId)));
    }

    @PostMapping("/{disputeId}/evidence")
    public ResponseEntity<ApiResponse<DisputeEvidence>> addDisputeEvidence(@PathVariable Long disputeId, @RequestBody Map<String, Object> payload, Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null) return ResponseEntity.status(401).body(new ApiResponse<>(false, "Unauthorized", null));

        Dispute dispute = disputeRepository.findById(disputeId).orElse(null);
        if (dispute == null) return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Dispute not found", null));

        String fileUrl = (String) payload.get("fileUrl");
        String fileType = (String) payload.get("fileType");
        String fileName = (String) payload.get("fileName");
        Long fileSize = payload.get("fileSize") != null ? Long.valueOf(payload.get("fileSize").toString()) : 0L;
        String description = (String) payload.get("description");

        DisputeEvidence evidence = extendedFeaturesService.addDisputeEvidence(dispute, user, fileUrl, fileType, fileName, fileSize, description);
        return ResponseEntity.ok(new ApiResponse<>(true, "Evidence recorded", evidence));
    }
}
