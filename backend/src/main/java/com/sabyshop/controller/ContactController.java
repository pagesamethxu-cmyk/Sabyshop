package com.sabyshop.controller;

import com.sabyshop.dto.ApiResponse;
import com.sabyshop.dto.ContactRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
public class ContactController {

    @Qualifier("bakongRestTemplate")
    private final RestTemplate restTemplate;

    @Value("${resend.api.key}")
    private String resendApiKey;

    @PostMapping
    public ResponseEntity<ApiResponse<String>> sendContactEmail(@RequestBody ContactRequest request) {
        if (request.getName() == null || request.getEmail() == null || request.getMessage() == null) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Name, email, and message are required", null));
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(resendApiKey);

            String subject = "[Saby Shop Support] " + (request.getSubject() != null && !request.getSubject().isEmpty() ? request.getSubject() : "Order Inquiry / Question");

            String htmlBody = String.format(
                "<div style=\"font-family: Arial, sans-serif; padding: 20px; color: #1f2937; line-height: 1.6;\">" +
                "<h2 style=\"color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-top: 0;\">New Message from Send Us a Message Form</h2>" +
                "<table style=\"width: 100%%; border-collapse: collapse; margin-bottom: 20px;\">" +
                "<tr><td style=\"padding: 6px 0; font-weight: bold; width: 130px; color: #4b5563;\">Name:</td><td style=\"padding: 6px 0; color: #111827;\">%s</td></tr>" +
                "<tr><td style=\"padding: 6px 0; font-weight: bold; color: #4b5563;\">Sender Email:</td><td style=\"padding: 6px 0; color: #111827;\"><a href=\"mailto:%s\">%s</a></td></tr>" +
                "<tr><td style=\"padding: 6px 0; font-weight: bold; color: #4b5563;\">Subject:</td><td style=\"padding: 6px 0; color: #111827;\">%s</td></tr>" +
                "</table>" +
                "<div style=\"background-color: #f9fafb; border-left: 4px solid #4f46e5; padding: 15px; border-radius: 4px;\">" +
                "<h4 style=\"margin: 0 0 10px 0; color: #374151;\">Message:</h4>" +
                "<p style=\"margin: 0; white-space: pre-wrap; color: #1f2937;\">%s</p>" +
                "</div>" +
                "<p style=\"margin-top: 25px; font-size: 0.85rem; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 15px;\">This email was submitted directly via Saby Shop online store.</p>" +
                "</div>",
                escapeHtml(request.getName()),
                escapeHtml(request.getEmail()),
                escapeHtml(request.getEmail()),
                escapeHtml(request.getSubject() != null ? request.getSubject() : "N/A"),
                escapeHtml(request.getMessage())
            );

            Map<String, Object> payload = new HashMap<>();
            payload.put("from", "Saby Shop <onboarding@resend.dev>");
            payload.put("to", "korbsameth.dev@gmail.com");
            payload.put("subject", subject);
            payload.put("html", htmlBody);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response = restTemplate.postForEntity("https://api.resend.com/emails", entity, (Class<Map<String, Object>>) (Class<?>) Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null && response.getBody().containsKey("id")) {
                return ResponseEntity.ok(new ApiResponse<>(true, "Message sent successfully", (String) response.getBody().get("id")));
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse<>(false, "Failed to send email via Resend", null));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error sending email: " + e.getMessage(), null));
        }
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
                    .replace("\"", "&quot;")
                    .replace("'", "&#39;");
    }
}
