package com.koursekalculator.controller;

import com.koursekalculator.dto.*;
import com.koursekalculator.service.GPAService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/gpa")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class GPAController {

    @Autowired
    private GPAService gpaService;

    @PostMapping("/semester")
    public ResponseEntity<SemesterGPAResponse> calculateSemesterGPA(
            @RequestBody SemesterGPARequest request) {
        try {
            double gpa = gpaService.calculateSemesterGPA(request);
            return ResponseEntity.ok(new SemesterGPAResponse(gpa, "Success"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(new SemesterGPAResponse(0.0, "Error: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(new SemesterGPAResponse(0.0, "Server error: " + e.getMessage()));
        }
    }

    @PostMapping("/cumulative")
    public ResponseEntity<CumulativeGPAResponse> calculateCumulativeGPA(
            @RequestBody CumulativeGPARequest request) {
        try {
            CumulativeGPAResponse response = gpaService.calculateCumulativeGPA(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(new CumulativeGPAResponse(0.0, 0, "Error: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(new CumulativeGPAResponse(0.0, 0, "Server error: " + e.getMessage()));
        }
    }

    @PostMapping("/course-grade")
    public ResponseEntity<CourseGradeResponse> calculateCourseGrade(
            @RequestBody CourseGradeRequest request) {
        try {
            CourseGradeResponse response = gpaService.calculateCourseGrade(request);
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
            SimulationResponse response = gpaService.simulateGradeChange(request);
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
            RequiredFinalGradeResponse response = gpaService.calculateRequiredFinalGrade(request);
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
        return ResponseEntity.ok(gpaService.getGradeBoundaries());
    }

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("GPA Calculator Service is running");
    }
}
