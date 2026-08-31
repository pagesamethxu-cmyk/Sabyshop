package com.sabyshop.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class UserAdminResponse {
    private Long id;
    private String email;
    private String name;
    private String role;
    private String status; // ACTIVE, SUSPENDED, BANNED
    private String avatarUrl;
    private Double sellerBalance;
    private LocalDateTime createdAt;
    private Integer orderCount;
    private Double totalSpent;
    private String storeName;
    private String sellerStatus;
}
