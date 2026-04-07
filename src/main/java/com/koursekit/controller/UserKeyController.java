package com.koursekit.controller;

import com.koursekit.dto.UserKeyDTO;
import com.koursekit.model.User;
import com.koursekit.repository.UserRepo;

import io.micrometer.core.ipc.http.HttpSender.Response;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/keys")
public class UserKeyController {
    private final UserRepo userRepo;

    public UserKeyController(UserRepo userRepo) {
        this.userRepo = userRepo; }

    private User currentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal(); }

    @PostMapping
    public ResponseEntity<?> uploadPublicKey(@RequestBody Map<String, String> body) {
        String publicKey = body.get("publicKey");

        if (publicKey == null || publicKey.isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Public key is required"));

        User user = currentUser();
        user.setPublicKey(publicKey);
        userRepo.save(user);
        return ResponseEntity.ok(Map.of("message", "Public key uploaded successfully"));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getPublicKey(@PathVariable Long userId) {
        return userRepo.findById(userId)
                .map(u -> {
                    if (u.getPublicKey() == null)
                        return ResponseEntity.notFound().<UserKeyDTO>build();
                    return ResponseEntity.ok(new UserKeyDTO(u.getId(), u.getPublicKey()));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/batch")
    public ResponseEntity<?> getPublicKeys(@RequestBody Map<String, Object> body) {
        var ids = (java.util.List<?>) body.get("userIds");
        if (ids == null || ids.isEmpty()) 
            return ResponseEntity.badRequest().body(Map.of("message", "userIds list is required"));

        var keys = ids.stream()
                .map(id -> Long.parseLong(id.toString()))
                .map(id -> userRepo.findById(id).orElse(null))
                .filter(u -> u != null && u.getPublicKey() != null)
                .map(u -> new UserKeyDTO(u.getId(), u.getPublicKey()))
                .toList();

        return ResponseEntity.ok(keys);
    }

    @GetMapping("/me")
    public ResponseEntity<?> myKey() {
        User user = currentUser();
        if (user.getPublicKey() == null)
            return ResponseEntity.ok(Map.of("hasKey", false));
        return ResponseEntity.ok(Map.of("hasKey", true, "publicKey", user.getPublicKey()));
    }

    @PostMapping("/private")
    public ResponseEntity<?> uploadEncryptedPrivateKey(@RequestBody Map<String, String> body) {
        String encryptedPrivateKey = body.get("encryptedPrivateKey");
        if (encryptedPrivateKey == null || encryptedPrivateKey.isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "encryptedPrivateKey is required"));
        User user = currentUser();
        user.setEncryptedPrivateKey(encryptedPrivateKey);
        userRepo.save(user);
        return ResponseEntity.ok(Map.of("message", "Encrypted private key stored"));
    }

    @GetMapping("/private")
    public ResponseEntity<?> getEncryptedPrivateKey() {
        User user = currentUser();
        if (user.getEncryptedPrivateKey() == null)
            return ResponseEntity.ok(Map.of("hasKey", false));
        return ResponseEntity.ok(Map.of("hasKey", true, "encryptedPrivateKey", user.getEncryptedPrivateKey()));
    }
}
