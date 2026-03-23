package com.koursekit.model;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

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

    // stores the section in db
    @Column(name = "section_crn")
    private String sectioncrn;

    @Column(name = "component_type")
    private String componentType;

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

    public String getsectioncrn() { return sectioncrn; }
    public void setsectioncrn(String sectioncrn) { this.sectioncrn = sectioncrn; }

    public String getcomponenttype() { return componentType; }
    public void setcomponenttype(String componentType) { this.componentType = componentType; }
}
