package com.koursekit.controller;

import com.koursekit.dto.SaveGradeDataRequest;
import com.koursekit.dto.SavedSemesterResponse;
import com.koursekit.model.User;
import com.koursekit.service.SavedGradeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/grades/saved")
public class SavedGradeController {

    private final SavedGradeService savedGradeService;

    public SavedGradeController(SavedGradeService savedGradeService) {
        this.savedGradeService = savedGradeService;
    }

    @PostMapping
    public ResponseEntity<SavedSemesterResponse> saveSemester(@RequestBody SaveGradeDataRequest request) {
        try {
            User user = getAuthenticatedUser();
            SavedSemesterResponse response = savedGradeService.saveSemester(user, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new SavedSemesterResponse(null, null, null, null, "Error: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<SavedSemesterResponse>> getSemesters() {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(savedGradeService.getSemesters(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SavedSemesterResponse> getSemesterById(@PathVariable Long id) {
        try {
            User user = getAuthenticatedUser();
            return ResponseEntity.ok(savedGradeService.getSemesterById(user, id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new SavedSemesterResponse(null, null, null, null, "Error: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<SavedSemesterResponse> updateSemester(@PathVariable Long id,
                                                                 @RequestBody SaveGradeDataRequest request) {
        try {
            User user = getAuthenticatedUser();
            SavedSemesterResponse response = savedGradeService.updateSemester(user, id, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new SavedSemesterResponse(null, null, null, null, "Error: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSemester(@PathVariable Long id) {
        try {
            User user = getAuthenticatedUser();
            savedGradeService.deleteSemester(user, id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/template")
    public ResponseEntity<SavedSemesterResponse> getTemplate() {
        User user = getAuthenticatedUser();
        return savedGradeService.getTemplate(user)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PutMapping("/{id}/template")
    public ResponseEntity<SavedSemesterResponse> setTemplate(@PathVariable Long id) {
        try {
            User user = getAuthenticatedUser();
            return ResponseEntity.ok(savedGradeService.setTemplate(user, id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}/template")
    public ResponseEntity<Void> clearTemplate(@PathVariable Long id) {
        try {
            User user = getAuthenticatedUser();
            savedGradeService.clearTemplate(user, id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    private User getAuthenticatedUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
