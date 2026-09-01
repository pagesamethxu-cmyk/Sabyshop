package com.sabyshop.controller;

import com.sabyshop.dto.*;
import com.sabyshop.model.User;
import com.sabyshop.repository.SellerProfileRepository;
import com.sabyshop.repository.UserRepository;
import com.sabyshop.service.SellerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/seller")
@RequiredArgsConstructor
public class SellerController {

    private final SellerService sellerService;
    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;

    @org.springframework.beans.factory.annotation.Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private Long getCurrentUserId(Authentication auth) {
        if (auth == null || auth.getName() == null || "anonymousUser".equalsIgnoreCase(auth.getName())) {
            throw new com.sabyshop.exception.BadRequestException("Authentication required. Please login.");
        }
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new com.sabyshop.exception.ResourceNotFoundException("User not found: " + auth.getName()));
        return user.getId();
    }

    private java.nio.file.Path resolveUploadDir() {
        java.nio.file.Path[] candidateDirs = new java.nio.file.Path[] {
            java.nio.file.Paths.get(uploadDir),
            java.nio.file.Paths.get("backend", uploadDir),
            java.nio.file.Paths.get("uploads"),
            java.nio.file.Paths.get("backend", "uploads")
        };
        for (java.nio.file.Path dir : candidateDirs) {
            if (java.nio.file.Files.exists(dir) && java.nio.file.Files.isDirectory(dir)) {
                return dir;
            }
        }
        java.nio.file.Path defaultDir = java.nio.file.Paths.get(uploadDir);
        try {
            java.nio.file.Files.createDirectories(defaultDir);
        } catch (Exception ignored) {}
        return defaultDir;
    }

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<String>> uploadImage(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            java.nio.file.Path uploadPath = resolveUploadDir();
            if (!java.nio.file.Files.exists(uploadPath)) {
                java.nio.file.Files.createDirectories(uploadPath);
            }
            String ext = "";
            String orig = file.getOriginalFilename();
            if (orig != null && orig.contains(".")) {
                ext = orig.substring(orig.lastIndexOf('.')).toLowerCase();
            }
            java.util.List<String> allowedExtensions = java.util.List.of(".jpg", ".jpeg", ".png", ".gif", ".webp");
            if (!allowedExtensions.contains(ext)) {
                return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Only image files are allowed (.jpg, .jpeg, .png, .gif, .webp)", null));
            }
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Invalid file type. Only image files are allowed.", null));
            }
            String filename = java.util.UUID.randomUUID().toString() + ext;
            java.nio.file.Path filePath = uploadPath.resolve(java.nio.file.Paths.get(filename).getFileName().toString());
            java.nio.file.Files.copy(file.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            // Also keep root uploads in sync if distinct
            try {
                java.nio.file.Path rootUploads = java.nio.file.Paths.get("uploads");
                if (java.nio.file.Files.exists(rootUploads) && !rootUploads.toAbsolutePath().equals(uploadPath.toAbsolutePath())) {
                    java.nio.file.Files.copy(filePath, rootUploads.resolve(filename), java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                }
            } catch (Exception ignored) {}

            String url = "/api/admin/uploads/" + filename;
            return ResponseEntity.ok(new ApiResponse<>(true, "Image uploaded", url));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse<>(false, "Upload failed: " + e.getMessage(), null));
        }
    }

    // ── Onboarding ────────────────────────────────────────────────────────────

    /** Step 1: Submit store info + KHQR payment ID for subscription */
    @PostMapping("/apply")
    public ResponseEntity<ApiResponse<SellerProfileDto>> apply(
            @RequestBody SellerApplyRequest request, Authentication auth) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Application submitted",
                sellerService.applyForSeller(getCurrentUserId(auth), request)));
    }

    /** Step 2: Verify the $2.50 KHQR payment and activate seller account */
    @PostMapping("/verify-subscription")
    public ResponseEntity<ApiResponse<SellerProfileDto>> verifySubscription(Authentication auth) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Subscription verified",
                sellerService.verifySubscription(getCurrentUserId(auth))));
    }

    /** Step 3: Renew seller store subscription (+30 days) */
    @PostMapping("/renew-subscription")
    public ResponseEntity<ApiResponse<SellerProfileDto>> renewSubscription(
            @RequestBody(required = false) Map<String, String> body, Authentication auth) {
        String transactionMd5 = body != null ? body.get("paymentId") : null;
        String planId = body != null ? body.get("planId") : null;
        return ResponseEntity.ok(new ApiResponse<>(true, "Subscription renewed successfully for +30 days",
                sellerService.renewSubscription(getCurrentUserId(auth), transactionMd5, planId)));
    }

    // ── Profile ───────────────────────────────────────────────────────────────

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<SellerProfileDto>> getProfile(Authentication auth) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success",
                sellerService.getProfile(getCurrentUserId(auth))));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<SellerProfileDto>> updateProfile(
            @RequestBody UpdateSellerProfileRequest request, Authentication auth) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Profile updated",
                sellerService.updateProfile(getCurrentUserId(auth), request)));
    }

    /** Public profile — visible to any visitor */
    @GetMapping("/public/{sellerId}")
    public ResponseEntity<ApiResponse<SellerProfileDto>> getPublicProfile(@PathVariable Long sellerId) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success",
                sellerService.getPublicProfile(sellerId)));
    }

    /**
     * Public endpoint — check whether a store name is already taken.
     * Returns { available: true/false, message: "..." }
     * No authentication required.
     */
    @GetMapping("/check-store-name")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkStoreName(
            @RequestParam String name,
            Authentication auth) {
        String cleanName = SellerService.normalizeStoreName(name);
        Long currentUserId = null;
        if (auth != null && auth.getName() != null) {
            currentUserId = userRepository.findByEmail(auth.getName()).map(User::getId).orElse(null);
        }
        boolean taken;
        if (cleanName.isEmpty()) {
            taken = true;
        } else if (currentUserId != null) {
            taken = sellerProfileRepository.existsByStoreNameIgnoreCaseAndNotUserId(cleanName, currentUserId);
        } else {
            taken = sellerProfileRepository.existsByStoreNameIgnoreCase(cleanName);
        }
        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("available", !taken && !cleanName.isEmpty());
        result.put("name", cleanName);
        if (cleanName.isEmpty()) {
            result.put("message", "សូមបញ្ចូលឈ្មោះហាង (Please enter a valid store name)");
        } else if (taken) {
            result.put("message",
                "ឈ្មោះហាង \"" + cleanName + "\" ត្រូវបានប្រើប្រាស់ដោយអ្នកលក់ម្នាក់ទៀតហើយ! " +
                "សូមជ្រើសរើសឈ្មោះហាងដែលខុសគ្នា។ " +
                "(Store name is already taken. Please choose a different name.)");
        } else {
            result.put("message",
                "ឈ្មោះហាង \"" + cleanName + "\" អាចប្រើបាន! " +
                "(Store name is available!)");
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Checked", result));
    }

    // ── Products ──────────────────────────────────────────────────────────────

    @GetMapping("/products")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getMyProducts(Authentication auth) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success",
                sellerService.getSellerProducts(getCurrentUserId(auth))));
    }

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<com.sabyshop.dto.OrderResponse>>> getMyOrders(Authentication auth) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success",
                sellerService.getSellerOrders(getCurrentUserId(auth))));
    }

    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<ApiResponse<com.sabyshop.dto.OrderResponse>> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        String statusStr = body.get("status");
        com.sabyshop.model.OrderStatus status;
        try {
            status = com.sabyshop.model.OrderStatus.valueOf(statusStr);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Invalid order status: " + statusStr, null));
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Order status updated",
                sellerService.updateSellerOrderStatus(getCurrentUserId(auth), id, status)));
    }

    /** Public product list for a store page */
    @GetMapping("/public/{sellerId}/products")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getPublicProducts(@PathVariable Long sellerId) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success",
                sellerService.getSellerProducts(sellerId)));
    }

    @PostMapping("/products")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @RequestBody SellerProductRequest request, Authentication auth) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Product created",
                sellerService.createSellerProduct(getCurrentUserId(auth), request)));
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long id,
            @RequestBody SellerProductRequest request,
            Authentication auth) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Product updated",
                sellerService.updateSellerProduct(getCurrentUserId(auth), id, request)));
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(
            @PathVariable Long id, Authentication auth) {
        sellerService.deleteSellerProduct(getCurrentUserId(auth), id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Product deleted", null));
    }

    /** Seller adds stock to their own product */
    @PostMapping("/products/{id}/stock")
    public ResponseEntity<ApiResponse<Void>> addStock(
            @PathVariable Long id,
            @RequestBody com.sabyshop.dto.StockBulkRequest request,
            Authentication auth) {
        Long sellerId = getCurrentUserId(auth);
        sellerService.addStockToSellerProduct(sellerId, id, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Stock added", null));
    }

    /** Seller fetches stock inventory for their own product */
    @GetMapping("/products/{id}/stock")
    public ResponseEntity<ApiResponse<List<com.sabyshop.model.ProductStock>>> getStock(
            @PathVariable Long id, Authentication auth) {
        Long sellerId = getCurrentUserId(auth);
        return ResponseEntity.ok(new ApiResponse<>(true, "Success",
                sellerService.getSellerProductStock(sellerId, id)));
    }


    // ── Balance & Withdrawals ─────────────────────────────────────────────────

    @GetMapping("/balance")
    public ResponseEntity<ApiResponse<Map<String, Double>>> getBalance(Authentication auth) {
        double balance = sellerService.getBalance(getCurrentUserId(auth));
        return ResponseEntity.ok(new ApiResponse<>(true, "Success",
                Map.of("balance", balance)));
    }

    @PostMapping("/withdraw")
    public ResponseEntity<ApiResponse<WithdrawResponseDto>> requestWithdrawal(
            @RequestBody WithdrawRequestDto dto, Authentication auth) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Withdrawal request submitted",
                sellerService.requestWithdrawal(getCurrentUserId(auth), dto)));
    }

    @GetMapping("/withdraw/history")
    public ResponseEntity<ApiResponse<List<WithdrawResponseDto>>> getWithdrawHistory(Authentication auth) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success",
                sellerService.getWithdrawHistory(getCurrentUserId(auth))));
    }
}
