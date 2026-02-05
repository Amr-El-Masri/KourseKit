package meme.reviewtool.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
@Data
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
}