package com.koursekit.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "user_syllabi",
        uniqueConstraints = {@UniqueConstraint(columnNames = {"user_id", "course_name"})})
public class UserSyllabus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Column(name = "course_name", nullable = false)
    private String courseName;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String data;

    public UserSyllabus() {}

    public UserSyllabus(User user, String courseName, String data) {
        this.user = user;
        this.courseName = courseName;
        this.data = data;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }
    public String getData() { return data; }
    public void setData(String data) { this.data = data; }
}
