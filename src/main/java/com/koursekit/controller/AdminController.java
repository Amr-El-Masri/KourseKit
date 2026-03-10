package com.koursekit.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.koursekit.config.EmailConfig;
import com.koursekit.dto.Admins;
import com.koursekit.model.ProfessorReview;
import com.koursekit.model.Review;
import com.koursekit.model.ReviewStatus;
import com.koursekit.model.User;
import com.koursekit.repository.ProfessorReviewRepository;
import com.koursekit.repository.ReviewRepository;
import com.koursekit.repository.UserRepo;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    @Autowired
    private UserRepo userrepo;
    @Autowired
    private EmailConfig emailconfig;
    @Autowired
    private ReviewRepository reviewrepo;
    @Autowired
    private ProfessorReviewRepository profReviewRepo;

    @GetMapping("/users")
    public List<Admins> getUsers(@RequestParam(required = false) String search) {
        List<User> users = (search != null && !search.isBlank())
            ? userrepo.findByEmailContainingIgnoreCase(search)
            : userrepo.findAll();
        return users.stream()
            .map(u -> new Admins(u.getId(), u.getEmail(), u.getRole(), u.isActive(), u.getCreatedAt()))
            .collect(Collectors.toList());
    }

    @PutMapping("/users/{userid}/deactivate")
    public ResponseEntity<?> deactivate(@PathVariable Long userid) {
        User user = userrepo.findById(userid)
            .orElseThrow(() -> new RuntimeException("User not found."));
        user.setActive(false);
        userrepo.save(user);
        try { emailconfig.deactivationmail(user.getEmail()); } catch (Exception e) { System.err.println("Deactivation email failed: " + e.getMessage()); }
        return ResponseEntity.ok("Account deactivated.");
    }

    @PutMapping("/users/{userid}/activate")
    public ResponseEntity<?> activate(@PathVariable Long userid) {
        User user = userrepo.findById(userid)
            .orElseThrow(() -> new RuntimeException("User not found."));
        user.setActive(true);
        userrepo.save(user);
        try { emailconfig.activationmail(user.getEmail()); } catch (Exception e) { System.err.println("Activation email failed: " + e.getMessage()); }
        return ResponseEntity.ok("Account activated.");
    }

    @PutMapping("/users/{userid}/promote")
    public ResponseEntity<?> promote(@PathVariable Long userid) {
        User user = userrepo.findById(userid)
            .orElseThrow(() -> new RuntimeException("User not found."));
        user.setRole("ADMIN");
        userrepo.save(user);
        return ResponseEntity.ok("User promoted to admin.");
    }

    @PutMapping("/users/{userid}/demote")
    public ResponseEntity<?> demote(@PathVariable Long userid, @AuthenticationPrincipal User currentUser) {
        if (currentUser.getId().equals(userid)) {
            return ResponseEntity.badRequest().body("Users cannot demote themselves.");
        }
        User user = userrepo.findById(userid)
            .orElseThrow(() -> new RuntimeException("User not found."));
        user.setRole("STUDENT");
        userrepo.save(user);
        return ResponseEntity.ok("User demoted to student.");
    }

    @GetMapping("/users/{userid}/reviews")
    public ResponseEntity<?> getUserReviews(@PathVariable Long userid) {
        User user = userrepo.findById(userid)
            .orElseThrow(() -> new RuntimeException("User not found."));
        List<Map<String, Object>> result = reviewrepo.findByUserId(user.getEmail()).stream().map(r -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", r.getId());
            m.put("comment", r.getComment());
            m.put("rating", r.getRating());
            m.put("createdAt", r.getCreatedAt());
            if (r.getSection() != null && r.getSection().getCourse() != null) {
                m.put("courseCode",  r.getSection().getCourse().getCourseCode());
                m.put("courseTitle", r.getSection().getCourse().getTitle());
            }
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    private Map<String, Object> reviewToMap(Review r) {
        Map<String, Object> m = new HashMap<>();
        m.put("id",        r.getId());
        m.put("comment",   r.getComment());
        m.put("rating",    r.getRating());
        m.put("userId",    r.getUserId());
        m.put("status",    r.getStatus());
        m.put("createdAt", r.getCreatedAt());
        if (r.getSection() != null && r.getSection().getCourse() != null) {
            m.put("courseCode",  r.getSection().getCourse().getCourseCode());
            m.put("courseTitle", r.getSection().getCourse().getTitle());
        }
        return m;
    }

    @GetMapping("/reviews")
    public List<Map<String, Object>> getAllReviews() {
        return reviewrepo.findAll().stream().map(this::reviewToMap).collect(Collectors.toList());
    }

    @GetMapping("/reviews/flagged")
    public List<Map<String, Object>> getFlaggedReviews() {
        return reviewrepo.findByStatus(ReviewStatus.FLAGGED).stream().map(this::reviewToMap).collect(Collectors.toList());
    }

    @DeleteMapping("/reviews/{reviewid}")
    public ResponseEntity<?> deleteReview(@PathVariable Long reviewid) {
        if (!reviewrepo.existsById(reviewid)) { return ResponseEntity.notFound().build(); }
        reviewrepo.deleteById(reviewid);
        return ResponseEntity.ok("Review deleted.");
    }

    @GetMapping("/users/{userid}/professor-reviews")
    public ResponseEntity<?> getUserProfReviews(@PathVariable Long userid) {
        User user = userrepo.findById(userid)
            .orElseThrow(() -> new RuntimeException("User not found."));
        return ResponseEntity.ok(profReviewRepo.findByUserId(user.getEmail()));
    }

    @GetMapping("/professor-reviews")
    public List<ProfessorReview> getAllProfReviews() { return profReviewRepo.findAll(); }

    @GetMapping("/professor-reviews/flagged")
    public List<ProfessorReview> getFlaggedProfReviews() { return profReviewRepo.findByStatus(ReviewStatus.FLAGGED); }

    @DeleteMapping("/professor-reviews/{reviewid}")
    public ResponseEntity<?> deleteProfReview(@PathVariable Long reviewid) {
        if (!profReviewRepo.existsById(reviewid)) { return ResponseEntity.notFound().build(); }
        profReviewRepo.deleteById(reviewid);
        return ResponseEntity.ok("Review deleted.");
    }
}
