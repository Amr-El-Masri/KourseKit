package com.koursekit.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalTime;

@Entity
@Table(name = "default_schedule_slot")
public class DefaultScheduleSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    private String dayKey;       // "MONDAY", "TUESDAY", etc.
    private LocalTime startTime;
    private LocalTime endTime;

    public DefaultScheduleSlot() {}

    public Long getId() { return id; }
    public User getUser() { return user; }
    public String getDayKey() { return dayKey; }
    public LocalTime getStartTime() { return startTime; }
    public LocalTime getEndTime() { return endTime; }

    public void setUser(User user) { this.user = user; }
    public void setDayKey(String dayKey) { this.dayKey = dayKey; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
}