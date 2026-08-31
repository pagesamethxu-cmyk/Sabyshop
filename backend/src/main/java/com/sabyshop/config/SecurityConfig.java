package com.sabyshop.config;

import com.sabyshop.ratelimit.RateLimitFilter;
import com.sabyshop.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableScheduling
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final RateLimitFilter rateLimitFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/auth/**", "/api/products/**", "/api/categories/**",
                        "/api/contact/**", "/h2-console/**").permitAll()
                // Payment callbacks, webhooks, QR generation & transaction verification
                .requestMatchers("/api/payments/my-payments").authenticated()
                .requestMatchers("/api/payments/**").permitAll()
                // Swagger / OpenAPI documentation UI
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**",
                        "/swagger-resources/**", "/webjars/**").permitAll()
                .requestMatchers("/api/admin/uploads/**", "/api/seller/uploads/**", "/api/uploads/**", "/uploads/**", "/api/chat/attachments/**").permitAll()
                .requestMatchers("/api/admin/upload").authenticated()
                .requestMatchers("/api/seller/upload").authenticated()
                // Reviews: GET public, POST/check require auth
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/reviews/**").permitAll()
                // Seller public store endpoints
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/seller/public/**").permitAll()
                // Store name availability check — public (no auth needed)
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/seller/check-store-name").permitAll()
                // Seller onboarding: apply + verify available to any authenticated user
                .requestMatchers("/api/seller/apply", "/api/seller/verify-subscription").authenticated()
                // Seller management: must be SELLER or ADMIN
                .requestMatchers("/api/seller/**").hasAnyRole("SELLER", "ADMIN")
                // Admin endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // Reviews POST requires auth
                .requestMatchers("/api/reviews/**").authenticated()
                .requestMatchers("/api/orders/**").authenticated()
                .anyRequest().authenticated()
            )
            .headers(headers -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::disable));

        http.addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("http://localhost:5173", "http://localhost:*", "*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setExposedHeaders(Arrays.asList("x-auth-token", "Authorization", "X-Device-Id", "X-Device-Name"));
        configuration.setAllowCredentials(false);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
