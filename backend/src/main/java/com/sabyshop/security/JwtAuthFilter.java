package com.sabyshop.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

import com.sabyshop.repository.UserRepository;
import com.sabyshop.service.DeviceService;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final DeviceService deviceService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                String email = tokenProvider.getEmailFromToken(jwt);

                // Fetch up-to-date user role directly from DB to prevent stale JWT role issues (e.g., USER upgraded to SELLER)
                String role = userRepository.findByEmail(email)
                        .map(u -> u.getRole() != null ? u.getRole().name() : "USER")
                        .orElseGet(() -> tokenProvider.getRoleFromToken(jwt));
                
                // Get device ID from token or header
                String deviceId = tokenProvider.getDeviceIdFromToken(jwt);
                if (deviceId == null || deviceId.isBlank()) {
                    deviceId = request.getHeader("X-Device-Id");
                }

                // Check if device session has been REVOKED
                if (deviceId != null && deviceService.isDeviceRevoked(email, deviceId)) {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"success\":false,\"message\":\"Device session has been revoked\",\"data\":null}");
                    return;
                }

                String roleName = (role != null && role.startsWith("ROLE_")) ? role : "ROLE_" + (role != null ? role : "USER");

                SimpleGrantedAuthority authority = new SimpleGrantedAuthority(roleName);
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        email, null, Collections.singletonList(authority));
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception ex) {
            logger.error("Could not set user authentication in security context", ex);
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        // JWT via query parameter removed — use Authorization: Bearer header only
        return null;
    }
}
