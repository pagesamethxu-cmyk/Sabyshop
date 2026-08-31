package com.sabyshop.controller;

import com.sabyshop.repository.OrderRepository;
import com.sabyshop.service.PaymentService;
import com.sabyshop.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for ABA PayWay Ecommerce Checkout integration.
 *
 * Endpoints:
 * POST /api/payments/generate-aba-qr – Initiates a purchase via the ABA PayWay API
 * POST /api/payments/payway-webhook – Push webhook from ABA PayWay server on payment
 * GET /api/payments/payway-return – Redirect-back callback (return_url after checkout)
 * POST /api/payments/check-transaction – Check payment status with ABA PayWay server
 * GET /api/payments/check-transaction/{tranId} – Convenience check endpoint for frontend polling
 *
 * ABA PayWay webhook payload fields:
 * tran_id, status, apv, payment_type, req_time, hash
 *
 * Status "0" = success (string comparison, not integer).
 *
 * Webhook hash formula (official ABA PayWay spec):
 * HMAC-SHA512(tran_id + status, api_key) — concatenated, no separator
 * (Legacy fallback: tran_id + ";" + status)
 */
@Slf4j
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PayWayWebhookController {

    private final OrderRepository orderRepository;
    private final PaymentService paymentService;
    private final OrderService orderService;

 @Value("${aba.payway.api-key:4ce6956524915bb922d889f6359fee5555d50448}")
 private String apiKey;

 @Value("${app.base-url:http://localhost:5173}")
 private String baseUrl;

 // Generate QR ឬ Initiate Purchase 

 /**
 * Frontend calls this to initiate a purchase via the ABA PayWay API.
 * Returns all form fields needed for a hosted checkout redirect as well as
 * direct QR API qrString and qrImage if available.
 */
 @PostMapping("/generate-aba-qr")
 public ResponseEntity<Map<String, Object>> generateAbaQr(@RequestBody Map<String, Object> body) {
 String tranId = String.valueOf(body.getOrDefault("tran_id", "ORD-" + System.currentTimeMillis()));
 double amount = Double.parseDouble(String.valueOf(body.getOrDefault("amount", 0.0)));
 String currency = String.valueOf(body.getOrDefault("currency", "USD"));
 String email = String.valueOf(body.getOrDefault("email", "customer@example.com"));
 String phone = String.valueOf(body.getOrDefault("phone", "0972089305"));

 Map<String, Object> hostedResult = paymentService.generateAbaPayWayQr(tranId, amount, currency, email, phone);

 // Also try direct ABA generate-qr API for instant qrImage and qrString
 Map<String, Object> directQrResult = paymentService.generateDirectAbaQr(tranId, amount, currency, email, phone);
 if (Boolean.TRUE.equals(directQrResult.get("success"))) {
 hostedResult.put("qrString", directQrResult.get("qrString"));
 hostedResult.put("qrImage", directQrResult.get("qrImage"));
 hostedResult.put("abapay_deeplink", directQrResult.get("abapay_deeplink"));
 }

 return ResponseEntity.ok(hostedResult);
 }

 /**
 * Fetches real-time transaction statement details from ABA PayWay.
 */
 @GetMapping("/transaction-detail/{tranId}")
 public ResponseEntity<Map<String, Object>> getTransactionDetail(@PathVariable String tranId) {
 Map<String, Object> details = paymentService.getTransactionDetail(tranId);
 return ResponseEntity.ok(details);
 }

 /**
 * Checks payment status directly with ABA PayWay server (KHQR auto-check).
 * Called by frontend polling loop to confirm payment before marking order complete.
 */
 @PostMapping("/check-transaction")
 public ResponseEntity<Map<String, Object>> checkTransaction(@RequestBody Map<String, Object> body) {
 String tranId = String.valueOf(body.getOrDefault("tran_id", ""));
 boolean confirmed = paymentService.checkAbaPayWayTransaction(tranId);
 Map<String, Object> res = new HashMap<>();
 res.put("confirmed", confirmed);
 res.put("tran_id", tranId);
 return ResponseEntity.ok(res);
 }

 /**
 * Convenience GET endpoint for frontend polling — checks ABA PayWay transaction status.
 * Usage: GET /api/payments/check-transaction/{tranId}
 */
 @GetMapping("/check-transaction/{tranId}")
 public ResponseEntity<Map<String, Object>> checkTransactionGet(@PathVariable String tranId) {
 boolean confirmed = paymentService.checkAbaPayWayTransaction(tranId);
 Map<String, Object> res = new HashMap<>();
 res.put("confirmed", confirmed);
 res.put("tran_id", tranId);
 return ResponseEntity.ok(res);
 }

 /**
 * Rich KHQR auto-payment status endpoint for the frontend polling loop.
 *
 * Returns BOTH the local order status (fast, from DB) AND the live ABA PayWay
 * check-transaction-2 result. The frontend uses this to:
 * 1. Detect payment confirmed via webhook push (orderStatus = COMPLETED in DB)
 * 2. Detect payment confirmed via polling (abaConfirmed = true from ABA server)
 *
 * Usage: GET /api/payments/khqr-status/{tranId}
 * tranId format: ORD-{orderId} e.g. ORD-174
 *
 * Response:
 * {
 * "tran_id": "ORD-174",
 * "orderId": 174,
 * "orderStatus": "COMPLETED" | "PENDING" | "CANCELLED" | null,
 * "abaConfirmed": true | false,
 * "paid": true if orderStatus=COMPLETED OR abaConfirmed=true
 * }
 */
 @GetMapping("/khqr-status/{tranId}")
 public ResponseEntity<Map<String, Object>> getKhqrStatus(@PathVariable String tranId) {
 Map<String, Object> res = new HashMap<>();
 res.put("tran_id", tranId);

 // 1. Check local DB first (fast path — webhook may have already completed it)
 Long orderId = parseOrderIdFromTranId(tranId);
 String orderStatus = null;
 if (orderId != null) {
 res.put("orderId", orderId);
 orderRepository.findById(orderId).ifPresent(order -> {
 res.put("orderStatus", order.getStatus() != null ? order.getStatus().name() : null);
 });
 orderStatus = (String) res.get("orderStatus");
 }

 boolean alreadyCompleted = "COMPLETED".equals(orderStatus);

 // 2. Only call ABA PayWay if not already completed (saves rate-limit quota)
 boolean abaConfirmed = false;
 if (!alreadyCompleted) {
 abaConfirmed = paymentService.checkAbaPayWayTransaction(tranId);
 // If ABA confirms payment, complete the order immediately
 if (abaConfirmed && orderId != null) {
 try {
 Map<String, Object> dummy = new HashMap<>();
 processPaymentConfirmed(orderId, "KHQR Auto-Poll", dummy);
 res.put("orderStatus", "COMPLETED");
 alreadyCompleted = true;
 } catch (Exception e) {
 log.warn("khqr-status: processPaymentConfirmed failed for orderId=[{}]: {}", orderId, e.getMessage());
 }
 }
 }

 res.put("abaConfirmed", abaConfirmed || alreadyCompleted);
 res.put("paid", alreadyCompleted || abaConfirmed);
 return ResponseEntity.ok(res);
 }

 // Webhook Push (Server-to-Server) 

 /**
 * ABA PayWay calls this endpoint after a payment is processed (server push).
 *
 * ABA PayWay sends:
 * tran_id – the transaction ID we sent during purchase
 * status – "0" = success
 * apv – approval code
 * payment_type – payment method used
 * req_time – request timestamp
 * hash – HMAC-SHA512(tran_id + status, api_key), Base64-encoded (no separator)
 *
 * We verify the hash before processing to prevent forgery.
 */
 @PostMapping("/payway-webhook")
 public ResponseEntity<Map<String, Object>> handlePayWayWebhook(
 @RequestBody Map<String, Object> payload) {

 log.info("ABA PayWay Webhook received: tran_id=[{}] status=[{}] apv=[{}] payment_type=[{}] req_time=[{}]",
 payload.get("tran_id"), payload.get("status"),
 payload.get("apv"), payload.get("payment_type"), payload.get("req_time"));
 Map<String, Object> response = new HashMap<>();

 try {
 String tranId = String.valueOf(payload.getOrDefault("tran_id", ""));
 String status = String.valueOf(payload.getOrDefault("status", ""));
 String receivedHash = String.valueOf(payload.getOrDefault("hash", ""));
 String apv = String.valueOf(payload.getOrDefault("apv", ""));
 String paymentType = String.valueOf(payload.getOrDefault("payment_type", ""));
 String reqTime = String.valueOf(payload.getOrDefault("req_time", ""));
 log.debug("Webhook details: apv=[{}] payment_type=[{}] req_time=[{}]", apv, paymentType, reqTime);

 if (tranId.isBlank()) {
 response.put("status", 1);
 response.put("description", "Missing tran_id");
 return ResponseEntity.badRequest().body(response);
 }

 // Verify HMAC-SHA512 hash to confirm payload authenticity
 if (!receivedHash.isBlank() && !paymentService.verifyWebhookHash(tranId, status, receivedHash)) {
 log.warn("ABA PayWay Webhook: invalid hash for tran_id=[{}] — rejecting", tranId);
 response.put("status", 1);
 response.put("description", "Hash verification failed");
 return ResponseEntity.status(403).body(response);
 }

 boolean isSuccess = "0".equals(status) || "00".equals(status)
 || "APPROVED".equalsIgnoreCase(status);

 if (!isSuccess) {
 log.warn("ABA PayWay Webhook: non-success status=[{}] for tran_id=[{}]", status, tranId);
 response.put("status", 0);
 response.put("description", "Webhook received — payment not successful");
 return ResponseEntity.ok(response);
 }

 // Parse orderId from tran_id (expected format: ORD-{orderId})
 Long orderId = parseOrderIdFromTranId(tranId);
 if (orderId == null) {
 log.warn("ABA PayWay Webhook: cannot parse orderId from tran_id=[{}]", tranId);
 response.put("status", 1);
 response.put("description", "Cannot parse order ID from tran_id: " + tranId);
 return ResponseEntity.badRequest().body(response);
 }

 return processPaymentConfirmed(orderId, "ABA PayWay Webhook", response);

 } catch (Exception e) {
 log.error("ABA PayWay Webhook processing error: {}", e.getMessage(), e);
 response.put("status", 1);
 response.put("description", "Internal error: " + e.getMessage());
 return ResponseEntity.internalServerError().body(response);
 }
 }

 // Return URL Callback (Browser Redirect) 

 /**
 * ABA PayWay redirects the customer browser here after checkout completes.
 *
 * ABA sends query params: tran_id, status, apv, payment_type, hash
 * We verify the hash, confirm the payment and redirect the user to the
 * order details page on the frontend.
 */
 @GetMapping("/payway-return")
 public ResponseEntity<Void> handlePayWayReturn(
 @RequestParam(required = false) String tran_id,
 @RequestParam(required = false) String status,
 @RequestParam(required = false) String hash) {

 log.info("ABA PayWay return callback: tran_id=[{}] status=[{}]", tran_id, status);

 try {
 String redirectUrl = baseUrl + "/orders";

 if (tran_id != null && !tran_id.isBlank()) {
 // Verify hash when present
 if (hash != null && !hash.isBlank()
 && !paymentService.verifyWebhookHash(tran_id, status != null ? status : "", hash)) {
 log.warn("ABA PayWay return: invalid hash for tran_id=[{}]", tran_id);
 return ResponseEntity.status(302)
 .header("Location", baseUrl + "/payment-cancel?reason=invalid_hash")
 .build();
 }

 boolean isSuccess = "0".equals(status) || "00".equals(status)
 || "APPROVED".equalsIgnoreCase(status);

 Long orderId = parseOrderIdFromTranId(tran_id);
 if (orderId != null) {
 if (isSuccess) {
 Map<String, Object> dummy = new HashMap<>();
 processPaymentConfirmed(orderId, "ABA PayWay Return URL", dummy);
 }
 redirectUrl = baseUrl + "/orders/" + orderId;
 } else if (isSuccess) {
 redirectUrl = baseUrl + "/payment-success";
 } else {
 redirectUrl = baseUrl + "/payment-cancel";
 }
 } else {
 redirectUrl = baseUrl + "/orders";
 }

 return ResponseEntity.status(302)
 .header("Location", redirectUrl)
 .build();

 } catch (Exception e) {
 log.error("ABA PayWay return callback error: {}", e.getMessage(), e);
 return ResponseEntity.status(302)
 .header("Location", baseUrl + "/orders")
 .build();
 }
 }

 // Shared Payment Confirmed Logic 

 /**
 * Marks an order as COMPLETED, assigns stock, credits sellers, and sends notifications.
 * Shared between the push webhook and the return URL callback.
 */
    private ResponseEntity<Map<String, Object>> processPaymentConfirmed(
            Long orderId, String source, Map<String, Object> response) {
        try {
            orderService.processPaymentConfirmed(orderId, source);
            response.put("status", 0);
            response.put("description", "Payment confirmed — order processed successfully");
            return ResponseEntity.ok(response);
        } catch (com.sabyshop.exception.ResourceNotFoundException e) {
            log.warn("{}: Order #{} not found", source, orderId);
            response.put("status", 1);
            response.put("description", "Order not found");
            return ResponseEntity.status(404).body(response);
        } catch (Exception e) {
            log.error("{}: Error processing payment confirmation for order #{}: {}", source, orderId, e.getMessage(), e);
            response.put("status", 1);
            response.put("description", "Error: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

 // Helpers 

 /**
 * Parses the orderId from a tran_id.
 *
 * Expected format: ORD-{orderId} e.g. "ORD-42"
 * Fallback: strip all non-numeric chars and parse as Long.
 */
 private Long parseOrderIdFromTranId(String tranId) {
 if (tranId == null || tranId.isBlank()) return null;
 try {
 // Standard format: ORD-{orderId}
 if (tranId.startsWith("ORD-")) {
 String idPart = tranId.substring(4);
 // Handle ORD-42-suffix variants safely
 if (idPart.contains("-")) idPart = idPart.split("-")[0];
 return Long.parseLong(idPart);
 }
 // Legacy ឬ unknown format — extract first numeric sequence
 String digits = tranId.replaceAll("[^0-9]", "");
 return digits.isEmpty() ? null : Long.parseLong(digits);
 } catch (NumberFormatException e) {
 log.warn("Cannot parse orderId from tran_id=[{}]: {}", tranId, e.getMessage());
 return null;
 }
 }
}
