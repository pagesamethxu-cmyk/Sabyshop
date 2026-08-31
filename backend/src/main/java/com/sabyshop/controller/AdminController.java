package com.sabyshop.controller;

import com.sabyshop.dto.ApiResponse;
import com.sabyshop.dto.DashboardResponse;
import com.sabyshop.dto.OrderResponse;
import com.sabyshop.dto.ProductRequest;
import com.sabyshop.dto.ProductResponse;
import com.sabyshop.dto.SellerProfileDto;
import com.sabyshop.dto.StockBulkRequest;
import com.sabyshop.dto.WithdrawResponseDto;
import com.sabyshop.exception.ResourceNotFoundException;
import com.sabyshop.model.Category;
import com.sabyshop.model.ProductStock;
import com.sabyshop.repository.CategoryRepository;
import com.sabyshop.service.AdminService;
import com.sabyshop.service.OrderService;
import com.sabyshop.service.ProductService;
import com.sabyshop.service.SellerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final ProductService productService;
    private final OrderService orderService;
    private final CategoryRepository categoryRepository;
    private final SellerService sellerService;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboard() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", adminService.getDashboard()));
    }

    // ─── Image Upload ────────────────────────────────────────────────────────────

    private Path resolveUploadDir() {
        Path[] candidateDirs = new Path[] {
            Paths.get(uploadDir),
            Paths.get("backend", uploadDir),
            Paths.get("uploads"),
            Paths.get("backend", "uploads")
        };
        for (Path dir : candidateDirs) {
            if (Files.exists(dir) && Files.isDirectory(dir)) {
                return dir;
            }
        }
        Path defaultDir = Paths.get(uploadDir);
        try {
            Files.createDirectories(defaultDir);
        } catch (Exception ignored) {}
        return defaultDir;
    }

    private Path resolveUploadFile(String filename) {
        if (filename == null || filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            return null;
        }
        Path[] candidateDirs = new Path[] {
            Paths.get(uploadDir),
            Paths.get("uploads"),
            Paths.get("backend", "uploads"),
            Paths.get("backend", uploadDir),
            Paths.get("..", "uploads"),
            Paths.get("..", "backend", "uploads"),
            Paths.get(System.getProperty("user.dir"), "uploads"),
            Paths.get(System.getProperty("user.dir"), "backend", "uploads")
        };
        for (Path dir : candidateDirs) {
            try {
                Path candidate = dir.resolve(filename).normalize();
                if (Files.exists(candidate) && Files.isRegularFile(candidate)) {
                    return candidate;
                }
            } catch (Exception ignored) {}
        }
        return Paths.get(uploadDir).resolve(filename);
    }

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<String>> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            Path uploadPath = resolveUploadDir();
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            String ext = "";
            String orig = file.getOriginalFilename();
            if (orig != null && orig.contains(".")) {
                ext = orig.substring(orig.lastIndexOf('.'));
            }
            String filename = UUID.randomUUID().toString() + ext;
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Also keep root uploads in sync if distinct
            try {
                Path rootUploads = Paths.get("uploads");
                if (Files.exists(rootUploads) && !rootUploads.toAbsolutePath().equals(uploadPath.toAbsolutePath())) {
                    Files.copy(filePath, rootUploads.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
                }
            } catch (Exception ignored) {}

            String url = "/api/admin/uploads/" + filename;
            return ResponseEntity.ok(new ApiResponse<>(true, "Image uploaded", url));
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse<>(false, "Upload failed: " + e.getMessage(), null));
        }
    }

    @GetMapping("/uploads/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        try {
            Path file = resolveUploadFile(filename);
            if (file != null && Files.exists(file) && Files.isRegularFile(file)) {
                Resource resource = new UrlResource(file.toUri());
                if (resource.exists() && resource.isReadable()) {
                    String contentType = Files.probeContentType(file);
                    if (contentType == null) {
                        contentType = "application/octet-stream";
                    }
                    return ResponseEntity.ok()
                            .header("Content-Type", contentType)
                            .header("Cache-Control", "public, max-age=86400")
                            .header("Content-Disposition", "inline; filename=\"" + resource.getFilename() + "\"")
                            .body(resource);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to serve upload file [{}]: {}", filename, e.getMessage());
        }
        return ResponseEntity.notFound().build();
    }

    // ─── Products ─────────────────────────────────────────────────────────────────

    @PostMapping("/products")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(@RequestBody ProductRequest request) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Product created", productService.createProduct(request)));
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(@PathVariable Long id, @RequestBody ProductRequest request) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Product updated", productService.updateProduct(id, request)));
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Product deleted", null));
    }

    @PostMapping("/products/{id}/stock")
    public ResponseEntity<ApiResponse<Void>> addStock(@PathVariable Long id, @RequestBody StockBulkRequest request) {
        productService.addStock(id, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Stock added", null));
    }

    @GetMapping("/products/{id}/stock")
    public ResponseEntity<ApiResponse<List<ProductStock>>> getStock(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", productService.getStock(id)));
    }

    // ─── Orders ───────────────────────────────────────────────────────────────────

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getAllOrders() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", orderService.getAllOrders()));
    }

    @org.springframework.web.bind.annotation.PatchMapping("/orders/{id}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String statusStr = body.get("status");
        com.sabyshop.model.OrderStatus status = com.sabyshop.model.OrderStatus.valueOf(statusStr);
        return ResponseEntity.ok(new ApiResponse<>(true, "Order status updated", orderService.updateOrderStatus(id, status)));
    }

    // ─── Categories ───────────────────────────────────────────────────────────────

    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<Category>> createCategory(@RequestBody Category category) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Category created", categoryRepository.save(category)));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<Category>> updateCategory(@PathVariable Long id, @RequestBody Category categoryDetails) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        category.setName(categoryDetails.getName());
        category.setEmoji(categoryDetails.getEmoji());
        category.setDescription(categoryDetails.getDescription());
        return ResponseEntity.ok(new ApiResponse<>(true, "Category updated", categoryRepository.save(category)));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        categoryRepository.deleteById(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Category deleted", null));
    }

    // ─── Sellers ──────────────────────────────────────────────────────────────────

    @GetMapping("/sellers")
    public ResponseEntity<ApiResponse<List<SellerProfileDto>>> getAllSellers() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", sellerService.getAllSellers()));
    }

    @GetMapping("/sellers/{sellerId}")
    public ResponseEntity<ApiResponse<SellerProfileDto>> getSellerById(@PathVariable Long sellerId) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", sellerService.getProfile(sellerId)));
    }

    @PutMapping("/sellers/{sellerId}/status")
    public ResponseEntity<ApiResponse<SellerProfileDto>> updateSellerStatus(
            @PathVariable Long sellerId,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        return ResponseEntity.ok(new ApiResponse<>(true, "Seller status updated",
                sellerService.updateSellerStatusByAdmin(sellerId, status)));
    }

    @PutMapping("/sellers/{sellerId}/expiration")
    public ResponseEntity<ApiResponse<SellerProfileDto>> updateSellerExpiration(
            @PathVariable Long sellerId,
            @RequestBody Map<String, Object> body) {
        java.time.LocalDateTime newExpiry = null;
        if (body.containsKey("days") && body.get("days") != null) {
            int days = Integer.parseInt(body.get("days").toString());
            newExpiry = java.time.LocalDateTime.now().plusDays(days);
        } else if (body.containsKey("subscriptionExpiresAt") && body.get("subscriptionExpiresAt") != null) {
            String dateStr = body.get("subscriptionExpiresAt").toString();
            newExpiry = java.time.LocalDateTime.parse(dateStr.contains("T") ? dateStr : dateStr + "T00:00:00");
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Seller store expiration updated",
                sellerService.updateSellerExpirationByAdmin(sellerId, newExpiry)));
    }

    @PutMapping("/sellers/{sellerId}/balance")
    public ResponseEntity<ApiResponse<SellerProfileDto>> updateSellerBalanceByAdmin(
            @PathVariable Long sellerId,
            @RequestBody Map<String, Object> body) {
        Double amount = body.get("amount") != null ? Double.parseDouble(body.get("amount").toString()) : 0.0;
        String mode = body.get("mode") != null ? body.get("mode").toString() : "ADD";
        String reason = body.get("reason") != null ? body.get("reason").toString() : "";
        return ResponseEntity.ok(new ApiResponse<>(true, "Seller balance updated successfully",
                sellerService.updateSellerBalanceByAdmin(sellerId, amount, mode, reason)));
    }

    @DeleteMapping("/sellers/{sellerId}")
    public ResponseEntity<ApiResponse<Void>> deleteSellerStore(@PathVariable Long sellerId) {
        sellerService.deleteSellerStoreByAdmin(sellerId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Seller store deleted successfully", null));
    }

    /** Manually trigger scan for duplicate store names and issue 7-day warnings */
    @PostMapping("/sellers/scan-duplicates")
    public ResponseEntity<ApiResponse<Map<String, Object>>> scanDuplicates() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Duplicate store scan completed",
                sellerService.scanAndFlagDuplicateStores()));
    }

    /** Manually flag a seller as duplicate with 7-day warning */
    @PostMapping("/sellers/{sellerId}/flag-duplicate")
    public ResponseEntity<ApiResponse<SellerProfileDto>> flagDuplicate(@PathVariable Long sellerId) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Seller flagged as duplicate with 7-day warning",
                sellerService.flagDuplicateStoreManually(sellerId)));
    }

    /** Clean up duplicate stores where the 7-day deadline has expired */
    @PostMapping("/sellers/cleanup-duplicates")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> cleanupDuplicates() {
        int deleted = sellerService.autoCleanupExpiredDuplicateStores();
        return ResponseEntity.ok(new ApiResponse<>(true, "Cleanup complete",
                Map.of("deletedCount", deleted)));
    }

    // ─── Withdrawals ──────────────────────────────────────────────────────────────

    @GetMapping("/withdrawals")
    public ResponseEntity<ApiResponse<List<WithdrawResponseDto>>> getAllWithdrawals(
            @RequestParam(name = "pendingOnly", required = false, defaultValue = "false") Boolean pendingOnly) {
        boolean isPendingOnly = Boolean.TRUE.equals(pendingOnly);
        List<WithdrawResponseDto> result = isPendingOnly
                ? sellerService.getPendingWithdrawRequests()
                : sellerService.getAllWithdrawRequests();
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", result));
    }

    @PutMapping("/withdrawals/{id}/complete")
    public ResponseEntity<ApiResponse<WithdrawResponseDto>> completeWithdrawal(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String note = body != null ? body.get("note") : null;
        return ResponseEntity.ok(new ApiResponse<>(true, "Withdrawal marked as completed",
                sellerService.completeWithdrawal(id, note)));
    }

    @PutMapping("/withdrawals/{id}/reject")
    public ResponseEntity<ApiResponse<WithdrawResponseDto>> rejectWithdrawal(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String note = body != null ? body.get("note") : null;
        return ResponseEntity.ok(new ApiResponse<>(true, "Withdrawal rejected and balance refunded",
                sellerService.rejectWithdrawal(id, note)));
    }
}
