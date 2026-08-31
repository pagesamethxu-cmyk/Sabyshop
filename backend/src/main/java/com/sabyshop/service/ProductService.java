package com.sabyshop.service;

import com.sabyshop.dto.ProductRequest;
import com.sabyshop.dto.ProductResponse;
import com.sabyshop.dto.StockBulkRequest;
import com.sabyshop.exception.ResourceNotFoundException;
import com.sabyshop.model.Category;
import com.sabyshop.model.Product;
import com.sabyshop.model.ProductStock;
import com.sabyshop.repository.CategoryRepository;
import com.sabyshop.repository.ProductRepository;
import com.sabyshop.repository.ProductReviewRepository;
import com.sabyshop.repository.ProductStockRepository;
import com.sabyshop.model.User;
import com.sabyshop.repository.SellerProfileRepository;
import com.sabyshop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductStockRepository productStockRepository;
    private final ProductReviewRepository productReviewRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final UserRepository userRepository;

    @Cacheable(value = "products", key = "(#categoryId != null ? #categoryId : 'all') + ':' + (#search != null ? #search : '')")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts(Long categoryId, String search) {
        List<Product> products;
        boolean hasCategory = categoryId != null;
        boolean hasSearch = search != null && !search.isBlank();

        if (hasCategory && hasSearch) {
            products = productRepository.findByCategoryIdAndSearchTerm(categoryId, search.trim());
        } else if (hasCategory) {
            products = productRepository.findByCategoryIdAndActiveTrue(categoryId);
        } else if (hasSearch) {
            products = productRepository.findBySearchTerm(search.trim());
        } else {
            products = productRepository.findByActiveTrue();
        }

        List<ProductResponse> responses = products.stream()
                .filter(this::isProductSellerActive)
                .map(this::mapToResponse)
                .sorted((p1, p2) -> {
                    double score1 = ((p1.getAverageRating() != null ? p1.getAverageRating() : 0.0) * 100.0)
                            + (p1.getReviewCount() != null ? p1.getReviewCount() : 0);
                    double score2 = ((p2.getAverageRating() != null ? p2.getAverageRating() : 0.0) * 100.0)
                            + (p2.getReviewCount() != null ? p2.getReviewCount() : 0);
                    return Double.compare(score2, score1);
                })
                .collect(Collectors.toList());
        return responses;
    }

    @Cacheable(value = "product", key = "#id")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        if (!product.isActive() || !isProductSellerActive(product)) {
            throw new ResourceNotFoundException("Product not found or store subscription is expired");
        }
        return mapToResponse(product);
    }

    private boolean isProductSellerActive(Product product) {
        if (product.getSeller() == null || product.getSeller().getRole() == com.sabyshop.model.Role.ADMIN) {
            return true;
        }
        return sellerProfileRepository.findByUserId(product.getSeller().getId())
                .map(profile -> {
                    if (profile.getSubscriptionExpiresAt() != null && profile.getSubscriptionExpiresAt().isBefore(LocalDateTime.now())) {
                        return false;
                    }
                    return profile.getSubscriptionStatus() == com.sabyshop.model.SellerProfile.SubscriptionStatus.ACTIVE;
                })
                .orElse(true);
    }

    @CacheEvict(value = "products", allEntries = true)
    public ProductResponse createProduct(ProductRequest request) {
        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        }

        Integer discountPct = request.getDiscountPercent();
        if (discountPct == null && request.getOriginalPrice() != null && request.getPrice() != null && request.getOriginalPrice() > request.getPrice()) {
            discountPct = (int) Math.round((request.getOriginalPrice() - request.getPrice()) * 100.0 / request.getOriginalPrice());
        }

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .originalPrice(request.getOriginalPrice())
                .discountPercent(discountPct)
                .imageUrl(request.getImageUrl())
                .productType(request.getProductType())
                .duration(request.getDuration())
                .productLabel(request.getProductLabel())
                .category(category)
                .active(request.isActive())
                .createdAt(LocalDateTime.now())
                .build();

        product = productRepository.save(product);
        return mapToResponse(product);
    }

    @Caching(evict = {
        @CacheEvict(value = "products", allEntries = true),
        @CacheEvict(value = "product", key = "#id")
    })
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            product.setCategory(category);
        }

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setOriginalPrice(request.getOriginalPrice());
        Integer discountPct = request.getDiscountPercent();
        if (discountPct == null && request.getOriginalPrice() != null && request.getPrice() != null && request.getOriginalPrice() > request.getPrice()) {
            discountPct = (int) Math.round((request.getOriginalPrice() - request.getPrice()) * 100.0 / request.getOriginalPrice());
        }
        product.setDiscountPercent(discountPct);
        product.setImageUrl(request.getImageUrl());
        if (request.getProductType() != null) product.setProductType(request.getProductType());
        if (request.getDuration() != null) product.setDuration(request.getDuration());
        if (request.getProductLabel() != null) product.setProductLabel(request.getProductLabel());
        product.setActive(request.isActive());

        product = productRepository.save(product);
        return mapToResponse(product);
    }

    @Caching(evict = {
        @CacheEvict(value = "products", allEntries = true),
        @CacheEvict(value = "product", key = "#id")
    })
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        product.setActive(false);
        productRepository.save(product);
    }

    @CacheEvict(value = {"products", "product"}, allEntries = true)
    @org.springframework.transaction.annotation.Transactional
    public void addStock(Long productId, StockBulkRequest request, String uploaderEmail) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        // Resolve the uploader (admin or seller) — null-safe if email not provided
        User uploader = (uploaderEmail != null && !uploaderEmail.isBlank())
                ? userRepository.findByEmail(uploaderEmail).orElse(null)
                : null;

        List<ProductStock> stocks = request.getItems().stream().map(req ->
            ProductStock.builder()
                .product(product)
                .accountEmail(req.getAccountEmail())
                .accountPassword(req.getAccountPassword())
                .licenseKey(req.getLicenseKey())
                .inviteLink(req.getInviteLink())
                .userNote(req.getNote() != null ? req.getNote() : req.getUserNote())
                .uploadedBy(uploader)
                .sold(false)
                .build()
        ).collect(Collectors.toList());

        productStockRepository.saveAll(stocks);

        // Update cached stockCount on the product
        long currentStock = productStockRepository.countByProductIdAndSoldFalse(productId);
        product.setStockCount((int) currentStock);
        productRepository.save(product);
    }

    /** Backward-compatible overload — used by existing callers that don't pass uploader */
    @CacheEvict(value = {"products", "product"}, allEntries = true)
    @org.springframework.transaction.annotation.Transactional
    public void addStock(Long productId, StockBulkRequest request) {
        addStock(productId, request, null);
    }

    public List<ProductStock> getStock(Long productId) {
        return productStockRepository.findByProductId(productId);
    }

    public ProductResponse mapToResponse(Product product) {
        ProductResponse res = new ProductResponse();
        res.setId(product.getId());
        res.setName(product.getName());
        res.setDescription(product.getDescription());
        res.setPrice(product.getPrice());
        res.setBasePrice(product.getBasePrice());
        res.setOriginalPrice(product.getOriginalPrice());
        res.setDiscountPercent(product.getDiscountPercent());
        res.setImageUrl(product.getImageUrl());
        res.setProductType(product.getProductType());
        res.setDuration(product.getDuration());
        res.setProductLabel(product.getProductLabel());
        if (product.getCategory() != null) {
            res.setCategoryId(product.getCategory().getId());
            res.setCategoryName(product.getCategory().getName());
            res.setCategoryEmoji(product.getCategory().getEmoji());
        }
        res.setActive(product.isActive());
        res.setCreatedAt(product.getCreatedAt());
        res.setStockCount(productStockRepository.countByProductIdAndSoldFalse(product.getId()));

        // Seller info
        if (product.getSeller() != null) {
            res.setSellerId(product.getSeller().getId());
            res.setSellerName(product.getSeller().getName());
            sellerProfileRepository.findByUserId(product.getSeller().getId()).ifPresent(profile -> {
                res.setSellerStoreName(profile.getStoreName());
                res.setSellerStoreLogoUrl(profile.getStoreLogoUrl());
                res.setSellerStoreDescription(profile.getStoreDescription());
                res.setSellerTelegramUsername(profile.getTelegramUsername());
                res.setSellerTelegramChannel(profile.getTelegramChannel());
                res.setSellerPreferredContactMethod(profile.getPreferredContactMethod());
            });
        }

        // Review aggregates
        try {
            Double avg = productReviewRepository.findAverageRatingByProductId(product.getId());
            Long cnt = productReviewRepository.countByProductId(product.getId());
            res.setAverageRating(avg);
            res.setReviewCount(cnt != null ? cnt : 0L);
        } catch (Exception ignored) {
            res.setReviewCount(0L);
        }

        return res;
    }
}
