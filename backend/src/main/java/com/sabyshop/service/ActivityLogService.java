package com.sabyshop.service;

import com.sabyshop.model.User;
import com.sabyshop.model.UserActivityLog;
import com.sabyshop.repository.UserActivityLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final UserActivityLogRepository userActivityLogRepository;

    @Transactional
    public void logSellerActivity(User seller, String action, String details, String ipAddress) {
        if (seller == null) return;
        try {
            UserActivityLog activity = UserActivityLog.builder()
                    .user(seller)
                    .activityType("SELLER_" + action.toUpperCase())
                    .details(details)
                    .ipAddress(ipAddress != null ? ipAddress : "127.0.0.1")
                    .createdAt(LocalDateTime.now())
                    .build();
            userActivityLogRepository.save(activity);
            log.info("[Seller Activity Logged] Seller ID: {}, Action: {}, Details: {}", seller.getId(), action, details);
        } catch (Exception e) {
            log.warn("Failed to record seller activity log: {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<UserActivityLog> getSellerActivities(Long sellerUserId) {
        return userActivityLogRepository.findByUserIdOrderByCreatedAtDesc(sellerUserId);
    }
}
