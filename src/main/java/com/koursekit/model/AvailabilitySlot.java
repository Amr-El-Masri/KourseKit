package com.koursekit.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalTime;

@Entity
@Table(name = "AvailabilitySlot")
public class AvailabilitySlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    private String dayKey;   // e.g. "MONDAY", "TUESDAY"
    private LocalTime startTime;
    private LocalTime endTime;

    public AvailabilitySlot() {}

    // Getters
    public Long getId() { return id; }
    public User getUser() { return user; }
    public String getDayKey() { return dayKey; }
    public LocalTime getStartTime() { return startTime; }
    public LocalTime getEndTime() { return endTime; }

    // Setters
    public void setUser(User user) { this.user = user; }
    public void setDayKey(String dayKey) { this.dayKey = dayKey; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
}