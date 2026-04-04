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

    private Integer creditHours;
    private String college;
    private Integer seatsAvailable;
    private Integer actualEnrolment;
    private String beginTime1;
    private String endTime1;
    private String building1;
    private String room1;
    private String days1;        // ex: "M W" or "T R"
    private String beginTime2;   // second schedule slot if exists
    private String endTime2;
    private String building2;
    private String room2;
    private String days2;

    private String sectionType;
    private String linkedCrns;

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

    public Integer getCreditHours() { return creditHours; }
    public void setCreditHours(Integer creditHours) { this.creditHours = creditHours; }

    public String getCollege() { return college; }
    public void setCollege(String college) { this.college = college; }

    public Integer getSeatsAvailable() { return seatsAvailable; }
    public void setSeatsAvailable(Integer seatsAvailable) { this.seatsAvailable = seatsAvailable; }

    public Integer getActualEnrolment() { return actualEnrolment; }
    public void setActualEnrolment(Integer actualEnrolment) { this.actualEnrolment = actualEnrolment; }

    public String getBeginTime1() { return beginTime1; }
    public void setBeginTime1(String beginTime1) { this.beginTime1 = beginTime1; }

    public String getEndTime1() { return endTime1; }
    public void setEndTime1(String endTime1) { this.endTime1 = endTime1; }

    public String getBuilding1() { return building1; }
    public void setBuilding1(String building1) { this.building1 = building1; }

    public String getRoom1() { return room1; }
    public void setRoom1(String room1) { this.room1 = room1; }

    public String getDays1() { return days1; }
    public void setDays1(String days1) { this.days1 = days1; }

    public String getBeginTime2() { return beginTime2; }
    public void setBeginTime2(String beginTime2) { this.beginTime2 = beginTime2; }

    public String getEndTime2() { return endTime2; }
    public void setEndTime2(String endTime2) { this.endTime2 = endTime2; }

    public String getBuilding2() { return building2; }
    public void setBuilding2(String building2) { this.building2 = building2; }

    public String getRoom2() { return room2; }
    public void setRoom2(String room2) { this.room2 = room2; }

    public String getDays2() { return days2; }
    public void setDays2(String days2) { this.days2 = days2; }

    public String getSectionType() { return sectionType; }
    public void setSectionType(String sectionType) { this.sectionType = sectionType; }

    public String getLinkedCrns() { return linkedCrns; }
    public void setLinkedCrns(String linkedCrns) { this.linkedCrns = linkedCrns; }
}