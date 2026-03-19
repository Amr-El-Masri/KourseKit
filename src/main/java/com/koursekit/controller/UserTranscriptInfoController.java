package com.koursekit.controller;

import com.koursekit.model.User;
import com.koursekit.model.UserTranscriptInfo;
import com.koursekit.repository.UserRepo;
import com.koursekit.repository.UserTranscriptInfoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/transcript-info")
public class UserTranscriptInfoController {

    private final UserTranscriptInfoRepository repo;
    private final UserRepo userRepo;

    public UserTranscriptInfoController(UserTranscriptInfoRepository repo, UserRepo userRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
    }

    private Long currentUserId() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return user.getId();
    }

    @GetMapping
    public ResponseEntity<?> get() {
        Optional<UserTranscriptInfo> info = repo.findByUserId(currentUserId());
        if (info.isEmpty()) return ResponseEntity.noContent().build();
        UserTranscriptInfo t = info.get();
        return ResponseEntity.ok(Map.of(
                "uploadedAt", t.getUploadedAt().toString(),
                "semesterCount", t.getSemesterCount(),
                "courseCount", t.getCourseCount(),
                "semIds", t.getSemIds() != null ? t.getSemIds() : "[]"
        ));
    }

    @PutMapping
    public ResponseEntity<Void> save(@RequestBody Map<String, Object> body) {
        Long uid = currentUserId();
        User user = userRepo.findById(uid).orElseThrow();
        String uploadedAt = (String) body.get("uploadedAt");
        int semesterCount = ((Number) body.get("semesterCount")).intValue();
        int courseCount   = ((Number) body.get("courseCount")).intValue();
        String semIds     = (String) body.get("semIds");

        Optional<UserTranscriptInfo> existing = repo.findByUserId(uid);
        if (existing.isPresent()) {
            UserTranscriptInfo t = existing.get();
            t.setUploadedAt(LocalDateTime.parse(uploadedAt));
            t.setSemesterCount(semesterCount);
            t.setCourseCount(courseCount);
            t.setSemIds(semIds);
            repo.save(t);
        } else {
            repo.save(new UserTranscriptInfo(user, LocalDateTime.parse(uploadedAt), semesterCount, courseCount, semIds));
        }
        return ResponseEntity.ok().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> delete() {
        repo.deleteByUserId(currentUserId());
        return ResponseEntity.noContent().build();
    }
}
