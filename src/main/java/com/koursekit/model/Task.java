package com.koursekit.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;


@Entity
@Table(name = "tasks",
        uniqueConstraints = {@UniqueConstraint(columnNames = {"course", "title","user_id"})}
)

public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_entry_user"))
    @JsonIgnore
    private User user;


    private String course;
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Priority priority;

    public enum Priority {
        HIGH,   // deadline within 3 days
        MEDIUM, // deadline within 7 days
        LOW     // deadline beyond 7 days
    }

    @JsonFormat(pattern = "dd-MM-yyyy HH:mm")  // day-month-year hours:minutes
    private LocalDateTime deadline;

    //constructor
    public Task(String course, String title, LocalDateTime deadline) {
        this.course = course;
        this.title = title;
        this.deadline = deadline;
    }

    // no arg constructor
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

    // setters
    public void setDeadline(LocalDateTime deadline) {
        this.deadline = deadline;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setCourse(String course) {
        this.course = course;
    }

    public void setPriority(Priority priority) {
        this.priority = priority;
    }
    public void setUserId(Long id){
        User u = new User();
        u.setId(id);
        this.user = u;
    }


    //getters
    public String getTitle() {
        return title;
    }

    public LocalDateTime getDeadline() {
        return deadline;
    }

    public String getCourse() {
        return course;
    }

    public Long getId() {
        return id;
    }

    public Priority getPriority() { return priority; }

    public Long getUserId(){
        return user.getId();
    }



    @Override
    public String toString(){
        return "Course: "+ course+ " Title "+ title+ " Deadline: "+ deadline +"\n" ;
    }
}


