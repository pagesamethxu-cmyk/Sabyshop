package com.sabyshop.ratelimit;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Servlet filter that enforces rate limits before any business logic runs.
 *
 * Evaluation order (first match wins):
 *   1. Auth endpoints   → strict per-IP limit (10 req/min)
 *   2. Upload endpoints → per-user upload limit (30 req/min)
 *   3. Order endpoints  → per-user order limit  (20 req/min)
 *   4. Authenticated    → per-user general limit (120 req/min)
 *   5. Everything       → global per-IP limit   (200 req/min)
 */
@Slf4j
@Component
@Order(1)               // Run very early in the filter chain
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimiterService rateLimiterService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        String ip   = resolveClientIp(request);
        String path = request.getRequestURI();

        // Bypass Swagger UI and OpenAPI documentation from rate limit checks
        if (path.startsWith("/swagger-ui") || path.startsWith("/v3/api-docs") || path.startsWith("/webjars") || path.equals("/swagger-ui.html")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            // 1. Global IP gate (applies to every request)
            rateLimiterService.checkGlobalIp(ip);

            // 2. Auth-specific strict limit
            if (isAuthPath(path)) {
                rateLimiterService.checkAuth(ip);
            } else {
                // Resolve authenticated principal (may be null for public routes)
                String principal = resolvePrincipal(ip);

                if (isUploadPath(path)) {
                    rateLimiterService.checkUpload(principal);
                } else if (isOrderPath(path)) {
                    rateLimiterService.checkOrder(principal);
                } else {
                    rateLimiterService.checkUser(principal);
                }
            }

            filterChain.doFilter(request, response);

        } catch (RateLimitException ex) {
            log.warn("Rate limit exceeded – ip={} path={} msg={}", ip, path, ex.getMessage());
            sendRateLimitResponse(response, ex);
        }
    }

    // ── Path helpers ─────────────────────────────────────────────────────────

    private boolean isAuthPath(String path) {
        return path.startsWith("/api/auth/");
    }

    private boolean isUploadPath(String path) {
        return path.contains("/upload");
    }

    private boolean isOrderPath(String path) {
        return path.startsWith("/api/orders/") || path.startsWith("/api/payment/");
    }

    // ── Client resolution ────────────────────────────────────────────────────

    /**
     * Extract the real client IP, respecting common reverse-proxy headers.
     */
    private String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            // Take the first (leftmost) address – this is the real client IP
            return xff.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Returns the authenticated user's name if available, otherwise falls back to the IP.
     * This prevents multiple users behind the same NAT from sharing one bucket.
     */
    private String resolvePrincipal(String ip) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getName() != null
                && !auth.getName().equals("anonymousUser")) {
            return "user:" + auth.getName();
        }
        return "ip:" + ip;
    }

    // ── Response helpers ─────────────────────────────────────────────────────

    private void sendRateLimitResponse(HttpServletResponse response, RateLimitException ex)
            throws IOException {
        response.setStatus(429);   // 429 Too Many Requests
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader("Retry-After", String.valueOf(ex.getRetryAfterSeconds()));
        response.setHeader("X-RateLimit-Reset", String.valueOf(ex.getRetryAfterSeconds()));
        response.getWriter().write(
            "{\"success\":false,\"message\":\"" + escapeJson(ex.getMessage()) + "\",\"data\":null}"
        );
    }

    /** Minimal JSON string escaping for the error message. */
    private String escapeJson(String s) {
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }
}
