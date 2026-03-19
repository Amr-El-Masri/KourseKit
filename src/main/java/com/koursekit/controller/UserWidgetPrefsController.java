package com.koursekit.controller;

import com.koursekit.model.User;
import com.koursekit.model.UserWidgetPrefs;
import com.koursekit.repository.UserRepo;
import com.koursekit.repository.UserWidgetPrefsRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/widget-prefs")
public class UserWidgetPrefsController {

    private final UserWidgetPrefsRepository repo;
    private final UserRepo userRepo;

    public UserWidgetPrefsController(UserWidgetPrefsRepository repo, UserRepo userRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
    }

    private Long currentUserId() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return user.getId();
    }

    @GetMapping
    public ResponseEntity<String> get() {
        return repo.findByUserId(currentUserId())
                .map(p -> ResponseEntity.ok(p.getData()))
                .orElse(ResponseEntity.noContent().build());
    }

    @PutMapping
    public ResponseEntity<Void> save(@RequestBody String data) {
        Long uid = currentUserId();
        Optional<UserWidgetPrefs> existing = repo.findByUserId(uid);
        if (existing.isPresent()) {
            existing.get().setData(data);
            repo.save(existing.get());
        } else {
            User user = userRepo.findById(uid).orElseThrow();
            repo.save(new UserWidgetPrefs(user, data));
        }
        return ResponseEntity.ok().build();
    }
}
