package com.koursekit.controller;

import com.koursekit.model.ProfessorReview;
import com.koursekit.service.ProfessorReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/professor-reviews")
public class ProfessorReviewController {

    @Autowired private ProfessorReviewService professorReviewService;

    // POST http://localhost:8080/api/professor-reviews/submit
    @PostMapping("/submit")
    public ResponseEntity<?> submit(
            @RequestParam String professorName,
            @RequestParam String comment,
            @RequestParam int rating,
            @RequestParam String userId) {

        try {
            ProfessorReview review = professorReviewService.submitReview(professorName, comment, rating, userId);
            return ResponseEntity.ok(review);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET http://localhost:8080/api/professor-reviews?professorName=Dr.+Mohammad+Sakr
    @GetMapping
    public List<ProfessorReview> getReviews(@RequestParam String professorName) {
        return professorReviewService.getReviewsForProfessor(professorName);
    }
}