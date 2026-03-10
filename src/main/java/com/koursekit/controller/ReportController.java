package com.koursekit.controller;

import com.koursekit.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired private ReportService reportService;

    // POST /api/reports/review/{reviewId}?userId=...&reason=...
    @PostMapping("/review/{reviewId}")
    public ResponseEntity<?> reportCourseReview(
            @PathVariable Long reviewId,
            @RequestParam String userId,
            @RequestParam(required = false, defaultValue = "No reason provided") String reason) {
        try {
            reportService.reportCourseReview(reviewId, userId, reason);
            return ResponseEntity.ok("Review reported successfully.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // POST /api/reports/professor-review/{reviewId}?userId=...&reason=...
    @PostMapping("/professor-review/{reviewId}")
    public ResponseEntity<?> reportProfessorReview(
            @PathVariable Long reviewId,
            @RequestParam String userId,
            @RequestParam(required = false, defaultValue = "No reason provided") String reason) {
        try {
            reportService.reportProfessorReview(reviewId, userId, reason);
            return ResponseEntity.ok("Review reported successfully.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}