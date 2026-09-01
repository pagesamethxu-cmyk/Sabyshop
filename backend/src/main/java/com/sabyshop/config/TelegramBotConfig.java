package com.sabyshop.config;

import com.sabyshop.bot.Bot;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.telegram.telegrambots.meta.api.methods.updates.DeleteWebhook;
import org.telegram.telegrambots.meta.api.methods.updates.GetWebhookInfo;
import org.telegram.telegrambots.meta.api.methods.updates.SetWebhook;
import org.telegram.telegrambots.meta.api.objects.WebhookInfo;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class TelegramBotConfig {

    private final Bot bot;

    @Value("${telegram.bot.webhook-url:}")
    private String webhookUrl;

    @Value("${telegram.bot.secret-token:}")
    private String secretToken;

    @PostConstruct
    public void initWebhook() {
        if (webhookUrl != null && !webhookUrl.isBlank()) {
            registerWebhook(webhookUrl.trim(), secretToken);
        } else {
            log.info("Telegram Bot Webhook mode is ACTIVE. (No 'telegram.bot.webhook-url' configured at startup. You can set it via TELEGRAM_WEBHOOK_URL or call /api/telegram/set-webhook endpoint).");
        }
    }

    /**
     * Register or update the webhook URL with Telegram API.
     */
    public boolean registerWebhook(String url, String secret) {
        try {
            SetWebhook.SetWebhookBuilder builder = SetWebhook.builder().url(url);
            if (secret != null && !secret.isBlank()) {
                builder.secretToken(secret.trim());
            }
            builder.dropPendingUpdates(true);
            Boolean result = bot.execute(builder.build());
            log.info("Telegram Webhook set to [{}] (success={})", url, result);
            return Boolean.TRUE.equals(result);
        } catch (TelegramApiException e) {
            log.error("Failed to set Telegram Webhook to [{}]: {}", url, e.getMessage());
            return false;
        }
    }

    /**
     * Delete the active webhook from Telegram API.
     */
    public boolean deleteWebhook(boolean dropPendingUpdates) {
        try {
            DeleteWebhook deleteWebhook = DeleteWebhook.builder()
                    .dropPendingUpdates(dropPendingUpdates)
                    .build();
            Boolean result = bot.execute(deleteWebhook);
            log.info("Telegram Webhook deleted (dropPendingUpdates={}, success={})", dropPendingUpdates, result);
            return Boolean.TRUE.equals(result);
        } catch (TelegramApiException e) {
            log.error("Failed to delete Telegram Webhook: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Retrieve current webhook status and info from Telegram API.
     */
    public WebhookInfo getWebhookInfo() {
        try {
            return bot.execute(new GetWebhookInfo());
        } catch (TelegramApiException e) {
            log.error("Failed to get Telegram Webhook info: {}", e.getMessage());
            return null;
        }
    }
}
