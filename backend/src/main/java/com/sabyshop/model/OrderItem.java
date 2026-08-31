package com.sabyshop.model;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name="order_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name="order_id")
    @JsonIgnore
    private Order order;

    @ManyToOne
    @JoinColumn(name="product_id")
    private Product product;

    private Double price;

    /**
     * Quantity of this product purchased in one line item.
     * For digital products this is typically 1 (one stock item per OrderItem).
     * Defaults to 1.
     */
    @Builder.Default
    private Integer quantity = 1;

    @OneToOne
    @JoinColumn(name="stock_item_id")
    private ProductStock stockItem;

    private String buyerInviteEmail;
}
