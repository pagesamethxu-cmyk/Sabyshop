package com.sabyshop.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationDto {
    private Long id;
    private Long userId;
    private String userEmail;
    private String userName;
    private String userAvatarUrl;
    private String storeName;
    private String storeLogoUrl;
    private String mode; // 'buyer' or 'seller'
    private String status; // 'OPEN', 'CLOSED'
    private String lastMessage;
    private LocalDateTime lastMessageAt;
    private Integer unreadCountAdmin;
    private Integer unreadCountUser;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ChatMessageDto> messages;
}
