package com.sabyshop.service;

import com.sabyshop.dto.ChatMessageDto;
import com.sabyshop.dto.ChatRequest;
import com.sabyshop.dto.ChatResponse;
import com.sabyshop.dto.ConversationDto;
import com.sabyshop.exception.ResourceNotFoundException;
import com.sabyshop.model.ChatMessage;
import com.sabyshop.model.Conversation;
import com.sabyshop.model.Role;
import com.sabyshop.model.User;
import com.sabyshop.repository.ChatMessageRepository;
import com.sabyshop.repository.ConversationRepository;
import com.sabyshop.repository.OrderRepository;
import com.sabyshop.repository.SellerProfileRepository;
import com.sabyshop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final ConversationRepository conversationRepository;
    private final OrderRepository orderRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final UserRepository userRepository;
    private final AutoReplyService autoReplyService;
    private final EmailService emailService;

    @Value("${app.admin.notification.email:${app.default.admin.email:korbsameth.dev@gmail.com}}")
    private String adminNotificationEmail;

    public String getAdminEmail() {
        if (adminNotificationEmail != null && !adminNotificationEmail.isBlank()) {
            return adminNotificationEmail;
        }
        return userRepository.findFirstByRole(Role.ADMIN)
                .map(User::getEmail)
                .orElse("korbsameth.dev@gmail.com");
    }

    /**
     * Resolves and verifies the active chat mode for a user.
     * Enforces that non-sellers cannot impersonate or access seller mode.
     */
    public String resolveUserMode(User user, String requestedMode) {
        if (requestedMode == null || requestedMode.isBlank()) {
            return "buyer";
        }
        String normalized = requestedMode.trim().toLowerCase();
        if ("seller".equals(normalized)) {
            boolean isAllowedSeller = (user != null) && (
                user.getRole() == Role.SELLER ||
                user.getRole() == Role.ADMIN ||
                sellerProfileRepository.existsByUserId(user.getId())
            );
            return isAllowedSeller ? "seller" : "buyer";
        }
        return "buyer";
    }

    /**
     * Finds or creates a conversation row strictly bound to (user_id, mode).
     * Never reuses one conversation row across modes, even for the same user.
     */
    @Transactional
    public Conversation getOrCreateConversation(User user, String mode) {
        String safeMode = resolveUserMode(user, mode);
        return conversationRepository.findByUserIdAndMode(user.getId(), safeMode)
                .orElseGet(() -> {
                    Conversation conv = Conversation.builder()
                            .user(user)
                            .mode(safeMode)
                            .status("OPEN")
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .lastMessageAt(LocalDateTime.now())
                            .unreadCountAdmin(0)
                            .unreadCountUser(0)
                            .build();
                    return conversationRepository.save(conv);
                });
    }

    /**
     * OPERATES ON: Platform Support Conversation (Concept 1: Buyer Support or Concept 2: Seller VIP Support).
     * Retrieves the active mode's support conversation thread and its messages for the authenticated user.
     * Strict isolation: (user_id AND mode). Never mixes buyer and seller support threads.
     */
    @Transactional
    public ConversationDto getConversationForUser(User user, String requestedMode) {
        String safeMode = resolveUserMode(user, requestedMode);
        Conversation conv = getOrCreateConversation(user, safeMode);

        // Mark user unread count as 0 on read
        if (conv.getUnreadCountUser() != null && conv.getUnreadCountUser() > 0) {
            conv.setUnreadCountUser(0);
            conv = conversationRepository.save(conv);
        }

        List<ChatMessage> msgs = chatMessageRepository.findByConversationIdOrderByCreatedAtAsc(conv.getId());
        ConversationDto dto = toConversationDto(conv);
        dto.setMessages(msgs.stream().map(this::toDto).collect(Collectors.toList()));
        return dto;
    }

    /**
     * Sends a message within the authenticated user's active mode conversation thread.
     */
    @Transactional
    public ChatResponse postUserConversationMessage(User user, String requestedMode, String rawContent, String lang) {
        String safeMode = resolveUserMode(user, requestedMode);
        Conversation conv = getOrCreateConversation(user, safeMode);

        String content = (user.getRole() == Role.ADMIN) ? rawContent : maskRestrictedContent(rawContent);
        String role = (user.getRole() == Role.ADMIN) ? "ADMIN" : ("seller".equals(safeMode) ? "SELLER" : "USER");
        String channel = "seller".equals(safeMode) ? "SELLER_ADMIN" : "USER_ADMIN";

        ChatMessage userMsg = ChatMessage.builder()
                .conversation(conv)
                .orderId(0L)
                .senderEmail(user.getEmail())
                .senderName(user.getName() != null ? user.getName() : user.getEmail())
                .senderRole(role)
                .channel(channel)
                .targetEmail(getAdminEmail())
                .content(content)
                .createdAt(LocalDateTime.now())
                .edited(false)
                .deleted(false)
                .build();

        ChatMessage savedUserMsg = chatMessageRepository.save(userMsg);
        ChatMessageDto userMsgDto = toDto(savedUserMsg);

        // Update conversation metadata
        conv.setLastMessage(content);
        conv.setLastMessageAt(LocalDateTime.now());
        conv.setUnreadCountAdmin((conv.getUnreadCountAdmin() != null ? conv.getUnreadCountAdmin() : 0) + 1);
        conv.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conv);

        // Send Email notification to Admin
        emailService.sendUserChatNotificationToAdmin(
                userMsg.getSenderName(),
                userMsg.getSenderEmail(),
                0L,
                content
        );

        // Generate AI Bot Auto-reply if applicable
        ChatMessageDto autoReplyDto = null;
        boolean autoReplied = false;
        String replyContent = null;
        String botRole = "ADMIN";
        String botEmail = "support-bot@sabyshop.com";
        String botName = "seller".equals(safeMode) ? "Saby Seller VIP Support (AI)" : "Saby AI Assistant";

        if ("seller".equals(safeMode)) {
            replyContent = autoReplyService.generateSellerAdminReply(0L, content, lang);
            botEmail = "seller-support@sabyshop.com";
        } else {
            replyContent = autoReplyService.generateSmartReplyForOrder(0L, content, lang);
        }

        if (replyContent != null && !replyContent.isBlank()) {
            ChatMessage replyMsg = ChatMessage.builder()
                    .conversation(conv)
                    .orderId(0L)
                    .senderEmail(botEmail)
                    .senderName(botName)
                    .senderRole(botRole)
                    .channel(channel)
                    .targetEmail(user.getEmail())
                    .content(replyContent)
                    .createdAt(LocalDateTime.now().plusSeconds(1))
                    .edited(false)
                    .deleted(false)
                    .build();

            ChatMessage savedReply = chatMessageRepository.save(replyMsg);
            autoReplyDto = toDto(savedReply);
            autoReplied = true;

            conv.setLastMessage(replyContent);
            conv.setLastMessageAt(LocalDateTime.now());
            conversationRepository.save(conv);
        }

        return ChatResponse.builder()
                .userMessage(userMsgDto)
                .autoReply(autoReplyDto)
                .autoReplied(autoReplied)
                .build();
    }

    /**
     * Admin: Get all conversations strictly filtered by mode ('buyer' or 'seller').
     */
    @Transactional(readOnly = true)
    public List<ConversationDto> getAdminConversations(String requestedMode) {
        String mode = (requestedMode != null && requestedMode.equalsIgnoreCase("seller")) ? "seller" : "buyer";
        return conversationRepository.findByModeOrdered(mode).stream()
                .map(this::toConversationDto)
                .collect(Collectors.toList());
    }

    /**
     * Admin: Get specific conversation and its full message history.
     */
    @Transactional
    public ConversationDto getAdminConversationById(Long conversationId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        // Clear admin unread count
        if (conv.getUnreadCountAdmin() != null && conv.getUnreadCountAdmin() > 0) {
            conv.setUnreadCountAdmin(0);
            conv = conversationRepository.save(conv);
        }

        List<ChatMessage> msgs = chatMessageRepository.findByConversationIdOrderByCreatedAtAsc(conv.getId());
        ConversationDto dto = toConversationDto(conv);
        dto.setMessages(msgs.stream().map(this::toDto).collect(Collectors.toList()));
        return dto;
    }

    /**
     * Admin: Reply to a specific conversation.
     */
    @Transactional
    public ChatMessageDto postAdminConversationReply(Long conversationId, String content, User adminUser) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        String channel = "seller".equals(conv.getMode()) ? "SELLER_ADMIN" : "USER_ADMIN";

        ChatMessage adminMsg = ChatMessage.builder()
                .conversation(conv)
                .orderId(0L)
                .senderEmail(adminUser != null && adminUser.getEmail() != null ? adminUser.getEmail() : getAdminEmail())
                .senderName("Saby Support Team")
                .senderRole("ADMIN")
                .channel(channel)
                .targetEmail(conv.getUser().getEmail())
                .content(content)
                .createdAt(LocalDateTime.now())
                .edited(false)
                .deleted(false)
                .build();

        ChatMessage saved = chatMessageRepository.save(adminMsg);

        conv.setLastMessage(content);
        conv.setLastMessageAt(LocalDateTime.now());
        conv.setUnreadCountUser((conv.getUnreadCountUser() != null ? conv.getUnreadCountUser() : 0) + 1);
        conv.setUnreadCountAdmin(0);
        conv.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conv);

        // Notify user via email
        emailService.sendSupportReplyNotificationToUser(
                conv.getUser().getEmail(),
                "Saby Support Team",
                0L,
                content
        );

        return toDto(saved);
    }

    /**
     * Legacy & Order-specific message handling.
     */
    @Transactional
    public ChatResponse processUserMessage(Long orderId, ChatRequest request, User currentUser) {
        String rawContent = request.getContent() != null ? request.getContent().trim() : "";
        String content = currentUser.getRole() == Role.ADMIN ? rawContent : maskRestrictedContent(rawContent);
        String role = currentUser.getRole() == Role.ADMIN ? "ADMIN" : (currentUser.getRole() == Role.SELLER ? "SELLER" : "USER");
        String channel = request.getChannel() != null && !request.getChannel().isBlank() ? request.getChannel() : "USER_ADMIN";

        // Determine conversation if general support
        Conversation conv = null;
        if (orderId == null || orderId == 0) {
            if ("SELLER_ADMIN".equalsIgnoreCase(channel)) {
                conv = getOrCreateConversation(currentUser, "seller");
            } else if ("USER_ADMIN".equalsIgnoreCase(channel)) {
                conv = getOrCreateConversation(currentUser, "buyer");
            }
        }

        String targetEmail = request.getTargetEmail();
        if (targetEmail == null || targetEmail.isBlank() || targetEmail.endsWith("@sabyshop.com")) {
            if (orderId != null && orderId > 0) {
                if ("USER".equalsIgnoreCase(role)) {
                    if ("USER_SELLER".equalsIgnoreCase(channel) || isSellerOrder(orderId)) {
                        targetEmail = findSellerEmail(orderId);
                    } else {
                        targetEmail = getAdminEmail();
                    }
                } else if ("SELLER".equalsIgnoreCase(role) || "ADMIN".equalsIgnoreCase(role)) {
                    targetEmail = findOrderUserEmail(orderId);
                }
            } else {
                targetEmail = getAdminEmail();
            }
        }

        ChatMessage userMsg = ChatMessage.builder()
                .conversation(conv)
                .orderId(orderId != null ? orderId : 0L)
                .senderEmail(currentUser.getEmail())
                .senderName(currentUser.getName() != null ? currentUser.getName() : currentUser.getEmail())
                .senderRole(role)
                .channel(channel)
                .targetEmail(targetEmail)
                .content(content)
                .createdAt(LocalDateTime.now())
                .edited(false)
                .deleted(false)
                .build();

        ChatMessage savedUserMsg = chatMessageRepository.save(userMsg);
        ChatMessageDto userMsgDto = toDto(savedUserMsg);

        if (conv != null) {
            conv.setLastMessage(content);
            conv.setLastMessageAt(LocalDateTime.now());
            conv.setUnreadCountAdmin((conv.getUnreadCountAdmin() != null ? conv.getUnreadCountAdmin() : 0) + 1);
            conversationRepository.save(conv);
        }

        // Email notifications
        if ("USER".equalsIgnoreCase(role)) {
            if ("USER_SELLER".equalsIgnoreCase(channel) || isSellerOrder(orderId)) {
                String sellerEmail = findSellerEmail(orderId);
                if (sellerEmail != null && !sellerEmail.isBlank()) {
                    emailService.sendUserChatNotificationToSeller(
                        sellerEmail,
                        "Seller",
                        userMsg.getSenderName(),
                        userMsg.getSenderEmail(),
                        orderId != null ? orderId : 0L,
                        content
                    );
                }
            }
            emailService.sendUserChatNotificationToAdmin(
                userMsg.getSenderName(),
                userMsg.getSenderEmail(),
                orderId != null ? orderId : 0L,
                content
            );
        } else {
            String targetUserEmail = (targetEmail != null && !targetEmail.isBlank()) ? targetEmail : findOrderUserEmail(orderId);
            if (targetUserEmail != null) {
                emailService.sendSupportReplyNotificationToUser(
                    targetUserEmail,
                    userMsg.getSenderName(),
                    orderId != null ? orderId : 0L,
                    content
                );
            }
        }

        ChatMessageDto autoReplyDto = null;
        boolean autoReplied = false;
        boolean isSellerChannel = "USER_SELLER".equalsIgnoreCase(channel) || isSellerOrder(orderId);
        boolean allowSellerAiReply = false;
        String sellerEmailForBot = null;
        String sellerNameForBot = "Seller AI Assistant";

        if (isSellerChannel && orderId != null && orderId > 0) {
            Long sellerUserId = findSellerUserId(orderId);
            if (sellerUserId != null) {
                var sellerProf = sellerProfileRepository.findByUserId(sellerUserId).orElse(null);
                if (sellerProf != null
                    && sellerProf.getSubscriptionStatus() == com.sabyshop.model.SellerProfile.SubscriptionStatus.ACTIVE
                    && (sellerProf.getSubscriptionPlan() == com.sabyshop.model.SellerProfile.SubscriptionPlan.PLAN_2
                        || sellerProf.getSubscriptionPlan() == com.sabyshop.model.SellerProfile.SubscriptionPlan.PLAN_3)) {
                    allowSellerAiReply = true;
                    if (sellerProf.getUser() != null) {
                        sellerEmailForBot = sellerProf.getUser().getEmail();
                    }
                    if (sellerProf.getStoreName() != null && !sellerProf.getStoreName().isBlank()) {
                        sellerNameForBot = sellerProf.getStoreName() + " (AI Assistant)";
                    }
                }
            }
        }

        String replyContent = null;
        String botRole = "ADMIN";
        String botEmail = "support-bot@sabyshop.com";
        String botName = "Saby Support (AI)";

        if ("SELLER_ADMIN".equalsIgnoreCase(channel)) {
            replyContent = autoReplyService.generateSellerAdminReply(orderId, content, request.getLang());
            botRole = "ADMIN";
            botEmail = "seller-support@sabyshop.com";
            botName = "Saby Seller Support (AI)";
        } else if ("USER_ADMIN".equalsIgnoreCase(channel)) {
            replyContent = autoReplyService.generateSmartReplyForOrder(orderId, content, request.getLang());
            botRole = "ADMIN";
            botEmail = "support-bot@sabyshop.com";
            botName = "Saby AI Assistant";
        } else if (isSellerChannel && allowSellerAiReply) {
            replyContent = autoReplyService.generateSmartReplyForOrder(orderId, content, request.getLang());
            botRole = "SELLER";
            botEmail = (sellerEmailForBot != null) ? sellerEmailForBot : "seller-bot@sabyshop.com";
            botName = sellerNameForBot;
        }

        if (replyContent != null && !replyContent.isBlank()) {
            ChatMessage replyMsg = ChatMessage.builder()
                    .conversation(conv)
                    .orderId(orderId != null ? orderId : 0L)
                    .senderEmail(botEmail)
                    .senderName(botName)
                    .senderRole(botRole)
                    .channel(channel)
                    .targetEmail(currentUser.getEmail())
                    .content(replyContent)
                    .createdAt(LocalDateTime.now().plusSeconds(1))
                    .edited(false)
                    .deleted(false)
                    .build();

            ChatMessage savedReply = chatMessageRepository.save(replyMsg);
            autoReplyDto = toDto(savedReply);
            autoReplied = true;
        }

        return ChatResponse.builder()
                .userMessage(userMsgDto)
                .autoReply(autoReplyDto)
                .autoReplied(autoReplied)
                .build();
    }

    private String findOrderUserEmail(Long orderId) {
        if (orderId == null || orderId == 0) return null;
        return orderRepository.findById(orderId)
                .map(o -> o.getUser() != null ? o.getUser().getEmail() : null)
                .orElse(null);
    }

    private boolean isSellerOrder(Long orderId) {
        if (orderId == null || orderId == 0) return false;
        return orderRepository.findById(orderId)
                .map(o -> o.getItems() != null && !o.getItems().isEmpty() && o.getItems().get(0).getProduct() != null && o.getItems().get(0).getProduct().getSeller() != null)
                .orElse(false);
    }

    private String findSellerEmail(Long orderId) {
        if (orderId == null || orderId == 0) return null;
        return orderRepository.findById(orderId)
                .map(o -> {
                    if (o.getItems() != null && !o.getItems().isEmpty()) {
                        com.sabyshop.model.Product p = o.getItems().get(0).getProduct();
                        if (p != null && p.getSeller() != null) {
                            return p.getSeller().getEmail();
                        }
                    }
                    return null;
                })
                .orElse(null);
    }

    private Long findSellerUserId(Long orderId) {
        if (orderId == null || orderId == 0) return null;
        return orderRepository.findById(orderId)
                .map(o -> {
                    if (o.getItems() != null && !o.getItems().isEmpty()) {
                        com.sabyshop.model.Product p = o.getItems().get(0).getProduct();
                        if (p != null && p.getSeller() != null) {
                            return p.getSeller().getId();
                        }
                    }
                    return null;
                })
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDto> getOrderMessages(Long orderId, String userRole) {
        return chatMessageRepository.findByOrderIdOrderByCreatedAtAsc(orderId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDto> getUserMessages(String email) {
        if (email == null || email.isBlank()) return List.of();

        List<Long> userOrderIds = orderRepository.findIdsByUserEmail(email);
        List<ChatMessage> orderMsgs = (userOrderIds != null && !userOrderIds.isEmpty())
                ? chatMessageRepository.findByOrderIdInOrderByCreatedAtDesc(userOrderIds)
                : List.of();
        List<ChatMessage> directAndTargetMsgs = chatMessageRepository.findUserDirectAndTargetMessages(email);

        java.util.Map<Long, ChatMessage> map = new java.util.LinkedHashMap<>();
        for (ChatMessage m : orderMsgs) {
            if (m.getId() != null && !"SELLER_ADMIN".equalsIgnoreCase(m.getChannel())) {
                map.put(m.getId(), m);
            }
        }
        for (ChatMessage m : directAndTargetMsgs) {
            if (m.getId() != null && !"SELLER_ADMIN".equalsIgnoreCase(m.getChannel())) {
                if (m.getConversation() == null || "buyer".equalsIgnoreCase(m.getConversation().getMode())) {
                    map.put(m.getId(), m);
                }
            }
        }
        return map.values().stream()
                .sorted(java.util.Comparator.comparing(ChatMessage::getCreatedAt, java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder())))
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDto> getAllAdminMessages() {
        return chatMessageRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * OPERATES ON: Seller-Customer Inquiries (Concept 3: channel = 'USER_SELLER').
     * Retrieves customer inquiry messages for the given merchant. Intentionally separated from Conversation support threads.
     */
    @Transactional(readOnly = true)
    public List<ChatMessageDto> getSellerCustomerMessages(Long sellerId) {
        String sellerEmail = userRepository.findById(sellerId)
                .map(User::getEmail)
                .orElse(null);

        List<Long> sellerOrderIds = orderRepository.findOrdersBySellerId(sellerId)
                .stream()
                .map(com.sabyshop.model.Order::getId)
                .collect(Collectors.toList());

        List<ChatMessage> orderMsgs = (!sellerOrderIds.isEmpty())
                ? chatMessageRepository.findByOrderIdInOrderByCreatedAtDesc(sellerOrderIds)
                : List.of();

        List<ChatMessage> directMsgs = (sellerEmail != null && !sellerEmail.isBlank())
                ? chatMessageRepository.findUserDirectAndTargetMessages(sellerEmail)
                : List.of();

        java.util.Map<Long, ChatMessage> map = new java.util.LinkedHashMap<>();
        for (ChatMessage m : orderMsgs) {
            if (m.getId() != null && "USER_SELLER".equalsIgnoreCase(m.getChannel())) {
                map.put(m.getId(), m);
            }
        }
        for (ChatMessage m : directMsgs) {
            if (m.getId() != null && "USER_SELLER".equalsIgnoreCase(m.getChannel())) {
                map.put(m.getId(), m);
            }
        }
        return map.values().stream()
                .sorted(java.util.Comparator.comparing(ChatMessage::getCreatedAt, java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder())))
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public ConversationDto toConversationDto(Conversation conv) {
        if (conv == null) return null;
        User u = conv.getUser();
        String storeName = null;
        String storeLogo = null;
        if (u != null) {
            var prof = sellerProfileRepository.findByUserId(u.getId()).orElse(null);
            if (prof != null) {
                storeName = prof.getStoreName();
                storeLogo = prof.getStoreLogoUrl();
            }
        }

        return ConversationDto.builder()
                .id(conv.getId())
                .userId(u != null ? u.getId() : null)
                .userEmail(u != null ? u.getEmail() : null)
                .userName(u != null ? u.getName() : null)
                .userAvatarUrl(u != null ? u.getAvatarUrl() : null)
                .storeName(storeName)
                .storeLogoUrl(storeLogo)
                .mode(conv.getMode())
                .status(conv.getStatus())
                .lastMessage(conv.getLastMessage())
                .lastMessageAt(conv.getLastMessageAt())
                .unreadCountAdmin(conv.getUnreadCountAdmin() != null ? conv.getUnreadCountAdmin() : 0)
                .unreadCountUser(conv.getUnreadCountUser() != null ? conv.getUnreadCountUser() : 0)
                .createdAt(conv.getCreatedAt())
                .updatedAt(conv.getUpdatedAt())
                .build();
    }

    public ChatMessageDto toDto(ChatMessage msg) {
        String avatar = null;
        String storeName = null;
        String storeLogo = null;
        String profileType = "USER";

        if (msg.getSenderEmail() != null) {
            var optUser = userRepository.findByEmail(msg.getSenderEmail());
            if (optUser.isPresent()) {
                User u = optUser.get();
                var prof = sellerProfileRepository.findByUserId(u.getId()).orElse(null);
                if (prof != null) {
                    storeName = prof.getStoreName();
                    storeLogo = prof.getStoreLogoUrl();
                }

                if ("SELLER".equalsIgnoreCase(msg.getSenderRole()) || "SELLER_ADMIN".equalsIgnoreCase(msg.getChannel())) {
                    profileType = "SELLER";
                    if (prof != null && prof.getStoreLogoUrl() != null && !prof.getStoreLogoUrl().isBlank()) {
                        avatar = prof.getStoreLogoUrl();
                    } else {
                        avatar = u.getAvatarUrl();
                    }
                } else if ("ADMIN".equalsIgnoreCase(msg.getSenderRole())) {
                    profileType = "ADMIN";
                    avatar = u.getAvatarUrl();
                } else {
                    profileType = "USER";
                    avatar = u.getAvatarUrl();
                }
            }
        }

        String mode = (msg.getConversation() != null) ? msg.getConversation().getMode() : ("SELLER_ADMIN".equalsIgnoreCase(msg.getChannel()) ? "seller" : "buyer");

        return ChatMessageDto.builder()
                .id(msg.getId())
                .conversationId(msg.getConversation() != null ? msg.getConversation().getId() : null)
                .mode(mode)
                .orderId(msg.getOrderId())
                .senderEmail(msg.getSenderEmail())
                .senderName(msg.getSenderName())
                .senderRole(msg.getSenderRole())
                .senderAvatarUrl(avatar)
                .senderStoreName(storeName)
                .senderStoreLogoUrl(storeLogo)
                .senderProfileType(profileType)
                .channel(msg.getChannel() != null ? msg.getChannel() : "USER_ADMIN")
                .targetEmail(msg.getTargetEmail())
                .content(msg.isDeleted() ? null : msg.getContent())
                .createdAt(msg.getCreatedAt())
                .updatedAt(msg.getUpdatedAt())
                .edited(msg.isEdited())
                .deleted(msg.isDeleted())
                .build();
    }

    public static String maskRestrictedContent(String text) {
        if (text == null || text.isBlank()) return text;
        String sanitized = text;

        sanitized = sanitized.replaceAll("(?i)(https?://\\S+|www\\.\\S+|t\\.me/\\S+|telegram\\.me/\\S+|wa\\.me/\\S+|discord\\.gg/\\S+|fb\\.com/\\S+|facebook\\.com/\\S+)", "*******");
        sanitized = sanitized.replaceAll("(?i)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})", "*******");
        sanitized = sanitized.replaceAll("(?i)(\\+?\\d[\\d\\s\\-\\.]{7,}\\d)", "*******");
        sanitized = sanitized.replaceAll("(?i)(telegram|whatsapp|viber|facebook|phone|call me|contact me)\\s*[:=]?\\s*\\S+", "*******");

        return sanitized;
    }
}
