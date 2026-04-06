package com.koursekit.model;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name="users")
public class User {
    @Column(unique = true, nullable = false)
    private String email;
    @Column(nullable = false)
    private String pass;
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    @Column(name = "verification_token")
    private String token;
    @Column(name = "is_verified", nullable = false)
    private boolean verified = false;
    @Column(name = "token_expiry")
    private LocalDateTime tokenexpiration;
    @Column(name = "created_at")
    private LocalDateTime createdat=LocalDateTime.now();
    @Column(name = "role", nullable = false)
    private String role = "STUDENT";
    @Column(name = "is_active", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 1")
    private boolean active = true;

    @Column(name = "first_name")
    private String firstName;
    @Column(name = "last_name")
    private String lastName;
    @Column(name = "faculty")
    private String faculty;
    @Column(name = "major")
    private String major;
    @Column(name = "second_major")
    private String secondMajor;
    @Column(name = "second_faculty")
    private String secondFaculty;
    @Column(name = "status")
    private String status;
    @Column(name = "cum_gpa")
    private String cumGPA;
    @Column(name = "total_credits")
    private String totalCredits;
    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;
    @Column(name = "avatar", columnDefinition = "TEXT")
    private String avatar;
    @Column(name = "double_major", columnDefinition = "TINYINT(1) DEFAULT 0")
    private boolean doubleMajor = false;
    @Column(name = "minor_flag", columnDefinition = "TINYINT(1) DEFAULT 0")
    private boolean minor = false;
    @Column(name = "minor_name")
    private String minorName;
    @Column(name = "double_minor", columnDefinition = "TINYINT(1) DEFAULT 0")
    private boolean doubleMinor = false;
    @Column(name = "second_minor")
    private String secondMinor;
    @Column(name = "triple_minor", columnDefinition = "TINYINT(1) DEFAULT 0")
    private boolean tripleMinor = false;
    @Column(name = "third_minor")
    private String thirdMinor;
    @Column(name = "course_colors", columnDefinition = "TEXT")
    private String courseColorsJson;
    @Column(name = "theme", nullable = false, columnDefinition = "VARCHAR(20) DEFAULT 'light'")
    private String theme = "light";
    @Column(name = "email_reminders_enabled", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 1")
    private boolean emailRemindersEnabled = true;
    @Column(name = "notification_prefs", columnDefinition = "TEXT")
    private String notificationPrefsJson;
    @Column(name = "graduation_year")
    private String graduationYear;
    @Column(name = "linkedin")
    private String linkedin;
    @Column(name = "github")
    private String github;
    @Column(name = "open_to_study_groups", columnDefinition = "TINYINT(1) DEFAULT 0")
    private boolean openToStudyGroups = false;
    @Column(name = "interests", columnDefinition = "TEXT")
    private String interests;

    @Column(name = "report_count", nullable = false, columnDefinition = "INT DEFAULT 0")
    private int reportCount = 0;

    @Column(name = "is_flagged", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 0")
    private boolean flagged = false;

    @Column(name = "flag_reason", columnDefinition = "TEXT")
    private String flagReason;

    @Column(name = "strike_count", nullable = false, columnDefinition = "INT DEFAULT 0")
    private int strikeCount = 0;

    @Column(name = "token_issued_after")
    private LocalDateTime tokenIssuedAfter;

    public User() {}
    public User(String email, String pass) {
        this.email = email;
        this.pass = pass;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPass() { return pass; }
    public void setPass(String pass) { this.pass = pass; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public boolean isVerified() { return verified; }
    public void setVerified(boolean ver) { verified = ver; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public LocalDateTime getTokenExpiration() { return tokenexpiration; }
    public void setTokenExpiration(LocalDateTime tokenexpiration) { this.tokenexpiration = tokenexpiration; }

    public LocalDateTime getCreatedAt() { return createdat; }
    public void setCreatedAt(LocalDateTime createdat) { this.createdat = createdat; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getFaculty() { return faculty; }
    public void setFaculty(String faculty) { this.faculty = faculty; }

    public String getMajor() { return major; }
    public void setMajor(String major) { this.major = major; }

    public String getSecondMajor() { return secondMajor; }
    public void setSecondMajor(String secondMajor) { this.secondMajor = secondMajor; }

    public String getSecondFaculty() { return secondFaculty; }
    public void setSecondFaculty(String secondFaculty) { this.secondFaculty = secondFaculty; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCumGPA() { return cumGPA; }
    public void setCumGPA(String cumGPA) { this.cumGPA = cumGPA; }

    public String getTotalCredits() { return totalCredits; }
    public void setTotalCredits(String totalCredits) { this.totalCredits = totalCredits; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public boolean isDoubleMajor() { return doubleMajor; }
    public void setDoubleMajor(boolean doubleMajor) { this.doubleMajor = doubleMajor; }

    public boolean isMinor() { return minor; }
    public void setMinor(boolean minor) { this.minor = minor; }

    public String getMinorName() { return minorName; }
    public void setMinorName(String minorName) { this.minorName = minorName; }

    public boolean isDoubleMinor() { return doubleMinor; }
    public void setDoubleMinor(boolean doubleMinor) { this.doubleMinor = doubleMinor; }

    public String getSecondMinor() { return secondMinor; }
    public void setSecondMinor(String secondMinor) { this.secondMinor = secondMinor; }

    public boolean isTripleMinor() { return tripleMinor; }
    public void setTripleMinor(boolean tripleMinor) { this.tripleMinor = tripleMinor; }

    public String getThirdMinor() { return thirdMinor; }
    public void setThirdMinor(String thirdMinor) { this.thirdMinor = thirdMinor; }

    public String getCourseColorsJson() { return courseColorsJson; }
    public void setCourseColorsJson(String courseColorsJson) { this.courseColorsJson = courseColorsJson; }

    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }

    public boolean isEmailRemindersEnabled() { return emailRemindersEnabled; }
    public void setEmailRemindersEnabled(boolean emailRemindersEnabled) { this.emailRemindersEnabled = emailRemindersEnabled; }

    public String getNotificationPrefsJson() { return notificationPrefsJson; }
    public void setNotificationPrefsJson(String notificationPrefsJson) { this.notificationPrefsJson = notificationPrefsJson; }

    public String getGraduationYear() { return graduationYear; }
    public void setGraduationYear(String graduationYear) { this.graduationYear = graduationYear; }

    public String getLinkedin() { return linkedin; }
    public void setLinkedin(String linkedin) { this.linkedin = linkedin; }

    public String getGithub() { return github; }
    public void setGithub(String github) { this.github = github; }

    public boolean isOpenToStudyGroups() { return openToStudyGroups; }
    public void setOpenToStudyGroups(boolean openToStudyGroups) { this.openToStudyGroups = openToStudyGroups; }

    public String getInterests() { return interests; }
    public void setInterests(String interests) { this.interests = interests; }

    public int getReportCount() { return reportCount; }
    public void setReportCount(int reportCount) { this.reportCount = reportCount; }

    public boolean isFlagged() { return flagged; }
    public void setFlagged(boolean flagged) { this.flagged = flagged; }

    public String getFlagReason() { return flagReason; }
    public void setFlagReason(String flagReason) { this.flagReason = flagReason; }

    public int getStrikeCount() { return strikeCount; }
    public void setStrikeCount(int strikeCount) { this.strikeCount = strikeCount; }

    public LocalDateTime getTokenIssuedAfter() { return tokenIssuedAfter; }
    public void setTokenIssuedAfter(LocalDateTime tokenIssuedAfter) { this.tokenIssuedAfter = tokenIssuedAfter; }
}
