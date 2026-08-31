package com.sabyshop.bot;

import com.sabyshop.service.TelegramBotHandlerService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.bots.TelegramLongPollingBot;
import org.telegram.telegrambots.meta.api.objects.Update;

@Component
public class Bot extends TelegramLongPollingBot {

    private final String botUsername;
    private final TelegramBotHandlerService handlerService;

    public Bot(
            @Value("${telegram.bot.token:8939523816:AAHvOjdFZYG8EN68RO0OZ5JuenIy_TWFkvE}") String token,
            @Value("${telegram.bot.username:sabyshop_notication_bot}") String botUsername,
            @Lazy TelegramBotHandlerService handlerService) {
        super(token);
        this.botUsername = botUsername;
        this.handlerService = handlerService;
    }

    @Override
    public String getBotUsername() {
        return botUsername;
    }

    @Override
    public void onUpdateReceived(Update update) {
        if (handlerService != null) {
            handlerService.handleUpdate(update);
        }
    }
}
