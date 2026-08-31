package com.sabyshop.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDto {
    private Long id;
    private Long conversationId;
    private String mode;
    private Long orderId;
    private String senderEmail;
    private String senderName;
    private String senderRole;
    private String senderAvatarUrl;
    private String channel;
    private String targetEmail;
    private String content;
    private String senderStoreName;
    private String senderStoreLogoUrl;
    private String senderProfileType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean edited;
    private boolean deleted;
}
