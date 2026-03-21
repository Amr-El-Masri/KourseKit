package com.koursekit.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "study_groups")

public class StudyGroup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne
    @JoinColumn(name = "host_id", nullable = false)
    private User host;

    @Column(name = "is_private", nullable = false)
    private boolean isPrivate;

    @Column(name = "invite_code", unique = true, nullable = true)
    private String inviteCode;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "max_members", nullable = false)
    private Integer maxMembers;

    public StudyGroup() {}


    public StudyGroup(String name, Course course, User host, boolean isPrivate, String inviteCode, Integer maxMembers) {
        this.name = name;
        this.course = course;
        this.host = host;
        this.isPrivate = isPrivate;
        this.inviteCode = inviteCode;
        this.maxMembers = maxMembers;
    }


    public Long getId() {
        return id; }


    public void setId(Long id) {
        this.id = id; }


    public String getName() {
        return name; }


    public void setName(String name) {
        this.name = name; }


    public Course getCourse() {
        return course; }


    public void setCourse(Course course) {
        this.course = course; }


    public User getHost() {
        return host; }


    public void setHost(User host) {
        this.host = host; }


    public boolean isPrivate() {
        return isPrivate; }


    public void setPrivate(boolean isPrivate) {
        this.isPrivate = isPrivate; }


    public String getInviteCode() {
        return inviteCode; }


    public void setInviteCode(String inviteCode) {
        this.inviteCode = inviteCode; }


    public LocalDateTime getCreatedAt() {
        return createdAt;}


    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt; }


    public Integer getMaxMembers() {
        return maxMembers; }


    public void setMaxMembers(Integer maxMembers) {
        this.maxMembers = maxMembers; }


}
