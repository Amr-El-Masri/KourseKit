package com.koursekit.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "tasks",
        uniqueConstraints = {@UniqueConstraint(columnNames = {"course", "title", "user_id"})}
)
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_task_user"))
    @JsonIgnore
    private User user;

    private String course;
    private String title;
    private String type;
    private String notes;
    private boolean completed = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Priority priority;

    public enum Priority {
        HIGH,
        MEDIUM,
        LOW
    }

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
    private LocalDateTime deadline;

    public Task(String course, String title, LocalDateTime deadline) {
        this.course = course;
        this.title = title;
        this.deadline = deadline;
    }

    public Task() {
    }

    public static Priority calculatePriority(LocalDateTime deadline) {
        long daysUntilDeadline = ChronoUnit.DAYS.between(LocalDateTime.now(), deadline);
        if (daysUntilDeadline <= 3) return Priority.HIGH;
        if (daysUntilDeadline <= 7) return Priority.MEDIUM;
        return Priority.LOW;
    }

    public void recalculatePriority() {
        this.priority = calculatePriority(this.deadline);
    }

    public void setDeadline(LocalDateTime deadline) { this.deadline = deadline; }
    public void setTitle(String title) { this.title = title; }
    public void setCourse(String course) { this.course = course; }
    public void setPriority(Priority priority) { this.priority = priority; }
    public void setType(String type) { this.type = type; }
    public void setNotes(String notes) { this.notes = notes; }
    public void setCompleted(boolean completed) { this.completed = completed; }
    public void setUserId(Long id) {
        User u = new User();
        u.setId(id);
        this.user = u;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public LocalDateTime getDeadline() { return deadline; }
    public String getCourse() { return course; }
    public Priority getPriority() { return priority; }
    public String getType() { return type; }
    public String getNotes() { return notes; }
    public boolean isCompleted() { return completed; }
    public Long getUserId() { return user.getId(); }

    @Override
    public String toString() {
        return "Course: " + course + " Title " + title + " Deadline: " + deadline + "\n";
    }
}