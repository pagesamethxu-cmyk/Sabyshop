package com.sabyshop.controller;

import com.sabyshop.dto.ApiResponse;
import com.sabyshop.model.Favorite;
import com.sabyshop.model.User;
import com.sabyshop.repository.UserRepository;
import com.sabyshop.service.ExtendedFeaturesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final ExtendedFeaturesService extendedFeaturesService;
    private final UserRepository userRepository;

    private User getCurrentUser(Authentication auth) {
        if (auth == null || auth.getName() == null) return null;
        return userRepository.findByEmail(auth.getName()).orElse(null);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Favorite>>> getMyFavorites(Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null) return ResponseEntity.status(401).body(new ApiResponse<>(false, "Unauthorized", null));
        return ResponseEntity.ok(new ApiResponse<>(true, "Favorites fetched", extendedFeaturesService.getUserFavorites(user.getId())));
    }

    @PostMapping("/{productId}/toggle")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> toggleFavorite(@PathVariable Long productId, Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null) return ResponseEntity.status(401).body(new ApiResponse<>(false, "Unauthorized", null));
        boolean favorited = extendedFeaturesService.toggleFavorite(user.getId(), productId);
        return ResponseEntity.ok(new ApiResponse<>(true, favorited ? "Added to wishlist" : "Removed from wishlist", Map.of("favorited", favorited)));
    }

    @GetMapping("/{productId}/check")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkFavorite(@PathVariable Long productId, Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null) return ResponseEntity.ok(new ApiResponse<>(true, "Status", Map.of("favorited", false)));
        boolean favorited = extendedFeaturesService.isProductFavorite(user.getId(), productId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Status", Map.of("favorited", favorited)));
    }
}
