package com.sabyshop.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sabyshop.dto.*;
import com.sabyshop.exception.BadRequestException;
import com.sabyshop.exception.ResourceNotFoundException;
import com.sabyshop.model.*;
import com.sabyshop.model.Dispute.DisputeStatus;
import com.sabyshop.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DisputeService {

 private final DisputeRepository disputeRepository;
 private final OrderRepository orderRepository;
 private final UserRepository userRepository;
 private final SellerProfileRepository sellerProfileRepository;
 private final TelegramNotificationService telegramNotificationService;
 private final EmailService emailService;
 private final ObjectMapper objectMapper;


 @org.springframework.context.annotation.Lazy
 @org.springframework.beans.factory.annotation.Autowired
 private SellerService sellerService;

 @Transactional
 public DisputeResponse createDispute(Long buyerUserId, Long orderId, DisputeRequest request) {
 Order order = orderRepository.findById(orderId)
 .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
 User buyer = userRepository.findById(buyerUserId)
 .orElseThrow(() -> new ResourceNotFoundException("User not found"));

 if (!order.getUser().getId().equals(buyerUserId)) {
 throw new BadRequestException("You can only report issues for your own orders.");
 }

 if (order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.REFUNDED) {
 throw new BadRequestException("Cannot report issue on cancelled or refunded orders.");
 }

 // Check if an open dispute already exists
 Dispute existing = disputeRepository.findByOrderId(orderId).orElse(null);
 if (existing != null && existing.getStatus() == DisputeStatus.OPEN) {
 throw new BadRequestException("An active dispute is already open for this order.");
 }

 // Identify seller if order item is seller-owned
 User seller = null;
 if (order.getItems() != null) {
 for (OrderItem item : order.getItems()) {
 if (item.getProduct() != null && item.getProduct().getSeller() != null) {
 seller = item.getProduct().getSeller();
 break;
 }
 }
 }

 String evidenceJson = null;
 if (request.getEvidenceImages() != null && !request.getEvidenceImages().isEmpty()) {
 try {
 evidenceJson = objectMapper.writeValueAsString(request.getEvidenceImages());
 } catch (Exception e) {
 evidenceJson = String.join(",", request.getEvidenceImages());
 }
 }

 Dispute dispute = Dispute.builder()
 .order(order)
 .buyer(buyer)
 .seller(seller)
 .issueType(request.getIssueType() != null ? request.getIssueType().trim() : "ACCOUNT_VOUCHER_PROBLEM")
 .preferredSolution(request.getPreferredSolution() != null ? request.getPreferredSolution().trim() : "REPLACEMENT")
 .description(request.getDescription() != null ? request.getDescription().trim() : "")
 .evidenceImages(evidenceJson)
 .status(DisputeStatus.OPEN)
 .createdAt(LocalDateTime.now())
 .updatedAt(LocalDateTime.now())
 .build();

 dispute = disputeRepository.save(dispute);

 // Update order status to DISPUTED
 order.setStatus(OrderStatus.DISPUTED);
 orderRepository.save(order);

 log.info("Dispute #{} created for Order #{} by buyer [{}]", dispute.getId(), orderId, buyer.getEmail());

    // 1. Notify Seller via Email
    try {
      if (seller != null && seller.getEmail() != null) {
        String productName = (order.getItems() != null && !order.getItems().isEmpty() && order.getItems().get(0).getProduct() != null)
            ? order.getItems().get(0).getProduct().getName() : "Digital Product";
        emailService.sendDisputeCreatedToSeller(
            seller.getEmail(),
            seller.getName(),
            buyer.getEmail(),
            order.getId(),
            productName,
            dispute.getIssueType(),
            dispute.getPreferredSolution(),
            dispute.getDescription()
        );
      }
    } catch (Exception e) {
      log.warn("Failed to send dispute Seller email: {}", e.getMessage());
    }

    // 2. Send Confirmation Email to Buyer
    try {
      String productName = (order.getItems() != null && !order.getItems().isEmpty() && order.getItems().get(0).getProduct() != null)
          ? order.getItems().get(0).getProduct().getName() : "Digital Product";
      emailService.sendDisputeConfirmationToBuyer(
          buyer.getEmail(),
          buyer.getName(),
          order.getId(),
          productName,
          dispute.getIssueType(),
          dispute.getPreferredSolution()
      );
    } catch (Exception e) {
      log.warn("Failed to send dispute Buyer confirmation email: {}", e.getMessage());
    }

    // 3. Notify Admin via Telegram
    try {
      telegramNotificationService.sendAdminMessage(
          String.format("<b> New Dispute Reported Order #%d</b>\n" +
              "Buyer: %s\n" +
              "Issue: %s\n" +
              "Solution Requested: %s\n" +
              "Description: %s",
              order.getId(),
              buyer.getEmail(),
              dispute.getIssueType(),
              dispute.getPreferredSolution(),
              dispute.getDescription())
      );
    } catch (Exception e) {
      log.warn("Failed to send dispute Telegram notification: {}", e.getMessage());
    }

    return mapToResponse(dispute);
  }

 @Transactional(readOnly = true)
 public DisputeResponse getDisputeByOrderId(Long userId, Long orderId) {
 if (!orderRepository.existsById(orderId)) {
 throw new ResourceNotFoundException("Order not found");
 }
 User user = userRepository.findById(userId)
 .orElseThrow(() -> new ResourceNotFoundException("User not found"));

 Dispute dispute = disputeRepository.findByOrderId(orderId)
 .orElseThrow(() -> new ResourceNotFoundException("No dispute found for order #" + orderId));


 boolean isBuyer = dispute.getBuyer().getId().equals(userId);
 boolean isSeller = dispute.getSeller() != null && dispute.getSeller().getId().equals(userId);
 boolean isAdmin = user.getRole() == Role.ADMIN;

 if (!isBuyer && !isSeller && !isAdmin) {
 throw new BadRequestException("Unauthorized to view this dispute.");
 }

 return mapToResponse(dispute);
 }

 @Transactional(readOnly = true)
 public List<DisputeResponse> getBuyerDisputes(Long buyerId) {
 return disputeRepository.findByBuyerIdOrderByCreatedAtDesc(buyerId)
 .stream().map(this::mapToResponse).collect(Collectors.toList());
 }

 @Transactional(readOnly = true)
 public List<DisputeResponse> getSellerDisputes(Long sellerId) {
 return disputeRepository.findBySellerIdOrderByCreatedAtDesc(sellerId)
 .stream().map(this::mapToResponse).collect(Collectors.toList());
 }

 @Transactional(readOnly = true)
 public List<DisputeResponse> getAllDisputesForAdmin() {
 return disputeRepository.findAllByOrderByCreatedAtDesc()
 .stream().map(this::mapToResponse).collect(Collectors.toList());
 }

 @Transactional
 public DisputeResponse sellerRespond(Long sellerUserId, Long disputeId, SellerDisputeResponseRequest request) {
 Dispute dispute = disputeRepository.findById(disputeId)
 .orElseThrow(() -> new ResourceNotFoundException("Dispute not found"));
 User user = userRepository.findById(sellerUserId)
 .orElseThrow(() -> new ResourceNotFoundException("User not found"));

 boolean isSeller = dispute.getSeller() != null && dispute.getSeller().getId().equals(sellerUserId);
 boolean isAdmin = user.getRole() == Role.ADMIN;

 if (!isSeller && !isAdmin) {
 throw new BadRequestException("Unauthorized: you are not the seller for this dispute.");
 }

 if (dispute.getStatus() != DisputeStatus.OPEN && dispute.getStatus() != DisputeStatus.ESCALATED_ADMIN && dispute.getStatus() != DisputeStatus.RESOLVED_REPLACED) {
     throw new BadRequestException("Dispute is already " + dispute.getStatus());
 }

 String action = request.getAction() != null ? request.getAction().trim().toUpperCase() : "AGREE_REPLACEMENT";
 Order order = dispute.getOrder();

 if ("AGREE_REPLACEMENT".equals(action)) {
 dispute.setStatus(DisputeStatus.RESOLVED_REPLACED);
 dispute.setSellerResponse(request.getResponseMessage());
 dispute.setReplacementAccountEmail(request.getReplacementAccountEmail());
 dispute.setReplacementAccountPassword(request.getReplacementAccountPassword());
 dispute.setReplacementNote(request.getReplacementNote());
 dispute.setResolvedAt(LocalDateTime.now());

 // Update order with replacement credentials and return to DELIVERED status
 if (request.getReplacementAccountEmail() != null && !request.getReplacementAccountEmail().isBlank()) {
 order.setManualAccountEmail(request.getReplacementAccountEmail().trim());
 }
 if (request.getReplacementAccountPassword() != null) {
 order.setManualAccountPassword(request.getReplacementAccountPassword().trim());
 }
 if (request.getReplacementNote() != null) {
 order.setSellerDeliveryNote("Replacement: " + request.getReplacementNote().trim());
 }
 order.setStatus(OrderStatus.DELIVERED);
 order.setSellerDeliveredAt(LocalDateTime.now());
 orderRepository.save(order);

 log.info("Seller [{}] resolved Dispute #{} with Replacement on Order #{}", sellerUserId, disputeId, order.getId());

      // Send Replacement Credentials Email to Buyer
      try {
        User buyer = dispute.getBuyer();
        if (buyer != null && buyer.getEmail() != null) {
          String productName = (order.getItems() != null && !order.getItems().isEmpty() && order.getItems().get(0).getProduct() != null)
              ? order.getItems().get(0).getProduct().getName() : "Digital Product";
          emailService.sendDisputeResolvedToBuyer(
              buyer.getEmail(),
              buyer.getName(),
              order.getId(),
              productName,
              "1-to-1 Replacement (ប្តូរគណនីថ្មី)",
              request.getResponseMessage(),
              request.getReplacementAccountEmail(),
              request.getReplacementAccountPassword(),
              request.getReplacementNote()
          );
        }
      } catch (Exception e) {
        log.warn("Failed to send buyer replacement resolved email: {}", e.getMessage());
      }

 } else if ("AGREE_REFUND".equals(action)) {
 dispute.setStatus(DisputeStatus.RESOLVED_REFUNDED);
 dispute.setSellerResponse(request.getResponseMessage());
 dispute.setResolvedAt(LocalDateTime.now());

 order.setStatus(OrderStatus.REFUNDED);
 if (order.isSellerCredited()) {
 for (OrderItem item : order.getItems()) {
 if (item.getProduct() != null && item.getProduct().getSeller() != null) {
 User seller = item.getProduct().getSeller();
 double basePrice = item.getProduct().getBasePrice() != null ? item.getProduct().getBasePrice() : item.getPrice();
 double currentSellerBal = seller.getSellerBalance() != null ? seller.getSellerBalance() : 0.0;
 seller.setSellerBalance(Math.max(0.0, currentSellerBal - basePrice));
 userRepository.save(seller);
 }
 }
 order.setSellerCredited(false);
 }
 orderRepository.save(order);

 // Auto-credit refund to buyer balance
 User buyer = dispute.getBuyer();
 if (buyer != null && order.getTotalAmount() != null) {
 double refundAmount = order.getTotalAmount();
 double currentBuyerBal = buyer.getBuyerBalance() != null ? buyer.getBuyerBalance() : 0.0;
 buyer.setBuyerBalance(Math.round((currentBuyerBal + refundAmount) * 100.0) / 100.0);
 userRepository.save(buyer);
 log.info("Auto-credited ${} to buyer [{}] balance (New balance: ${})", refundAmount, buyer.getEmail(), buyer.getBuyerBalance());
 }

 log.info("Seller [{}] agreed to refund Dispute #{} on Order #{}", sellerUserId, disputeId, order.getId());

 } else if ("REJECT_ESCALATE".equals(action) || "ESCALATE_ADMIN".equals(action)) {
 dispute.setStatus(DisputeStatus.ESCALATED_ADMIN);
 dispute.setSellerResponse(request.getResponseMessage());

 order.setStatus(OrderStatus.ADMIN_MEDIATION);
 orderRepository.save(order);

 log.info("Dispute #{} escalated to ADMIN_MEDIATION by seller [{}]", disputeId, sellerUserId);

 // Notify admin of escalation
 try {
 telegramNotificationService.sendAdminMessage(
 String.format("<b> Dispute Escalated to Admin Mediation</b>\n" +
 "Dispute #%d (Order #%d)\n" +
 "Seller: %s\n" +
 "Seller Remark: %s",
 dispute.getId(), order.getId(), user.getEmail(), request.getResponseMessage())
 );
 } catch (Exception e) {
 log.warn("Failed to send escalation telegram: {}", e.getMessage());
 }
 } else {
 throw new BadRequestException("Invalid action: " + action);
 }

 dispute.setUpdatedAt(LocalDateTime.now());
 return mapToResponse(disputeRepository.save(dispute));
 }

 @Transactional
 public DisputeResponse adminResolve(Long adminUserId, Long disputeId, AdminDisputeResolveRequest request) {
 Dispute dispute = disputeRepository.findById(disputeId)
 .orElseThrow(() -> new ResourceNotFoundException("Dispute not found"));
 User admin = userRepository.findById(adminUserId)
 .orElseThrow(() -> new ResourceNotFoundException("User not found"));

 if (admin.getRole() != Role.ADMIN) {
 throw new BadRequestException("Only administrators can perform mediation decisions.");
 }

 String decision = request.getDecision() != null ? request.getDecision().trim().toUpperCase() : "REFUND_BUYER";
 Order order = dispute.getOrder();

 if ("REFUND_BUYER".equals(decision) || "REFUND".equals(decision)) {
 dispute.setStatus(DisputeStatus.RESOLVED_ADMIN_REFUNDED);
 dispute.setAdminNotes(request.getAdminNotes());
 dispute.setResolvedAt(LocalDateTime.now());

 order.setStatus(OrderStatus.REFUNDED);
 if (order.isSellerCredited()) {
 for (OrderItem item : order.getItems()) {
 if (item.getProduct() != null && item.getProduct().getSeller() != null) {
 User seller = item.getProduct().getSeller();
 double basePrice = item.getProduct().getBasePrice() != null ? item.getProduct().getBasePrice() : item.getPrice();
 seller.setSellerBalance(Math.max(0.0, seller.getSellerBalance() - basePrice));
 userRepository.save(seller);
 }
 }
 order.setSellerCredited(false);
 }
 orderRepository.save(order);

 // Auto-credit refund to buyer balance so buyer can purchase replacement
 User buyer = dispute.getBuyer();
 if (buyer != null && order.getTotalAmount() != null) {
 double refundAmount = order.getTotalAmount();
 double currentBuyerBal = buyer.getBuyerBalance() != null ? buyer.getBuyerBalance() : 0.0;
 buyer.setBuyerBalance(Math.round((currentBuyerBal + refundAmount) * 100.0) / 100.0);
 userRepository.save(buyer);
 log.info("Admin auto-credited ${} to buyer [{}] balance for replacement (New balance: ${})", refundAmount, buyer.getEmail(), buyer.getBuyerBalance());
 }

 // Apply seller penalty
 if (dispute.getSeller() != null) {
 try {
 sellerService.recalculateSellerReputation(dispute.getSeller().getId());
 } catch (Exception ignored) {}
 }

 log.info("Admin [{}] resolved Dispute #{} -> REFUND to Buyer on Order #{}", adminUserId, disputeId, order.getId());

 } else if ("COMPLETE_SELLER".equals(decision) || "COMPLETE".equals(decision)) {
 dispute.setStatus(DisputeStatus.RESOLVED_ADMIN_COMPLETED);
 dispute.setAdminNotes(request.getAdminNotes());
 dispute.setResolvedAt(LocalDateTime.now());

 order.setStatus(OrderStatus.COMPLETED);
 if (!order.isSellerCredited()) {
 for (OrderItem item : order.getItems()) {
 if (item.getProduct() != null && item.getProduct().getSeller() != null) {
 double basePrice = item.getProduct().getBasePrice() != null ? item.getProduct().getBasePrice() : item.getPrice();
 sellerService.creditSellerBalance(item.getProduct().getSeller().getId(), basePrice);
 }
 }
 order.setSellerCredited(true);
 }
 orderRepository.save(order);

 log.info("Admin [{}] resolved Dispute #{} -> COMPLETE in favor of Seller on Order #{}", adminUserId, disputeId, order.getId());

 } else if ("REJECT_DISPUTE".equals(decision)) {
 dispute.setStatus(DisputeStatus.REJECTED);
 dispute.setAdminNotes(request.getAdminNotes());
 dispute.setResolvedAt(LocalDateTime.now());

 order.setStatus(OrderStatus.DELIVERED);
 orderRepository.save(order);

 log.info("Admin [{}] dismissed Dispute #{} on Order #{}", adminUserId, disputeId, order.getId());
 } else {
 throw new BadRequestException("Invalid decision: " + decision);
 }

 dispute.setUpdatedAt(LocalDateTime.now());
 return mapToResponse(disputeRepository.save(dispute));
 }

 public DisputeResponse mapToResponse(Dispute d) {
 if (d == null) return null;
 DisputeResponse res = new DisputeResponse();
 res.setId(d.getId());
 if (d.getOrder() != null) {
 res.setOrderId(d.getOrder().getId());
 res.setOrderAmount(d.getOrder().getTotalAmount());
 res.setOrderStatus(d.getOrder().getStatus() != null ? d.getOrder().getStatus().name() : "");
 if (d.getOrder().getItems() != null && !d.getOrder().getItems().isEmpty()) {
 OrderItem firstItem = d.getOrder().getItems().get(0);
 if (firstItem != null && firstItem.getProduct() != null) {
 res.setProductName(firstItem.getProduct().getName());
 res.setProductImageUrl(firstItem.getProduct().getImageUrl());
 }
 }
 }
 if (d.getBuyer() != null) {
 res.setBuyerId(d.getBuyer().getId());
 res.setBuyerEmail(d.getBuyer().getEmail());
 res.setBuyerName(d.getBuyer().getName());
 }
 if (d.getSeller() != null) {
 res.setSellerId(d.getSeller().getId());
 res.setSellerEmail(d.getSeller().getEmail());
 sellerProfileRepository.findByUserId(d.getSeller().getId()).ifPresent(sp -> {
 res.setSellerStoreName(sp.getStoreName());
 });
 }
 res.setIssueType(d.getIssueType());
 res.setPreferredSolution(d.getPreferredSolution());
 res.setDescription(d.getDescription());

 // Parse evidence images JSON ឬ comma-separated
 List<String> images = new ArrayList<>();
 if (d.getEvidenceImages() != null && !d.getEvidenceImages().isBlank()) {
 try {
 images = objectMapper.readValue(d.getEvidenceImages(), new TypeReference<List<String>>() {});
 } catch (Exception e) {
 for (String part : d.getEvidenceImages().split(",")) {
 if (!part.trim().isEmpty()) images.add(part.trim());
 }
 }
 }
 res.setEvidenceImages(images);

 res.setStatus(d.getStatus());
 res.setSellerResponse(d.getSellerResponse());
 res.setReplacementAccountEmail(d.getReplacementAccountEmail());
 res.setReplacementAccountPassword(d.getReplacementAccountPassword());
 res.setReplacementNote(d.getReplacementNote());
 res.setAdminNotes(d.getAdminNotes());
 res.setCreatedAt(d.getCreatedAt());
 res.setUpdatedAt(d.getUpdatedAt());
 res.setResolvedAt(d.getResolvedAt());

 return res;
 }
}
