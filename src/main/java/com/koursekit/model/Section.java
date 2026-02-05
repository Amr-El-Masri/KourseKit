package com.koursekit.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "sections")
@Data
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
}