package com.sabyshop.config;

import com.sabyshop.bot.Bot;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.telegram.telegrambots.meta.TelegramBotsApi;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;
import org.telegram.telegrambots.updatesreceivers.DefaultBotSession;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class TelegramBotConfig {

    private final Bot bot;

    @Bean
    public TelegramBotsApi telegramBotsApi() {
        try {
            TelegramBotsApi botsApi = new TelegramBotsApi(DefaultBotSession.class);
            botsApi.registerBot(bot);
            log.info("Telegram Bot [@{}] successfully registered and listening for updates.", bot.getBotUsername());
            return botsApi;
        } catch (TelegramApiException e) {
            log.warn("Failed to register Telegram Bot [@{}]: {}", bot.getBotUsername(), e.getMessage());
            return null;
        }
    }
}
