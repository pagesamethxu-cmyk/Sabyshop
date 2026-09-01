package com.sabyshop.config;

import com.sabyshop.model.*;
import com.sabyshop.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@org.springframework.context.annotation.Profile("dev")
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductStockRepository productStockRepository;
    private final AutoReplyRepository autoReplyRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    // Repositories for 18 new tables
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
    private final DisputeRepository disputeRepository;
    private final DisputeMessageRepository disputeMessageRepository;
    private final DisputeEvidenceRepository disputeEvidenceRepository;
    private final AdminActionRepository adminActionRepository;
    private final CouponRepository couponRepository;

    @Override
    public void run(String... args) {
        // Auto DDL migration for existing PostgreSQL tables
        try {
            jdbcTemplate.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
            jdbcTemplate.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS user_role_check");
            jdbcTemplate.execute("ALTER TABLE seller_profiles DROP CONSTRAINT IF EXISTS seller_profiles_subscription_status_check");
            jdbcTemplate.execute("ALTER TABLE withdraw_requests DROP CONSTRAINT IF EXISTS withdraw_requests_status_check");
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_balance DOUBLE PRECISION DEFAULT 0.0");
            jdbcTemplate.execute("UPDATE users SET seller_balance = 0.0 WHERE seller_balance IS NULL");
            jdbcTemplate.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS base_price DOUBLE PRECISION");
            jdbcTemplate.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_id BIGINT");
            jdbcTemplate.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_count INTEGER DEFAULT 0");
            jdbcTemplate.execute("UPDATE products SET stock_count = 0 WHERE stock_count IS NULL");
            jdbcTemplate.execute("ALTER TABLE order_items ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1");
            jdbcTemplate.execute("UPDATE order_items SET quantity = 1 WHERE quantity IS NULL");
            jdbcTemplate.execute("ALTER TABLE withdraw_requests ADD COLUMN IF NOT EXISTS khqr_image_url TEXT");
            jdbcTemplate.execute("ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_credited BOOLEAN DEFAULT FALSE");
            jdbcTemplate.execute("ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check");
            jdbcTemplate.execute("ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS channel VARCHAR(50) DEFAULT 'USER_ADMIN'");
            jdbcTemplate.execute("ALTER TABLE seller_profiles ADD COLUMN IF NOT EXISTS last_store_name_changed_at TIMESTAMP");
            jdbcTemplate.execute("ALTER TABLE seller_profiles ADD COLUMN IF NOT EXISTS duplicate_warning BOOLEAN DEFAULT FALSE");
            jdbcTemplate.execute("ALTER TABLE seller_profiles ADD COLUMN IF NOT EXISTS duplicate_warning_at TIMESTAMP");
            jdbcTemplate.execute("ALTER TABLE seller_profiles ADD COLUMN IF NOT EXISTS name_change_deadline TIMESTAMP");
            jdbcTemplate.execute("UPDATE seller_profiles SET duplicate_warning = FALSE WHERE duplicate_warning IS NULL");
        } catch (Exception e) {
            // Ignore if columns/constraints already modified
        }

        // Ensure Admin user korbsameth.dev@gmail.com exists with password Sa1234@1234
        String adminEmail = "korbsameth.dev@gmail.com";
        User admin = userRepository.findByEmail(adminEmail).orElse(null);

        if (admin == null) {
            User oldAdmin = userRepository.findByEmail("admin@store.com")
                    .or(() -> userRepository.findByEmail("admin@example.com"))
                    .orElse(null);

            if (oldAdmin != null) {
                oldAdmin.setEmail(adminEmail);
                oldAdmin.setPassword(passwordEncoder.encode("Sa1234@1234"));
                oldAdmin.setRole(Role.ADMIN);
                admin = userRepository.save(oldAdmin);
            } else {
                admin = User.builder()
                        .email(adminEmail)
                        .password(passwordEncoder.encode("Sa1234@1234"))
                        .name("Admin")
                        .role(Role.ADMIN)
                        .createdAt(LocalDateTime.now())
                        .build();
                admin = userRepository.save(admin);
            }
        } else {
            admin.setPassword(passwordEncoder.encode("Sa1234@1234"));
            admin.setRole(Role.ADMIN);
            admin = userRepository.save(admin);
        }

        // Ensure user samethxu@gmail.com exists for testing
        String testUserEmail = "samethxu@gmail.com";
        User testUser = userRepository.findByEmail(testUserEmail).orElse(null);
        if (testUser == null) {
            testUser = User.builder()
                    .email(testUserEmail)
                    .password(passwordEncoder.encode("123456"))
                    .name("Sameth Xu")
                    .role(Role.CUSTOMER)
                    .createdAt(LocalDateTime.now())
                    .build();
            testUser = userRepository.save(testUser);
        }

        if (categoryRepository.count() == 0) {
            Category c1 = Category.builder().name("Gaming").emoji("").description("Gaming accounts and subscriptions").build();
            Category c2 = Category.builder().name("Streaming").emoji("").description("Streaming service accounts").build();
            Category c3 = Category.builder().name("Software").emoji("").description("Software licenses and accounts").build();
            Category c4 = Category.builder().name("Social Media").emoji("").description("Social media accounts").build();
            Category c5 = Category.builder().name("VPN & Security").emoji("").description("VPN and security tool accounts").build();
            
            categoryRepository.saveAll(List.of(c1, c2, c3, c4, c5));

            Product p1 = Product.builder().name("Netflix Premium").category(c2).price(12.99).imageUrl("/images/products/netflix.svg").duration("1 Month").productType("ACCOUNT").productLabel("HOT").description("Premium Netflix account with 4K streaming").createdAt(LocalDateTime.now()).active(true).build();
            Product p2 = Product.builder().name("Spotify Premium").category(c2).price(9.99).imageUrl("/images/products/spotify.svg").duration("1 Month").productType("ACCOUNT").productLabel("BEST_SELLER").description("Spotify Premium individual account").createdAt(LocalDateTime.now()).active(true).build();
            Product p3 = Product.builder().name("Steam Account").category(c1).price(15.99).imageUrl("/images/products/steam.svg").duration("1 Month").productType("ACCOUNT").productLabel("PROMO").description("Steam account with games library").createdAt(LocalDateTime.now()).active(true).build();
            Product p4 = Product.builder().name("Discord Nitro").category(c4).price(4.99).imageUrl("/images/products/discord.svg").duration("1 Month").productType("ACCOUNT").productLabel("HOT").description("Discord Nitro 1 month subscription").createdAt(LocalDateTime.now()).active(true).build();
            Product p5 = Product.builder().name("NordVPN Premium").category(c5).price(8.99).imageUrl("/images/products/nordvpn.svg").duration("1 Year").productType("ACCOUNT").productLabel("HOT").description("1 Year NordVPN Premium subscription").createdAt(LocalDateTime.now()).active(true).build();
            Product p6 = Product.builder().name("Adobe Creative Cloud").category(c3).price(24.99).imageUrl("/images/products/adobe.svg").duration("1 Month").productType("ACCOUNT").productLabel("NONE").description("Adobe CC all apps subscription").createdAt(LocalDateTime.now()).active(true).build();
            
            List<Product> products = List.of(p1, p2, p3, p4, p5, p6);
            productRepository.saveAll(products);

            for (Product p : products) {
                for (int i = 1; i <= 5; i++) {
                    ProductStock stock = ProductStock.builder()
                            .product(p)
                            .accountEmail("user" + i + "_" + p.getName().replaceAll("\\s+", "").toLowerCase() + "@example.com")
                            .accountPassword("Pass123!_" + i)
                            .sold(false)
                            .build();
                    productStockRepository.save(stock);
                }
            }
        }

        // Auto-migrate any existing database products that have missing/placeholder/unsplash imageUrls
        try {
            List<Product> allExistingProducts = productRepository.findAll();
            for (Product prod : allExistingProducts) {
                String name = prod.getName() != null ? prod.getName().toLowerCase() : "";
                String curImg = prod.getImageUrl();
                boolean needsUpdate = curImg == null || curImg.isBlank() || curImg.contains("unsplash.com");
                if (needsUpdate) {
                    if (name.contains("netflix")) prod.setImageUrl("/images/products/netflix.svg");
                    else if (name.contains("spotify")) prod.setImageUrl("/images/products/spotify.svg");
                    else if (name.contains("chatgpt") || name.contains("gpt") || name.contains("openai")) prod.setImageUrl("/images/products/chatgpt.svg");
                    else if (name.contains("claude") || name.contains("anthropic")) prod.setImageUrl("/images/products/claude.svg");
                    else if (name.contains("grok") || name.contains("xai")) prod.setImageUrl("/images/products/grok.svg");
                    else if (name.contains("gemini")) prod.setImageUrl("/images/products/gemini.svg");
                    else if (name.contains("antigravity")) prod.setImageUrl("/images/products/antigravity.svg");
                    else if (name.contains("youtube")) prod.setImageUrl("/images/products/youtube.svg");
                    else if (name.contains("discord") || name.contains("nitro")) prod.setImageUrl("/images/products/discord.svg");
                    else if (name.contains("canva")) prod.setImageUrl("/images/products/canva.svg");
                    else if (name.contains("capcut")) prod.setImageUrl("/images/products/capcut.svg");
                    else if (name.contains("alight") || name.contains("alight motion")) prod.setImageUrl("/images/products/alightmotion.svg");
                    else if (name.contains("steam")) prod.setImageUrl("/images/products/steam.svg");
                    else if (name.contains("hma") || name.contains("hide my ass")) prod.setImageUrl("/images/products/hma.svg");
                    else if (name.contains("express") || name.contains("expressvpn")) prod.setImageUrl("/images/products/expressvpn.svg");
                    else if (name.contains("surfshark")) prod.setImageUrl("/images/products/surfshark.svg");
                    else if (name.contains("nord") || name.contains("nordvpn")) prod.setImageUrl("/images/products/nordvpn.svg");
                    else if (name.contains("vpn") || name.contains("security")) prod.setImageUrl("/images/products/nordvpn.svg");
                    else if (name.contains("zoom")) prod.setImageUrl("/images/products/zoom.svg");
                    else if (name.contains("apple")) prod.setImageUrl("/images/products/apple.svg");
                    else if (name.contains("adobe") || name.contains("creative")) prod.setImageUrl("/images/products/adobe.svg");
                    else if (name.contains("disney")) prod.setImageUrl("/images/products/disney.svg");
                    else if (name.contains("prime") || name.contains("amazon")) prod.setImageUrl("/images/products/prime.svg");
                    else if (name.contains("telegram")) prod.setImageUrl("/images/products/telegram.svg");
                    productRepository.save(prod);
                }
            }
        } catch (Exception e) {
            log.warn("Notice: Product image migration notice: {}", e.getMessage());
        }

        if (autoReplyRepository.count() == 0) {
            AutoReply ar1 = AutoReply.builder()
                    .keyword("price")
                    .category("PRICING")
                    .replyKh("ជម្រាបសួរ បង! តម្លៃផលិតផល និងការបញ្ចុះតម្លៃទាំងអស់ត្រូវបានបង្ហាញនៅលើទំព័រផលិតផល។ បងអាចចូលមើលតម្លៃចុងក្រោយ និងប្រូម៉ូសិនពិសេសៗនៅទីនោះបាន!")
                    .replyEn("Hello! All product prices and discounts are displayed on the product page. You can check out our website for the latest prices and special deals!")
                    .build();

            AutoReply ar2 = AutoReply.builder()
                    .keyword("payment")
                    .category("PAYMENT")
                    .replyKh("ជម្រាបសួរ! ហាងយើងខ្ញុំទទួលការទូទាត់តាមរយៈ KHQR, Bakong និងការផ្ទេរតាមធនាគារ (ABA, ACLEDA, Wing)។ បន្ទាប់ពីទូទាត់រួច គណនីនឹងត្រូវផ្ញើជូនលោកអ្នកភ្លាមៗ!")
                    .replyEn("Hello! We accept payments via KHQR, Bakong, and Bank Transfers (ABA, ACLEDA, Wing). Credentials will be delivered instantly after payment verification!")
                    .build();

            AutoReply ar3 = AutoReply.builder()
                    .keyword("delivery")
                    .category("DELIVERY")
                    .replyKh("ជម្រាបសួរ! គណនី និងលេខកូដទាំងអស់នឹងត្រូវផ្ញើជូនតាមអ៊ីមែល និងបង្ហាញនៅលើទំព័រប្រវត្តិការបញ្ជាទិញ (Order History) របស់លោកអ្នកភ្លាមៗដោយស្វ័យប្រវត្តិ!")
                    .replyEn("Hello! All account credentials will be sent instantly to your email and displayed in your Order History automatically!")
                    .build();

            autoReplyRepository.saveAll(List.of(ar1, ar2, ar3));
        }

        // Ensure sample order history exists for testUser
        Order o1 = null;
        if (testUser != null && orderRepository.findByUserId(testUser.getId()).isEmpty()) {
            List<Product> prods = productRepository.findAll();
            Product netflix = prods.stream().filter(p -> p.getName().toLowerCase().contains("netflix")).findFirst().orElse(null);

            if (netflix != null) {
                ProductStock stock1 = ProductStock.builder()
                        .product(netflix)
                        .accountEmail("canva_pro_sameth@sabyshop.com")
                        .accountPassword("CanvaPass2026!")
                        .sold(true)
                        .build();
                productStockRepository.save(stock1);

                o1 = Order.builder()
                        .user(testUser)
                        .totalAmount(netflix.getPrice())
                        .status(OrderStatus.COMPLETED)
                        .paymentId("PAY-NETFLIX-125")
                        .createdAt(LocalDateTime.now().minusDays(1))
                        .build();
                
                OrderItem item1 = OrderItem.builder()
                        .order(o1)
                        .product(netflix)
                        .price(netflix.getPrice())
                        .stockItem(stock1)
                        .build();
                
                o1.setItems(List.of(item1));
                o1 = orderRepository.save(o1);
            }
        } else {
            List<Order> existingOrders = orderRepository.findAll();
            if (!existingOrders.isEmpty()) {
                o1 = existingOrders.get(0);
            }
        }

        // ==========================================
        // SEED DATA FOR 18 NEW TABLES (Tables 23-40)
        // ==========================================
        try {
            // 23. PAYMENTS
            if (paymentRepository.count() == 0 && testUser != null) {
                paymentRepository.save(Payment.builder()
                        .order(o1)
                        .user(testUser)
                        .paymentMethod("ABA_PAYWAY")
                        .transactionId("PAY-ABA-20260816-001")
                        .amount(12.99)
                        .currency("USD")
                        .status(Payment.PaymentStatus.SUCCESSFUL)
                        .provider("ABA")
                        .providerPayload("{\"tran_id\":\"PAY-ABA-20260816-001\",\"status\":\"0\",\"currency\":\"USD\"}")
                        .paidAt(LocalDateTime.now().minusDays(1))
                        .build());

                paymentRepository.save(Payment.builder()
                        .user(testUser)
                        .paymentMethod("BAKONG_KHQR")
                        .transactionId("PAY-BAKONG-20260816-002")
                        .amount(9.99)
                        .currency("USD")
                        .status(Payment.PaymentStatus.PENDING)
                        .provider("BAKONG")
                        .build());
            }

            // 24 & 25. SELLER WALLETS & TRANSACTIONS
            if (sellerWalletRepository.count() == 0 && admin != null) {
                SellerWallet adminWallet = SellerWallet.builder()
                        .seller(admin)
                        .balance(250.50)
                        .pendingBalance(45.00)
                        .frozenBalance(0.0)
                        .totalEarned(1240.00)
                        .totalWithdrawn(989.50)
                        .currency("USD")
                        .status("ACTIVE")
                        .build();
                sellerWalletRepository.save(adminWallet);

                walletTransactionRepository.save(WalletTransaction.builder()
                        .wallet(adminWallet)
                        .seller(admin)
                        .type(WalletTransaction.TransactionType.ORDER_SALE)
                        .amount(12.99)
                        .balanceBefore(237.51)
                        .balanceAfter(250.50)
                        .referenceType("ORDER")
                        .referenceId("101")
                        .description("Order sale revenue for Netflix Premium 4K")
                        .status(WalletTransaction.TransactionStatus.COMPLETED)
                        .build());

                walletTransactionRepository.save(WalletTransaction.builder()
                        .wallet(adminWallet)
                        .seller(admin)
                        .type(WalletTransaction.TransactionType.COMMISSION_FEE)
                        .amount(-0.65)
                        .balanceBefore(251.15)
                        .balanceAfter(250.50)
                        .referenceType("ORDER")
                        .referenceId("101")
                        .description("Platform 5% transaction commission cut")
                        .status(WalletTransaction.TransactionStatus.COMPLETED)
                        .build());
            }

            // 26. SUPPORT THREADS
            if (supportThreadRepository.count() == 0 && testUser != null) {
                supportThreadRepository.save(SupportThread.builder()
                        .ticketNumber("TICK-2026-8001")
                        .user(testUser)
                        .assignedAdmin(admin)
                        .subject("Instant Delivery Credentials Inquiry")
                        .category("DELIVERY_PROBLEM")
                        .priority(SupportThread.Priority.HIGH)
                        .status(SupportThread.TicketStatus.RESOLVED)
                        .initialMessage("Hello! Where can I access the password for my newly purchased account?")
                        .lastReply("You can view it directly in Orders > Order Details with 1-click copy!")
                        .lastRepliedAt(LocalDateTime.now().minusHours(2))
                        .resolvedAt(LocalDateTime.now().minusHours(1))
                        .build());

                supportThreadRepository.save(SupportThread.builder()
                        .ticketNumber("TICK-2026-8002")
                        .user(testUser)
                        .subject("KHQR Dynamic Payment Verification")
                        .category("PAYMENT_ISSUE")
                        .priority(SupportThread.Priority.NORMAL)
                        .status(SupportThread.TicketStatus.OPEN)
                        .initialMessage("Can I pay using ACLEDA Mobile app QR scanner?")
                        .lastReply("Can I pay using ACLEDA Mobile app QR scanner?")
                        .lastRepliedAt(LocalDateTime.now().minusMinutes(30))
                        .build());
            }

            // 27. NOTIFICATIONS
            if (notificationRepository.count() == 0 && testUser != null) {
                notificationRepository.save(Notification.builder()
                        .user(testUser)
                        .title("Welcome to Saby Shop!")
                        .message("Your account is ready. Explore top digital streaming and software licenses with 100% Escrow Protection.")
                        .type(Notification.NotificationType.SYSTEM_BROADCAST)
                        .link("/store")
                        .isRead(false)
                        .build());

                notificationRepository.save(Notification.builder()
                        .user(testUser)
                        .title("Order Completed & Credentials Delivered")
                        .message("Order #101 has been processed! Credentials are ready in your account.")
                        .type(Notification.NotificationType.ORDER_DELIVERED)
                        .link("/orders")
                        .isRead(false)
                        .build());

                notificationRepository.save(Notification.builder()
                        .user(testUser)
                        .title("Payment Verified Successfully")
                        .message("Your ABA KHQR PayWay payment for $12.99 was confirmed.")
                        .type(Notification.NotificationType.PAYMENT_SUCCESS)
                        .link("/orders")
                        .isRead(true)
                        .readAt(LocalDateTime.now().minusHours(5))
                        .build());
            }

            // 28. ORDER STATUS HISTORY
            if (orderStatusHistoryRepository.count() == 0 && o1 != null) {
                orderStatusHistoryRepository.save(OrderStatusHistory.builder()
                        .order(o1)
                        .fromStatus("NONE")
                        .toStatus("PENDING")
                        .actorRole("BUYER")
                        .notes("Customer placed order and initiated checkout.")
                        .build());

                orderStatusHistoryRepository.save(OrderStatusHistory.builder()
                        .order(o1)
                        .fromStatus("PENDING")
                        .toStatus("PROCESSING")
                        .actorRole("SYSTEM")
                        .notes("ABA PayWay webhook payment confirmation verified.")
                        .build());

                orderStatusHistoryRepository.save(OrderStatusHistory.builder()
                        .order(o1)
                        .fromStatus("PROCESSING")
                        .toStatus("COMPLETED")
                        .actorRole("SYSTEM")
                        .notes("Automated digital stock credentials dispatched to customer.")
                        .build());
            }

            // 29. ORDER DELIVERIES
            if (orderDeliveryRepository.count() == 0 && o1 != null) {
                orderDeliveryRepository.save(OrderDelivery.builder()
                        .order(o1)
                        .deliveredBy(admin)
                        .deliveryType(OrderDelivery.DeliveryType.AUTOMATED_STOCK)
                        .accountEmail("canva_pro_sameth@sabyshop.com")
                        .accountPassword("CanvaPass2026!")
                        .secretPayload("LICENSE-KEY: 9A8B-7C6D-5E4F-3G2H")
                        .instructions("Log in at official portal. Do not change recovery phone.")
                        .status(OrderDelivery.DeliveryStatus.DELIVERED)
                        .deliveredAt(LocalDateTime.now().minusDays(1))
                        .build());
            }

            // 30. ORDER REFUNDS
            if (orderRefundRepository.count() == 0 && o1 != null && testUser != null) {
                orderRefundRepository.save(OrderRefund.builder()
                        .order(o1)
                        .user(testUser)
                        .processedBy(admin)
                        .amount(12.99)
                        .refundType(OrderRefund.RefundType.STORE_CREDIT)
                        .reason("Dispute resolution - 100% escrow buyer protection reimbursement")
                        .status(OrderRefund.RefundStatus.COMPLETED)
                        .transactionReference("REF-2026-9001")
                        .processedAt(LocalDateTime.now().minusDays(2))
                        .build());
            }

            // 31. SELLER PAYOUT METHODS
            if (sellerPayoutMethodRepository.count() == 0 && admin != null) {
                sellerPayoutMethodRepository.save(SellerPayoutMethod.builder()
                        .seller(admin)
                        .methodType(SellerPayoutMethod.MethodType.BAKONG_KHQR)
                        .accountName("SAMETH KORB")
                        .accountNumber("korb_sameth@aba")
                        .bankName("ABA Bank KHQR")
                        .khqrData("00020101021229370016abaakhppxxx@aba...")
                        .isDefault(true)
                        .isActive(true)
                        .build());

                sellerPayoutMethodRepository.save(SellerPayoutMethod.builder()
                        .seller(admin)
                        .methodType(SellerPayoutMethod.MethodType.ABA_BANK)
                        .accountName("SAMETH KORB")
                        .accountNumber("001 234 567")
                        .bankName("ABA Bank Plc")
                        .isDefault(false)
                        .isActive(true)
                        .build());
            }

            // 32. SELLER COMMISSIONS
            if (sellerCommissionRepository.count() == 0 && admin != null && o1 != null) {
                sellerCommissionRepository.save(SellerCommission.builder()
                        .seller(admin)
                        .order(o1)
                        .grossAmount(12.99)
                        .commissionRate(5.0)
                        .commissionAmount(0.65)
                        .sellerNetAmount(12.34)
                        .status(SellerCommission.CommissionStatus.CLEARED)
                        .releaseDate(LocalDateTime.now().minusDays(1))
                        .build());
            }

            // 33. OTP VERIFICATIONS
            if (otpVerificationRepository.count() == 0) {
                otpVerificationRepository.save(OtpVerification.builder()
                        .identifier("samethxu@gmail.com")
                        .otpCode("8492")
                        .purpose(OtpVerification.OtpPurpose.REGISTRATION)
                        .isUsed(true)
                        .verifiedAt(LocalDateTime.now().minusDays(5))
                        .build());
            }

            // 34. PASSWORD RESET TOKENS
            if (passwordResetTokenRepository.count() == 0 && testUser != null) {
                passwordResetTokenRepository.save(PasswordResetToken.builder()
                        .user(testUser)
                        .token("RST-" + java.util.UUID.randomUUID().toString())
                        .expiresAt(LocalDateTime.now().plusHours(24))
                        .isUsed(false)
                        .ipAddress("127.0.0.1")
                        .build());
            }

            // 35. USER SESSIONS
            if (userSessionRepository.count() == 0 && testUser != null) {
                userSessionRepository.save(UserSession.builder()
                        .user(testUser)
                        .sessionToken("SES-" + java.util.UUID.randomUUID().toString())
                        .deviceId("DEV-DESKTOP-01")
                        .deviceName("Windows PC (Chrome)")
                        .deviceType("DESKTOP")
                        .browser("Google Chrome 124.0")
                        .os("Windows 11 Pro")
                        .ipAddress("127.0.0.1")
                        .locationCity("Phnom Penh, KH")
                        .isActive(true)
                        .lastActiveAt(LocalDateTime.now())
                        .build());

                userSessionRepository.save(UserSession.builder()
                        .user(testUser)
                        .sessionToken("SES-" + java.util.UUID.randomUUID().toString())
                        .deviceId("DEV-MOBILE-02")
                        .deviceName("iPhone 15 Pro (Safari)")
                        .deviceType("MOBILE")
                        .browser("Mobile Safari 17.4")
                        .os("iOS 17.4")
                        .ipAddress("103.216.50.12")
                        .locationCity("Phnom Penh, KH")
                        .isActive(true)
                        .lastActiveAt(LocalDateTime.now().minusHours(3))
                        .build());
            }

            // 36. FAVORITES
            if (favoriteRepository.count() == 0 && testUser != null) {
                List<Product> prods = productRepository.findAll();
                if (!prods.isEmpty()) {
                    favoriteRepository.save(Favorite.builder()
                            .user(testUser)
                            .product(prods.get(0))
                            .build());
                    if (prods.size() > 1) {
                        favoriteRepository.save(Favorite.builder()
                                .user(testUser)
                                .product(prods.get(1))
                                .build());
                    }
                }
            }

            // 37. COUPON USAGES
            if (couponUsageRepository.count() == 0 && testUser != null && o1 != null) {
                Coupon coupon = couponRepository.findAll().stream().findFirst().orElse(null);
                if (coupon == null) {
                    coupon = couponRepository.save(Coupon.builder()
                            .code("SABYPRO2026")
                            .discountType("PERCENTAGE")
                            .discountValue(10.0)
                            .usageLimit(100)
                            .usedCount(1)
                            .active(true)
                            .endDate(LocalDateTime.now().plusMonths(6))
                            .build());
                }
                couponUsageRepository.save(CouponUsage.builder()
                        .coupon(coupon)
                        .user(testUser)
                        .order(o1)
                        .discountAmount(1.30)
                        .usedAt(LocalDateTime.now().minusDays(1))
                        .build());
            }

            // 38 & 39. DISPUTE MESSAGES & EVIDENCE
            if (disputeRepository.count() == 0 && o1 != null && testUser != null) {
                Dispute sampleDispute = Dispute.builder()
                        .order(o1)
                        .buyer(testUser)
                        .seller(admin)
                        .issueType("ACCOUNT_VOUCHER_PROBLEM")
                        .preferredSolution("REPLACEMENT")
                        .description("Login credentials expired 2 days before promised duration.")
                        .status(Dispute.DisputeStatus.OPEN)
                        .createdAt(LocalDateTime.now().minusHours(12))
                        .updatedAt(LocalDateTime.now().minusHours(12))
                        .build();
                sampleDispute = disputeRepository.save(sampleDispute);

                disputeMessageRepository.save(DisputeMessage.builder()
                        .dispute(sampleDispute)
                        .sender(testUser)
                        .senderRole("BUYER")
                        .message("Hello seller, can you help generate a replacement profile password?")
                        .build());

                disputeEvidenceRepository.save(DisputeEvidence.builder()
                        .dispute(sampleDispute)
                        .uploadedBy(testUser)
                        .fileUrl("https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600")
                        .fileType("IMAGE")
                        .fileName("error_screen.png")
                        .fileSizeBytes(145820L)
                        .description("Screenshot showing invalid password error prompt.")
                        .build());
            }

            // 40. ADMIN ACTIONS AUDIT
            if (adminActionRepository.count() == 0 && admin != null) {
                adminActionRepository.save(AdminAction.builder()
                        .admin(admin)
                        .actionType("SYSTEM_STARTUP")
                        .targetEntity("SYSTEM")
                        .targetId("SERVER-1")
                        .details("Antigravity 2.0 system initialized with 40 active tables and security hardening.")
                        .ipAddress("127.0.0.1")
                        .build());

                adminActionRepository.save(AdminAction.builder()
                        .admin(admin)
                        .actionType("UPDATE_COMMISSION")
                        .targetEntity("SELLER_COMMISSIONS")
                        .targetId("COMM-GLOBAL")
                        .details("Default seller platform commission confirmed at 5.0%.")
                        .ipAddress("127.0.0.1")
                        .build());

                adminActionRepository.save(AdminAction.builder()
                        .admin(admin)
                        .actionType("APPROVE_SETTLEMENT")
                        .targetEntity("PAYMENTS")
                        .targetId("SETTLE-20260816")
                        .details("Escrow batch reconciliation finalized for completed digital goods.")
                        .ipAddress("127.0.0.1")
                        .build());
            }

            log.info("Initialized demo records for all 18 new tables (23-40) successfully!");

        } catch (Exception e) {
            log.warn("Notice: Table seed completed with message: {}", e.getMessage());
        }
    }
}
