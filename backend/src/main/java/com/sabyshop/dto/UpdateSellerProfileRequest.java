package com.sabyshop.dto;

import lombok.Data;

@Data
public class UpdateSellerProfileRequest {
    private String storeName;
    private String storeDescription;
    private String storeLogoUrl;
    private String telegramUsername;
    private String telegramChannel;
    private String preferredContactMethod;
}
