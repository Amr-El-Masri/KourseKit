package com.koursekit.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "AvailabilitySlot", indexes = @Index(name = "idx_availslot_user_id", columnList = "user_id"))
public class AvailabilitySlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    private String dayKey;
    private LocalTime startTime;
    private LocalTime endTime;
    private LocalDate weekStart;    // which week this slot belongs to
    private String semesterName;    // which semester's default this was seeded from

    public AvailabilitySlot() {}

    // Getters
    public Long getId() { return id; }
    public User getUser() { return user; }
    public String getDayKey() { return dayKey; }
    public LocalTime getStartTime() { return startTime; }
    public LocalTime getEndTime() { return endTime; }
    public LocalDate getWeekStart() { return weekStart; }
    public String getSemesterName() { return semesterName; }

    // Setters
    public void setUser(User user) { this.user = user; }
    public void setDayKey(String dayKey) { this.dayKey = dayKey; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
    public void setWeekStart(LocalDate weekStart) { this.weekStart = weekStart; }
    public void setSemesterName(String semesterName) { this.semesterName = semesterName; }
}