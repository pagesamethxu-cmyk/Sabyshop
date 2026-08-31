package com.sabyshop.service;

import com.sabyshop.bot.Bot;
import com.sabyshop.model.*;
import com.sabyshop.repository.SellerProfileRepository;
import com.sabyshop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.InlineKeyboardMarkup;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.buttons.InlineKeyboardButton;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class TelegramNotificationService {

    private final Bot bot;
    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;

    @Value("${telegram.bot.adminChatId:YOUR_ADMIN_CHAT_ID}")
    private String configuredAdminChatId;

    @Value("${app.base-url:http://localhost:5173}")
    private String appBaseUrl;

    public void sendNotification(String chatId, String message) {
        sendNotificationWithKeyboard(chatId, message, null);
    }

    public void sendNotificationWithKeyboard(String chatId, String message, InlineKeyboardMarkup keyboard) {
        if (chatId == null || chatId.isBlank() || "YOUR_ADMIN_CHAT_ID".equalsIgnoreCase(chatId.trim())) {
            return;
        }
        try {
            SendMessage sm = new SendMessage(chatId.trim(), message);
            if (keyboard != null) {
                sm.setReplyMarkup(keyboard);
            }
            bot.execute(sm);
        } catch (TelegramApiException e) {
            log.warn("Failed to send Telegram notification to chatId {}: {}", chatId, e.getMessage());
        }
    }

    public void sendAdminMessage(String message) {
        sendAdminMessageWithKeyboard(message, null);
    }

    public void sendAdminMessageWithKeyboard(String message, InlineKeyboardMarkup keyboard) {
        if (configuredAdminChatId != null && !configuredAdminChatId.isBlank() && !"YOUR_ADMIN_CHAT_ID".equalsIgnoreCase(configuredAdminChatId.trim())) {
            sendNotificationWithKeyboard(configuredAdminChatId.trim(), message, keyboard);
        }

        try {
            List<User> adminUsers = userRepository.findByRoleAndTelegramChatIdIsNotNull(Role.ADMIN);
            for (User admin : adminUsers) {
                if (admin.getTelegramChatId() != null && !admin.getTelegramChatId().isBlank() && !admin.getTelegramChatId().equals(configuredAdminChatId)) {
                    sendNotificationWithKeyboard(admin.getTelegramChatId().trim(), message, keyboard);
                }
            }
        } catch (Exception e) {
            log.warn("Error finding admin telegram chat IDs: {}", e.getMessage());
        }
    }

    private String resolveSellerChatId(User seller) {
        if (seller == null) return null;
        String chatId = seller.getTelegramChatId();
        if (chatId == null || chatId.isBlank()) {
            Optional<SellerProfile> spOpt = sellerProfileRepository.findByUserId(seller.getId());
            if (spOpt.isPresent() && spOpt.get().getTelegramChatId() != null && !spOpt.get().getTelegramChatId().isBlank()) {
                chatId = spOpt.get().getTelegramChatId();
            }
        }
        return (chatId != null && !chatId.isBlank()) ? chatId.trim() : null;
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

    /**
     * Standard order created notification (New Order).
     */
    public void sendSellerOrderNotification(User seller, Order order, List<OrderItem> sellerItems) {
        if (seller == null || order == null) return;

        String chatId = resolveSellerChatId(seller);
        if (chatId == null) {
            log.debug("Seller [{}] has not connected Telegram bot. Skipping notification.", seller.getEmail());
            return;
        }

        String customerName = "Customer";
        String customerEmail = "N/A";
        if (order.getUser() != null) {
            customerEmail = order.getUser().getEmail() != null ? order.getUser().getEmail() : "N/A";
            customerName = order.getUser().getName() != null && !order.getUser().getName().isBlank() 
                    ? order.getUser().getName() 
                    : customerEmail.split("@")[0];
        }

        String orderDate = order.getCreatedAt() != null 
                ? order.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                : LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

        StringBuilder sb = new StringBuilder();
        sb.append("[ការជូនដំណឹងការបញ្ជាទិញថ្មី - NEW ORDER]\n");
        sb.append("=========================\n");
        sb.append("លេខបញ្ជាទិញ (Order ID): #").append(order.getId()).append("\n");
        sb.append("ឈ្មោះអតិថិជន (Customer): ").append(customerName).append("\n");
        sb.append("អ៊ីមែលអតិថិជន (Email): ").append(customerEmail).append("\n");
        if (order.getBuyerInviteEmail() != null && !order.getBuyerInviteEmail().isBlank()) {
            sb.append("អ៊ីមែលទទួលការអញ្ជើញ (Invite Email): ").append(order.getBuyerInviteEmail().trim()).append("\n");
        }
        sb.append("ស្ថានភាពបញ្ជាទិញ (Status): ").append(order.getStatus()).append("\n");
        sb.append("កាលបរិច្ឆេទ (Date): ").append(orderDate).append("\n");
        sb.append("-------------------------\n");
        sb.append("មុខទំនិញដែលបានទិញ (ITEMS):\n");

        double sellerTotal = 0.0;
        List<OrderItem> itemsToDisplay = (sellerItems != null && !sellerItems.isEmpty()) ? sellerItems : order.getItems();
        if (itemsToDisplay != null) {
            for (OrderItem item : itemsToDisplay) {
                if (item == null) continue;
                Product p = item.getProduct();
                String pName = p != null && p.getName() != null ? p.getName() : "Digital Product";
                double pPrice = p != null && p.getBasePrice() != null ? p.getBasePrice() : (item.getPrice() != null ? item.getPrice() : 0.0);
                String duration = p != null && p.getDuration() != null ? p.getDuration() : "1 Month";
                String pType = p != null && p.getProductType() != null ? p.getProductType() : "ACCOUNT";
                int qty = item.getQuantity() != null ? item.getQuantity() : 1;

                sellerTotal += (pPrice * qty);

                sb.append("- ឈ្មោះទំនិញ: ").append(pName).append("\n");
                sb.append("  តម្លៃ (Price): $").append(String.format("%.2f", pPrice)).append("\n");
                sb.append("  រយៈពេល (Duration): ").append(duration).append("\n");
                sb.append("  ប្រភេទ (Type): ").append(pType).append("\n");
                sb.append("  បរិមាណ (Qty): ").append(qty).append("\n");
            }
        }

        sb.append("-------------------------\n");
        sb.append("ប្រាក់ចំណូលសុទ្ធរបស់អ្នកលក់ (Net): $").append(String.format("%.2f", sellerTotal)).append("\n");
        sb.append("=========================\n");
        sb.append("សូមចូលទៅកាន់ Seller Dashboard លើគេហទំព័រ ដើម្បីគ្រប់គ្រងការប្រគល់ទំនិញជូនអតិថិជន។");

        String dashboardUrl = appBaseUrl + "/seller?tab=orders";
        InlineKeyboardMarkup keyboard = createUrlKeyboard("ចូលទៅកាន់ Seller Dashboard", dashboardUrl);

        sendNotificationWithKeyboard(chatId, sb.toString(), keyboard);
        log.info("Sent Telegram new order notification to seller [{}] for Order #{}", seller.getEmail(), order.getId());
    }

    /**
     * Notification when order moves to PROCESSING (e.g. sharing accounts requiring seller invite/action).
     */
    public void sendSellerOrderProcessingNotification(User seller, Order order, List<OrderItem> sellerItems) {
        if (seller == null || order == null) return;

        String chatId = resolveSellerChatId(seller);
        if (chatId == null) {
            log.debug("Seller [{}] has no Telegram connected for processing alert.", seller.getEmail());
            return;
        }

        String customerName = "Customer";
        String customerEmail = "N/A";
        if (order.getUser() != null) {
            customerEmail = order.getUser().getEmail() != null ? order.getUser().getEmail() : "N/A";
            customerName = order.getUser().getName() != null && !order.getUser().getName().isBlank() 
                    ? order.getUser().getName() 
                    : customerEmail.split("@")[0];
        }

        String orderDate = order.getCreatedAt() != null 
                ? order.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                : LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

        StringBuilder sb = new StringBuilder();
        sb.append("[ការជូនដំណឹង: ការបញ្ជាទិញកំពុងដំណើរការ - ORDER PROCESSING]\n");
        sb.append("=========================\n");
        sb.append("លេខបញ្ជាទិញ (Order ID): #").append(order.getId()).append("\n");
        sb.append("ឈ្មោះអតិថិជន (Customer): ").append(customerName).append("\n");
        sb.append("អ៊ីមែលអតិថិជន (Email): ").append(customerEmail).append("\n");
        if (order.getBuyerInviteEmail() != null && !order.getBuyerInviteEmail().isBlank()) {
            sb.append("អ៊ីមែលទទួលការអញ្ជើញ (Invite Email): ").append(order.getBuyerInviteEmail().trim()).append("\n");
        }
        sb.append("ស្ថានភាពបញ្ជាទិញ (Status): PROCESSING (កំពុងដំណើរការ)\n");
        sb.append("កាលបរិច្ឆេទ (Date): ").append(orderDate).append("\n");
        sb.append("-------------------------\n");
        sb.append("មុខទំនិញដែលត្រូវរៀបចំ (ITEMS):\n");

        double sellerTotal = 0.0;
        List<OrderItem> itemsToDisplay = (sellerItems != null && !sellerItems.isEmpty()) ? sellerItems : order.getItems();
        if (itemsToDisplay != null) {
            for (OrderItem item : itemsToDisplay) {
                if (item == null) continue;
                Product p = item.getProduct();
                String pName = p != null && p.getName() != null ? p.getName() : "Digital Product";
                double pPrice = p != null && p.getBasePrice() != null ? p.getBasePrice() : (item.getPrice() != null ? item.getPrice() : 0.0);
                String duration = p != null && p.getDuration() != null ? p.getDuration() : "1 Month";
                String pType = p != null && p.getProductType() != null ? p.getProductType() : "SHARING";
                int qty = item.getQuantity() != null ? item.getQuantity() : 1;

                sellerTotal += (pPrice * qty);

                sb.append("- ឈ្មោះទំនិញ: ").append(pName).append("\n");
                sb.append("  តម្លៃ: $").append(String.format("%.2f", pPrice)).append("\n");
                sb.append("  រយៈពេល: ").append(duration).append("\n");
                sb.append("  ប្រភេទ: ").append(pType).append("\n");
                sb.append("  បរិមាណ: ").append(qty).append("\n");
            }
        }

        sb.append("-------------------------\n");
        sb.append("ប្រាក់ចំណូលរំពឹងទុក (Net): $").append(String.format("%.2f", sellerTotal)).append("\n");
        sb.append("=========================\n");
        sb.append("សកម្មភាពបន្ទាប់: សូមចូលទៅកាន់ Seller Dashboard ដើម្បីអញ្ជើញ (Invite) ឬប្រគល់ទំនិញជូនអតិថិជន រួចចុច 'Deliver Done'។");

        String dashboardUrl = appBaseUrl + "/seller?tab=orders";
        InlineKeyboardMarkup keyboard = createUrlKeyboard("ចូលទៅកាន់ Seller Dashboard", dashboardUrl);

        sendNotificationWithKeyboard(chatId, sb.toString(), keyboard);
        log.info("Sent Telegram PROCESSING notification to seller [{}] for Order #{}", seller.getEmail(), order.getId());
    }

    /**
     * Notification when order is completed successfully (SUCCESS / COMPLETED).
     */
    public void sendSellerOrderSuccessNotification(User seller, Order order, List<OrderItem> sellerItems) {
        if (seller == null || order == null) return;

        String chatId = resolveSellerChatId(seller);
        if (chatId == null) {
            log.debug("Seller [{}] has no Telegram connected for success alert.", seller.getEmail());
            return;
        }

        String customerName = "Customer";
        String customerEmail = "N/A";
        if (order.getUser() != null) {
            customerEmail = order.getUser().getEmail() != null ? order.getUser().getEmail() : "N/A";
            customerName = order.getUser().getName() != null && !order.getUser().getName().isBlank() 
                    ? order.getUser().getName() 
                    : customerEmail.split("@")[0];
        }

        String orderDate = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

        StringBuilder sb = new StringBuilder();
        sb.append("[ការជូនដំណឹង: ការបញ្ជាទិញបានជោគជ័យ - ORDER SUCCESS / COMPLETED]\n");
        sb.append("=========================\n");
        sb.append("លេខបញ្ជាទិញ (Order ID): #").append(order.getId()).append("\n");
        sb.append("ឈ្មោះអតិថិជន (Customer): ").append(customerName).append("\n");
        sb.append("អ៊ីមែលអតិថិជន (Email): ").append(customerEmail).append("\n");
        sb.append("ស្ថានភាព (Status): COMPLETED (រួចរាល់)\n");
        sb.append("កាលបរិច្ឆេទ (Date): ").append(orderDate).append("\n");
        sb.append("-------------------------\n");
        sb.append("មុខទំនិញដែលបានបញ្ចប់ (ITEMS):\n");

        double sellerTotal = 0.0;
        List<OrderItem> itemsToDisplay = (sellerItems != null && !sellerItems.isEmpty()) ? sellerItems : order.getItems();
        if (itemsToDisplay != null) {
            for (OrderItem item : itemsToDisplay) {
                if (item == null) continue;
                Product p = item.getProduct();
                String pName = p != null && p.getName() != null ? p.getName() : "Digital Product";
                double pPrice = p != null && p.getBasePrice() != null ? p.getBasePrice() : (item.getPrice() != null ? item.getPrice() : 0.0);
                String duration = p != null && p.getDuration() != null ? p.getDuration() : "1 Month";
                String pType = p != null && p.getProductType() != null ? p.getProductType() : "ACCOUNT";
                int qty = item.getQuantity() != null ? item.getQuantity() : 1;

                sellerTotal += (pPrice * qty);

                sb.append("- ឈ្មោះទំនិញ: ").append(pName).append("\n");
                sb.append("  តម្លៃ (Price): $").append(String.format("%.2f", pPrice)).append("\n");
                sb.append("  រយៈពេល (Duration): ").append(duration).append("\n");
                sb.append("  ប្រភេទ (Type): ").append(pType).append("\n");
                sb.append("  បរិមាណ (Qty): ").append(qty).append("\n");
            }
        }

        sb.append("-------------------------\n");
        sb.append("ប្រាក់ចំណូលសុទ្ធរបស់អ្នកលក់ (Net): +$").append(String.format("%.2f", sellerTotal)).append(" (បានបញ្ចូលទៅក្នុងកាបូបប្រាក់)\n");
        sb.append("=========================\n");
        sb.append("ការបញ្ជាទិញនេះត្រូវបានបញ្ចប់ជោគជ័យ។ ប្រាក់ចំណូលត្រូវបានបញ្ចូលទៅក្នុងសមតុល្យហាងរបស់អ្នករួចរាល់!");

        String ordersUrl = appBaseUrl + "/seller?tab=orders";
        String walletUrl = appBaseUrl + "/seller?tab=wallet";
        InlineKeyboardMarkup keyboard = createDoubleUrlKeyboard("មើលការបញ្ជាទិញ", ordersUrl, "ពិនិត្យកាបូបប្រាក់", walletUrl);

        sendNotificationWithKeyboard(chatId, sb.toString(), keyboard);
        log.info("Sent Telegram SUCCESS notification to seller [{}] for Order #{}", seller.getEmail(), order.getId());
    }

    /**
     * Notification when seller store subscription has 7 days (or <= 7 days) left before expiring.
     */
    public void sendSellerSubscriptionExpiryWarningNotification(SellerProfile profile, long daysRemaining) {
        if (profile == null) return;

        String chatId = profile.getTelegramChatId();
        if (chatId == null && profile.getUser() != null) {
            chatId = profile.getUser().getTelegramChatId();
        }

        if (chatId == null || chatId.isBlank()) {
            log.debug("Seller [{}] has no Telegram connected for subscription expiry warning.", profile.getStoreName());
            return;
        }

        String userEmail = (profile.getUser() != null && profile.getUser().getEmail() != null) ? profile.getUser().getEmail() : "N/A";
        String expiryDateStr = profile.getSubscriptionExpiresAt() != null 
                ? profile.getSubscriptionExpiresAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                : "Soon";

        String planTitle = profile.getSubscriptionPlan() != null ? profile.getSubscriptionPlan().name() : "PLAN_1 ($2.50/month)";
        if ("PLAN_1".equalsIgnoreCase(planTitle)) planTitle = "PLAN 1 - Basic ($2.50/month)";
        else if ("PLAN_2".equalsIgnoreCase(planTitle)) planTitle = "PLAN 2 - Pro ($4.50/month)";
        else if ("PLAN_3".equalsIgnoreCase(planTitle)) planTitle = "PLAN 3 - VIP ($6.00/month)";

        StringBuilder sb = new StringBuilder();
        sb.append("[ការដាស់តឿន: សុពលភាពហាងរបស់អ្នកជិតផុតកំណត់ - SUBSCRIPTION EXPIRING SOON]\n");
        sb.append("=========================\n");
        sb.append("ឈ្មោះហាង (Store): ").append(profile.getStoreName()).append(" (#").append(profile.getId()).append(")\n");
        sb.append("គណនី (Email): ").append(userEmail).append("\n");
        sb.append("កញ្ចប់បច្ចុប្បន្ន (Current Plan): ").append(planTitle).append("\n");
        sb.append("កាលបរិច្ឆេទផុតកំណត់ (Expiry Date): ").append(expiryDateStr).append("\n");
        sb.append("រយៈពេលនៅសល់: ").append(daysRemaining).append(" ថ្ងៃទៀត (").append(daysRemaining).append(" Days Left)\n");
        sb.append("=========================\n");
        sb.append("សូមបន្តសុពលភាពគម្រោងហាងរបស់អ្នកឥឡូវនេះ ដើម្បីជៀសវាងការផ្អាកហាងជាបណ្តោះអាសន្ន និងការលាក់ផលិតផលពីការស្វែងរករបស់អតិថិជន។\n\n");
        sb.append("ចុចប៊ូតុងខាងក្រោមដើម្បីចូលទៅកាន់គេហទំព័រ និងទូទាត់បន្តគម្រោងតាមរយៈ KHQR ($2.50/ខែ)៖");

        String renewalUrl = appBaseUrl + "/seller?tab=overview&openRenewal=true";
        String storeUrl = appBaseUrl + "/seller";
        InlineKeyboardMarkup keyboard = createDoubleUrlKeyboard("បន្តសុពលភាពគម្រោង (Renew Plan)", renewalUrl, "ចូលទៅកាន់ហាង", storeUrl);

        sendNotificationWithKeyboard(chatId.trim(), sb.toString(), keyboard);
        log.info("Sent Telegram 7-day subscription expiry warning to seller store [{}] (#{})", profile.getStoreName(), profile.getId());
    }

    /**
     * Notification when seller store subscription is expired.
     */
    public void sendSellerSubscriptionExpiredNotification(SellerProfile profile) {
        if (profile == null) return;

        String chatId = profile.getTelegramChatId();
        if (chatId == null && profile.getUser() != null) {
            chatId = profile.getUser().getTelegramChatId();
        }

        if (chatId == null || chatId.isBlank()) {
            log.debug("Seller [{}] has no Telegram connected for subscription expired notice.", profile.getStoreName());
            return;
        }

        String userEmail = (profile.getUser() != null && profile.getUser().getEmail() != null) ? profile.getUser().getEmail() : "N/A";
        StringBuilder sb = new StringBuilder();
        sb.append("[ការជូនដំណឹង: សុពលភាពហាងបានផុតកំណត់ - SUBSCRIPTION EXPIRED]\n");
        sb.append("=========================\n");
        sb.append("ឈ្មោះហាង (Store): ").append(profile.getStoreName()).append(" (#").append(profile.getId()).append(")\n");
        sb.append("គណនី (Email): ").append(userEmail).append("\n");
        sb.append("ស្ថានភាព (Status): ផុតកំណត់ (EXPIRED)\n");
        sb.append("=========================\n");
        sb.append("ហាងរបស់អ្នកត្រូវបានផ្អាកជាបណ្តោះអាសន្ន ដោយសារផុតកំណត់សុពលភាពគម្រោង។ ផលិតផលរបស់អ្នកត្រូវបានលាក់ពីការស្វែងរកជាបណ្តោះអាសន្ន។\n\n");
        sb.append("សូមចុចប៊ូតុងខាងក្រោមដើម្បីបន្តសុពលភាពគម្រោងភ្លាមៗ និងបើកដំណើរការហាងរបស់អ្នកឡើងវិញ៖");

        String renewalUrl = appBaseUrl + "/seller?tab=overview&openRenewal=true";
        InlineKeyboardMarkup keyboard = createUrlKeyboard("បន្តសុពលភាពគម្រោងឥឡូវនេះ (Renew Plan Now)", renewalUrl);

        sendNotificationWithKeyboard(chatId.trim(), sb.toString(), keyboard);
        log.info("Sent Telegram subscription EXPIRED notice to seller store [{}] (#{})", profile.getStoreName(), profile.getId());
    }

    public void sendAdminOrderNotification(Order order) {
        if (order == null) return;

        String customerName = "Customer";
        String customerEmail = "N/A";
        if (order.getUser() != null) {
            customerEmail = order.getUser().getEmail() != null ? order.getUser().getEmail() : "N/A";
            customerName = order.getUser().getName() != null && !order.getUser().getName().isBlank() 
                    ? order.getUser().getName() 
                    : customerEmail.split("@")[0];
        }

        String orderDate = order.getCreatedAt() != null 
                ? order.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                : LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

        StringBuilder sb = new StringBuilder();
        sb.append("[ការជូនដំណឹងការបញ្ជាទិញថ្មី - ADMIN ALERT]\n");
        sb.append("=========================\n");
        sb.append("លេខបញ្ជាទិញ (Order ID): #").append(order.getId()).append("\n");
        sb.append("អតិថិជន (Customer): ").append(customerName).append(" (").append(customerEmail).append(")\n");
        sb.append("ចំនួនទឹកប្រាក់សរុប (Total): $").append(String.format("%.2f", order.getTotalAmount() != null ? order.getTotalAmount() : 0.0)).append("\n");
        sb.append("ស្ថានភាព (Status): ").append(order.getStatus()).append("\n");
        sb.append("លេខកូដទូទាត់ (Payment ID): ").append(order.getPaymentId() != null ? order.getPaymentId() : "N/A").append("\n");
        sb.append("កាលបរិច្ឆេទ (Date): ").append(orderDate).append("\n");
        sb.append("-------------------------\n");
        sb.append("បញ្ជីមុខទំនិញ (ORDER ITEMS):\n");

        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                if (item == null) continue;
                Product p = item.getProduct();
                String pName = p != null && p.getName() != null ? p.getName() : "Digital Product";
                double price = item.getPrice() != null ? item.getPrice() : 0.0;
                String duration = p != null && p.getDuration() != null ? p.getDuration() : "1 Month";
                String pType = p != null && p.getProductType() != null ? p.getProductType() : "ACCOUNT";
                String sellerInfo = (p != null && p.getSeller() != null) ? p.getSeller().getEmail() : "Admin";

                sb.append("- ឈ្មោះទំនិញ: ").append(pName).append("\n");
                sb.append("  តម្លៃ: $").append(String.format("%.2f", price)).append("\n");
                sb.append("  រយៈពេល: ").append(duration).append("\n");
                sb.append("  ប្រភេទ: ").append(pType).append("\n");
                sb.append("  អ្នកលក់ (Seller): ").append(sellerInfo).append("\n");
            }
        }
        sb.append("=========================");

        sendAdminMessage(sb.toString());
    }
}
