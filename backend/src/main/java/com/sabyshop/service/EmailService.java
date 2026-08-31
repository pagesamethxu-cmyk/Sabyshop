package com.sabyshop.service;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

import com.sabyshop.model.Order;
import com.sabyshop.model.OrderItem;
import com.sabyshop.model.OrderStatus;
import com.sabyshop.model.User;

@Service
@Slf4j
public class EmailService {

  @Autowired(required = false)
  private JavaMailSender mailSender;

  @Value("${spring.mail.username:korbsameth.dev@gmail.com}")
  private String mailFrom;

  @Value("${spring.mail.password:}")
  private String mailPassword;

  @Value("${app.admin.notification.email:${app.default.admin.email:korbsameth.dev@gmail.com}}")
  private String adminEmail;

  @Value("${resend.api.key:}")
  private String resendApiKey;

  private final RestTemplate restTemplate = new RestTemplate();

  public void sendEmailAsync(String toEmail, String subject, String htmlContent) {
    if (toEmail == null || toEmail.isBlank()) {
      return;
    }
    String cleanedEmail = toEmail.trim().toLowerCase();
    if (cleanedEmail.endsWith("@sabyshop.com") || cleanedEmail.endsWith("@example.com") || cleanedEmail.endsWith("@store.com") || cleanedEmail.startsWith("support-bot@") || cleanedEmail.startsWith("seller-bot@")) {
      log.info("[EmailService] Suppressed email to internal/dummy address: {}", toEmail);
      return;
    }

    new Thread(() -> {
      // 1. Try Gmail SMTP
      if (mailSender != null && mailPassword != null && !mailPassword.trim().isEmpty()) {
        try {
          MimeMessage message = mailSender.createMimeMessage();
          MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
          helper.setFrom("Saby Shop <" + mailFrom + ">");
          helper.setTo(toEmail);
          helper.setSubject(subject);
          helper.setText(htmlContent, true);
          mailSender.send(message);
          log.info("[Gmail SMTP] Email sent successfully to: {}", toEmail);
          return;
        } catch (Exception e) {
          log.warn("[Gmail SMTP Error] Failed to send email via Gmail: {}", e.getMessage());
        }
      }

      // 2. Fallback to Resend API
      try {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(resendApiKey);

        String recipient = "korbsameth.dev@gmail.com";

        Map<String, Object> payload = new HashMap<>();
        payload.put("from", "Saby Shop <onboarding@resend.dev>");
        payload.put("to", recipient);
        payload.put("subject", subject + (toEmail.equalsIgnoreCase(recipient) ? "" : " [Target: " + toEmail + "]"));
        payload.put("html", htmlContent);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
        ResponseEntity<String> response = restTemplate.postForEntity("https://api.resend.com/emails", entity, String.class);
        log.info("[Resend Email] Email sent to {} for target {} | Status: {}", recipient, toEmail, response.getStatusCode());
      } catch (Exception e) {
        log.warn("[Resend Email Error] Failed to send email for {}: {}", toEmail, e.getMessage());
      }
    }).start();
  }

  public void sendUserChatNotificationToSeller(String sellerEmail, String sellerName, String customerName, String customerEmail, Long orderId, String messageContent) {
    if (sellerEmail == null || sellerEmail.isBlank()) return;
    String currentTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    String subject = String.format("[Saby Shop Store] New Customer Message from %s", customerName);

    String htmlContent = String.format(
        "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 12px; color: #1f2937;\">" +
        "<div style=\"text-align: center; margin-bottom: 20px;\">" +
        "<h1 style=\"color: #6366f1; margin: 0;\">Saby Shop Seller Portal</h1>" +
        "<h3 style=\"color: #111827; margin-top: 6px;\">សារថ្មីពីអតិថិជនមកកាន់ហាងរបស់អ្នក (New Customer Message)</h3>" +
        "</div>" +
        "<p>ជម្រាបសួរ <strong>%s</strong>,</p>" +
        "<p>អតិថិជន <strong>%s</strong> (%s) បានផ្ញើសារថ្មីមកកាន់ហាងរបស់អ្នក៖</p>" +
        "<div style=\"background-color: #f3f4f6; padding: 15px; border-left: 4px solid #6366f1; margin: 15px 0; border-radius: 6px; font-style: italic;\">%s</div>" +
        "<p style=\"color: #6b7280; font-size: 13px;\">កាលបរិច្ឆេទ: %s %s</p>" +
        "<div style=\"text-align: center; margin-top: 25px;\">" +
        "<a href=\"https://sabyshop.com/seller\" style=\"background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;\">ចូលទៅកាន់ប្រព័ន្ធគ្រប់គ្រងហាង (Open Seller Inbox)</a>" +
        "</div>" +
        "</div>",
        sellerName != null ? sellerName : "Seller",
        customerName != null ? customerName : "Customer",
        customerEmail != null ? customerEmail : "",
        messageContent,
        currentTime,
        orderId != null ? "(Order #" + orderId + ")" : ""
    );

    sendEmailAsync(sellerEmail, subject, htmlContent);
  }

  public void sendUserChatNotificationToAdmin(String senderName, String senderEmail, Long orderId, String messageContent) {
    String currentTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    String subject = String.format("[Saby Shop Chat] សារគាំទ្រថ្មីពីអតិថិជន %s (Order #%s)", senderName, orderId != null ? orderId : "General");

    String htmlContent = String.format(
        "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 12px; color: #1f2937;\">" +
        "<div style=\"text-align: center; margin-bottom: 20px;\">" +
        "<h1 style=\"color: #4f46e5; margin: 0;\">Saby Shop Support</h1>" +
        "<h3 style=\"color: #111827; margin-top: 6px;\">សារគាំទ្រថ្មីពីអតិថិជន (Customer Message)</h3>" +
        "</div>" +
        "<p>អតិថិជន: <strong>%s</strong> (%s)</p>" +
        "<p>លេខបញ្ជាទិញ (Order ID): <strong>#%s</strong></p>" +
        "<p>ពេលវេលា: <strong>%s</strong></p>" +
        "<div style=\"background-color: #f3f4f6; border-left: 4px solid #4f46e5; padding: 15px; border-radius: 6px; margin: 20px 0;\">" +
        "<p style=\"margin: 0; font-size: 1rem; color: #111827;\"><strong>ខ្លឹមសារសារ:</strong> %s</p>" +
        "</div>" +
        "<p style=\"font-size: 0.85rem; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px;\">Saby Shop Admin Notification Center</p>" +
        "</div>",
        senderName, senderEmail, orderId != null ? orderId : "General", currentTime, messageContent
    );

    sendEmailAsync(adminEmail, subject, htmlContent);
  }

  public void sendSupportReplyNotificationToUser(String targetUserEmail, String replierName, Long orderId, String replyContent) {
    if (targetUserEmail == null || targetUserEmail.isBlank()) return;

    String currentTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    String subject = String.format("[Saby Shop Support] ចម្លើយសារគាំទ្រពី %s (Order #%s)", replierName, orderId != null ? orderId : "General");

    String htmlContent = String.format(
        "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 12px; color: #1f2937;\">" +
        "<div style=\"text-align: center; margin-bottom: 20px;\">" +
        "<h1 style=\"color: #4f46e5; margin: 0;\">Saby Shop Support</h1>" +
        "<h3 style=\"color: #111827; margin-top: 6px;\">ចម្លើយសារពីក្រុមការងារ (Support Reply)</h3>" +
        "</div>" +
        "<p>ជម្រាបសួរ បង! ក្រុមការងារ/AI <strong>%s</strong> បានឆ្លើយតបសាររបស់បងលើការបញ្ជាទិញ <strong>#%s</strong>៖</p>" +
        "<div style=\"background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 6px; margin: 20px 0;\">" +
        "<p style=\"margin: 0; font-size: 1rem; color: #1e40af;\"><strong>ចម្លើយសារ:</strong> %s</p>" +
        "</div>" +
        "<p style=\"font-size: 0.88rem; color: #4b5563;\">ពេលវេលា: %s</p>" +
        "<p style=\"margin-top: 30px; font-size: 0.85rem; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px;\">Saby Shop — Safe &amp; Fast Digital Store</p>" +
        "</div>",
        replierName, orderId != null ? orderId : "General", replyContent, currentTime
    );

    sendEmailAsync(targetUserEmail, subject, htmlContent);
  }

  public void sendOrderStatusNotification(User user, Order order, OrderStatus status) {
    if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
      return;
    }

    String toEmail = user.getEmail();
    String currentTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    String statusText;
    String statusBgColor;
    String statusTextColor;

    if (status == null) {
      status = OrderStatus.PENDING;
    }

    switch (status) {
      case COMPLETED -> {
        statusText = "ការទូទាត់ជោគជ័យ (COMPLETED)";
        statusBgColor = "#d1fae5";
        statusTextColor = "#065f46";
      }
      case PROCESSING -> {
        statusText = "កំពុងដំណើរការ (PROCESSING)";
        statusBgColor = "#dbeafe";
        statusTextColor = "#1e40af";
      }
      case FAILED -> {
        statusText = "បរាជ័យ (FAILED)";
        statusBgColor = "#fee2e2";
        statusTextColor = "#991b1b";
      }
      case CANCELLED -> {
        statusText = "បានបោះបង់ (CANCELLED)";
        statusBgColor = "#f3f4f6";
        statusTextColor = "#374151";
      }
      default -> {
        statusText = "រង់ចាំការទូទាត់ (PENDING)";
        statusBgColor = "#fef3c7";
        statusTextColor = "#92400e";
      }
    }

    String subject = String.format("[Saby Shop] បច្ចុប្បន្នភាពការបញ្ជាទិញ #%d — %s", order.getId(), statusText);

    StringBuilder itemsHtml = new StringBuilder();
    itemsHtml.append("<table style=\"width: 100%; border-collapse: collapse; margin-top: 15px;\">");
    itemsHtml.append("<thead><tr style=\"background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; text-align: left;\">");
    itemsHtml.append("<th style=\"padding: 10px;\">ទំនិញ (Item)</th>");
    itemsHtml.append("<th style=\"padding: 10px; text-align: right;\">តម្លៃ (Price)</th>");
    itemsHtml.append("</tr></thead><tbody>");

    if (order.getItems() != null) {
      for (OrderItem item : order.getItems()) {
        String productName = (item.getProduct() != null) ? item.getProduct().getName() : "Digital Product";
        double price = (item.getPrice() != null) ? item.getPrice() : 0.0;
        itemsHtml.append("<tr style=\"border-bottom: 1px solid #f1f5f9;\">");
        itemsHtml.append("<td style=\"padding: 10px;\">").append(productName).append("</td>");
        itemsHtml.append("<td style=\"padding: 10px; text-align: right;\">$").append(String.format("%.2f", price)).append("</td>");
        itemsHtml.append("</tr>");
      }
    }
    itemsHtml.append("</tbody></table>");

    StringBuilder credentialsHtml = new StringBuilder();
    if (status == OrderStatus.COMPLETED && order.getItems() != null) {
      boolean hasDeliveredStock = false;
      StringBuilder stockList = new StringBuilder();
      for (OrderItem item : order.getItems()) {
        if (item.getStockItem() != null) {
          hasDeliveredStock = true;
          String pName = (item.getProduct() != null) ? item.getProduct().getName() : "Product";
          stockList.append("<div style=\"background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 8px; margin-bottom: 10px;\">");
          stockList.append("<p style=\"margin: 0 0 5px 0; font-weight: bold; color: #166534;\"> ").append(pName).append("</p>");
          if (item.getStockItem().getAccountEmail() != null) {
            stockList.append("<p style=\"margin: 2px 0; font-size: 0.9rem;\"><strong>Email/User:</strong> <code>").append(item.getStockItem().getAccountEmail()).append("</code></p>");
          }
          if (item.getStockItem().getAccountPassword() != null) {
            stockList.append("<p style=\"margin: 2px 0; font-size: 0.9rem;\"><strong>Password/Key:</strong> <code>").append(item.getStockItem().getAccountPassword()).append("</code></p>");
          }
          stockList.append("</div>");
        }
      }
      if (hasDeliveredStock) {
        credentialsHtml.append("<div style=\"margin-top: 20px;\">");
        credentialsHtml.append("<h4 style=\"color: #15803d; margin-bottom: 10px;\"> ព័ត៌មានគណនី/ផលិតផល (Account Credentials)</h4>");
        credentialsHtml.append(stockList);
        credentialsHtml.append("</div>");
      }
    }

    String htmlContent = String.format(
        "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 12px; color: #1f2937;\">" +
        "<div style=\"text-align: center; margin-bottom: 20px;\">" +
        "<h1 style=\"color: #4f46e5; margin: 0;\">Saby Shop</h1>" +
        "<p style=\"color: #6b7280; margin-top: 4px;\">Safe &amp; Fast Digital Store</p>" +
        "</div>" +
        "<div style=\"background-color: %s; color: %s; padding: 12px 18px; border-radius: 8px; font-weight: bold; text-align: center; margin-bottom: 20px;\">" +
        "ស្ថានភាពបញ្ជាទិញ: %s" +
        "</div>" +
        "<p>ជម្រាបសួរ <strong>%s</strong>,</p>" +
        "<p>អរគុណសម្រាប់ការបញ្ជាទិញនៅ Saby Shop! ខាងក្រោមនេះជាព័ត៌មានលម្អិតនៃការបញ្ជាទិញលេខ <strong>#%d</strong>៖</p>" +
        "%s" +
        "<div style=\"text-align: right; margin-top: 15px; font-size: 1.1rem;\">" +
        "<strong>សរុប (Total): <span style=\"color: #4f46e5;\">$%.2f</span></strong>" +
        "</div>" +
        "%s" +
        "<p style=\"margin-top: 25px; font-size: 0.88rem; color: #4b5563;\">ពេលវេលាធ្វើបច្ចុប្បន្នភាព: %s</p>" +
        "<p style=\"margin-top: 30px; font-size: 0.85rem; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px;\">ប្រសិនបើមានចម្ងល់ សូមទាក់ទងមក Telegram Support របស់ Saby Shop</p>" +
        "</div>",
        statusBgColor, statusTextColor, statusText,
        user.getEmail(), order.getId(),
        itemsHtml.toString(),
        order.getTotalAmount() != null ? order.getTotalAmount() : 0.0,
        credentialsHtml.toString(),
        currentTime
    );

    sendEmailAsync(toEmail, subject, htmlContent);
  }

  public void sendSellerNewOrderNotification(User seller, Order order, String productName, double earnings) {
    if (seller == null || seller.getEmail() == null) return;
    String subject = String.format("[Saby Shop Seller] New Order #%d - Product Purchased!", order.getId());
    String html = String.format(
        "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 12px; color: #1f2937;\">" +
        "<h2 style=\"color: #10b981; margin-top: 0;\">New Order Received!</h2>" +
        "<p>A customer has purchased your product on Saby Shop.</p>" +
        "<table style=\"width: 100%%; border-collapse: collapse; margin: 20px 0;\">" +
        "<tr style=\"background: #f3f4f6;\"><th style=\"padding: 10px; text-align: left;\">Order ID</th><td style=\"padding: 10px;\">#%d</td></tr>" +
        "<tr><th style=\"padding: 10px; text-align: left;\">Product</th><td style=\"padding: 10px;\">%s</td></tr>" +
        "<tr style=\"background: #f3f4f6;\"><th style=\"padding: 10px; text-align: left;\">Your Earnings</th><td style=\"padding: 10px; color: #10b981; font-weight: bold;\">$%.2f</td></tr>" +
        "<tr><th style=\"padding: 10px; text-align: left;\">Buyer</th><td style=\"padding: 10px;\">%s</td></tr>" +
        "</table>" +
        "<p style=\"font-size: 0.9rem; color: #6b7280;\">Log in to your Seller Dashboard to view full order details.</p>" +
        "</div>",
        order.getId(), productName, earnings, order.getUser() != null ? order.getUser().getEmail() : "Customer"
    );
    sendEmailAsync(seller.getEmail(), subject, html);
  }

  public void sendDisputeCreatedToSeller(String sellerEmail, String sellerName, String buyerEmail, Long orderId, String productName, String issueType, String preferredSolution, String description) {
    if (sellerEmail == null || sellerEmail.isBlank()) return;
    String currentTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    String subject = String.format("[Saby Shop Action Required] Dispute / Replacement Request for Order #%d", orderId);

    String html = String.format(
        "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #fca5a5; border-radius: 14px; color: #1f2937; background: #fff;\">" +
        "<div style=\"text-align: center; margin-bottom: 20px; border-bottom: 2px solid #fee2e2; padding-bottom: 15px;\">" +
        "<span style=\"background: #fee2e2; color: #dc2626; padding: 4px 12px; border-radius: 99px; font-size: 0.8rem; font-weight: bold;\">ACTION REQUIRED</span>" +
        "<h2 style=\"color: #dc2626; margin: 10px 0 4px 0;\">សំណើសុំប្តូរគណនី / ទំនាស់ថ្មី (Dispute &amp; Replacement)</h2>" +
        "<p style=\"margin: 0; color: #64748b; font-size: 0.88rem;\">Order #%d · Safe Trade Protection</p>" +
        "</div>" +
        "<p>ជម្រាបសួរ <strong>%s</strong>,</p>" +
        "<p>អតិថិជន <strong>%s</strong> បានដាក់ពាក្យបណ្ដឹង/ស្នើសុំប្តូរទំនិញថ្មីលើការបញ្ជាទិញ <strong>#%d</strong> (%s)៖</p>" +
        "<table style=\"width: 100%%; border-collapse: collapse; margin: 16px 0; font-size: 0.9rem;\">" +
        "<tr style=\"background: #f8fafc;\"><td style=\"padding: 8px 12px; font-weight: bold; width: 140px; color: #475569;\">ប្រភេទបញ្ហា:</td><td style=\"padding: 8px 12px; color: #dc2626; font-weight: bold;\">%s</td></tr>" +
        "<tr><td style=\"padding: 8px 12px; font-weight: bold; color: #475569;\">ដំណោះស្រាយដែលចង់បាន:</td><td style=\"padding: 8px 12px; color: #2563eb; font-weight: bold;\">%s</td></tr>" +
        "<tr style=\"background: #f8fafc;\"><td style=\"padding: 8px 12px; font-weight: bold; color: #475569;\">ការពិពណ៌នា:</td><td style=\"padding: 8px 12px;\">%s</td></tr>" +
        "<tr><td style=\"padding: 8px 12px; font-weight: bold; color: #475569;\">ពេលវេលា:</td><td style=\"padding: 8px 12px; color: #64748b;\">%s</td></tr>" +
        "</table>" +
        "<div style=\"background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 14px; border-radius: 6px; margin: 18px 0; font-size: 0.85rem; color: #991b1b;\">" +
        "<strong>ការទទួលខុសត្រូវរបស់អ្នកលក់៖</strong> សូមចូលទៅកាន់ Seller Portal — DISPUTES ដើម្បីផ្តល់គណនីប្តូរថ្មីជូនអតិថិជន ឬយល់ព្រមបង្វិលប្រាក់ ដើម្បីការពារកុំឱ្យប៉ះពាល់ដល់កេរ្តិ៍ឈ្មោះហាង និង Escrow។" +
        "</div>" +
        "<div style=\"text-align: center; margin: 25px 0 15px 0;\">" +
        "<a href=\"https://sabyshop.com/seller-dashboard?tab=disputes\" style=\"background: linear-gradient(135deg, #ef4444, #dc2626); color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(239,68,68,0.3);\">ចូលទៅកាន់ Seller Portal — DISPUTES</a>" +
        "</div>" +
        "<p style=\"font-size: 0.78rem; color: #94a3b8; text-align: center; margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 12px;\">Saby Shop Escrow &amp; Safe Trade Automated System</p>" +
        "</div>",
        orderId,
        sellerName != null ? sellerName : "Seller",
        buyerEmail != null ? buyerEmail : "Customer",
        orderId,
        productName != null ? productName : "Digital Product",
        issueType != null ? issueType : "Issue Reported",
        preferredSolution != null ? preferredSolution : "Replacement",
        description != null ? description : "No description provided",
        currentTime
    );

    sendEmailAsync(sellerEmail, subject, html);
  }

  public void sendDisputeConfirmationToBuyer(String buyerEmail, String buyerName, Long orderId, String productName, String issueType, String preferredSolution) {
    if (buyerEmail == null || buyerEmail.isBlank()) return;
    String subject = String.format("[Saby Shop Safe Trade] Dispute / Replacement Request Received (Order #%d)", orderId);

    String html = String.format(
        "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 14px; color: #1f2937; background: #fff;\">" +
        "<div style=\"text-align: center; margin-bottom: 20px; border-bottom: 2px solid #e0e7ff; padding-bottom: 15px;\">" +
        "<span style=\"background: #e0e7ff; color: #4338ca; padding: 4px 12px; border-radius: 99px; font-size: 0.8rem; font-weight: bold;\">SAFE TRADE ESCROW ACTIVE</span>" +
        "<h2 style=\"color: #4338ca; margin: 10px 0 4px 0;\">សំណើសុំប្តូរគណនី / ទំនាស់ត្រូវបានទទួល</h2>" +
        "<p style=\"margin: 0; color: #64748b; font-size: 0.88rem;\">Order #%d · %s</p>" +
        "</div>" +
        "<p>ជម្រាបសួរ <strong>%s</strong>,</p>" +
        "<p>យើងខ្ញុំបានទទួលសំណើសុំប្តូរគណនី ឬពាក្យបណ្ដឹងរបស់អ្នកលើការបញ្ជាទិញ <strong>#%d</strong> រួចរាល់ហើយ។ ប្រព័ន្ធ Safe Trade Escrow បានបង្កកថវិកា ដើម្បីការពារសិទ្ធិរបស់អ្នកទិញ ១០០%%។</p>" +
        "<table style=\"width: 100%%; border-collapse: collapse; margin: 16px 0; font-size: 0.9rem;\">" +
        "<tr style=\"background: #f8fafc;\"><td style=\"padding: 8px 12px; font-weight: bold; width: 140px; color: #475569;\">លេខបញ្ជាទិញ:</td><td style=\"padding: 8px 12px;\">#%d</td></tr>" +
        "<tr><td style=\"padding: 8px 12px; font-weight: bold; color: #475569;\">ផលិតផល:</td><td style=\"padding: 8px 12px; font-weight: bold;\">%s</td></tr>" +
        "<tr style=\"background: #f8fafc;\"><td style=\"padding: 8px 12px; font-weight: bold; color: #475569;\">ប្រភេទបញ្ហា:</td><td style=\"padding: 8px 12px; color: #dc2626;\">%s</td></tr>" +
        "<tr><td style=\"padding: 8px 12px; font-weight: bold; color: #475569;\">ដំណោះស្រាយ:</td><td style=\"padding: 8px 12px; color: #10b981; font-weight: bold;\">%s</td></tr>" +
        "</table>" +
        "<p style=\"font-size: 0.88rem; color: #475569;\">អ្នកលក់ និង Admin Support ត្រូវបានជូនដំណឹងភ្លាមៗ។ អ្នកលក់នឹងផ្តល់គណនីថ្មី ឬឆ្លើយតបជូនអ្នកក្នុងពេលឆាប់ៗ។</p>" +
        "<div style=\"text-align: center; margin: 25px 0 15px 0;\">" +
        "<a href=\"https://sabyshop.com/orders/%d\" style=\"background: linear-gradient(135deg, #4f46e5, #6366f1); color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block;\">ពិនិត្យមើលស្ថានភាព Order</a>" +
        "</div>" +
        "<p style=\"font-size: 0.78rem; color: #94a3b8; text-align: center; margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 12px;\">Saby Shop — Safe &amp; 100%% Guaranteed Digital Store</p>" +
        "</div>",
        orderId,
        productName != null ? productName : "Digital Product",
        buyerName != null ? buyerName : "Customer",
        orderId,
        orderId,
        productName != null ? productName : "Digital Product",
        issueType != null ? issueType : "Issue",
        preferredSolution != null ? preferredSolution : "Replacement",
        orderId
    );

    sendEmailAsync(buyerEmail, subject, html);
  }

  public void sendDisputeResolvedToBuyer(String buyerEmail, String buyerName, Long orderId, String productName, String resolutionType, String responseMessage, String replacementEmail, String replacementPassword, String replacementNote) {
    if (buyerEmail == null || buyerEmail.isBlank()) return;
    String subject = String.format("[Saby Shop] Replacement Credentials Delivered for Order #%d", orderId);

    StringBuilder credentialsHtml = new StringBuilder();
    if (replacementEmail != null && !replacementEmail.isBlank()) {
      credentialsHtml.append("<div style=\"background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 10px; padding: 16px; margin: 16px 0;\">")
          .append("<h4 style=\"margin: 0 0 10px 0; color: #15803d;\">គណនីប្តូរថ្មី (Replacement Credentials):</h4>")
          .append("<p style=\"margin: 4px 0;\"><strong>Account / Key:</strong> <code style=\"background: #dcfce7; padding: 2px 6px; border-radius: 4px;\">").append(replacementEmail).append("</code></p>");
      if (replacementPassword != null && !replacementPassword.isBlank()) {
        credentialsHtml.append("<p style=\"margin: 4px 0;\"><strong>Password:</strong> <code style=\"background: #dcfce7; padding: 2px 6px; border-radius: 4px;\">").append(replacementPassword).append("</code></p>");
      }
      if (replacementNote != null && !replacementNote.isBlank()) {
        credentialsHtml.append("<p style=\"margin: 6px 0 0 0; font-size: 0.85rem; color: #166534;\"><em>Note: ").append(replacementNote).append("</em></p>");
      }
      credentialsHtml.append("</div>");
    }

    String html = String.format(
        "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #86efac; border-radius: 14px; color: #1f2937; background: #fff;\">" +
        "<div style=\"text-align: center; margin-bottom: 20px; border-bottom: 2px solid #dcfce7; padding-bottom: 15px;\">" +
        "<span style=\"background: #dcfce7; color: #15803d; padding: 4px 12px; border-radius: 99px; font-size: 0.8rem; font-weight: bold;\">RESOLVED</span>" +
        "<h2 style=\"color: #15803d; margin: 10px 0 4px 0;\">គណនីប្តូរថ្មីត្រូវបានប្រគល់ជូន!</h2>" +
        "<p style=\"margin: 0; color: #64748b; font-size: 0.88rem;\">Order #%d · %s</p>" +
        "</div>" +
        "<p>ជម្រាបសួរ <strong>%s</strong>,</p>" +
        "<p>អ្នកលក់បានឆ្លើយតប និងផ្តល់ដំណោះស្រាយ <strong>%s</strong> ជូនអ្នករួចរាល់ហើយ៖</p>" +
        "%s" +
        (responseMessage != null && !responseMessage.isBlank() ? "<div style=\"background: #f8fafc; padding: 12px; border-radius: 8px; margin: 12px 0; font-size: 0.88rem;\"><strong>សារពីអ្នកលក់:</strong> " + responseMessage + "</div>" : "") +
        "<div style=\"text-align: center; margin: 25px 0 15px 0;\">" +
        "<a href=\"https://sabyshop.com/orders/%d\" style=\"background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block;\">ចូលទៅកាន់ Order ដើម្បី Login</a>" +
        "</div>" +
        "<p style=\"font-size: 0.78rem; color: #94a3b8; text-align: center; margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 12px;\">Saby Shop — Safe &amp; 100%% Guaranteed Digital Store</p>" +
        "</div>",
        orderId,
        productName != null ? productName : "Digital Product",
        buyerName != null ? buyerName : "Customer",
        resolutionType != null ? resolutionType : "Replacement",
        credentialsHtml.toString(),
        orderId
    );

    sendEmailAsync(buyerEmail, subject, html);
  }
}