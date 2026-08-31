package com.sabyshop.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(basePackages = "com.sabyshop.repository")
public class DatabaseConfig {
    /* Database configuration for com.sabyshop JPA repositories */
}
