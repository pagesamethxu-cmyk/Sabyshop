package com.sabyshop.controller;

import com.sabyshop.config.TelegramBotConfig;
import com.sabyshop.dto.ApiResponse;
import com.sabyshop.service.TelegramBotHandlerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.api.objects.WebhookInfo;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/telegram")
@RequiredArgsConstructor
@Tag(name = "Telegram Webhook", description = "Telegram Bot Webhook Receiver and Management API")
public class TelegramWebhookController {

    private final TelegramBotHandlerService botHandlerService;
    private final TelegramBotConfig telegramBotConfig;

    @Value("${telegram.bot.secret-token:}")
    private String configuredSecretToken;

    /**
     * Webhook endpoint called by Telegram server whenever an update occurs.
     */
    @PostMapping("/webhook")
    @Operation(summary = "Telegram Webhook Update Receiver")
    public ResponseEntity<Void> onWebhookUpdate(
            @RequestHeader(value = "X-Telegram-Bot-Api-Secret-Token", required = false) String secretTokenHeader,
            @RequestBody Update update) {

        // If secret token is configured, verify it for security
        if (configuredSecretToken != null && !configuredSecretToken.isBlank()) {
            if (secretTokenHeader == null || !configuredSecretToken.equals(secretTokenHeader)) {
                log.warn("Unauthorized Telegram Webhook request received (Invalid or missing secret token).");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
        }

        try {
            botHandlerService.handleUpdate(update);
        } catch (Exception e) {
            log.error("Error processing Telegram update via webhook: {}", e.getMessage(), e);
        }

        // Always return 200 OK to Telegram so it doesn't retry repeatedly
        return ResponseEntity.ok().build();
    }

    /**
     * Admin/Utility endpoint to set the Webhook URL in Telegram.
     */
    @PostMapping("/set-webhook")
    @Operation(summary = "Set Telegram Webhook URL")
    public ResponseEntity<ApiResponse<Boolean>> setWebhook(@RequestBody Map<String, String> payload) {
        String url = payload.get("url");
        String secret = payload.getOrDefault("secret", configuredSecretToken);

        if (url == null || url.isBlank()) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Webhook URL is required (e.g. https://yourdomain.com/api/telegram/webhook)", null));
        }

        boolean success = telegramBotConfig.registerWebhook(url.trim(), secret);
        if (success) {
            return ResponseEntity.ok(new ApiResponse<>(true, "Telegram Webhook set successfully to " + url, true));
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Failed to set Telegram Webhook. Check server logs.", false));
        }
    }

    /**
     * Admin/Utility endpoint to delete the Webhook from Telegram.
     */
    @PostMapping("/delete-webhook")
    @Operation(summary = "Delete Telegram Webhook")
    public ResponseEntity<ApiResponse<Boolean>> deleteWebhook(
            @RequestParam(defaultValue = "true") boolean dropPendingUpdates) {
        boolean success = telegramBotConfig.deleteWebhook(dropPendingUpdates);
        if (success) {
            return ResponseEntity.ok(new ApiResponse<>(true, "Telegram Webhook deleted successfully.", true));
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Failed to delete Telegram Webhook. Check server logs.", false));
        }
    }

    /**
     * Admin/Utility endpoint to get current Webhook info from Telegram.
     */
    @GetMapping("/webhook-info")
    @Operation(summary = "Get Telegram Webhook Info")
    public ResponseEntity<ApiResponse<WebhookInfo>> getWebhookInfo() {
        WebhookInfo info = telegramBotConfig.getWebhookInfo();
        if (info != null) {
            return ResponseEntity.ok(new ApiResponse<>(true, "Telegram Webhook info retrieved.", info));
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Failed to get Webhook info from Telegram.", null));
        }
    }
}
