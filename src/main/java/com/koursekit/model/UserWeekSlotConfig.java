package com.koursekit.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "user_week_slot_config",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "week_start", "semester_name"}))
public class UserWeekSlotConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "week_start", nullable = false)
    private LocalDate weekStart;

    @Column(name = "semester_name")
    private String semesterName;

    public UserWeekSlotConfig() {}

    public UserWeekSlotConfig(Long userId, LocalDate weekStart, String semesterName) {
        this.userId = userId;
        this.weekStart = weekStart;
        this.semesterName = semesterName;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public LocalDate getWeekStart() { return weekStart; }
    public String getSemesterName() { return semesterName; }
}