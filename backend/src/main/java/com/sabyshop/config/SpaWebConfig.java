package com.sabyshop.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

@Configuration
public class SpaWebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String baseUploads = java.nio.file.Paths.get("uploads").toAbsolutePath().toUri().toString();
        String backendUploads = java.nio.file.Paths.get("backend", "uploads").toAbsolutePath().toUri().toString();

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(baseUploads, backendUploads, "file:uploads/", "file:backend/uploads/")
                .setCachePeriod(3600);

        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/", "classpath:/public/")
                .resourceChain(true)
                .addResolver(new SpaPathResourceResolver());
    }

    public static class SpaPathResourceResolver extends PathResourceResolver {
        @Override
        protected Resource getResource(String resourcePath, Resource location) throws IOException {
            // Do NOT intercept API endpoints, uploads, Swagger UI, or private chat attachments — let Spring MVC handle them
            if (resourcePath.startsWith("api/") || resourcePath.startsWith("api") ||
                resourcePath.startsWith("uploads/") || resourcePath.startsWith("uploads") ||
                resourcePath.startsWith("swagger-ui") || resourcePath.startsWith("v3") ||
                resourcePath.startsWith("webjars") ||
                resourcePath.startsWith("conv_") || resourcePath.startsWith("chat_") ||
                resourcePath.contains("attachment")) {
                return null;
            }
            Resource requestedResource = location.createRelative(resourcePath);
            return (requestedResource.exists() && requestedResource.isReadable())
                    ? requestedResource
                    : location.createRelative("index.html");
        }
    }
}
