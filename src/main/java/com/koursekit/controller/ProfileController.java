package com.koursekit.controller;

import java.util.HashMap;
import java.util.Map;

import com.fasterxml.jackson.core.type.TypeReference;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.koursekit.model.User;
import com.koursekit.repository.UserRepo;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    private final UserRepo userRepo;
    @Autowired
    private ObjectMapper objectMapper;

    public ProfileController(UserRepo userRepo) { this.userRepo = userRepo; }

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
        if (body.containsKey("minorFaculty"))  user.setMinorFaculty((String) body.get("minorFaculty"));
        if (body.containsKey("doubleMinor"))   user.setDoubleMinor(Boolean.TRUE.equals(body.get("doubleMinor")));
        if (body.containsKey("secondMinor"))   user.setSecondMinor((String) body.get("secondMinor"));
        if (body.containsKey("secondMinorFaculty")) user.setSecondMinorFaculty((String) body.get("secondMinorFaculty"));

        userRepo.save(user);
        return ResponseEntity.ok(toMap(user));
    }

    @GetMapping("/colors")
    public ResponseEntity<Map<String, Object>> getColors() {
        User user = getAuthenticatedUser();
        try {
            String json = user.getCourseColorsJson();
            if (json != null && !json.isBlank())
                return ResponseEntity.ok(objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {}));
        } catch (Exception ignored) {}
        return ResponseEntity.ok(new HashMap<>());
    }

    @PutMapping("/colors")
    public ResponseEntity<Map<String, Object>> updateColors(@RequestBody Map<String, Object> colors) {
        User user = getAuthenticatedUser();
        try {
            user.setCourseColorsJson(objectMapper.writeValueAsString(colors));
            userRepo.save(user);
        } catch (Exception ignored) {}
        return ResponseEntity.ok(colors);
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
        m.put("minorFaculty", user.getMinorFaculty() != null ? user.getMinorFaculty() : "");
        m.put("doubleMinor",   user.isDoubleMinor());
        m.put("secondMinor",   user.getSecondMinor()   != null ? user.getSecondMinor()   : "");
        m.put("secondMinorFaculty", user.getSecondMinorFaculty() != null ? user.getSecondMinorFaculty() : "");
        return m;
    }

    private User getAuthenticatedUser() { return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal(); }
}
