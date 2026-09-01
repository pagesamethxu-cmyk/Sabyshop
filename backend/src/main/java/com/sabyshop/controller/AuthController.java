package com.sabyshop.controller;

import com.sabyshop.dto.*;
import com.sabyshop.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /** Get logged-in user profile */
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileDto>> getProfile(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "Unauthorized", null));
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Profile retrieved", authService.getProfile(authentication.getName())));
    }

    /** Update logged-in user profile */
    @RequestMapping(value = "/profile", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<ApiResponse<UserProfileDto>> updateProfile(
            @RequestBody(required = false) UpdateUserProfileRequest request,
            Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "Unauthorized", null));
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Profile updated", authService.updateProfile(authentication.getName(), request)));
    }

    /** Step 1 – Send 8-digit OTP to email (does NOT create the account yet) */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<String>> register(@RequestBody RegisterRequest request) {
        String message = authService.register(request);
        return ResponseEntity.ok(new ApiResponse<>(true, message, message));
    }

    /** Step 2 – Verify OTP and create the account, returns JWT */
    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyEmail(
            @RequestBody VerifyEmailRequest request,
            @RequestHeader(value = "X-Device-Id", required = false) String deviceId,
            @RequestHeader(value = "X-Device-Name", required = false) String deviceName,
            @RequestHeader(value = "User-Agent", required = false) String userAgent,
            jakarta.servlet.http.HttpServletRequest servletRequest) {
        String ipAddress = servletRequest.getRemoteAddr();
        AuthResponse authResponse = authService.verifyEmail(request.getEmail(), request.getCode(), deviceId, deviceName, userAgent, ipAddress);
        return ResponseEntity.ok(new ApiResponse<>(true, "Email verified successfully", authResponse));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @RequestBody LoginRequest request,
            @RequestHeader(value = "X-Device-Id", required = false) String deviceId,
            @RequestHeader(value = "X-Device-Name", required = false) String deviceName,
            @RequestHeader(value = "User-Agent", required = false) String userAgent,
            jakarta.servlet.http.HttpServletRequest servletRequest) {
        String ipAddress = servletRequest.getRemoteAddr();
        return ResponseEntity.ok(new ApiResponse<>(true, "Login successful", authService.login(request, deviceId, deviceName, userAgent, ipAddress)));
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> googleLogin(
            @RequestBody GoogleLoginRequest request,
            @RequestHeader(value = "X-Device-Id", required = false) String deviceId,
            @RequestHeader(value = "X-Device-Name", required = false) String deviceName,
            @RequestHeader(value = "User-Agent", required = false) String userAgent,
            jakarta.servlet.http.HttpServletRequest servletRequest) {
        String ipAddress = servletRequest.getRemoteAddr();
        return ResponseEntity.ok(new ApiResponse<>(true, "Google login successful", authService.loginWithGoogle(request.getIdToken(), deviceId, deviceName, userAgent, ipAddress)));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        String msg = authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(new ApiResponse<>(true, msg, msg));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(@RequestBody ResetPasswordRequest request) {
        String msg = authService.resetPasswordWithOtp(request);
        return ResponseEntity.ok(new ApiResponse<>(true, msg, msg));
    }

    @PostMapping("/send-change-password-otp")
    public ResponseEntity<ApiResponse<String>> sendChangePasswordOtp(
            @RequestBody ChangePasswordOtpRequest request,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        String msg = authService.sendChangePasswordOtp(email, request.getCurrentPassword(), request.getNewPassword());
        return ResponseEntity.ok(new ApiResponse<>(true, msg, msg));
    }

    @PostMapping("/confirm-change-password")
    public ResponseEntity<ApiResponse<String>> confirmChangePassword(
            @RequestBody ConfirmChangePasswordRequest request,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        String msg = authService.confirmChangePasswordWithOtp(email, request.getCode());
        return ResponseEntity.ok(new ApiResponse<>(true, msg, msg));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        authService.logout(email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Logged out successfully", "Logout notification processed"));
    }
}
