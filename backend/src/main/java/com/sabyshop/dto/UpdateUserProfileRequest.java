package com.sabyshop.dto;

import lombok.Data;

@Data
public class UpdateUserProfileRequest {
    private String name;
    private String avatar;
    private String avatarUrl;
}
