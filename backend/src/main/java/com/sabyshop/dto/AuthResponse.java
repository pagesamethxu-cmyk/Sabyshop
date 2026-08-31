package com.sabyshop.dto;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String email;
    private String name;
    private String role;
    private String avatar;
    private Boolean hasUsedFreeTrial;

    public AuthResponse(String token, String email, String name, String role) {
        this.token = token;
        this.email = email;
        this.name = name;
        this.role = role;
    }

    public AuthResponse(String token, String email, String name, String role, String avatar) {
        this.token = token;
        this.email = email;
        this.name = name;
        this.role = role;
        this.avatar = avatar;
    }
}

