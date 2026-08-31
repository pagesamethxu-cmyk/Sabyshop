package com.sabyshop.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderEscrowScheduler {

    private final OrderService orderService;

    /**
     * Runs every 60 seconds to check for DELIVERED orders that have passed the 48-hour escrow window.
     * Automatically completes the order and releases the funds to the seller's balance.
     */
    @Scheduled(fixedRate = 60000)
    public void runEscrowAutoRelease() {
        try {
            orderService.autoReleaseDeliveredOrders();
        } catch (Exception e) {
            log.error("Error during scheduled 48h escrow auto-release: {}", e.getMessage());
        }
    }
}