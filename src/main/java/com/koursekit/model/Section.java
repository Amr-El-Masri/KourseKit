package com.koursekit.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

@Entity
@Table(name = "sections")
public class Section {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true) //to not save same crn twice
    private String crn;

    private String sectionNumber; // e.g., A1
    private String professorName;

    @ManyToOne
    @JoinColumn(name = "course_id")
    @JsonBackReference // this tells jackson not to start a new loop back to the course from here, aka to stop "looking" at the sections once it has already processed the course, in order to prevent infinite recursion in the json response
    private Course course;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCrn() { return crn; }
    public void setCrn(String crn) { this.crn = crn; }

    public String getSectionNumber() { return sectionNumber; }
    public void setSectionNumber(String sectionNumber) { this.sectionNumber = sectionNumber; }

    public String getProfessorName() { return professorName; }
    public void setProfessorName(String professorName) { this.professorName = professorName; }

    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }
}