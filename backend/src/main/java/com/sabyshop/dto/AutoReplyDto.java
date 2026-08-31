package com.sabyshop.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AutoReplyDto {
    private Long id;
    private String keyword;
    private String category;
    private String replyKh;
    private String replyEn;
}
