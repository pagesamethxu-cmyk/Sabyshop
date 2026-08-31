package com.sabyshop.dto;

import lombok.Data;
import java.util.List;

@Data
public class ProductReportRequest {
    private String reason;
    private String description;
    private List<String> evidenceImages;
    private String imageCaptions;
    private String caption;
    private String reporterEmail;
    private String reporterName;
    private Integer starRating;
    private Long orderId;
    private String sellerStoreName;
    private String storeLocation;
    private String sellerSolution;
    private String replacementEmail;
    private String replacementPassword;
    private String replacementNote;
}
