package com.sabyshop.service;

import com.sabyshop.dto.DashboardResponse;
import com.sabyshop.model.Order;
import com.sabyshop.model.OrderStatus;
import com.sabyshop.model.Role;
import com.sabyshop.repository.OrderRepository;
import com.sabyshop.repository.ProductRepository;
import com.sabyshop.repository.ProductStockRepository;
import com.sabyshop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ProductStockRepository productStockRepository;
    private final UserRepository userRepository;
    private final OrderService orderService;

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public DashboardResponse getDashboard() {
        List<Order> allOrders = orderRepository.findAll();
        
        double totalRevenue = allOrders.stream()
                .filter(o -> o != null && o.getStatus() == OrderStatus.COMPLETED)
                .mapToDouble(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0.0)
                .sum();

        long activeSales = allOrders.stream()
                .filter(o -> o != null && o.getStatus() == OrderStatus.COMPLETED)
                .count();

        // Total registered users/customers
        long totalCustomers = userRepository.countByRole(Role.CUSTOMER);
        if (totalCustomers == 0) {
            totalCustomers = userRepository.count();
        }

        DashboardResponse res = new DashboardResponse();
        res.setTotalRevenue(totalRevenue);
        res.setTotalOrders((long) allOrders.size());
        res.setActiveSales(activeSales > 0 ? activeSales : (long) allOrders.size());
        res.setNewOrders((long) allOrders.size());
        res.setTotalProducts(productRepository.count());
        res.setTotalStock(productStockRepository.count());
        res.setTotalCustomers(totalCustomers);
        
        try {
            res.setRecentOrders(orderService.getAllOrders().stream().limit(10).collect(Collectors.toList()));
        } catch (Exception e) {
            res.setRecentOrders(Collections.emptyList());
        }
        return res;
    }
}

