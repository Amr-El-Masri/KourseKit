package com.koursekit.controller;

import com.koursekit.service.SyllabusService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/syllabus")
public class SyllabusController {

    private final SyllabusService syllabusService;

    public SyllabusController(SyllabusService syllabusService) {
        this.syllabusService = syllabusService;
    }

    @PostMapping("/extract")
    public ResponseEntity<?> extract(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, Object> result = syllabusService.extract(file);
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(503).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Extraction failed: " + e.getMessage()));
        }
    }
}
