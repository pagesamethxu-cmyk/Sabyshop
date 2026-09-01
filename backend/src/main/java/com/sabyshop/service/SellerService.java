package com.sabyshop.service;

import com.sabyshop.dto.*;
import com.sabyshop.exception.BadRequestException;
import com.sabyshop.exception.ResourceNotFoundException;
import com.sabyshop.model.*;
import com.sabyshop.model.SellerProfile.SubscriptionStatus;
import com.sabyshop.model.WithdrawRequest.WithdrawStatus;
import com.sabyshop.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SellerService {

  public static double calculatePlatformFee(double basePrice) {
    if (basePrice < 15.0) {
      return 0.25;
    } else if (basePrice >= 30.0) {
      return 2.00;
    } else {
      return 0.50;
    }
  }

  public static String normalizeStoreName(String name) {
    if (name == null) return "";
    return name.trim().replaceAll("\\s+", " ");
  }

  private final UserRepository userRepository;
 private final SellerProfileRepository sellerProfileRepository;
 private final WithdrawRequestRepository withdrawRequestRepository;
 private final ProductRepository productRepository;
 private final ProductStockRepository productStockRepository;
 private final CategoryRepository categoryRepository;
 private final PaymentService paymentService;
 private final TelegramNotificationService telegramNotificationService;
 private final OrderRepository orderRepository;
 private final ActivityLogService activityLogService;
 private final ProductReviewRepository productReviewRepository;

 @org.springframework.context.annotation.Lazy
 @org.springframework.beans.factory.annotation.Autowired
 private OrderService orderService;

 // ── Application ──────────────────────────────────────────────────────────

 /**
 * Step 1: Submit seller application.
 * First month is 100% FREE for new sellers!
 * Auto-activates profile for 30 days and upgrades user role to SELLER.
 * Subsequent renewals require $2.50/month KHQR payment.
 */
    @Transactional
    public SellerProfileDto applyForSeller(Long userId, SellerApplyRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String planStr = request.getSubscriptionPlan() != null ? request.getSubscriptionPlan() : "PLAN_1";
        SellerProfile.SubscriptionPlan targetPlan = SellerProfile.SubscriptionPlan.PLAN_1;
        try {
            targetPlan = SellerProfile.SubscriptionPlan.valueOf(planStr.toUpperCase());
        } catch (Exception e) {
            targetPlan = SellerProfile.SubscriptionPlan.PLAN_1;
        }

        boolean isPaidPlan = (targetPlan == SellerProfile.SubscriptionPlan.PLAN_2 || targetPlan == SellerProfile.SubscriptionPlan.PLAN_3);
        boolean hasPaymentId = request.getPaymentId() != null && !request.getPaymentId().isBlank() && !"FREE_FIRST_MONTH".equalsIgnoreCase(request.getPaymentId()) && !"FREE_7_DAYS_TRIAL".equalsIgnoreCase(request.getPaymentId());

        boolean isFreeTrialAttempt = (targetPlan == SellerProfile.SubscriptionPlan.PLAN_1 && !hasPaymentId);
        if (isFreeTrialAttempt) {
            boolean alreadyUsed = Boolean.TRUE.equals(user.getHasUsedFreeTrial()) ||
                    (sellerProfileRepository.existsByUserId(userId) && Boolean.TRUE.equals(sellerProfileRepository.findByUserId(userId).get().getHasUsedFreeTrial()));
            if (alreadyUsed) {
                throw new BadRequestException("អ្នកបានប្រើប្រាស់ការសាកល្បងឥតគិតថ្លៃ ៧ ថ្ងៃរួចហើយ! (1-time 7-day free trial already used). សូមធ្វើការទូទាត់ $2.50/ខែ តាមរយៈ KHQR ដើម្បីដំណើរការហាង។");
            }
            user.setHasUsedFreeTrial(true);
            userRepository.save(user);
        }

        SubscriptionStatus initialStatus = (isPaidPlan && hasPaymentId) ? SubscriptionStatus.PENDING : SubscriptionStatus.ACTIVE;

        if (sellerProfileRepository.existsByUserId(userId)) {
            SellerProfile existing = sellerProfileRepository.findByUserId(userId).get();
            if (request.getStoreName() != null && !request.getStoreName().isBlank()) {
                String newName = normalizeStoreName(request.getStoreName());
                // Block duplicate store name from another seller
                if (!newName.equalsIgnoreCase(existing.getStoreName()) &&
                        sellerProfileRepository.existsByStoreNameIgnoreCaseAndNotUserId(newName, userId)) {
                    throw new BadRequestException(
                        "ឈ្មោះហាង \"" + newName + "\" ត្រូវបានប្រើប្រាស់ដោយអ្នកលក់ម្នាក់ទៀតហើយ! " +
                        "សូមជ្រើសរើសឈ្មោះហាងដែលខុសគ្នា។ " +
                        "(Store name \"" + newName + "\" is already taken by another seller. Please choose a different store name.)");
                }
                existing.setStoreName(newName);
            }
            if (request.getStoreDescription() != null) {
                existing.setStoreDescription(request.getStoreDescription());
            }
            if (request.getTelegramUsername() != null) {
                existing.setTelegramUsername(request.getTelegramUsername().trim().replace("@", ""));
            }
            if (request.getTelegramChannel() != null) {
                existing.setTelegramChannel(request.getTelegramChannel().trim());
            }
            if (request.getPreferredContactMethod() != null) {
                existing.setPreferredContactMethod(request.getPreferredContactMethod().trim());
            }
            if (hasPaymentId) {
                existing.setPaymentId(request.getPaymentId());
            }
            if (isFreeTrialAttempt) {
                existing.setHasUsedFreeTrial(true);
            }
            existing.setSubscriptionPlan(targetPlan);
            existing.setSubscriptionStatus(initialStatus);
            int trialOrPlanDays = (targetPlan == SellerProfile.SubscriptionPlan.PLAN_1 && !hasPaymentId) ? 7 : 30;
            if (initialStatus == SubscriptionStatus.ACTIVE) {
                existing.setSubscriptionExpiresAt(LocalDateTime.now().plusDays(trialOrPlanDays));
                user.setRole(Role.SELLER);
                userRepository.save(user);
            }
            return mapToDto(sellerProfileRepository.save(existing));
        }

        // FIRST TIME SELLER — check for duplicate store name
        String requestedStoreName = normalizeStoreName(request.getStoreName());
        if (!requestedStoreName.isEmpty() && sellerProfileRepository.existsByStoreNameIgnoreCaseAndNotUserId(requestedStoreName, userId)) {
            throw new BadRequestException(
                "ឈ្មោះហាង \"" + requestedStoreName + "\" ត្រូវបានប្រើប្រាស់ដោយអ្នកលក់ម្នាក់ទៀតហើយ! " +
                "សូមជ្រើសរើសឈ្មោះហាងដែលខុសគ្នា។ " +
                "(Store name \"" + requestedStoreName + "\" is already taken by another seller. Please choose a different store name.)");
        }

        int trialDays = (targetPlan == SellerProfile.SubscriptionPlan.PLAN_1 && !hasPaymentId) ? 7 : 30;
        SellerProfile profile = SellerProfile.builder()
                .user(user)
                .storeName(requestedStoreName.isEmpty() ? request.getStoreName() : requestedStoreName)
                .storeDescription(request.getStoreDescription())
                .telegramUsername(request.getTelegramUsername() != null ? request.getTelegramUsername().trim().replace("@", "") : null)
                .telegramChannel(request.getTelegramChannel() != null ? request.getTelegramChannel().trim() : null)
                .preferredContactMethod(request.getPreferredContactMethod() != null ? request.getPreferredContactMethod().trim() : "ALL")
                .paymentId(hasPaymentId ? request.getPaymentId() : "FREE_7_DAYS_TRIAL")
                .hasUsedFreeTrial(isFreeTrialAttempt)
                .subscriptionPlan(targetPlan)
                .subscriptionStatus(initialStatus)
                .subscriptionExpiresAt(initialStatus == SubscriptionStatus.ACTIVE ? LocalDateTime.now().plusDays(trialDays) : null)
                .createdAt(LocalDateTime.now())
                .build();

        profile = sellerProfileRepository.save(profile);

        if (initialStatus == SubscriptionStatus.ACTIVE) {
            user.setRole(Role.SELLER);
            userRepository.save(user);
            log.info("Free Seller account activated for user [{}] ({})", userId, user.getEmail());
        } else {
            log.info("Pending Seller account created for user [{}] ({}), waiting for KHQR MD5 payment: {}", userId, user.getEmail(), profile.getPaymentId());
        }

        return mapToDto(profile);
    }

    @Transactional
    public void deleteSellerStoreByAdmin(Long sellerId) {
        SellerProfile profile = sellerProfileRepository.findByUserId(sellerId)
                .orElseGet(() -> sellerProfileRepository.findById(sellerId)
                        .orElseThrow(() -> new ResourceNotFoundException("Seller profile not found for ID: " + sellerId)));

        User user = profile.getUser();

        // 1. Unlist / Deactivate all products belonging to this seller
        List<Product> products = productRepository.findBySellerId(user.getId());
        if (products != null && !products.isEmpty()) {
            for (Product p : products) {
                p.setActive(false);
            }
            productRepository.saveAll(products);
            log.info("Unlisted/deactivated {} products for seller user [{}]", products.size(), user.getId());
        }

        // 2. Delete seller profile
        sellerProfileRepository.delete(profile);

        // 3. Downgrade user role back to CUSTOMER
        user.setRole(Role.CUSTOMER);
        userRepository.save(user);

        log.info("Admin deleted seller store [{}] and demoted user [{}] to CUSTOMER", profile.getStoreName(), user.getId());

        try {
            activityLogService.logSellerActivity(user, "DELETE_SELLER_STORE", "Deleted seller store: " + profile.getStoreName(), null);
        } catch (Exception e) {
            log.warn("Activity log error: {}", e.getMessage());
        }
    }

 /**
 * Step 2: Verify the $2.50 KHQR subscription payment via Bakong.
 * On success: sets profile ACTIVE, upgrades user role to SELLER.
 */
 @Transactional
 public SellerProfileDto verifySubscription(Long userId) {
 User user = userRepository.findById(userId)
 .orElseThrow(() -> new ResourceNotFoundException("User not found"));

 SellerProfile profile = sellerProfileRepository.findByUserId(userId)
 .orElseThrow(() -> new ResourceNotFoundException("No pending seller application found."));

 if (profile.getSubscriptionStatus() == SubscriptionStatus.ACTIVE) {
 return mapToDto(profile);
 }

        boolean paid = paymentService.checkAbaPayWayTransaction(profile.getPaymentId())
                || paymentService.checkTransactionByMd5(profile.getPaymentId());
        if (!paid) {
            return mapToDto(profile);
        }

        profile.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
        profile.setSubscriptionExpiresAt(LocalDateTime.now().plusDays(30));
        sellerProfileRepository.save(profile);

        // Upgrade user role
        user.setRole(Role.SELLER);
        userRepository.save(user);

        log.info("Seller account activated for user [{}] ({})", userId, user.getEmail());

        try {
            telegramNotificationService.sendAdminMessage(
                    String.format("<b>New Seller Activated</b>\nName: %s\nEmail: %s\nStore: %s",
                            user.getName(), user.getEmail(), profile.getStoreName())
            );
        } catch (Exception e) {
            log.warn("Failed to send Telegram notification for new seller: {}", e.getMessage());
        }

        return mapToDto(profile);
    }

    /**
     * Renew/extend seller store subscription by 30 days.
     */
    @Transactional
    public SellerProfileDto renewSubscription(Long userId, String transactionMd5, String planKey) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        SellerProfile profile = sellerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller profile not found"));

        if (transactionMd5 != null && !transactionMd5.trim().isEmpty()) {
            boolean paid = paymentService.checkAbaPayWayTransaction(transactionMd5.trim())
                    || paymentService.checkTransactionByMd5(transactionMd5.trim());
            if (!paid) {
                log.warn("Payment check unconfirmed for transaction ID/MD5: {}", transactionMd5);
                throw new BadRequestException("Payment unconfirmed yet. Please scan KHQR and complete payment transfer.");
            }
        } else {
            throw new BadRequestException("Transaction ID or MD5 hash is required to verify renewal payment.");
        }

    // Detect if this is an UPGRADE (plan change) or a RENEW (same plan)
    SellerProfile.SubscriptionPlan currentPlan = profile.getSubscriptionPlan();
    boolean isUpgrade = planKey != null && !planKey.trim().isEmpty()
        && currentPlan != null
        && !currentPlan.name().equals(planKey.trim());

    if (planKey != null && !planKey.trim().isEmpty()) {
      try {
        profile.setSubscriptionPlan(SellerProfile.SubscriptionPlan.valueOf(planKey.trim()));
      } catch (Exception e) {
        log.warn("Invalid plan key passed: {}", planKey);
      }
    }

    LocalDateTime currentExpiry = profile.getSubscriptionExpiresAt();
    LocalDateTime baseDate;
    if (isUpgrade) {
      // UPGRADE: remaining days are lost, new plan starts fresh from now
      baseDate = LocalDateTime.now();
      log.info("Plan UPGRADE detected for user [{}]: {} -> {}. Remaining days reset, starting fresh.", userId, currentPlan, planKey);
    } else {
      // RENEW (same plan): carry over any remaining days
      baseDate = (currentExpiry != null && currentExpiry.isAfter(LocalDateTime.now()))
          ? currentExpiry
          : LocalDateTime.now();
      log.info("Plan RENEW detected for user [{}]: same plan {}. Carrying over remaining days.", userId, planKey);
    }

    profile.setSubscriptionExpiresAt(baseDate.plusDays(30));
    profile.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
    sellerProfileRepository.save(profile);

 // Ensure user role is SELLER
 user.setRole(Role.SELLER);
 userRepository.save(user);

 log.info("Seller store subscription renewed for 30 days for user [{}] ({})", userId, user.getEmail());

 try {
 telegramNotificationService.sendAdminMessage(
 String.format(" <b>Seller Store Subscription Renewed (+30 Days)</b>\nName: %s\nEmail: %s\nStore: %s\nNew Expiry Date: %s",
 user.getName(), user.getEmail(), profile.getStoreName(), profile.getSubscriptionExpiresAt())
 );
 } catch (Exception e) {
 log.warn("Failed to send Telegram notification: {}", e.getMessage());
 }

 return mapToDto(profile);
 }

 // ── Profile ───────────────────────────────────────────────────────────────

 @Transactional
 public SellerProfileDto getProfile(Long userId) {
 SellerProfile profile = sellerProfileRepository.findByUserId(userId)
 .orElseThrow(() -> new ResourceNotFoundException("Seller profile not found"));

 if (profile.getSubscriptionExpiresAt() != null && profile.getSubscriptionExpiresAt().isBefore(LocalDateTime.now())) {
 if (profile.getSubscriptionStatus() == SubscriptionStatus.ACTIVE) {
 profile.setSubscriptionStatus(SubscriptionStatus.EXPIRED);
 profile = sellerProfileRepository.save(profile);
 }
 }
 return mapToDto(profile);
 }

 @Transactional(readOnly = true)
 public List<SellerProfileDto> getAllSellers() {
 return sellerProfileRepository.findAll()
 .stream()
 .map(this::mapToDto)
 .collect(Collectors.toList());
 }

 @Transactional
 public SellerProfileDto updateSellerStatusByAdmin(Long sellerId, String statusStr) {
 SellerProfile profile = sellerProfileRepository.findByUserId(sellerId)
 .orElseThrow(() -> new ResourceNotFoundException("Seller profile not found for user ID: " + sellerId));

 SubscriptionStatus newStatus = SubscriptionStatus.valueOf(statusStr.toUpperCase());
 profile.setSubscriptionStatus(newStatus);

 if (newStatus == SubscriptionStatus.ACTIVE) {
 if (profile.getSubscriptionExpiresAt() == null || profile.getSubscriptionExpiresAt().isBefore(LocalDateTime.now())) {
 profile.setSubscriptionExpiresAt(LocalDateTime.now().plusDays(30));
 }
 }
 log.info("Admin updated seller [{}] store status to {}", sellerId, newStatus);
 return mapToDto(sellerProfileRepository.save(profile));
 }

 @Transactional
 public SellerProfileDto updateSellerExpirationByAdmin(Long sellerId, LocalDateTime newExpiry) {
 SellerProfile profile = sellerProfileRepository.findByUserId(sellerId)
 .orElseThrow(() -> new ResourceNotFoundException("Seller profile not found for user ID: " + sellerId));

 profile.setSubscriptionExpiresAt(newExpiry);
 if (newExpiry != null && newExpiry.isAfter(LocalDateTime.now())) {
 profile.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
 } else {
 profile.setSubscriptionStatus(SubscriptionStatus.EXPIRED);
 }
 log.info("Admin updated seller [{}] store expiration date to {}", sellerId, newExpiry);
 return mapToDto(sellerProfileRepository.save(profile));
 }

 @Transactional
 public SellerProfileDto updateSellerBalanceByAdmin(Long sellerUserId, Double amount, String mode, String reason) {
 User seller = userRepository.findById(sellerUserId)
 .orElseThrow(() -> new ResourceNotFoundException("Seller user not found for ID: " + sellerUserId));

 double currentBalance = seller.getSellerBalance() != null ? seller.getSellerBalance() : 0.0;
 double targetAmount = amount != null ? amount : 0.0;
 double newBalance = currentBalance;

 String action = mode != null ? mode.toUpperCase() : "ADD";
 if ("DEDUCT".equals(action) || "SUBTRACT".equals(action) || "MINUS".equals(action)) {
 newBalance = Math.max(0.0, currentBalance - targetAmount);
 } else if ("SET".equals(action) || "EQUALS".equals(action)) {
 newBalance = Math.max(0.0, targetAmount);
 } else {
 // Default "ADD" / "PLUS"
 newBalance = currentBalance + targetAmount;
 }

 newBalance = Math.round(newBalance * 100.0) / 100.0;
 seller.setSellerBalance(newBalance);
 userRepository.save(seller);

 log.info("Admin adjusted seller [{}] balance (mode={}, amount={}, reason={}). Previous: ${}, New: ${}",
 sellerUserId, action, targetAmount, reason, currentBalance, newBalance);

 SellerProfile profile = sellerProfileRepository.findByUserId(sellerUserId)
 .orElseGet(() -> {
 SellerProfile sp = new SellerProfile();
 sp.setUser(seller);
 sp.setStoreName(seller.getName() + "'s Store");
 return sellerProfileRepository.save(sp);
 });

 return mapToDto(profile);
 }

 @Transactional
 public SellerProfileDto getPublicProfile(Long sellerId) {
 SellerProfile profile = sellerProfileRepository.findByUserId(sellerId)
 .orElseGet(() -> sellerProfileRepository.findById(sellerId)
 .orElseThrow(() -> new ResourceNotFoundException("Seller not found")));

 if (profile.getSubscriptionExpiresAt() != null && profile.getSubscriptionExpiresAt().isBefore(LocalDateTime.now())) {
 if (profile.getSubscriptionStatus() == SubscriptionStatus.ACTIVE) {
 profile.setSubscriptionStatus(SubscriptionStatus.EXPIRED);
 profile = sellerProfileRepository.save(profile);
 }
 }

 if (profile.getSubscriptionStatus() != SubscriptionStatus.ACTIVE) {
 throw new ResourceNotFoundException("Seller store is not active or has expired");
 }
 return mapToDto(profile);
 }

    @Transactional
    public SellerProfileDto updateProfile(Long userId, UpdateSellerProfileRequest request) {
        SellerProfile profile = sellerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller profile not found"));

        if (request.getStoreName() != null && !request.getStoreName().isBlank()) {
            String newName = normalizeStoreName(request.getStoreName());
            if (!newName.equalsIgnoreCase(profile.getStoreName())) {
                // Block duplicate store name from another seller
                if (sellerProfileRepository.existsByStoreNameIgnoreCaseAndNotUserId(newName, userId)) {
                    throw new BadRequestException(
                        "ឈ្មោះហាង \"" + newName + "\" ត្រូវបានប្រើប្រាស់ដោយអ្នកលក់ម្នាក់ទៀតហើយ! " +
                        "សូមជ្រើសរើសឈ្មោះហាងដែលខុសគ្នា។ " +
                        "(Store name \"" + newName + "\" is already taken by another seller. Please choose a different store name.)");
                }

                // Allow cooldown bypass IF the seller is under an active duplicate warning
                boolean isDuplicateWarningActive = Boolean.TRUE.equals(profile.getDuplicateWarning());
                if (!isDuplicateWarningActive && profile.getLastStoreNameChangedAt() != null &&
                        profile.getLastStoreNameChangedAt().isAfter(LocalDateTime.now().minusDays(30))) {
                    long daysRemaining = 30 - java.time.Duration.between(profile.getLastStoreNameChangedAt(), LocalDateTime.now()).toDays();
                    if (daysRemaining < 1) daysRemaining = 1;
                    throw new BadRequestException("អ្នកអាចផ្លាស់ប្តូរឈ្មោះហាងបានតែម្តងគត់ក្នុងរយៈពេល 1 ខែ (30 ថ្ងៃ)! សូមរង់ចាំ " + daysRemaining + " ថ្ងៃទៀតជាមុនសិន។ (Store name can only be changed once per 30 days! Please wait " + daysRemaining + " more days.)");
                }

                String oldName = profile.getStoreName();
                profile.setStoreName(newName);
                profile.setLastStoreNameChangedAt(LocalDateTime.now());

                if (isDuplicateWarningActive) {
                    profile.setDuplicateWarning(false);
                    profile.setDuplicateWarningAt(null);
                    profile.setNameChangeDeadline(null);
                    if (profile.getUser() != null) {
                        activityLogService.logSellerActivity(profile.getUser(), "DUPLICATE_STORE_RESOLVED",
                            "Seller resolved duplicate store name by changing \"" + oldName + "\" to \"" + newName + "\"", null);
                    }
                } else {
                    if (profile.getUser() != null) {
                        activityLogService.logSellerActivity(profile.getUser(), "STORE_NAME_CHANGED",
                            "Seller changed store name from \"" + oldName + "\" to \"" + newName + "\"", null);
                    }
                }
            }
        }
 if (request.getStoreDescription() != null) {
 profile.setStoreDescription(request.getStoreDescription());
 }
 if (request.getStoreLogoUrl() != null) {
 profile.setStoreLogoUrl(request.getStoreLogoUrl());
 }
 if (request.getTelegramUsername() != null) {
 profile.setTelegramUsername(request.getTelegramUsername().trim().replace("@", ""));
 }
 if (request.getTelegramChannel() != null) {
 profile.setTelegramChannel(request.getTelegramChannel().trim());
 }
 if (request.getPreferredContactMethod() != null) {
 profile.setPreferredContactMethod(request.getPreferredContactMethod().trim());
 }
 return mapToDto(sellerProfileRepository.save(profile));
 }

 // ── Products ──────────────────────────────────────────────────────────────

 @Transactional
 @CacheEvict(value = {"products", "product"}, allEntries = true)
 public ProductResponse createSellerProduct(Long sellerId, SellerProductRequest request) {
 User seller = userRepository.findById(sellerId)
 .orElseThrow(() -> new ResourceNotFoundException("User not found"));

 SellerProfile profile = sellerProfileRepository.findByUserId(sellerId)
 .orElseThrow(() -> new BadRequestException("No seller profile"));
 if (profile.getSubscriptionStatus() != SubscriptionStatus.ACTIVE) {
 throw new BadRequestException("Seller subscription is not active.");
 }

 String reqName = request.getName() != null ? request.getName().trim() : "";
 String reqDuration = request.getDuration() != null ? request.getDuration().trim() : "1 Month";

 if (request.getImageUrl() == null || request.getImageUrl().trim().isEmpty()) {
 throw new BadRequestException("Product picture / image is required.");
 }

 List<Product> existingProducts = productRepository.findBySellerId(sellerId);
 boolean isDuplicate = existingProducts.stream()
 .filter(Product::isActive)
 .anyMatch(p -> p.getName() != null && p.getName().trim().equalsIgnoreCase(reqName) &&
                p.getDuration() != null && p.getDuration().trim().equalsIgnoreCase(reqDuration));

 if (isDuplicate) {
 throw new BadRequestException("Product '" + reqName + "' (" + reqDuration + ") already exists in your store! You can add other duration variants (e.g. 3 Months, 6 Months, 1 Year) or edit your existing item.");
 }

 Category category = null;
 if (request.getCategoryId() != null) {
 category = categoryRepository.findById(request.getCategoryId()).orElse(null);
 }

 double fee = calculatePlatformFee(request.getBasePrice());
 double finalPrice = Math.round((request.getBasePrice() + fee) * 100.0) / 100.0;

 Integer discountPct = request.getDiscountPercent();
 if (discountPct == null && request.getOriginalPrice() != null && request.getOriginalPrice() > finalPrice) {
   discountPct = (int) Math.round((request.getOriginalPrice() - finalPrice) * 100.0 / request.getOriginalPrice());
 }

 Product product = Product.builder()
 .name(request.getName())
 .description(request.getDescription())
 .basePrice(request.getBasePrice())
 .price(finalPrice)
 .originalPrice(request.getOriginalPrice())
 .discountPercent(discountPct)
 .imageUrl(request.getImageUrl())
 .productType(request.getProductType())
 .duration(request.getDuration())
 .productLabel(request.getProductLabel())
 .category(category)
 .seller(seller)
 .active(true)
 .createdAt(LocalDateTime.now())
 .build();

 return mapProductToResponse(productRepository.save(product));
 }

 @Transactional
 @CacheEvict(value = {"products", "product"}, allEntries = true)
 public ProductResponse updateSellerProduct(Long sellerId, Long productId, SellerProductRequest request) {
 Product product = productRepository.findById(productId)
 .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

 if (product.getSeller() == null || !product.getSeller().getId().equals(sellerId)) {
 throw new BadRequestException("You do not own this product.");
 }

 if (request.getName() != null) product.setName(request.getName());
 if (request.getDescription() != null) product.setDescription(request.getDescription());
 if (request.getImageUrl() != null) product.setImageUrl(request.getImageUrl());
 if (request.getProductType() != null) product.setProductType(request.getProductType());
 if (request.getDuration() != null) product.setDuration(request.getDuration());
 if (request.getProductLabel() != null) product.setProductLabel(request.getProductLabel());
 if (request.getCategoryId() != null) {
   categoryRepository.findById(request.getCategoryId()).ifPresent(product::setCategory);
 }
   if (request.getBasePrice() != null) {
     double updatedFee = calculatePlatformFee(request.getBasePrice());
     double finalPrice = Math.round((request.getBasePrice() + updatedFee) * 100.0) / 100.0;
     product.setBasePrice(request.getBasePrice());
     product.setPrice(finalPrice);
   }
   if (request.getOriginalPrice() != null) {
     product.setOriginalPrice(request.getOriginalPrice());
   }
   Integer discountPct = request.getDiscountPercent();
   if (discountPct == null && product.getOriginalPrice() != null && product.getPrice() != null && product.getOriginalPrice() > product.getPrice()) {
     discountPct = (int) Math.round((product.getOriginalPrice() - product.getPrice()) * 100.0 / product.getOriginalPrice());
   }
   product.setDiscountPercent(discountPct);

  return mapProductToResponse(productRepository.save(product));
 }

 @Transactional
 @CacheEvict(value = {"products", "product"}, allEntries = true)
 public void deleteSellerProduct(Long sellerId, Long productId) {
 Product product = productRepository.findById(productId)
 .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
 if (product.getSeller() == null || !product.getSeller().getId().equals(sellerId)) {
 throw new BadRequestException("You do not own this product.");
 }

 product.setActive(false);
 productRepository.save(product);

 List<com.sabyshop.model.ProductStock> unsoldStock = productStockRepository.findByProductIdAndSoldFalse(productId);
 if (!unsoldStock.isEmpty()) {
 productStockRepository.deleteAll(unsoldStock);
 }
 }

  @Transactional
  public List<ProductResponse> getSellerProducts(Long sellerId) {
      SellerProfile profile = sellerProfileRepository.findByUserId(sellerId)
              .orElseGet(() -> sellerProfileRepository.findById(sellerId).orElse(null));
      Long targetUserId = (profile != null && profile.getUser() != null) ? profile.getUser().getId() : sellerId;

      if (profile != null) {
          if (profile.getSubscriptionExpiresAt() != null && profile.getSubscriptionExpiresAt().isBefore(LocalDateTime.now())) {
              if (profile.getSubscriptionStatus() == SubscriptionStatus.ACTIVE) {
                  profile.setSubscriptionStatus(SubscriptionStatus.EXPIRED);
                  sellerProfileRepository.save(profile);
              }
          }
          if (profile.getSubscriptionStatus() == SubscriptionStatus.EXPIRED) {
              log.info("Seller [{}] store subscription is EXPIRED - returning empty product list", sellerId);
              return List.of();
          }
      }

      return productRepository.findBySellerIdAndActiveTrue(targetUserId)
              .stream().map(this::mapProductToResponse).collect(Collectors.toList());
  }

 @Transactional
 @CacheEvict(value = {"products", "product"}, allEntries = true)
 public void addStockToSellerProduct(Long sellerId, Long productId, StockBulkRequest request) {
 Product product = productRepository.findById(productId)
 .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
 if (product.getSeller() == null || !product.getSeller().getId().equals(sellerId)) {
 throw new BadRequestException("You do not own this product.");
 }

 if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
 throw new BadRequestException("No stock items provided");
 }

 // Resolve seller User entity for uploadedBy tracking
 com.sabyshop.model.User sellerUser = userRepository.findById(sellerId)
 .orElseThrow(() -> new ResourceNotFoundException("Seller not found"));

 List<com.sabyshop.model.ProductStock> stocks = request.getItems().stream()
 .filter(req -> {
     if (req == null) return false;
     String pType = product.getProductType() != null ? product.getProductType().toUpperCase() : "";
     boolean isKeyType = pType.contains("KEY") || pType.contains("INVITE_LINK") || pType.contains("JOIN_MINECRAFT");
     if (isKeyType) {
         return (req.getLicenseKey() != null && !req.getLicenseKey().isBlank())
             || (req.getInviteLink() != null && !req.getInviteLink().isBlank());
     }
     return req.getAccountEmail() != null && !req.getAccountEmail().isBlank();
 })
 .map(req -> com.sabyshop.model.ProductStock.builder()
 .product(product)
 .accountEmail(req.getAccountEmail() != null ? req.getAccountEmail().trim() : null)
 .accountPassword(req.getAccountPassword() != null ? req.getAccountPassword().trim() : null)
 .licenseKey(req.getLicenseKey() != null ? req.getLicenseKey().trim() : null)
 .inviteLink(req.getInviteLink() != null ? req.getInviteLink().trim() : null)
 .userNote(req.getNote() != null ? req.getNote().trim() : (req.getUserNote() != null ? req.getUserNote().trim() : null))
 .uploadedBy(sellerUser)
 .sold(false)
 .build())
 .collect(Collectors.toList());

 if (stocks.isEmpty()) {
 throw new BadRequestException("No valid stock items found in request.");
 }

 productStockRepository.saveAll(stocks);

 // Update cached stockCount on the product
 long currentStock = productStockRepository.countByProductIdAndSoldFalse(productId);
 product.setStockCount((int) currentStock);
 productRepository.save(product);
 // Auto-fulfill any WAITING_FOR_STOCK orders for this product (safely wrapped)
 try {
 List<Order> waitingOrders = orderRepository.findAll().stream()
 .filter(o -> o != null && o.getStatus() == com.sabyshop.model.OrderStatus.WAITING_FOR_STOCK)
 .collect(Collectors.toList());

 for (Order waitingOrder : waitingOrders) {
 if (waitingOrder.getItems() == null) continue;
 boolean fulfilledAll = true;
 for (com.sabyshop.model.OrderItem item : waitingOrder.getItems()) {
 if (item != null && item.getProduct() != null && item.getProduct().getId().equals(productId) && item.getStockItem() == null) {
 List<com.sabyshop.model.ProductStock> available = productStockRepository.findByProductIdAndSoldFalse(productId);
 if (!available.isEmpty()) {
 com.sabyshop.model.ProductStock s = available.get(0);
 s.setSold(true);
 s.setSoldAt(LocalDateTime.now());
 s.setOrder(waitingOrder);
 productStockRepository.save(s);
 item.setStockItem(s);
 } else {
 fulfilledAll = false;
 }
 }
 }
 if (fulfilledAll) {
 waitingOrder.setStatus(com.sabyshop.model.OrderStatus.COMPLETED);
 waitingOrder.setSellerCredited(true);
 orderRepository.save(waitingOrder);
 creditSellerBalance(sellerId, product.getBasePrice() != null ? product.getBasePrice() : product.getPrice());
 log.info("Auto-fulfilled Order #{} after new stock import by seller [{}]", waitingOrder.getId(), sellerId);
 }
 }
 } catch (Exception e) {
  log.warn("Auto-fulfill error during stock add for product [{}]: {}", productId, e.getMessage());
  }
  }

 @Transactional(readOnly = true)
 public List<com.sabyshop.model.ProductStock> getSellerProductStock(Long sellerId, Long productId) {
 Product product = productRepository.findById(productId)
 .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
 if (product.getSeller() == null || !product.getSeller().getId().equals(sellerId)) {
 throw new BadRequestException("You do not own this product.");
 }
 return productStockRepository.findByProductId(productId);
 }

 @Transactional(readOnly = true)
 public List<OrderResponse> getSellerOrders(Long sellerId) {
 List<Order> allOrders = orderRepository.findAll();
 List<OrderResponse> sellerOrders = new ArrayList<>();
 for (Order o : allOrders) {
 boolean hasSellerItem = o.getItems() != null && o.getItems().stream().anyMatch(item ->
 item.getProduct() != null && item.getProduct().getSeller() != null && sellerId.equals(item.getProduct().getSeller().getId())
 );
 if (hasSellerItem) {
 sellerOrders.add(orderService.mapToResponse(o));
 }
 }
 return sellerOrders;
 }

 @Transactional
 public OrderResponse updateSellerOrderStatus(Long sellerId, Long orderId, OrderStatus newStatus) {
 Order order = orderRepository.findById(orderId)
 .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

 boolean hasSellerItem = order.getItems() != null && order.getItems().stream().anyMatch(item ->
 item.getProduct() != null && item.getProduct().getSeller() != null && sellerId.equals(item.getProduct().getSeller().getId())
 );
 if (!hasSellerItem) {
 throw new BadRequestException("You do not own this order.");
 }

 return orderService.updateOrderStatus(orderId, newStatus);
 }

 // ── Balance & Withdrawals ─────────────────────────────────────────────────

 /**
 * Called by OrderService when a payment is confirmed — credits seller's earnings.
 * Amount credited = item base price (what seller set), NOT the final buyer price.
 */
 @Transactional
 public void creditSellerBalance(Long sellerId, Double amount) {
 User seller = userRepository.findById(sellerId)
 .orElseThrow(() -> new ResourceNotFoundException("Seller not found"));
 double current = seller.getSellerBalance() != null ? seller.getSellerBalance() : 0.0;
 seller.setSellerBalance(Math.round((current + amount) * 100.0) / 100.0);
 userRepository.save(seller);
 log.info("Credited ${} to seller [{}]. New balance: ${}", amount, sellerId, seller.getSellerBalance());
 }

 public Double getBalance(Long sellerId) {
 User seller = userRepository.findById(sellerId)
 .orElseThrow(() -> new ResourceNotFoundException("User not found"));
 return seller.getSellerBalance() != null ? seller.getSellerBalance() : 0.0;
 }

 @Transactional
 public synchronized WithdrawResponseDto requestWithdrawal(Long sellerId, WithdrawRequestDto dto) {
 User seller = userRepository.findById(sellerId)
 .orElseThrow(() -> new ResourceNotFoundException("Seller not found"));

 double balance = seller.getSellerBalance() != null ? seller.getSellerBalance() : 0.0;
 if (dto.getAmount() == null || dto.getAmount() < 5.0) {
 throw new BadRequestException("Minimum withdrawal amount is $5.00 (ចំនួនដកប្រាក់អប្បបរមាគឺ $5.00).");
 }
 if (dto.getAmount() > balance) {
 throw new BadRequestException(String.format("Insufficient balance ($%.2f available).", balance));
 }
 
 boolean hasKhqrString = dto.getKhqrString() != null && !dto.getKhqrString().isBlank();
 boolean hasKhqrImage = dto.getKhqrImageUrl() != null && !dto.getKhqrImageUrl().isBlank();
 if (!hasKhqrString && !hasKhqrImage) {
 throw new BadRequestException("Please provide your KHQR code string or upload a KHQR image picture.");
 }

 // Debit balance immediately
 seller.setSellerBalance(Math.round((balance - dto.getAmount()) * 100.0) / 100.0);
 userRepository.save(seller);

 WithdrawRequest req = WithdrawRequest.builder()
 .seller(seller)
 .amount(dto.getAmount())
 .khqrString(hasKhqrString ? dto.getKhqrString() : "QR Image Provided")
 .khqrImageUrl(dto.getKhqrImageUrl())
 .status(WithdrawStatus.PENDING)
 .requestedAt(LocalDateTime.now())
 .build();

 req = withdrawRequestRepository.save(req);

 // Notify admin
 try {
 telegramNotificationService.sendAdminMessage(
 String.format("<b>Withdrawal Request #%d</b>\nSeller: %s\nAmount: $%.2f\nKHQR: %s\nQR Image: %s",
 req.getId(), seller.getEmail(), dto.getAmount(), req.getKhqrString(), req.getKhqrImageUrl() != null ? req.getKhqrImageUrl() : "None")
 );
 } catch (Exception e) {
 log.warn("Failed to send withdrawal Telegram notification: {}", e.getMessage());
 }

 return mapWithdrawToDto(req);
 }

 @Transactional(readOnly = true)
 public List<WithdrawResponseDto> getWithdrawHistory(Long sellerId) {
 return withdrawRequestRepository.findBySellerIdOrderByRequestedAtDesc(sellerId)
 .stream().map(this::mapWithdrawToDto).collect(Collectors.toList());
 }

 // ── Admin: Seller & Withdrawal management ─────────────────────────────────



 @Transactional(readOnly = true)
 public List<WithdrawResponseDto> getAllWithdrawRequests() {
 return withdrawRequestRepository.findAllByOrderByRequestedAtDesc()
 .stream().map(this::mapWithdrawToDto).collect(Collectors.toList());
 }

 @Transactional(readOnly = true)
 public List<WithdrawResponseDto> getPendingWithdrawRequests() {
 return withdrawRequestRepository.findByStatusOrderByRequestedAtDesc(WithdrawStatus.PENDING)
 .stream().map(this::mapWithdrawToDto).collect(Collectors.toList());
 }

 @Transactional
 public WithdrawResponseDto completeWithdrawal(Long requestId, String adminNote) {
 WithdrawRequest req = withdrawRequestRepository.findById(requestId)
 .orElseThrow(() -> new ResourceNotFoundException("Withdrawal request not found"));
 if (req.getStatus() != WithdrawStatus.PENDING) {
 throw new BadRequestException("Request is already " + req.getStatus());
 }
 req.setStatus(WithdrawStatus.COMPLETED);
 req.setProcessedAt(LocalDateTime.now());
 req.setAdminNote(adminNote);
 return mapWithdrawToDto(withdrawRequestRepository.save(req));
 }

 @Transactional
 public WithdrawResponseDto rejectWithdrawal(Long requestId, String adminNote) {
 WithdrawRequest req = withdrawRequestRepository.findById(requestId)
 .orElseThrow(() -> new ResourceNotFoundException("Withdrawal request not found"));
 if (req.getStatus() != WithdrawStatus.PENDING) {
 throw new BadRequestException("Request is already " + req.getStatus());
 }
 req.setStatus(WithdrawStatus.REJECTED);
 req.setProcessedAt(LocalDateTime.now());
 req.setAdminNote(adminNote);
 withdrawRequestRepository.save(req);

 // Refund balance
 User seller = req.getSeller();
 double balance = seller.getSellerBalance() != null ? seller.getSellerBalance() : 0.0;
 seller.setSellerBalance(Math.round((balance + req.getAmount()) * 100.0) / 100.0);
 userRepository.save(seller);

 log.info("Withdrawal #{} rejected. Refunded ${} to seller [{}]", requestId, req.getAmount(), seller.getId());
 return mapWithdrawToDto(req);
 }

 // ── Mapping helpers ───────────────────────────────────────────────────────

  private SellerProfileDto mapToDto(SellerProfile p) {
    SellerProfileDto dto = new SellerProfileDto();
    dto.setId(p.getId());
    dto.setStoreName(p.getStoreName());
    dto.setStoreDescription(p.getStoreDescription());
    dto.setStoreLogoUrl(p.getStoreLogoUrl());
    dto.setSubscriptionStatus(p.getSubscriptionStatus());
    dto.setSubscriptionExpiresAt(p.getSubscriptionExpiresAt());
    dto.setSubscriptionPlan(p.getSubscriptionPlan() != null ? p.getSubscriptionPlan() : SellerProfile.SubscriptionPlan.PLAN_1);
    dto.setTelegramUsername(p.getTelegramUsername());
    dto.setTelegramChannel(p.getTelegramChannel());
    dto.setPreferredContactMethod(p.getPreferredContactMethod() != null ? p.getPreferredContactMethod() : "ALL");
    
    if (p.getSubscriptionExpiresAt() != null) {
      long daysLeft = java.time.Duration.between(LocalDateTime.now(), p.getSubscriptionExpiresAt()).toDays();
      long remaining = Math.max(0, daysLeft);
      dto.setRemainingDays(remaining);
      dto.setDiscountEligible(remaining > 0 && remaining <= 7);
    } else {
      dto.setRemainingDays(30L);
      dto.setDiscountEligible(false);
    }
    dto.setPlanFeeNote("Under $15: +$0.25 fee | $30+: +$2.00 fee");
    
    dto.setLastStoreNameChangedAt(p.getLastStoreNameChangedAt());
    dto.setDuplicateWarning(Boolean.TRUE.equals(p.getDuplicateWarning()));
    dto.setDuplicateWarningAt(p.getDuplicateWarningAt());
    dto.setNameChangeDeadline(p.getNameChangeDeadline());
    if (Boolean.TRUE.equals(p.getDuplicateWarning()) && p.getNameChangeDeadline() != null) {
      long daysLeft = java.time.Duration.between(LocalDateTime.now(), p.getNameChangeDeadline()).toDays();
      dto.setDuplicateDaysRemaining(Math.max(0, daysLeft));
    } else {
      dto.setDuplicateDaysRemaining(null);
    }
    dto.setCreatedAt(p.getCreatedAt());
    if (p.getUser() != null) {
      Long sId = p.getUser().getId();
      dto.setUserId(sId);
      dto.setBalance(p.getUser().getSellerBalance() != null ? p.getUser().getSellerBalance() : 0.0);
      dto.setEmail(p.getUser().getEmail());
      dto.setOwnerName(p.getUser().getName());
      try {
        Long productCount = productRepository.countActiveProductsBySeller(sId);
        dto.setProductCount(productCount != null ? productCount : 0L);
      } catch (Exception e) {
        dto.setProductCount(0L);
      }
      try {
        LocalDateTime twoWeeksAgo = LocalDateTime.now().minusDays(14);
        Long recentBuyers = orderRepository.countUniqueBuyersBySellerSince(sId, twoWeeksAgo);
        Long totalOrders = orderRepository.countTotalOrdersBySeller(sId);
        Long completedOrders = orderRepository.countCompletedOrdersBySeller(sId);

        dto.setRecentBuyersCount(recentBuyers != null ? recentBuyers : 0L);
        dto.setTotalOrdersCount(totalOrders != null ? totalOrders : 0L);
        dto.setCompletedOrdersCount(completedOrders != null ? completedOrders : 0L);

        if (totalOrders != null && totalOrders > 0) {
          double rate = (completedOrders != null ? completedOrders : 0L) * 100.0 / totalOrders;
          dto.setSuccessRate(Math.round(rate * 10.0) / 10.0);
        } else {
          dto.setSuccessRate(99.0);
        }
      } catch (Exception e) {
        log.warn("Could not calculate seller order stats for seller [{}]: {}", sId, e.getMessage());
        dto.setRecentBuyersCount(0L);
        dto.setTotalOrdersCount(0L);
        dto.setCompletedOrdersCount(0L);
        dto.setSuccessRate(99.0);
      }

      // Review & Rating stats
      try {
        Double avg = productReviewRepository.findAverageRatingBySellerId(sId);
        Long cnt = productReviewRepository.countBySellerId(sId);
        dto.setAverageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 5.0);
        dto.setReviewCount(cnt != null ? cnt : 0L);
      } catch (Exception e) {
        log.warn("Could not calculate seller reviews for seller [{}]: {}", sId, e.getMessage());
        dto.setAverageRating(5.0);
        dto.setReviewCount(0L);
      }
    }
    dto.setHasUsedFreeTrial(Boolean.TRUE.equals(p.getHasUsedFreeTrial()) || (p.getUser() != null && Boolean.TRUE.equals(p.getUser().getHasUsedFreeTrial())));
    String linkedChatId = p.getTelegramChatId() != null ? p.getTelegramChatId() : (p.getUser() != null ? p.getUser().getTelegramChatId() : null);
    dto.setTelegramChatId(linkedChatId);
    dto.setTelegramConnected(linkedChatId != null && !linkedChatId.isBlank());
    dto.setTelegramBotUsername("SabyShopBot");
    return dto;
  }

  @Transactional
  public void recalculateSellerReputation(Long sellerUserId) {
    if (sellerUserId == null) return;
    sellerProfileRepository.findByUserId(sellerUserId).ifPresent(profile -> {
      log.info("Recalculating seller reputation for userId: {}", sellerUserId);
      sellerProfileRepository.save(profile);
    });
  }

  // ── Duplicate Store Name Management & 7-Day Auto-Cleanup ───────────────────

  /**
   * Scans all seller stores for duplicate store names.
   * Original seller (first registered) keeps their store name.
   * Subsequent duplicate stores are flagged with duplicateWarning = true and a 7-day nameChangeDeadline.
   */
  @Transactional
  public java.util.Map<String, Object> scanAndFlagDuplicateStores() {
    List<SellerProfile> allSellers = sellerProfileRepository.findAllOrderedByCreation();
    java.util.Map<String, List<SellerProfile>> grouped = new java.util.LinkedHashMap<>();
    for (SellerProfile sp : allSellers) {
      if (sp.getStoreName() == null || sp.getStoreName().isBlank()) continue;
      String key = normalizeStoreName(sp.getStoreName()).toLowerCase();
      grouped.computeIfAbsent(key, k -> new ArrayList<>()).add(sp);
    }

    int flaggedCount = 0;
    int duplicateGroups = 0;

    for (java.util.Map.Entry<String, List<SellerProfile>> entry : grouped.entrySet()) {
      List<SellerProfile> list = entry.getValue();
      if (list.size() > 1) {
        duplicateGroups++;
        // First registered seller is original owner
        SellerProfile original = list.get(0);
        if (Boolean.TRUE.equals(original.getDuplicateWarning())) {
          original.setDuplicateWarning(false);
          original.setDuplicateWarningAt(null);
          original.setNameChangeDeadline(null);
          sellerProfileRepository.save(original);
        }

        // All subsequent sellers are duplicates requiring 7-day action
        for (int i = 1; i < list.size(); i++) {
          SellerProfile dup = list.get(i);
          if (!Boolean.TRUE.equals(dup.getDuplicateWarning())) {
            dup.setDuplicateWarning(true);
            dup.setDuplicateWarningAt(LocalDateTime.now());
            dup.setNameChangeDeadline(LocalDateTime.now().plusDays(7));
            sellerProfileRepository.save(dup);
            flaggedCount++;

            if (dup.getUser() != null) {
              activityLogService.logSellerActivity(dup.getUser(), "DUPLICATE_STORE_WARNING",
                  "Store name \"" + dup.getStoreName() + "\" duplicates original store #" + original.getId() + " (" + original.getStoreName() + "). 7-day grace period issued to change name.", null);
            }

            try {
              telegramNotificationService.sendAdminMessage(
                  String.format("<b>Duplicate Store Flagged (7-Day Rule)</b>\nDuplicate Store: %s (Seller ID: %d)\nOriginal Store: %s (Seller ID: %d)\nDeadline: %s",
                      dup.getStoreName(), dup.getUser() != null ? dup.getUser().getId() : dup.getId(),
                      original.getStoreName(), original.getUser() != null ? original.getUser().getId() : original.getId(),
                      dup.getNameChangeDeadline())
              );
            } catch (Exception e) {
              log.warn("Telegram alert error: {}", e.getMessage());
            }
          }
        }
      }
    }

    java.util.Map<String, Object> res = new java.util.LinkedHashMap<>();
    res.put("groupsChecked", grouped.size());
    res.put("flaggedNewDuplicates", flaggedCount);
    res.put("totalDuplicateGroups", duplicateGroups);
    log.info("Duplicate store scan complete: {} duplicate groups found, {} newly flagged with 7-day warning.", duplicateGroups, flaggedCount);
    return res;
  }

  /**
   * Background task to automatically delete duplicate stores that have passed the 7-day deadline without changing their name.
   */
  @Transactional
  public int autoCleanupExpiredDuplicateStores() {
    List<SellerProfile> flagged = sellerProfileRepository.findByDuplicateWarningTrue();
    int deletedCount = 0;
    LocalDateTime now = LocalDateTime.now();

    for (SellerProfile dup : flagged) {
      if (dup.getNameChangeDeadline() != null && dup.getNameChangeDeadline().isBefore(now)) {
        String norm = normalizeStoreName(dup.getStoreName());
        Long uId = dup.getUser() != null ? dup.getUser().getId() : null;
        boolean stillDuplicate = (uId != null) && sellerProfileRepository.existsByStoreNameIgnoreCaseAndNotUserId(norm, uId);

        if (stillDuplicate) {
          log.warn("Auto-deleting duplicate store [{}] (userId={}) as 7-day grace period expired.", dup.getStoreName(), uId);
          String storeName = dup.getStoreName();
          try {
            if (dup.getUser() != null) {
              activityLogService.logSellerActivity(dup.getUser(), "DUPLICATE_STORE_AUTO_DELETED",
                  "Store \"" + storeName + "\" auto-deleted because 7-day duplicate store name change deadline expired without modification.", null);
            }

            deleteSellerStoreByAdmin(uId != null ? uId : dup.getId());
            deletedCount++;

            try {
              telegramNotificationService.sendAdminMessage(
                  String.format("<b>Duplicate Store Auto-Deleted</b>\nStore: %s\nSeller ID: %d\nReason: 7-day name change deadline expired without name modification.",
                      storeName, uId)
              );
            } catch (Exception te) {
              log.warn("Telegram notify error: {}", te.getMessage());
            }
          } catch (Exception e) {
            log.error("Failed to auto-delete duplicate store [{}]: {}", storeName, e.getMessage(), e);
          }
        } else {
          // No longer duplicate (e.g. name was changed)
          dup.setDuplicateWarning(false);
          dup.setDuplicateWarningAt(null);
          dup.setNameChangeDeadline(null);
          sellerProfileRepository.save(dup);
        }
      }
    }
    return deletedCount;
  }

  /**
   * Manually flag a seller store as a duplicate with a 7-day deadline from admin panel.
   */
  @Transactional
  public SellerProfileDto flagDuplicateStoreManually(Long sellerId) {
    SellerProfile profile = sellerProfileRepository.findByUserId(sellerId)
        .orElseGet(() -> sellerProfileRepository.findById(sellerId)
            .orElseThrow(() -> new ResourceNotFoundException("Seller profile not found for ID: " + sellerId)));

    profile.setDuplicateWarning(true);
    profile.setDuplicateWarningAt(LocalDateTime.now());
    profile.setNameChangeDeadline(LocalDateTime.now().plusDays(7));
    profile = sellerProfileRepository.save(profile);

    if (profile.getUser() != null) {
      activityLogService.logSellerActivity(profile.getUser(), "DUPLICATE_STORE_WARNING_MANUAL",
          "Admin flagged store \"" + profile.getStoreName() + "\" as duplicate. 7-day deadline issued to change name.", null);
    }
    return mapToDto(profile);
  }

 private WithdrawResponseDto mapWithdrawToDto(WithdrawRequest r) {
 WithdrawResponseDto dto = new WithdrawResponseDto();
 dto.setId(r.getId());
 dto.setAmount(r.getAmount());
 dto.setKhqrString(r.getKhqrString());
 dto.setKhqrImageUrl(r.getKhqrImageUrl());
 dto.setStatus(r.getStatus());
 dto.setRequestedAt(r.getRequestedAt());
 dto.setProcessedAt(r.getProcessedAt());
 dto.setAdminNote(r.getAdminNote());
 try {
 if (r.getSeller() != null) {
 dto.setSellerId(r.getSeller().getId());
 dto.setSellerName(r.getSeller().getName());
 dto.setSellerEmail(r.getSeller().getEmail());
 }
 } catch (Exception e) {
 log.warn("Could not map seller details for withdraw request #{}: {}", r.getId(), e.getMessage());
 }
 return dto;
 }

 private ProductResponse mapProductToResponse(Product p) {
 ProductResponse dto = new ProductResponse();
 dto.setId(p.getId());
 dto.setName(p.getName());
 dto.setDescription(p.getDescription());
 dto.setPrice(p.getPrice());
 dto.setBasePrice(p.getBasePrice());
 dto.setOriginalPrice(p.getOriginalPrice());
 dto.setDiscountPercent(p.getDiscountPercent());
 dto.setImageUrl(p.getImageUrl());
 dto.setProductType(p.getProductType());
 dto.setDuration(p.getDuration());
 dto.setProductLabel(p.getProductLabel());
 dto.setActive(p.isActive());
 dto.setCreatedAt(p.getCreatedAt());
 dto.setStockCount(productStockRepository.countByProductIdAndSoldFalse(p.getId()));
 if (p.getCategory() != null) {
 dto.setCategoryId(p.getCategory().getId());
 dto.setCategoryName(p.getCategory().getName());
 }
 if (p.getSeller() != null) {
 dto.setSellerId(p.getSeller().getId());
 dto.setSellerName(p.getSeller().getName());
  sellerProfileRepository.findByUserId(p.getSeller().getId()).ifPresent(profile -> {
  dto.setSellerStoreName(profile.getStoreName());
  dto.setSellerStoreLogoUrl(profile.getStoreLogoUrl());
  dto.setSellerStoreDescription(profile.getStoreDescription());
  dto.setSellerTelegramUsername(profile.getTelegramUsername());
  dto.setSellerTelegramChannel(profile.getTelegramChannel());
  dto.setSellerPreferredContactMethod(profile.getPreferredContactMethod());
  });
 }
 return dto;
 }
}
