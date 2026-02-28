package com.koursekit.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "saved_semesters")
public class SavedSemester {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToMany(mappedBy = "semester", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SavedCourse> courses = new ArrayList<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "is_template", nullable = false)
    private boolean isTemplate = false;

    public SavedSemester() {}

    public SavedSemester(String name, User user) {
        this.name = name;
        this.user = user;
    }

    public Long getId() { 
        return id;
    }
    public void setId(Long id) { 
        this.id = id; 
    }

    public String getName() { 
        return name; 
    }
    public void setName(String name) { 
        this.name = name; 
    }

    public User getUser() { 
        return user; 
    }
    public void setUser(User user) { 
        this.user = user; 
    }

    public List<SavedCourse> getCourses() { 
        return courses; 
    }
    public void setCourses(List<SavedCourse> courses) { 
        this.courses = courses; 
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
     }
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isTemplate() {
        return isTemplate;
    }
    public void setTemplate(boolean isTemplate) {
        this.isTemplate = isTemplate;
    }
}
