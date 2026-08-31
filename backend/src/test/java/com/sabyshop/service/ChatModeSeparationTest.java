package com.sabyshop.service;

import com.sabyshop.dto.ChatMessageDto;
import com.sabyshop.dto.ChatResponse;
import com.sabyshop.dto.ConversationDto;
import com.sabyshop.model.ChatMessage;
import com.sabyshop.model.Conversation;
import com.sabyshop.model.Role;
import com.sabyshop.model.User;
import com.sabyshop.repository.ChatMessageRepository;
import com.sabyshop.repository.ConversationRepository;
import com.sabyshop.repository.OrderRepository;
import com.sabyshop.repository.SellerProfileRepository;
import com.sabyshop.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ChatModeSeparationTest {

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private SellerProfileRepository sellerProfileRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AutoReplyService autoReplyService;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private ChatService chatService;

    private User dualRoleUser;
    private User buyerOnlyUser;
    private Conversation buyerConversation;
    private Conversation sellerConversation;

    @BeforeEach
    void setUp() {
        dualRoleUser = User.builder()
                .id(100L)
                .email("dualuser@example.com")
                .name("Dual User")
                .role(Role.SELLER)
                .build();

        buyerOnlyUser = User.builder()
                .id(200L)
                .email("buyer@example.com")
                .name("Buyer Only")
                .role(Role.CUSTOMER)
                .build();

        buyerConversation = Conversation.builder()
                .id(1L)
                .user(dualRoleUser)
                .mode("buyer")
                .status("OPEN")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        sellerConversation = Conversation.builder()
                .id(2L)
                .user(dualRoleUser)
                .mode("seller")
                .status("OPEN")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Dual-role user in Buyer Mode receives ONLY buyer messages, never seller messages")
    void testBuyerModeReturnsOnlyBuyerMessages() {
        ChatMessage buyerMsg = ChatMessage.builder()
                .id(101L)
                .conversation(buyerConversation)
                .senderEmail(dualRoleUser.getEmail())
                .senderName(dualRoleUser.getName())
                .senderRole("USER")
                .channel("USER_ADMIN")
                .content("Hello support, I have an issue with my purchase")
                .createdAt(LocalDateTime.now())
                .build();

        when(conversationRepository.findByUserIdAndMode(dualRoleUser.getId(), "buyer"))
                .thenReturn(Optional.of(buyerConversation));
        when(chatMessageRepository.findByConversationIdOrderByCreatedAtAsc(buyerConversation.getId()))
                .thenReturn(List.of(buyerMsg));

        ConversationDto result = chatService.getConversationForUser(dualRoleUser, "buyer");

        assertNotNull(result);
        assertEquals("buyer", result.getMode());
        assertEquals(1, result.getMessages().size());
        assertEquals("Hello support, I have an issue with my purchase", result.getMessages().get(0).getContent());
        assertEquals("buyer", result.getMessages().get(0).getMode());

        // Verify seller conversation was NOT queried or returned
        verify(chatMessageRepository, never()).findByConversationIdOrderByCreatedAtAsc(sellerConversation.getId());
    }

    @Test
    @DisplayName("Dual-role user in Seller Mode receives ONLY seller messages, never buyer messages")
    void testSellerModeReturnsOnlySellerMessages() {
        ChatMessage sellerMsg = ChatMessage.builder()
                .id(201L)
                .conversation(sellerConversation)
                .senderEmail(dualRoleUser.getEmail())
                .senderName(dualRoleUser.getName())
                .senderRole("SELLER")
                .channel("SELLER_ADMIN")
                .content("Hello admin, I need help with my merchant payout")
                .createdAt(LocalDateTime.now())
                .build();

        when(conversationRepository.findByUserIdAndMode(dualRoleUser.getId(), "seller"))
                .thenReturn(Optional.of(sellerConversation));
        when(chatMessageRepository.findByConversationIdOrderByCreatedAtAsc(sellerConversation.getId()))
                .thenReturn(List.of(sellerMsg));

        ConversationDto result = chatService.getConversationForUser(dualRoleUser, "seller");

        assertNotNull(result);
        assertEquals("seller", result.getMode());
        assertEquals(1, result.getMessages().size());
        assertEquals("Hello admin, I need help with my merchant payout", result.getMessages().get(0).getContent());
        assertEquals("seller", result.getMessages().get(0).getMode());

        // Verify buyer conversation was NOT queried or returned
        verify(chatMessageRepository, never()).findByConversationIdOrderByCreatedAtAsc(buyerConversation.getId());
    }

    @Test
    @DisplayName("Buyer-only user attempting to pass seller mode is safely forced to buyer mode")
    void testBuyerOnlyUserCannotImpersonateSellerMode() {
        when(sellerProfileRepository.existsByUserId(buyerOnlyUser.getId())).thenReturn(false);

        String resolvedMode = chatService.resolveUserMode(buyerOnlyUser, "seller");
        assertEquals("buyer", resolvedMode, "Non-seller must always be resolved to buyer mode");
    }

    @Test
    @DisplayName("Mid-session request: Buyer-only user sending X-User-Mode: seller is forced to buyer conversation on every request")
    void testMidSessionBuyerSendingSellerHeaderIsForcedToBuyerConversation() {
        when(sellerProfileRepository.existsByUserId(buyerOnlyUser.getId())).thenReturn(false);

        Conversation buyerOnlyConv = Conversation.builder()
                .id(300L)
                .user(buyerOnlyUser)
                .mode("buyer")
                .status("OPEN")
                .createdAt(LocalDateTime.now())
                .build();

        when(conversationRepository.findByUserIdAndMode(buyerOnlyUser.getId(), "buyer"))
                .thenReturn(Optional.of(buyerOnlyConv));
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> {
            ChatMessage m = invocation.getArgument(0);
            m.setId(999L);
            return m;
        });

        // Mid-session post with spoofed requestedMode = "seller"
        ChatResponse response = chatService.postUserConversationMessage(buyerOnlyUser, "seller", "Spoofed seller message", "en");

        assertNotNull(response);
        assertNotNull(response.getUserMessage());
        assertEquals("buyer", response.getUserMessage().getMode(), "Response message mode must be buyer");
        assertEquals(300L, response.getUserMessage().getConversationId());
        assertEquals("USER_ADMIN", response.getUserMessage().getChannel());
        assertEquals("USER", response.getUserMessage().getSenderRole());

        // Verify it was saved to buyer conversation, not seller
        verify(conversationRepository).findByUserIdAndMode(buyerOnlyUser.getId(), "buyer");
        verify(conversationRepository, never()).findByUserIdAndMode(buyerOnlyUser.getId(), "seller");
    }

    @Test
    @DisplayName("Dual-role user posting in buyer mode vs seller mode attaches to distinct conversation rows")
    void testDualRoleUserCrossModePostingNeverCrossesThreads() {
        when(conversationRepository.findByUserIdAndMode(dualRoleUser.getId(), "buyer"))
                .thenReturn(Optional.of(buyerConversation));
        when(conversationRepository.findByUserIdAndMode(dualRoleUser.getId(), "seller"))
                .thenReturn(Optional.of(sellerConversation));
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // 1. Post in buyer mode
        ChatResponse buyerResp = chatService.postUserConversationMessage(dualRoleUser, "buyer", "Buyer question", "en");
        assertEquals("buyer", buyerResp.getUserMessage().getMode());
        assertEquals(buyerConversation.getId(), buyerResp.getUserMessage().getConversationId());
        assertEquals("USER_ADMIN", buyerResp.getUserMessage().getChannel());

        // 2. Post in seller mode
        ChatResponse sellerResp = chatService.postUserConversationMessage(dualRoleUser, "seller", "Seller question", "en");
        assertEquals("seller", sellerResp.getUserMessage().getMode());
        assertEquals(sellerConversation.getId(), sellerResp.getUserMessage().getConversationId());
        assertEquals("SELLER_ADMIN", sellerResp.getUserMessage().getChannel());

        assertNotEquals(buyerResp.getUserMessage().getConversationId(), sellerResp.getUserMessage().getConversationId());
    }

    @Test
    @DisplayName("Admin query strictly separates buyer support vs seller support conversations")
    void testAdminSeparationPerMode() {
        when(conversationRepository.findByModeOrdered("buyer"))
                .thenReturn(List.of(buyerConversation));
        when(conversationRepository.findByModeOrdered("seller"))
                .thenReturn(List.of(sellerConversation));

        List<ConversationDto> buyerInboxes = chatService.getAdminConversations("buyer");
        List<ConversationDto> sellerInboxes = chatService.getAdminConversations("seller");

        assertEquals(1, buyerInboxes.size());
        assertEquals("buyer", buyerInboxes.get(0).getMode());

        assertEquals(1, sellerInboxes.size());
        assertEquals("seller", sellerInboxes.get(0).getMode());
    }

    @Test
    @DisplayName("Seller Customer Inbox never leaks into Buyer Support or Seller VIP Support views, and vice versa")
    void testSellerCustomerInboxNeverLeaksIntoSupportConversations() {
        ChatMessage customerToSellerMsg = ChatMessage.builder()
                .id(501L)
                .senderEmail("customer1@example.com")
                .senderName("Customer One")
                .senderRole("USER")
                .channel("USER_SELLER")
                .targetEmail(dualRoleUser.getEmail())
                .content("Hi seller, do you have Netflix in stock?")
                .createdAt(LocalDateTime.now())
                .build();

        ChatMessage buyerSupportMsg = ChatMessage.builder()
                .id(101L)
                .conversation(buyerConversation)
                .senderEmail(dualRoleUser.getEmail())
                .senderName(dualRoleUser.getName())
                .senderRole("USER")
                .channel("USER_ADMIN")
                .content("Hello admin, I have a dispute on my purchase")
                .createdAt(LocalDateTime.now())
                .build();

        ChatMessage sellerVipMsg = ChatMessage.builder()
                .id(201L)
                .conversation(sellerConversation)
                .senderEmail(dualRoleUser.getEmail())
                .senderName(dualRoleUser.getName())
                .senderRole("SELLER")
                .channel("SELLER_ADMIN")
                .content("Hello admin, I need help with withdrawal")
                .createdAt(LocalDateTime.now())
                .build();

        when(userRepository.findById(dualRoleUser.getId())).thenReturn(Optional.of(dualRoleUser));
        when(orderRepository.findOrdersBySellerId(dualRoleUser.getId())).thenReturn(List.of());
        when(chatMessageRepository.findUserDirectAndTargetMessages(dualRoleUser.getEmail()))
                .thenReturn(List.of(customerToSellerMsg));

        // 1. Fetch Seller Customer Messages
        List<ChatMessageDto> customerChats = chatService.getSellerCustomerMessages(dualRoleUser.getId());
        assertEquals(1, customerChats.size());
        assertEquals("USER_SELLER", customerChats.get(0).getChannel());
        assertEquals("Hi seller, do you have Netflix in stock?", customerChats.get(0).getContent());
        assertNull(customerChats.get(0).getConversationId(), "Customer inquiries must not be linked to support conversation ID");

        // 2. Fetch Buyer Support Conversation
        when(conversationRepository.findByUserIdAndMode(dualRoleUser.getId(), "buyer"))
                .thenReturn(Optional.of(buyerConversation));
        when(chatMessageRepository.findByConversationIdOrderByCreatedAtAsc(buyerConversation.getId()))
                .thenReturn(List.of(buyerSupportMsg));

        ConversationDto buyerConv = chatService.getConversationForUser(dualRoleUser, "buyer");
        assertEquals(1, buyerConv.getMessages().size());
        assertEquals("USER_ADMIN", buyerConv.getMessages().get(0).getChannel());
        assertEquals("Hello admin, I have a dispute on my purchase", buyerConv.getMessages().get(0).getContent());

        // 3. Fetch Seller VIP Support Conversation
        when(conversationRepository.findByUserIdAndMode(dualRoleUser.getId(), "seller"))
                .thenReturn(Optional.of(sellerConversation));
        when(chatMessageRepository.findByConversationIdOrderByCreatedAtAsc(sellerConversation.getId()))
                .thenReturn(List.of(sellerVipMsg));

        ConversationDto sellerConv = chatService.getConversationForUser(dualRoleUser, "seller");
        assertEquals(1, sellerConv.getMessages().size());
        assertEquals("SELLER_ADMIN", sellerConv.getMessages().get(0).getChannel());
        assertEquals("Hello admin, I need help with withdrawal", sellerConv.getMessages().get(0).getContent());

        // Verify none of the lists contain messages from the other inboxes
        assertTrue(buyerConv.getMessages().stream().noneMatch(m -> "USER_SELLER".equals(m.getChannel())));
        assertTrue(sellerConv.getMessages().stream().noneMatch(m -> "USER_SELLER".equals(m.getChannel())));
        assertTrue(customerChats.stream().noneMatch(m -> "USER_ADMIN".equals(m.getChannel()) || "SELLER_ADMIN".equals(m.getChannel())));
    }
}
