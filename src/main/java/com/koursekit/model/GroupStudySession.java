package com.koursekit.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "group_study_sessions")
public class GroupStudySession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "group_id", nullable = false)
    @JsonBackReference
    private StudyGroup studyGroup;

    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private double duration;
    private boolean completed;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    @JsonIgnore
    private User createdBy;

    @Column(name = "is_synced", nullable = false) //if the study group session is synced to study planner or not
    private boolean isSynced = false;

    public GroupStudySession() {}

    public GroupStudySession(StudyGroup studyGroup, User createdBy, LocalDate date, LocalTime startTime, double duration, LocalTime endTime) {
        this.studyGroup = studyGroup;
        this.createdBy = createdBy;
        this.date = date;
        this.startTime = startTime;
        this.duration = duration;
        this.endTime = startTime.plusMinutes((long)duration*60);
    }

    public Long getId() {
        return id; }

    public void setId(Long id) {
        this.id = id; }

    public StudyGroup getStudyGroup() {
        return studyGroup; }

    public void setStudyGroup(StudyGroup studyGroup) {
        this.studyGroup = studyGroup; }

    public LocalDate getDate() {
        return date; }

    public void setDate(LocalDate date) {
        this.date = date; }

    public LocalTime getStartTime() {
        return startTime; }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime; }

    public LocalTime getEndTime() {
        return endTime; }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime; }

    public double getDuration() {
        return duration; }

    public void setDuration(double duration) {
        this.duration = duration; }

    public boolean isCompleted() {
        return completed; }

    public void setCompleted(boolean completed) {
        this.completed = completed; }

    public User getCreatedBy() {
        return createdBy; }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy; }

    public boolean isSynced() {
        return isSynced; }

    public void setSynced(boolean isSynced) {
        this.isSynced = isSynced; }
}
