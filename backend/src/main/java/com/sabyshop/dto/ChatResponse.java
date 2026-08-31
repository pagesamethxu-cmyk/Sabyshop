package com.sabyshop.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {
    private ChatMessageDto userMessage;
    private ChatMessageDto autoReply;
    private boolean autoReplied;
}
