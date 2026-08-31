package com.sabyshop.service;

import com.sabyshop.model.Order;
import com.sabyshop.model.OrderItem;
import com.sabyshop.model.OrderStatus;
import com.sabyshop.model.Role;
import com.sabyshop.model.SellerProfile;
import com.sabyshop.model.User;
import com.sabyshop.repository.OrderRepository;
import com.sabyshop.repository.SellerProfileRepository;
import com.sabyshop.repository.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.CallbackQuery;
import org.telegram.telegrambots.meta.api.objects.Message;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.InlineKeyboardMarkup;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.ReplyKeyboard;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.ReplyKeyboardMarkup;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.buttons.InlineKeyboardButton;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.buttons.KeyboardButton;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.buttons.KeyboardRow;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;
import org.springframework.beans.factory.annotation.Value;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class TelegramBotHandlerService {

    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.base-url:http://localhost:5173}")
    private String appBaseUrl;

    @Lazy
    private final com.sabyshop.bot.Bot bot;

    @Lazy
    private final TelegramNotificationService telegramNotificationService;

    public enum BotState {
        IDLE,
        AWAITING_EMAIL,
        AWAITING_PASSWORD,
        AWAITING_STORE_ID,
        ADMIN_AWAITING_BROADCAST_MESSAGE
    }

    @Data
    public static class UserSession {
        private Long chatId;
        private BotState state = BotState.IDLE;
        private String email;
        private Long userId;
        private Role role;
        private LocalDateTime lastActive = LocalDateTime.now();
        private int failedAttempts = 0;
        private LocalDateTime lockoutUntil = null;
    }

    private final Map<Long, UserSession> sessions = new ConcurrentHashMap<>();

    private UserSession getOrCreateSession(Long chatId) {
        return sessions.computeIfAbsent(chatId, id -> {
            UserSession s = new UserSession();
            s.setChatId(id);
            return s;
        });
    }

    public void handleUpdate(Update update) {
        try {
            if (update.hasCallbackQuery()) {
                handleCallbackQuery(update.getCallbackQuery());
            } else if (update.hasMessage() && update.getMessage().hasText()) {
                handleTextMessage(update.getMessage());
            }
        } catch (Exception e) {
            log.error("Error processing Telegram update: {}", e.getMessage(), e);
        }
    }

    private void handleCallbackQuery(CallbackQuery callbackQuery) {
        Long chatId = callbackQuery.getMessage().getChatId();
        String data = callbackQuery.getData();
        UserSession session = getOrCreateSession(chatId);
        session.setLastActive(LocalDateTime.now());

        if (isLockedOut(chatId, session)) {
            return;
        }

        if ("ACTION_SUPPORT".equals(data)) {
            sendContactSupport(chatId);
        } else if ("ACTION_CONNECT".equals(data)) {
            if (isConnected(chatId)) {
                disconnectAccount(chatId, session);
            } else {
                startConnectFlow(chatId, session);
            }
        } else if ("ACTION_STATUS".equals(data)) {
            sendStatusInfo(chatId);
        } else if ("ACTION_MAIN_MENU".equals(data)) {
            session.setState(BotState.IDLE);
            sendMainMenu(chatId);
        } else if ("ACTION_ADMIN_BROADCAST".equals(data)) {
            startAdminBroadcastFlow(chatId, session);
        } else if ("ACTION_ADMIN_STATS".equals(data)) {
            sendAdminStats(chatId);
        } else if ("ACTION_DISCONNECT".equals(data)) {
            disconnectAccount(chatId, session);
        }
    }

    private void handleTextMessage(Message message) {
        Long chatId = message.getChatId();
        String text = message.getText() != null ? message.getText().trim() : "";
        UserSession session = getOrCreateSession(chatId);
        session.setLastActive(LocalDateTime.now());

        // Navigation Commands
        if (text.equalsIgnoreCase("/start") || text.equalsIgnoreCase("/menu") || text.equalsIgnoreCase("Main Menu") || text.contains("ម៉ឺនុយដើម") || text.contains("Menu")) {
            session.setState(BotState.IDLE);
            sendMainMenu(chatId);
            return;
        }

        // [1] Contact Support / ផ្នែកជំនួយ
        if (text.startsWith("[1]") || text.equalsIgnoreCase("1") || text.contains("ជំនួយ") || text.contains("Support") || text.equalsIgnoreCase("/help")) {
            sendContactSupport(chatId);
            return;
        }

        // Disconnect Commands
        if (text.equalsIgnoreCase("/disconnect") || text.equalsIgnoreCase("/unlink") || text.contains("ផ្តាច់ការតភ្ជាប់") || text.contains("Disconnect")) {
            disconnectAccount(chatId, session);
            return;
        }

        // [2] Dynamic Connect / Disconnect button
        if (text.startsWith("[2]") || text.equalsIgnoreCase("2") || text.contains("តភ្ជាប់") || text.contains("Connect") || text.equalsIgnoreCase("/connect")) {
            if (text.contains("ផ្តាច់") || text.contains("Disconnect") || (isConnected(chatId) && (text.startsWith("[2]") || text.equalsIgnoreCase("2")))) {
                disconnectAccount(chatId, session);
            } else {
                startConnectFlow(chatId, session);
            }
            return;
        }

        // [3] Check Status / Info / ពិនិត្យស្ថានភាព
        if (text.startsWith("[3]") || text.equalsIgnoreCase("3") || text.contains("ស្ថានភាព") || text.contains("Status") || text.contains("Info") || text.equalsIgnoreCase("/status")) {
            sendStatusInfo(chatId);
            return;
        }

        if (text.equalsIgnoreCase("/cancel") || text.contains("បោះបង់") || text.equalsIgnoreCase("cancel")) {
            session.setState(BotState.IDLE);
            sendMessage(chatId, "[បានបោះបង់] សកម្មភាពត្រូវបានបោះបង់។ សូមជ្រើសរើសជម្រើសខាងក្រោម៖", createReplyMainMenuKeyboard(chatId));
            return;
        }

        // Check if currently locked out
        if (isLockedOut(chatId, session)) {
            return;
        }

        if (text.contains("ថ្ងៃនេះ") || text.equalsIgnoreCase("Today Orders") || text.equalsIgnoreCase("/today")) {
            sendTodayOrders(chatId);
            return;
        }

        if (text.contains("ខែនេះ") || text.equalsIgnoreCase("This Month") || text.equalsIgnoreCase("/month")) {
            sendThisMonthOrders(chatId);
            return;
        }

        if (text.equalsIgnoreCase("/plan") || text.equalsIgnoreCase("/renew") || text.equalsIgnoreCase("/subscription") || text.contains("គម្រោង") || text.contains("បន្តគម្រោង")) {
            sendSellerSubscriptionInfo(chatId);
            return;
        }

        if (text.toLowerCase().startsWith("/broadcast")) {
            String broadcastBody = text.length() > 10 ? text.substring(10).trim() : "";
            if (!broadcastBody.isEmpty()) {
                executeAdminBroadcast(chatId, broadcastBody, session);
            } else {
                startAdminBroadcastFlow(chatId, session);
            }
            return;
        }

        switch (session.getState()) {
            case AWAITING_EMAIL:
                handleEmailInput(chatId, text, session);
                break;
            case AWAITING_PASSWORD:
                handlePasswordInput(chatId, text, session);
                break;
            case AWAITING_STORE_ID:
                handleStoreIdInput(chatId, text, session);
                break;
            case ADMIN_AWAITING_BROADCAST_MESSAGE:
                executeAdminBroadcast(chatId, text, session);
                break;
            case IDLE:
            default:
                sendMainMenu(chatId);
                break;
        }
    }

    private boolean isLockedOut(Long chatId, UserSession session) {
        if (session.getLockoutUntil() != null) {
            if (LocalDateTime.now().isBefore(session.getLockoutUntil())) {
                long minutesLeft = Math.max(1, Duration.between(LocalDateTime.now(), session.getLockoutUntil()).toMinutes() + 1);
                String lockMsg = "[សុវត្ថិភាព - SECURITY LOCKOUT]\n\n" +
                        "គណនី Telegram នេះត្រូវបានផ្អាកការផ្ទៀងផ្ទាត់ជាបណ្តោះអាសន្ន ដោយសារបញ្ចូលព័ត៌មានខុសច្រើនដង។\n\n" +
                        "ដើម្បីសុវត្ថិភាពរបស់អ្នកលក់ សូមរង់ចាំ " + minutesLeft + " នាទីទៀត ទើបអាចព្យាយាមម្តងទៀត។";
                sendMessage(chatId, lockMsg, createReplyMainMenuKeyboard(chatId));
                return true;
            } else {
                session.setLockoutUntil(null);
                session.setFailedAttempts(0);
            }
        }
        return false;
    }

    private void recordFailedAttempt(Long chatId, UserSession session, String reason, String attemptedEmail) {
        session.setFailedAttempts(session.getFailedAttempts() + 1);
        int remaining = Math.max(0, 5 - session.getFailedAttempts());

        log.warn("Failed Telegram verification attempt #{} for chatId [{}] on email [{}]: {}",
                session.getFailedAttempts(), chatId, attemptedEmail, reason);

        if (session.getFailedAttempts() >= 5) {
            session.setLockoutUntil(LocalDateTime.now().plusMinutes(15));
            session.setState(BotState.IDLE);

            String lockAlert = "[សុវត្ថិភាព - SECURITY LOCKOUT]\n\n" +
                    "លោកអ្នកបានបញ្ចូលព័ត៌មានមិនត្រឹមត្រូវលើសពី 5 ដង។\n" +
                    "ដើម្បីការពារសុវត្ថិភាពគណនីរបស់អ្នកលក់ ប្រព័ន្ធបានផ្អាកការផ្ទៀងផ្ទាត់រយៈពេល 15 នាទី។";
            sendMessage(chatId, lockAlert, createReplyMainMenuKeyboard(chatId));

            if (telegramNotificationService != null) {
                String adminSecurityNotice = "[ការព្រមានសុវត្ថិភាព - SECURITY ALERT]\n" +
                        "=========================\n" +
                        "មានការព្យាយាមផ្ទៀងផ្ទាត់មិនត្រឹមត្រូវលើសពី 5 ដង!\n" +
                        "អ៊ីមែលគោលដៅ: " + (attemptedEmail != null ? attemptedEmail : "N/A") + "\n" +
                        "Telegram Chat ID: " + chatId + "\n" +
                        "មូលហេតុ: " + reason + "\n" +
                        "ចំណាត់ការ: ផ្អាកបណ្តោះអាសន្ន 15 នាទី\n" +
                        "កាលបរិច្ឆេទ: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) + "\n" +
                        "=========================";
                telegramNotificationService.sendAdminMessage(adminSecurityNotice);
            }
        } else {
            String warningMsg = "[បរាជ័យ] " + reason + "\n\n" +
                    "(ឱកាសសាកល្បងនៅសល់: " + remaining + "/5 ដង។ ប្រសិនបើខុសលើសពី 5 ដង ប្រព័ន្ធនឹងផ្អាក 15 នាទីដើម្បីសុវត្ថិភាពអ្នកលក់)";
            sendMessage(chatId, warningMsg, createReplyMainMenuKeyboard(chatId));
        }
    }

    public boolean isConnected(Long chatId) {
        if (chatId == null) return false;
        return sellerProfileRepository.findByTelegramChatId(chatId.toString()).isPresent()
                || userRepository.findByTelegramChatId(chatId.toString()).isPresent();
    }

    private void sendMainMenu(Long chatId) {
        boolean connected = isConnected(chatId);
        String statusBadge = connected ? " (ស្ថានភាព: បានតភ្ជាប់)" : " (ស្ថានភាព: មិនទាន់តភ្ជាប់)";
        String messageText = "[សូមស្វាគមន៍] សូមស្វាគមន៍មកកាន់ Telegram Bot របស់ Saby Shop សម្រាប់ការជូនដំណឹង និងសេវាជំនួយ" + statusBadge + "។\n\n" +
                "Bot នេះមានតួនាទីផ្ញើការជូនដំណឹងការបញ្ជាទិញទំនិញថ្មីៗភ្លាមៗ ការសាកសួររបស់អតិថិជន និងព័ត៌មានបច្ចុប្បន្នភាពនៃប្រព័ន្ធ។\n\n" +
                "សូមជ្រើសរើសជម្រើសខាងក្រោម៖";
        sendMessage(chatId, messageText, createReplyMainMenuKeyboard(chatId));
    }

    /**
     * Bottom-docked persistent keyboard with clean Khmer text:
     * When NOT connected:
     * [ [1] ផ្នែកជំនួយ (Contact Support)                 ]
     * [ [2] តភ្ជាប់ការជូនដំណឹងគេហទំព័រទៅ Bot             ]
     * [ [3] ពិនិត្យស្ថានភាព (Check Status / Info)         ]
     * 
     * When connected:
     * [ [1] ផ្នែកជំនួយ (Contact Support)                 ]
     * [ [2] ផ្តាច់ការតភ្ជាប់ (Disconnect)                 ]
     * [ [3] ពិនិត្យស្ថានភាព (Check Status / Info)         ]
     */
    private ReplyKeyboardMarkup createReplyMainMenuKeyboard(Long chatId) {
        ReplyKeyboardMarkup keyboardMarkup = new ReplyKeyboardMarkup();
        keyboardMarkup.setResizeKeyboard(true);
        keyboardMarkup.setOneTimeKeyboard(false); // Persistent - stays visible at bottom
        keyboardMarkup.setSelective(false);

        List<KeyboardRow> keyboard = new ArrayList<>();

        KeyboardRow row1 = new KeyboardRow();
        row1.add(new KeyboardButton("[1] ផ្នែកជំនួយ (Contact Support)"));

        KeyboardRow row2 = new KeyboardRow();
        if (isConnected(chatId)) {
            row2.add(new KeyboardButton("[2] ផ្តាច់ការតភ្ជាប់ (Disconnect)"));
        } else {
            row2.add(new KeyboardButton("[2] តភ្ជាប់ការជូនដំណឹងគេហទំព័រទៅ Bot"));
        }

        KeyboardRow row3 = new KeyboardRow();
        row3.add(new KeyboardButton("[3] ពិនិត្យស្ថានភាព (Check Status / Info)"));

        keyboard.add(row1);
        keyboard.add(row2);
        keyboard.add(row3);

        keyboardMarkup.setKeyboard(keyboard);
        return keyboardMarkup;
    }

    private ReplyKeyboardMarkup createReplyMainMenuKeyboard() {
        return createReplyMainMenuKeyboard(null);
    }

    private void sendContactSupport(Long chatId) {
        String text = "[ផ្នែកជំនួយ] សេវាកម្មបម្រើអតិថិជន និងជំនួយបច្ចេកទេស Saby Shop\n\n" +
                "យើងខ្ញុំត្រៀមខ្លួនរួចជាស្រេចដើម្បីជួយសម្របសម្រួលលោកអ្នកក្នុងការគ្រប់គ្រងការបញ្ជាទិញ ការបើកហាង និងដោះស្រាយបញ្ហាបច្ចេកទេសផ្សេងៗ។\n\n" +
                "- Live Chat: មាននៅលើគេហទំព័រផ្ទាល់\n" +
                "- Telegram ជំនួយផ្លូវការ: @saby_shop_support\n" +
                "- ម៉ោងបំរើការ: 12:00 ថ្ងៃត្រង់ - 10:00 យប់ (GMT+7)\n\n" +
                (isConnected(chatId) ? "គណនី Telegram នេះបានតភ្ជាប់ជាមួយប្រព័ន្ធរួចរាល់ហើយ។" : "ដើម្បីទទួលបានការជូនដំណឹងការបញ្ជាទិញ សូមជ្រើសរើស [2] តភ្ជាប់ការជូនដំណឹងគេហទំព័រទៅ Bot។");

        sendMessage(chatId, text, createReplyMainMenuKeyboard(chatId));
    }

    private void sendTodayOrders(Long chatId) {
        Optional<SellerProfile> profileOpt = sellerProfileRepository.findByTelegramChatId(chatId.toString());
        if (profileOpt.isEmpty()) {
            Optional<User> userOpt = userRepository.findByTelegramChatId(chatId.toString());
            if (userOpt.isPresent() && userOpt.get().getRole() == Role.SELLER) {
                profileOpt = sellerProfileRepository.findByUserId(userOpt.get().getId());
            }
        }

        if (profileOpt.isEmpty() || profileOpt.get().getUser() == null) {
            sendMessage(chatId, "[មិនទាន់តភ្ជាប់] សូមតភ្ជាប់ហាងរបស់អ្នកជាមុនសិន ដោយជ្រើសរើសជម្រើស [2]។", createReplyMainMenuKeyboard(chatId));
            return;
        }

        SellerProfile profile = profileOpt.get();
        Long sellerUserId = profile.getUser().getId();

        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        List<Order> todayOrders = orderRepository.findOrdersBySellerIdSince(sellerUserId, startOfToday);

        int totalOrders = todayOrders.size();
        int completedCount = 0;
        int processingCount = 0;
        double todayNetEarnings = 0.0;

        for (Order o : todayOrders) {
            if (o.getStatus() == OrderStatus.COMPLETED) {
                completedCount++;
            } else if (o.getStatus() == OrderStatus.PROCESSING || o.getStatus() == OrderStatus.PENDING) {
                processingCount++;
            }

            double orderSellerTotal = 0.0;
            if (o.getItems() != null) {
                for (OrderItem item : o.getItems()) {
                    if (item != null && item.getProduct() != null && item.getProduct().getSeller() != null
                            && item.getProduct().getSeller().getId().equals(sellerUserId)) {
                        double pPrice = item.getProduct().getBasePrice() != null ? item.getProduct().getBasePrice() : (item.getPrice() != null ? item.getPrice() : 0.0);
                        int qty = item.getQuantity() != null ? item.getQuantity() : 1;
                        orderSellerTotal += (pPrice * qty);
                    }
                }
            }

            if (o.getStatus() == OrderStatus.COMPLETED) {
                todayNetEarnings += orderSellerTotal;
            }
        }

        String todayDateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        String sb = "[របាយការណ៍ការបញ្ជាទិញថ្ងៃនេះ - TODAY ORDERS]\n" +
                "ហាង: " + profile.getStoreName() + " (#" + profile.getId() + ")\n" +
                "កាលបរិច្ឆេទ: " + todayDateStr + "\n" +
                "=========================\n" +
                "- ចំនួនការបញ្ជាទិញសរុបថ្ងៃនេះ: " + totalOrders + " បញ្ជាទិញ\n" +
                "- បានបញ្ចប់ជោគជ័យ: " + completedCount + "\n" +
                "- កំពុងរង់ចាំ/ដំណើរការ: " + processingCount + "\n" +
                "- ប្រាក់ចំណូលសុទ្ធថ្ងៃនេះ: $" + String.format("%.2f", todayNetEarnings) + "\n" +
                "=========================\n" +
                "សូមចូលទៅកាន់ Seller Dashboard លើ Saby Shop ដើម្បីគ្រប់គ្រងការប្រគល់ទំនិញ។";

        sendMessage(chatId, sb, createReplyMainMenuKeyboard(chatId));
    }

    private void sendThisMonthOrders(Long chatId) {
        Optional<SellerProfile> profileOpt = sellerProfileRepository.findByTelegramChatId(chatId.toString());
        if (profileOpt.isEmpty()) {
            Optional<User> userOpt = userRepository.findByTelegramChatId(chatId.toString());
            if (userOpt.isPresent() && userOpt.get().getRole() == Role.SELLER) {
                profileOpt = sellerProfileRepository.findByUserId(userOpt.get().getId());
            }
        }

        if (profileOpt.isEmpty() || profileOpt.get().getUser() == null) {
            sendMessage(chatId, "[មិនទាន់តភ្ជាប់] សូមតភ្ជាប់ហាងរបស់អ្នកជាមុនសិន ដោយជ្រើសរើសជម្រើស [2]។", createReplyMainMenuKeyboard(chatId));
            return;
        }

        SellerProfile profile = profileOpt.get();
        Long sellerUserId = profile.getUser().getId();

        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        List<Order> monthOrders = orderRepository.findOrdersBySellerIdSince(sellerUserId, startOfMonth);

        int totalOrders = monthOrders.size();
        int completedCount = 0;
        int processingCount = 0;
        double monthNetEarnings = 0.0;

        for (Order o : monthOrders) {
            if (o.getStatus() == OrderStatus.COMPLETED) {
                completedCount++;
            } else if (o.getStatus() == OrderStatus.PROCESSING || o.getStatus() == OrderStatus.PENDING) {
                processingCount++;
            }

            if (o.getItems() != null) {
                for (OrderItem item : o.getItems()) {
                    if (item != null && item.getProduct() != null && item.getProduct().getSeller() != null
                            && item.getProduct().getSeller().getId().equals(sellerUserId)) {
                        double pPrice = item.getProduct().getBasePrice() != null ? item.getProduct().getBasePrice() : (item.getPrice() != null ? item.getPrice() : 0.0);
                        int qty = item.getQuantity() != null ? item.getQuantity() : 1;
                        if (o.getStatus() == OrderStatus.COMPLETED) {
                            monthNetEarnings += (pPrice * qty);
                        }
                    }
                }
            }
        }

        double successRate = (totalOrders > 0) ? (completedCount * 100.0 / totalOrders) : 100.0;
        String monthNameStr = YearMonth.now().format(DateTimeFormatter.ofPattern("MM/yyyy"));

        String sb = "[របាយការណ៍ការបញ្ជាទិញខែនេះ - THIS MONTH ORDERS]\n" +
                "ហាង: " + profile.getStoreName() + " (#" + profile.getId() + ")\n" +
                "ខែប្រចាំការ: " + monthNameStr + "\n" +
                "=========================\n" +
                "- ចំនួនការបញ្ជាទិញសរុបក្នុងខែនេះ: " + totalOrders + " បញ្ជាទិញ\n" +
                "- បានបញ្ចប់ជោគជ័យ: " + completedCount + "\n" +
                "- កំពុងដំណើរការ: " + processingCount + "\n" +
                "- អត្រាជោគជ័យ (Success Rate): " + String.format("%.1f", successRate) + "%\n" +
                "- ចំណូលសុទ្ធសរុបក្នុងខែនេះ: $" + String.format("%.2f", monthNetEarnings) + "\n" +
                "=========================\n" +
                "ចូលទៅកាន់ Seller Dashboard លើ Saby Shop សម្រាប់ព័ត៌មានលម្អិតបន្ថែម។";

        sendMessage(chatId, sb, createReplyMainMenuKeyboard(chatId));
    }

    private void startConnectFlow(Long chatId, UserSession session) {
        if (isConnected(chatId)) {
            String alreadyConnected = "[បានតភ្ជាប់រួចហើយ]\n\n" +
                    "គណនី Telegram នេះត្រូវបានតភ្ជាប់ជាមួយគណនី Saby Shop រួចរាល់ហើយ។\n\n" +
                    "ប្រសិនបើលោកអ្នកចង់ផ្តាច់ការតភ្ជាប់ សូមជ្រើសរើសជម្រើស [2] ផ្តាច់ការតភ្ជាប់ ឬផ្ញើ /disconnect។";
            sendMessage(chatId, alreadyConnected, createReplyMainMenuKeyboard(chatId));
            return;
        }

        session.setState(BotState.AWAITING_EMAIL);
        session.setEmail(null);
        session.setUserId(null);

        String text = "[ការផ្ទៀងផ្ទាត់ - ជំហាន ១/៣]\n\n" +
                "សូមបញ្ចូលអាសយដ្ឋាន អ៊ីមែល (Email) ដែលលោកអ្នកបានចុះឈ្មោះក្នុង Saby Shop:\n\n" +
                "(ផ្ញើ /cancel ដើម្បីបោះបង់)";
        sendMessage(chatId, text, createReplyMainMenuKeyboard(chatId));
    }

    private void handleEmailInput(Long chatId, String emailInput, UserSession session) {
        String cleanEmail = emailInput.trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(cleanEmail);

        if (userOpt.isEmpty()) {
            recordFailedAttempt(chatId, session, "រកមិនឃើញគណនីដែលមានអ៊ីមែល: " + cleanEmail + " ទេ។ សូមពិនិត្យអ៊ីមែលដែលបានចុះឈ្មោះលើគេហទំព័រឡើងវិញ។", cleanEmail);
            return;
        }

        User user = userOpt.get();
        session.setEmail(cleanEmail);
        session.setUserId(user.getId());
        session.setRole(user.getRole());
        session.setState(BotState.AWAITING_PASSWORD);

        String prompt = "[ការផ្ទៀងផ្ទាត់ - ជំហាន ២/៣]\n\n" +
                "រកឃើញគណនី: " + cleanEmail + "\n" +
                "សូមបញ្ចូល ពាក្យសម្ងាត់ (Password) នៃគណនីរបស់អ្នកដើម្បីផ្ទៀងផ្ទាត់ភាពជាម្ចាស់:\n\n" +
                "(ផ្ញើ /cancel ដើម្បីបោះបង់)";
        sendMessage(chatId, prompt, createReplyMainMenuKeyboard(chatId));
    }

    private void handlePasswordInput(Long chatId, String passwordInput, UserSession session) {
        if (session.getUserId() == null) {
            startConnectFlow(chatId, session);
            return;
        }

        User user = userRepository.findById(session.getUserId()).orElse(null);
        if (user == null) {
            session.setState(BotState.IDLE);
            sendMessage(chatId, "[បរាជ័យ] Session ផុតកំណត់។ សូមជ្រើសរើសជម្រើស [2] ដើម្បីចាប់ផ្តើមឡើងវិញ។", createReplyMainMenuKeyboard(chatId));
            return;
        }

        boolean passwordMatches = passwordEncoder.matches(passwordInput, user.getPassword());
        if (!passwordMatches) {
            recordFailedAttempt(chatId, session, "ពាក្យសម្ងាត់មិនត្រឹមត្រូវ! ការតភ្ជាប់ត្រូវបានបដិសេធ ដើម្បីសុវត្ថិភាពគណនីរបស់អ្នកលក់។", user.getEmail());
            return;
        }

        session.setFailedAttempts(0);

        // Check if user is ADMIN
        if (user.getRole() == Role.ADMIN) {
            user.setTelegramChatId(chatId.toString());
            userRepository.save(user);
            session.setState(BotState.IDLE);

            String adminSuccess = "[ជោគជ័យ] ការផ្ទៀងផ្ទាត់ Admin ទទួលបានជោគជ័យ!\n\n" +
                    "គណនី: " + user.getEmail() + "\n" +
                    "តួនាទី: ADMIN\n" +
                    "Telegram Chat ID: " + chatId + "\n\n" +
                    "លោកអ្នកនឹងទទួលបានការជូនដំណឹងរាល់ការបញ្ជាទិញ និងវិវាទទូទាំងប្រព័ន្ធ។\n" +
                    "លោកអ្នកក៏អាចផ្ញើសារប្រកាសទៅកាន់អ្នកលក់ទាំងអស់តាមរយៈ /broadcast <សារ>។";

            sendMessage(chatId, adminSuccess, createReplyMainMenuKeyboard(chatId));

            if (telegramNotificationService != null) {
                telegramNotificationService.sendAdminMessage("[ការជូនដំណឹងពី ADMIN] គណនី Admin (" + user.getEmail() + ") បានតភ្ជាប់ Telegram Chat ID: " + chatId);
            }
            return;
        }

        // User is SELLER or CUSTOMER
        Optional<SellerProfile> profileOpt = sellerProfileRepository.findByUserId(user.getId());
        if (profileOpt.isEmpty()) {
            user.setTelegramChatId(chatId.toString());
            userRepository.save(user);
            session.setState(BotState.IDLE);

            String customerMsg = "[ជោគជ័យ] គណនីត្រូវបានតភ្ជាប់!\n\n" +
                    "គណនី: " + user.getEmail() + "\n" +
                    "តួនាទី: " + user.getRole() + "\n\n" +
                    "គណនី Telegram របស់អ្នកត្រូវបានតភ្ជាប់ដោយជោគជ័យ។ នៅពេលអ្នកបើកហាងលក់ទំនិញ ការជូនដំណឹងនឹងដំណើរការដោយស្វ័យប្រវត្តិ។";
            sendMessage(chatId, customerMsg, createReplyMainMenuKeyboard(chatId));
            return;
        }

        // Seller has a store profile -> Step 3: Enter Store ID (e.g. #8 or 8)
        session.setState(BotState.AWAITING_STORE_ID);
        String step3Msg = "[ការផ្ទៀងផ្ទាត់ - ជំហាន ៣/៣]\n\n" +
                "ពាក្យសម្ងាត់ត្រឹមត្រូវ!\n" +
                "សូមបញ្ចូល លេខសម្គាល់ហាង (Store ID) របស់អ្នក (ឧទាហរណ៍ #8 ឬ 8):\n\n" +
                "(អ្នកអាចមើលលេខសម្គាល់ហាងក្នុង Seller Dashboard លើគេហទំព័រ)";
        sendMessage(chatId, step3Msg, createReplyMainMenuKeyboard(chatId));
    }

    private void handleStoreIdInput(Long chatId, String idInput, UserSession session) {
        if (session.getUserId() == null) {
            startConnectFlow(chatId, session);
            return;
        }

        User user = userRepository.findById(session.getUserId()).orElse(null);
        if (user == null) {
            session.setState(BotState.IDLE);
            sendMessage(chatId, "[បរាជ័យ] Session ផុតកំណត់។ សូមផ្ញើ /connect ដើម្បីចាប់ផ្តើមឡើងវិញ។", createReplyMainMenuKeyboard(chatId));
            return;
        }

        String cleanIdStr = idInput.replaceAll("[^0-9]", "").trim();
        if (cleanIdStr.isEmpty()) {
            recordFailedAttempt(chatId, session, "ទម្រង់លេខសម្គាល់ហាងមិនត្រឹមត្រូវ។ សូមបញ្ចូលតែតួលេខប៉ុណ្ណោះ (ឧទាហរណ៍ #8 ឬ 8):", user.getEmail());
            return;
        }

        long enteredStoreId;
        try {
            enteredStoreId = Long.parseLong(cleanIdStr);
        } catch (NumberFormatException e) {
            recordFailedAttempt(chatId, session, "លេខសម្គាល់ហាងមិនត្រឹមត្រូវ។ សូមបញ្ចូលលេខដែលត្រឹមត្រូវ:", user.getEmail());
            return;
        }

        Optional<SellerProfile> profileOpt = sellerProfileRepository.findByUserId(user.getId());
        if (profileOpt.isEmpty()) {
            session.setState(BotState.IDLE);
            sendMessage(chatId, "[បរាជ័យ] រកមិនឃើញហាងសម្រាប់គណនីរបស់អ្នកទេ។ សូមបង្កើតហាងជាមុនសិន។", createReplyMainMenuKeyboard(chatId));
            return;
        }

        SellerProfile profile = profileOpt.get();
        boolean idMatches = profile.getId().equals(enteredStoreId) || user.getId().equals(enteredStoreId);

        if (!idMatches) {
            recordFailedAttempt(chatId, session, "លេខសម្គាល់ហាង #" + enteredStoreId + " មិនត្រូវគ្នាជាមួយគណនី (" + user.getEmail() + ") របស់អ្នកទេ។ សូមពិនិត្យ Store ID លើគេហទំព័រ។", user.getEmail());
            return;
        }

        session.setFailedAttempts(0);
        session.setLockoutUntil(null);

        profile.setTelegramChatId(chatId.toString());
        sellerProfileRepository.save(profile);

        user.setTelegramChatId(chatId.toString());
        userRepository.save(user);

        session.setState(BotState.IDLE);

        String successMsg = "[ជោគជ័យ] ការផ្ទៀងផ្ទាត់ហាងទទួលបានជោគជ័យ!\n\n" +
                "ឈ្មោះហាង: " + profile.getStoreName() + "\n" +
                "លេខសម្គាល់ហាង (Store ID): #" + profile.getId() + "\n" +
                "គណនី: " + user.getEmail() + "\n" +
                "Telegram Chat ID: " + chatId + "\n\n" +
                "គណនី Telegram របស់អ្នកត្រូវបានតភ្ជាប់រួចរាល់! លោកអ្នកនឹងទទួលបានការជូនដំណឹងភ្លាមៗនៅពេលមាន៖\n" +
                "- អតិថិជនបញ្ជាទិញទំនិញថ្មី (បង្ហាញឈ្មោះអតិថិជន, ឈ្មោះផលិតផល, តម្លៃ, រយៈពេល និងបរិមាណ)\n" +
                "- ការបញ្ជាក់ការទូទាត់ប្រាក់\n" +
                "- ដំណឹងផ្លូវការពីថ្នាក់គ្រប់គ្រងប្រព័ន្ធ (Admin)";

        sendMessage(chatId, successMsg, createReplyMainMenuKeyboard(chatId));
        log.info("Seller store [{}] (ID #{}) successfully linked to Telegram chatId [{}]", profile.getStoreName(), profile.getId(), chatId);

        if (telegramNotificationService != null) {
            String adminNotification = "[ការជូនដំណឹងពី ADMIN - អ្នកលក់បានតភ្ជាប់]\n" +
                    "=========================\n" +
                    "ហាងរបស់អ្នកលក់បានតភ្ជាប់ជាមួយ Telegram Bot ដោយជោគជ័យ!\n" +
                    "ឈ្មោះហាង: " + profile.getStoreName() + "\n" +
                    "លេខសម្គាល់ហាង (Store ID): #" + profile.getId() + "\n" +
                    "អ៊ីមែលអ្នកលក់: " + user.getEmail() + "\n" +
                    "Telegram Chat ID: " + chatId + "\n" +
                    "កាលបរិច្ឆេទ: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) + "\n" +
                    "=========================";
            telegramNotificationService.sendAdminMessage(adminNotification);
        }
    }

    private void startAdminBroadcastFlow(Long chatId, UserSession session) {
        Optional<User> adminOpt = userRepository.findByTelegramChatId(chatId.toString());
        boolean isAdmin = adminOpt.isPresent() && adminOpt.get().getRole() == Role.ADMIN;

        if (!isAdmin) {
            sendMessage(chatId, "[កំហុស] គ្មានសិទ្ធិ: មានតែ Admin ប៉ុណ្ណោះដែលអាចផ្ញើសារប្រកាសទៅកាន់អ្នកលក់បាន។", createReplyMainMenuKeyboard(chatId));
            return;
        }

        session.setState(BotState.ADMIN_AWAITING_BROADCAST_MESSAGE);
        String prompt = "[ផ្សព្វផ្សាយដំណឹងពី ADMIN]\n\n" +
                "សូមបញ្ចូលខ្លឹមសារសារដែលលោកអ្នកចង់ប្រកាសទៅកាន់អ្នកលក់ទាំងអស់ដែលបានតភ្ជាប់ Telegram:\n\n" +
                "(ផ្ញើ /cancel ដើម្បីបោះបង់)";
        sendMessage(chatId, prompt, createReplyMainMenuKeyboard(chatId));
    }

    private void executeAdminBroadcast(Long chatId, String broadcastText, UserSession session) {
        Optional<User> adminOpt = userRepository.findByTelegramChatId(chatId.toString());
        boolean isAdmin = adminOpt.isPresent() && adminOpt.get().getRole() == Role.ADMIN;

        if (!isAdmin) {
            sendMessage(chatId, "[កំហុស] គ្មានសិទ្ធិ: មានតែ Admin ប៉ុណ្ណោះដែលអាចផ្ញើសារប្រកាសទៅកាន់អ្នកលក់បាន។", createReplyMainMenuKeyboard(chatId));
            session.setState(BotState.IDLE);
            return;
        }

        String adminEmail = adminOpt.get().getEmail();
        List<SellerProfile> connectedSellers = sellerProfileRepository.findByTelegramChatIdIsNotNull();

        Set<String> targetChatIds = new HashSet<>();
        for (SellerProfile sp : connectedSellers) {
            if (sp.getTelegramChatId() != null && !sp.getTelegramChatId().isBlank()) {
                targetChatIds.add(sp.getTelegramChatId().trim());
            }
        }

        List<User> sellerUsers = userRepository.findByRoleAndTelegramChatIdIsNotNull(Role.SELLER);
        for (User u : sellerUsers) {
            if (u.getTelegramChatId() != null && !u.getTelegramChatId().isBlank()) {
                targetChatIds.add(u.getTelegramChatId().trim());
            }
        }

        targetChatIds.remove(chatId.toString());

        String formattedDate = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        String outboundMessage = "[សេចក្តីជូនដំណឹងផ្លូវការពី ADMIN]\n" +
                "កាលបរិច្ឆេទ: " + formattedDate + "\n" +
                "ពី: ថ្នាក់គ្រប់គ្រង (" + adminEmail + ")\n\n" +
                broadcastText;

        int successCount = 0;
        for (String targetChatId : targetChatIds) {
            try {
                bot.execute(new SendMessage(targetChatId, outboundMessage));
                successCount++;
            } catch (Exception e) {
                log.warn("Failed to broadcast message to chatId {}: {}", targetChatId, e.getMessage());
            }
        }

        session.setState(BotState.IDLE);
        String report = "[ផ្សព្វផ្សាយបានជោគជ័យ]\n\n" +
                "សារប្រកាសត្រូវបានបញ្ជូនទៅកាន់អ្នកលក់ចំនួន " + successCount + " នាក់ដោយជោគជ័យ។\n" +
                "ចំនួនអ្នកទទួលគោលដៅសរុប: " + targetChatIds.size() + " នាក់";
        sendMessage(chatId, report, createReplyMainMenuKeyboard(chatId));
        log.info("Admin [{}] broadcasted message to {} sellers", adminEmail, successCount);
    }

    private void sendAdminStats(Long chatId) {
        Optional<User> adminOpt = userRepository.findByTelegramChatId(chatId.toString());
        boolean isAdmin = adminOpt.isPresent() && adminOpt.get().getRole() == Role.ADMIN;

        if (!isAdmin) {
            sendMessage(chatId, "[កំហុស] គ្មានសិទ្ធិ។", createReplyMainMenuKeyboard(chatId));
            return;
        }

        List<SellerProfile> connectedSellers = sellerProfileRepository.findByTelegramChatIdIsNotNull();
        List<User> connectedAdmins = userRepository.findByRoleAndTelegramChatIdIsNotNull(Role.ADMIN);

        String stats = "[ស្ថិតិ TELEGRAM ADMIN]\n\n" +
                "- ចំនួនអ្នកលក់ដែលបានតភ្ជាប់: " + connectedSellers.size() + " នាក់\n" +
                "- ចំនួន Admin ដែលបានតភ្ជាប់: " + connectedAdmins.size() + " នាក់\n" +
                "- ចំនួន Active Sessions: " + sessions.size() + "\n\n" +
                "ផ្ញើ /broadcast <សារ> ដើម្បីប្រកាសដំណឹងទៅកាន់អ្នកលក់ទាំងអស់។";
        sendMessage(chatId, stats, createReplyMainMenuKeyboard(chatId));
    }

    private void sendStatusInfo(Long chatId) {
        Optional<SellerProfile> profileOpt = sellerProfileRepository.findByTelegramChatId(chatId.toString());
        Optional<User> userOpt = userRepository.findByTelegramChatId(chatId.toString());

        if (profileOpt.isPresent()) {
            SellerProfile sp = profileOpt.get();
            String userEmail = (sp.getUser() != null && sp.getUser().getEmail() != null) ? sp.getUser().getEmail() : "N/A";
            
            String planTitle = sp.getSubscriptionPlan() != null ? sp.getSubscriptionPlan().name() : "PLAN_1";
            if ("PLAN_1".equalsIgnoreCase(planTitle)) planTitle = "PLAN 1 - Basic ($2.50/month)";
            else if ("PLAN_2".equalsIgnoreCase(planTitle)) planTitle = "PLAN 2 - Pro ($4.50/month)";
            else if ("PLAN_3".equalsIgnoreCase(planTitle)) planTitle = "PLAN 3 - VIP ($6.00/month)";

            String expiryDateStr = sp.getSubscriptionExpiresAt() != null 
                    ? sp.getSubscriptionExpiresAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                    : "N/A";

            long daysRemaining = 0;
            if (sp.getSubscriptionExpiresAt() != null) {
                daysRemaining = Duration.between(LocalDateTime.now(), sp.getSubscriptionExpiresAt()).toDays();
            }

            String subStatusStr = sp.getSubscriptionStatus() != null ? sp.getSubscriptionStatus().name() : "UNKNOWN";

            StringBuilder sb = new StringBuilder();
            sb.append("[ស្ថានភាព: បានតភ្ជាប់ (អ្នកលក់ / SELLER)]\n\n");
            sb.append("ឈ្មោះហាង (Store): ").append(sp.getStoreName()).append("\n");
            sb.append("លេខសម្គាល់ហាង (Store ID): #").append(sp.getId()).append("\n");
            sb.append("គណនី (Email): ").append(userEmail).append("\n");
            sb.append("កញ្ចប់បច្ចុប្បន្ន (Plan): ").append(planTitle).append("\n");
            sb.append("ស្ថានភាពគម្រោង (Status): ").append(subStatusStr).append("\n");
            sb.append("កាលបរិច្ឆេទផុតកំណត់ (Expiry): ").append(expiryDateStr).append("\n");
            if (daysRemaining > 0) {
                sb.append("រយៈពេលនៅសល់: ").append(daysRemaining).append(" ថ្ងៃទៀត\n\n");
            } else {
                sb.append("សុពលភាព: ផុតកំណត់ (EXPIRED)\n\n");
            }
            sb.append("ការជូនដំណឹងការបញ្ជាទិញ: កំពុងដំណើរការ (ACTIVE)\n\n");
            sb.append("ចុចប៊ូតុងខាងក្រោមដើម្បីបន្តសុពលភាពគម្រោង ឬចូលទៅកាន់ Seller Dashboard៖");

            String renewalUrl = appBaseUrl + "/seller?tab=overview&openRenewal=true";
            String dashboardUrl = appBaseUrl + "/seller";

            InlineKeyboardMarkup keyboard = createDoubleUrlKeyboard("បន្តសុពលភាពគម្រោង (Renew Plan)", renewalUrl, "Seller Dashboard", dashboardUrl);

            sendMessage(chatId, sb.toString(), keyboard);
            return;
        }

        if (userOpt.isPresent()) {
            User u = userOpt.get();
            String info = "[ស្ថានភាព: បានតភ្ជាប់ (" + u.getRole() + ")]\n\n" +
                    "គណនី: " + u.getEmail() + "\n" +
                    "តួនាទី: " + u.getRole() + "\n" +
                    "Telegram Chat ID: " + chatId + "\n" +
                    "ការជូនដំណឹង: កំពុងដំណើរការ (ACTIVE)\n\n" +
                    "ជ្រើសរើសជម្រើស [2] ផ្តាច់ការតភ្ជាប់ ឬផ្ញើ /disconnect ដើម្បីផ្តាច់ការតភ្ជាប់គណនី Telegram នេះ។";
            sendMessage(chatId, info, createReplyMainMenuKeyboard(chatId));
            return;
        }

        String notLinked = "[ស្ថានភាព: មិនទាន់តភ្ជាប់]\n\n" +
                "គណនី Telegram នេះមិនទាន់ត្រូវបានភ្ជាប់ជាមួយគណនីគេហទំព័រនៅឡើយទេ។\n\n" +
                "សូមជ្រើសរើសជម្រើស [2] តភ្ជាប់ការជូនដំណឹងគេហទំព័រទៅ Bot ឬផ្ញើ /connect ដើម្បីតភ្ជាប់ហាងរបស់អ្នក។";
        sendMessage(chatId, notLinked, createReplyMainMenuKeyboard(chatId));
    }

    private void sendSellerSubscriptionInfo(Long chatId) {
        Optional<SellerProfile> profileOpt = sellerProfileRepository.findByTelegramChatId(chatId.toString());
        if (profileOpt.isEmpty()) {
            Optional<User> userOpt = userRepository.findByTelegramChatId(chatId.toString());
            if (userOpt.isPresent() && userOpt.get().getRole() == Role.SELLER) {
                profileOpt = sellerProfileRepository.findByUserId(userOpt.get().getId());
            }
        }

        if (profileOpt.isEmpty()) {
            sendMessage(chatId, "[មិនទាន់តភ្ជាប់] សូមតភ្ជាប់ហាងរបស់អ្នកជាមុនសិន ដោយជ្រើសរើសជម្រើស [2]។", createReplyMainMenuKeyboard(chatId));
            return;
        }

        SellerProfile sp = profileOpt.get();
        String userEmail = (sp.getUser() != null && sp.getUser().getEmail() != null) ? sp.getUser().getEmail() : "N/A";
        String planTitle = sp.getSubscriptionPlan() != null ? sp.getSubscriptionPlan().name() : "PLAN_1";
        if ("PLAN_1".equalsIgnoreCase(planTitle)) planTitle = "PLAN 1 - Basic ($2.50/month)";
        else if ("PLAN_2".equalsIgnoreCase(planTitle)) planTitle = "PLAN 2 - Pro ($4.50/month)";
        else if ("PLAN_3".equalsIgnoreCase(planTitle)) planTitle = "PLAN 3 - VIP ($6.00/month)";

        String expiryDateStr = sp.getSubscriptionExpiresAt() != null 
                ? sp.getSubscriptionExpiresAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                : "N/A";

        long daysRemaining = 0;
        if (sp.getSubscriptionExpiresAt() != null) {
            daysRemaining = Duration.between(LocalDateTime.now(), sp.getSubscriptionExpiresAt()).toDays();
        }

        String subStatusStr = sp.getSubscriptionStatus() != null ? sp.getSubscriptionStatus().name() : "UNKNOWN";

        StringBuilder sb = new StringBuilder();
        sb.append("[ព័ត៌មានគម្រោងហាង - STORE SUBSCRIPTION PLAN]\n");
        sb.append("=========================\n");
        sb.append("ឈ្មោះហាង (Store): ").append(sp.getStoreName()).append(" (#").append(sp.getId()).append(")\n");
        sb.append("គណនី (Email): ").append(userEmail).append("\n");
        sb.append("កញ្ចប់បច្ចុប្បន្ន (Plan): ").append(planTitle).append("\n");
        sb.append("ស្ថានភាពគម្រោង (Status): ").append(subStatusStr).append("\n");
        sb.append("កាលបរិច្ឆេទផុតកំណត់ (Expiry): ").append(expiryDateStr).append("\n");
        if (daysRemaining > 0) {
            sb.append("រយៈពេលនៅសល់: ").append(daysRemaining).append(" ថ្ងៃទៀត (").append(daysRemaining).append(" Days Left)\n");
        } else {
            sb.append("រយៈពេលនៅសល់: ផុតកំណត់ (0 Days - EXPIRED)\n");
        }
        sb.append("=========================\n");
        sb.append("ចុចប៊ូតុងខាងក្រោមដើម្បីបន្តសុពលភាពគម្រោង ($2.50/ខែ) ឬដំឡើងកញ្ចប់ (Upgrade Plan) លើគេហទំព័រ៖");

        String renewalUrl = appBaseUrl + "/seller?tab=overview&openRenewal=true";
        String dashboardUrl = appBaseUrl + "/seller";

        InlineKeyboardMarkup keyboard = createDoubleUrlKeyboard("បន្តសុពលភាពគម្រោង (Renew / Upgrade)", renewalUrl, "Seller Dashboard", dashboardUrl);

        sendMessage(chatId, sb.toString(), keyboard);
    }

    private InlineKeyboardMarkup createUrlKeyboard(String buttonText, String url) {
        InlineKeyboardButton btn = new InlineKeyboardButton(buttonText);
        btn.setUrl(url);
        List<InlineKeyboardButton> row = new ArrayList<>();
        row.add(btn);
        List<List<InlineKeyboardButton>> rows = new ArrayList<>();
        rows.add(row);
        return new InlineKeyboardMarkup(rows);
    }

    private InlineKeyboardMarkup createDoubleUrlKeyboard(String btn1Text, String btn1Url, String btn2Text, String btn2Url) {
        InlineKeyboardButton btn1 = new InlineKeyboardButton(btn1Text);
        btn1.setUrl(btn1Url);
        InlineKeyboardButton btn2 = new InlineKeyboardButton(btn2Text);
        btn2.setUrl(btn2Url);
        List<InlineKeyboardButton> row = new ArrayList<>();
        row.add(btn1);
        row.add(btn2);
        List<List<InlineKeyboardButton>> rows = new ArrayList<>();
        rows.add(row);
        return new InlineKeyboardMarkup(rows);
    }

    private void disconnectAccount(Long chatId, UserSession session) {
        boolean wasConnected = isConnected(chatId);

        Optional<SellerProfile> profileOpt = sellerProfileRepository.findByTelegramChatId(chatId.toString());
        profileOpt.ifPresent(sp -> {
            sp.setTelegramChatId(null);
            sellerProfileRepository.save(sp);
        });

        Optional<User> userOpt = userRepository.findByTelegramChatId(chatId.toString());
        userOpt.ifPresent(u -> {
            u.setTelegramChatId(null);
            userRepository.save(u);
        });

        session.setState(BotState.IDLE);
        session.setEmail(null);
        session.setUserId(null);

        if (!wasConnected) {
            String notLinked = "[ព័ត៌មាន] គណនី Telegram នេះមិនទាន់ត្រូវបានតភ្ជាប់ជាមួយគណនីណាមួយនៅឡើយទេ។\n\n" +
                    "សូមជ្រើសរើសជម្រើស [2] តភ្ជាប់ការជូនដំណឹងគេហទំព័រទៅ Bot ឬផ្ញើ /connect ដើម្បីតភ្ជាប់។";
            sendMessage(chatId, notLinked, createReplyMainMenuKeyboard(chatId));
            return;
        }

        String msg = "[ជោគជ័យ] បានផ្តាច់គណនី Telegram របស់អ្នកពី Saby Shop រួចរាល់។\n" +
                "លោកអ្នកនឹងលែងទទួលបានការជូនដំណឹងស្វ័យប្រវត្តិតាម Telegram ទៀតហើយ។\n\n" +
                "ជ្រើសរើសជម្រើស [2] ឬផ្ញើ /connect បានគ្រប់ពេលវេលាដើម្បីតភ្ជាប់ឡើងវិញ។";
        sendMessage(chatId, msg, createReplyMainMenuKeyboard(chatId));
    }

    public void sendMessage(Long chatId, String text) {
        sendMessage(chatId, text, createReplyMainMenuKeyboard(chatId));
    }

    public void sendMessage(Long chatId, String text, ReplyKeyboard markup) {
        try {
            SendMessage sm = new SendMessage(chatId.toString(), text);
            if (markup != null) {
                sm.setReplyMarkup(markup);
            } else {
                sm.setReplyMarkup(createReplyMainMenuKeyboard(chatId));
            }
            bot.execute(sm);
        } catch (TelegramApiException e) {
            log.warn("Failed to send Telegram message to chatId {}: {}", chatId, e.getMessage());
        }
    }
}
