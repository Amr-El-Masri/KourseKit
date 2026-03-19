package com.koursekit.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_transcript_info")
public class UserTranscriptInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @JsonIgnore
    private User user;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;

    @Column(name = "semester_count")
    private int semesterCount;

    @Column(name = "course_count")
    private int courseCount;

    @Column(name = "sem_ids", columnDefinition = "TEXT")
    private String semIds; // JSON array of semester IDs

    public UserTranscriptInfo() {}

    public UserTranscriptInfo(User user, LocalDateTime uploadedAt, int semesterCount, int courseCount, String semIds) {
        this.user = user;
        this.uploadedAt = uploadedAt;
        this.semesterCount = semesterCount;
        this.courseCount = courseCount;
        this.semIds = semIds;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }
    public int getSemesterCount() { return semesterCount; }
    public void setSemesterCount(int semesterCount) { this.semesterCount = semesterCount; }
    public int getCourseCount() { return courseCount; }
    public void setCourseCount(int courseCount) { this.courseCount = courseCount; }
    public String getSemIds() { return semIds; }
    public void setSemIds(String semIds) { this.semIds = semIds; }
}
