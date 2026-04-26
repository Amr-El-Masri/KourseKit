package com.koursekit.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${SUPABASE_URL:}")
    private String supabaseUrl;

    @Value("${SUPABASE_KEY:}")
    private String supabaseKey;

    @Value("${SUPABASE_BUCKET:koursekit}")
    private String bucket;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    public String storeFile(MultipartFile file) throws IOException {
        if (supabaseUrl == null || supabaseUrl.isBlank() || supabaseKey == null || supabaseKey.isBlank())
            throw new IOException("Supabase storage is not configured (SUPABASE_URL / SUPABASE_KEY missing).");
        String originalName = file.getOriginalFilename();
        String extension = "";
        if (originalName != null && originalName.contains("."))
            extension = originalName.substring(originalName.lastIndexOf("."));

        String fileName = UUID.randomUUID().toString() + extension;
        String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(supabaseUrl + "/storage/v1/object/" + bucket + "/" + fileName))
            .header("Authorization", "Bearer " + supabaseKey)
            .header("Content-Type", contentType)
            .POST(HttpRequest.BodyPublishers.ofByteArray(file.getBytes()))
            .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400)
                throw new IOException("Upload failed: " + response.body());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Upload interrupted", e);
        }

        return supabaseUrl + "/storage/v1/object/public/" + bucket + "/" + fileName;
    }

    public void deleteFile(String fileUrl) {
        try {
            String prefix = supabaseUrl + "/storage/v1/object/public/" + bucket + "/";
            if (!fileUrl.startsWith(prefix)) return;
            String path = fileUrl.substring(prefix.length());
            String body = "[\"" + path.replace("\"", "\\\"") + "\"]";

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(supabaseUrl + "/storage/v1/object/" + bucket))
                .header("Authorization", "Bearer " + supabaseKey)
                .header("Content-Type", "application/json")
                .method("DELETE", HttpRequest.BodyPublishers.ofString(body))
                .build();

            httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (Exception ignored) {}
    }
}
