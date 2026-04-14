package com.koursekit.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "user_week_slot_config",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "week_start"}))
public class UserWeekSlotConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "week_start", nullable = false)
    private LocalDate weekStart;

    public UserWeekSlotConfig() {}

    public UserWeekSlotConfig(Long userId, LocalDate weekStart) {
        this.userId = userId;
        this.weekStart = weekStart;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public LocalDate getWeekStart() { return weekStart; }
}