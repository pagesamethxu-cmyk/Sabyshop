package com.sabyshop.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileDto {
    private Long id;
    private String email;
    private String name;
    private String role;
    private String avatar;
    private String avatarUrl;
    private Double sellerBalance;
    private Boolean hasUsedFreeTrial;
    private LocalDateTime createdAt;
}
