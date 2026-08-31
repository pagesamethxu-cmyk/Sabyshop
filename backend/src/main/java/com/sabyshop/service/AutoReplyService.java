package com.sabyshop.service;

import com.sabyshop.dto.AutoReplyDto;
import com.sabyshop.model.AutoReply;
import com.sabyshop.model.Order;
import com.sabyshop.model.OrderItem;
import com.sabyshop.model.OrderStatus;
import com.sabyshop.repository.AutoReplyRepository;
import com.sabyshop.repository.ChatMessageRepository;
import com.sabyshop.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AutoReplyService {

    private final AutoReplyRepository autoReplyRepository;
    private final OrderRepository orderRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final HuggingFaceAiService huggingFaceAiService;

    @Transactional(readOnly = true)
    public Optional<AutoReply> findMatchingAutoReply(String content) {
        if (content == null || content.trim().isEmpty()) {
            return Optional.empty();
        }

        String trimmed = content.trim();
        List<AutoReply> matches = autoReplyRepository.findMatchingReplies(trimmed);

        if (!matches.isEmpty()) {
            return matches.stream()
                    .max(Comparator.comparingInt(a -> a.getKeyword() != null ? a.getKeyword().length() : 0));
        }

        return autoReplyRepository.findByKeywordIgnoreCase("help")
                .or(() -> autoReplyRepository.findByKeywordIgnoreCase("support"))
                .or(() -> autoReplyRepository.findByKeywordIgnoreCase("សួស្តី"))
                .or(() -> autoReplyRepository.findAll().stream().findFirst());
    }

    public String generateSmartReply(String content, String preferredLang) {
        return generateSmartReplyForOrder(null, content, preferredLang);
    }

    /**
     * Dedicated Auto-Reply for Seller <-> Admin Support Channel (SELLER_ADMIN).
     * AI runs FIRST to intelligently understand seller needs, store plans, payouts, stock, and onboarding.
     */
    public String generateSellerAdminReply(Long orderId, String content, String preferredLang) {
        if (content == null || content.trim().isEmpty()) {
            return null;
        }

        String rawLower = content.toLowerCase().trim();
        boolean isKhmer = true;

        // 1. GREETING INTRO (pure greeting only)
        boolean isGreeting = rawLower.matches("^(hello|hi|hey|helo|holla|good morning|good afternoon|good evening|alo|សួស្តី|ជម្រាបសួរ|សួស្ដី)[!?. ]*$")
                || rawLower.equals("hello") || rawLower.equals("hi") || rawLower.equals("សួស្តី") || rawLower.equals("ជម្រាបសួរ") || rawLower.equals("សួស្ដី");

        if (isGreeting) {
            if (isKhmer) {
                return "ជម្រាបសួរលោកអ្នកលក់! SAKU (Seller Support) នៅទីនេះដើម្បីជួយសម្រួលរាល់កិច្ចការហាងរបស់អ្នក (Store Plans, ការដកប្រាក់, បញ្ចូលស្តុក)។ តើខ្ញុំអាចជួយអ្វីបានខ្លះ?";
            } else {
                return "Hello Seller! I am SAKU (Seller Support Assistant). I am here to assist you with Store Plans, Payouts & Withdrawals, Stock Management, and Buyer Disputes. How may I help you today?";
            }
        }

        // 2. PURE CONFIRMATION / THANK YOU (exact short matches only)
        boolean isConfirmation = rawLower.equals("yes") || rawLower.equals("ok") || rawLower.equals("okay")
                || rawLower.equals("thank you") || rawLower.equals("thanks") || rawLower.equals("done")
                || rawLower.equals("resolved") || rawLower.equals("good") || rawLower.equals("noted")
                || rawLower.equals("ok thanks") || rawLower.equals("yes thanks") || rawLower.equals("ok thank you")
                || rawLower.equals("បាទ") || rawLower.equals("ចាស") || rawLower.equals("អរគុណ") || rawLower.equals("បានហើយ")
                || (rawLower.length() < 15 && (rawLower.contains("thank") || rawLower.contains("អរគុណ")));

        if (isConfirmation) {
            if (isKhmer) {
                return "សូមអរគុណសម្រាប់ការបញ្ជាក់, បង! ប្រសិនបើបងមានសំណួរផ្សេងទៀត ឬត្រូវការជំនួយបន្ថែមទាក់ទងនឹងការលក់នៅលើ SABY SHOP សូមកុំស្ទាក់ស្ទើរក្នុងការសួរ។ ពួកយើងនៅទីនេះដើម្បីជួយបងជានិច្ច!";
            } else {
                return "Thank you for confirming! If you have any other questions or need further assistance with selling on SABY SHOP, feel free to ask. We're here to help you anytime!";
            }
        }

        // ================================================================
        // STEP 1: AI FIRST -- Deep analytical thinking & step-by-step resolution
        // ================================================================
        String sellerTrimmed = content.trim();
        String sellerCategory = detectProblemCategory(content);
        try {
            String sellerContext = sellerTrimmed
                    + "\n\n[SELLER SUPPORT CONTEXT]"
                    + "\nChannel: SELLER ADMIN (Seller talking to SAKU support bot)"
                    + "\nPlatform: Saby Shop -- Cambodian digital subscription marketplace"
                    + "\nSeller Plans: Starter $2.50/mo (10 products, basic analytics), Pro $4.50/mo (unlimited products, priority delivery, analytics dashboard), VIP $6.00/mo (instant payouts, featured store, dedicated support)"
                    + "\nPayout/Withdrawal: Minimum $5.00 via KHQR/Bakong/ABA. Processing under 24h (VIP: instant). Go to Seller Dashboard > Withdrawals."
                    + "\nStock Format: email:password or email:password|pin -- one account per line. Bulk CSV supported. Auto-delivery on payment."
                    + "\nDispute Process: If buyer complains -- verify stock credentials -> deliver replacement if genuine issue -> submit dispute evidence if invalid claim -> Admin mediates."
                    + "\nDetected Problem Category: " + (sellerCategory != null ? sellerCategory : "GENERAL")
                    + "\n\n[AI INSTRUCTION] Follow the 6-phase thinking protocol:"
                    + "\n1. Understand what the seller is asking."
                    + "\n2. Identify the root cause or required info."
                    + "\n3. Make autonomous decision ([DECISION: Self-Fix] / [DECISION: Issue Replacement] / [DECISION: Escalate to Admin])."
                    + "\n4. Provide clear, numbered step-by-step guidance."
                    + "\n5. Explain the expected outcome."
                    + "\n6. Reply in " + (isKhmer ? "Khmer" : "English") + " with polite and helpful tone.";

            String aiReply = huggingFaceAiService.generateAiReply(sellerContext, preferredLang, sellerCategory);
            if (aiReply != null && !aiReply.isBlank()) {
                log.info("Seller AI response generated successfully for category: {}", sellerCategory);
                return aiReply;
            }
        } catch (Exception e) {
            log.warn("Seller AI unavailable, falling back to rule-based handlers: {}", e.getMessage());
        }

        // ================================================================
        // STEP 2: HARDCODED FALLBACKS (only reached if AI is offline)
        // ================================================================

        // 3. SELLER ONBOARDING & HOW TO SELL GUIDE
        boolean isOnboardingQuery = rawLower.contains("how do i sell") || rawLower.contains("how to sell") ||
                rawLower.contains("start sell") || rawLower.contains("start selling") || rawLower.contains("become seller") ||
                rawLower.contains("open store") || rawLower.contains("create store") || rawLower.contains("onboard") ||
                rawLower.contains("register store") || rawLower.contains("how to register") || rawLower.contains("ekyc") ||
                rawLower.contains("របៀបលក់") || rawLower.contains("ចង់លក់") || rawLower.contains("បើកហាង") ||
                rawLower.contains("ចុះឈ្មោះលក់") || rawLower.contains("របៀបចុះឈ្មោះ") || rawLower.contains("របៀបបង្កើតហាង");

        if (isOnboardingQuery) {
            if (isKhmer) {
                return "ជម្រាបសួរ បង! នេះជាជំហានលម្អិតក្នុងការចាប់ផ្ដើមលក់នៅលើ SABY SHOP ៖\n\n" +
                        "1. ចុះឈ្មោះគណនី SABY Account (ប្រើ Email និងលេខទូរស័ព្ទ)\n" +
                        "2. ចូលទៅកាន់ 'Seller Onboarding' ក្នុងផ្ទាំង Dashboard\n" +
                        "3. បំពេញព័ត៌មានហាង (ឈ្មោះហាង, ឡូហ្គោ, និងការពិពណ៌នា)\n" +
                        "4. ភ្ជាប់គណនី Bakong KHQR ដើម្បីទទួលប្រាក់ចំណូល\n" +
                        "5. ជ្រើសរើស Store Plan (Starter $2.50, Pro $4.50, VIP $6.00/ខែ)\n" +
                        "6. Upload Stock ឌីជីថលរបស់អ្នក (email:password) នោះប្រព័ន្ធ Auto-Delivery នឹងរៀបចំជូនភ្លាមៗ!\n\n" +
                        "ប្រសិនបើមានចម្ងល់ត្រង់ចំណុចណា សូមទាក់ទងមកកាន់ Telegram Support @saby_shop_support បានគ្រប់ពេល!";
            } else {
                return "Hello Seller! Here is the complete step-by-step onboarding guide to sell on SABY SHOP:\n\n" +
                        "1. Register a SABY Account (with your email & phone)\n" +
                        "2. Navigate to 'Seller Onboarding' from your user dashboard\n" +
                        "3. Fill in your Store Profile (Store Name, Logo, and Description)\n" +
                        "4. Link your Bakong KHQR account to receive payouts\n" +
                        "5. Select your Store Subscription Plan (Starter $2.50, Pro $4.50, VIP $6.00/mo)\n" +
                        "6. Upload your digital product stock (email:password format) for instant Auto-Delivery!\n\n" +
                        "For personalized assistance, feel free to reach out via Telegram @saby_shop_support anytime!";
            }
        }

        // 4. STORE SUBSCRIPTION PLANS
        boolean isPlanQuery = rawLower.contains("plan") || rawLower.contains("pricing") || rawLower.contains("price") ||
                rawLower.contains("starter") || rawLower.contains("pro") || rawLower.contains("vip") ||
                rawLower.contains("fee") || rawLower.contains("cost") || rawLower.contains("subscription") ||
                rawLower.contains("តម្លៃ") || rawLower.contains("គម្រោង") || rawLower.contains("ថ្លៃសេវា") ||
                rawLower.contains("គម្រោងហាង");

        if (isPlanQuery) {
            if (isKhmer) {
                return "ជម្រាបសួរ បង! នេះជាព័ត៌មានលម្អិតអំពីគម្រោង Store Subscription Plans នៅលើ Saby Shop ៖\n\n" +
                        "Starter Plan -- $2.50 / ខែ\n" +
                        "- ដាក់លក់បានរហូតដល់ 10 មុខទំនិញ\n" +
                        "- ប្រព័ន្ធផ្ញើទំនិញស្វ័យប្រវត្តិ (Auto-Delivery)\n" +
                        "- ផ្ទាំងគ្រប់គ្រងការលក់កម្រិតមូលដ្ឋាន\n\n" +
                        "Pro Plan -- $4.50 / ខែ (ពេញនិយមបំផុត)\n" +
                        "- ដាក់លក់ទំនិញបានមិនកំណត់ (Unlimited Products)\n" +
                        "- ប្រព័ន្ធផ្ញើទំនិញលឿនបំផុត (Priority Auto-Delivery)\n" +
                        "- ផ្ទាំងវិភាគទិន្នន័យការលក់កម្រិតខ្ពស់ (Analytics Dashboard)\n" +
                        "- ស្លាកសម្គាល់ 'Verified Store Badge'\n\n" +
                        "VIP Plan -- $6.00 / ខែ\n" +
                        "- អត្ថប្រយោជន៍ទាំងអស់របស់ Pro Plan\n" +
                        "- ដាក់បង្ហាញហាងនៅទំព័រមុខគេ (Featured Store Placement)\n" +
                        "- ដំណើរការដកប្រាក់ចំណូលបានភ្លាមៗ (Instant Payout Approval)\n" +
                        "- ជំនួយការគាំទ្រពិសេស 24/7 (Dedicated VIP Support)\n\n" +
                        "លោកអ្នកអាចធ្វើការ Upgrade គម្រោងបានគ្រប់ពេលនៅក្នុង Seller Dashboard > Store Settings!";
            } else {
                return "Hello Seller! Here are the details of our Store Subscription Plans on Saby Shop:\n\n" +
                        "Starter Plan -- $2.50 / month\n" +
                        "- Up to 10 active product listings\n" +
                        "- Standard Auto-Delivery system\n" +
                        "- Basic sales dashboard & order history\n\n" +
                        "Pro Plan -- $4.50 / month (Most Popular)\n" +
                        "- Unlimited product listings\n" +
                        "- Priority Auto-Delivery queue\n" +
                        "- Advanced sales analytics & export tools\n" +
                        "- 'Verified Store' trust badge\n\n" +
                        "VIP Plan -- $6.00 / month\n" +
                        "- All Pro Plan features included\n" +
                        "- Featured store placement on homepage\n" +
                        "- Instant payout processing (under 1 hour)\n" +
                        "- Dedicated 24/7 VIP priority support manager\n\n" +
                        "You can upgrade your store plan anytime in Seller Dashboard > Store Settings!";
            }
        }

        // 5. BUYER DISPUTES & ORDER RESOLUTION
        boolean isDisputeQuery = rawLower.contains("dispute") || rawLower.contains("buyer complaint") ||
                rawLower.contains("buyer problem") || rawLower.contains("buyer issue") || rawLower.contains("wrong stock") ||
                rawLower.contains("replacement") || rawLower.contains("complain") || rawLower.contains("report") ||
                rawLower.contains("អតិថិជន") || rawLower.contains("បញ្ហាអ្នកទិញ") || rawLower.contains("វិវាទ") ||
                rawLower.contains("ដោះស្រាយ");

        if (isDisputeQuery) {
            if (isKhmer) {
                return "ជម្រាបសួរលោកអ្នកលក់! ប្រសិនបើលោកអ្នកកំពុងជួបបញ្ហាវិវាទ ឬការត្អូញត្អែរពីអ្នកទិញ ៖\n\n" +
                        "ជំហានដោះស្រាយជាក់ស្ដែង ៖\n" +
                        "១. ពិនិត្យបញ្ជីស្តុក ៖ ពិនិត្យមើល Account Email & Password ដែលបានប្រគល់ជូនថាត្រឹមត្រូវ និងដំណើរការធម្មតាដែរឬទេ\n" +
                        "២. ប្រគល់ស្តុកជំនួស ៖ ប្រសិនបើ Account ពិតជាមានបញ្ហាមែន សូមចុច 'Deliver Replacement' ក្នុងផ្ទាំងគ្រប់គ្រងការបញ្ជាទិញ\n" +
                        "៣. ដាក់ភស្តុតាងវិវាទ ៖ ប្រសិនបើអ្នកទិញទាមទារខុស សូមចូល Seller Dashboard > Disputes រួច Upload Screenshot បង្ហាញពីស្ថានភាព Account\n" +
                        "៤. Admin កាត់ក្ដី ៖ ក្រុមការងារ Admin នឹងពិនិត្យ System Logs ដើម្បីធានានូវយុត្តិធម៌សម្រាប់អ្នកលក់!\n\n" +
                        "ប្រសិនបើត្រូវការជំនួយបន្ទាន់ សូមផ្ញើលេខ Order ID មកកាន់ Telegram @saby_shop_support!";
            } else {
                return "Hello Seller! If you are facing an issue with a buyer or order dispute:\n\n" +
                        "Step-by-Step Resolution Guide:\n" +
                        "1. Verify Stock Credentials: Check whether the delivered email and password are active and correct.\n" +
                        "2. Deliver Replacement: If there is a genuine issue, click 'Deliver Replacement' in order management.\n" +
                        "3. Submit Dispute Evidence: If the claim is invalid, submit screenshots in Seller Dashboard > Disputes.\n" +
                        "4. Admin Mediation: Saby Admin support will review audit logs to mediate fairly.\n\n" +
                        "For urgent assistance, please provide the Order ID or reach out via Telegram @saby_shop_support!";
            }
        }

        // 6. WITHDRAWAL & PAYOUT INQUIRIES
        boolean isWithdrawQuery = rawLower.contains("withdraw") || rawLower.contains("payout") ||
                rawLower.contains("balance") || rawLower.contains("money") || rawLower.contains("earn") ||
                rawLower.contains("cash out") || rawLower.contains("ដកប្រាក់") || rawLower.contains("ដកលុយ") ||
                rawLower.contains("ដកប្រាក់ចំណូល") || rawLower.contains("ចំណូល") || rawLower.contains("ប្រាក់ចំណូល");

        if (isWithdrawQuery) {
            if (isKhmer) {
                return "ជម្រាបសួរលោកអ្នកលក់! នេះជាព័ត៌មានស្ដីពីការដកប្រាក់ចំណូលនៅលើ Saby Shop ៖\n\n" +
                        "• ចំនួនទឹកប្រាក់ដកអប្បបរមា ៖ $5.00\n" +
                        "• វិធីសាស្រ្តទូទាត់ ៖ ផ្ទេរផ្ទាល់តាមរយៈ KHQR / Bakong / ABA Bank\n" +
                        "• រយៈពេលដំណើរការ ៖ ក្រោម 24 ម៉ោង (VIP ដកបានភ្លាមៗ Instant)\n\n" +
                        "របៀបស្នើសុំដកប្រាក់ ៖ ចូលទៅកាន់ Seller Dashboard > Withdrawals រួចបញ្ចូលចំនួនទឹកប្រាក់ និងដាក់រូប QR KHQR របស់អ្នក!";
            } else {
                return "Hello Seller! Here is the payout & withdrawal policy for Saby Shop:\n\n" +
                        "• Minimum Withdrawal Amount: $5.00\n" +
                        "• Payout Methods: Direct transfer via KHQR / Bakong / ABA Bank\n" +
                        "• Processing Time: Under 24 hours (Instant for VIP stores)\n\n" +
                        "To request a payout, navigate to Seller Dashboard > Withdrawals, enter the amount, and submit your KHQR QR code!";
            }
        }

        // 7. STOCK & PRODUCT LISTING INQUIRIES
        boolean isStockQuery = rawLower.contains("stock") || rawLower.contains("add product") ||
                rawLower.contains("upload") || rawLower.contains("product") || rawLower.contains("format") ||
                rawLower.contains("ស្តុក") || rawLower.contains("បញ្ចូលស្តុក") || rawLower.contains("ដាក់ទំនិញ") ||
                rawLower.contains("របៀបដាក់ស្តុក");

        if (isStockQuery) {
            if (isKhmer) {
                return "ជម្រាបសួរលោកអ្នកលក់! នេះជាការណែនាំអំពីការគ្រប់គ្រងស្តុក ៖\n\n" +
                        "• ទម្រង់ Upload ស្តុក ៖ ដាក់ជា 'email:password' ឬ 'email:password|pin' (១ Account ក្នុង ១ ជួរ)\n" +
                        "• ប្រព័ន្ធ Auto-Delivery ៖ ប្រព័ន្ធនឹងប្រគល់ទំនិញជូនអ្នកទិញដោយស្វ័យប្រវត្តពេលទូទាត់រួច\n" +
                        "• ការជូនដំណឹងស្តុកទាប ៖ ប្រព័ន្ធនឹង Alert ពេលស្តុករបស់អ្នកជិតអស់\n\n" +
                        "ចូលទៅកាន់ Seller Dashboard > Products > Add Stock ដើម្បីបញ្ចូលស្តុកថ្មី!";
            } else {
                return "Hello Seller! Stock management guide:\n\n" +
                        "• Upload Format: 'email:password' or 'email:password|pin' (one account per line)\n" +
                        "• Bulk Upload: Supported via CSV or multi-line text\n" +
                        "• Auto-Delivery: System delivers credentials automatically upon payment\n" +
                        "• Low Stock Alert: You will receive an alert when stock runs low\n\n" +
                        "Navigate to Seller Dashboard > Products > Add Stock to upload new inventory!";
            }
        }

        // 8. Ultimate fallback if all hardcoded checks failed and AI is offline
        return isKhmer
                ? "ជម្រាបសួរ! ក្រុមការងារ Saby Shop នឹងជួយដោះស្រាយជូន។ សូមទាក់ទងតាម Telegram @saby_shop_support!"
                : "Hello Seller! Our team will assist you. Contact Telegram @saby_shop_support for urgent issues!";
    }

    /**
     * Generates an intelligent AI-first reply for buyer messages linked to an order.
     * AI runs first with full context; hardcoded rules serve only as offline fallbacks.
     */
    public String generateSmartReplyForOrder(Long orderId, String content, String preferredLang) {
        if (content == null || content.trim().isEmpty()) return null;

        String rawLower = content.toLowerCase().trim();
        boolean isKhmer = true;

        // 1. GENERAL GREETING (pure greeting only)
        boolean isGreeting = rawLower.matches("^(hello|hi|hey|helo|holla|good morning|good afternoon|good evening|alo|សួស្តី|ជម្រាបសួរ|សួស្ដី)[!?. ]*$")
                || rawLower.equals("hello") || rawLower.equals("hi") || rawLower.equals("សួស្តី") || rawLower.equals("ជម្រាបសួរ") || rawLower.equals("សួស្ដី");

        if (isGreeting) {
            if (isKhmer) {
                return "ជម្រាបសួរ បង! តើខ្ញុំអាចជួយដោះស្រាយបញ្ហាអ្វីជូនបងបានដែរ?";
            } else {
                return "Hello! How can I assist you today?";
            }
        }

        // 2. PURE CONFIRMATION / THANK YOU (exact short matches only)
        boolean isPureConfirmation = (rawLower.equals("yes") || rawLower.equals("ok") || rawLower.equals("okay")
                || rawLower.equals("thank you") || rawLower.equals("thanks") || rawLower.equals("done")
                || rawLower.equals("បាទ") || rawLower.equals("ចាស") || rawLower.equals("អរគុណ") || rawLower.equals("បានហើយ"))
                || (rawLower.length() < 15 && (rawLower.contains("អរគុណ") || rawLower.contains("thank")));

        if (isPureConfirmation) {
            if (isKhmer) {
                return "សូមអរគុណសម្រាប់ការបញ្ជាក់, បង! ប្រសិនបើបងមានសំណួរផ្សេងទៀត ឬត្រូវការជំនួយបន្ថែម សូមកុំស្ទាក់ស្ទើរក្នុងការសួរ។ ពួកយើងនៅទីនេះដើម្បីជួយបងជានិច្ច!";
            } else {
                return "Thank you! If you have any other questions or need further assistance, feel free to ask anytime. We are here to help!";
            }
        }

        // Load order from DB -- needed for AI context
        Order order = null;
        if (orderId != null && orderId > 0) {
            order = orderRepository.findById(orderId).orElse(null);
        }

        String trimmed = content.trim();
        String problemCategory = detectProblemCategory(content);

        // ================================================================
        // STEP 1: AI FIRST -- Let AI analyze and solve ANY problem intelligently
        // AI receives full context: order, product, history, masked creds.
        // ================================================================
        try {
            String credentialHint = "";
            String productDeliveryHint = "";
            String promptContext;

            if (order != null) {
                String prodName = (order.getItems() != null && !order.getItems().isEmpty() && order.getItems().get(0).getProduct() != null)
                        ? order.getItems().get(0).getProduct().getName() : "Digital Product";
                String buyTime = order.getCreatedAt() != null
                        ? order.getCreatedAt().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                        : "Unknown";

                String deliveryAgeHint = "";
                if (order.getCreatedAt() != null) {
                    long hoursOld = java.time.Duration.between(order.getCreatedAt(), java.time.LocalDateTime.now()).toHours();
                    deliveryAgeHint = ", Order Age: " + hoursOld + " hours ago (warranty period: 720 hours / 30 days)";
                }

                if (order.getItems() != null) {
                    for (OrderItem item : order.getItems()) {
                        if (item.getStockItem() != null && item.getStockItem().getAccountEmail() != null) {
                            String rawEmail = item.getStockItem().getAccountEmail();
                            int atIdx = rawEmail.indexOf('@');
                            String maskedEmail = atIdx > 1
                                    ? rawEmail.substring(0, 2) + "****" + rawEmail.substring(atIdx)
                                    : "****";
                            credentialHint = ", Delivered Account Email (masked for privacy): " + maskedEmail
                                    + ", Password: DELIVERED (YES)"
                                    + ", NOTE: Do NOT include this email in your reply -- say 'the account email from your order' instead.";
                            productDeliveryHint = ", Delivery Status: Account credentials were successfully delivered to the buyer.";
                            break;
                        }
                    }
                }

                String dbHistoryStr = "";
                try {
                    var recentMsgs = chatMessageRepository.findByOrderIdOrderByCreatedAtAsc(orderId);
                    if (recentMsgs != null && !recentMsgs.isEmpty()) {
                        var lastMsgs = recentMsgs.size() > 12 ? recentMsgs.subList(recentMsgs.size() - 12, recentMsgs.size()) : recentMsgs;
                        dbHistoryStr = "\n[CONVERSATION HISTORY (last " + lastMsgs.size() + " messages)]:\n"
                                + lastMsgs.stream()
                                .map(m -> (m.getSenderRole() != null ? m.getSenderRole() : "USER") + ": " + m.getContent())
                                .collect(Collectors.joining("\n"));
                    }
                } catch (Exception ignored) {}

                String productType = detectProductType(prodName);

                promptContext = trimmed
                        + "\n\n[ORDER CONTEXT FROM SABY SHOP DATABASE]"
                        + "\nOrder ID: #" + order.getId()
                        + ", Product Name: " + prodName
                        + ", Product Type: " + productType
                        + ", Order Status: " + order.getStatus()
                        + ", Purchase Time: " + buyTime
                        + deliveryAgeHint
                        + credentialHint
                        + productDeliveryHint
                        + "\nDetected Problem Category: " + (problemCategory != null ? problemCategory : "GENERAL")
                        + dbHistoryStr
                        + "\n\n[AI INSTRUCTION] Follow the 6-phase thinking protocol:"
                        + "\n1. Understand what the user is experiencing."
                        + "\n2. Identify the root cause for this product type (" + productType + ")."
                        + "\n3. Make autonomous decision ([DECISION: Self-Fix] / [DECISION: Issue Replacement] / [DECISION: Escalate to Admin])."
                        + "\n4. Provide clear, numbered step-by-step guidance explaining WHY each step is done."
                        + "\n5. Explain expected result and mention Saby Shop full warranty."
                        + "\n6. Reply in " + (isKhmer ? "Khmer" : "English") + " with empathetic and helpful tone.";
            } else {
                promptContext = trimmed
                        + "\n\n[DATABASE CONTEXT: General user inquiry, no active order ID]"
                        + "\nDetected Problem Category: " + (problemCategory != null ? problemCategory : "GENERAL")
                        + "\n\n[AI INSTRUCTION] Follow the 6-phase thinking protocol:"
                        + "\n1. Understand what the user is asking."
                        + "\n2. Identify the root cause or required info."
                        + "\n3. Make autonomous decision."
                        + "\n4. Provide clear, numbered step-by-step guidance."
                        + "\n5. Explain expected outcome."
                        + "\n6. Reply in " + (isKhmer ? "Khmer" : "English") + " with polite and helpful tone.";
            }

            String aiResponse = huggingFaceAiService.generateAiReply(promptContext, preferredLang, problemCategory);
            if (aiResponse != null && !aiResponse.isBlank()) {
                log.info("AI primary response generated for query [category={}]: {}", problemCategory, trimmed.substring(0, Math.min(60, trimmed.length())));
                return aiResponse;
            }
        } catch (Exception e) {
            log.warn("HuggingFace AI unavailable, falling through to rule-based fallbacks: {}", e.getMessage());
        }

        // ================================================================
        // STEP 2: FALLBACK RULES -- Only reached if AI is offline/fails
        // ================================================================

        // Problem with seller / dispute / complaint / replacement fallback
        if ((rawLower.contains("seller") && (rawLower.contains("problem") || rawLower.contains("issue") || rawLower.contains("wrong") || rawLower.contains("defect") || rawLower.contains("fake") || rawLower.contains("scam") || rawLower.contains("help") || rawLower.contains("contact") || rawLower.contains("what") || rawLower.contains("need") || rawLower.contains("report") || rawLower.contains("dispute") || rawLower.contains("replace") || rawLower.contains("not working") || rawLower.contains("not reply"))) ||
                rawLower.contains("dispute") || rawLower.contains("report issue") || rawLower.contains("complain") || rawLower.contains("replacement") || rawLower.contains("refund") ||
                rawLower.contains("បញ្ហាអ្នកលក់") || rawLower.contains("មានបញ្ហាជាមួយអ្នកលក់") || rawLower.contains("អ្នកលក់មិនឆ្លើយ") ||
                rawLower.contains("ខូច") || rawLower.contains("វិវាទ") || rawLower.contains("ប្តឹង") || rawLower.contains("ប្ដឹង") || rawLower.contains("ប្តូរ") || rawLower.contains("សងលុយ")) {
            if (isKhmer) {
                return "ប្រសិនបើបងមានបញ្ហាជាមួយអ្នកលក់ (គណនីខុស, ខូច, ឬផុតកំណត់មុនថ្ងៃ) សូមអនុវត្តតាមជំហាន 4 ដូចខាងក្រោម ៖\n\n" +
                        "1. ពិនិត្យទំព័រ Order ៖ ចូលទៅកាន់ Orders រួចពិនិត្យមើល Email និងលេខសម្ងាត់ដែលទទួលបាន\n" +
                        "2. Chat ផ្ទាល់ជាមួយអ្នកលក់ ៖ ចុចប៊ូតុង \"Chat with Seller\" លើ Order ដើម្បីស្នើសុំប្ដូរ Account ថ្មីភ្លាមៗ\n" +
                        "3. បើកពាក្យបណ្ដឹងវិវាទ (Open Dispute) ៖ ប្រសិនបើអ្នកលក់មិនឆ្លើយតបលើសពី 24 ម៉ោង សូមចុច \"Open Dispute\" ឬ \"Report Issue\"\n" +
                        "4. ការការពារពី Saby Shop ៖ Admin នឹងពិនិត្យ System Logs ដើម្បីកាត់ក្ដីយុត្តិធម៌ និងប្ដូរទំនិញថ្មី ឬសងប្រាក់ជូនបងវិញ ១០០%!\n\n" +
                        "ប្រសិនបើត្រូវការជំនួយបន្ទាន់ សូមទាក់ទងមកកាន់ Telegram Support @saby_shop_support!";
            } else {
                return "If you have an issue with a seller (wrong credentials, defective account, or expired warranty), please follow these 4 steps:\n\n" +
                        "1. Check Orders Page: Go to your Orders page to verify delivered credentials.\n" +
                        "2. Chat with Seller: Click \"Chat with Seller\" on your order to request an immediate replacement.\n" +
                        "3. Open a Dispute: If the seller does not respond within 24 hours, click \"Open Dispute\" or \"Report Issue\" in your order details.\n" +
                        "4. Saby Shop Guarantee: Saby Admin will mediate and issue a free replacement or 100% full refund.\n\n" +
                        "For urgent help, contact our Telegram Support @saby_shop_support!";
            }
        }

        // Canva Team Link error fallback
        String contentLower = content.toLowerCase();
        if (contentLower.contains("canva") && (contentLower.contains("link") || contentLower.contains("team") || contentLower.contains("invite") || contentLower.contains("error") || contentLower.contains("expired") || contentLower.contains("ផុតកំណត់") || contentLower.contains("កានវ៉ា"))) {
            Long oId = order != null ? order.getId() : 0L;
            if (isKhmer) {
                return "ជម្រាបសួរ បង! ស្ដីពីបញ្ហា Canva Team Link Error" + (oId > 0 ? " លើ Order #" + oId : "") + " -- Link Invite របស់ Canva មានសុពលភាពកំណត់ត្រឹម 7 ថ្ងៃ (ជាប្រព័ន្ធរបស់ Canva ផ្ទាល់ មិនមែនបញ្ហារបស់ Saby Shop ទេ)។\n\nសូមផ្ញើ Email គណនី Canva របស់បងមកកាន់ Telegram Support (https://t.me/saby_shop_support) ដើម្បីឱ្យក្រុមការងារបច្ចេកទេសចេញ Link Invite ថ្មី ឬ Add បងចូល Team ផ្ទាល់តែម្ដង!";
            } else {
                return "Hello! Regarding the Canva Team Link error" + (oId > 0 ? " on Order #" + oId : "") + " -- Canva invite links auto-expire after 7 days (Canva platform limitation). Please send your Canva account email to our Telegram Support (https://t.me/saby_shop_support) to receive a fresh invite link!";
            }
        }

        // Onboarding fallback
        if (rawLower.contains("how to sell") || rawLower.contains("become seller") || rawLower.contains("open store") || rawLower.contains("របៀបលក់") || rawLower.contains("ចង់លក់")) {
            if (isKhmer) {
                return "របៀបចាប់ផ្ដើមលក់នៅលើ Saby Shop ៖\n\n1. ចុះឈ្មោះ SABY Account\n2. ចូល Seller Onboarding\n3. បំពេញព័ត៌មានហាង\n4. ភ្ជាប់ Bakong KHQR\n5. ជ្រើសរើស Plan (Starter $2.50, Pro $4.50, VIP $6.00/ខែ)\n6. Upload Stock -- Auto-Delivery ដំណើរការភ្លាមៗ!";
            } else {
                return "To start selling on Saby Shop:\n\n1. Register an account.\n2. Go to Seller Onboarding.\n3. Fill in store details.\n4. Link Bakong KHQR payout.\n5. Choose plan (Starter $2.50/mo, Pro $4.50/mo, VIP $6.00/mo).\n6. Upload stock -- auto-delivery handles the rest!";
            }
        }

        // How-to-buy fallback
        if ((rawLower.contains("how to buy") || rawLower.contains("how to order") || rawLower.contains("how to pay") || rawLower.contains("របៀបទិញ") || rawLower.contains("ទិញយ៉ាងម៉េច")) && (orderId == null || orderId == 0)) {
            if (isKhmer) {
                return "របៀបទិញនៅលើ Saby Shop ៖\n\n1. ជ្រើសរើស Product\n2. ចុច Buy Now > Checkout\n3. Scan KHQR\n4. គណនី និងលេខសម្ងាត់ នឹងប្រគល់ជូនភ្លាមៗ!";
            } else {
                return "To buy on Saby Shop:\n\n1. Browse and select your product.\n2. Click Buy Now and proceed to Checkout.\n3. Scan the KHQR code with any Cambodian bank app.\n4. Your credentials are delivered instantly!";
            }
        }

        // Order status + credential display fallback (only if AI failed)
        if (order != null) {
            String prodName = (order.getItems() != null && !order.getItems().isEmpty() && order.getItems().get(0).getProduct() != null)
                    ? order.getItems().get(0).getProduct().getName() : "Digital Product";

            if (order.getStatus() == OrderStatus.CANCELLED) {
                return isKhmer
                        ? "ការបញ្ជាទិញលេខ #" + order.getId() + " (" + prodName + ") ត្រូវបាន CANCELLED។ ប្រសិនបើចង់ទិញឡើងវិញ សូមចុច Buy Now ដើម្បីកុម្ម៉ង់ថ្មី។"
                        : "Order #" + order.getId() + " (" + prodName + ") is CANCELLED. To repurchase, please click Buy Now and place a new order.";
            }

            if (order.getStatus() == OrderStatus.COMPLETED) {
                String email = null, pass = null;
                if (order.getItems() != null) {
                    for (OrderItem item : order.getItems()) {
                        if (item.getStockItem() != null && item.getStockItem().getAccountEmail() != null) {
                            email = item.getStockItem().getAccountEmail();
                            pass = item.getStockItem().getAccountPassword();
                            break;
                        }
                    }
                }
                if (email != null && !email.isBlank()) {
                    return isKhmer
                            ? "ការបញ្ជាទិញលេខ #" + order.getId() + " (" + prodName + ") ទទួលបានជោគជ័យ (COMPLETED)៖\nEmail: " + email + "\nPassword: " + (pass != null ? pass : "******") + "\nប្រសិនបើមានបញ្ហាសូមទាក់ទង Telegram: https://t.me/saby_shop_support"
                            : "Order #" + order.getId() + " (" + prodName + ") is COMPLETED.\nEmail: " + email + "\nPassword: " + (pass != null ? pass : "******") + "\nIf you still face issues contact: https://t.me/saby_shop_support";
                }
            }

            if (order.getStatus() == OrderStatus.PENDING || order.getStatus() == OrderStatus.PROCESSING) {
                return isKhmer
                        ? "ការបញ្ជាទិញលេខ #" + order.getId() + " (" + prodName + ") កំពុងរង់ចាំការទូទាត់ (PENDING)។ សូមស្កេន KHQR ដើម្បីទទួលបាន Credentials ភ្លាមៗ!"
                        : "Order #" + order.getId() + " (" + prodName + ") is PENDING PAYMENT. Please complete payment via KHQR to receive your credentials.";
            }
        }

        // Secondary fallback to database keyword rules if AI is offline
        List<AutoReply> matches = autoReplyRepository.findMatchingReplies(trimmed);
        if (!matches.isEmpty()) {
            AutoReply bestMatch = matches.stream()
                    .max(Comparator.comparingInt(a -> a.getKeyword() != null ? a.getKeyword().length() : 0))
                    .orElse(null);
            if (bestMatch != null) {
                return getFormattedReply(bestMatch, preferredLang);
            }
        }

        // Ultimate fallback
        AutoReply fallback = autoReplyRepository.findByKeywordIgnoreCase("help")
                .or(() -> autoReplyRepository.findByKeywordIgnoreCase("support"))
                .or(() -> autoReplyRepository.findByKeywordIgnoreCase("សួស្តី"))
                .or(() -> autoReplyRepository.findAll().stream().findFirst())
                .orElse(null);

        String fallbackReply = getFormattedReply(fallback, preferredLang);
        if (fallbackReply != null && !fallbackReply.isBlank()) {
            return fallbackReply;
        }

        if ("en".equalsIgnoreCase(preferredLang) || "english".equalsIgnoreCase(preferredLang)) {
            return "Hello! Thank you for contacting Saby Shop Support. We have received your message and will assist you shortly!";
        }
        return "ជម្រាបសួរ បង! សូមអរគុណសម្រាប់ការទាក់ទងមកកាន់ Saby Shop Support។ ក្រុមការងារនឹងជួយដោះស្រាយជូនបងភ្លាមៗ!";
    }

    public String getFormattedReply(AutoReply autoReply, String preferredLang) {
        if (autoReply == null) return null;

        boolean isKhmer = "kh".equalsIgnoreCase(preferredLang) || "km".equalsIgnoreCase(preferredLang) || "khmer".equalsIgnoreCase(preferredLang) || preferredLang == null;
        boolean isEnglish = "en".equalsIgnoreCase(preferredLang) || "english".equalsIgnoreCase(preferredLang);

        if (isKhmer && autoReply.getReplyKh() != null && !autoReply.getReplyKh().isBlank()) {
            return autoReply.getReplyKh();
        }
        if (isEnglish && autoReply.getReplyEn() != null && !autoReply.getReplyEn().isBlank()) {
            return autoReply.getReplyEn();
        }

        if (autoReply.getReplyKh() != null && autoReply.getReplyEn() != null) {
            return autoReply.getReplyKh() + "\n\n" + autoReply.getReplyEn();
        } else if (autoReply.getReplyKh() != null) {
            return autoReply.getReplyKh();
        } else {
            return autoReply.getReplyEn();
        }
    }

    @Transactional(readOnly = true)
    public List<AutoReplyDto> getAllAutoReplies() {
        return autoReplyRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AutoReplyDto getAutoReplyById(Long id) {
        AutoReply autoReply = autoReplyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("AutoReply not found with id: " + id));
        return toDto(autoReply);
    }

    @Transactional
    public AutoReplyDto createAutoReply(AutoReplyDto dto) {
        AutoReply entity = AutoReply.builder()
                .keyword(dto.getKeyword().trim())
                .category(dto.getCategory() != null ? dto.getCategory().trim() : "GENERAL")
                .replyKh(dto.getReplyKh())
                .replyEn(dto.getReplyEn())
                .build();
        return toDto(autoReplyRepository.save(entity));
    }

    @Transactional
    public AutoReplyDto updateAutoReply(Long id, AutoReplyDto dto) {
        AutoReply entity = autoReplyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("AutoReply not found with id: " + id));
        entity.setKeyword(dto.getKeyword().trim());
        if (dto.getCategory() != null) {
            entity.setCategory(dto.getCategory().trim());
        }
        entity.setReplyKh(dto.getReplyKh());
        entity.setReplyEn(dto.getReplyEn());
        return toDto(autoReplyRepository.save(entity));
    }

    @Transactional
    public void deleteAutoReply(Long id) {
        autoReplyRepository.deleteById(id);
    }

    public AutoReplyDto toDto(AutoReply entity) {
        return AutoReplyDto.builder()
                .id(entity.getId())
                .keyword(entity.getKeyword())
                .category(entity.getCategory())
                .replyKh(entity.getReplyKh())
                .replyEn(entity.getReplyEn())
                .build();
    }

    private String detectProductType(String productName) {
        if (productName == null) return "UNKNOWN";
        String lower = productName.toLowerCase();
        if (lower.contains("netflix")) return "NETFLIX";
        if (lower.contains("spotify")) return "SPOTIFY";
        if (lower.contains("chatgpt") || lower.contains("chat gpt") || lower.contains("openai")) return "CHATGPT_PLUS";
        if (lower.contains("youtube")) return "YOUTUBE_PREMIUM";
        if (lower.contains("capcut") || lower.contains("cap cut")) return "CAPCUT_PRO";
        if (lower.contains("canva")) return "CANVA_PRO";
        if (lower.contains("nordvpn") || lower.contains("nord vpn")) return "NORDVPN";
        if (lower.contains("adobe") || lower.contains("photoshop") || lower.contains("illustrator") || lower.contains("creative cloud")) return "ADOBE_CC";
        if (lower.contains("steam")) return "STEAM_WALLET";
        return "DIGITAL_PRODUCT";
    }

    public String detectProblemCategory(String content) {
        if (content == null || content.trim().isEmpty()) return null;
        String lower = content.toLowerCase();

        // SELLER withdrawal / payout (check first for withdrawal phrases)
        if (lower.contains("withdraw") || lower.contains("payout") || lower.contains("cash out") ||
                (lower.contains("earnings") && lower.contains("send")) ||
                (lower.contains("balance") && (lower.contains("withdraw") || lower.contains("transfer"))) ||
                lower.contains("ដកប្រាក់") || lower.contains("ដកលុយ") || lower.contains("ដកប្រាក់ចំណូល") ||
                lower.contains("ចំណូល") || lower.contains("ប្រាក់ចំណូល") || lower.contains("ដក balance")) {
            return "SELLER_WITHDRAWAL";
        }

        // SELLER onboarding / how to sell
        if (lower.contains("how to sell") || lower.contains("how do i sell") || lower.contains("become seller") ||
                lower.contains("open store") || lower.contains("create store") || lower.contains("onboarding") ||
                lower.contains("របៀបលក់") || lower.contains("ចង់លក់") || lower.contains("បើកហាង") ||
                lower.contains("ចុះឈ្មោះលក់") || lower.contains("របៀបចុះឈ្មោះ") || lower.contains("របៀបបង្កើតហាង")) {
            return "SELLER_ONBOARDING";
        }

        // SELLER stock / product management
        if (lower.contains("stock") || lower.contains("upload stock") || lower.contains("restock") ||
                lower.contains("add product") || lower.contains("ស្តុក") || lower.contains("បញ្ចូលស្តុក") ||
                lower.contains("ដាក់ទំនិញ") || lower.contains("របៀបដាក់ស្តុក") || lower.contains("ទម្រង់ stock")) {
            return "SELLER_STOCK";
        }

        // SELLER dispute with buyer
        if (lower.contains("dispute") || lower.contains("buyer complaint") || lower.contains("buyer claim") ||
                lower.contains("វិវាទ") || lower.contains("ប្តឹង") || lower.contains("អតិថិជនរអ៊ូ") ||
                lower.contains("បញ្ហាអ្នកទិញ")) {
            return "SELLER_DISPUTE";
        }

        // DEVICE LIMIT
        if (lower.contains("device limit") || lower.contains("too many device") || lower.contains("max device") ||
                lower.contains("reached the limit") || lower.contains("sign out everywhere") ||
                lower.contains("លើស device") || lower.contains("device ពេញ") || lower.contains("កាត់ device") ||
                lower.contains("sign out all device")) {
            return "DEVICE_LIMIT";
        }

        // SUBSCRIPTION EXPIRED
        if (lower.contains("expired") || lower.contains("subscription ended") || lower.contains("plan expired") ||
                lower.contains("plan ended") || lower.contains("account expired") || lower.contains("no longer premium") ||
                lower.contains("free again") || lower.contains("back to free") || lower.contains("premium ended") ||
                lower.contains("ផុតកំណត់") || lower.contains("ដាច់ plan") || lower.contains("plan ផុត") ||
                lower.contains("premium ផុត") || lower.contains("ក្លាយជា free") || lower.contains("free វិញ")) {
            return "SUBSCRIPTION_EXPIRED";
        }

        // WRONG REGION / REGION LOCK
        if (lower.contains("region") || lower.contains("country") || lower.contains("not available") ||
                lower.contains("unavailable in") || lower.contains("vpn") || lower.contains("geo") ||
                lower.contains("location") || lower.contains("ប្រទេស") || lower.contains("region lock") ||
                lower.contains("region មិនត្រូវ") || lower.contains("ជាប់ vpn") || lower.contains("country lock") ||
                lower.contains("not supported") || lower.contains("not available in")) {
            return "WRONG_REGION";
        }

        // WRONG ACCOUNT
        if ((lower.contains("wrong account") || lower.contains("wrong email") || lower.contains("different account") ||
                lower.contains("other account") || lower.contains("another email") || lower.contains("different email") ||
                lower.contains("my account") || lower.contains("not my email") ||
                lower.contains("account មិនត្រូវ") || lower.contains("email មិនត្រូវ") || lower.contains("ច្រឡំ account") ||
                lower.contains("ចូលខុស account") || lower.contains("log in ខុស")) &&
                !lower.contains("password")) {
            return "WRONG_ACCOUNT";
        }

        // LOGIN / PASSWORD issues
        if (lower.contains("login") || lower.contains("log in") || lower.contains("sign in") ||
                lower.contains("wrong password") || lower.contains("incorrect password") ||
                lower.contains("can't login") || lower.contains("cannot login") ||
                lower.contains("password wrong") || lower.contains("password incorrect") ||
                lower.contains("ចូលមិនបាន") || lower.contains("ខុស password") ||
                lower.contains("ច្រឡំ password") || lower.contains("password មិនត្រូវ") ||
                lower.contains("ចូលអត់បាន") || lower.contains("pass ខុស")) {
            return "LOGIN_ISSUE";
        }

        // NO PRO / PREMIUM badge not showing
        if (lower.contains("no pro") || lower.contains("not pro") || lower.contains("no premium") ||
                lower.contains("not premium") || lower.contains("not 4k") || lower.contains("still free") ||
                lower.contains("premium not") || lower.contains("pro not") || lower.contains("badge") ||
                lower.contains("subscription not") || lower.contains("not showing") ||
                lower.contains("not working") || lower.contains("premium expired") ||
                lower.contains("អត់ចេញ pro") || lower.contains("មិនទាន់ premium") ||
                lower.contains("premium អត់ដើរ") || lower.contains("pro អត់ដើរ") ||
                lower.contains("អត់ឃើញ pro") || lower.contains("នៅ free ដដែល")) {
            return "NO_PRO_BADGE";
        }

        // CANVA team link issues
        if (lower.contains("canva") || lower.contains("កានវ៉ា")) {
            return "CANVA_LINK";
        }

        // PAYMENT issues
        if (lower.contains("payment failed") || lower.contains("pay failed") ||
                lower.contains("not paid") || lower.contains("money deducted") ||
                (lower.contains("khqr") && (lower.contains("fail") || lower.contains("error") || lower.contains("not work"))) ||
                (lower.contains("charge") && lower.contains("no order")) ||
                lower.contains("បង់លុយមិនចូល") || lower.contains("កាត់លុយអត់ចេញ order") ||
                lower.contains("khqr អត់ដើរ") || lower.contains("បង់លុយ fail") || lower.contains("ស្កេនមិនបាន")) {
            return "PAYMENT_ISSUE";
        }

        // REFUND requests
        if (lower.contains("refund") || lower.contains("money back") || lower.contains("cancel order") ||
                lower.contains("want refund") || lower.contains("give back") ||
                lower.contains("សុំលុយវិញ") || lower.contains("refund លុយវិញ") ||
                lower.contains("ប្តូរលុយវិញ") || lower.contains("cancel ការកុម្ម៉ង់")) {
            return "REFUND_REQUEST";
        }

        // ACCOUNT SHARED / kicked out
        if (lower.contains("kicked out") || lower.contains("logged out") || lower.contains("someone else") ||
                lower.contains("another device") || lower.contains("other device") || lower.contains("kicked") ||
                lower.contains("គេ kick") || lower.contains("គេដេញចេញ") || lower.contains("មានអ្នកប្រើ") ||
                lower.contains("logout ខ្លួនឯង") || lower.contains("ដេញចេញពី device")) {
            return "ACCOUNT_SHARED";
        }

        // PRODUCT how-to / setup / activation questions
        if (lower.contains("how to use") || lower.contains("how to activate") || lower.contains("how to setup") ||
                lower.contains("how do i use") || lower.contains("setup guide") || lower.contains("activate") ||
                lower.contains("install") || lower.contains("connect") || lower.contains("configure") ||
                lower.contains("របៀបប្រើ") || lower.contains("របៀប activate") || lower.contains("របៀបតម្លើង") ||
                lower.contains("ប្រើរបៀបម៉េច") || lower.contains("របៀបភ្ជាប់")) {
            return "PRODUCT_QUESTION";
        }

        return null;
    }
}
