package com.sabyshop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {"com.sabyshop"})
public class SabyShopApplication {
    public static void main(String[] args) {
        SpringApplication.run(SabyShopApplication.class, args);
    }
}
