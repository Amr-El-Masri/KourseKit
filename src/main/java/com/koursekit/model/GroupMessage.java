package com.koursekit.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(name = "group_messages")
public class GroupMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "group_id", nullable = false)
    @JsonBackReference
    private StudyGroup studyGroup;

    @ManyToOne
    @JoinColumn(name = "sender_id", nullable = false)
    @JsonIgnore
    private User sender;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "sent_at", nullable = false, updatable = false)
    private LocalDateTime sentAt = LocalDateTime.now();

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @Column(name = "reactions_json", columnDefinition = "TEXT")
    private String reactionsJson = "{}";

    public GroupMessage() {}

    public GroupMessage(StudyGroup studyGroup, User sender, String content) {
        this.studyGroup = studyGroup;
        this.sender = sender;
        this.content = content;
    }

    public Long getId() {
        return id; }

    public void setId(Long id) {
        this.id = id; }

    public StudyGroup getStudyGroup() {
        return studyGroup; }

    public void setStudyGroup(StudyGroup studyGroup) {
        this.studyGroup = studyGroup; }

    public User getSender() {
        return sender; }

    public void setSender(User sender) {
        this.sender = sender; }

    public String getContent() {
        return content; }

    public void setContent(String content) {
        this.content = content; }

    public LocalDateTime getSentAt() {
        return sentAt; }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt; }

    public Boolean getIsRead() {
        return isRead; }

    public void setIsRead(Boolean isRead) {
        this.isRead = isRead; }

    public Boolean getIsDeleted() {
        return isDeleted; }

    public void setIsDeleted(Boolean isDeleted) {
        this.isDeleted = isDeleted; }

    public String getReactionsJson() { 
        return reactionsJson; }
        
    public void setReactionsJson(String reactionsJson) { 
        this.reactionsJson = reactionsJson; }
}
