package com.sabyshop.dto;

import lombok.Data;

@Data
public class OrderDeliveryRequest {
    private String accountEmail;
    private String accountPassword;
    private String deliveryNote;
}
