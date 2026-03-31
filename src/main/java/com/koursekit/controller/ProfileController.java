package com.koursekit.controller;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.core.type.TypeReference;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.koursekit.model.DefaultScheduleSlot;
import com.koursekit.model.User;
import com.koursekit.repository.DefaultScheduleSlotRepository;
import com.koursekit.repository.UserRepo;
import com.koursekit.service.StudyPlanService;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    private final UserRepo userRepo;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private DefaultScheduleSlotRepository defaultSlotRepo;
    @Autowired
    private StudyPlanService studyPlanService;

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
        if (body.containsKey("doubleMinor"))   user.setDoubleMinor(Boolean.TRUE.equals(body.get("doubleMinor")));
        if (body.containsKey("secondMinor"))   user.setSecondMinor((String) body.get("secondMinor"));
        if (body.containsKey("tripleMinor"))       user.setTripleMinor(Boolean.TRUE.equals(body.get("tripleMinor")));
        if (body.containsKey("thirdMinor"))        user.setThirdMinor((String) body.get("thirdMinor"));
        if (body.containsKey("graduationYear"))    user.setGraduationYear((String) body.get("graduationYear"));
        if (body.containsKey("linkedin"))          user.setLinkedin((String) body.get("linkedin"));
        if (body.containsKey("github"))            user.setGithub((String) body.get("github"));
        if (body.containsKey("openToStudyGroups")) user.setOpenToStudyGroups(Boolean.TRUE.equals(body.get("openToStudyGroups")));
        if (body.containsKey("interests"))         user.setInterests((String) body.get("interests"));

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

    @PutMapping("/theme")
    public ResponseEntity<Map<String, Object>> updateTheme(@RequestBody Map<String, String> body) {
        User user = getAuthenticatedUser();
        String theme = body.getOrDefault("theme", "light");
        user.setTheme(theme);
        userRepo.save(user);
        Map<String, Object> resp = new HashMap<>();
        resp.put("theme", theme);
        return ResponseEntity.ok(resp);
    }

    @PutMapping("/email-reminders")
    public ResponseEntity<Map<String, Object>> updateEmailReminders(@RequestBody Map<String, Object> body) {
        User user = getAuthenticatedUser();
        user.setEmailRemindersEnabled(Boolean.TRUE.equals(body.get("emailRemindersEnabled")));
        userRepo.save(user);
        Map<String, Object> resp = new HashMap<>();
        resp.put("emailRemindersEnabled", user.isEmailRemindersEnabled());
        return ResponseEntity.ok(resp);
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

    @GetMapping("/default-schedule")
    public ResponseEntity<List<Map<String, Object>>> getDefaultSchedule(
            @RequestParam(required = false) String semester) {
        User user = getAuthenticatedUser();
        List<DefaultScheduleSlot> slots = (semester != null && !semester.isBlank())
                ? defaultSlotRepo.findByUserIdAndSemesterName(user.getId(), semester)
                : defaultSlotRepo.findByUserId(user.getId());
        List<Map<String, Object>> result = new ArrayList<>();
        for (DefaultScheduleSlot s : slots) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", s.getId());
            m.put("dayKey", s.getDayKey());
            m.put("startTime", s.getStartTime().toString());
            m.put("endTime", s.getEndTime().toString());
            m.put("semesterName", s.getSemesterName());
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }

    @PutMapping("/default-schedule")
    @Transactional
    public ResponseEntity<List<Map<String, Object>>> saveDefaultSchedule(
            @RequestParam(required = false) String semester,
            @RequestBody List<Map<String, Object>> slots) {
        User user = getAuthenticatedUser();
        if (semester != null && !semester.isBlank()) {
            defaultSlotRepo.deleteByUserIdAndSemesterName(user.getId(), semester);
        } else {
            defaultSlotRepo.deleteByUserId(user.getId());
        }
        List<DefaultScheduleSlot> toSave = new ArrayList<>();
        for (Map<String, Object> s : slots) {
            DefaultScheduleSlot slot = new DefaultScheduleSlot();
            slot.setUser(user);
            slot.setDayKey((String) s.get("dayKey"));
            slot.setStartTime(LocalTime.parse((String) s.get("startTime")));
            slot.setEndTime(LocalTime.parse((String) s.get("endTime")));
            slot.setSemesterName(semester != null ? semester : (String) s.get("semesterName"));
            toSave.add(slot);
        }
        List<DefaultScheduleSlot> saved = defaultSlotRepo.saveAll(toSave);
        List<Map<String, Object>> result = new ArrayList<>();
        for (DefaultScheduleSlot s : saved) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", s.getId());
            m.put("dayKey", s.getDayKey());
            m.put("startTime", s.getStartTime().toString());
            m.put("endTime", s.getEndTime().toString());
            m.put("semesterName", s.getSemesterName());
            result.add(m);
        }
        // Clear slots for weeks with no generated plan so they re-seed from the new default
        studyPlanService.syncSlotsFromDefault(user.getId());
        return ResponseEntity.ok(result);
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
        m.put("doubleMinor",   user.isDoubleMinor());
        m.put("secondMinor",   user.getSecondMinor()   != null ? user.getSecondMinor()   : "");
        m.put("tripleMinor",   user.isTripleMinor());
        m.put("thirdMinor",    user.getThirdMinor()    != null ? user.getThirdMinor()    : "");
        m.put("theme",               user.getTheme()          != null ? user.getTheme()          : "light");
        m.put("emailRemindersEnabled", user.isEmailRemindersEnabled());
        m.put("graduationYear",      user.getGraduationYear() != null ? user.getGraduationYear() : "");
        m.put("linkedin",            user.getLinkedin()       != null ? user.getLinkedin()        : "");
        m.put("github",              user.getGithub()         != null ? user.getGithub()          : "");
        m.put("openToStudyGroups",   user.isOpenToStudyGroups());
        m.put("interests",           user.getInterests()      != null ? user.getInterests()       : "");
        m.put("strikeCount",         user.getStrikeCount());
        return m;
    }

    @GetMapping("/notification-prefs")
    public ResponseEntity<Map<String, Object>> getNotifPrefs() {
        User user = getAuthenticatedUser();
        try {
            String json = user.getNotificationPrefsJson();
            if (json != null && !json.isBlank())
                return ResponseEntity.ok(objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {}));
        } catch (Exception ignored) {}
        Map<String, Object> defaults = new HashMap<>();
        defaults.put("overdue", true);
        defaults.put("dueToday", true);
        defaults.put("threeDays", true);
        return ResponseEntity.ok(defaults);
    }

    @PutMapping("/notification-prefs")
    public ResponseEntity<Map<String, Object>> updateNotifPrefs(@RequestBody Map<String, Object> body) {
        User user = getAuthenticatedUser();
        try {
            user.setNotificationPrefsJson(objectMapper.writeValueAsString(body));
            userRepo.save(user);
        } catch (Exception ignored) {}
        return ResponseEntity.ok(body);
    }

    @DeleteMapping
    public ResponseEntity<Map<String, Object>> deleteAccount() {
        User user = getAuthenticatedUser();
        userRepo.delete(user);
        Map<String, Object> resp = new HashMap<>();
        resp.put("deleted", true);
        return ResponseEntity.ok(resp);
    }

    private User getAuthenticatedUser() { return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal(); }
}
