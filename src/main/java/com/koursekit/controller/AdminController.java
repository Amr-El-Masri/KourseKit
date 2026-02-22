package com.koursekit.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.koursekit.dto.Admins;
import com.koursekit.model.Review;
import com.koursekit.model.User;
import com.koursekit.repository.ReviewRepository;
import com.koursekit.repository.UserRepo;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    @Autowired
    private UserRepo userrepo;
    @Autowired
    private ReviewRepository reviewrepo;

    @GetMapping("/users")
    public List<Admins> getUsers(@RequestParam(required = false) String search) {
        List<User> users = (search != null && !search.isBlank())
            ? userrepo.findByEmailContainingIgnoreCase(search)
            : userrepo.findAll();
        return users.stream()
            .map(u -> new Admins(u.getId(), u.getEmail(), u.getRole(), u.isActive(), u.getCreatedAt()))
            .collect(Collectors.toList());
    }

    @PutMapping("/users/{userId}/deactivate")
    public ResponseEntity<?> deactivate(@PathVariable Long userId) {
        User user = userrepo.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found."));
        user.setActive(false);
        userrepo.save(user);
        return ResponseEntity.ok("Account deactivated.");
    }

    @PutMapping("/users/{userId}/activate")
    public ResponseEntity<?> activate(@PathVariable Long userId) {
        User user = userrepo.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found."));
        user.setActive(true);
        userrepo.save(user);
        return ResponseEntity.ok("Account activated.");
    }

    @GetMapping("/reviews")
    public List<Review> getAllReviews() { return reviewrepo.findAll(); }

    @DeleteMapping("/reviews/{reviewId}")
    public ResponseEntity<?> deleteReview(@PathVariable Long reviewId) {
        if (!reviewrepo.existsById(reviewId)) { return ResponseEntity.notFound().build(); }
        reviewrepo.deleteById(reviewId);
        return ResponseEntity.ok("Review deleted.");
    }
}
