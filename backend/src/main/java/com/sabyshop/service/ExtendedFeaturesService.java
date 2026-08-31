package com.sabyshop.service;

import com.sabyshop.model.*;
import com.sabyshop.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExtendedFeaturesService {

    private final PaymentRepository paymentRepository;
    private final SellerWalletRepository sellerWalletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final SupportThreadRepository supportThreadRepository;
    private final NotificationRepository notificationRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final OrderDeliveryRepository orderDeliveryRepository;
    private final OrderRefundRepository orderRefundRepository;
    private final SellerPayoutMethodRepository sellerPayoutMethodRepository;
    private final SellerCommissionRepository sellerCommissionRepository;
    private final OtpVerificationRepository otpVerificationRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final UserSessionRepository userSessionRepository;
    private final FavoriteRepository favoriteRepository;
    private final CouponUsageRepository couponUsageRepository;
    private final DisputeMessageRepository disputeMessageRepository;
    private final DisputeEvidenceRepository disputeEvidenceRepository;
    private final AdminActionRepository adminActionRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    // ==========================================
    // 23. PAYMENTS
    // ==========================================
    @Transactional
    public Payment recordPayment(Order order, User user, String paymentMethod, String transactionId, Double amount, String provider, String payload, Payment.PaymentStatus status) {
        Payment payment = Payment.builder()
                .order(order)
                .user(user)
                .paymentMethod(paymentMethod != null ? paymentMethod : "ABA_PAYWAY")
                .transactionId(transactionId)
                .amount(amount != null ? amount : 0.0)
                .currency("USD")
                .provider(provider != null ? provider : "BAKONG")
                .providerPayload(payload)
                .status(status != null ? status : Payment.PaymentStatus.SUCCESSFUL)
                .paidAt(status == Payment.PaymentStatus.SUCCESSFUL ? LocalDateTime.now() : null)
                .build();
        return paymentRepository.save(payment);
    }

    @Transactional(readOnly = true)
    public List<Payment> getAllPayments() {
        List<Payment> list = paymentRepository.findAllByOrderByCreatedAtDesc();
        if (list.isEmpty()) {
            List<Order> orders = orderRepository.findAll();
            for (Order o : orders) {
                Payment.PaymentStatus st = Payment.PaymentStatus.PENDING;
                if (o.getStatus() == OrderStatus.COMPLETED || o.getStatus() == OrderStatus.DELIVERED || o.getStatus() == OrderStatus.PROCESSING) {
                    st = Payment.PaymentStatus.SUCCESSFUL;
                } else if (o.getStatus() == OrderStatus.REFUNDED) {
                    st = Payment.PaymentStatus.REFUNDED;
                } else if (o.getStatus() == OrderStatus.CANCELLED) {
                    st = Payment.PaymentStatus.CANCELLED;
                }

                Payment p = Payment.builder()
                        .id(o.getId())
                        .order(o)
                        .user(o.getUser())
                        .paymentMethod(o.getPaymentId() != null ? "ABA_KHQR" : "BAKONG_KHQR")
                        .transactionId(o.getPaymentId() != null ? o.getPaymentId() : "ORD-" + o.getId())
                        .amount(o.getTotalAmount() != null ? o.getTotalAmount() : 0.0)
                        .currency("USD")
                        .provider("BAKONG")
                        .status(st)
                        .paidAt(o.getCreatedAt())
                        .createdAt(o.getCreatedAt())
                        .updatedAt(o.getCreatedAt())
                        .build();
                list.add(p);
            }
        }
        return list;
    }

    @Transactional(readOnly = true)
    public List<Payment> getUserPayments(Long userId) {
        return paymentRepository.findByUser_IdOrderByCreatedAtDesc(userId);
    }

    // ==========================================
    // 24 & 25. SELLER WALLETS & TRANSACTIONS
    // ==========================================
    @Transactional
    public SellerWallet getOrCreateSellerWallet(User seller) {
        return sellerWalletRepository.findBySeller(seller).orElseGet(() -> {
            SellerWallet wallet = SellerWallet.builder()
                    .seller(seller)
                    .balance(seller.getSellerBalance() != null ? seller.getSellerBalance() : 0.0)
                    .pendingBalance(0.0)
                    .frozenBalance(0.0)
                    .totalEarned(seller.getSellerBalance() != null ? seller.getSellerBalance() : 0.0)
                    .totalWithdrawn(0.0)
                    .currency("USD")
                    .status("ACTIVE")
                    .build();
            return sellerWalletRepository.save(wallet);
        });
    }

    @Transactional
    public WalletTransaction recordWalletCredit(User seller, Double amount, WalletTransaction.TransactionType type, String refType, String refId, String desc) {
        SellerWallet wallet = getOrCreateSellerWallet(seller);
        double before = wallet.getBalance() != null ? wallet.getBalance() : 0.0;
        double after = before + amount;
        wallet.setBalance(after);
        wallet.setTotalEarned((wallet.getTotalEarned() != null ? wallet.getTotalEarned() : 0.0) + amount);
        sellerWalletRepository.save(wallet);

        // Also sync User.sellerBalance
        seller.setSellerBalance(after);
        userRepository.save(seller);

        WalletTransaction tx = WalletTransaction.builder()
                .wallet(wallet)
                .seller(seller)
                .type(type)
                .amount(amount)
                .balanceBefore(before)
                .balanceAfter(after)
                .referenceType(refType)
                .referenceId(refId)
                .description(desc)
                .status(WalletTransaction.TransactionStatus.COMPLETED)
                .build();
        return walletTransactionRepository.save(tx);
    }

    @Transactional
    public WalletTransaction recordWalletDebit(User seller, Double amount, WalletTransaction.TransactionType type, String refType, String refId, String desc) {
        SellerWallet wallet = getOrCreateSellerWallet(seller);
        double before = wallet.getBalance() != null ? wallet.getBalance() : 0.0;
        double after = Math.max(0.0, before - amount);
        wallet.setBalance(after);
        if (type == WalletTransaction.TransactionType.WITHDRAWAL) {
            wallet.setTotalWithdrawn((wallet.getTotalWithdrawn() != null ? wallet.getTotalWithdrawn() : 0.0) + amount);
        }
        sellerWalletRepository.save(wallet);

        // Also sync User.sellerBalance
        seller.setSellerBalance(after);
        userRepository.save(seller);

        WalletTransaction tx = WalletTransaction.builder()
                .wallet(wallet)
                .seller(seller)
                .type(type)
                .amount(-amount)
                .balanceBefore(before)
                .balanceAfter(after)
                .referenceType(refType)
                .referenceId(refId)
                .description(desc)
                .status(WalletTransaction.TransactionStatus.COMPLETED)
                .build();
        return walletTransactionRepository.save(tx);
    }

    public List<WalletTransaction> getSellerTransactions(Long sellerId) {
        return walletTransactionRepository.findBySeller_IdOrderByCreatedAtDesc(sellerId);
    }

    public List<WalletTransaction> getAllTransactions() {
        return walletTransactionRepository.findAllByOrderByCreatedAtDesc();
    }

    // ==========================================
    // 26. SUPPORT THREADS / TICKETS
    // ==========================================
    @Transactional
    public SupportThread createSupportThread(User user, String subject, String category, SupportThread.Priority priority, String initialMsg) {
        String ticketNumber = "TICK-" + (System.currentTimeMillis() % 1000000);
        SupportThread thread = SupportThread.builder()
                .ticketNumber(ticketNumber)
                .user(user)
                .subject(subject)
                .category(category != null ? category : "GENERAL")
                .priority(priority != null ? priority : SupportThread.Priority.NORMAL)
                .status(SupportThread.TicketStatus.OPEN)
                .initialMessage(initialMsg)
                .lastReply(initialMsg)
                .lastRepliedAt(LocalDateTime.now())
                .build();
        return supportThreadRepository.save(thread);
    }

    public List<SupportThread> getUserSupportThreads(Long userId) {
        return supportThreadRepository.findByUser_IdOrderByCreatedAtDesc(userId);
    }

    public List<SupportThread> getAllSupportThreads() {
        return supportThreadRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public SupportThread replySupportThread(Long threadId, String replyMsg, User admin) {
        SupportThread thread = supportThreadRepository.findById(threadId).orElse(null);
        if (thread != null) {
            thread.setLastReply(replyMsg);
            thread.setLastRepliedAt(LocalDateTime.now());
            if (admin != null) {
                thread.setAssignedAdmin(admin);
                thread.setStatus(SupportThread.TicketStatus.IN_PROGRESS);
            }
            return supportThreadRepository.save(thread);
        }
        return null;
    }

    @Transactional
    public SupportThread updateSupportThreadStatus(Long threadId, SupportThread.TicketStatus status) {
        SupportThread thread = supportThreadRepository.findById(threadId).orElse(null);
        if (thread != null) {
            thread.setStatus(status);
            if (status == SupportThread.TicketStatus.RESOLVED || status == SupportThread.TicketStatus.CLOSED) {
                thread.setResolvedAt(LocalDateTime.now());
            }
            return supportThreadRepository.save(thread);
        }
        return null;
    }

    // ==========================================
    // 27. NOTIFICATIONS
    // ==========================================
    @Transactional
    public Notification createNotification(User user, String title, String message, Notification.NotificationType type, String link, String metadataJson) {
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .link(link)
                .metadataJson(metadataJson)
                .isRead(false)
                .build();
        return notificationRepository.save(notification);
    }

    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUser_IdOrderByCreatedAtDesc(userId);
    }

    public long getUnreadNotificationCount(Long userId) {
        return notificationRepository.countByUser_IdAndIsReadFalse(userId);
    }

    @Transactional
    public boolean markNotificationAsRead(Long notificationId, Long userId) {
        Optional<Notification> opt = notificationRepository.findById(notificationId);
        if (opt.isPresent() && opt.get().getUser().getId().equals(userId)) {
            Notification n = opt.get();
            n.setIsRead(true);
            n.setReadAt(LocalDateTime.now());
            notificationRepository.save(n);
            return true;
        }
        return false;
    }

    @Transactional
    public void markAllNotificationsAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByUser_IdAndIsReadFalseOrderByCreatedAtDesc(userId);
        for (Notification n : unread) {
            n.setIsRead(true);
            n.setReadAt(LocalDateTime.now());
        }
        notificationRepository.saveAll(unread);
    }

    @Transactional
    public void broadcastNotification(String title, String message, String link) {
        List<User> allUsers = userRepository.findAll();
        for (User u : allUsers) {
            createNotification(u, title, message, Notification.NotificationType.SYSTEM_BROADCAST, link, null);
        }
    }

    // ==========================================
    // 28. ORDER STATUS HISTORY
    // ==========================================
    @Transactional
    public OrderStatusHistory recordOrderStatusHistory(Order order, String fromStatus, String toStatus, User changedBy, String actorRole, String notes) {
        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .fromStatus(fromStatus != null ? fromStatus : "NONE")
                .toStatus(toStatus)
                .changedBy(changedBy)
                .actorRole(actorRole != null ? actorRole : "SYSTEM")
                .notes(notes)
                .build();
        return orderStatusHistoryRepository.save(history);
    }

    public List<OrderStatusHistory> getOrderHistory(Long orderId) {
        return orderStatusHistoryRepository.findByOrder_IdOrderByCreatedAtAsc(orderId);
    }

    // ==========================================
    // 29. ORDER DELIVERIES
    // ==========================================
    @Transactional
    public OrderDelivery recordOrderDelivery(Order order, OrderItem item, User deliveredBy, OrderDelivery.DeliveryType deliveryType, String email, String password, String secret, String instructions, OrderDelivery.DeliveryStatus status, String note) {
        OrderDelivery delivery = OrderDelivery.builder()
                .order(order)
                .orderItem(item)
                .deliveredBy(deliveredBy)
                .deliveryType(deliveryType != null ? deliveryType : OrderDelivery.DeliveryType.AUTOMATED_STOCK)
                .accountEmail(email)
                .accountPassword(password)
                .secretPayload(secret)
                .instructions(instructions != null ? instructions : note)
                .status(status != null ? status : OrderDelivery.DeliveryStatus.DELIVERED)
                .deliveredAt(LocalDateTime.now())
                .build();
        return orderDeliveryRepository.save(delivery);
    }

    public List<OrderDelivery> getOrderDeliveries(Long orderId) {
        return orderDeliveryRepository.findByOrder_IdOrderByCreatedAtDesc(orderId);
    }

    // ==========================================
    // 30. ORDER REFUNDS
    // ==========================================
    @Transactional
    public OrderRefund recordOrderRefund(Order order, Dispute dispute, User buyer, User admin, Double amount, OrderRefund.RefundType type, String reason, String txRef) {
        OrderRefund refund = OrderRefund.builder()
                .order(order)
                .dispute(dispute)
                .user(buyer)
                .processedBy(admin)
                .amount(amount != null ? amount : order.getTotalAmount())
                .refundType(type != null ? type : OrderRefund.RefundType.STORE_CREDIT)
                .reason(reason != null ? reason : "Refund issued via resolution")
                .status(OrderRefund.RefundStatus.COMPLETED)
                .transactionReference(txRef)
                .processedAt(LocalDateTime.now())
                .build();
        return orderRefundRepository.save(refund);
    }

    public List<OrderRefund> getOrderRefunds(Long orderId) {
        return orderRefundRepository.findByOrder_IdOrderByCreatedAtDesc(orderId);
    }

    public List<OrderRefund> getAllRefunds() {
        return orderRefundRepository.findAllByOrderByCreatedAtDesc();
    }

    // ==========================================
    // 31. SELLER PAYOUT METHODS
    // ==========================================
    public List<SellerPayoutMethod> getSellerPayoutMethods(Long sellerId) {
        return sellerPayoutMethodRepository.findBySeller_IdAndIsActiveTrueOrderByCreatedAtDesc(sellerId);
    }

    @Transactional
    public SellerPayoutMethod saveSellerPayoutMethod(User seller, SellerPayoutMethod.MethodType methodType, String accountName, String accountNumber, String bankName, String khqrData, String khqrImageUrl, boolean isDefault) {
        if (isDefault) {
            List<SellerPayoutMethod> existing = sellerPayoutMethodRepository.findBySeller_IdAndIsActiveTrueOrderByCreatedAtDesc(seller.getId());
            for (SellerPayoutMethod m : existing) {
                m.setIsDefault(false);
            }
            sellerPayoutMethodRepository.saveAll(existing);
        }

        SellerPayoutMethod method = SellerPayoutMethod.builder()
                .seller(seller)
                .methodType(methodType != null ? methodType : SellerPayoutMethod.MethodType.BAKONG_KHQR)
                .accountName(accountName)
                .accountNumber(accountNumber)
                .bankName(bankName)
                .khqrData(khqrData)
                .khqrImageUrl(khqrImageUrl)
                .isDefault(isDefault)
                .isActive(true)
                .build();
        return sellerPayoutMethodRepository.save(method);
    }

    @Transactional
    public boolean deleteSellerPayoutMethod(Long methodId, Long sellerId) {
        Optional<SellerPayoutMethod> opt = sellerPayoutMethodRepository.findById(methodId);
        if (opt.isPresent() && opt.get().getSeller().getId().equals(sellerId)) {
            SellerPayoutMethod m = opt.get();
            m.setIsActive(false);
            sellerPayoutMethodRepository.save(m);
            return true;
        }
        return false;
    }

    // ==========================================
    // 32. SELLER COMMISSIONS
    // ==========================================
    @Transactional
    public SellerCommission recordSellerCommission(User seller, Order order, OrderItem item, Double grossAmount, Double commissionRate) {
        double rate = commissionRate != null ? commissionRate : 5.0;
        double gross = grossAmount != null ? grossAmount : (order != null ? order.getTotalAmount() : 0.0);
        double fee = Math.round((gross * (rate / 100.0)) * 100.0) / 100.0;
        double net = Math.max(0.0, gross - fee);

        SellerCommission comm = SellerCommission.builder()
                .seller(seller)
                .order(order)
                .orderItem(item)
                .grossAmount(gross)
                .commissionRate(rate)
                .commissionAmount(fee)
                .sellerNetAmount(net)
                .status(SellerCommission.CommissionStatus.CLEARED)
                .releaseDate(LocalDateTime.now())
                .build();
        return sellerCommissionRepository.save(comm);
    }

    public List<SellerCommission> getSellerCommissions(Long sellerId) {
        return sellerCommissionRepository.findBySeller_IdOrderByCreatedAtDesc(sellerId);
    }

    public List<SellerCommission> getAllCommissions() {
        return sellerCommissionRepository.findAllByOrderByCreatedAtDesc();
    }

    // ==========================================
    // 33. OTP VERIFICATIONS
    // ==========================================
    @Transactional
    public OtpVerification recordOtp(String identifier, String code, OtpVerification.OtpPurpose purpose) {
        OtpVerification otp = OtpVerification.builder()
                .identifier(identifier)
                .otpCode(code)
                .purpose(purpose != null ? purpose : OtpVerification.OtpPurpose.REGISTRATION)
                .isUsed(false)
                .attemptsCount(0)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .build();
        return otpVerificationRepository.save(otp);
    }

    public boolean verifyOtp(String identifier, String code, OtpVerification.OtpPurpose purpose) {
        Optional<OtpVerification> opt = otpVerificationRepository.findTopByIdentifierAndPurposeAndIsUsedFalseOrderByCreatedAtDesc(identifier, purpose);
        if (opt.isPresent()) {
            OtpVerification otp = opt.get();
            if (otp.getExpiresAt().isAfter(LocalDateTime.now()) && otp.getOtpCode().equals(code)) {
                otp.setIsUsed(true);
                otp.setVerifiedAt(LocalDateTime.now());
                otpVerificationRepository.save(otp);
                return true;
            }
        }
        return false;
    }

    // ==========================================
    // 34. PASSWORD RESET TOKENS
    // ==========================================
    @Transactional
    public PasswordResetToken createPasswordResetToken(User user, String ip) {
        String token = java.util.UUID.randomUUID().toString();
        PasswordResetToken prt = PasswordResetToken.builder()
                .user(user)
                .token(token)
                .ipAddress(ip)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .isUsed(false)
                .build();
        return passwordResetTokenRepository.save(prt);
    }

    // ==========================================
    // 35. USER SESSIONS
    // ==========================================
    @Transactional
    public UserSession recordUserSession(User user, String token, String deviceId, String deviceName, String deviceType, String browser, String os, String ip, String city) {
        UserSession session = UserSession.builder()
                .user(user)
                .sessionToken(token != null ? token : java.util.UUID.randomUUID().toString())
                .deviceId(deviceId)
                .deviceName(deviceName)
                .deviceType(deviceType != null ? deviceType : "DESKTOP")
                .browser(browser != null ? browser : "Chrome / Edge")
                .os(os != null ? os : "Windows")
                .ipAddress(ip != null ? ip : "127.0.0.1")
                .locationCity(city != null ? city : "Phnom Penh, KH")
                .isActive(true)
                .lastActiveAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();
        return userSessionRepository.save(session);
    }

    public List<UserSession> getUserSessions(Long userId) {
        return userSessionRepository.findByUser_IdAndIsActiveTrueOrderByLastActiveAtDesc(userId);
    }

    public List<UserSession> getAllActiveSessions() {
        return userSessionRepository.findAllByOrderByLastActiveAtDesc();
    }

    // ==========================================
    // 36. FAVORITES / WISHLIST
    // ==========================================
    @Transactional
    public boolean toggleFavorite(Long userId, Long productId) {
        User user = userRepository.findById(userId).orElse(null);
        Product product = productRepository.findById(productId).orElse(null);
        if (user == null || product == null) return false;

        Optional<Favorite> existing = favoriteRepository.findByUser_IdAndProduct_Id(userId, productId);
        if (existing.isPresent()) {
            favoriteRepository.delete(existing.get());
            return false; // Removed
        } else {
            Favorite fav = Favorite.builder()
                    .user(user)
                    .product(product)
                    .build();
            favoriteRepository.save(fav);
            return true; // Added
        }
    }

    public List<Favorite> getUserFavorites(Long userId) {
        return favoriteRepository.findByUser_IdOrderByCreatedAtDesc(userId);
    }

    public boolean isProductFavorite(Long userId, Long productId) {
        return favoriteRepository.existsByUser_IdAndProduct_Id(userId, productId);
    }

    // ==========================================
    // 37. COUPON USAGES
    // ==========================================
    @Transactional
    public CouponUsage recordCouponUsage(Coupon coupon, User user, Order order, Double discountAmount) {
        CouponUsage usage = CouponUsage.builder()
                .coupon(coupon)
                .user(user)
                .order(order)
                .discountAmount(discountAmount != null ? discountAmount : 0.0)
                .usedAt(LocalDateTime.now())
                .build();
        return couponUsageRepository.save(usage);
    }

    public List<CouponUsage> getCouponUsages(Long couponId) {
        return couponUsageRepository.findByCoupon_IdOrderByUsedAtDesc(couponId);
    }

    // ==========================================
    // 38 & 39. DISPUTE MESSAGES & EVIDENCE
    // ==========================================
    @Transactional
    public DisputeMessage addDisputeMessage(Dispute dispute, User sender, String role, String message, String attachmentUrl, boolean isInternal) {
        DisputeMessage msg = DisputeMessage.builder()
                .dispute(dispute)
                .sender(sender)
                .senderRole(role != null ? role : "BUYER")
                .message(message)
                .attachmentUrl(attachmentUrl)
                .isStaffInternal(isInternal)
                .build();
        return disputeMessageRepository.save(msg);
    }

    public List<DisputeMessage> getDisputeMessages(Long disputeId) {
        return disputeMessageRepository.findByDispute_IdOrderByCreatedAtAsc(disputeId);
    }

    @Transactional
    public DisputeEvidence addDisputeEvidence(Dispute dispute, User uploader, String fileUrl, String fileType, String fileName, Long fileSize, String description) {
        DisputeEvidence evidence = DisputeEvidence.builder()
                .dispute(dispute)
                .uploadedBy(uploader)
                .fileUrl(fileUrl)
                .fileType(fileType != null ? fileType : "IMAGE")
                .fileName(fileName)
                .fileSizeBytes(fileSize)
                .description(description)
                .build();
        return disputeEvidenceRepository.save(evidence);
    }

    public List<DisputeEvidence> getDisputeEvidence(Long disputeId) {
        return disputeEvidenceRepository.findByDispute_IdOrderByCreatedAtAsc(disputeId);
    }

    // ==========================================
    // 40. ADMIN ACTIONS AUDIT LOG
    // ==========================================
    @Transactional
    public AdminAction recordAdminAction(User admin, String actionType, String targetEntity, String targetId, String details, String ip) {
        AdminAction action = AdminAction.builder()
                .admin(admin)
                .actionType(actionType)
                .targetEntity(targetEntity)
                .targetId(targetId)
                .details(details)
                .ipAddress(ip != null ? ip : "127.0.0.1")
                .build();
        return adminActionRepository.save(action);
    }

    public List<AdminAction> getAdminActions() {
        return adminActionRepository.findAllByOrderByCreatedAtDesc();
    }
}
