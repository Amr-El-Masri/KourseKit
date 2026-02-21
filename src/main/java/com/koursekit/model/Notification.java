package com.koursekit.model;

import com.koursekit.model.Task;
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

    @ManyToOne
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;



    public Notification(){

    }
    public Notification(Task task , String Message, LocalDateTime createdAt){
        this.task=task;
        this.message =Message;
        this.createdAt=createdAt;
    }
    //getters
    public Long getId() {
        return id;
    }
    public Task getTask() {
        return task;
    }
    public String getMessage() {
        return message;
    }
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    //setters
    public void setTask(Task task) {
        this.task = task;
    }
    public void setMessage(String message) {
        this.message = message;
    }
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

}
