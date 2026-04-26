package com.koursekit.controller;

import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.koursekit.model.User;
import com.koursekit.repository.UserRepo;

@RestController
@RequestMapping("/api/students")

public class StudentController {
    private final UserRepo userRepo;

    public StudentController(UserRepo userRepo) { this.userRepo = userRepo; }

    //this next part would allow the user to search for other users / students, but exclude their own account from the search results
    @GetMapping("/search")
    public ResponseEntity<List<Map<String, Object>>> searchStudents(@RequestParam(defaultValue = "") String query) {
        User currentUser = getAuthenticatedUser();

        List<User> queryResults = query.isBlank()
            ? userRepo.findAll()
            : userRepo.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrEmailContainingIgnoreCase(query, query, query); 

        List<Map<String, Object>> output = queryResults.stream()
        .filter(user -> !user.getId().equals(currentUser.getId()))
        .filter(User::isActive)
        .map(this::toPublicMap)
        .toList();

        return ResponseEntity.ok(output);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getStudent(@PathVariable Long id) {
        return userRepo.findById(id)
            .map(user -> ResponseEntity.ok(toPublicMap(user)))
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/by-email")
    public ResponseEntity<Map<String, Object>> getStudentByEmail(@RequestParam String email) {
        return userRepo.findByEmail(email)
            .map(user -> ResponseEntity.ok(toPublicMap(user)))
            .orElse(ResponseEntity.notFound().build());
    }

    private Map<String, Object> toPublicMap(User user) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",           user.getId());
        m.put("firstName",    user.getFirstName()  != null ? user.getFirstName()  : "");
        m.put("lastName",     user.getLastName()   != null ? user.getLastName()   : "");
        m.put("faculty",      user.getFaculty()    != null ? user.getFaculty()    : "");
        m.put("major",        user.getMajor()      != null ? user.getMajor()      : "");
        m.put("status",       user.getStatus()     != null ? user.getStatus()     : "");
        m.put("bio",          user.getBio()        != null ? user.getBio()        : "");
        m.put("avatar",       user.getAvatar()     != null ? user.getAvatar()     : "");
        m.put("doubleMajor",  user.isDoubleMajor());
        m.put("secondMajor",  user.getSecondMajor() != null ? user.getSecondMajor() : "");
        m.put("minor",        user.isMinor());
        m.put("minorName",    user.getMinorName()  != null ? user.getMinorName()  : "");
        m.put("doubleMinor",  user.isDoubleMinor());
        m.put("secondMinor",  user.getSecondMinor() != null ? user.getSecondMinor() : "");
        m.put("tripleMinor",  user.isTripleMinor());
        m.put("thirdMinor",   user.getThirdMinor()  != null ? user.getThirdMinor()  : "");
        m.put("email",        user.getEmail()      != null ? user.getEmail()      : "");
        return m;
    }
        
    private User getAuthenticatedUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal(); }
    }
