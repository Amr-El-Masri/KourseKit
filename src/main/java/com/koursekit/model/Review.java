package com.koursekit.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userId; // To be linked with your teammate's Auth system

    @ManyToOne
    @JoinColumn(name = "section_id")
    private Section section;

    @Column(columnDefinition = "TEXT")
    private String comment;

    private int rating; // 1 to 5

    @Enumerated(EnumType.STRING)
    private ReviewStatus status = ReviewStatus.APPROVED; // Defaulting to APPROVED for now

    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public Section getSection() { return section; }
    public void setSection(Section section) { this.section = section; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }

    public ReviewStatus getStatus() { return status; }
    public void setStatus(ReviewStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}