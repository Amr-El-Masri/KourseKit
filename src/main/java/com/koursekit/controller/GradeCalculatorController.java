package com.koursekit.controller;

import com.koursekit.dto.*;
import com.koursekit.service.GradeCalculatorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/grades")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class GradeCalculatorController {

    @Autowired
    private GradeCalculatorService gradeCalculatorService;

    @PostMapping("/semester")
    public ResponseEntity<SemesterGradeResponse> calculateSemesterGPA(
            @RequestBody SemesterGradeRequest request) {
        try {
            double gpa = gradeCalculatorService.calculateSemesterGPA(request);
            return ResponseEntity.ok(new SemesterGradeResponse(gpa, "Success"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(new SemesterGradeResponse(0.0, "Error: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(new SemesterGradeResponse(0.0, "Server error: " + e.getMessage()));
        }
    }

    @PostMapping("/cumulative")
    public ResponseEntity<CumulativeGradeResponse> calculateCumulativeGPA(
            @RequestBody CumulativeGradeRequest request) {
        try {
            CumulativeGradeResponse response = gradeCalculatorService.calculateCumulativeGPA(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(new CumulativeGradeResponse(0.0, 0, "Error: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(new CumulativeGradeResponse(0.0, 0, "Server error: " + e.getMessage()));
        }
    }

    @PostMapping("/course-grade")
    public ResponseEntity<CourseGradeResponse> calculateCourseGrade(
            @RequestBody CourseGradeRequest request) {
        try {
            CourseGradeResponse response = gradeCalculatorService.calculateCourseGrade(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(new CourseGradeResponse(0.0, "F", "Error: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(new CourseGradeResponse(0.0, "F", "Server error: " + e.getMessage()));
        }
    }

    @PostMapping("/simulate")
    public ResponseEntity<SimulationResponse> simulateGradeChange(
            @RequestBody SimulationRequest request) {
        try {
            SimulationResponse response = gradeCalculatorService.simulateGradeChange(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(new SimulationResponse(0.0, "F", 0.0, 0.0, "Error: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(new SimulationResponse(0.0, "F", 0.0, 0.0, "Server error: " + e.getMessage()));
        }
    }

    @PostMapping("/required-final")
    public ResponseEntity<RequiredFinalGradeResponse> calculateRequiredFinalGrade(
            @RequestBody RequiredFinalGradeRequest request) {
        try {
            RequiredFinalGradeResponse response = gradeCalculatorService.calculateRequiredFinalGrade(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(new RequiredFinalGradeResponse(0.0, false, "Error: " + e.getMessage(), "F"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(new RequiredFinalGradeResponse(0.0, false, "Server error: " + e.getMessage(), "F"));
        }
    }

    @GetMapping("/grade-boundaries")
    public ResponseEntity<Map<String, String>> getGradeBoundaries() {
        return ResponseEntity.ok(gradeCalculatorService.getGradeBoundaries());
    }

    @GetMapping("/quality-points")
    public ResponseEntity<Map<String, Double>> getQualityPoints() {
        return ResponseEntity.ok(gradeCalculatorService.getQualityPoints());
    }

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("Grade Calculator Service is running");
    }

    @PostMapping("/highest-impact")
    public ResponseEntity<HighestImpactResponse> findHighestImpactCourse(
            @RequestBody HighestImpactRequest request) {
        try {
            HighestImpactResponse response = gradeCalculatorService.findHighestImpactCourse(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(new HighestImpactResponse(-1, "", "", 0, "Error: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(new HighestImpactResponse(-1, "", "", 0, "Server error: " + e.getMessage()));
        }
    }

    @PostMapping("/required-future-gpa")
    public ResponseEntity<RequiredFutureGradeResponse> calculateRequiredFutureGPA(
            @RequestBody RequiredFutureGradeRequest request) {
        try {
            RequiredFutureGradeResponse response = gradeCalculatorService.calculateRequiredFutureGPA(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(new RequiredFutureGradeResponse(0.0, false, "Error: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(new RequiredFutureGradeResponse(0.0, false, "Server error: " + e.getMessage()));
        }
    }
}
