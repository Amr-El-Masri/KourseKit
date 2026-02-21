package com.koursekit.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name="StudyBlock")
public class StudyBlock{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "studyPlanEntry_id", nullable = false)
    @JsonIgnore
    private StudyPlanEntry studyPlanEntry;

    private LocalDate day;
    private LocalTime startTime;
    private double duration;
    private boolean completed;

    public StudyBlock(){

    }

    public StudyBlock(LocalDate day,LocalTime startTime,double duration, boolean completed ){
        this.day=day;
        this.startTime=startTime;
        this.duration=duration;
        this.completed=completed;
    }

    //getters
    public Long getId() {
        return id;
    }
    public Long getStudyPlanEntryId(){return studyPlanEntry.getId();}

    public StudyPlanEntry getStudyPlanEntry() {
        return studyPlanEntry;
    }

    public LocalDate getDay() {
        return day;
    }
    public LocalTime getStartTime() {
        return startTime;
    }
    public double getDuration() {
        return duration;
    }
    public boolean isCompleted(){return completed;}

    @Transient
    public String getCourse() {
        if (studyPlanEntry != null && studyPlanEntry.getTask() != null) {
            return studyPlanEntry.getTask().getCourse();
        }
        return null;
    }

    //setters
    public void setStudyPlanEntry(StudyPlanEntry entry){this.studyPlanEntry= entry;}
    public void setDay(LocalDate day) {
        this.day = day;
    }
    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }
    public void setDuration(double duration) {
        this.duration = duration;
    }
    public void setCompleted(boolean completed){ this.completed = completed;}


}
