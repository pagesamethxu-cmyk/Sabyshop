package com.sabyshop.dto;

import com.sabyshop.model.SellerProfile.SubscriptionStatus;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SellerProfileDto {
    private Long id;
    private Long userId;
    private String storeName;
    private String storeDescription;
    private String storeLogoUrl;
    private SubscriptionStatus subscriptionStatus;
    private LocalDateTime subscriptionExpiresAt;
    private LocalDateTime lastStoreNameChangedAt;
    private Boolean duplicateWarning;
    private LocalDateTime duplicateWarningAt;
    private LocalDateTime nameChangeDeadline;
    private Long duplicateDaysRemaining;
    private Double balance;
    private String email;
    private String ownerName;
    private LocalDateTime createdAt;
    private com.sabyshop.model.SellerProfile.SubscriptionPlan subscriptionPlan;
    private Long remainingDays;
    private Boolean discountEligible;
    private String planFeeNote;
    private Double averageRating;
    private Long reviewCount;
    private Long productCount;
    private Long recentBuyersCount;
    private Long totalOrdersCount;
    private Long completedOrdersCount;
    private Double successRate;
    private String telegramUsername;
    private String telegramChannel;
    private String preferredContactMethod;
    private Boolean hasUsedFreeTrial;
    private String telegramChatId;
    private Boolean telegramConnected;
    private String telegramBotUsername;
}
