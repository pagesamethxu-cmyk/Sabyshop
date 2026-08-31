package com.sabyshop.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class GoogleUserInfoDto {
    private String iss;
    private String sub;
    private String aud;
    private String email;
    @JsonProperty("email_verified")
    private Object emailVerified;
    private String name;
    private String picture;
}
