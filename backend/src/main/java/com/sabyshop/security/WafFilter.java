package com.sabyshop.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Web Application Firewall (WAF) Filter.
 *
 * Runs at Order(0) — the very first filter in the chain.
 * Blocks the following attack vectors before any Spring Security or business logic runs:
 *
 *   1. SQL Injection   – DROP, UNION SELECT, OR 1=1, comment sequences, etc.
 *   2. XSS             – <script>, javascript:, onerror=, eval(), etc.
 *   3. Path Traversal  – ../ and ..\
 *   4. Malicious Bots  – Common scanner User-Agent strings
 */
@Slf4j
@Component
@Order(0)
public class WafFilter extends OncePerRequestFilter {

    // ── SQL Injection patterns ────────────────────────────────────────────────
    private static final List<Pattern> SQL_PATTERNS = List.of(
        Pattern.compile("(union.*select|select.*from|insert.*into|delete.*from|drop.*table|alter.*table|create.*table|exec.*\\(|execute.*\\()", Pattern.CASE_INSENSITIVE),
        Pattern.compile("(or\\s+1\\s*=\\s*1|and\\s+1\\s*=\\s*1|or\\s+'[^']*'\\s*=\\s*'[^']*')", Pattern.CASE_INSENSITIVE),
        Pattern.compile("(sleep\\s*\\(|benchmark\\s*\\(|waitfor\\s+delay)", Pattern.CASE_INSENSITIVE),
        Pattern.compile("(/\\*.*\\*/)", Pattern.CASE_INSENSITIVE)
    );

    // ── XSS patterns ─────────────────────────────────────────────────────────
    private static final List<Pattern> XSS_PATTERNS = List.of(
        Pattern.compile("<script[^>]*>.*?</script>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL),
        Pattern.compile("<[^>]+\\s+on\\w+\\s*=", Pattern.CASE_INSENSITIVE),
        Pattern.compile("javascript\\s*:", Pattern.CASE_INSENSITIVE),
        Pattern.compile("vbscript\\s*:", Pattern.CASE_INSENSITIVE),
        Pattern.compile("eval\\s*\\(", Pattern.CASE_INSENSITIVE),
        Pattern.compile("expression\\s*\\(", Pattern.CASE_INSENSITIVE),
        Pattern.compile("<iframe", Pattern.CASE_INSENSITIVE),
        Pattern.compile("<object", Pattern.CASE_INSENSITIVE),
        Pattern.compile("<embed", Pattern.CASE_INSENSITIVE)
    );

    // ── Path Traversal patterns ───────────────────────────────────────────────
    private static final List<Pattern> PATH_TRAVERSAL_PATTERNS = List.of(
        Pattern.compile("(\\.\\./|\\.\\.\\\\ )", Pattern.CASE_INSENSITIVE),
        Pattern.compile("%2e%2e%2f|%2e%2e/|\\.%2e/|%2e\\./", Pattern.CASE_INSENSITIVE),
        Pattern.compile("/etc/passwd|/etc/shadow|/windows/system32", Pattern.CASE_INSENSITIVE)
    );

    // ── Malicious bot / scanner User-Agents ──────────────────────────────────
    private static final List<String> BAD_USER_AGENTS = List.of(
        "sqlmap", "nikto", "nmap", "masscan", "zgrab",
        "dirbuster", "gobuster", "wfuzz", "burpsuite",
        "acunetix", "nessus", "openvas", "qualysguard"
    );

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        // 1. Block malicious bots by User-Agent
        String userAgent = request.getHeader("User-Agent");
        if (isBadUserAgent(userAgent)) {
            log.warn("WAF blocked bad bot – ip={} ua={}", getClientIp(request), userAgent);
            sendForbidden(response, "Access denied.");
            return;
        }

        // 2. Inspect URI + query string
        String uri   = request.getRequestURI();
        String query = request.getQueryString();
        String target = (uri + (query != null ? "?" + query : "")).toLowerCase();

        if (containsPathTraversal(target)) {
            log.warn("WAF blocked path traversal – ip={} uri={}", getClientIp(request), uri);
            sendForbidden(response, "Access denied.");
            return;
        }
        if (containsSqlInjection(target)) {
            log.warn("WAF blocked SQL injection in URI – ip={} uri={}", getClientIp(request), uri);
            sendForbidden(response, "Access denied.");
            return;
        }
        if (containsXss(target)) {
            log.warn("WAF blocked XSS in URI – ip={} uri={}", getClientIp(request), uri);
            sendForbidden(response, "Access denied.");
            return;
        }

        // 3. Inspect headers (Authorization, custom headers can carry payloads)
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && containsSqlInjection(authHeader)) {
            log.warn("WAF blocked SQL injection in header – ip={}", getClientIp(request));
            sendForbidden(response, "Access denied.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    // ── Matchers ─────────────────────────────────────────────────────────────

    private boolean isBadUserAgent(String ua) {
        if (ua == null || ua.isBlank()) return false;
        String lower = ua.toLowerCase();
        return BAD_USER_AGENTS.stream().anyMatch(lower::contains);
    }

    private boolean containsSqlInjection(String input) {
        if (input == null) return false;
        return SQL_PATTERNS.stream().anyMatch(p -> p.matcher(input).find());
    }

    private boolean containsXss(String input) {
        if (input == null) return false;
        return XSS_PATTERNS.stream().anyMatch(p -> p.matcher(input).find());
    }

    private boolean containsPathTraversal(String input) {
        if (input == null) return false;
        return PATH_TRAVERSAL_PATTERNS.stream().anyMatch(p -> p.matcher(input).find());
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        String real = request.getHeader("X-Real-IP");
        if (real != null && !real.isBlank()) return real.trim();
        return request.getRemoteAddr();
    }

    private void sendForbidden(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(
            "{\"success\":false,\"message\":\"" + message + "\",\"data\":null}"
        );
    }
}
