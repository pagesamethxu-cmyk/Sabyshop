package com.sabyshop.dto;
import lombok.Data;
import java.util.List;
@Data
public class DashboardResponse {
    private Double totalRevenue;
    private Long totalOrders;
    private Long activeSales;
    private Long newOrders;
    private Long totalProducts;
    private Long totalStock;
    private Long totalCustomers;
    private List<OrderResponse> recentOrders;
}
