package com.sabyshop.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * Spring configuration for the Bakong Open API integration.
 *
 * Token lifecycle: 90 days. Renew via:
 *   POST https://api-bakong.nbc.gov.kh/v1/register_account_non_negotiated
 *   Body: { "userId": "<your_bakong_user_id>" }
 *
 * All configurable values live in application.properties under the "bakong.api.*" namespace.
 */
@Configuration
public class BakongConfig {

    /** Bakong API base URL (SIT or Production). */
    @Value("${bakong.api.base-url}")
    private String baseUrl;

    /** Bearer token issued by Bakong Open API. Expires every 90 days. */
    @Value("${bakong.api.token}")
    private String token;

    /** HTTP connect timeout in milliseconds. */
    @Value("${bakong.api.connect-timeout:5000}")
    private int connectTimeout;

    /** HTTP read timeout in milliseconds. */
    @Value("${bakong.api.read-timeout:10000}")
    private int readTimeout;

    public String getBaseUrl() { return baseUrl; }
    public String getToken()   { return token; }

    /**
     * A dedicated RestTemplate for Bakong API calls with proper timeouts.
     * Qualitified with "bakongRestTemplate" to avoid conflicts with other beans.
     */
    @Bean("bakongRestTemplate")
    public RestTemplate bakongRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeout);
        factory.setReadTimeout(readTimeout);
        return new RestTemplate(factory);
    }
}
