package com.sabyshop.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@Slf4j
public class UploadController {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private Path resolveUploadFile(String filename) {
        if (filename == null || filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            return null;
        }

        Path[] candidateDirs = new Path[] {
            Paths.get(uploadDir),
            Paths.get("uploads"),
            Paths.get("backend", "uploads"),
            Paths.get("backend", uploadDir),
            Paths.get("..", "uploads"),
            Paths.get("..", "backend", "uploads"),
            Paths.get(System.getProperty("user.dir"), "uploads"),
            Paths.get(System.getProperty("user.dir"), "backend", "uploads")
        };

        for (Path dir : candidateDirs) {
            try {
                Path candidate = dir.resolve(filename).normalize();
                if (Files.exists(candidate) && Files.isRegularFile(candidate)) {
                    return candidate;
                }
            } catch (Exception ignored) {}
        }
        return Paths.get(uploadDir).resolve(filename);
    }

    @GetMapping({
        "/api/admin/uploads/{filename:.+}",
        "/api/seller/uploads/{filename:.+}",
        "/api/uploads/{filename:.+}",
        "/api/chat/attachments/{filename:.+}",
        "/uploads/{filename:.+}"
    })
    public ResponseEntity<Resource> serveUploadFile(@PathVariable String filename) {
        try {
            Path file = resolveUploadFile(filename);
            if (file != null && Files.exists(file) && Files.isRegularFile(file)) {
                Resource resource = new UrlResource(file.toUri());
                    String contentType = Files.probeContentType(file);
                    if (contentType == null || contentType.equals(MediaType.APPLICATION_OCTET_STREAM_VALUE)) {
                        String lowerName = filename.toLowerCase();
                        if (lowerName.endsWith(".jfif") || lowerName.endsWith(".pjpeg") || lowerName.endsWith(".pjp") || lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
                            contentType = "image/jpeg";
                        } else if (lowerName.endsWith(".png")) {
                            contentType = "image/png";
                        } else if (lowerName.endsWith(".webp")) {
                            contentType = "image/webp";
                        } else if (lowerName.endsWith(".gif")) {
                            contentType = "image/gif";
                        } else if (lowerName.endsWith(".svg")) {
                            contentType = "image/svg+xml";
                        } else if (lowerName.endsWith(".ico")) {
                            contentType = "image/x-icon";
                        } else {
                            contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
                        }
                    }
                    return ResponseEntity.ok()
                            .header(HttpHeaders.CONTENT_TYPE, contentType)
                            .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                            .body(resource);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to serve upload file [{}]: {}", filename, e.getMessage());
        }
        return ResponseEntity.notFound().build();
    }
}