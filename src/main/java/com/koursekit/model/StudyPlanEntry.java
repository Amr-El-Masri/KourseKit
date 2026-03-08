package com.koursekit.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name="StudyPlanEntry")
public class StudyPlanEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_entry_user"))
    @JsonIgnore
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "task_id", nullable = false, foreignKey = @ForeignKey(name = "fk_entry_task"))
    private Task task;

    private double estimatedWorkload;
    private double completedHours;
    private LocalDate weekStart; // which week this entry belongs to

    @OneToMany(mappedBy = "studyPlanEntry", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<StudyBlock> assignedBlocks;

    public StudyPlanEntry() {
        this.assignedBlocks = new ArrayList<>();
    }

    public StudyPlanEntry(double estimatedWorkload, double completedHours) {
        this.estimatedWorkload = estimatedWorkload;
        this.completedHours = completedHours;
        assignedBlocks = new ArrayList<>();
    }

    // Getters
    public Long getId() { return id; }
    public Task getTask() { return task; }
    public double getEstimatedWorkload() { return estimatedWorkload; }
    public double getCompletedHours() { return completedHours; }
    public List<StudyBlock> getAssignedBlocks() { return assignedBlocks; }
    public LocalDate getWeekStart() { return weekStart; }

    // Setters
    public void setTask(Task task) { this.task = task; }
    public void setEstimatedWorkload(double estimatedWorkload) { this.estimatedWorkload = estimatedWorkload; }
    public void setCompletedHours(double completedHours) { this.completedHours = completedHours; }
    public void setAssignedBlocks(List<StudyBlock> assignedBlocks) { this.assignedBlocks = assignedBlocks; }
    public void setUser(User user) { this.user = user; }
    public void setWeekStart(LocalDate weekStart) { this.weekStart = weekStart; }
}