package com.sabyshop.ratelimit;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.concurrent.TimeUnit;

/**
 * Distributed Rate Limiter backed by Redis.
 *
 * Uses an atomic Lua script so that INCR + EXPIRE are executed
 * as a single atomic operation — no race conditions across multiple servers.
 *
 * All 3 Spring Boot instances share the same Redis bucket per IP / user,
 * so the rate limit is truly global across the entire cluster.
 *
 * ┌──────────────────────────┬───────────┬────────┬──────────────────────────────┐
 * │ Policy                   │ Limit     │ Window │ Applies to                   │
 * ├──────────────────────────┼───────────┼────────┼──────────────────────────────┤
 * │ Global per-IP            │  60 req   │  60 s  │ Every request (first gate)   │
 * │ Auth per-IP (strict)     │   5 req   │  60 s  │ /api/auth/** (brute-force)   │
 * │ Order per-user           │  20 req   │  60 s  │ /api/orders /api/payment     │
 * │ Upload per-user          │  15 req   │  60 s  │ endpoints containing /upload │
 * │ General per-user/IP      │  80 req   │  60 s  │ All other endpoints          │
 * └──────────────────────────┴───────────┴────────┴──────────────────────────────┘
 *
 * Redis key format: "rl:{bucket}:{key}"
 * Example:          "rl:global_ip:192.168.1.1"
 *                   "rl:auth:192.168.1.1"
 *                   "rl:user:user:admin@example.com"
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RateLimiterService {

    private final RedisTemplate<String, Object> redisTemplate;

    // ── Limits ───────────────────────────────────────────────────────────────

    private static final int  GLOBAL_IP_MAX    = 600;
    private static final long GLOBAL_IP_WINDOW = 60L;

    private static final int  AUTH_MAX    = 20;
    private static final long AUTH_WINDOW = 60L;

    private static final int  ORDER_MAX    = 60;
    private static final long ORDER_WINDOW = 60L;

    private static final int  UPLOAD_MAX    = 40;
    private static final long UPLOAD_WINDOW = 60L;

    private static final int  USER_MAX    = 400;
    private static final long USER_WINDOW = 60L;

    /**
     * Lua script: atomically INCR the key, set EXPIRE on first increment.
     * Returns the new counter value after increment.
     *
     *  KEYS[1] = Redis key
     *  ARGV[1] = window in seconds (TTL)
     */
    private static final DefaultRedisScript<Long> RATE_LIMIT_SCRIPT;
    static {
        RATE_LIMIT_SCRIPT = new DefaultRedisScript<>();
        RATE_LIMIT_SCRIPT.setResultType(Long.class);
        RATE_LIMIT_SCRIPT.setScriptText(
            "local current = redis.call('INCR', KEYS[1])\n" +
            "if current == 1 then\n" +
            "  redis.call('EXPIRE', KEYS[1], ARGV[1])\n" +
            "end\n" +
            "return current"
        );
    }

    // ── Public API ───────────────────────────────────────────────────────────

    public void checkGlobalIp(String ip) {
        check("global_ip", ip, GLOBAL_IP_MAX, GLOBAL_IP_WINDOW,
              "Too many requests from your IP. Please slow down and try again in a moment.");
    }

    public void checkAuth(String ip) {
        check("auth", ip, AUTH_MAX, AUTH_WINDOW,
              "Too many authentication attempts. Please wait 1 minute before trying again.");
    }

    public void checkOrder(String userIdentifier) {
        check("order", userIdentifier, ORDER_MAX, ORDER_WINDOW,
              "Too many order requests. Please wait before placing another order.");
    }

    public void checkUpload(String userIdentifier) {
        check("upload", userIdentifier, UPLOAD_MAX, UPLOAD_WINDOW,
              "Upload rate limit reached. Please wait before uploading again.");
    }

    public void checkUser(String userIdentifier) {
        check("user", userIdentifier, USER_MAX, USER_WINDOW,
              "Request rate limit exceeded. Please slow down.");
    }

    // ── Internal ─────────────────────────────────────────────────────────────

    private void check(String bucket, String key, int max, long windowSeconds, String message) {
        String redisKey = "rl:" + bucket + ":" + key;
        try {
            Long count = redisTemplate.execute(
                RATE_LIMIT_SCRIPT,
                Collections.singletonList(redisKey),
                String.valueOf(windowSeconds)
            );
            if (count != null && count > max) {
                // Get remaining TTL for Retry-After header
                Long ttl = redisTemplate.getExpire(redisKey, TimeUnit.SECONDS);
                long retryAfter = (ttl != null && ttl > 0) ? ttl : windowSeconds;
                throw new RateLimitException(message, retryAfter);
            }
        } catch (RateLimitException e) {
            throw e;
        } catch (Exception e) {
            // If Redis is down, fail open (let request through) — availability > security
            log.warn("Redis rate limiter unavailable, failing open: {}", e.getMessage());
        }
    }
}
