package com.sabyshop.service;

import com.sabyshop.dto.DeliveredAccount;
import com.sabyshop.dto.OrderItemRequest;
import com.sabyshop.dto.OrderItemResponse;
import com.sabyshop.dto.OrderRequest;
import com.sabyshop.dto.OrderResponse;
import com.sabyshop.exception.BadRequestException;
import com.sabyshop.exception.InsufficientStockException;
import com.sabyshop.exception.ResourceNotFoundException;
import com.sabyshop.model.Order;
import com.sabyshop.model.OrderItem;
import com.sabyshop.model.OrderStatus;
import com.sabyshop.model.Product;
import com.sabyshop.model.ProductStock;
import com.sabyshop.model.Role;
import com.sabyshop.model.User;
import com.sabyshop.repository.OrderRepository;
import com.sabyshop.repository.ProductRepository;
import com.sabyshop.repository.ProductStockRepository;
import com.sabyshop.repository.SellerProfileRepository;
import com.sabyshop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductStockRepository productStockRepository;
    private final PaymentService paymentService;
    private final TelegramNotificationService telegramNotificationService;
    private final EmailService emailService;
    private final SellerProfileRepository sellerProfileRepository;
    private final com.sabyshop.repository.CouponRepository couponRepository;
    private final com.sabyshop.repository.ProductReviewRepository productReviewRepository;
    // Circular-dependency-safe: use setter injection instead of constructor for SellerService
    @org.springframework.context.annotation.Lazy
    @org.springframework.beans.factory.annotation.Autowired
    private SellerService sellerService;

    @Transactional
    public OrderResponse createOrder(Long userId, OrderRequest request) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException("Order must contain at least one item");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        double totalAmount = 0.0;
        List<OrderItem> orderItems = new ArrayList<>();

        for (OrderItemRequest itemReq : request.getItems()) {
            if (itemReq == null || itemReq.getProductId() == null) {
                throw new BadRequestException("Invalid product item in order request");
            }

            int qty = Math.max(1, itemReq.getQuantity());
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

            boolean isSharing = product.getProductType() != null && "SHARING".equalsIgnoreCase(product.getProductType().trim());
            List<ProductStock> availableStock = productStockRepository.findByProductIdAndSoldFalse(product.getId());
            if (!isSharing && availableStock.size() < qty) {
                throw new InsufficientStockException("Insufficient stock for product: " + product.getName());
            }

            String itemInviteEmail = itemReq.getBuyerInviteEmail() != null && !itemReq.getBuyerInviteEmail().isBlank()
                    ? itemReq.getBuyerInviteEmail().trim()
                    : (request.getBuyerInviteEmail() != null && !request.getBuyerInviteEmail().isBlank() ? request.getBuyerInviteEmail().trim() : user.getEmail());

            double price = product.getPrice() != null ? product.getPrice() : 0.0;
            for (int i = 0; i < qty; i++) {
                OrderItem orderItem = OrderItem.builder()
                        .product(product)
                        .price(price)
                        .stockItem(null)
                        .buyerInviteEmail(itemInviteEmail)
                        .build();
                orderItems.add(orderItem);
                
                totalAmount += price;
            }
        }

        double originalSubtotal = Math.round(totalAmount * 100.0) / 100.0;
        double discountAmount = 0.0;
        String appliedCouponCode = null;

        // Apply Coupon if provided
        if (request.getCouponCode() != null && !request.getCouponCode().trim().isEmpty()) {
            String code = request.getCouponCode().trim().toUpperCase();
            com.sabyshop.model.Coupon coupon = couponRepository.findByCodeIgnoreCaseAndActiveTrue(code).orElse(null);
            if (coupon != null && coupon.isValid()) {
                Long couponSellerId = coupon.getSeller() != null ? coupon.getSeller().getId() : null;
                Long couponProductId = coupon.getProductId();

                // Calculate eligible subtotal for this coupon
                double eligibleSubtotal = 0.0;
                for (OrderItem item : orderItems) {
                    Product prod = item.getProduct();
                    if (prod == null) continue;
                    boolean matchSeller = (couponSellerId == null) || (prod.getSeller() != null && prod.getSeller().getId().equals(couponSellerId));
                    boolean matchProduct = (couponProductId == null) || (prod.getId().equals(couponProductId));
                    if (matchSeller && matchProduct) {
                        eligibleSubtotal += item.getPrice();
                    }
                }

                if (eligibleSubtotal > 0 && (coupon.getMinSpend() == null || eligibleSubtotal >= coupon.getMinSpend())) {
                    if ("PERCENTAGE".equalsIgnoreCase(coupon.getDiscountType())) {
                        discountAmount = eligibleSubtotal * (coupon.getDiscountValue() / 100.0);
                    } else {
                        discountAmount = coupon.getDiscountValue();
                    }
                    if (coupon.getMaxDiscount() != null && discountAmount > coupon.getMaxDiscount()) {
                        discountAmount = coupon.getMaxDiscount();
                    }
                    discountAmount = Math.min(discountAmount, eligibleSubtotal);
                    discountAmount = Math.round(discountAmount * 100.0) / 100.0;
                    appliedCouponCode = coupon.getCode();

                    // Increment usage
                    coupon.setUsedCount((coupon.getUsedCount() != null ? coupon.getUsedCount() : 0) + 1);
                    couponRepository.save(coupon);
                    log.info("Coupon [{}] applied to Order by User [{}]. Discount: ${}, Eligible Subtotal: ${}", code, userId, discountAmount, eligibleSubtotal);
                }
            }
        }

        double finalAmount = Math.max(0.01, Math.round((originalSubtotal - discountAmount) * 100.0) / 100.0);

        String orderInviteEmail = request.getBuyerInviteEmail() != null && !request.getBuyerInviteEmail().isBlank()
                ? request.getBuyerInviteEmail().trim()
                : user.getEmail();

        Order order = Order.builder()
                .user(user)
                .totalAmount(finalAmount)
                .originalSubtotal(originalSubtotal)
                .discountAmount(discountAmount > 0 ? discountAmount : null)
                .couponCode(appliedCouponCode)
                .buyerInviteEmail(orderInviteEmail)
                .claimNote(request.getClaimNote() != null ? request.getClaimNote().trim() : null)
                .status(OrderStatus.PENDING)
                .paymentId(request.getPaymentId())
                .createdAt(LocalDateTime.now())
                .items(new ArrayList<>())
                .build();

        for (OrderItem item : orderItems) {
            item.setOrder(order);
            order.getItems().add(item);
        }

        order = orderRepository.save(order);

        // Notify customer via Email
        try {
            emailService.sendOrderStatusNotification(user, order, OrderStatus.PENDING);
        } catch (Exception e) {
            log.warn("Failed to send order status email for Order #{}: {}", order.getId(), e.getMessage());
        }

        // Notify sellers & admin via Telegram
        try {
            Map<Long, List<OrderItem>> sellerItemsMap = new java.util.HashMap<>();
            Map<Long, User> sellersMap = new java.util.HashMap<>();
            for (OrderItem item : order.getItems()) {
                if (item.getProduct() != null && item.getProduct().getSeller() != null) {
                    User s = item.getProduct().getSeller();
                    sellerItemsMap.computeIfAbsent(s.getId(), k -> new java.util.ArrayList<>()).add(item);
                    sellersMap.put(s.getId(), s);
                }
            }
            for (Map.Entry<Long, List<OrderItem>> entry : sellerItemsMap.entrySet()) {
                User s = sellersMap.get(entry.getKey());
                telegramNotificationService.sendSellerOrderNotification(s, order, entry.getValue());
            }
            telegramNotificationService.sendAdminOrderNotification(order);
        } catch (Exception e) {
            log.warn("Failed to send new-order Telegram notifications for Order #{}: {}", order.getId(), e.getMessage());
        }

        return mapToResponse(order);
    }

    @Transactional
    public OrderResponse verifyPayment(Long userId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!order.getUser().getId().equals(userId)) {
            throw new BadRequestException("Unauthorized: You do not own this order.");
        }

        if (order.getStatus() == OrderStatus.COMPLETED) {
            return mapToResponse(order);
        }

        boolean isPaid = paymentService.checkAbaPayWayTransaction("ORD-" + orderId);

        if (isPaid) {
            return processPaymentConfirmed(orderId, "Manual Verify");
        }

        return mapToResponse(order);
    }

    /**
     * Confirms payment for an order and fulfills it (or moves to PROCESSING for SHARING).
     * Reusable by manual verification, push webhook, and polling.
     */
    @Transactional
    public OrderResponse processPaymentConfirmed(Long orderId, String source) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getStatus() == OrderStatus.COMPLETED) {
            return mapToResponse(order);
        }

        boolean hasSharing = order.getItems() != null && order.getItems().stream().anyMatch(i ->
                i.getProduct() != null && i.getProduct().getProductType() != null && "SHARING".equalsIgnoreCase(i.getProduct().getProductType().trim())
        );

        if (hasSharing) {
            // For SHARING accounts, seller must manually invite the customer's email.
            // Status moves to PROCESSING, funds held in escrow until seller delivers & buyer confirms or 48h auto-release.
            order.setStatus(OrderStatus.PROCESSING);
            order.setSellerCredited(false);
            order.setSellerDeliveredAt(null);
            order = orderRepository.save(order);

            log.info("Payment confirmed ({}) for SHARING Order #{}. Status set to PROCESSING awaiting seller invitation.", source, orderId);

            // Notify seller with customer invite email
            for (OrderItem item : order.getItems()) {
                if (item.getProduct() != null && item.getProduct().getSeller() != null) {
                    String inviteMail = item.getBuyerInviteEmail() != null && !item.getBuyerInviteEmail().isBlank()
                            ? item.getBuyerInviteEmail().trim()
                            : (order.getBuyerInviteEmail() != null && !order.getBuyerInviteEmail().isBlank() ? order.getBuyerInviteEmail().trim() : (order.getUser() != null ? order.getUser().getEmail() : ""));
                    try {
                        emailService.sendSellerNewOrderNotification(item.getProduct().getSeller(), order, item.getProduct().getName(), item.getProduct().getBasePrice());
                        telegramNotificationService.sendAdminMessage(
                            String.format("<b>New Sharing Account Order #%d</b>\n" +
                                          "Product: %s\n" +
                                          "Customer Invite Email: <code>%s</code>\n" +
                                          "Seller: %s\n" +
                                          "Action Required: Seller must invite buyer email, then click 'Deliver Done'.",
                                order.getId(),
                                item.getProduct().getName(),
                                inviteMail,
                                item.getProduct().getSeller().getEmail())
                        );
                    } catch (Exception e) {
                        log.warn("Failed to notify seller for SHARING order #{}: {}", order.getId(), e.getMessage());
                    }
                }
            }

            // Notify customer via Email that order is processing
            try {
                emailService.sendOrderStatusNotification(order.getUser(), order, OrderStatus.PROCESSING);
            } catch (Exception e) {
                log.warn("Failed to send processing email for Order #{}: {}", order.getId(), e.getMessage());
            }

            // Notify sellers via Telegram with PROCESSING status & Dashboard action button
            notifySellersOfStatus(order, OrderStatus.PROCESSING);

            return mapToResponse(order);
        }

        boolean allInStock = true;
        for (OrderItem item : order.getItems()) {
            List<ProductStock> availableStock = productStockRepository.findByProductIdAndSoldFalse(item.getProduct().getId());
            if (availableStock.isEmpty()) {
                allInStock = false;
                break;
            }
        }

        if (!allInStock) {
            order.setStatus(OrderStatus.WAITING_FOR_STOCK);
            order = orderRepository.save(order);
            log.info("Payment confirmed ({}) for Order #{} but stock is out. Status set to WAITING_FOR_STOCK.", source, orderId);
            return mapToResponse(order);
        }

        for (OrderItem item : order.getItems()) {
            List<ProductStock> availableStock = productStockRepository.findByProductIdAndSoldFalse(item.getProduct().getId());
            if (!availableStock.isEmpty()) {
                ProductStock stock = availableStock.get(0);
                stock.setSold(true);
                stock.setSoldAt(LocalDateTime.now());
                stock.setOrder(order);
                productStockRepository.save(stock);

                item.setStockItem(stock);
            }
        }

        order.setStatus(OrderStatus.COMPLETED);
        order.setSellerCredited(true);
        order = orderRepository.save(order);

        // Credit seller balance for each seller-owned product
        for (OrderItem item : order.getItems()) {
            if (item.getProduct() != null && item.getProduct().getSeller() != null) {
                double basePrice = item.getProduct().getBasePrice() != null
                        ? item.getProduct().getBasePrice()
                        : (item.getPrice() != null ? item.getPrice() : 0.0);
                try {
                    sellerService.creditSellerBalance(item.getProduct().getSeller().getId(), basePrice);
                    emailService.sendSellerNewOrderNotification(item.getProduct().getSeller(), order, item.getProduct().getName(), basePrice);
                } catch (Exception e) {
                    log.warn("Failed to credit seller balance / send notification for item [{}]: {}", item.getId(), e.getMessage());
                }
            }
        }

        // Notify customer via Email
        try {
            emailService.sendOrderStatusNotification(order.getUser(), order, OrderStatus.COMPLETED);
        } catch (Exception e) {
            log.warn("Failed to send payment confirmation email for Order #{}: {}", order.getId(), e.getMessage());
        }

        // Notify sellers & admin via Telegram
        try {
            notifySellersOfStatus(order, OrderStatus.COMPLETED);
            telegramNotificationService.sendAdminOrderNotification(order);
        } catch (Exception e) {
            log.warn("Failed to send payment-confirmed Telegram notification for Order #{}: {}", order.getId(), e.getMessage());
        }

        return mapToResponse(order);
    }

    public OrderResponse getOrderById(Long userId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean isBuyer = order.getUser() != null && order.getUser().getId().equals(userId);
        boolean isAdmin = user.getRole() == Role.ADMIN;
        boolean isSellerOfOrder = order.getItems() != null && order.getItems().stream().anyMatch(item ->
                item.getProduct() != null && item.getProduct().getSeller() != null && item.getProduct().getSeller().getId().equals(userId)
        );

        if (!isBuyer && !isAdmin && !isSellerOfOrder) {
            throw new BadRequestException("Unauthorized: You do not have access to this order.");
        }

        return mapToResponse(order);
    }

    public List<OrderResponse> getUserOrders(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public void cancelOrder(Long userId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!order.getUser().getId().equals(userId) && user.getRole() != Role.ADMIN) {
            throw new BadRequestException("Unauthorized: You cannot cancel this order.");
        }

        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.PROCESSING) {
            throw new BadRequestException("Only pending or processing orders can be cancelled.");
        }

        orderRepository.delete(order);
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if ((newStatus == OrderStatus.REFUNDED || newStatus == OrderStatus.CANCELLED) && order.isSellerCredited()) {
            for (OrderItem item : order.getItems()) {
                if (item.getProduct() != null && item.getProduct().getSeller() != null) {
                    User seller = item.getProduct().getSeller();
                    double basePrice = item.getProduct().getBasePrice() != null
                            ? item.getProduct().getBasePrice()
                            : (item.getPrice() != null ? item.getPrice() : 0.0);
                    double currentBal = seller.getSellerBalance() != null ? seller.getSellerBalance() : 0.0;
                    seller.setSellerBalance(Math.max(0.0, currentBal - basePrice));
                    userRepository.save(seller);
                    log.info("Auto-deducted ${} from seller [{}] balance due to Order #{} refund", basePrice, seller.getEmail(), orderId);
                }
            }
            order.setSellerCredited(false);
        }

        order.setStatus(newStatus);
        order = orderRepository.save(order);

        if (newStatus == OrderStatus.PROCESSING || newStatus == OrderStatus.COMPLETED) {
            notifySellersOfStatus(order, newStatus);
        }

        return mapToResponse(order);
    }

    /**
     * Seller marks order as DELIVERED after completing buyer's invitation or manual delivery.
     */
    @Transactional
    public OrderResponse deliverOrder(Long sellerUserId, Long orderId, com.sabyshop.dto.OrderDeliveryRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        User currentUser = userRepository.findById(sellerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        boolean isSeller = order.getItems() != null && order.getItems().stream().anyMatch(item ->
                item.getProduct() != null && item.getProduct().getSeller() != null && item.getProduct().getSeller().getId().equals(sellerUserId)
        );

        if (!isAdmin && !isSeller) {
            throw new BadRequestException("Unauthorized: You do not own this order.");
        }

        if (order.getStatus() != OrderStatus.PROCESSING && order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.WAITING_FOR_STOCK && order.getStatus() != OrderStatus.DELIVERED) {
            throw new BadRequestException("Order is in status " + order.getStatus() + " and cannot be delivered.");
        }

        if (request != null) {
            if (request.getAccountEmail() != null && !request.getAccountEmail().isBlank()) {
                order.setManualAccountEmail(request.getAccountEmail().trim());
            }
            if (request.getAccountPassword() != null) {
                order.setManualAccountPassword(request.getAccountPassword().trim());
            }
            if (request.getDeliveryNote() != null) {
                order.setSellerDeliveryNote(request.getDeliveryNote().trim());
            }
        }
        order.setStatus(OrderStatus.DELIVERED);
        order.setSellerDeliveredAt(LocalDateTime.now());
        order = orderRepository.save(order);

        log.info("Order #{} marked as DELIVERED by seller [{}] at {}", orderId, sellerUserId, order.getSellerDeliveredAt());

        // Notify customer via Email & Telegram
        try {
            emailService.sendOrderStatusNotification(order.getUser(), order, OrderStatus.DELIVERED);
        } catch (Exception e) {
            log.warn("Failed to send order status email: {}", e.getMessage());
        }

        return mapToResponse(order);
    }

    /**
     * Buyer (or Admin) confirms order delivery receipt. Releases funds to seller immediately.
     */
    @Transactional
    public OrderResponse confirmOrderDelivery(Long userId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean isBuyer = order.getUser() != null && order.getUser().getId().equals(userId);
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;

        if (!isBuyer && !isAdmin) {
            throw new BadRequestException("Unauthorized: Only the buyer can confirm order delivery.");
        }

        if (order.getStatus() == OrderStatus.COMPLETED) {
            return mapToResponse(order);
        }

        order.setStatus(OrderStatus.COMPLETED);

        // Credit seller balance if not yet credited
        if (!order.isSellerCredited()) {
            for (OrderItem item : order.getItems()) {
                if (item.getProduct() != null && item.getProduct().getSeller() != null) {
                    double basePrice = item.getProduct().getBasePrice() != null
                            ? item.getProduct().getBasePrice()
                            : (item.getPrice() != null ? item.getPrice() : 0.0);
                    try {
                        sellerService.creditSellerBalance(item.getProduct().getSeller().getId(), basePrice);
                        log.info("Credited ${} to seller [{}] upon Buyer confirmation for Order #{}", basePrice, item.getProduct().getSeller().getId(), orderId);
                    } catch (Exception e) {
                        log.warn("Failed to credit seller balance on confirm for Order #{}: {}", orderId, e.getMessage());
                    }
                }
            }
            order.setSellerCredited(true);
        }

        order = orderRepository.save(order);

        log.info("Order #{} successfully confirmed as COMPLETED by buyer [{}]", orderId, userId);

        try {
            emailService.sendOrderStatusNotification(order.getUser(), order, OrderStatus.COMPLETED);
        } catch (Exception e) {
            log.warn("Failed to send completion email: {}", e.getMessage());
        }

        notifySellersOfStatus(order, OrderStatus.COMPLETED);

        return mapToResponse(order);
    }

    /**
     * Automated Escrow Payout:
     * If no action from user for 48 hours after seller delivery, automatically mark COMPLETED and add balance to seller.
     */
    @Transactional
    public void autoReleaseDeliveredOrders() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(48);
        List<Order> deliveredOrders = orderRepository.findDeliveredOrdersForEscrowRelease(OrderStatus.DELIVERED, cutoff);

        for (Order order : deliveredOrders) {
            try {
                order.setStatus(OrderStatus.COMPLETED);
                for (OrderItem item : order.getItems()) {
                    if (item.getProduct() != null && item.getProduct().getSeller() != null) {
                        double basePrice = item.getProduct().getBasePrice() != null
                                ? item.getProduct().getBasePrice()
                                : (item.getPrice() != null ? item.getPrice() : 0.0);
                        sellerService.creditSellerBalance(item.getProduct().getSeller().getId(), basePrice);
                        log.info("Auto-released ${} to seller [{}] for Order #{} (48h timer expired)", basePrice, item.getProduct().getSeller().getId(), order.getId());
                    }
                }
                order.setSellerCredited(true);
                orderRepository.save(order);
                log.info("Order #{} auto-completed after 48h with no buyer dispute.", order.getId());

                notifySellersOfStatus(order, OrderStatus.COMPLETED);
            } catch (Exception e) {
                log.error("Error auto-releasing order #{}: {}", order.getId(), e.getMessage());
            }
        }
    }

    public void notifySellersOfStatus(Order order, OrderStatus status) {
        if (order == null || order.getItems() == null || status == null) return;
        try {
            Map<Long, List<OrderItem>> sellerItemsMap = new HashMap<>();
            Map<Long, User> sellersMap = new HashMap<>();
            for (OrderItem item : order.getItems()) {
                if (item.getProduct() != null && item.getProduct().getSeller() != null) {
                    User s = item.getProduct().getSeller();
                    sellerItemsMap.computeIfAbsent(s.getId(), k -> new ArrayList<>()).add(item);
                    sellersMap.put(s.getId(), s);
                }
            }
            for (Map.Entry<Long, List<OrderItem>> entry : sellerItemsMap.entrySet()) {
                User s = sellersMap.get(entry.getKey());
                if (status == OrderStatus.PROCESSING) {
                    telegramNotificationService.sendSellerOrderProcessingNotification(s, order, entry.getValue());
                } else if (status == OrderStatus.COMPLETED) {
                    telegramNotificationService.sendSellerOrderSuccessNotification(s, order, entry.getValue());
                } else {
                    telegramNotificationService.sendSellerOrderNotification(s, order, entry.getValue());
                }
            }
        } catch (Exception e) {
            log.warn("Failed to send seller status notification for Order #{}: {}", order.getId(), e.getMessage());
        }
    }

    public OrderResponse mapToResponse(Order order) {
        if (order == null) return null;
        OrderResponse res = new OrderResponse();
        res.setId(order.getId());
        res.setTotalAmount(order.getTotalAmount() != null ? order.getTotalAmount() : 0.0);
        res.setOriginalSubtotal(order.getOriginalSubtotal() != null ? order.getOriginalSubtotal() : (order.getTotalAmount() != null ? order.getTotalAmount() : 0.0));
        res.setDiscountAmount(order.getDiscountAmount());
        res.setCouponCode(order.getCouponCode());
        res.setStatus(order.getStatus());
        res.setPaymentId(order.getPaymentId());
        res.setCreatedAt(order.getCreatedAt());
        res.setBuyerInviteEmail(order.getBuyerInviteEmail());
        res.setClaimNote(order.getClaimNote());
        res.setManualAccountEmail(order.getManualAccountEmail());
        res.setManualAccountPassword(order.getManualAccountPassword());
        res.setSellerDeliveryNote(order.getSellerDeliveryNote());
        res.setSellerDeliveredAt(order.getSellerDeliveredAt());
        res.setSellerCredited(order.isSellerCredited());

        if (order.getUser() != null) {
            res.setCustomerEmail(order.getUser().getEmail());
            String uName = order.getUser().getName();
            if (uName != null && !uName.isBlank()) {
                res.setCustomerName(uName);
            } else if (order.getUser().getEmail() != null) {
                res.setCustomerName(order.getUser().getEmail().split("@")[0]);
            } else {
                res.setCustomerName("Customer");
            }
        } else {
            res.setCustomerEmail("Unknown User");
            res.setCustomerName("Customer");
        }

        List<OrderItemResponse> itemResponses = new ArrayList<>();
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                if (item == null) continue;
                OrderItemResponse itemRes = new OrderItemResponse();
                itemRes.setId(item.getId());
                if (item.getProduct() != null) {
                    itemRes.setProductId(item.getProduct().getId());
                    itemRes.setProductType(item.getProduct().getProductType());
                    itemRes.setDuration(item.getProduct().getDuration());
                }
                itemRes.setProductName(item.getProduct() != null ? item.getProduct().getName() : "Digital Product");
                itemRes.setProductImageUrl(item.getProduct() != null ? item.getProduct().getImageUrl() : null);
                itemRes.setPrice(item.getPrice() != null ? item.getPrice() : 0.0);
                itemRes.setBuyerInviteEmail(item.getBuyerInviteEmail() != null ? item.getBuyerInviteEmail() : order.getBuyerInviteEmail());
                
                if (item.getStockItem() != null) {
                    DeliveredAccount account = new DeliveredAccount(
                            item.getStockItem().getAccountEmail(),
                            item.getStockItem().getAccountPassword()
                    );
                    itemRes.setDeliveredAccounts(List.of(account));
                } else if (order.getManualAccountEmail() != null && !order.getManualAccountEmail().isBlank()) {
                    DeliveredAccount account = new DeliveredAccount(
                            order.getManualAccountEmail(),
                            order.getManualAccountPassword() != null ? order.getManualAccountPassword() : ""
                    );
                    itemRes.setDeliveredAccounts(List.of(account));
                } else {
                    itemRes.setDeliveredAccounts(List.of());
                }
                itemResponses.add(itemRes);
            }
        }
        res.setItems(itemResponses);

        // Populate seller details from the first item's product seller, if any
        if (order.getItems() != null && !order.getItems().isEmpty()) {
            OrderItem firstItem = order.getItems().stream()
                .filter(i -> i != null && i.getProduct() != null && i.getProduct().getSeller() != null)
                .findFirst().orElse(null);
            if (firstItem != null) {
                User sellerUser = firstItem.getProduct().getSeller();
                res.setSellerId(sellerUser.getId());
                sellerProfileRepository.findByUserId(sellerUser.getId())
                    .ifPresent(sp -> {
                        res.setSellerStoreName(sp.getStoreName());
                        res.setSellerStoreLogoUrl(sp.getStoreLogoUrl() != null && !sp.getStoreLogoUrl().isBlank() ? sp.getStoreLogoUrl() : sellerUser.getAvatarUrl());
                    });
            }
        }

        // Payment method is ABA PayWay (KHQR)
        res.setPaymentMethod("ABA_PAYWAY");

        // Check if customer has already reviewed this order
        try {
            if (order.getUser() != null && order.getItems() != null && !order.getItems().isEmpty()) {
                OrderItem firstItm = order.getItems().get(0);
                if (firstItm != null && firstItm.getProduct() != null) {
                    boolean reviewed = productReviewRepository.existsByBuyerIdAndProductIdAndOrderId(
                        order.getUser().getId(), firstItm.getProduct().getId(), order.getId()
                    );
                    res.setHasReviewed(reviewed);
                } else {
                    res.setHasReviewed(false);
                }
            } else {
                res.setHasReviewed(false);
            }
        } catch (Exception e) {
            res.setHasReviewed(false);
        }

        return res;
    }

    /**
     * Re-links a new KHQR MD5 hash to an existing PENDING order.
     *
     * This is needed when the original QR code expires before the user pays —
     * the frontend generates a new QR (new MD5) and calls this endpoint so the
     * backend can verify against the correct MD5 on the next polling cycle.
     *
     * Only PENDING orders may have their paymentId updated.
     *
     * @param userId  the authenticated user's ID
     * @param orderId the order to update
     * @param newMd5  the MD5 hash of the newly generated KHQR string
     * @return updated order response
     */
    @Transactional
    public OrderResponse updatePaymentId(Long userId, Long orderId, String newMd5) {
        if (newMd5 == null || newMd5.isBlank()) {
            throw new BadRequestException("paymentId must not be blank");
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!order.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new BadRequestException(
                    "Can only update paymentId on PENDING orders. Current status: " + order.getStatus());
        }

        log.info("Updating paymentId for order [{}] from [{}] to [{}]",
                orderId, order.getPaymentId(), newMd5);

        order.setPaymentId(newMd5.trim());
        order = orderRepository.save(order);
        return mapToResponse(order);
    }
}
