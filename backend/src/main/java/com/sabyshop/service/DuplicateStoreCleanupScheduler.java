package com.sabyshop.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DuplicateStoreCleanupScheduler {

    private final SellerService sellerService;

    /**
     * Runs every hour (3600000 ms) to:
     * 1. Scan and flag any new duplicate store names with a 7-day grace period warning.
     * 2. Auto-delete/deactivate duplicate stores whose 7-day deadline has expired without changing name.
     */
    @Scheduled(fixedRate = 3600000, initialDelay = 15000)
    public void runDuplicateStoreScanAndCleanup() {
        try {
            log.info("[Scheduler] Running duplicate store scan & 7-day auto-cleanup task...");
            
            // 1. Scan for newly discovered duplicates and issue 7-day warnings
            java.util.Map<String, Object> scanResult = sellerService.scanAndFlagDuplicateStores();
            log.info("[Scheduler] Duplicate scan completed: {}", scanResult);

            // 2. Auto-cleanup any duplicate stores that exceeded the 7-day deadline
            int deleted = sellerService.autoCleanupExpiredDuplicateStores();
            if (deleted > 0) {
                log.warn("[Scheduler] Auto-deleted {} duplicate stores after 7-day grace period expired.", deleted);
            }
        } catch (Exception e) {
            log.error("[Scheduler] Error during scheduled duplicate store scan/cleanup: {}", e.getMessage(), e);
        }
    }
}