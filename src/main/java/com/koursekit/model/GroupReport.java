package com.koursekit.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(name = "group_reports")

public class GroupReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "group_id", nullable = false)
    @JsonBackReference
    private StudyGroup studyGroup;

    @ManyToOne
    @JoinColumn(name = "reported_by", nullable = false)
    @JsonIgnore
    private User reportedBy;

    @ManyToOne
    @JoinColumn(name = "reported_user_id", nullable = false)
    @JsonIgnore
    private User reportedUser;

    @ManyToOne
    @JoinColumn(name = "message_id", nullable = true)
    private GroupMessage message;

    @Column(name = "reason", nullable = false, columnDefinition = "TEXT")
    private String reason;

    public enum Status {
        PENDING,
        REVIEWED,
        RESOLVED
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status = Status.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public GroupReport() {}

    public GroupReport(StudyGroup studyGroup, User reportedBy, User reportedUser, String reason) {
        this.studyGroup = studyGroup;
        this.reportedBy = reportedBy;
        this.reportedUser = reportedUser;
        this.reason = reason;
    }

    public GroupReport(StudyGroup studyGroup, User reportedBy, User reportedUser, GroupMessage message, String reason) {
        this.studyGroup = studyGroup;
        this.reportedBy = reportedBy;
        this.reportedUser = reportedUser;
        this.message = message;
        this.reason = reason;
    } //3rd constructor including the message because for message, nullable = true, and also message can be chosen to be included or not (the report could just be done based on disrespectful behavior and not a particular message if ykwim)

    public Long getId() {
        return id; }

    public void setId(Long id) {
        this.id = id; }

    public StudyGroup getStudyGroup() {
        return studyGroup; }

    public void setStudyGroup(StudyGroup studyGroup) {
        this.studyGroup = studyGroup; }

    public User getReportedBy() {
        return reportedBy; }

    public void setReportedBy(User reportedBy) {
        this.reportedBy = reportedBy; }

    public User getReportedUser() {
        return reportedUser; }

    public void setReportedUser(User reportedUser) {
        this.reportedUser = reportedUser; }

    public GroupMessage getMessage() {
        return message; }

    public void setMessage(GroupMessage message) {
        this.message = message; }

    public String getReason() {
        return reason; }

    public void setReason(String reason) {
        this.reason = reason; }

    public Status getStatus() {
        return status; }

    public void setStatus(Status status) {
        this.status = status; }

    public LocalDateTime getCreatedAt() {
        return createdAt; }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt; }
}
