package com.sabyshop.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChangePasswordOtpRequest {
    private String currentPassword;
    private String newPassword;
}
