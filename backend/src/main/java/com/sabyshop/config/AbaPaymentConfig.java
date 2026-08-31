package com.sabyshop.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * Spring configuration for ABA PayWay & ABA Bank API integration.
 */
@Configuration
public class AbaPaymentConfig {

    @Value("${aba.payway.connect-timeout:5000}")
    private int connectTimeout = 5000;

    @Value("${aba.payway.read-timeout:10000}")
    private int readTimeout = 10000;

    /**
     * Dedicated RestTemplate for ABA PayWay / Bank API calls with proper timeouts.
     */
    @Bean("abaRestTemplate")
    @Primary
    public RestTemplate abaRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeout);
        factory.setReadTimeout(readTimeout);
        return new RestTemplate(factory);
    }
}
