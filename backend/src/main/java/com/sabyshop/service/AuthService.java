package com.sabyshop.service;

import com.sabyshop.dto.*;
import com.sabyshop.exception.BadRequestException;
import com.sabyshop.exception.ResourceNotFoundException;
import com.sabyshop.model.Role;
import com.sabyshop.model.User;
import com.sabyshop.repository.SellerProfileRepository;
import com.sabyshop.repository.UserRepository;
import com.sabyshop.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.internet.MimeMessage;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final RestTemplate restTemplate;

    // ─── In-memory OTP store ──────────────────────────────────────────────────
    private static class PendingRegistration {
        final String email;
        final String name;
        final String hashedPassword;
        final String code;
        final LocalDateTime expiresAt;

        PendingRegistration(String email, String name, String hashedPassword,
                            String code, LocalDateTime expiresAt) {
            this.email          = email;
            this.name           = name;
            this.hashedPassword = hashedPassword;
            this.code           = code;
            this.expiresAt      = expiresAt;
        }
    }

    @SuppressWarnings("unused")
    private static class PendingResetOtp {
        final String email;
        final String code;
        final LocalDateTime expiresAt;

        PendingResetOtp(String email, String code, LocalDateTime expiresAt) {
            this.email     = email;
            this.code      = code;
            this.expiresAt = expiresAt;
        }
    }

    @SuppressWarnings("unused")
    private static class PendingChangePasswordOtp {
        final String email;
        final String hashedNewPassword;
        final String code;
        final LocalDateTime expiresAt;

        PendingChangePasswordOtp(String email, String hashedNewPassword, String code, LocalDateTime expiresAt) {
            this.email             = email;
            this.hashedNewPassword = hashedNewPassword;
            this.code              = code;
            this.expiresAt         = expiresAt;
        }
    }

    private final Map<String, PendingRegistration> pendingRegistrations = new ConcurrentHashMap<>();
    private final Map<String, PendingResetOtp> pendingResetOtps = new ConcurrentHashMap<>();
    private final Map<String, PendingChangePasswordOtp> pendingChangePasswordOtps = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${google.client.id:}")
    private String googleClientId;

    @Value("${resend.api.key:}")
    private String resendApiKey;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:korbsameth.dev@gmail.com}")
    private String mailFrom;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    private final DeviceService deviceService;

    public AuthService(UserRepository userRepository,
                       SellerProfileRepository sellerProfileRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider,
                       DeviceService deviceService) {
        this.userRepository = userRepository;
        this.sellerProfileRepository = sellerProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.deviceService = deviceService;
        this.restTemplate = new RestTemplate();
    }

    private void syncSellerRoleIfActive(User user) {
        if (user != null && user.getRole() == Role.CUSTOMER && sellerProfileRepository != null) {
            sellerProfileRepository.findByUserId(user.getId()).ifPresent(sp -> {
                if (sp.getSubscriptionStatus() == com.sabyshop.model.SellerProfile.SubscriptionStatus.ACTIVE) {
                    user.setRole(Role.SELLER);
                    userRepository.save(user);
                }
            });
        }
    }

    // ─── Google Login ─────────────────────────────────────────────────────────
    public AuthResponse loginWithGoogle(String idToken) {
        return loginWithGoogle(idToken, null, null, null, null);
    }

    public AuthResponse loginWithGoogle(String idToken, String deviceId, String deviceName, String userAgent, String ipAddress) {
        GoogleUserInfoDto googleUser = null;
        if (idToken == null || idToken.isBlank()) {
            throw new BadRequestException("Google auth token is required");
        }

        String cleanToken = idToken.trim();
        boolean isJwt = cleanToken.startsWith("eyJ") && cleanToken.split("\\.").length == 3;

        // Method 1: Try Google endpoints
        try {
            if (isJwt) {
                try {
                    String verificationUrl = "https://oauth2.googleapis.com/tokeninfo?id_token=" + cleanToken;
                    googleUser = restTemplate.getForObject(verificationUrl, GoogleUserInfoDto.class);
                } catch (Exception e) {
                    System.err.println("[Google Auth Warning] tokeninfo?id_token failed, trying userinfo with Bearer header: " + e.getMessage());
                }
            }

            if (googleUser == null) {
                // Try userinfo endpoint with Bearer header (works for OAuth2 Access Tokens & ID Tokens)
                try {
                    HttpHeaders headers = new HttpHeaders();
                    headers.setBearerAuth(cleanToken);
                    HttpEntity<Void> entity = new HttpEntity<>(headers);
                    ResponseEntity<GoogleUserInfoDto> response = restTemplate.exchange(
                            "https://www.googleapis.com/oauth2/v3/userinfo",
                            HttpMethod.GET,
                            entity,
                            GoogleUserInfoDto.class
                    );
                    googleUser = response.getBody();
                } catch (Exception e) {
                    System.err.println("[Google Auth Warning] userinfo Bearer request failed: " + e.getMessage());
                }
            }

            if (googleUser == null) {
                try {
                    String tokenInfoUrl = "https://oauth2.googleapis.com/tokeninfo?access_token=" + cleanToken;
                    googleUser = restTemplate.getForObject(tokenInfoUrl, GoogleUserInfoDto.class);
                } catch (Exception e) {
                    System.err.println("[Google Auth Warning] tokeninfo?access_token failed: " + e.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("[Google Auth Error] Google API verification failed: " + e.getMessage());
        }

        // Method 2 (local JWT decode without signature verification) has been removed — security risk.
        // If Google API calls fail above, the login must fail rather than fall back to unverified local decode.

        if (googleUser == null || googleUser.getEmail() == null || googleUser.getEmail().isBlank()) {
            throw new BadRequestException("Failed to verify Google account authentication. Please try again.");
        }

        if (googleClientId != null && !googleClientId.trim().isEmpty() && googleUser.getAud() != null && !googleClientId.equals(googleUser.getAud())) {
            throw new BadRequestException("Google token was not issued for this application. Login rejected.");
        }

        String email = googleUser.getEmail().trim().toLowerCase();
        String name = googleUser.getName() != null && !googleUser.getName().isBlank() ? googleUser.getName() : email.split("@")[0];
        String picture = googleUser.getPicture();

        boolean[] isNewUser = new boolean[]{false};
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            isNewUser[0] = true;
            User newUser = User.builder()
                    .email(email)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .name(name)
                    .avatarUrl(picture)
                    .role(Role.CUSTOMER)
                    .createdAt(LocalDateTime.now())
                    .build();
            User saved = userRepository.save(newUser);
            sendRegisterEmailAsync(saved.getEmail(), saved.getName());
            return saved;
        });

        if (!isNewUser[0]) {
            if (picture != null && !picture.isBlank() && (user.getAvatarUrl() == null || user.getAvatarUrl().isBlank())) {
                user.setAvatarUrl(picture);
                userRepository.save(user);
            }
            sendLoginEmailAsync(user.getEmail(), user.getName());
        }

        syncSellerRoleIfActive(user);

        if (deviceService != null) {
            try {
                deviceService.registerDevice(user, deviceId, deviceName, userAgent, ipAddress, true);
            } catch (Exception e) {
                System.err.println("[Device Service Warning] Failed to register device on Google login: " + e.getMessage());
            }
        }

        String token = tokenProvider.generateToken(user.getEmail(), user.getRole().name(), deviceId);
        return new AuthResponse(token, user.getEmail(), user.getName(), user.getRole().name(), user.getAvatarUrl(), Boolean.TRUE.equals(user.getHasUsedFreeTrial()));
    }

    // ─── Step 1: Send OTP to email ────────────────────────────────────────────
    public String register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new BadRequestException("Email is already taken");
        }

        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new BadRequestException("Email is required");
        }
        if (!request.getEmail().trim().matches("^[\\w.+\\-]+@[\\w\\-]+\\.[a-zA-Z]{2,}$")) {
            throw new BadRequestException("Invalid email format");
        }

        // Generate 6-digit code with leading-zero support
        int raw = secureRandom.nextInt(1_000_000);
        String code = String.format("%06d", raw);

        String hashedPassword = passwordEncoder.encode(request.getPassword());
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(2);

        // Store (or overwrite) pending registration — supports "resend" flow
        pendingRegistrations.put(
            request.getEmail(),
            new PendingRegistration(request.getEmail(), request.getName(), hashedPassword, code, expiresAt)
        );

        sendVerificationEmailAsync(request.getEmail(), request.getName(), code);
        return "Verification code sent to your email";
    }

    // ─── Step 2: Verify OTP and create account ────────────────────────────────
    public AuthResponse verifyEmail(String email, String code) {
        return verifyEmail(email, code, null, null, null, null);
    }

    public AuthResponse verifyEmail(String email, String code, String deviceId, String deviceName, String userAgent, String ipAddress) {
        PendingRegistration pending = pendingRegistrations.get(email);

        if (pending == null) {
            throw new BadRequestException("No pending registration found. Please register again.");
        }

        if (LocalDateTime.now().isAfter(pending.expiresAt)) {
            pendingRegistrations.remove(email);
            throw new BadRequestException("Verification code has expired. Please register again.");
        }

        if (!pending.code.equals(code)) {
            throw new BadRequestException("Invalid verification code. Please try again.");
        }

        // Double-check the email wasn't taken during the OTP window
        if (userRepository.findByEmail(email).isPresent()) {
            pendingRegistrations.remove(email);
            throw new BadRequestException("Email is already taken");
        }

        User user = User.builder()
                .email(pending.email)
                .password(pending.hashedPassword)
                .name(pending.name)
                .role(Role.CUSTOMER)
                .createdAt(LocalDateTime.now())
                .build();

        userRepository.save(user);
        pendingRegistrations.remove(email);

        sendRegisterEmailAsync(user.getEmail(), user.getName());

        if (deviceService != null) {
            deviceService.registerDevice(user, deviceId, deviceName, userAgent, ipAddress, true);
        }

        String token = tokenProvider.generateToken(user.getEmail(), user.getRole().name(), deviceId);
        return new AuthResponse(token, user.getEmail(), user.getName(), user.getRole().name(), user.getAvatarUrl(), Boolean.TRUE.equals(user.getHasUsedFreeTrial()));
    }

    // ─── Login ────────────────────────────────────────────────────────────────
    public AuthResponse login(LoginRequest request) {
        return login(request, null, null, null, null);
    }

    public AuthResponse login(LoginRequest request, String deviceId, String deviceName, String userAgent, String ipAddress) {
        if (request == null || request.getEmail() == null || request.getEmail().isBlank()
                || request.getPassword() == null || request.getPassword().isBlank()) {
            throw new BadRequestException("Please enter both email and password / សូមបញ្ចូលអ៊ីមែល និងពាក្យសម្ងាត់");
        }

        String rawEmail = request.getEmail().trim();
        String normalizedEmail = rawEmail.toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail)
                .or(() -> userRepository.findByEmail(rawEmail))
                .orElseThrow(() -> new BadRequestException("Wrong email. No account found with this email / អ៊ីមែលមិនត្រឹមត្រូវទេ (មិនមានគណនីនេះទេ)"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadRequestException("Wrong password. Please try again / ពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ");
        }

        sendLoginEmailAsync(user.getEmail(), user.getName());
        syncSellerRoleIfActive(user);

        if (deviceService != null) {
            try {
                deviceService.registerDevice(user, deviceId, deviceName, userAgent, ipAddress, true);
            } catch (Exception e) {
                System.err.println("[Device Service Warning] Failed to register device on login: " + e.getMessage());
            }
        }

        String token = tokenProvider.generateToken(user.getEmail(), user.getRole().name(), deviceId);
        return new AuthResponse(token, user.getEmail(), user.getName(), user.getRole().name(), user.getAvatarUrl(), Boolean.TRUE.equals(user.getHasUsedFreeTrial()));
    }

    // ─── Logout ───────────────────────────────────────────────────────────────
    public void logout(String email) {
        if (email != null && !email.isEmpty()) {
            userRepository.findByEmail(email).ifPresent(user -> {
                sendLogoutEmailAsync(user.getEmail(), user.getName());
            });
        }
    }

    // ─── Forgot Password: Send OTP to Email ──────────────────────────────────
    public String forgotPassword(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new BadRequestException("Email is required");
        }

        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new BadRequestException("No account found with this email address"));

        // Generate 6-digit OTP code
        int raw = secureRandom.nextInt(1_000_000);
        String code = String.format("%06d", raw);
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(5);

        pendingResetOtps.put(user.getEmail(), new PendingResetOtp(user.getEmail(), code, expiresAt));

        sendForgotPasswordOtpEmailAsync(user.getEmail(), user.getName(), code);
        return "OTP code has been sent to your email";
    }

    // ─── Reset Password with OTP Code ─────────────────────────────────────────
    public String resetPasswordWithOtp(ResetPasswordRequest request) {
        if (request.getEmail() == null || request.getCode() == null || request.getNewPassword() == null) {
            throw new BadRequestException("Email, OTP code, and new password are required");
        }

        if (request.getNewPassword().length() < 6) {
            throw new BadRequestException("New password must be at least 6 characters long");
        }

        String email = request.getEmail().trim().toLowerCase();
        PendingResetOtp pending = pendingResetOtps.get(email);

        if (pending == null) {
            throw new BadRequestException("No reset OTP request found. Please request a new code.");
        }

        if (LocalDateTime.now().isAfter(pending.expiresAt)) {
            pendingResetOtps.remove(email);
            throw new BadRequestException("OTP code has expired. Please request a new code.");
        }

        if (!pending.code.equals(request.getCode().trim())) {
            throw new BadRequestException("Invalid OTP code. Please check your email and try again.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        pendingResetOtps.remove(email);
        return "Password reset successfully! You can now log in with your new password.";
    }

    private void sendForgotPasswordOtpEmailAsync(String toEmail, String userName, String code) {
        sendEmailHelper(
            toEmail,
            "[Saby Shop] លេខកូដកំណត់ពាក្យសម្ងាត់ឡើងវិញ / Password Reset OTP Code",
            String.format(
                "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 12px; color: #1f2937;\">" +
                "<div style=\"text-align: center; margin-bottom: 20px;\">" +
                "<h1 style=\"color: #ff4785; margin: 0;\">Saby Shop</h1>" +
                "<h3 style=\"color: #111827; margin-top: 6px;\">កំណត់ពាក្យសម្ងាត់ឡើងវិញ / Reset Password OTP</h3>" +
                "</div>" +
                "<p style=\"font-size: 1rem;\">សួស្តី <strong>%s</strong>,</p>" +
                "<p>សូមប្រើលេខកូដ OTP <strong>4 ខ្ទង់</strong> ខាងក្រោម ដើម្បីកំណត់ពាក្យសម្ងាត់គណនី Saby Shop ឡើងវិញ:</p>" +
                "<div style=\"text-align: center; margin: 30px 0;\">" +
                "<div style=\"display: inline-block; background: linear-gradient(135deg, #ff4785, #8b5cf6); color: white; font-size: 3rem; font-weight: 900; letter-spacing: 14px; padding: 22px 40px; border-radius: 12px; font-family: 'Courier New', monospace;\">%s</div>" +
                "</div>" +
                "<div style=\"background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0;\">" +
                "<p style=\"margin: 0; font-size: 0.9rem; color: #92400e;\"><strong>លេខកូដនេះផុតកំណត់ក្នុង 5 នាទី</strong><br>This code expires in 5 minutes.</p>" +
                "</div>" +
                "<p style=\"font-size: 0.88rem; color: #4b5563;\">ប្រសិនបើអ្នកមិនបានស្នើសុំកំណត់ពាក្យសម្ងាត់ទេ សូមមិនខ្វល់ (If you didn't request a password reset, please ignore this email).</p>" +
                "<p style=\"margin-top: 30px; font-size: 0.85rem; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px;\">Saby Shop — Safe &amp; Fast Digital Store</p>" +
                "</div>",
                userName != null ? userName : "អតិថិជន",
                code
            )
        );
    }

    // ─── Change Password Step 1: Verify current password & send OTP ─────────────
    public String sendChangePasswordOtp(String email, String currentPassword, String newPassword) {
        if (email == null || email.trim().isEmpty()) {
            throw new BadRequestException("Email is required");
        }
        if (currentPassword == null || currentPassword.trim().isEmpty()) {
            throw new BadRequestException("Current password is required");
        }
        if (newPassword == null || newPassword.length() < 6) {
            throw new BadRequestException("New password must be at least 6 characters long");
        }

        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new BadRequestException("Current password is incorrect / ពាក្យសម្ងាត់បច្ចុប្បន្នមិនត្រឹមត្រូវទេ");
        }

        String hashedNewPassword = passwordEncoder.encode(newPassword);
        int raw = secureRandom.nextInt(1_000_000);
        String code = String.format("%06d", raw);
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(5);

        pendingChangePasswordOtps.put(user.getEmail(), new PendingChangePasswordOtp(user.getEmail(), hashedNewPassword, code, expiresAt));

        sendChangePasswordOtpEmailAsync(user.getEmail(), user.getName(), code);
        return "OTP verification code sent to your email";
    }

    // ─── Change Password Step 2: Confirm OTP & update password ────────────────
    public String confirmChangePasswordWithOtp(String email, String code) {
        if (email == null || code == null || code.trim().isEmpty()) {
            throw new BadRequestException("Email and OTP code are required");
        }

        String lowerEmail = email.trim().toLowerCase();
        PendingChangePasswordOtp pending = pendingChangePasswordOtps.get(lowerEmail);

        if (pending == null) {
            throw new BadRequestException("No pending password change request found. Please try again.");
        }

        if (LocalDateTime.now().isAfter(pending.expiresAt)) {
            pendingChangePasswordOtps.remove(lowerEmail);
            throw new BadRequestException("OTP code has expired. Please try again.");
        }

        if (!pending.code.equals(code.trim())) {
            throw new BadRequestException("Invalid OTP code. Please check your email and try again.");
        }

        User user = userRepository.findByEmail(lowerEmail)
                .orElseThrow(() -> new BadRequestException("User not found"));

        user.setPassword(pending.hashedNewPassword);
        userRepository.save(user);

        pendingChangePasswordOtps.remove(lowerEmail);
        return "Password changed successfully!";
    }

    private void sendChangePasswordOtpEmailAsync(String toEmail, String userName, String code) {
        sendEmailHelper(
            toEmail,
            "[Saby Shop] លេខកូដបញ្ជាក់ការប្ដូរពាក្យសម្ងាត់ / Password Change OTP Code",
            String.format(
                "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 12px; color: #1f2937;\">" +
                "<div style=\"text-align: center; margin-bottom: 20px;\">" +
                "<h1 style=\"color: #4f46e5; margin: 0;\">Saby Shop</h1>" +
                "<h3 style=\"color: #111827; margin-top: 6px;\">បញ្ជាក់ការប្ដូរពាក្យសម្ងាត់ / Confirm Password Change</h3>" +
                "</div>" +
                "<p style=\"font-size: 1rem;\">សួស្តី <strong>%s</strong>,</p>" +
                "<p>សូមប្រើលេខកូដ OTP <strong>4 ខ្ទង់</strong> ខាងក្រោម ដើម្បីបញ្ជាក់ការផ្លាស់ប្ដូរពាក្យសម្ងាត់របស់អ្នក:</p>" +
                "<div style=\"text-align: center; margin: 30px 0;\">" +
                "<div style=\"display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; font-size: 3rem; font-weight: 900; letter-spacing: 14px; padding: 22px 40px; border-radius: 12px; font-family: 'Courier New', monospace;\">%s</div>" +
                "</div>" +
                "<div style=\"background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0;\">" +
                "<p style=\"margin: 0; font-size: 0.9rem; color: #92400e;\"><strong>លេខកូដនេះផុតកំណត់ក្នុង 5 នាទី</strong><br>This code expires in 5 minutes.</p>" +
                "</div>" +
                "<p style=\"font-size: 0.88rem; color: #4b5563;\">ប្រសិនបើអ្នកមិនបានធ្វើការប្ដូរពាក្យសម្ងាត់ទេ សូមប្តូរពាក្យសម្ងាត់ជាបន្ទាន់ ឬទាក់ទងមក Admin (If you didn't request this change, please contact support immediately).</p>" +
                "<p style=\"margin-top: 30px; font-size: 0.85rem; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px;\">Saby Shop — Safe &amp; Fast Digital Store</p>" +
                "</div>",
                userName != null ? userName : "អតិថិជន",
                code
            )
        );
    }

    // ─── Email: OTP Verification ──────────────────────────────────────────────
    private void sendVerificationEmailAsync(String toEmail, String userName, String code) {
        // Show code as-is (4 digits)
        String formattedCode = code;
        sendEmailHelper(
            toEmail,
            "[Saby Shop] លេខកូដបញ្ជាក់អត្តសញ្ញាណ / Email Verification Code",
            String.format(
                "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 12px; color: #1f2937;\">" +
                "<div style=\"text-align: center; margin-bottom: 20px;\">" +
                "<h1 style=\"color: #4f46e5; margin: 0;\">Saby Shop</h1>" +
                "<h3 style=\"color: #111827; margin-top: 6px;\">បញ្ជាក់អ៊ីមែលរបស់អ្នក / Verify Your Email</h3>" +
                "</div>" +
                "<p style=\"font-size: 1rem;\">សួស្តី <strong>%s</strong>,</p>" +
                "<p>សូមប្រើលេខកូដ <strong>4 ខ្ទង់</strong> ខាងក្រោម ដើម្បីបញ្ជាក់អ៊ីមែលរបស់អ្នក:</p>" +
                "<div style=\"text-align: center; margin: 30px 0;\">" +
                "<div style=\"display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; font-size: 3rem; font-weight: 900; letter-spacing: 14px; padding: 22px 40px; border-radius: 12px; font-family: 'Courier New', monospace;\">%s</div>" +
                "</div>" +
                "<div style=\"background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0;\">" +
                "<p style=\"margin: 0; font-size: 0.9rem; color: #92400e;\"><strong>លេខកូដនេះផុតកំណត់ក្នុង 2 នាទី</strong><br>This code expires in 2 minutes.</p>" +
                "</div>" +
                "<p style=\"font-size: 0.88rem; color: #4b5563;\">ប្រសិនបើអ្នកមិនបានស្នើសុំទេ សូមមិនខ្វល់ (If you didn't request this, please ignore this email).</p>" +
                "<p style=\"margin-top: 30px; font-size: 0.85rem; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px;\">Saby Shop — Safe &amp; Fast Digital Store</p>" +
                "</div>",
                userName != null ? userName : "អតិថិជន",
                formattedCode
            )
        );
    }

    // ─── Email: Registration Success ──────────────────────────────────────────
    private void sendRegisterEmailAsync(String toEmail, String userName) {
        sendEmailHelper(
            toEmail,
            "[Saby Shop] អ្នកបានបង្កើតគណនីដោយជោគជ័យ / Account Created",
            String.format(
                "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 12px; color: #1f2937;\">" +
                "<div style=\"text-align: center; margin-bottom: 20px;\">" +
                "<h1 style=\"color: #4f46e5; margin: 0;\">Saby Shop</h1>" +
                "<h3 style=\"color: #111827; margin-top: 6px;\">អ្នកបានបង្កើតគណនីដោយជោគជ័យ!</h3>" +
                "</div>" +
                "<p style=\"font-size: 1rem;\">សួស្តី <strong>%s</strong>,</p>" +
                "<p>សូមស្វាគមន៍មកកាន់ <strong>Saby Shop</strong>! គណនីរបស់អ្នកត្រូវបានបង្កើតដោយជោគជ័យ និងមានសុវត្ថិភាព 100%%។</p>" +
                "<div style=\"background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; border-radius: 6px; margin: 20px 0;\">" +
                "<h4 style=\"margin: 0 0 5px 0; color: #065f46;\">ព័ត៌មានគណនី និង សុវត្ថិភាព:</h4>" +
                "<p style=\"margin: 0; font-size: 0.9rem; color: #047857;\"><strong>Email / អ៊ីមែល:</strong> %s<br><strong>Status / ស្ថានភាព:</strong> Verified &amp; Safe</p>" +
                "</div>" +
                "<p>ប្រសិនបើអ្នកមានចម្ងល់ ឬត្រូវការជំនួយ អាចទាក់ទងមក Telegram <strong>@saby_shop_support</strong></p>" +
                "<p style=\"margin-top: 30px; font-size: 0.85rem; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px;\">Saby Shop — Safe &amp; Fast Digital Store</p>" +
                "</div>",
                userName != null ? userName : "អតិថិជន",
                toEmail
            )
        );
    }

    // ─── Email: Login Alert ───────────────────────────────────────────────────
    private void sendLoginEmailAsync(String toEmail, String userName) {
        String currentTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        sendEmailHelper(
            toEmail,
            "[Saby Shop] ជូនដំណឹងពីការចូលប្រើប្រាស់គណនី (Login Alert)",
            String.format(
                "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 12px; color: #1f2937;\">" +
                "<div style=\"text-align: center; margin-bottom: 20px;\">" +
                "<h1 style=\"color: #4f46e5; margin: 0;\">Saby Shop</h1>" +
                "<h3 style=\"color: #111827; margin-top: 6px;\">ជូនដំណឹងពីការចូលប្រើប្រាស់គណនី (Login)</h3>" +
                "</div>" +
                "<p style=\"font-size: 1rem;\">សួស្តី <strong>%s</strong>,</p>" +
                "<p>គណនី Saby Shop របស់អ្នកត្រូវបានចូលប្រើប្រាស់ (Logged In) នៅពេល: <strong>%s</strong></p>" +
                "<div style=\"background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 6px; margin: 20px 0;\">" +
                "<p style=\"margin: 0; font-size: 0.9rem; color: #1e40af;\"><strong>Status:</strong> Successful Login / ចូលប្រើប្រាស់ដោយជោគជ័យ</p>" +
                "</div>" +
                "<p style=\"font-size: 0.88rem; color: #4b5563;\">ប្រសិនបើអ្នកមិនបានចូលប្រើប្រាស់ទេ សូមទាក់ទងមកកាន់យើងខ្ញុំភ្លាមៗតាម Telegram <strong>@saby_shop_support</strong></p>" +
                "<p style=\"margin-top: 30px; font-size: 0.85rem; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px;\">Saby Shop — Safe &amp; Fast Digital Store</p>" +
                "</div>",
                userName != null ? userName : "អតិថិជន",
                currentTime
            )
        );
    }

    // ─── Email: Logout Alert ──────────────────────────────────────────────────
    private void sendLogoutEmailAsync(String toEmail, String userName) {
        String currentTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        sendEmailHelper(
            toEmail,
            "[Saby Shop] អ្នកបានចាកចេញពីគណនី (Logged Out)",
            String.format(
                "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 12px; color: #1f2937;\">" +
                "<div style=\"text-align: center; margin-bottom: 20px;\">" +
                "<h1 style=\"color: #4f46e5; margin: 0;\">Saby Shop</h1>" +
                "<h3 style=\"color: #111827; margin-top: 6px;\">អ្នកបានចាកចេញពីគណនី (Logged Out)</h3>" +
                "</div>" +
                "<p style=\"font-size: 1rem;\">សួស្តី <strong>%s</strong>,</p>" +
                "<p>អ្នកបានចាកចេញពីគណនី Saby Shop ដោយជោគជ័យ នៅពេល: <strong>%s</strong>។</p>" +
                "<p style=\"font-size: 0.9rem; color: #4b5563;\">អរគុណសម្រាប់ការប្រើប្រាស់ Saby Shop! ជួបគ្នានៅពេលក្រោយ!</p>" +
                "<p style=\"margin-top: 30px; font-size: 0.85rem; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px;\">Saby Shop — Safe &amp; Fast Digital Store</p>" +
                "</div>",
                userName != null ? userName : "អតិថិជន",
                currentTime
            )
        );
    }

    // ─── Email Helper ─────────────────────────────────────────────────────────
    private void sendEmailHelper(String toEmail, String subject, String htmlContent) {
        new Thread(() -> {
            // 1. Try Gmail SMTP if app password is provided
            if (mailSender != null && mailPassword != null && !mailPassword.trim().isEmpty()) {
                try {
                    MimeMessage message = mailSender.createMimeMessage();
                    MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                    helper.setFrom("Saby Shop <" + mailFrom + ">");
                    helper.setTo(toEmail);
                    helper.setSubject(subject);
                    helper.setText(htmlContent, true);
                    mailSender.send(message);
                    System.out.println("[Gmail SMTP Success] Email sent successfully to: " + toEmail);
                    return;
                } catch (Exception e) {
                    System.err.println("[Gmail SMTP Error] Failed to send email via Gmail: " + e.getMessage());
                }
            }

            // 2. Fallback to Resend API
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.setBearerAuth(resendApiKey);

                // Resend test domain (onboarding@resend.dev) only allows sending to your registered owner email.
                String recipient = toEmail;

                Map<String, Object> payload = new HashMap<>();
                payload.put("from", "Saby Shop <onboarding@resend.dev>");
                payload.put("to", recipient);
                payload.put("subject", subject);
                payload.put("html", htmlContent);

                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
                ResponseEntity<String> response = restTemplate.postForEntity("https://api.resend.com/emails", entity, String.class);
                System.out.println("[Resend Email Success] Test email sent to: " + recipient + " (intended for " + toEmail + ") | Response: " + response.getBody());
            } catch (Exception e) {
                System.err.println("[Resend Email Error] Failed to send email for " + toEmail + ": " + e.getMessage());
            }
        }).start();
    }

    @Transactional
    public UserProfileDto getProfile(String email) {
        if (email == null) {
            throw new BadRequestException("User email is required");
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        syncSellerRoleIfActive(user);

        String avatar = user.getAvatarUrl();
        return UserProfileDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole() != null ? user.getRole().name() : "CUSTOMER")
                .avatar(avatar)
                .avatarUrl(avatar)
                .sellerBalance(user.getSellerBalance() != null ? user.getSellerBalance() : 0.0)
                .hasUsedFreeTrial(Boolean.TRUE.equals(user.getHasUsedFreeTrial()))
                .createdAt(user.getCreatedAt())
                .build();
    }

    @Transactional
    public UserProfileDto updateProfile(String email, UpdateUserProfileRequest request) {
        if (email == null) {
            throw new BadRequestException("User email is required");
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        if (request != null) {
            if (request.getName() != null && !request.getName().isBlank()) {
                user.setName(request.getName().trim());
            }
            String newAvatar = request.getAvatar() != null ? request.getAvatar() : request.getAvatarUrl();
            if (newAvatar != null) {
                user.setAvatarUrl(newAvatar);
            }
            userRepository.save(user);
        }

        String avatar = user.getAvatarUrl();
        return UserProfileDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole() != null ? user.getRole().name() : "CUSTOMER")
                .avatar(avatar)
                .avatarUrl(avatar)
                .sellerBalance(user.getSellerBalance() != null ? user.getSellerBalance() : 0.0)
                .hasUsedFreeTrial(Boolean.TRUE.equals(user.getHasUsedFreeTrial()))
                .createdAt(user.getCreatedAt())
                .build();
    }
}
