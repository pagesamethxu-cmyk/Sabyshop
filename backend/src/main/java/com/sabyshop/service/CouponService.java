package com.sabyshop.service;

import com.sabyshop.dto.CouponRequest;
import com.sabyshop.dto.CouponResponse;
import com.sabyshop.dto.CouponValidationResponse;
import com.sabyshop.exception.BadRequestException;
import com.sabyshop.exception.ResourceNotFoundException;
import com.sabyshop.model.Coupon;
import com.sabyshop.model.Product;
import com.sabyshop.model.User;
import com.sabyshop.repository.CouponRepository;
import com.sabyshop.repository.ProductRepository;
import com.sabyshop.repository.UserRepository;
import com.sabyshop.repository.SellerProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final SellerProfileRepository sellerProfileRepository;

    @Transactional
    public CouponResponse createCoupon(Long sellerUserId, CouponRequest req) {
        User seller = userRepository.findById(sellerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found"));

        if (req.getCode() == null || req.getCode().trim().isEmpty()) {
            throw new BadRequestException("Coupon code is required");
        }

        String normalizedCode = req.getCode().trim().toUpperCase();
        if (couponRepository.existsByCodeIgnoreCase(normalizedCode)) {
            throw new BadRequestException("Coupon code '" + normalizedCode + "' already exists");
        }

        if (req.getDiscountValue() == null || req.getDiscountValue() <= 0) {
            throw new BadRequestException("Discount value must be greater than 0");
        }

        String type = "PERCENTAGE";
        if ("FIXED_AMOUNT".equalsIgnoreCase(req.getDiscountType()) || "FIXED".equalsIgnoreCase(req.getDiscountType()) || "USD".equalsIgnoreCase(req.getDiscountType())) {
            type = "FIXED_AMOUNT";
        } else if ("PERCENTAGE".equalsIgnoreCase(req.getDiscountType()) || "PERCENT".equalsIgnoreCase(req.getDiscountType())) {
            type = "PERCENTAGE";
            if (req.getDiscountValue() > 95) {
                throw new BadRequestException("Percentage discount cannot exceed 95%");
            }
        }

        // Verify product ownership if productId is specified
        if (req.getProductId() != null) {
            Product prod = productRepository.findById(req.getProductId())
                    .orElseThrow(() -> new BadRequestException("Selected product not found"));
            if (prod.getSeller() == null || !prod.getSeller().getId().equals(sellerUserId)) {
                throw new BadRequestException("អ្នកអាចបង្កើតកូដបញ្ចុះតម្លៃសម្រាប់តែផលិតផលក្នុងហាងផ្ទាល់ខ្លួនរបស់អ្នកប៉ុណ្ណោះ (You can only create coupons for products in your own store)");
            }
        }

        LocalDateTime startDate = req.getStartDate() != null ? req.getStartDate() : LocalDateTime.now();
        LocalDateTime endDate = req.getEndDate();

        Coupon coupon = Coupon.builder()
                .code(normalizedCode)
                .seller(seller)
                .discountType(type)
                .discountValue(req.getDiscountValue())
                .minSpend(req.getMinSpend())
                .maxDiscount(req.getMaxDiscount())
                .usageLimit(req.getUsageLimit())
                .usedCount(0)
                .startDate(startDate)
                .endDate(endDate)
                .productId(req.getProductId())
                .active(req.getActive() != null ? req.getActive() : true)
                .build();

        coupon = couponRepository.save(coupon);
        log.info("Seller {} created coupon code {}", seller.getEmail(), normalizedCode);
        return toResponse(coupon);
    }

    @Transactional(readOnly = true)
    public List<CouponResponse> getSellerCoupons(Long sellerUserId) {
        return couponRepository.findBySellerIdOrderByCreatedAtDesc(sellerUserId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CouponResponse updateCoupon(Long sellerUserId, Long couponId, CouponRequest req) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found"));

        if (coupon.getSeller() == null || !coupon.getSeller().getId().equals(sellerUserId)) {
            throw new BadRequestException("You do not have permission to modify this coupon");
        }

        if (req.getCode() != null && !req.getCode().trim().isEmpty()) {
            String normalizedCode = req.getCode().trim().toUpperCase();
            if (couponRepository.existsByCodeIgnoreCaseAndIdNot(normalizedCode, couponId)) {
                throw new BadRequestException("Coupon code '" + normalizedCode + "' already in use");
            }
            coupon.setCode(normalizedCode);
        }

        if (req.getDiscountType() != null) {
            String type = "PERCENTAGE";
            if ("FIXED_AMOUNT".equalsIgnoreCase(req.getDiscountType()) || "FIXED".equalsIgnoreCase(req.getDiscountType()) || "USD".equalsIgnoreCase(req.getDiscountType())) {
                type = "FIXED_AMOUNT";
            }
            coupon.setDiscountType(type);
        }

        if (req.getDiscountValue() != null && req.getDiscountValue() > 0) {
            if ("PERCENTAGE".equals(coupon.getDiscountType()) && req.getDiscountValue() > 95) {
                throw new BadRequestException("Percentage discount cannot exceed 95%");
            }
            coupon.setDiscountValue(req.getDiscountValue());
        }

        if (req.getProductId() != null) {
            Product prod = productRepository.findById(req.getProductId())
                    .orElseThrow(() -> new BadRequestException("Selected product not found"));
            if (prod.getSeller() == null || !prod.getSeller().getId().equals(sellerUserId)) {
                throw new BadRequestException("អ្នកអាចបង្កើតកូដបញ្ចុះតម្លៃសម្រាប់តែផលិតផលក្នុងហាងផ្ទាល់ខ្លួនរបស់អ្នកប៉ុណ្ណោះ (You can only create coupons for products in your own store)");
            }
            coupon.setProductId(req.getProductId());
        } else if (Boolean.TRUE.equals(req.getClearProductId())) {
            coupon.setProductId(null);
        }

        if (req.getMinSpend() != null) coupon.setMinSpend(req.getMinSpend());
        if (req.getMaxDiscount() != null) coupon.setMaxDiscount(req.getMaxDiscount());
        if (req.getUsageLimit() != null) coupon.setUsageLimit(req.getUsageLimit());
        if (req.getStartDate() != null) coupon.setStartDate(req.getStartDate());
        if (req.getEndDate() != null) coupon.setEndDate(req.getEndDate());
        if (req.getActive() != null) coupon.setActive(req.getActive());

        coupon = couponRepository.save(coupon);
        return toResponse(coupon);
    }

    @Transactional
    public void deleteCoupon(Long sellerUserId, Long couponId) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found"));

        if (coupon.getSeller() == null || !coupon.getSeller().getId().equals(sellerUserId)) {
            throw new BadRequestException("You do not have permission to delete this coupon");
        }

        couponRepository.delete(coupon);
        log.info("Seller {} deleted coupon id {}", sellerUserId, couponId);
    }

    /**
     * Store coupons are private marketing codes and should not be publicly exposed on store profiles.
     */
    @Transactional(readOnly = true)
    public List<CouponResponse> getPublicStoreCoupons(Long sellerId) {
        // As requested: Coupons are private promo codes and not shown publicly from store profiles
        return Collections.emptyList();
    }

    /**
     * Checks if a seller ឬ product has any active coupons without exposing the actual promo codes
     */
    @Transactional(readOnly = true)
    public Map<String, Object> checkStoreHasActiveCoupons(Long sellerId, Long productId) {
        Map<String, Object> result = new HashMap<>();
        if (sellerId == null) {
            result.put("hasCoupons", false);
            return result;
        }

        List<Coupon> coupons = couponRepository.findBySellerIdAndActiveTrue(sellerId);
        LocalDateTime now = LocalDateTime.now();

        boolean hasActive = coupons.stream().anyMatch(c ->
                (c.getStartDate() == null || !now.isBefore(c.getStartDate())) &&
                (c.getEndDate() == null || now.isBefore(c.getEndDate())) &&
                (c.getUsageLimit() == null || c.getUsedCount() == null || c.getUsedCount() < c.getUsageLimit()) &&
                (c.getProductId() == null || (productId != null && c.getProductId().equals(productId)))
        );

        String storeName = sellerProfileRepository.findByUserId(sellerId)
                .map(com.sabyshop.model.SellerProfile::getStoreName)
                .orElse(null);

        result.put("hasCoupons", hasActive);
        result.put("sellerId", sellerId);
        result.put("storeName", storeName);
        return result;
    }

    /**
     * Validates coupon code and returns calculated discount breakdown
     */
    @Transactional(readOnly = true)
    public CouponValidationResponse validateCoupon(String code, Long sellerId, Double orderAmount, Long productId) {
        return validateCouponWithItems(code, null, sellerId, orderAmount, productId, null);
    }

    @Transactional(readOnly = true)
    public CouponValidationResponse validateCoupon(String code, Long sellerId, Double orderAmount, Long productId, Double sellerItemsAmount) {
        return validateCouponWithItems(code, null, sellerId, orderAmount, productId, sellerItemsAmount);
    }

    /**
     * Full validator supporting cart items array for accurate multi-item ឬ multi-seller calculations
     */
    @Transactional(readOnly = true)
    public CouponValidationResponse validateCouponWithItems(
            String code,
            List<Map<String, Object>> items,
            Long fallbackSellerId,
            Double fallbackOrderAmount,
            Long fallbackProductId,
            Double fallbackSellerAmount) {

        if (code == null || code.trim().isEmpty()) {
            return CouponValidationResponse.builder()
                    .valid(false)
                    .message("សូមបញ្ចូលកូដបញ្ចុះតម្លៃ")
                    .build();
        }

        String normalized = code.trim().toUpperCase();
        Coupon coupon = couponRepository.findByCodeIgnoreCaseAndActiveTrue(normalized)
                .orElse(null);

        if (coupon == null) {
            return CouponValidationResponse.builder()
                    .valid(false)
                    .message("កូដបញ្ចុះតម្លៃមិនត្រឹមត្រូវ ឬត្រូវបានបិទដំណើរការ")
                    .code(normalized)
                    .build();
        }

        LocalDateTime now = LocalDateTime.now();
        if (coupon.getStartDate() != null && now.isBefore(coupon.getStartDate())) {
            return CouponValidationResponse.builder()
                    .valid(false)
                    .message("កូដបញ្ចុះតម្លៃនេះមិនទាន់ដល់ថ្ងៃដំណើរការនៅឡើយទេ")
                    .code(normalized)
                    .build();
        }

        if (coupon.getEndDate() != null && now.isAfter(coupon.getEndDate())) {
            return CouponValidationResponse.builder()
                    .valid(false)
                    .message("កូដបញ្ចុះតម្លៃនេះបានផុតកំណត់ហើយ")
                    .code(normalized)
                    .build();
        }

        if (coupon.getUsageLimit() != null && coupon.getUsedCount() >= coupon.getUsageLimit()) {
            return CouponValidationResponse.builder()
                    .valid(false)
                    .message("កូដបញ្ចុះតម្លៃនេះត្រូវបានប្រើប្រាស់អស់កំណត់ហើយ")
                    .code(normalized)
                    .build();
        }

        String storeName = "Seller";
        Long sellerId = coupon.getSeller() != null ? coupon.getSeller().getId() : null;
        if (sellerId != null) {
            storeName = sellerProfileRepository.findByUserId(sellerId)
                    .map(com.sabyshop.model.SellerProfile::getStoreName)
                    .orElse(coupon.getSeller().getName());
        }

        String targetProdName = null;
        if (coupon.getProductId() != null) {
            targetProdName = productRepository.findById(coupon.getProductId())
                    .map(Product::getName)
                    .orElse("Selected Product");
        }

        double totalBaseAmount = fallbackOrderAmount != null ? fallbackOrderAmount : 0.0;
        double eligibleSubtotal = 0.0;

        if (items != null && !items.isEmpty()) {
            double calculatedTotal = 0.0;
            double calculatedSellerSubtotal = 0.0;
            double calculatedProductSubtotal = 0.0;
            boolean foundSellerItem = false;
            boolean foundProductItem = false;

            for (Map<String, Object> it : items) {
                Long itProdId = it.get("productId") != null ? Long.valueOf(it.get("productId").toString()) : null;
                Long itSellerId = it.get("sellerId") != null ? Long.valueOf(it.get("sellerId").toString()) : null;
                double itPrice = it.get("price") != null ? Double.parseDouble(it.get("price").toString()) : 0.0;
                int itQty = it.get("quantity") != null ? Integer.parseInt(it.get("quantity").toString()) : 1;
                double lineTotal = itPrice * itQty;
                calculatedTotal += lineTotal;

                if (sellerId != null && sellerId.equals(itSellerId)) {
                    foundSellerItem = true;
                    calculatedSellerSubtotal += lineTotal;
                    if (coupon.getProductId() != null && coupon.getProductId().equals(itProdId)) {
                        foundProductItem = true;
                        calculatedProductSubtotal += lineTotal;
                    }
                } else if (sellerId == null) {
                    // Platform wide coupon
                    foundSellerItem = true;
                    calculatedSellerSubtotal += lineTotal;
                    if (coupon.getProductId() != null && coupon.getProductId().equals(itProdId)) {
                        foundProductItem = true;
                        calculatedProductSubtotal += lineTotal;
                    }
                }
            }

            if (totalBaseAmount <= 0) {
                totalBaseAmount = calculatedTotal;
            }

            // Check store seller restriction
            if (sellerId != null && !foundSellerItem) {
                return CouponValidationResponse.builder()
                        .valid(false)
                        .message("កូដបញ្ចុះតម្លៃនេះអាចប្រើបានសម្រាប់តែទំនិញក្នុងហាងរបស់ " + storeName + " ប៉ុណ្ណោះ")
                        .code(normalized)
                        .sellerId(sellerId)
                        .sellerStoreName(storeName)
                        .build();
            }

            // Check product restriction
            if (coupon.getProductId() != null && !foundProductItem) {
                return CouponValidationResponse.builder()
                        .valid(false)
                        .message("កូដបញ្ចុះតម្លៃនេះអាចប្រើបានសម្រាប់តែទំនិញ \"" + targetProdName + "\" ក្នុងហាងរបស់ " + storeName + " ប៉ុណ្ណោះ")
                        .code(normalized)
                        .sellerId(sellerId)
                        .sellerStoreName(storeName)
                        .productId(coupon.getProductId())
                        .productName(targetProdName)
                        .build();
            }

            eligibleSubtotal = coupon.getProductId() != null ? calculatedProductSubtotal : calculatedSellerSubtotal;

        } else {
            // Fallback to legacy single parameters
            if (sellerId != null) {
                if (fallbackSellerId == null || !sellerId.equals(fallbackSellerId)) {
                    return CouponValidationResponse.builder()
                            .valid(false)
                            .message("កូដបញ្ចុះតម្លៃនេះអាចប្រើបានសម្រាប់តែទំនិញក្នុងហាងរបស់ " + storeName + " ប៉ុណ្ណោះ")
                            .code(normalized)
                            .sellerId(sellerId)
                            .sellerStoreName(storeName)
                            .build();
                }

                if (fallbackSellerAmount != null && fallbackSellerAmount <= 0) {
                    return CouponValidationResponse.builder()
                            .valid(false)
                            .message("កន្ត្រកទំនិញរបស់អ្នកគ្មានទំនិញពីហាងរបស់ " + storeName + " ដើម្បីអនុវត្តកូដបញ្ចុះតម្លៃនេះទេ")
                            .code(normalized)
                            .sellerId(sellerId)
                            .sellerStoreName(storeName)
                            .build();
                }
            }

            if (coupon.getProductId() != null) {
                if (fallbackProductId == null || !coupon.getProductId().equals(fallbackProductId)) {
                    return CouponValidationResponse.builder()
                            .valid(false)
                            .message("កូដបញ្ចុះតម្លៃនេះអាចប្រើបានសម្រាប់តែទំនិញ \"" + targetProdName + "\" ក្នុងហាងរបស់ " + storeName + " ប៉ុណ្ណោះ")
                            .code(normalized)
                            .sellerId(sellerId)
                            .sellerStoreName(storeName)
                            .productId(coupon.getProductId())
                            .productName(targetProdName)
                            .build();
                }
            }

            eligibleSubtotal = (fallbackSellerAmount != null && fallbackSellerAmount > 0) ? fallbackSellerAmount : totalBaseAmount;
        }

        // Check minimum spend against eligible seller/product amount
        if (coupon.getMinSpend() != null && eligibleSubtotal < coupon.getMinSpend()) {
            return CouponValidationResponse.builder()
                    .valid(false)
                    .message(String.format("ការទិញទំនិញក្នុងហាងនេះត្រូវមានតម្លៃចាប់ពី $%.2f ឡើងទៅដើម្បីប្រើកូដនេះ", coupon.getMinSpend()))
                    .code(normalized)
                    .sellerId(sellerId)
                    .sellerStoreName(storeName)
                    .productId(coupon.getProductId())
                    .productName(targetProdName)
                    .originalAmount(totalBaseAmount)
                    .build();
        }

        // Calculate discount amount strictly on the eligible portion
        double discountAmount = 0.0;
        if ("PERCENTAGE".equalsIgnoreCase(coupon.getDiscountType())) {
            discountAmount = eligibleSubtotal * (coupon.getDiscountValue() / 100.0);
            if (coupon.getMaxDiscount() != null && discountAmount > coupon.getMaxDiscount()) {
                discountAmount = coupon.getMaxDiscount();
            }
        } else {
            discountAmount = coupon.getDiscountValue();
        }

        if (discountAmount > eligibleSubtotal) {
            discountAmount = eligibleSubtotal;
        }

        double finalAmount = Math.max(0.0, totalBaseAmount - discountAmount);

        String successMsg = coupon.getProductId() != null
                ? "ទទួលបានការបញ្ចុះតម្លៃលើទំនិញ \"" + targetProdName + "\" ជោគជ័យ!"
                : "ទទួលបានការបញ្ចុះតម្លៃពីហាង " + storeName + " ជោគជ័យ!";

        return CouponValidationResponse.builder()
                .valid(true)
                .message(successMsg)
                .code(normalized)
                .discountType(coupon.getDiscountType())
                .discountValue(coupon.getDiscountValue())
                .originalAmount(Math.round(totalBaseAmount * 100.0) / 100.0)
                .discountAmount(Math.round(discountAmount * 100.0) / 100.0)
                .finalAmount(Math.round(finalAmount * 100.0) / 100.0)
                .sellerId(sellerId)
                .sellerStoreName(storeName)
                .productId(coupon.getProductId())
                .productName(targetProdName)
                .build();
    }

    /**
     * Finds raw coupon entity by code
     */
    @Transactional(readOnly = true)
    public java.util.Optional<Coupon> getCouponEntityByCode(String code) {
        if (code == null || code.trim().isEmpty()) return java.util.Optional.empty();
        return couponRepository.findByCodeIgnoreCaseAndActiveTrue(code.trim().toUpperCase());
    }

    /**
     * Increments coupon usage count after successful order
     */
    @Transactional
    public void recordCouponUsage(String code) {
        if (code == null || code.trim().isEmpty()) return;
        couponRepository.findByCodeIgnoreCase(code.trim()).ifPresent(c -> {
            c.setUsedCount((c.getUsedCount() == null ? 0 : c.getUsedCount()) + 1);
            couponRepository.save(c);
            log.info("Recorded usage for coupon {}. New count: {}", c.getCode(), c.getUsedCount());
        });
    }

    private CouponResponse toResponse(Coupon c) {
        String prodName = null;
        if (c.getProductId() != null) {
            prodName = productRepository.findById(c.getProductId()).map(Product::getName).orElse(null);
        }

        String storeName = null;
        if (c.getSeller() != null) {
            storeName = sellerProfileRepository.findByUserId(c.getSeller().getId())
                    .map(com.sabyshop.model.SellerProfile::getStoreName)
                    .orElse(c.getSeller().getName());
        }

        return CouponResponse.builder()
                .id(c.getId())
                .code(c.getCode())
                .sellerId(c.getSeller() != null ? c.getSeller().getId() : null)
                .sellerStoreName(storeName)
                .discountType(c.getDiscountType())
                .discountValue(c.getDiscountValue())
                .minSpend(c.getMinSpend())
                .maxDiscount(c.getMaxDiscount())
                .usageLimit(c.getUsageLimit())
                .usedCount(c.getUsedCount() != null ? c.getUsedCount() : 0)
                .startDate(c.getStartDate())
                .endDate(c.getEndDate())
                .productId(c.getProductId())
                .productName(prodName)
                .active(c.isActive())
                .valid(c.isValid())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
