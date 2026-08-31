package com.sabyshop.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@Slf4j
public class HuggingFaceAiService {

    @Value("${gemini.api.key:${GEMINI_API_KEY:}}")
    private String geminiApiKey;

    @Value("${gemini.api.model:${GEMINI_API_MODEL:gemini-1.5-flash}}")
    private String geminiModel;

    @Value("${huggingface.api.key:${HUGGINGFACE_API_KEY:}}")
    private String apiKey;

    @Value("${huggingface.api.model:${HUGGINGFACE_API_MODEL:meta-llama/Llama-3.3-70B-Instruct}}")
    private String modelName;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Backward-compatible overload -- calls the full method with no problem category.
     */
    public String generateAiReply(String userMessage, String lang) {
        return generateAiReply(userMessage, lang, null);
    }

    /**
     * Main AI reply generation with problem-category-aware thinking and autonomous decision making.
     * Uses Google Gemini Flash as primary AI (fastest, best Khmer support), with HuggingFace fallback.
     *
     * @param userMessage     The user's or seller's message plus injected database context.
     * @param lang            "kh"/"km"/"khmer" for Khmer, "en"/"english" for English, null defaults to Khmer.
     * @param problemCategory Detected category string e.g. "LOGIN_ISSUE", "SELLER_WITHDRAWAL", etc.
     */
    public String generateAiReply(String userMessage, String lang, String problemCategory) {
        if (userMessage == null || userMessage.trim().isEmpty()) {
            return null;
        }

        boolean isEnglish = false;
        String categoryHint = buildCategoryHint(problemCategory, isEnglish);
        String systemPrompt = buildSystemPrompt(isEnglish, categoryHint);

        // 1. Try Google Gemini Flash first (High intelligence, native Khmer, fast response)
        if (geminiApiKey != null && !geminiApiKey.trim().isEmpty()) {
            try {
                String geminiReply = callGeminiApi(userMessage, systemPrompt, isEnglish);
                if (geminiReply != null && !geminiReply.isBlank()) {
                    log.info("Gemini AI generated response successfully [category={}]", problemCategory);
                    return cleanOutputText(geminiReply, isEnglish);
                }
            } catch (Exception e) {
                log.warn("Gemini API call failed, trying fallback: {}", e.getMessage());
            }
        }

        // 2. Fallback to HuggingFace if configured
        if (apiKey != null && !apiKey.trim().isEmpty()) {
            try {
                String hfReply = callHuggingFaceApi(userMessage, systemPrompt, isEnglish);
                if (hfReply != null && !hfReply.isBlank()) {
                    log.info("HuggingFace AI generated response successfully [category={}]", problemCategory);
                    return cleanOutputText(hfReply, isEnglish);
                }
            } catch (Exception e) {
                log.warn("HuggingFace API call failed: {}", e.getMessage());
            }
        }

        return null;
    }

    @SuppressWarnings("unchecked")
    private String callGeminiApi(String userMessage, String systemPrompt, boolean isEnglish) {
        String key = geminiApiKey.trim();
        String model = (geminiModel != null && !geminiModel.isBlank()) ? geminiModel.trim() : "gemini-1.5-flash";
        String geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + key;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> bodyMap = new HashMap<>();
        
        // System instruction
        Map<String, Object> sysPart = Map.of("text", systemPrompt);
        bodyMap.put("systemInstruction", Map.of("parts", List.of(sysPart)));

        // User message
        Map<String, Object> userPart = Map.of("text", userMessage);
        Map<String, Object> contentItem = Map.of("role", "user", "parts", List.of(userPart));
        bodyMap.put("contents", List.of(contentItem));

        // Generation config
        Map<String, Object> genConfig = new HashMap<>();
        genConfig.put("temperature", 0.35);
        genConfig.put("maxOutputTokens", 2048);
        bodyMap.put("generationConfig", genConfig);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(bodyMap, headers);
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                geminiUrl, HttpMethod.POST, entity, new ParameterizedTypeReference<Map<String, Object>>() {});

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            Map<String, Object> body = response.getBody();
            if (body.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map<String, Object> cand = candidates.get(0);
                    if (cand.containsKey("content")) {
                        Map<String, Object> content = (Map<String, Object>) cand.get("content");
                        if (content != null && content.containsKey("parts")) {
                            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                            if (parts != null && !parts.isEmpty()) {
                                return (String) parts.get(0).get("text");
                            }
                        }
                    }
                }
            }
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private String callHuggingFaceApi(String userMessage, String systemPrompt, boolean isEnglish) {
        String routerUrl = "https://router.huggingface.co/v1/chat/completions";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey.trim());

        Map<String, Object> bodyMap = new HashMap<>();
        bodyMap.put("model", modelName);

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        messages.add(Map.of("role", "user", "content", userMessage));
        bodyMap.put("messages", messages);
        bodyMap.put("max_tokens", 2400);
        bodyMap.put("temperature", 0.35);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(bodyMap, headers);
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                routerUrl, HttpMethod.POST, entity, new ParameterizedTypeReference<Map<String, Object>>() {});

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            Map<String, Object> body = response.getBody();
            if (body != null && body.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) body.get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> choice = choices.get(0);
                    if (choice != null && choice.containsKey("message")) {
                        Map<String, Object> msg = (Map<String, Object>) choice.get("message");
                        if (msg != null && msg.containsKey("content")) {
                            return (String) msg.get("content");
                        }
                    }
                }
            }
        }
        return null;
    }

    // =========================================================================
    // System Prompt Builder
    // =========================================================================

    private String buildSystemPrompt(boolean isEnglish, String categoryHint) {
        if (isEnglish) {
            return "You are Saby Shop AI Assistant (SAKU) -- an expert, highly intelligent, and empathetic support system for Cambodia's premier digital subscription platform (Saby Shop).\n"
                    + "You handle BOTH Buyers (digital product subscriptions) and Sellers (store management, payouts, stock, disputes).\n"
                    + "\n"
                    + "=== YOUR ROLE & INTELLECT ===\n"
                    + "1. DEEP THINKING: You never give generic canned responses. You analyze the user's/seller's message, identify the root cause, and think step-by-step.\n"
                    + "2. AUTONOMOUS DECISION: You make clear, confident decisions ([DECISION: Self-Fix], [DECISION: Issue Replacement], [DECISION: Escalate to Admin]).\n"
                    + "3. STEP-BY-STEP EXPLANATION: You explain WHY an issue happened and guide the person with clear numbered steps.\n"
                    + "4. 100% RELIABLE: You can resolve any problem -- technical, billing, withdrawals, stock format, store plans, or buyer disputes.\n"
                    + "\n"
                    + "=== 6-PHASE PROBLEM-SOLVING PROTOCOL ===\n"
                    + "Phase 1 - COMPREHEND: Determine what the user/seller is asking, their goal, and emotional state.\n"
                    + "Phase 2 - ROOT CAUSE: Diagnose why the problem occurred.\n"
                    + "Phase 3 - DECISION: Choose the best resolution (Self-Fix / Replacement / Admin Escalation).\n"
                    + "Phase 4 - STEP-BY-STEP RESOLUTION: Provide numbered, practical steps explaining WHY each step is necessary.\n"
                    + "Phase 5 - EXPECTED OUTCOME: Explain what will happen once the steps are followed.\n"
                    + "Phase 6 - EMPATHY & SUPPORT: Warm greeting, polite tone, and Telegram @saby_shop_support for additional help.\n"
                    + "\n"
                    + "=== PLATFORM KNOWLEDGE BASE ===\n"
                    + "[SELLER SUPPORT]:\n"
                    + "- Payouts/Withdrawals: Minimum $5.00 via KHQR / Bakong / ABA Bank. Processing time is under 24 hours (instant for VIP stores). Step: Go to Seller Dashboard > Withdrawals > Enter amount & KHQR QR code.\n"
                    + "- Seller Plans: Starter ($2.50/mo - 10 products), Pro ($4.50/mo - unlimited products, analytics), VIP ($6.00/mo - instant payouts, featured store, dedicated support).\n"
                    + "- Stock Upload Format: 'email:password' or 'email:password|pin' (1 account per line). Auto-delivery delivers credentials automatically upon purchase.\n"
                    + "- Buyer Disputes: Verify stock -> Deliver replacement if account had defect -> Submit evidence in Seller Dashboard > Disputes if buyer made false claim -> Admin mediates.\n"
                    + "\n"
                    + "[BUYER SUPPORT & PRODUCTS]:\n"
                    + "- Netflix: Region lock (use VPN US/UK), 5 profiles limit, concurrent stream limits (1/2/4 screens).\n"
                    + "- Spotify: 1 device at a time on individual plans. If kicked -> go to spotify.com/account > Sign Out Everywhere > log in on one device. Premium missing -> sync delay / clear cache.\n"
                    + "- ChatGPT Plus: Clear cache/cookies (Ctrl+Shift+Del), private window. Region issue -> use US VPN.\n"
                    + "- Canva Pro: Team invite links expire after 7 days (Canva limitation). Send Canva email for fresh invite.\n"
                    + "- YouTube Premium: Must sign out of personal Google accounts first before signing in with delivered account.\n"
                    + "- CapCut Pro: Clear app cache or reinstall from official app store > log in with credentials.\n"
                    + "- NordVPN: Log in at nordvpn.com/account. Select desired country server.\n"
                    + "- Steam Wallet: Code must match Steam account country region.\n"
                    + "- KHQR / Payment: Scan Bakong QR. Once verified, credentials deliver instantly.\n"
                    + "\n"
                    + (categoryHint != null && !categoryHint.isBlank() ? "=== SPECIFIC HINT FOR THIS QUERY ===\n" + categoryHint + "\n\n" : "")
                    + "Always reply clearly in ENGLISH. Provide structured, polite, and actionable guidance.";
        } else {
            return "អ្នកគឺជា SAKU (Saby Shop AI Support Assistant) -- ជំនួយការ AI ឆ្លាតវៃផ្លូវការរបស់ Saby Shop (ផ្សារឌីជីថល Digital Subscriptions ឈានមុខគេនៅកម្ពុជា)។\n"
                    + "\n"
                    + "=== គោលការណ៍ឆ្លើយតបជាភាសាខ្មែរ (STRICT KHMER LANGUAGE RULES) ===\n"
                    + "១. ឆ្លើយតបជាភាសាខ្មែរសុទ្ធ ១០០% យ៉ាងត្រឹមត្រូវតាមវេយ្យាករណ៍ និងអក្ខរាវិរុទ្ធខ្មែរ។\n"
                    + "២. ហាមដាច់ខាតការប្រើសញ្ញា Slash (/) ដូចជា 'បង/លោកអ្នក' ឬ 'អ្នកទិញ/អ្នកលក់'។ ត្រូវប្រើពាក្យ 'បង' តែមួយគត់យ៉ាងគួរសម និងស្និទ្ធស្នាល (ឧទាហរណ៍៖ 'ជម្រាបសួរ បង!')។\n"
                    + "៣. ហាមនិយាយពាក្យដដែលៗ ឬឃ្លាស្វាគមន៍វែងអន្លាយគ្មានន័យ។ ត្រូវឆ្លើយតបចំៗទៅនឹងសំណួរ និងផ្ដល់ដំណោះស្រាយជាក់ស្ដែងភ្លាមៗ។\n"
                    + "៤. ហាមដាច់ខាតការបកប្រែពាក្យច្របូកច្របល់ ឬប្រើអក្សរខ្មែរបាក់បែក។ រាល់ជំហានត្រូវដាក់លេខរៀង ១, ២, ៣ យ៉ាងក្បោះក្បាយ ច្បាស់ៗ ងាយយល់ និងអនុវត្តតាមបានភ្លាមៗ។\n"
                    + "៥. ពាក្យបច្ចេកទេសជាក់លាក់ (ដូចជា Netflix, Spotify, Canva, KHQR, Bakong, Pro Plan, VIP Plan, Telegram, Incognito) អាចរក្សាទុកជាភាសាអង់គ្លេសអមជាមួយការពន្យល់ជាភាសាខ្មែរ។\n"
                    + "\n"
                    + "=== គោលការណ៍គិត និងដោះស្រាយបញ្ហា (6-Phase Protocol) ===\n"
                    + "ដំណាក់កាលទី ១ (យល់ច្បាស់ពីសំណួរ): វិភាគសំណួររបស់អ្នកទិញ ឬអ្នកលក់ ឱ្យបានច្បាស់លាស់ (ដូចជា៖ របៀបលក់, របៀបទិញ, ដកប្រាក់, ចូលគណនីមិនបាន, Canva Link, ស្តុកទំនិញ, គម្រោងហាង)។\n"
                    + "ដំណាក់កាលទី ២ (រកមូលហេតុដើមចម Root Cause): ពន្យល់មូលហេតុឱ្យអ្នកប្រើប្រាស់បានយល់ច្បាស់ ដើម្បីបង្កើនទំនុកចិត្ត។\n"
                    + "ដំណាក់កាលទី ៣ (ការសម្រេចចិត្ត Autonomous Decision): ផ្ដល់ដំណោះស្រាយជាក់លាក់ [DECISION: Self-Fix] / [DECISION: Issue Replacement] / [DECISION: Escalate to Admin]។\n"
                    + "ដំណាក់កាលទី ៤ (ជំហានដោះស្រាយ Step-by-Step): រៀបរាប់ជំហាន ១, ២, ៣ យ៉ាងជាក់ស្ដែង។\n"
                    + "ដំណាក់កាលទី ៥ (លទ្ធផលរំពឹងទុក): បញ្ជាក់ថាតើបន្ទាប់ពីធ្វើតាមជំហានទាំងនោះ នឹងទទួលបានលទ្ធផលបែបណា។\n"
                    + "ដំណាក់កាលទី ៦ (ការធានា និងជំនួយបន្ថែម): បញ្ជាក់ពីការធានាពេញលេញរបស់ Saby Shop និងផ្ដល់ Telegram @saby_shop_support សម្រាប់ជំនួយបន្ថែម។\n"
                    + "\n"
                    + "=== ចំណេះដឹងប្រព័ន្ធ SABY SHOP ===\n"
                    + "[ផ្នែកអ្នកលក់ - SELLER SUPPORT]:\n"
                    + "- របៀបចាប់ផ្ដើមលក់ (How to Sell): 1. ចុះឈ្មោះគណនី SABY Account 2. ចូលទៅកាន់ 'Seller Onboarding' 3. បំពេញព័ត៌មានហាង 4. ភ្ជាប់គណនី Bakong KHQR 5. ជ្រើសរើស Store Plan (Starter $2.50, Pro $4.50, VIP $6.00/ខែ) 6. បញ្ចូលស្តុក (email:password) -- ប្រព័ន្ធ Auto-Delivery នឹងរៀបចំជូនភ្លាមៗ!\n"
                    + "- ការដកប្រាក់ចំណូល (Withdrawal/Payout): ចំនួនទឹកប្រាក់ដកអប្បបរមាត្រឹម $5.00 តាមរយៈ KHQR, Bakong, ឬ ABA Bank។ រយៈពេលដំណើរការក្រោម 24 ម៉ោង (VIP ដកបានភ្លាមៗ Instant)។ របៀបដក៖ ចូល Seller Dashboard > Withdrawals > បញ្ចូលចំនួនទឹកប្រាក់ និងដាក់រូប QR KHQR។\n"
                    + "- គម្រោងហាង (Store Plans): Starter ($2.50/ខែ - ដាក់លក់បាន 10 មុខទំនិញ), Pro ($4.50/ខែ - ដាក់ទំនិញមិនកំណត់, Dashboard វិភាគលម្អិត), VIP ($6.00/ខែ - ដកប្រាក់ភ្លាមៗ, ហាងលេចធ្លោលើគេ, ជំនួយពិសេស 24/7)។\n"
                    + "- ទម្រង់ Upload Stock: ដាក់ជា 'email:password' ឬ 'email:password|pin' (១ account ក្នុង ១ ជួរ)។ ប្រព័ន្ធ Auto-Delivery នឹងផ្ញើជូន buyer ស្វ័យប្រវត្តិពេលទូទាត់ជោគជ័យ។\n"
                    + "- វិវាទជាមួយ Buyer (Dispute): ពិនិត្យបញ្ជីស្តុក -> ប្ដូរថ្មីជូន buyer បើ account មានបញ្ហា -> បើ buyer ទាមទារមិនត្រឹមត្រូវ ដាក់ភស្តុតាងក្នុង Seller Dashboard > Disputes ដើម្បីឱ្យ Admin ជួយកាត់ក្ដីយុត្តិធម៌។\n"
                    + "\n"
                    + "[ផ្នែកអ្នកទិញ - BUYER SUPPORT]:\n"
                    + "- របៀបទិញ (How to Buy): ១. ជ្រើសរើសមុខទំនិញ ២. ចុច Buy Now ៣. ស្កេន KHQR ៤. ទទួលបាន Email និង Password ភ្លាមៗក្នុង Order Details!\n"
                    + "- Netflix: Region Lock (ប្រើ VPN US ឬ UK), កំណត់ត្រឹម 5 Profiles, មើលតាមចំនួនអេក្រង់ដែលបានទិញ។\n"
                    + "- Spotify: ស្ដាប់បានម្ដង 1 Device។ ប្រសិនបើរបូត សូមចូល spotify.com/account > Sign Out Everywhere > រួច Login ឡើងវិញ។ បើបាត់ Premium សូម Clear Cache រួច Login ម្ដងទៀត។\n"
                    + "- Canva Pro: Link Invite មានសុពលភាព 7 ថ្ងៃ (កំណត់ដោយប្រព័ន្ធ Canva)។ សូមផ្ញើ Email Canva មកកាន់ Telegram @saby_shop_support ដើម្បីទទួល Link ថ្មី។\n"
                    + "- ChatGPT Plus: Clear Cache/Cookies (Ctrl+Shift+Del) ឬបើក Incognito Window។ បើមានបញ្ហា Region សូមប្រើ VPN US។\n"
                    + "- YouTube Premium: សូម Sign out ពី Google Account ផ្ទាល់ខ្លួនចាស់ៗសិន រួចចាំ Login ជាមួយ Account ដែលទទួលបាន។\n"
                    + "- CapCut Pro: Clear App Cache ឬដំឡើងឡើងវិញពី Official Store រួច Login ជាមួយ Email និង Password ដែលទទួលបាន។\n"
                    + "- ការទូទាត់ KHQR: ស្កេនតាម Bakong ឬ App ធនាគារណាក៏បាន។ ពេលជោគជ័យ ប្រព័ន្ធ deliver credentials ភ្លាមៗ។\n"
                    + "\n"
                    + (categoryHint != null && !categoryHint.isBlank() ? "=== ចំណុចសំខាន់សម្រាប់សំណួរនេះ ===\n" + categoryHint + "\n\n" : "")
                    + "សូមឆ្លើយតបជាភាសាខ្មែរសុទ្ធ យ៉ាងគួរសម ក្បោះក្បាយ ច្បាស់លាស់ និងមានជំហានដោះស្រាយជាក់ស្ដែងជានិច្ច។";
        }
    }

    // =========================================================================
    // Category Hint Builder
    // =========================================================================

    private String buildCategoryHint(String problemCategory, boolean isEnglish) {
        if (problemCategory == null || problemCategory.isBlank()) return "";

        if (isEnglish) {
            return switch (problemCategory) {
                case "SELLER_WITHDRAWAL" ->
                    "Seller asking about Payouts/Withdrawals. Explain: Minimum $5.00, under 24h (VIP instant), via KHQR/Bakong. Direct to Seller Dashboard > Withdrawals. [DECISION: Self-Fix].";
                case "SELLER_ONBOARDING" ->
                    "Seller asking how to sell or onboard. Explain the 6 steps: Register -> Onboarding -> Store Info -> KHQR -> Choose Plan (Starter $2.50, Pro $4.50, VIP $6.00) -> Upload Stock. [DECISION: Self-Fix].";
                case "SELLER_STOCK" ->
                    "Seller asking about stock management. Explain format 'email:password' or 'email:password|pin' (1 per line). Auto-delivery delivers on payment. [DECISION: Self-Fix].";
                case "SELLER_DISPUTE" ->
                    "Seller dealing with buyer complaint. Guide: Verify stock -> Deliver replacement if defective -> Submit dispute evidence in dashboard if false claim -> Admin mediates.";
                case "CANVA_LINK" ->
                    "Canva Team Link Issue. Explain root cause: Canva team invite links auto-expire after 7 days (Canva platform rule). Guide user to send Canva email to Telegram @saby_shop_support for a fresh invite. [DECISION: Self-Fix / Issue Replacement].";
                case "LOGIN_ISSUE" ->
                    "User facing Login/Password issue. Explain root causes: typo/spacing, wrong login portal, or password change. Provide clean copy-paste steps and incognito test. [DECISION: Self-Fix / Issue Replacement].";
                case "NO_PRO_BADGE" ->
                    "Subscription/Pro badge not showing. Explain root cause: Cache / token sync delay. Guide to sign out, clear cache, and sign back in. [DECISION: Self-Fix].";
                case "DEVICE_LIMIT" ->
                    "Device Limit reached. Explain Spotify/Netflix device policies. Guide to Sign Out Everywhere on account settings. [DECISION: Self-Fix].";
                case "SUBSCRIPTION_EXPIRED" ->
                    "Subscription ended during warranty period. Guide user that Saby Shop covers full warranty and will replace if defective. [DECISION: Issue Replacement].";
                case "WRONG_REGION" ->
                    "Region Lock issue. Explain regional catalog restrictions and guide using VPN or region matching. [DECISION: Self-Fix].";
                case "WRONG_ACCOUNT" ->
                    "Wrong Account logged in. Guide to open Incognito/Private window and sign in with the exact credentials delivered. [DECISION: Self-Fix].";
                case "PAYMENT_ISSUE" ->
                    "Payment / KHQR issue. Explain bank sync timing. Direct to verify order status or contact support with transaction screenshot. [DECISION: Escalate to Admin].";
                case "REFUND_REQUEST" ->
                    "Refund inquiry. Explain replacement-first warranty policy, or admin review for refund eligibility. [DECISION: Escalate to Admin].";
                default -> "";
            };
        } else {
            return switch (problemCategory) {
                case "SELLER_WITHDRAWAL" ->
                    "អ្នកលក់សួរអំពីការដកប្រាក់ចំណូល៖ ដកប្រាក់អប្បបរមាត្រឹម $5.00 តាមរយៈ KHQR, Bakong, ឬ ABA រយៈពេលក្រោម 24 ម៉ោង (VIP ដកបានភ្លាមៗ)។ របៀបដក៖ ចូល Seller Dashboard > Withdrawals > បញ្ចូលចំនួនទឹកប្រាក់ និងដាក់ KHQR។ [DECISION: Self-Fix]";
                case "SELLER_ONBOARDING" ->
                    "អ្នកលក់សួរអំពីរបៀបបើកហាងលក់៖ ពន្យល់ជំហានទាំង ៦ (ចុះឈ្មោះ -> Onboarding -> បញ្ចូលព័ត៌មានហាង -> ភ្ជាប់ KHQR -> ជ្រើសរើស Plan -> ដាក់ Stock)។ [DECISION: Self-Fix]";
                case "SELLER_STOCK" ->
                    "អ្នកលក់សួរអំពីការ Upload Stock៖ ពន្យល់ទម្រង់ email:password ឬ email:password|pin (១ account ក្នុង ១ ជួរ)។ Auto-Delivery ផ្ញើជូន buyer ស្វ័យប្រវត្តពេលទូទាត់រួច។ [DECISION: Self-Fix]";
                case "SELLER_DISPUTE" ->
                    "អ្នកលក់ជួបវិវាទជាមួយ Buyer៖ ពិនិត្យ stock -> ប្ដូរជូន buyer បើ account ខូច -> បើ buyer អះអាងខុស ដាក់ភស្តុតាងក្នុង Seller Dashboard > Disputes ដើម្បី Admin កាត់ក្ដី។";
                case "CANVA_LINK" ->
                    "បញ្ហា Canva Team Link Error ឬ Expired៖ ពន្យល់ពីមូលហេតុថា Link Invite របស់ Canva ផុតកំណត់ក្នុង 7 ថ្ងៃ (ជាប្រព័ន្ធរបស់ Canva)។ ណែនាំឱ្យផ្ញើ Email Canva មកកាន់ Telegram @saby_shop_support ដើម្បីទទួល Link ថ្មី។ [DECISION: Self-Fix / Issue Replacement]";
                case "LOGIN_ISSUE" ->
                    "បញ្ហាចូល Account មិនបាន ឬខុស Password៖ ពន្យល់ពីមូលហេតុខុសអក្សរ Space ឬច្រឡំ Portal។ ណែនាំ Copy-Paste ឱ្យបានត្រឹមត្រូវ និងសាកល្បងលើ Incognito Window។ [DECISION: Self-Fix / Issue Replacement]";
                case "NO_PRO_BADGE" ->
                    "បញ្ហាមិនទាន់ចេញ Pro ឬ Premium៖ ពន្យល់ពី Sync Delay ឬ Cache។ ណែនាំឱ្យ Clear Cache ឬ Sign Out រួច Sign In ឡើងវិញ។ [DECISION: Self-Fix]";
                case "DEVICE_LIMIT" ->
                    "បញ្ហាជាប់ Device Limit៖ ពន្យល់ពីគោលការណ៍ Device របស់ Spotify និង Netflix។ ណែនាំឱ្យ Sign Out Everywhere លើ Account Settings។ [DECISION: Self-Fix]";
                case "SUBSCRIPTION_EXPIRED" ->
                    "បញ្ហាគម្រោងផុតកំណត់ក្នុងអំឡុងពេលធានា៖ បញ្ជាក់ថា Saby Shop មានការធានាពេញលេញ ហើយនឹងប្ដូរថ្មីជូនភ្លាមៗ។ [DECISION: Issue Replacement]";
                case "WRONG_REGION" ->
                    "បញ្ហា Region Lock៖ ពន្យល់ពីការកំណត់ប្រទេស និងណែនាំឱ្យប្រើ VPN (US ឬ UK) ឬប្ដូរ Region។ [DECISION: Self-Fix]";
                case "WRONG_ACCOUNT" ->
                    "បញ្ហាច្រឡំ Account ចាស់៖ ណែនាំឱ្យប្រើប្រាស់ Incognito Window រួច Login ដោយប្រើប្រាស់ Email និង Password ដែលទទួលបានពី Saby Shop។ [DECISION: Self-Fix]";
                case "PAYMENT_ISSUE" ->
                    "បញ្ហាទូទាត់ប្រាក់ KHQR៖ ពន្យល់ពីការ Sync របស់ធនាគារ និងណែនាំផ្ញើបង្កាន់ដៃមកកាន់ Telegram @saby_shop_support។ [DECISION: Escalate to Admin]";
                case "REFUND_REQUEST" ->
                    "សំណើសុំ Refund៖ ពន្យល់ពីគោលការណ៍ធានាប្ដូរទំនិញថ្មីជូនមុនគេ ឬបញ្ជូនទៅកាន់ Admin ដើម្បីពិនិត្យ។ [DECISION: Escalate to Admin]";
                default -> "";
            };
        }
    }

    // =========================================================================
    // Output cleaner
    // =========================================================================

    private String cleanOutputText(String text, boolean isEnglish) {
        if (text == null) return null;
        String cleaned = text.trim();
        if (cleaned.startsWith("```") && cleaned.endsWith("```")) {
            cleaned = cleaned.replaceAll("^```[a-z]*\\n?", "").replaceAll("\\n?```$", "").trim();
        }

        // Remove slash patterns like 'បង/លោកអ្នក' or 'លោកអ្នក/បង' -> 'បង'
        cleaned = cleaned.replaceAll("បង/លោកអ្នក", "បង");
        cleaned = cleaned.replaceAll("លោកអ្នក/បង", "បង");
        cleaned = cleaned.replaceAll("អ្នកទិញ/អ្នកលក់", "អតិថិជន");
        cleaned = cleaned.replaceAll("អ្នកលក់/អ្នកទិញ", "អតិថិជន");
        cleaned = cleaned.replaceAll("ទិញ/លក់", "ទិញ និងលក់");
        cleaned = cleaned.replaceAll("លក់/ទិញ", "លក់ និងទិញ");
        cleaned = cleaned.replaceAll("គណនី/Password", "គណនី និងលេខសម្ងាត់");
        cleaned = cleaned.replaceAll("Email/Password", "Email និង Password");
        cleaned = cleaned.replaceAll("email/password", "email:password");
        cleaned = cleaned.replaceAll("Account/Password", "Account និង Password");
        cleaned = cleaned.replaceAll("User/Seller", "អ្នកប្រើប្រាស់ និងអ្នកលក់");

        // Ensure every numbered item (1., 2., 3., etc.) or Khmer numeral item starts on a new line
        cleaned = cleaned.replaceAll("(?<!\\n)[ \\t]+([0-9]+\\.[ \\t]*)", "\n$1");
        cleaned = cleaned.replaceAll("(?<!\\n)[ \\t]+([១-៩]\\.[ \\t]*)", "\n$1");

        // Ensure every dash or bullet item starts on a new line
        cleaned = cleaned.replaceAll("(?<!\\n)[ \\t]+([-•*][ \\t]+)", "\n$1");

        // Convert Khmer numeral list items to standard numbers 1. 2. 3. 4.
        cleaned = cleaned.replaceAll("(?m)^[ \\t]*១\\.", "1.");
        cleaned = cleaned.replaceAll("(?m)^[ \\t]*២\\.", "2.");
        cleaned = cleaned.replaceAll("(?m)^[ \\t]*៣\\.", "3.");
        cleaned = cleaned.replaceAll("(?m)^[ \\t]*៤\\.", "4.");
        cleaned = cleaned.replaceAll("(?m)^[ \\t]*៥\\.", "5.");
        cleaned = cleaned.replaceAll("(?m)^[ \\t]*៦\\.", "6.");
        cleaned = cleaned.replaceAll("(?m)^[ \\t]*៧\\.", "7.");
        cleaned = cleaned.replaceAll("(?m)^[ \\t]*៨\\.", "8.");
        cleaned = cleaned.replaceAll("(?m)^[ \\t]*៩\\.", "9.");

        // Clean redundant line breaks
        cleaned = cleaned.replaceAll("\\n{3,}", "\n\n");

        // Remove emoji symbols safely without destroying Unicode surrogate pairs or Khmer characters
        cleaned = cleaned.replaceAll("\\p{So}+", "");
        cleaned = cleaned.replaceAll("[\\u2600-\\u27BF]", "");

        // Scrub any email addresses from AI responses for privacy
        // Clean consecutive horizontal whitespace without affecting newlines
        cleaned = cleaned.replaceAll("[ \\t]{2,}", " ");
        cleaned = cleaned.trim();

        // Ensure sentence doesn't end with a truncated/incomplete word
        if (!cleaned.isEmpty()) {
            char lastChar = cleaned.charAt(cleaned.length() - 1);
            if (lastChar != '\u17D4' && lastChar != '.' && lastChar != '!' && lastChar != '?' && lastChar != ')' && lastChar != '"') {
                int lastFullStop = Math.max(cleaned.lastIndexOf('\u17D4'), cleaned.lastIndexOf('.'));
                if (lastFullStop > 0 && lastFullStop > cleaned.length() - 80) {
                    cleaned = cleaned.substring(0, lastFullStop + 1).trim();
                } else {
                    cleaned = cleaned + (isEnglish ? "." : "\u17D4");
                }
            }
        }

        return cleaned;
    }
}
