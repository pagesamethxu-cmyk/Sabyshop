package com.sabyshop.dto;
import lombok.Data;
@Data
public class ProductRequest {
    private String name;
    private String description;
    private Double price;
    private Double originalPrice;
    private Integer discountPercent;
    private String imageUrl;
    private Long categoryId;
    private String productType;
    private String duration;
    private String productLabel;
    private boolean active;
}
