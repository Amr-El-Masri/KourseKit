package com.koursekit.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "saved_courses")
public class SavedCourse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "course_code", nullable = false)
    private String courseCode;

    private String grade;

    private int credits;

    @ManyToOne
    @JoinColumn(name = "semester_id", nullable = false)
    @JsonIgnore
    private SavedSemester semester;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SavedAssessment> assessments = new ArrayList<>();

    public SavedCourse() {}

    public SavedCourse(String courseCode, String grade, int credits, SavedSemester semester) {
        this.courseCode = courseCode;
        this.grade = grade;
        this.credits = credits;
        this.semester = semester;
    }

    public Long getId() { 
        return id; 
    }
    public void setId(Long id) { 
        this.id = id; 
    }

    public String getCourseCode() { 
        return courseCode; 
    }
    public void setCourseCode(String courseCode) { 
        this.courseCode = courseCode; 
    }

    public String getGrade() { 
        return grade; 
    }
    public void setGrade(String grade) { 
        this.grade = grade; 
    }

    public int getCredits() { 
        return credits; 
    }
    public void setCredits(int credits) { 
        this.credits = credits; 
    }

    public SavedSemester getSemester() { 
        return semester; 
    }
    public void setSemester(SavedSemester semester) { 
        this.semester = semester; 
    }

    public List<SavedAssessment> getAssessments() { 
        return assessments; 
    }
    public void setAssessments(List<SavedAssessment> assessments) { 
        this.assessments = assessments; 
    }
}
