package com.koursekit.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "forum_posts")
public class ForumPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userId;        // email of the author
    private String displayName;   // name shown on the forum

    @Column(columnDefinition = "TEXT")
    private String title;

    @Column(columnDefinition = "TEXT")
    private String body;

    // Category: "COURSE", "PROFESSOR", "GENERAL"
    private String category;

    // Optional tags — store the name directly (e.g. "CMPS 271" or "Tamer Tlas")
    private String courseTag;
    private String professorTag;

    private int relateCount = 0;  //like "liking a post"

    private int commentCount = 0;

    @Enumerated(EnumType.STRING)
    private ReviewStatus status = ReviewStatus.APPROVED;

    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getCourseTag() { return courseTag; }
    public void setCourseTag(String courseTag) { this.courseTag = courseTag; }

    public String getProfessorTag() { return professorTag; }
    public void setProfessorTag(String professorTag) { this.professorTag = professorTag; }

    public int getRelateCount() { return relateCount; }
    public void setRelateCount(int relateCount) { this.relateCount = relateCount; }

    public ReviewStatus getStatus() { return status; }
    public void setStatus(ReviewStatus status) { this.status = status; }

    public int getCommentCount() { return commentCount; }
    public void setCommentCount(int commentCount) { this.commentCount = commentCount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}