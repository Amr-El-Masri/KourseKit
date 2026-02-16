package com.koursekit.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "saved_assessments")
public class SavedAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private double grade;

    private double weight;

    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    @JsonIgnore
    private SavedCourse course;

    public SavedAssessment() {}

    public SavedAssessment(String name, double grade, double weight, SavedCourse course) {
        this.name = name;
        this.grade = grade;
        this.weight = weight;
        this.course = course;
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

    public double getGrade() { 
        return grade; 
    }
    public void setGrade(double grade) { 
        this.grade = grade; 
    }

    public double getWeight() { 
        return weight; 
    }
    public void setWeight(double weight) { 
        this.weight = weight; 
    }

    public SavedCourse getCourse() { 
        return course; 
    }
    public void setCourse(SavedCourse course) { 
        this.course = course; 
    }
}
