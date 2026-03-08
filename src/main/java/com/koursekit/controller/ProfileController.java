package com.koursekit.controller;

import com.koursekit.model.User;
import com.koursekit.repository.UserRepo;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final UserRepo userRepo;

    public ProfileController(UserRepo userRepo) {
        this.userRepo = userRepo;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getProfile() {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(toMap(user));
    }

    @PutMapping
    public ResponseEntity<Map<String, Object>> updateProfile(@RequestBody Map<String, Object> body) {
        User user = getAuthenticatedUser();

        if (body.containsKey("firstName"))     user.setFirstName((String) body.get("firstName"));
        if (body.containsKey("lastName"))      user.setLastName((String) body.get("lastName"));
        if (body.containsKey("faculty"))       user.setFaculty((String) body.get("faculty"));
        if (body.containsKey("major"))         user.setMajor((String) body.get("major"));
        if (body.containsKey("secondMajor"))   user.setSecondMajor((String) body.get("secondMajor"));
        if (body.containsKey("secondFaculty")) user.setSecondFaculty((String) body.get("secondFaculty"));
        if (body.containsKey("status"))        user.setStatus((String) body.get("status"));
        if (body.containsKey("cumGPA"))        user.setCumGPA((String) body.get("cumGPA"));
        if (body.containsKey("totalCredits"))  user.setTotalCredits((String) body.get("totalCredits"));
        if (body.containsKey("bio"))           user.setBio((String) body.get("bio"));
        if (body.containsKey("avatar"))        user.setAvatar((String) body.get("avatar"));
        if (body.containsKey("doubleMajor"))   user.setDoubleMajor(Boolean.TRUE.equals(body.get("doubleMajor")));
        if (body.containsKey("minor"))         user.setMinor(Boolean.TRUE.equals(body.get("minor")));
        if (body.containsKey("minorName"))     user.setMinorName((String) body.get("minorName"));

        userRepo.save(user);
        return ResponseEntity.ok(toMap(user));
    }

    private Map<String, Object> toMap(User user) {
        Map<String, Object> m = new HashMap<>();
        m.put("email",         user.getEmail());
        m.put("firstName",     user.getFirstName()     != null ? user.getFirstName()     : "");
        m.put("lastName",      user.getLastName()      != null ? user.getLastName()      : "");
        m.put("faculty",       user.getFaculty()       != null ? user.getFaculty()       : "Arts & Sciences");
        m.put("major",         user.getMajor()         != null ? user.getMajor()         : "Computer Science");
        m.put("secondMajor",   user.getSecondMajor()   != null ? user.getSecondMajor()   : "");
        m.put("secondFaculty", user.getSecondFaculty() != null ? user.getSecondFaculty() : "Arts & Sciences");
        m.put("status",        user.getStatus()        != null ? user.getStatus()        : "freshman");
        m.put("cumGPA",        user.getCumGPA()        != null ? user.getCumGPA()        : "");
        m.put("totalCredits",  user.getTotalCredits()  != null ? user.getTotalCredits()  : "");
        m.put("bio",           user.getBio()           != null ? user.getBio()           : "");
        m.put("avatar",        user.getAvatar()        != null ? user.getAvatar()        : "");
        m.put("doubleMajor",   user.isDoubleMajor());
        m.put("minor",         user.isMinor());
        m.put("minorName",     user.getMinorName()     != null ? user.getMinorName()     : "");
        return m;
    }

    private User getAuthenticatedUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
