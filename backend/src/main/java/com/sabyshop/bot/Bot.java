package com.sabyshop.bot;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.bots.DefaultAbsSender;
import org.telegram.telegrambots.bots.DefaultBotOptions;

@Component
public class Bot extends DefaultAbsSender {

    private final String botUsername;
    private final String botToken;

    public Bot(
            @Value("${telegram.bot.token:8939523816:AAHvOjdFZYG8EN68RO0OZ5JuenIy_TWFkvE}") String token,
            @Value("${telegram.bot.username:sabyshop_notication_bot}") String botUsername) {
        super(new DefaultBotOptions(), token);
        this.botUsername = botUsername;
        this.botToken = token;
    }

    public String getBotUsername() {
        return botUsername;
    }

    public String getBotToken() {
        return botToken;
    }
}
