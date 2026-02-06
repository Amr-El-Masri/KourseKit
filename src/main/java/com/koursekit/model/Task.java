package com.koursekit.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;


@Entity
@Table(name = "tasks",
        uniqueConstraints = {@UniqueConstraint(columnNames = {"course", "title"})}
)

public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String course;
    private String title;

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

    @Override
    public String toString(){
        return "Course: "+ course+ " Title "+ title+ " Deadline: "+ deadline +"\n" ;
    }
}


