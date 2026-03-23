package com.koursekit.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "study_group_members")

public class StudyGroupMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "group_id", nullable = false)
    private StudyGroup studyGroup;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private LocalDateTime joinedAt = LocalDateTime.now();

    public enum Role {
        HOST,
        MEMBER
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Role role;

    public StudyGroupMember() {}

    public StudyGroupMember(StudyGroup studyGroup, User user, Role role) {
    this.studyGroup = studyGroup;
    this.user = user;
    this.role = role; }

    public Long getId() {
        return id; }

    public void setId(Long id) {
        this.id = id; }

    public StudyGroup getStudyGroup() {
        return studyGroup; }

    public void setStudyGroup(StudyGroup studyGroup) {
        this.studyGroup = studyGroup; }

    public User getUser() {
        return user; }

    public void setUser(User user) {
        this.user = user; }

    public LocalDateTime getJoinedAt() {
        return joinedAt; }

    public void setJoinedAt(LocalDateTime joinedAt) {
        this.joinedAt = joinedAt; }

    public Role getRole() {
        return role; }

    public void setRole(Role role) {
        this.role = role; }
}

