package com.sabyshop.controller;

import com.sabyshop.dto.ApiResponse;
import com.sabyshop.model.*;
import com.sabyshop.repository.UserRepository;
import com.sabyshop.service.ExtendedFeaturesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/seller")
@RequiredArgsConstructor
public class SellerWalletController {

    private final ExtendedFeaturesService extendedFeaturesService;
    private final UserRepository userRepository;

    private User getCurrentUser(Authentication auth) {
        if (auth == null || auth.getName() == null) return null;
        return userRepository.findByEmail(auth.getName()).orElse(null);
    }

    // ==========================================
    // WALLET & TRANSACTIONS
    // ==========================================
    @GetMapping("/wallet")
    public ResponseEntity<ApiResponse<SellerWallet>> getMyWallet(Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null) return ResponseEntity.status(401).body(new ApiResponse<>(false, "Unauthorized", null));
        SellerWallet wallet = extendedFeaturesService.getOrCreateSellerWallet(user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Wallet fetched", wallet));
    }

    @GetMapping("/wallet/transactions")
    public ResponseEntity<ApiResponse<List<WalletTransaction>>> getMyTransactions(Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null) return ResponseEntity.status(401).body(new ApiResponse<>(false, "Unauthorized", null));
        List<WalletTransaction> list = extendedFeaturesService.getSellerTransactions(user.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Transactions fetched", list));
    }

    // ==========================================
    // PAYOUT METHODS
    // ==========================================
    @GetMapping("/payout-methods")
    public ResponseEntity<ApiResponse<List<SellerPayoutMethod>>> getPayoutMethods(Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null) return ResponseEntity.status(401).body(new ApiResponse<>(false, "Unauthorized", null));
        return ResponseEntity.ok(new ApiResponse<>(true, "Payout methods fetched", extendedFeaturesService.getSellerPayoutMethods(user.getId())));
    }

    @PostMapping("/payout-methods")
    public ResponseEntity<ApiResponse<SellerPayoutMethod>> savePayoutMethod(@RequestBody Map<String, Object> payload, Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null) return ResponseEntity.status(401).body(new ApiResponse<>(false, "Unauthorized", null));

        String methodTypeStr = (String) payload.get("methodType");
        String accountName = (String) payload.get("accountName");
        String accountNumber = (String) payload.get("accountNumber");
        String bankName = (String) payload.get("bankName");
        String khqrData = (String) payload.get("khqrData");
        String khqrImageUrl = (String) payload.get("khqrImageUrl");
        boolean isDefault = Boolean.TRUE.equals(payload.get("isDefault"));

        SellerPayoutMethod.MethodType methodType = SellerPayoutMethod.MethodType.BAKONG_KHQR;
        if (methodTypeStr != null) {
            try {
                methodType = SellerPayoutMethod.MethodType.valueOf(methodTypeStr.toUpperCase());
            } catch (Exception ignored) {}
        }

        SellerPayoutMethod saved = extendedFeaturesService.saveSellerPayoutMethod(user, methodType, accountName, accountNumber, bankName, khqrData, khqrImageUrl, isDefault);
        return ResponseEntity.ok(new ApiResponse<>(true, "Payout method saved successfully", saved));
    }

    @DeleteMapping("/payout-methods/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePayoutMethod(@PathVariable Long id, Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null) return ResponseEntity.status(401).body(new ApiResponse<>(false, "Unauthorized", null));
        boolean deleted = extendedFeaturesService.deleteSellerPayoutMethod(id, user.getId());
        return ResponseEntity.ok(new ApiResponse<>(deleted, deleted ? "Deleted" : "Not found", null));
    }

    // ==========================================
    // COMMISSIONS
    // ==========================================
    @GetMapping("/commissions")
    public ResponseEntity<ApiResponse<List<SellerCommission>>> getMyCommissions(Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null) return ResponseEntity.status(401).body(new ApiResponse<>(false, "Unauthorized", null));
        return ResponseEntity.ok(new ApiResponse<>(true, "Commissions fetched", extendedFeaturesService.getSellerCommissions(user.getId())));
    }
}
