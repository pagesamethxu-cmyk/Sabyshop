package com.sabyshop.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "auto_reply")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AutoReply {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String keyword;

    private String category;

    @Column(name = "reply_kh", columnDefinition = "TEXT")
    private String replyKh;

    @Column(name = "reply_en", columnDefinition = "TEXT")
    private String replyEn;
}
