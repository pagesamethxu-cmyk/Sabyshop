package com.sabyshop.controller;

import com.sabyshop.dto.ApiResponse;
import com.sabyshop.dto.AutoReplyDto;
import com.sabyshop.dto.ChatMessageDto;
import com.sabyshop.dto.ChatRequest;
import com.sabyshop.dto.ChatResponse;
import com.sabyshop.dto.ConversationDto;
import com.sabyshop.model.ChatMessage;
import com.sabyshop.model.Order;
import com.sabyshop.model.Role;
import com.sabyshop.model.User;
import com.sabyshop.repository.ChatMessageRepository;
import com.sabyshop.repository.ConversationRepository;
import com.sabyshop.repository.OrderRepository;
import com.sabyshop.repository.UserRepository;
import com.sabyshop.service.AutoReplyService;
import com.sabyshop.service.ChatService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final ChatService chatService;
    private final AutoReplyService autoReplyService;
    private final ChatMessageRepository chatMessageRepository;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    private User getCurrentUser(Authentication auth) {
        if (auth == null || auth.getName() == null || "anonymousUser".equalsIgnoreCase(auth.getName())) {
            return null;
        }
        return userRepository.findByEmail(auth.getName()).orElse(null);
    }

    private String resolveMode(HttpServletRequest request, User currentUser) {
        String modeHeader = request.getHeader("X-User-Mode");
        if (modeHeader == null || modeHeader.isBlank()) {
            modeHeader = request.getHeader("X-Chat-Mode");
        }
        return chatService.resolveUserMode(currentUser, modeHeader);
    }

    /**
     * Get the authenticated user's active mode conversation and its message history.
     * Mode is resolved from session and verified header (buyer vs seller).
     */
    @GetMapping("/conversation")
    public ResponseEntity<ApiResponse<ConversationDto>> getUserConversation(
            HttpServletRequest httpRequest,
            Authentication auth) {

        User currentUser = getCurrentUser(auth);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "Authentication required", null));
        }

        String mode = resolveMode(httpRequest, currentUser);
        ConversationDto conversation = chatService.getConversationForUser(currentUser, mode);
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", conversation));
    }

    /**
     * Send a support message in the authenticated user's active mode conversation.
     * Strictly bound to (user_id, mode).
     */
    @PostMapping("/conversation/messages")
    public ResponseEntity<ApiResponse<ChatResponse>> sendConversationMessage(
            @RequestBody Map<String, String> body,
            HttpServletRequest httpRequest,
            Authentication auth) {

        User currentUser = getCurrentUser(auth);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "Authentication required", null));
        }

        String content = body.get("content");
        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Message content cannot be empty", null));
        }

        if (content.trim().length() > 2000) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Message too long (max 2000 characters)", null));
        }

        String mode = resolveMode(httpRequest, currentUser);
        String lang = body.get("lang");

        ChatResponse response = chatService.postUserConversationMessage(currentUser, mode, content, lang);
        return ResponseEntity.ok(new ApiResponse<>(true, "Message sent", response));
    }

    /**
     * Admin: Get all conversations strictly filtered by mode ('buyer' or 'seller').
     * Admin UI inboxes never merge or cross-contaminate modes.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/conversations")
    public ResponseEntity<ApiResponse<List<ConversationDto>>> getAdminConversations(
            @RequestParam(required = false, defaultValue = "buyer") String mode) {
        List<ConversationDto> list = chatService.getAdminConversations(mode);
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", list));
    }

    /**
     * Admin: Get a specific conversation and its full message history.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/conversations/{id}")
    public ResponseEntity<ApiResponse<ConversationDto>> getAdminConversationById(@PathVariable Long id) {
        ConversationDto conv = chatService.getAdminConversationById(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", conv));
    }

    /**
     * Admin: Reply to a specific conversation thread.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/conversations/{id}/messages")
    public ResponseEntity<ApiResponse<ChatMessageDto>> replyAdminConversation(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {

        User currentUser = getCurrentUser(auth);
        String content = body.get("content");
        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Message content cannot be empty", null));
        }

        ChatMessageDto reply = chatService.postAdminConversationReply(id, content.trim(), currentUser);
        return ResponseEntity.ok(new ApiResponse<>(true, "Reply sent", reply));
    }

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<ApiResponse<List<ChatMessageDto>>> getOrderMessages(
            @PathVariable Long orderId, Authentication auth) {

        User currentUser = getCurrentUser(auth);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "Authentication required", null));
        }

        if (orderId != null && orderId > 0) {
            if (currentUser.getRole() != Role.ADMIN && currentUser.getRole() != Role.SELLER) {
                Order order = orderRepository.findById(orderId).orElse(null);
                if (order == null || (order.getUser() != null && !order.getUser().getEmail().equalsIgnoreCase(currentUser.getEmail()))) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(new ApiResponse<>(false, "Access denied", null));
                }
            }
        }

        String role = currentUser.getRole() != null ? currentUser.getRole().name() : "USER";
        List<ChatMessageDto> dtos;
        if (orderId != null && orderId > 0) {
            dtos = chatService.getOrderMessages(orderId, role);
        } else {
            dtos = chatService.getUserMessages(currentUser.getEmail()).stream()
                    .filter(m -> m.getOrderId() == null || m.getOrderId() == 0)
                    .collect(java.util.stream.Collectors.toList());
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", dtos));
    }

    @PostMapping("/orders/{orderId}")
    public ResponseEntity<ApiResponse<ChatResponse>> sendMessage(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> body,
            Authentication auth) {

        User currentUser = getCurrentUser(auth);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "Authentication required", null));
        }

        String content = body.get("content");
        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Message content cannot be empty", null));
        }

        if (content.trim().length() > 1000) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Message too long (max 1000 characters)", null));
        }

        ChatRequest request = ChatRequest.builder()
                .orderId(orderId)
                .content(content)
                .lang(body.get("lang"))
                .channel(body.get("channel"))
                .targetEmail(body.get("targetEmail") != null ? body.get("targetEmail") : body.get("userEmail"))
                .build();

        try {
            ChatResponse response = chatService.processUserMessage(orderId, request, currentUser);
            return ResponseEntity.ok(new ApiResponse<>(true, "Message sent", response));
        } catch (Exception e) {
            log.error("ChatController sendMessage error: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Chat Error: " + e.getMessage(), null));
        }
    }

    @PostMapping("/send")
    public ResponseEntity<ApiResponse<ChatResponse>> sendGeneralMessage(
            @RequestBody ChatRequest request,
            HttpServletRequest httpRequest,
            Authentication auth) {

        User currentUser = getCurrentUser(auth);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "Authentication required", null));
        }

        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Message content cannot be empty", null));
        }

        String mode = resolveMode(httpRequest, currentUser);
        if (request.getChannel() != null && request.getChannel().toUpperCase().contains("SELLER")) {
            mode = chatService.resolveUserMode(currentUser, "seller");
        }

        ChatResponse response = chatService.postUserConversationMessage(currentUser, mode, request.getContent(), request.getLang());
        return ResponseEntity.ok(new ApiResponse<>(true, "Message sent", response));
    }

    @PutMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<ChatMessageDto>> editMessage(
            @PathVariable Long messageId,
            @RequestBody Map<String, String> body,
            Authentication auth) {

        User currentUser = getCurrentUser(auth);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "Authentication required", null));
        }

        String newContent = body.get("content");
        if (newContent == null || newContent.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Content cannot be empty", null));
        }

        ChatMessage msg = chatMessageRepository.findById(messageId).orElse(null);
        if (msg == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(false, "Message not found", null));
        }

        if (!currentUser.getEmail().equalsIgnoreCase(msg.getSenderEmail())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse<>(false, "Not allowed", null));
        }

        if (msg.isDeleted()) {
            return ResponseEntity.status(HttpStatus.GONE)
                    .body(new ApiResponse<>(false, "Message unavailable", null));
        }

        LocalDateTime sentAt = msg.getCreatedAt();
        if (sentAt != null && ChronoUnit.MINUTES.between(sentAt, LocalDateTime.now()) >= 3) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse<>(false, "Not allowed", null));
        }

        msg.setContent(newContent.trim());
        msg.setEdited(true);
        msg.setUpdatedAt(LocalDateTime.now());
        ChatMessage updated = chatMessageRepository.save(msg);

        return ResponseEntity.ok(new ApiResponse<>(true, "Updated", chatService.toDto(updated)));
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(
            @PathVariable Long messageId,
            @RequestParam(defaultValue = "false") boolean hardDelete,
            Authentication auth) {

        User currentUser = getCurrentUser(auth);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "Authentication required", null));
        }

        ChatMessage msg = chatMessageRepository.findById(messageId).orElse(null);
        if (msg == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(false, "Message not found", null));
        }

        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        if (!isAdmin && !currentUser.getEmail().equalsIgnoreCase(msg.getSenderEmail())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse<>(false, "Not allowed", null));
        }

        if (hardDelete && isAdmin) {
            chatMessageRepository.delete(msg);
        } else {
            msg.setDeleted(true);
            msg.setUpdatedAt(LocalDateTime.now());
            chatMessageRepository.save(msg);
        }

        return ResponseEntity.ok(new ApiResponse<>(true, "Deleted", null));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/admin/orders/{orderId}")
    public ResponseEntity<ApiResponse<Void>> deleteOrderChat(
            @PathVariable Long orderId,
            Authentication auth) {

        User currentUser = getCurrentUser(auth);
        if (currentUser == null || currentUser.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse<>(false, "Admin access required", null));
        }

        List<ChatMessage> messages = chatMessageRepository.findByOrderIdOrderByCreatedAtAsc(orderId);
        chatMessageRepository.deleteAll(messages);

        return ResponseEntity.ok(new ApiResponse<>(true, "Chat thread deleted", null));
    }

    @GetMapping("/my-chats")
    public ResponseEntity<ApiResponse<List<ChatMessageDto>>> getUserMessages(
            HttpServletRequest httpRequest,
            Authentication auth) {
        User currentUser = getCurrentUser(auth);
        if (currentUser == null) {
            return ResponseEntity.ok(new ApiResponse<>(true, "Success", List.of()));
        }
        String mode = resolveMode(httpRequest, currentUser);
        ConversationDto conv = chatService.getConversationForUser(currentUser, mode);
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", conv.getMessages() != null ? conv.getMessages() : List.of()));
    }

    @org.springframework.beans.factory.annotation.Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<String>> uploadChatMedia(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam(value = "conversationId", required = false) Long targetConvId,
            HttpServletRequest httpRequest,
            Authentication auth) {

        User currentUser = getCurrentUser(auth);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "Authentication required", null));
        }

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "File is empty", null));
        }

        try {
            String mode = resolveMode(httpRequest, currentUser);
            com.sabyshop.model.Conversation conv;
            if (targetConvId != null && currentUser.getRole() == Role.ADMIN) {
                conv = conversationRepository.findById(targetConvId).orElseGet(() -> chatService.getOrCreateConversation(currentUser, mode));
            } else {
                conv = chatService.getOrCreateConversation(currentUser, mode);
            }

            java.nio.file.Path[] candidateDirs = new java.nio.file.Path[] {
                java.nio.file.Paths.get(uploadDir),
                java.nio.file.Paths.get("backend", uploadDir),
                java.nio.file.Paths.get("uploads"),
                java.nio.file.Paths.get("backend", "uploads")
            };
            java.nio.file.Path uploadPath = null;
            for (java.nio.file.Path d : candidateDirs) {
                if (java.nio.file.Files.exists(d) && java.nio.file.Files.isDirectory(d)) {
                    uploadPath = d;
                    break;
                }
            }
            if (uploadPath == null) {
                uploadPath = java.nio.file.Paths.get(uploadDir);
                java.nio.file.Files.createDirectories(uploadPath);
            }

            String originalFilename = file.getOriginalFilename();
            String ext = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                ext = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
            }

            String filename = "conv_" + conv.getId() + "_" + System.currentTimeMillis() + "_" + java.util.UUID.randomUUID().toString().substring(0, 8) + ext;
            java.nio.file.Path filePath = uploadPath.resolve(filename);
            java.nio.file.Files.copy(file.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            // Also synchronize with root uploads if distinct
            try {
                java.nio.file.Path rootUploads = java.nio.file.Paths.get("uploads");
                if (java.nio.file.Files.exists(rootUploads) && !rootUploads.toAbsolutePath().equals(uploadPath.toAbsolutePath())) {
                    java.nio.file.Files.copy(filePath, rootUploads.resolve(filename), java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                }
            } catch (Exception ignored) {}

            String url = "/api/chat/attachments/" + filename;
            return ResponseEntity.ok(new ApiResponse<>(true, "Media uploaded successfully", url));
        } catch (Exception e) {
            log.error("Chat media upload failed: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Upload failed: " + e.getMessage(), null));
        }
    }

    /**
     * Scoped file retrieval endpoint: enforces that only the conversation owner matching (user_id AND mode)
     * or an ADMIN can download/view the chat attachment.
     */
    @GetMapping("/attachments/{filename:.+}")
    public ResponseEntity<?> getChatAttachment(
            @PathVariable String filename,
            HttpServletRequest httpRequest,
            Authentication auth) {

        // Validate filename structure - prevent directory traversal
        if (filename == null || filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid filename");
        }

        try {
            java.nio.file.Path[] candidateDirs = new java.nio.file.Path[] {
                java.nio.file.Paths.get(uploadDir),
                java.nio.file.Paths.get("uploads"),
                java.nio.file.Paths.get("backend", "uploads"),
                java.nio.file.Paths.get("backend", uploadDir),
                java.nio.file.Paths.get("..", "uploads"),
                java.nio.file.Paths.get("..", "backend", "uploads")
            };
            java.nio.file.Path filePath = null;
            for (java.nio.file.Path d : candidateDirs) {
                java.nio.file.Path candidate = d.resolve(filename).normalize();
                if (java.nio.file.Files.exists(candidate) && java.nio.file.Files.isRegularFile(candidate)) {
                    filePath = candidate;
                    break;
                }
            }
            if (filePath == null) {
                filePath = java.nio.file.Paths.get(uploadDir).resolve(filename);
            }
            if (!java.nio.file.Files.exists(filePath)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("File not found");
            }

            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(filePath.toUri());
            String contentType = java.nio.file.Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error reading file: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('SELLER')")
    @GetMapping("/seller/customer-chats")
    public ResponseEntity<ApiResponse<List<ChatMessageDto>>> getSellerCustomerChats(Authentication auth) {
        User currentUser = getCurrentUser(auth);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "Authentication required", null));
        }
        List<ChatMessageDto> dtos = chatService.getSellerCustomerMessages(currentUser.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", dtos));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/all")
    public ResponseEntity<ApiResponse<List<ChatMessageDto>>> getAllAdminMessages() {
        List<ChatMessageDto> dtos = chatService.getAllAdminMessages();
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", dtos));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/auto-replies")
    public ResponseEntity<ApiResponse<List<AutoReplyDto>>> getAllAutoReplies() {
        List<AutoReplyDto> replies = autoReplyService.getAllAutoReplies();
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", replies));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/auto-replies")
    public ResponseEntity<ApiResponse<AutoReplyDto>> createAutoReply(@RequestBody AutoReplyDto dto) {
        if (dto.getKeyword() == null || dto.getKeyword().isBlank()) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Keyword is required", null));
        }
        AutoReplyDto created = autoReplyService.createAutoReply(dto);
        return ResponseEntity.ok(new ApiResponse<>(true, "Auto reply created", created));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/auto-replies/{id}")
    public ResponseEntity<ApiResponse<AutoReplyDto>> updateAutoReply(
            @PathVariable Long id,
            @RequestBody AutoReplyDto dto) {
        AutoReplyDto updated = autoReplyService.updateAutoReply(id, dto);
        return ResponseEntity.ok(new ApiResponse<>(true, "Auto reply updated", updated));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/admin/auto-replies/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAutoReply(@PathVariable Long id) {
        autoReplyService.deleteAutoReply(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Auto reply deleted", null));
    }
}
