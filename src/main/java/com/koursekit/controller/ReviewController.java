package com.koursekit.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.koursekit.model.Review;
import com.koursekit.service.ReviewService;

@RestController
@RequestMapping("/api/reviews") // All URLs in this class start with this
//if the frontend(soph) cant connnect because they have a diff origin, uncomment the below
//@CrossOrigin(origins="*")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;


    // 2. URL to Submit a Review: POST http://localhost:8080/api/reviews/submit
    @PostMapping("/submit")
    public ResponseEntity<?> addReview(
            @RequestParam Long sectionId,
            @RequestParam String comment,
            @RequestParam int rating,
            @RequestParam String userId) {

        if (comment == null || comment.isBlank())
            return ResponseEntity.badRequest().body("Review comment cannot be empty.");
        if (rating < 1 || rating > 5)
            return ResponseEntity.badRequest().body("Rating must be between 1 and 5.");
        try {
            Review review = reviewService.submitReview(sectionId, comment, rating, userId);
            return ResponseEntity.ok(review);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // url to View Reviews: GET http://localhost:8080/api/reviews/course/5
    //this is for getting reviews for a course in general
    @GetMapping("/course/{courseId}")
    public List<Review> getReviews(@PathVariable Long courseId) {
        return reviewService.getApprovedReviewsForCourse(courseId);
    }

    // this is for getting review for a specific section of a course (which means for a specific professor)
    @GetMapping("/section/{sectionId}")
    public List<Review> getReviewsBySection(@PathVariable Long sectionId) {
        return reviewService.getApprovedReviewsForSection(sectionId);
    }

    // GET /api/reviews/recent?limit=10
    @GetMapping("/recent")
    public List<Map<String, Object>> getRecentReviews(@RequestParam(defaultValue = "10") int limit) {
        return reviewService.getRecentApprovedReviews(limit).stream().map(r -> {
            Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("id",        r.getId());
            m.put("comment",   r.getComment());
            m.put("rating",    r.getRating());
            m.put("status",    r.getStatus());
            m.put("createdAt", r.getCreatedAt());
            if (r.getSection() != null) {
                Map<String, Object> sec = new java.util.LinkedHashMap<>();
                sec.put("sectionNumber", r.getSection().getSectionNumber());
                sec.put("professorName", r.getSection().getProfessorName());
                if (r.getSection().getCourse() != null) {
                    Map<String, Object> course = new java.util.LinkedHashMap<>();
                    course.put("courseCode", r.getSection().getCourse().getCourseCode());
                    course.put("title",      r.getSection().getCourse().getTitle());
                    sec.put("course", course);
                }
                m.put("section", sec);
            }
            return m;
        }).toList();
    }

    // GET /api/reviews/my?userId=...
    @GetMapping("/my")
    public List<Map<String, Object>> getMyReviews(@RequestParam String userId) {
        return reviewService.getReviewsByUser(userId).stream().map(r -> {
            Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("id",        r.getId());
            m.put("comment",   r.getComment());
            m.put("rating",    r.getRating());
            m.put("status",    r.getStatus());
            m.put("createdAt", r.getCreatedAt());
            // Build section info manually to include course
            if (r.getSection() != null) {
                Map<String, Object> sec = new java.util.LinkedHashMap<>();
                sec.put("sectionNumber",  r.getSection().getSectionNumber());
                sec.put("professorName",  r.getSection().getProfessorName());
                if (r.getSection().getCourse() != null) {
                    Map<String, Object> course = new java.util.LinkedHashMap<>();
                    course.put("courseCode", r.getSection().getCourse().getCourseCode());
                    course.put("title",      r.getSection().getCourse().getTitle());
                    sec.put("course", course);
                }
                m.put("section", sec);
            }
            return m;
        }).toList();
    }
}