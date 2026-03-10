package com.koursekit.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name="Notifications")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String message;

    @JsonFormat(pattern = "dd-MM-yyyy HH:mm")
    private LocalDateTime createdAt;

    private boolean isRead = false;

    @ManyToOne
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    public Notification() {}

    public Notification(Task task, String message, LocalDateTime createdAt) {
        this.task = task;
        this.message = message;
        this.createdAt = createdAt;
        this.isRead = false;
    }

    // getters
    public Long getId() { return id; }
    public Task getTask() { return task; }
    public String getMessage() { return message; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public boolean isRead() { return isRead; }

    // setters
    public void setTask(Task task) { this.task = task; }
    public void setMessage(String message) { this.message = message; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setRead(boolean read) { this.isRead = read; }
}