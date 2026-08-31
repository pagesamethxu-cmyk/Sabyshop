package com.sabyshop.service;

import com.sabyshop.model.SellerProfile;
import com.sabyshop.model.SellerProfile.SubscriptionStatus;
import com.sabyshop.repository.SellerProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class SellerSubscriptionScheduler {

    private final SellerProfileRepository sellerProfileRepository;
    private final TelegramNotificationService telegramNotificationService;

    private final java.util.concurrent.ConcurrentHashMap<Long, java.time.LocalDate> lastAlertSentDates = new java.util.concurrent.ConcurrentHashMap<>();

    /**
     * Runs daily at 09:00 AM (Cambodia / Phnom Penh timezone) and on periodic intervals.
     * Strictly waits until a store's subscription has 7 days or less remaining before sending notifications.
     */
    @Scheduled(cron = "0 0 9 * * *", zone = "Asia/Phnom_Penh")
    @Scheduled(fixedRate = 43200000, initialDelay = 30000) // Also runs every 12 hours with 30s initial delay
    @Transactional
    public void runSellerSubscriptionExpiryChecks() {
        try {
            log.info("[Scheduler] Starting seller subscription scan (waiting until <= 7 days before alerting)...");
            LocalDateTime now = LocalDateTime.now();
            java.time.LocalDate today = now.toLocalDate();

            List<SellerProfile> allSellers = sellerProfileRepository.findAllWithSubscription();
            int warningSentCount = 0;
            int expiredCount = 0;

            for (SellerProfile profile : allSellers) {
                if (profile == null || profile.getSubscriptionExpiresAt() == null) continue;

                LocalDateTime expiresAt = profile.getSubscriptionExpiresAt();
                long daysRemaining = Duration.between(now, expiresAt).toDays();

                // 1. Subscription Expired (0 days or past)
                if (expiresAt.isBefore(now)) {
                    if (profile.getSubscriptionStatus() == SubscriptionStatus.ACTIVE) {
                        profile.setSubscriptionStatus(SubscriptionStatus.EXPIRED);
                        sellerProfileRepository.save(profile);
                        telegramNotificationService.sendSellerSubscriptionExpiredNotification(profile);
                        expiredCount++;
                        log.info("Seller store [{}] (#{}) subscription expired. Deactivated and notified.", profile.getStoreName(), profile.getId());
                    }
                }
                // 2. Subscription Expiring in 7 Days or Less (daysRemaining <= 7 && daysRemaining >= 0)
                // If more than 7 days left, system does NOT send (waits until <= 7 days).
                else if (daysRemaining <= 7 && daysRemaining >= 0 && profile.getSubscriptionStatus() == SubscriptionStatus.ACTIVE) {
                    // Send once per day per seller to prevent spam
                    java.time.LocalDate lastSent = lastAlertSentDates.get(profile.getId());
                    if (lastSent == null || !lastSent.equals(today)) {
                        telegramNotificationService.sendSellerSubscriptionExpiryWarningNotification(profile, Math.max(1, daysRemaining));
                        lastAlertSentDates.put(profile.getId(), today);
                        warningSentCount++;
                        log.info("Seller store [{}] (#{}) subscription has {} days remaining (<= 7 days). Expiry warning alert sent.", profile.getStoreName(), profile.getId(), daysRemaining);
                    } else {
                        log.debug("Seller store [{}] (#{}) already received 7-day expiry warning today.", profile.getStoreName(), profile.getId());
                    }
                } else {
                    // More than 7 days left -> Wait until 7 days remaining
                    log.debug("Seller store [{}] (#{}) has {} days remaining (> 7 days). No alert sent yet.", profile.getStoreName(), profile.getId(), daysRemaining);
                }
            }

            log.info("[Scheduler] Seller subscription check complete: {} warnings sent (<= 7d), {} stores marked EXPIRED.", warningSentCount, expiredCount);

            if (warningSentCount > 0 || expiredCount > 0) {
                String adminSummary = String.format(
                        "[របាយការណ៍ស្វ័យប្រវត្តិ - SUBSCRIPTION AUDIT]\n" +
                        "=========================\n" +
                        "- ចំនួនហាងដែលជិតផុតកំណត់ (<= 7 ថ្ងៃ): %d ហាង (បានផ្ញើការដាស់តឿន)\n" +
                        "- ចំនួនហាងដែលទើបផុតកំណត់: %d ហាង\n" +
                        "- ម៉ោងត្រួតពិនិត្យ: %s\n" +
                        "=========================",
                        warningSentCount, expiredCount, LocalDateTime.now().toString()
                );
                telegramNotificationService.sendAdminMessage(adminSummary);
            }
        } catch (Exception e) {
            log.error("[Scheduler] Error during seller subscription expiry check: {}", e.getMessage(), e);
        }
    }
}
