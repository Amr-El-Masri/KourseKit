package com.koursekit.model;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

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

    @Column(name = "iv", columnDefinition = "TEXT")
    private String iv;

    @Column(name = "encrypted_keys", columnDefinition = "TEXT")
    private String encryptedKeys;

    @Column(name = "sent_at", nullable = false, updatable = false)
    private LocalDateTime sentAt = LocalDateTime.now();

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @Column(name = "reactions_json", columnDefinition = "TEXT")
    private String reactionsJson = "{}";

    @Column(name = "attachment_url", columnDefinition = "TEXT")
    private String attachmentUrl;

    @Column(name = "attachment_type")
    private String attachmentType; 

    @Column(name = "attachment_name")
    private String attachmentName;

    @Column(name = "attachment_size")
    private Long attachmentSize;
    @Column(name = "pinned", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean pinned = false;

    @Column(name = "is_system", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean isSystem = false;

    @Column(name = "pinned_at")
    private java.time.LocalDateTime pinnedAt;

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

    public String getIv() { 
        return iv; }

    public void setIv(String iv) { 
        this.iv = iv; }

    public String getEncryptedKeys() { 
        return encryptedKeys; }

    public void setEncryptedKeys(String encryptedKeys) { 
        this.encryptedKeys = encryptedKeys; }

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

    public String getAttachmentUrl() { 
        return attachmentUrl; }
    
    public void setAttachmentUrl(String attachmentUrl) { 
        this.attachmentUrl = attachmentUrl; }

    public String getAttachmentType() { 
        return attachmentType; }

    public void setAttachmentType(String attachmentType) { 
        this.attachmentType = attachmentType; }

    public String getAttachmentName() { 
        return attachmentName; }

    public void setAttachmentName(String attachmentName) { 
        this.attachmentName = attachmentName; }

    public Long getAttachmentSize() { 
        return attachmentSize; }

    public void setAttachmentSize(Long attachmentSize) { 
        this.attachmentSize = attachmentSize; }
    public Boolean getPinned() { return pinned != null && pinned; }
    public void setPinned(Boolean pinned) { this.pinned = pinned; }

    public java.time.LocalDateTime getPinnedAt() { return pinnedAt; }
    public void setPinnedAt(java.time.LocalDateTime pinnedAt) { this.pinnedAt = pinnedAt; }

    public Boolean getIsSystem() { return isSystem != null && isSystem; }
    public void setIsSystem(Boolean isSystem) { this.isSystem = isSystem; }
}
