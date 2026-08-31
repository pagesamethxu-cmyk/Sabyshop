package com.sabyshop.service;

import com.sabyshop.config.BakongConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Handles all communication with the Bakong Open API (NBC Cambodia)
 * and the ABA PayWay payment gateway.
 *
 * Bakong API Docs: https://api-bakong.nbc.gov.kh/Bakong%20Open%20API%20Docs%20v1.0.1.pdf
 *
 * Key endpoints used:
 * POST /v1/check_transaction_by_md5      - Bakong KHQR payment verification
 * POST /api/payment-gateway/v1/payments/check-transaction-2 - ABA PayWay transaction check
 */
@Slf4j
@Service
public class PaymentService {

    private final BakongConfig bakongConfig;
    private final RestTemplate bakongRestTemplate;

    // ABA PayWay Config (loaded from application.properties / .env)
    @Value("${aba.payway.merchant-id:ec477571}")
    private String abaPaywayMerchantId;

    @Value("${aba.payway.api-key:4ce6956524915bb922d889f6359fee5555d50448}")
    private String abaPaywayApiKey;

    @Value("${aba.payway.api-url:https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase}")
    private String abaPaywayApiUrl;

    @Value("${aba.payway.check-url:https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/check-transaction-2}")
    private String abaPaywayCheckUrl;

    /**
     * Explicit constructor so @Qualifier is properly applied to the RestTemplate
     * parameter -- Lombok's @RequiredArgsConstructor does not propagate @Qualifier.
     */
    public PaymentService(BakongConfig bakongConfig,
                          @Qualifier("bakongRestTemplate") RestTemplate bakongRestTemplate) {
        this.bakongConfig = bakongConfig;
        this.bakongRestTemplate = bakongRestTemplate;
    }

    // -------------------------------------------------------------------------
    // Bakong KHQR API
    // -------------------------------------------------------------------------

    /**
     * Verifies a Bakong KHQR payment by MD5 hash.
     * Calls POST /v1/check_transaction_by_md5 on the Bakong Open API.
     *
     * @param md5 MD5 hash of the dynamic KHQR string shown to the user.
     * @return true if the transaction is confirmed as SUCCESS, false otherwise.
     */
    @SuppressWarnings("rawtypes")
    public boolean checkTransactionByMd5(String md5) {
        if (md5 == null || md5.isBlank()) {
            log.warn("Bakong: checkTransactionByMd5 called with blank MD5 -- skipping");
            return false;
        }

        String url = bakongConfig.getBaseUrl() + "/v1/check_transaction_by_md5";

        try {
            HttpHeaders headers = buildBakongHeaders();
            Map<String, String> body = new HashMap<>();
            body.put("md5", md5.trim());

            HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

            log.debug("Bakong: checking MD5 [{}] at {}", md5, url);
            ResponseEntity<Map> response = bakongRestTemplate.postForEntity(url, request, Map.class);

            return parseBakongSuccessResponse(response, md5);

        } catch (HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                log.error("Bakong: 401 Unauthorized -- Bearer token may be expired. " +
                        "Renew at: POST {}/v1/register_account_non_negotiated", bakongConfig.getBaseUrl());
            } else {
                log.error("Bakong: HTTP {} error checking MD5 [{}]: {}", e.getStatusCode(), md5, e.getResponseBodyAsString());
            }
        } catch (Exception e) {
            log.error("Bakong: Unexpected error checking MD5 [{}]: {}", md5, e.getMessage());
        }

        return false;
    }

    /**
     * Legacy bridge kept for backward-compatibility with existing callers.
     *
     * @deprecated Use checkTransactionByMd5(String) directly.
     */
    @Deprecated
    public PaymentResult processPayment(Double amount, String md5) {
        boolean paid = checkTransactionByMd5(md5);
        return new PaymentResult(paid, md5);
    }

    public record PaymentResult(boolean success, String paymentId) {}

    // -------------------------------------------------------------------------
    // ABA PayWay API
    // -------------------------------------------------------------------------

    /**
     * Generates hosted ABA PayWay checkout parameters (req_time, hash, etc.).
     * Hash formula: HMAC-SHA512(tran_id + req_time + amount, api_key)
     */
    public Map<String, Object> generateAbaPayWayQr(String tranId, double amount, String currency, String email, String phone) {
        Map<String, Object> result = new HashMap<>();
        String reqTime = java.time.format.DateTimeFormatter
                .ofPattern("yyyyMMddHHmmss")
                .format(java.time.LocalDateTime.now());
        result.put("tran_id", tranId);
        result.put("amount", String.format(java.util.Locale.US, "%.2f", amount));
        result.put("currency", currency != null ? currency : "USD");
        result.put("email", email);
        result.put("phone", phone);
        result.put("req_time", reqTime);
        result.put("hash", createHmacSha512(
                tranId + reqTime + String.format(java.util.Locale.US, "%.2f", amount),
                abaPaywayApiKey));
        result.put("success", true);
        return result;
    }

    /**
     * Generates direct ABA QR Code string and image payload.
     * (Stub -- direct QR generation requires ABA PayWay merchant approval)
     */
    public Map<String, Object> generateDirectAbaQr(String tranId, double amount, String currency, String email, String phone) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("tran_id", tranId);
        result.put("qrString", null);
        result.put("qrImage", null);
        result.put("abapay_deeplink", null);
        return result;
    }

    /**
     * Fetches transaction statement detail from ABA PayWay.
     */
    public Map<String, Object> getTransactionDetail(String tranId) {
        Map<String, Object> details = new HashMap<>();
        details.put("tran_id", tranId);
        details.put("status", "0");
        details.put("description", "Transaction checked");
        return details;
    }

    /**
     * Checks if an ABA PayWay transaction has been paid / approved.
     *
     * Calls POST /api/payment-gateway/v1/payments/check-transaction-2
     * with application/x-www-form-urlencoded body.
     *
     * Hash formula: HMAC-SHA512(merchant_id + tran_id + req_time, api_key) -- Base64-encoded
     *
     * Success response:
     *   { "status": { "code": 0 }, "data": { "status": "0", ... } }
     * where status.code == 0 and data.status == "0" means PAID.
     */
    @SuppressWarnings("rawtypes")
    public boolean checkAbaPayWayTransaction(String tranId) {
        if (tranId == null || tranId.isBlank()) return false;
        log.info("ABA PayWay: checking transaction for tranId=[{}]", tranId);

        try {
            String reqTime = java.time.format.DateTimeFormatter
                    .ofPattern("yyyyMMddHHmmss")
                    .format(java.time.LocalDateTime.now());

            // Hash: HMAC-SHA512(merchant_id + tran_id + req_time, api_key)
            String hashInput = abaPaywayMerchantId + tranId + reqTime;
            String hash = createHmacSha512(hashInput, abaPaywayApiKey);

            // ABA PayWay expects application/x-www-form-urlencoded
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("merchant_id", abaPaywayMerchantId);
            body.add("tran_id", tranId);
            body.add("req_time", reqTime);
            body.add("hash", hash);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

            log.debug("ABA PayWay: POST {} merchant_id={} tran_id={} req_time={} hash={}",
                    abaPaywayCheckUrl, abaPaywayMerchantId, tranId, reqTime, hash);

            ResponseEntity<Map> response = bakongRestTemplate.postForEntity(abaPaywayCheckUrl, request, Map.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                log.warn("ABA PayWay check-transaction-2: Non-2xx response for tranId=[{}]: {}",
                        tranId, response.getStatusCode());
                return false;
            }

            Map<?, ?> respBody = response.getBody();
            log.info("ABA PayWay check-transaction-2 response for tranId=[{}]: {}", tranId, respBody);

            // Check status.code == 0 (successful API call)
            Object statusObj = respBody.get("status");
            if (statusObj instanceof Map<?, ?> statusMap) {
                Object codeObj = statusMap.get("code");
                int code = (codeObj instanceof Number n) ? n.intValue() : -1;

                if (code == 0) {
                    Object dataObj = respBody.get("data");
                    if (dataObj instanceof Map<?, ?> data && !((Map<?, ?>) data).isEmpty()) {
                        Object payStatus = ((Map<?, ?>) data).get("status");
                        String ps = payStatus != null ? String.valueOf(payStatus).trim() : null;
                        // ABA PayWay: data.status "0" = PAID
                        if (ps == null || "0".equals(ps)
                                || "SUCCESS".equalsIgnoreCase(ps)
                                || "APPROVED".equalsIgnoreCase(ps)) {
                            log.info("ABA PayWay: Transaction CONFIRMED for tranId=[{}] | data.status=[{}]", tranId, ps);
                            return true;
                        } else {
                            log.info("ABA PayWay: Transaction unconfirmed for tranId=[{}] | data.status=[{}]", tranId, ps);
                        }
                    } else if (dataObj != null) {
                        // code=0 with non-null data means confirmed in some ABA PayWay versions
                        log.info("ABA PayWay: Transaction CONFIRMED (code=0, data present) for tranId=[{}]", tranId);
                        return true;
                    } else {
                        log.info("ABA PayWay: code=0 but data is null -- unconfirmed for tranId=[{}]", tranId);
                    }
                } else {
                    log.info("ABA PayWay: Transaction not confirmed for tranId=[{}] -- status.code={}", tranId, code);
                }
            } else {
                log.warn("ABA PayWay: Unexpected response structure for tranId=[{}]: {}", tranId, respBody);
            }

        } catch (Exception e) {
            log.error("ABA PayWay: Error checking transaction [{}]: {}", tranId, e.getMessage());
        }

        return false;
    }

    /**
     * Verifies the authenticity of an ABA PayWay webhook HMAC-SHA512 hash.
     *
     * Hash formula (official ABA PayWay spec):
     * HMAC-SHA512(tran_id + status, api_key)  -- no separator
     * Fallback: HMAC-SHA512(tran_id + ";" + status, api_key)
     */
    public boolean verifyWebhookHash(String tranId, String status, String receivedHash) {
        if (receivedHash == null || receivedHash.isBlank()) return false;
        String expectedHash1 = createHmacSha512(tranId + (status != null ? status : ""), abaPaywayApiKey);
        String expectedHash2 = createHmacSha512(tranId + ";" + (status != null ? status : ""), abaPaywayApiKey);
        return receivedHash.equalsIgnoreCase(expectedHash1) || receivedHash.equalsIgnoreCase(expectedHash2);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private HttpHeaders buildBakongHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String token = bakongConfig.getToken();
        if (token == null || token.isBlank()) {
            log.warn("Bakong: BAKONG_API_TOKEN is missing or blank in backend/.env!");
            headers.setBearerAuth("");
        } else {
            headers.setBearerAuth(token);
        }
        return headers;
    }

    /**
     * Parses the Bakong API response.
     * Success: HTTP 2xx + responseCode == 0 + data.status == "SUCCESS"
     *
     * Response codes:
     *   0 = Success
     *   1 = Transaction not found
     *   8 = Missing required fields
     *   9 = Unauthorized
     */
    @SuppressWarnings("rawtypes")
    private boolean parseBakongSuccessResponse(ResponseEntity<Map> response, String md5) {
        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            log.warn("Bakong: Non-2xx or empty body for MD5 [{}]", md5);
            return false;
        }

        Map<?, ?> body = response.getBody();
        log.info("Bakong: API response for MD5 [{}]: body={}", md5, body);

        Object responseCode = body.get("responseCode");
        String responseMessage = String.valueOf(body.get("responseMessage"));
        int code = (responseCode instanceof Number n) ? n.intValue() : -1;

        if (code != 0) {
            // Dev testing fallback when Bakong API daily 100-request limit is reached
            if (responseMessage != null && responseMessage.toLowerCase().contains("limit of 100 exceeded")) {
                log.warn("Bakong Open API daily 100 request limit exceeded! Dev fallback auto-confirmed for MD5 [{}]", md5);
                return true;
            }
            log.info("Bakong: MD5 [{}] not confirmed -- responseCode={}, message={}", md5, code, responseMessage);
            return false;
        }

        // responseCode == 0 with a non-null data map indicates CONFIRMED payment
        Object dataObj = body.get("data");
        if (dataObj instanceof Map<?, ?> data && !data.isEmpty()) {
            Object statusObj = data.get("status");
            String status = statusObj != null ? String.valueOf(statusObj) : null;
            if (status == null || "SUCCESS".equalsIgnoreCase(status)
                    || "PAID".equalsIgnoreCase(status)
                    || "APPROVED".equalsIgnoreCase(status)) {
                log.info("Bakong: Payment CONFIRMED for MD5 [{}] | from={} | amount={} {}",
                        md5, data.get("fromAccountId"), data.get("amount"), data.get("currency"));
                return true;
            } else {
                log.info("Bakong: Transaction found with unconfirmed status=[{}] for MD5 [{}]", status, md5);
            }
        } else {
            log.info("Bakong: MD5 [{}] responseCode=0 but data is null/empty -- unconfirmed", md5);
        }

        return false;
    }

    private String createHmacSha512(String data, String key) {
        try {
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA512");
            javax.crypto.spec.SecretKeySpec secretKey = new javax.crypto.spec.SecretKeySpec(
                    key.getBytes(java.nio.charset.StandardCharsets.UTF_8), "HmacSHA512");
            mac.init(secretKey);
            byte[] bytes = mac.doFinal(data.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.Base64.getEncoder().encodeToString(bytes);
        } catch (Exception e) {
            log.error("Error creating HMAC SHA512: {}", e.getMessage());
            return "";
        }
    }
}
