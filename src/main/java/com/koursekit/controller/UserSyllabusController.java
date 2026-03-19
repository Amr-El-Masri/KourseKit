package com.koursekit.controller;

import com.koursekit.model.User;
import com.koursekit.model.UserSyllabus;
import com.koursekit.repository.UserRepo;
import com.koursekit.repository.UserSyllabusRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user-syllabi")
public class UserSyllabusController {

    private final UserSyllabusRepository repo;
    private final UserRepo userRepo;

    public UserSyllabusController(UserSyllabusRepository repo, UserRepo userRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
    }

    private Long currentUserId() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return user.getId();
    }

    /** Returns all syllabi as { "CMPS 261": {...json...}, ... } */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAll() {
        Long uid = currentUserId();
        List<UserSyllabus> list = repo.findByUserId(uid);
        Map<String, Object> result = list.stream().collect(
                Collectors.toMap(UserSyllabus::getCourseName, s -> parseJson(s.getData()))
        );
        return ResponseEntity.ok(result);
    }

    /** Save or update a syllabus for a course */
    @PutMapping("/{courseName}")
    public ResponseEntity<Void> save(@PathVariable String courseName, @RequestBody String data) {
        Long uid = currentUserId();
        User user = userRepo.findById(uid).orElseThrow();
        Optional<UserSyllabus> existing = repo.findByUserIdAndCourseName(uid, courseName);
        if (existing.isPresent()) {
            existing.get().setData(data);
            repo.save(existing.get());
        } else {
            repo.save(new UserSyllabus(user, courseName, data));
        }
        return ResponseEntity.ok().build();
    }

    /** Delete a syllabus for a course */
    @DeleteMapping("/{courseName}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable String courseName) {
        repo.deleteByUserIdAndCourseName(currentUserId(), courseName);
        return ResponseEntity.noContent().build();
    }

    private Object parseJson(String json) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            return mapper.readValue(json, Object.class);
        } catch (Exception e) {
            return json;
        }
    }
}
